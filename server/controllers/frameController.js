const path = require('path');
const fs = require('fs-extra');
const { isPathSafe } = require('../utils/pathValidator');
const imageRenderCache = require('../utils/imageRenderCache');

const DEVICES_FILE = path.join(__dirname, '..', 'data', 'devices.json');

class FrameController {
  constructor() {
    this.uploadsDir = path.join(__dirname, '..', 'uploads');
  }

  /**
   * Load devices from file.
   */
  async loadDevices() {
    try {
      if (await fs.pathExists(DEVICES_FILE)) {
        return await fs.readJson(DEVICES_FILE);
      }
    } catch {
      // ignore
    }
    return {};
  }

  /**
   * Save devices to file.
   */
  async saveDevices(devices) {
    await fs.ensureDir(path.dirname(DEVICES_FILE));
    await fs.writeJson(DEVICES_FILE, devices, { spaces: 2 });
  }

  /**
   * GET /api/frame/render
   * Renders an image for display at a target resolution.
   *
   * Query params:
   *   path (required) - relative image path under uploads/
   *   w (optional) - target width (default 1920)
   *   h (optional) - target height (default 1080)
   *   deviceId (optional) - look up device settings for resolution
   *   fit (optional) - 'contain' (default) or 'cover'
   *   format (optional) - 'webp' (default) or 'jpeg'
   *   q (optional) - quality (default per format)
   */
  async renderImage(req, res) {
    try {
      // Require session authentication (same as /uploads/ static serving)
      if (!req.session || (!req.session.authenticated && !req.session.accessAccount)) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const imagePath = req.query.path;
      if (!imagePath) {
        return res.status(400).json({ error: 'Missing required parameter: path' });
      }

      // Security: validate the path stays under uploads
      // The path should be relative to uploads, e.g. "family/photo.jpg"
      // Construct a full path starting with "uploads/" for validation
      const fullRelative = imagePath.startsWith('uploads/') ? imagePath : `uploads/${imagePath}`;
      if (!isPathSafe(fullRelative)) {
        return res.status(400).json({ error: 'Invalid path' });
      }

      // Strip "uploads/" prefix if present for the render cache
      const relativePath = imagePath.startsWith('uploads/')
        ? imagePath.slice('uploads/'.length)
        : imagePath;

      // Resolve device settings if deviceId provided
      let width = parseInt(req.query.w) || 0;
      let height = parseInt(req.query.h) || 0;
      let fit = req.query.fit || 'contain';
      let format = req.query.format || 'webp';
      let quality = parseInt(req.query.q) || 0;

      if (req.query.deviceId) {
        const devices = await this.loadDevices();
        const device = devices[req.query.deviceId];
        if (device) {
          if (!width) width = device.displayWidth || 1920;
          if (!height) height = device.displayHeight || 1080;
          if (!req.query.fit && device.fitMode) fit = device.fitMode;
          if (!req.query.format && device.format) format = device.format;
          // Apply render scale
          const scale = device.renderScale || 1.0;
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }
      }

      // Defaults
      if (!width) width = 1920;
      if (!height) height = 1080;

      // Validate parameters
      width = Math.min(Math.max(width, 100), 7680); // 100px to 8K
      height = Math.min(Math.max(height, 100), 4320);
      fit = ['contain', 'cover'].includes(fit) ? fit : 'contain';
      format = ['webp', 'jpeg'].includes(format) ? format : 'webp';
      if (quality < 1 || quality > 100) quality = 0; // let render cache use defaults

      const opts = { width, height, fit, format };
      if (quality) opts.quality = quality;

      const result = await imageRenderCache.render(relativePath, opts);

      if (!result) {
        return res.status(404).json({ error: 'Image not found or failed to render' });
      }

      // Serve the rendered image with aggressive caching
      res.set({
        'Content-Type': result.contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Render-Cache': result.fromCache ? 'HIT' : 'MISS'
      });
      return res.sendFile(result.cachePath);
    } catch (error) {
      console.error('Error rendering image:', error);
      return res.status(500).json({ error: 'Server error' });
    }
  }

  /**
   * GET /api/frame/device/:deviceId
   * Get device configuration.
   */
  async getDevice(req, res) {
    try {
      const { deviceId } = req.params;
      const devices = await this.loadDevices();
      const device = devices[deviceId];

      if (!device) {
        return res.status(404).json({ error: 'Device not found' });
      }

      res.json({ deviceId, ...device });
    } catch (error) {
      console.error('Error getting device:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }

  /**
   * PUT /api/frame/device/:deviceId
   * Create or update device configuration.
   */
  async saveDevice(req, res) {
    try {
      const { deviceId } = req.params;
      const { displayWidth, displayHeight, renderScale, fitMode, format } = req.body;

      if (!displayWidth || !displayHeight) {
        return res.status(400).json({ error: 'displayWidth and displayHeight are required' });
      }

      const devices = await this.loadDevices();
      devices[deviceId] = {
        displayWidth: Math.min(Math.max(parseInt(displayWidth) || 1920, 100), 7680),
        displayHeight: Math.min(Math.max(parseInt(displayHeight) || 1080, 100), 4320),
        renderScale: Math.min(Math.max(parseFloat(renderScale) || 1.0, 0.5), 2.0),
        fitMode: ['contain', 'cover'].includes(fitMode) ? fitMode : 'contain',
        format: ['webp', 'jpeg'].includes(format) ? format : 'webp',
        updatedAt: new Date().toISOString()
      };

      await this.saveDevices(devices);
      res.json({ message: 'Device settings saved', deviceId, ...devices[deviceId] });
    } catch (error) {
      console.error('Error saving device:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }

  /**
   * GET /api/frame/devices
   * List all device configurations (admin only).
   */
  async listDevices(req, res) {
    try {
      const devices = await this.loadDevices();
      res.json(devices);
    } catch (error) {
      console.error('Error listing devices:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }

  /**
   * DELETE /api/frame/device/:deviceId
   * Delete device configuration (admin only).
   */
  async deleteDevice(req, res) {
    try {
      const { deviceId } = req.params;
      const devices = await this.loadDevices();

      if (!devices[deviceId]) {
        return res.status(404).json({ error: 'Device not found' });
      }

      delete devices[deviceId];
      await this.saveDevices(devices);
      res.json({ message: 'Device deleted', deviceId });
    } catch (error) {
      console.error('Error deleting device:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }

  /**
   * GET /api/frame/cache/stats
   * Get render cache statistics (admin only).
   */
  async getCacheStats(req, res) {
    try {
      const stats = await imageRenderCache.getCacheStats();
      res.json(stats);
    } catch (error) {
      console.error('Error getting cache stats:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }

  /**
   * DELETE /api/frame/cache
   * Clear render cache (admin only).
   */
  async clearCache(req, res) {
    try {
      await imageRenderCache.clearCache();
      res.json({ message: 'Render cache cleared' });
    } catch (error) {
      console.error('Error clearing cache:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
}

module.exports = new FrameController();
