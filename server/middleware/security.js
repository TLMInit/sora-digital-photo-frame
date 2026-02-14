const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

// Rate limiter for token validation endpoint
// Allow 20 validation requests per IP per 5 minutes
const tokenValidationLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20, // 20 requests per window
  message: {
    success: false,
    error: 'Too many token validation requests. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for localhost in development
  skip: (req) => process.env.NODE_ENV === 'development' && (req.ip === '::1' || req.ip === '127.0.0.1')
});

// Rate limiter for token upload endpoint
// Allow 10 upload requests per IP per hour per token
const tokenUploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 uploads per window
  message: {
    success: false,
    error: 'Upload rate limit exceeded. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Use token from query as additional key to rate limit per token per IP
  keyGenerator: (req) => {
    const token = req.query.token || req.body.token || '';
    return `${req.ip}-${token.substring(0, 10)}`; // IP + first 10 chars of token
  },
  skip: (req) => process.env.NODE_ENV === 'development' && (req.ip === '::1' || req.ip === '127.0.0.1')
});

// Rate limiter for admin token management endpoints
// Allow 30 requests per IP per 15 minutes
const tokenManagementLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,
  message: {
    success: false,
    error: 'Too many token management requests. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'development' && (req.ip === '::1' || req.ip === '127.0.0.1')
});

// Rate limiter for authentication endpoints (login, PIN auth)
// Allow 5 failed attempts per IP per 15 minutes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: {
    success: false,
    error: 'Too many authentication attempts. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful logins
  skip: (req) => process.env.NODE_ENV === 'development' && (req.ip === '::1' || req.ip === '127.0.0.1')
});

// General API rate limiter
// Allow 100 requests per IP per 15 minutes for general API endpoints
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    success: false,
    error: 'Too many requests. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'development' && (req.ip === '::1' || req.ip === '127.0.0.1')
});

// Configure helmet for security headers
const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://fonts.googleapis.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "blob:"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdn.jsdelivr.net"],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
    }
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  frameguard: {
    action: 'deny'
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin'
  }
});

module.exports = {
  tokenValidationLimiter,
  tokenUploadLimiter,
  tokenManagementLimiter,
  authLimiter,
  apiLimiter,
  helmetConfig
};
