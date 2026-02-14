const crypto = require('crypto');

// Custom CSRF protection using double-submit cookie pattern
// Replaces the deprecated csurf package

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

// CSRF protection middleware
const csrfProtection = (req, res, next) => {
  // For GET/HEAD/OPTIONS, generate and set the token
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    if (!req.cookies || !req.cookies['_csrf']) {
      const token = generateToken();
      res.cookie('_csrf', token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production' && process.env.HTTPS === 'true',
        maxAge: 24 * 60 * 60 * 1000
      });
    }
    // Attach csrfToken function to request
    req.csrfToken = () => {
      const cookieToken = req.cookies && req.cookies['_csrf'];
      if (!cookieToken) {
        const newToken = generateToken();
        res.cookie('_csrf', newToken, {
          httpOnly: true,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production' && process.env.HTTPS === 'true',
          maxAge: 24 * 60 * 60 * 1000
        });
        return newToken;
      }
      return cookieToken;
    };
    return next();
  }

  // For state-changing methods, validate the token
  const cookieToken = req.cookies && req.cookies['_csrf'];
  const headerToken = req.headers['x-csrf-token'] || req.headers['x-xsrf-token'];
  const bodyToken = req.body && req.body._csrf;
  const submittedToken = headerToken || bodyToken;

  if (!cookieToken || !submittedToken || cookieToken !== submittedToken) {
    const err = new Error('Invalid CSRF token');
    err.code = 'EBADCSRFTOKEN';
    return next(err);
  }

  // Attach csrfToken function
  req.csrfToken = () => cookieToken;
  next();
};

// Middleware to attach CSRF token to response locals for templates
const attachCsrfToken = (req, res, next) => {
  // Only attach CSRF token if the csrfToken function is available
  if (typeof req.csrfToken === 'function') {
    res.locals.csrfToken = req.csrfToken();
  }
  next();
};

// Error handler for CSRF validation failures
const handleCsrfError = (err, req, res, next) => {
  if (err.code === 'EBADCSRFTOKEN') {
    // CSRF token validation failed
    const isApiRequest = req.path.startsWith('/api/') || req.originalUrl.startsWith('/api/');
    
    if (isApiRequest) {
      return res.status(403).json({
        success: false,
        error: 'Invalid CSRF token. Please refresh the page and try again.',
        code: 'CSRF_VALIDATION_FAILED'
      });
    }
    
    return res.status(403).send('Invalid CSRF token. Please refresh the page and try again.');
  }
  
  next(err);
};

// Middleware to add CSRF token to JSON responses for API endpoints
const addCsrfTokenToResponse = (req, res, next) => {
  const originalJson = res.json;
  
  res.json = function(data) {
    // Only add CSRF token for successful responses to GET requests if csrfToken function exists
    if (typeof req.csrfToken === 'function' && req.method === 'GET' && res.statusCode === 200 && typeof data === 'object' && data !== null) {
      data._csrf = req.csrfToken();
    }
    return originalJson.call(this, data);
  };
  
  next();
};

module.exports = {
  csrfProtection,
  attachCsrfToken,
  handleCsrfError,
  addCsrfTokenToResponse
};
