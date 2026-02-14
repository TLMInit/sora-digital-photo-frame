// Load environment variables
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs-extra');
const session = require('express-session');
const FileStore = require('session-file-store')(session);
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
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);

    const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS
      ? process.env.CORS_ALLOWED_ORIGINS.split(',').map(o => o.trim())
      : [];

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Allow same-origin requests (browser sends Origin on POST/fetch)
    // Match origin against common local patterns for this server
    const port = process.env.PORT || 3000;
    const sameOriginPatterns = [
      `http://localhost:${port}`,
      `http://127.0.0.1:${port}`,
      `http://[::1]:${port}`
    ];
    if (sameOriginPatterns.includes(origin)) {
      return callback(null, true);
    }

    callback(new Error('Not allowed by CORS'));
  },
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

// Require ADMIN_PASSWORD — no default fallback
const adminPassword = process.env.ADMIN_PASSWORD;
if (!adminPassword) {
  console.error('ADMIN_PASSWORD environment variable not set. Exiting for security.');
  process.exit(1);
}

app.use(session({
  store: new FileStore({
    path: path.join(__dirname, 'data', 'sessions'),
    ttl: 86400,
    retries: 0
  }),
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  name: 'photoframe.sid',
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax'
  }
}));

app.use(logger);

// CSRF protection (after cookie parser and before routes)
// Apply CSRF protection to all routes except public API endpoints
app.use((req, res, next) => {
  // Skip CSRF for public endpoints that don't modify state or initial auth
  const publicPaths = [
    '/api/health',
    '/api/random-image',
    '/api/images/random',
    '/api/images/',
    '/api/folders',
    '/api/upload-tokens/validate',
    '/api/auth/session',
    '/api/auth/login',  // Allow login without CSRF (initial auth)
    '/api/auth/pin'     // Allow PIN auth without CSRF
  ];
  
  const isPublicEndpoint = publicPaths.some(path => req.path.startsWith(path));
  const isGetRequest = req.method === 'GET';
  const isTokenUpload = req.path === '/api/token/upload' || req.path === '/api/token/folders';
  
  // Skip CSRF for public GET requests and token-based uploads (which use token auth)
  if (isPublicEndpoint && isGetRequest || isTokenUpload || publicPaths.includes(req.path)) {
    return next();
  }
  
  csrfProtection(req, res, next);
});

// Attach CSRF token to responses
app.use(attachCsrfToken);
app.use(addCsrfTokenToResponse);

// Static files - uploaded files require authentication
app.use('/uploads', (req, res, next) => {
  if (req.session && (req.session.authenticated || req.session.accessAccount)) {
    return next();
  }
  return res.status(401).json({ message: 'Authentication required' });
}, express.static(path.join(__dirname, 'uploads')));
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