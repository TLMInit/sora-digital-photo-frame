const csrf = require('csurf');

// CSRF protection middleware
// Configure CSRF protection with cookie-based tokens
const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production' && process.env.HTTPS === 'true',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
});

// Middleware to attach CSRF token to response locals for templates
const attachCsrfToken = (req, res, next) => {
  res.locals.csrfToken = req.csrfToken();
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
    // Only add CSRF token for successful responses to GET requests
    if (req.method === 'GET' && res.statusCode === 200 && typeof data === 'object' && data !== null) {
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
