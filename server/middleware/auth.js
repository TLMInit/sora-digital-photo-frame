const bcrypt = require('bcryptjs');

// In-memory rate limiter for admin login
const loginRateLimiter = new Map();
const LOGIN_MAX_ATTEMPTS = 5;
const LOGIN_LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
const LOGIN_ATTEMPT_WINDOW = 5 * 60 * 1000; // 5 minutes

function checkLoginRateLimit(ip) {
  const now = Date.now();
  const record = loginRateLimiter.get(ip);
  if (!record) return { allowed: true, attemptsRemaining: LOGIN_MAX_ATTEMPTS };
  if (record.lockoutUntil && now < record.lockoutUntil) {
    const remainingTime = Math.ceil((record.lockoutUntil - now) / 1000 / 60);
    return { allowed: false, message: `Too many failed attempts. Try again in ${remainingTime} minutes.` };
  }
  if (record.firstAttempt && (now - record.firstAttempt) > LOGIN_ATTEMPT_WINDOW) {
    loginRateLimiter.delete(ip);
    return { allowed: true, attemptsRemaining: LOGIN_MAX_ATTEMPTS };
  }
  if (record.attempts >= LOGIN_MAX_ATTEMPTS) {
    record.lockoutUntil = now + LOGIN_LOCKOUT_DURATION;
    const remainingTime = Math.ceil(LOGIN_LOCKOUT_DURATION / 1000 / 60);
    return { allowed: false, message: `Too many failed attempts. Account locked for ${remainingTime} minutes.` };
  }
  return { allowed: true, attemptsRemaining: LOGIN_MAX_ATTEMPTS - record.attempts };
}

function recordLoginFailedAttempt(ip) {
  const now = Date.now();
  const record = loginRateLimiter.get(ip);
  if (!record) {
    loginRateLimiter.set(ip, { attempts: 1, firstAttempt: now, lockoutUntil: null });
  } else {
    record.attempts += 1;
    if (!record.firstAttempt) record.firstAttempt = now;
  }
}

function clearLoginRateLimit(ip) {
  loginRateLimiter.delete(ip);
}

// Check if user is authenticated
const requireAuth = (req, res, next) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log('🔐 Auth Check:', {
      hasSession: !!req.session,
      authenticated: req.session?.authenticated,
      path: req.path
    });
  }

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

  if (process.env.NODE_ENV !== 'production') {
    console.log('❌ Authentication failed for:', req.path);
  }

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
  const clientIP = req.ip || req.connection.remoteAddress;

  // Check rate limit before processing
  const rateCheck = checkLoginRateLimit(clientIP);
  if (!rateCheck.allowed) {
    return res.status(429).json({
      message: rateCheck.message,
      code: 'RATE_LIMITED'
    });
  }

  if (!password) {
    return res.status(400).json({ message: 'Password is required' });
  }

  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    console.error('ADMIN_PASSWORD environment variable not set');
    return res.status(500).json({ message: 'Server configuration error' });
  }

  // For bcrypt hashed passwords, use bcrypt.compare()
  // For plain text passwords (development only), use direct comparison
  let isValidPassword = false;
  
  if (adminPassword.startsWith('$2')) {
    isValidPassword = await bcrypt.compare(password, adminPassword);
  } else {
    isValidPassword = password === adminPassword;
  }

  if (isValidPassword) {
    clearLoginRateLimit(clientIP);
    req.session.authenticated = true;
    req.session.loginTime = new Date();

    if (process.env.NODE_ENV !== 'production') {
      console.log('✅ Login successful');
    }

    // If it's an API request, return JSON success
    if (req.headers['content-type'] === 'application/json') {
      return res.json({ message: 'Login successful', redirect: '/admin' });
    }

    // For form submissions, redirect to admin
    return res.redirect('/admin');
  }

  // Invalid password
  recordLoginFailedAttempt(clientIP);
  console.log('❌ Login failed: Invalid password');
  
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