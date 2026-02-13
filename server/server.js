// Load environment variables
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs-extra');
const session = require('express-session');

// Import middleware
const logger = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');

// Import routes
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Validate and normalize BASE_PATH
let BASE_PATH = process.env.BASE_PATH || '';
if (BASE_PATH) {
  // Ensure BASE_PATH starts with / and doesn't end with /
  BASE_PATH = BASE_PATH.trim();
  if (!BASE_PATH.startsWith('/')) {
    BASE_PATH = '/' + BASE_PATH;
  }
  if (BASE_PATH.endsWith('/')) {
    BASE_PATH = BASE_PATH.slice(0, -1);
  }
  // Validate BASE_PATH contains only safe characters (alphanumeric, -, _, /)
  if (!/^[a-zA-Z0-9\-_\/]+$/.test(BASE_PATH)) {
    console.error('Invalid BASE_PATH: Contains unsafe characters. Only alphanumeric, -, _, and / are allowed.');
    process.exit(1);
  }
}

// Trust proxy if running behind reverse proxy
app.set('trust proxy', 1);

// Store BASE_PATH for use in views and routes
app.locals.basePath = BASE_PATH;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// Middleware to inject BASE_PATH into requests
app.use((req, res, next) => {
  res.locals.basePath = BASE_PATH;
  next();
});

// Static files
app.use(`${BASE_PATH}/uploads`, express.static(path.join(__dirname, 'uploads')));
app.use(`${BASE_PATH}/js`, express.static(path.join(__dirname, 'public/js')));
app.use(`${BASE_PATH}/admin`, express.static(path.join(__dirname, 'public')));
// Serve CSS and JS files from root for access-accounts page
app.use(BASE_PATH, express.static(path.join(__dirname, 'public'), {
  index: false // Prevent serving index.html from root
}));

// Routes
app.use(BASE_PATH, routes);

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
  const basePath = BASE_PATH || '/';
  console.log(`Digital Photo Frame Server running on port ${PORT}`);
  console.log(`Base path: ${basePath}`);
  console.log(`Admin panel: http://localhost:${PORT}${BASE_PATH}/admin`);
  console.log(`Slideshow: http://localhost:${PORT}${BASE_PATH}/slideshow`);
  console.log(`API endpoint: http://localhost:${PORT}${BASE_PATH}/api/random-image`);
});

module.exports = app;