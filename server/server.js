// Load environment variables
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs-extra');
const session = require('express-session');
const cookieParser = require('cookie-parser');

// Import middleware
const logger = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');
const { helmetConfig } = require('./middleware/security');
const { csrfProtection, attachCsrfToken, handleCsrfError, addCsrfTokenToResponse } = require('./middleware/csrf');

// Import routes
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy if running behind reverse proxy
app.set('trust proxy', 1);

// Security headers via Helmet
app.use(helmetConfig);

// Middleware
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : true,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Session configuration
const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
  console.error('SESSION_SECRET environment variable not set');
  process.exit(1);
}

app.use(session({
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  name: 'photoframe.sid', // Custom session cookie name
  cookie: {
    secure: false, // Set to false for development, even in production for HTTP
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax' // Add SameSite attribute for better compatibility
  }
}));

app.use(logger);

// CSRF protection (after cookie parser and before routes)
// Apply CSRF protection to all routes except public API endpoints
app.use((req, res, next) => {
  // Skip CSRF for public endpoints that don't modify state
  const publicPaths = [
    '/api/health',
    '/api/random-image',
    '/api/images/random',
    '/api/images/',
    '/api/folders',
    '/api/upload-tokens/validate',
    '/api/auth/session'
  ];
  
  const isPublicEndpoint = publicPaths.some(path => req.path.startsWith(path));
  const isGetRequest = req.method === 'GET';
  const isTokenUpload = req.path === '/api/token/upload' || req.path === '/api/token/folders';
  
  // Skip CSRF for public GET requests and token-based uploads (which use token auth)
  if (isPublicEndpoint && isGetRequest || isTokenUpload) {
    return next();
  }
  
  csrfProtection(req, res, next);
});

// Attach CSRF token to responses
app.use(attachCsrfToken);
app.use(addCsrfTokenToResponse);

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/js', express.static(path.join(__dirname, 'public/js')));
app.use('/admin', express.static(path.join(__dirname, 'public')));
// Serve CSS and JS files from root for access-accounts page
app.use(express.static(path.join(__dirname, 'public'), {
  index: false // Prevent serving index.html from root
}));

// Routes
app.use('/', routes);

// CSRF error handler (before general error handler)
app.use(handleCsrfError);

// Error handling middleware (must be last)
app.use(errorHandler);

// Initialize uploads directory
const initializeUploads = async () => {
  const uploadsDir = path.join(__dirname, process.env.UPLOAD_DIR || 'uploads');
  const defaultFolders = (process.env.DEFAULT_FOLDERS || 'family,vacation,holidays,misc').split(',');
  
  await fs.ensureDir(uploadsDir);
  
  for (const folder of defaultFolders) {
    await fs.ensureDir(path.join(uploadsDir, folder.trim()));
  }
};

// Start server
app.listen(PORT, async () => {
  await initializeUploads();
  console.log(`Digital Photo Frame Server running on port ${PORT}`);
  console.log(`Admin panel: http://localhost:${PORT}/admin`);
  console.log(`Slideshow: http://localhost:${PORT}/slideshow`);
  console.log(`API endpoint: http://localhost:${PORT}/api/random-image`);
});

module.exports = app;