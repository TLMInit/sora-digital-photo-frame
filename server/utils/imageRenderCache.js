const path = require('path');
const fs = require('fs-extra');
const sharp = require('sharp');
const crypto = require('crypto');

const RENDER_CACHE_DIR = '.render-cache';
const DEFAULT_QUALITY_WEBP = 85;
const DEFAULT_QUALITY_JPEG = 90;

class ImageRenderCache {
  constructor() {
    this.uploadsDir = path.join(__dirname, '..', 'uploads');
  }

  /**
   * Build a cache key from render parameters.
   * Includes mtime so cache auto-invalidates when original changes.
   */
  buildCacheKey(relativePath, width, height, fit, format, quality, mtimeMs) {
    const hash = crypto.createHash('md5')
      .update(`${relativePath}:${mtimeMs}:${width}x${height}:${fit}:${format}:${quality}`)
      .digest('hex');
    return hash;
  }

  /**
   * Get the absolute path for a cached render.
   */
  getCachePath(cacheKey, width, height, fit, format) {
    const subDir = `${width}x${height}`;
    return path.join(this.uploadsDir, RENDER_CACHE_DIR, subDir, fit, `${cacheKey}.${format}`);
  }

  /**
   * Render an image to the target resolution, using disk cache.
   * Returns { cachePath, format, contentType, fromCache } or null on error.
   *
   * @param {string} relativePath - image path relative to uploadsDir
   * @param {object} opts
   * @param {number} opts.width - target width
   * @param {number} opts.height - target height
   * @param {string} [opts.fit='contain'] - 'contain' or 'cover'
   * @param {string} [opts.format='webp'] - 'webp' or 'jpeg'
   * @param {number} [opts.quality] - output quality (default per format)
   */
  async render(relativePath, opts) {
    const {
      width,
      height,
      fit = 'contain',
      format = 'webp',
      quality = format === 'webp' ? DEFAULT_QUALITY_WEBP : DEFAULT_QUALITY_JPEG
    } = opts;

    const sourcePath = path.join(this.uploadsDir, relativePath);

    // Verify source exists
    if (!await fs.pathExists(sourcePath)) {
      return null;
    }

    // Get source mtime for cache invalidation
    const stat = await fs.stat(sourcePath);
    const mtimeMs = Math.floor(stat.mtimeMs);

    const cacheKey = this.buildCacheKey(relativePath, width, height, fit, format, quality, mtimeMs);
    const cachePath = this.getCachePath(cacheKey, width, height, fit, format);

    // Check cache
    if (await fs.pathExists(cachePath)) {
      return {
        cachePath,
        format,
        contentType: format === 'webp' ? 'image/webp' : 'image/jpeg',
        fromCache: true,
        mtimeMs
      };
    }

    // Render
    try {
      await fs.ensureDir(path.dirname(cachePath));

      let pipeline = sharp(sourcePath)
        .rotate(); // auto-rotate based on EXIF

      // Resize with the requested fit mode
      // 'contain' = fit inside (no crop, aspect preserved)
      // 'cover' = cover entire area (may crop, aspect preserved)
      const sharpFit = fit === 'cover' ? 'cover' : 'inside';
      pipeline = pipeline.resize(width, height, {
        fit: sharpFit,
        withoutEnlargement: true
      });

      // Encode
      if (format === 'webp') {
        pipeline = pipeline.webp({ quality, effort: 4 });
      } else {
        pipeline = pipeline.jpeg({ quality, mozjpeg: true });
      }

      await pipeline.toFile(cachePath);

      return {
        cachePath,
        format,
        contentType: format === 'webp' ? 'image/webp' : 'image/jpeg',
        fromCache: false,
        mtimeMs
      };
    } catch (error) {
      console.error(`Failed to render ${relativePath} at ${width}x${height}:`, error.message);
      return null;
    }
  }

  /**
   * Delete all cached renders for a given source image.
   */
  async deleteCacheForImage(relativePath) {
    const cacheRoot = path.join(this.uploadsDir, RENDER_CACHE_DIR);
    try {
      if (!await fs.pathExists(cacheRoot)) return;
      // Walk all resolution dirs and delete matching cache files
      // Since cache keys are hashed, we'd need to walk. For simplicity,
      // we don't track individual files; the mtime-based key ensures stale
      // renders are never served. Old cache entries can be cleaned up separately.
    } catch {
      // ignore
    }
  }

  /**
   * Get cache stats (for admin info).
   */
  async getCacheStats() {
    const cacheRoot = path.join(this.uploadsDir, RENDER_CACHE_DIR);
    let totalFiles = 0;
    let totalSize = 0;

    try {
      if (!await fs.pathExists(cacheRoot)) {
        return { totalFiles: 0, totalSize: 0, totalSizeMB: '0.00' };
      }

      const walk = async (dir) => {
        const items = await fs.readdir(dir, { withFileTypes: true });
        for (const item of items) {
          const fullPath = path.join(dir, item.name);
          if (item.isDirectory()) {
            await walk(fullPath);
          } else if (item.isFile()) {
            totalFiles++;
            const stat = await fs.stat(fullPath);
            totalSize += stat.size;
          }
        }
      };

      await walk(cacheRoot);
    } catch {
      // ignore
    }

    return {
      totalFiles,
      totalSize,
      totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2)
    };
  }

  /**
   * Clear entire render cache.
   */
  async clearCache() {
    const cacheRoot = path.join(this.uploadsDir, RENDER_CACHE_DIR);
    try {
      await fs.remove(cacheRoot);
    } catch {
      // ignore
    }
  }
}

module.exports = new ImageRenderCache();
