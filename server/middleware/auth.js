const bcrypt = require('bcryptjs');

// Check if user is authenticated
const requireAuth = (req, res, next) => {
  console.log('🔐 Auth Check:', {
    sessionId: req.sessionID,
    hasSession: !!req.session,
    authenticated: req.session?.authenticated,
    path: req.path,
    cookies: req.headers.cookie ? 'present' : 'missing'
  });

  if (req.session && req.session.authenticated) {
    // Check if session has expired based on login time and maxAge
    const sessionMaxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    const loginTime = req.session.loginTime ? new Date(req.session.loginTime) : null;

    if (loginTime && (Date.now() - loginTime.getTime()) > sessionMaxAge) {
      // Session expired, destroy it
      req.session.destroy((err) => {
        if (err) console.error('Error destroying expired session:', err);
      });

      // Check both req.path and req.originalUrl for API requests
      const isApiRequest = req.path.startsWith('/api/') || req.originalUrl.startsWith('/api/');
      
      // If it's an API request, return JSON error with session expired flag
      if (isApiRequest) {
        return res.status(401).json({
          message: 'Session expired',
          code: 'SESSION_EXPIRED',
          redirect: '/login'
        });
      }

      // For HTML requests, redirect to login
      return res.redirect('/login?expired=true');
    }

    return next();
  }

  console.log('❌ Authentication failed for:', req.path);

  // Check both req.path and req.originalUrl for API requests
  const isApiRequest = req.path.startsWith('/api/') || req.originalUrl.startsWith('/api/');
  
  // If it's an API request, return JSON error
  if (isApiRequest) {
    return res.status(401).json({
      message: 'Authentication required',
      code: 'AUTH_REQUIRED',
      redirect: '/login'
    });
  }

  // For HTML requests, redirect to login
  return res.redirect('/login');
};

// Check if user is NOT authenticated (for login page)
const requireGuest = (req, res, next) => {
  if (req.session && req.session.authenticated) {
    return res.redirect('/admin');
  }
  next();
};

// Login handler
const login = async (req, res) => {
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ message: 'Password is required' });
  }

  // Secure password comparison using bcrypt
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

  if (!process.env.ADMIN_PASSWORD) {
    console.warn('⚠️  ADMIN_PASSWORD environment variable not set. Using default password "admin123". Please set ADMIN_PASSWORD environment variable for security!');
  }

  // For bcrypt hashed passwords, use bcrypt.compare()
  // For plain text passwords (development only), use direct comparison
  const isValidPassword = adminPassword.startsWith('$2')
    ? await bcrypt.compare(password, adminPassword)
    : password === adminPassword;

  if (isValidPassword) {
    req.session.authenticated = true;
    req.session.loginTime = new Date();

    console.log('🔓 Login successful:', {
      sessionId: req.sessionID,
      sessionData: req.session,
      cookies: req.headers.cookie ? 'present' : 'missing'
    });

    // If it's an API request, return JSON success
    if (req.headers['content-type'] === 'application/json') {
      return res.json({ message: 'Login successful', redirect: '/admin' });
    }

    // For form submissions, redirect to admin
    return res.redirect('/admin');
  }

  // Invalid password
  if (req.headers['content-type'] === 'application/json') {
    return res.status(401).json({ message: 'Invalid password' });
  }

  return res.redirect('/login?error=invalid');
};

// Logout handler
const logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
    }
    res.redirect('/login');
  });
};

// Get authentication status
const getAuthStatus = (req, res) => {
  res.json({
    authenticated: !!(req.session && req.session.authenticated),
    loginTime: req.session?.loginTime || null
  });
};

// Check if user has upload access (admin or PIN user with uploadAccess)
const requireUploadAuth = (req, res, next) => {
  // Admin is always allowed
  if (req.session && req.session.authenticated) {
    return next();
  }

  // PIN-authenticated user with upload access
  if (req.session && req.session.accessAccount && req.session.accessAccount.uploadAccess) {
    return next();
  }

  const isApiRequest = req.path.startsWith('/api/') || req.originalUrl.startsWith('/api/');
  
  if (isApiRequest) {
    return res.status(401).json({
      message: 'Upload access required',
      code: 'UPLOAD_ACCESS_REQUIRED',
      redirect: '/login'
    });
  }

  return res.redirect('/login');
};

// Check if request has valid upload token
const requireUploadToken = async (req, res, next) => {
  const uploadTokenController = require('../controllers/uploadTokenController');
  
  // Get token from query parameter
  const plainToken = req.query.token || req.body.token;

  if (!plainToken) {
    const isApiRequest = req.path.startsWith('/api/') || req.originalUrl.startsWith('/api/');
    
    if (isApiRequest) {
      return res.status(401).json({
        success: false,
        error: 'Upload token is required',
        code: 'TOKEN_REQUIRED'
      });
    }
    return res.redirect('/guest-upload');
  }

  try {
    // Find and validate the token
    const token = await uploadTokenController.findTokenByPlainToken(plainToken);

    if (!token) {
      return res.status(403).json({
        success: false,
        error: 'Invalid upload token'
      });
    }

    // Check if token is enabled
    if (!token.enabled) {
      return res.status(403).json({
        success: false,
        error: 'This upload link has been disabled'
      });
    }

    // Check if token is expired
    if (token.expiresAt && Date.now() > token.expiresAt) {
      return res.status(403).json({
        success: false,
        error: 'This upload link has expired'
      });
    }

    // Check if upload limit reached
    if (token.uploadLimit && token.uploadCount >= token.uploadLimit) {
      return res.status(403).json({
        success: false,
        error: 'Upload limit reached for this link'
      });
    }

    // Attach token info to request for use in controllers
    req.uploadToken = token;
    next();
  } catch (error) {
    console.error('Error validating upload token:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to validate upload token'
    });
  }
};

module.exports = {
  requireAuth,
  requireGuest,
  requireUploadAuth,
  requireUploadToken,
  login,
  logout,
  getAuthStatus
};