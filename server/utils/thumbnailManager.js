const path = require('path');
const fs = require('fs-extra');
const sharp = require('sharp');

const THUMB_DIR = '.thumbs';
const THUMB_MAX_DIM = 320;
const THUMB_QUALITY = 75;

class ThumbnailManager {
  constructor() {
    this.uploadsDir = path.join(__dirname, '..', 'uploads');
  }

  /**
   * Get the absolute path for a thumbnail given a relative image path.
   * E.g. "family/photo1.jpg" → "<uploadsDir>/.thumbs/family/photo1.jpg"
   */
  getThumbPath(relativePath) {
    // Always store as .jpg
    const parsed = path.parse(relativePath);
    const thumbRelative = path.join(parsed.dir, parsed.name + '.jpg');
    return path.join(this.uploadsDir, THUMB_DIR, thumbRelative);
  }

  /**
   * Get the URL-safe thumbnail path for use in HTTP responses.
   * Returns a URL like "/uploads/.thumbs/family/photo1.jpg?v=1234567890"
   */
  async getThumbnailUrl(relativePath) {
    const thumbPath = this.getThumbPath(relativePath);
    try {
      const stat = await fs.stat(thumbPath);
      const mtime = Math.floor(stat.mtimeMs);
      const parsed = path.parse(relativePath);
      const thumbRelative = path.join(parsed.dir, parsed.name + '.jpg');
      return `/uploads/${THUMB_DIR}/${thumbRelative.split(path.sep).join('/')}?v=${mtime}`;
    } catch {
      return null;
    }
  }

  /**
   * Ensure a thumbnail exists for the given image. Generate if missing.
   * @param {string} relativePath - path relative to uploadsDir, e.g. "family/photo1.jpg"
   * @returns {string|null} thumbnail URL or null on failure
   */
  async ensureThumbnail(relativePath) {
    const thumbPath = this.getThumbPath(relativePath);
    const sourcePath = path.join(this.uploadsDir, relativePath);

    // If thumbnail already exists, return its URL
    if (await fs.pathExists(thumbPath)) {
      return this.getThumbnailUrl(relativePath);
    }

    // Generate the thumbnail
    try {
      await fs.ensureDir(path.dirname(thumbPath));
      await sharp(sourcePath)
        .resize(THUMB_MAX_DIM, THUMB_MAX_DIM, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: THUMB_QUALITY })
        .rotate() // auto-rotate based on EXIF
        .toFile(thumbPath);
      return this.getThumbnailUrl(relativePath);
    } catch (error) {
      console.error(`Failed to generate thumbnail for ${relativePath}:`, error.message);
      return null;
    }
  }

  /**
   * Generate a thumbnail from a buffer (useful during upload/import when file is still in memory).
   * @param {string} relativePath - destination relative path for the image
   * @param {string} sourcePath - absolute path to the source image on disk
   */
  async generateThumbnail(relativePath, sourcePath) {
    const thumbPath = this.getThumbPath(relativePath);
    try {
      await fs.ensureDir(path.dirname(thumbPath));
      await sharp(sourcePath)
        .resize(THUMB_MAX_DIM, THUMB_MAX_DIM, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: THUMB_QUALITY })
        .rotate()
        .toFile(thumbPath);
    } catch (error) {
      console.error(`Failed to generate thumbnail for ${relativePath}:`, error.message);
    }
  }

  /**
   * Delete the thumbnail for a given image.
   */
  async deleteThumbnail(relativePath) {
    const thumbPath = this.getThumbPath(relativePath);
    try {
      await fs.remove(thumbPath);
    } catch {
      // ignore - thumbnail may not exist
    }
  }

  /**
   * Move a thumbnail when its source image is moved.
   */
  async moveThumbnail(oldRelativePath, newRelativePath) {
    const oldThumbPath = this.getThumbPath(oldRelativePath);
    const newThumbPath = this.getThumbPath(newRelativePath);
    try {
      if (await fs.pathExists(oldThumbPath)) {
        await fs.ensureDir(path.dirname(newThumbPath));
        await fs.move(oldThumbPath, newThumbPath, { overwrite: true });
      }
    } catch {
      // ignore - will be regenerated on demand
    }
  }

  /**
   * Generate thumbnails for all images under a directory (backfill).
   * @param {string} dir - absolute path to scan
   * @returns {{ generated: number, skipped: number, failed: number }}
   */
  async backfillThumbnails(dir = this.uploadsDir) {
    const stats = { generated: 0, skipped: 0, failed: 0 };
    try {
      const items = await fs.readdir(dir, { withFileTypes: true });
      for (const item of items) {
        if (item.name === THUMB_DIR) continue;
        const fullPath = path.join(dir, item.name);
        if (item.isDirectory()) {
          const sub = await this.backfillThumbnails(fullPath);
          stats.generated += sub.generated;
          stats.skipped += sub.skipped;
          stats.failed += sub.failed;
        } else if (item.isFile() && /\.(jpg|jpeg|png|gif|webp)$/i.test(item.name)) {
          const relativePath = path.relative(this.uploadsDir, fullPath);
          const thumbPath = this.getThumbPath(relativePath);
          if (await fs.pathExists(thumbPath)) {
            stats.skipped++;
          } else {
            try {
              await this.generateThumbnail(relativePath, fullPath);
              stats.generated++;
            } catch {
              stats.failed++;
            }
          }
        }
      }
    } catch (error) {
      console.error('Error during thumbnail backfill:', error.message);
    }
    return stats;
  }
}

module.exports = new ThumbnailManager();
