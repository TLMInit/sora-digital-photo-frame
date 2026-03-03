const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const { isPathSafe } = require('../utils/pathValidator');

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = req.body.path || 'uploads';
    const serverRoot = path.join(__dirname, '..');
    const fullPath = path.resolve(path.join(serverRoot, uploadPath));

    // Validate path stays within server root
    if (!isPathSafe(uploadPath)) {
      return cb(new Error('Invalid upload path'));
    }

    fs.ensureDirSync(fullPath);
    cb(null, fullPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const uploadMiddleware = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // Default 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'));
    }
  }
});

/**
 * Wraps multer upload to return structured error responses.
 * @param {string} fieldName - The form field name for files
 * @returns {Function} Express middleware
 */
function handleUpload(fieldName) {
  return (req, res, next) => {
    const multerUpload = uploadMiddleware.array(fieldName);
    multerUpload(req, res, (err) => {
      if (!err) return next();

      // Handle multer-specific errors
      if (err instanceof multer.MulterError) {
        let code = 'MULTER_ERROR';
        let message = err.message;

        if (err.code === 'LIMIT_FILE_SIZE') {
          code = 'UPLOAD_TOO_LARGE';
          const maxSizeMB = Math.round((parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024) / (1024 * 1024));
          message = `File is too large. Maximum size is ${maxSizeMB}MB.`;
        } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          code = 'UNEXPECTED_FIELD';
          message = 'Unexpected file field. Use "images" as the field name.';
        } else if (err.code === 'LIMIT_FILE_COUNT') {
          code = 'TOO_MANY_FILES';
          message = 'Too many files uploaded at once.';
        }

        return res.status(400).json({
          success: false,
          code,
          message
        });
      }

      // Handle custom errors from fileFilter/destination
      if (err.message && err.message.includes('Invalid file type')) {
        return res.status(400).json({
          success: false,
          code: 'INVALID_FILE_TYPE',
          message: err.message
        });
      }

      if (err.message && err.message.includes('Invalid upload path')) {
        return res.status(400).json({
          success: false,
          code: 'INVALID_TARGET_FOLDER',
          message: 'The upload destination path is invalid.'
        });
      }

      // Generic upload error
      console.error('Upload middleware error:', err);
      return res.status(500).json({
        success: false,
        code: 'UPLOAD_ERROR',
        message: 'An error occurred during file upload.'
      });
    });
  };
}

module.exports = uploadMiddleware;
module.exports.handleUpload = handleUpload;