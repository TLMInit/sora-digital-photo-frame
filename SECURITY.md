# Security Features Documentation

## Overview

This document describes the comprehensive security features implemented in the SORA Digital Photo Frame application to protect against common web vulnerabilities and attacks.

## Security Layers

### 1. Rate Limiting

Rate limiting prevents abuse by limiting the number of requests from a single IP address within a time window.

#### Configuration

| Endpoint Type | Window | Max Requests | Purpose |
|--------------|--------|--------------|---------|
| Token Validation | 5 minutes | 20 | Prevent token brute-force attacks |
| Token Uploads | 1 hour | 10 | Prevent upload flooding (per IP+token) |
| Token Management | 15 minutes | 30 | Protect admin token operations |
| Authentication | 15 minutes | 5 | Prevent credential brute-force (failed only) |
| General API | 15 minutes | 100 | Prevent API abuse |

#### Implementation

```javascript
const rateLimit = require('express-rate-limit');

// Example: Token validation rate limiter
const tokenValidationLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20,
  message: {
    success: false,
    error: 'Too many token validation requests. Please try again later.'
  }
});

// Apply to routes
router.get('/upload-tokens/validate', tokenValidationLimiter, validateToken);
```

#### Development Mode

Rate limiting is automatically disabled for `localhost` (127.0.0.1 and ::1) when `NODE_ENV=development`.

### 2. CSRF Protection

Cross-Site Request Forgery (CSRF) protection prevents malicious websites from performing actions on behalf of authenticated users.

#### How It Works

1. **Token Generation**: Server generates a unique CSRF token for each session
2. **Cookie Storage**: Token stored in a secure, httpOnly cookie
3. **Client-Side Management**: JavaScript utility extracts and manages tokens
4. **Request Injection**: Token automatically added to all mutation requests
5. **Server Validation**: Server validates token matches cookie before processing

#### Protected Operations

- All POST, PUT, PATCH, DELETE requests
- Admin panel operations
- Token management
- Access account management
- File uploads (admin and PIN-authenticated)

#### Exempted Operations

- GET requests (read-only)
- Token-based guest uploads (use cryptographic token authentication)
- Public endpoints (health check, images, folders)

#### Frontend Integration

```javascript
// CSRF manager automatically handles tokens
const csrfManager = window.csrfManager;

// Tokens are automatically added to fetch requests
const response = await fetch('/api/upload-tokens', {
  method: 'POST',
  headers: csrfManager.addToRequest({
    'Content-Type': 'application/json'
  }),
  body: JSON.stringify(data)
});
```

#### Meta Tag Support

All HTML pages include a CSRF meta tag for initial token:

```html
<meta name="csrf-token" content="<%= csrfToken %>">
```

### 3. Security Headers (Helmet)

Helmet configures various HTTP security headers to protect against common attacks.

#### Headers Configured

| Header | Configuration | Protection |
|--------|--------------|------------|
| Content-Security-Policy | Restricts resource sources | XSS, injection attacks |
| Strict-Transport-Security | Forces HTTPS (production) | Man-in-the-middle attacks |
| X-Frame-Options | DENY | Clickjacking |
| X-Content-Type-Options | nosniff | MIME type sniffing |
| X-XSS-Protection | Enabled | Cross-site scripting |
| Referrer-Policy | strict-origin-when-cross-origin | Information leakage |

#### Content Security Policy

```javascript
contentSecurityPolicy: {
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
    styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
    imgSrc: ["'self'", "data:", "blob:"],
    fontSrc: ["'self'", "https://fonts.gstatic.com"],
    connectSrc: ["'self'"],
    frameSrc: ["'none'"],
    objectSrc: ["'none'"]
  }
}
```

### 4. Token-Based Authentication

Upload tokens provide secure, time-limited access without passwords.

#### Security Features

- **Cryptographically Secure**: Generated with `crypto.randomBytes(32)`
- **Hashed Storage**: Tokens hashed with bcrypt before storage (like passwords)
- **Never Stored Plain**: Original tokens shown once, never stored or logged
- **Time-Limited**: Configurable expiration (default 30 days)
- **Upload Limits**: Optional per-token upload caps
- **Enable/Disable**: Tokens can be disabled without deletion

#### Token Generation

```javascript
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

// Generate secure token
const plainToken = crypto.randomBytes(32).toString('base64url');

// Hash for storage
const tokenHash = await bcrypt.hash(plainToken, 10);

// Store hash, return plain token once
return { plainToken, tokenHash };
```

### 5. Session Security

Sessions are configured with secure defaults.

#### Configuration

```javascript
session({
  secret: process.env.SESSION_SECRET, // Required, must be strong
  resave: false,
  saveUninitialized: false,
  name: 'photoframe.sid', // Custom name (don't use default)
  cookie: {
    secure: false, // Set true in production with HTTPS
    httpOnly: true, // Prevent JavaScript access
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax' // CSRF mitigation
  }
})
```

### 6. Input Validation

All user inputs are validated and sanitized.

#### Path Traversal Protection

```javascript
isPathSafe(targetPath) {
  if (!targetPath || targetPath.includes('\0')) {
    return false;
  }
  const normalized = path.normalize(targetPath);
  const resolved = path.resolve(path.join(this.serverRoot, normalized));
  return resolved.startsWith(this.resolvedServerRoot);
}
```

#### File Upload Validation

- File type checking (MIME type validation)
- File size limits (configurable)
- Extension whitelisting
- Image processing with Sharp (strips metadata)

## Security Best Practices

### Development

1. ✅ Use `SESSION_SECRET` with at least 32 random characters
2. ✅ Never commit `.env` files to version control
3. ✅ Use development mode for local testing (skips rate limits)
4. ✅ Test with production settings before deployment

### Production

1. ✅ Set `NODE_ENV=production`
2. ✅ Use HTTPS (set `cookie.secure: true`)
3. ✅ Configure `ALLOWED_ORIGINS` for CORS
4. ✅ Use strong `ADMIN_PASSWORD` (bcrypt hash recommended)
5. ✅ Monitor rate limit logs for attack patterns
6. ✅ Regularly rotate `SESSION_SECRET`
7. ✅ Keep dependencies updated (`npm audit`)

### Token Security

1. ✅ Set appropriate expiration dates
2. ✅ Use upload limits for public events
3. ✅ Disable tokens immediately after events
4. ✅ Delete unused tokens
5. ✅ Monitor upload metadata for abuse patterns

## Monitoring & Logging

### Rate Limit Headers

Rate limit responses include standard headers:

```
X-RateLimit-Limit: 20
X-RateLimit-Remaining: 15
X-RateLimit-Reset: 1640000000
```

### Error Responses

Security errors return appropriate HTTP status codes:

- `403 Forbidden`: CSRF validation failed, token disabled/expired
- `429 Too Many Requests`: Rate limit exceeded
- `401 Unauthorized`: Authentication required

### Logging

All security events are logged to console:

```
🔒 Rate limit exceeded for IP: 192.168.1.100
⚠️  CSRF validation failed for IP: 192.168.1.101
✅ Token validated successfully: Birthday Party 2024
```

## Vulnerability Mitigation

| Vulnerability | Mitigation |
|--------------|------------|
| Brute Force | Rate limiting on auth endpoints |
| CSRF | Token validation on all mutations |
| XSS | Content Security Policy, input sanitization |
| Clickjacking | X-Frame-Options: DENY |
| MIME Sniffing | X-Content-Type-Options: nosniff |
| Session Hijacking | httpOnly cookies, sameSite attribute |
| Token Brute Force | bcrypt hashing, rate limiting |
| DoS | Rate limiting on all endpoints |
| Path Traversal | Path validation, normalization |
| File Upload Attacks | Type validation, size limits, processing |

## Testing Security

### Manual Testing

```bash
# Test rate limiting
for i in {1..25}; do curl http://localhost:3000/api/upload-tokens/validate?token=test; done

# Test CSRF protection
curl -X POST http://localhost:3000/api/upload-tokens \
  -H "Content-Type: application/json" \
  -d '{"name":"Test"}'
# Should return 403 without valid CSRF token

# Test security headers
curl -I http://localhost:3000/admin
# Should include X-Frame-Options, X-Content-Type-Options, etc.
```

### CodeQL Analysis

```bash
# Run security scan
npm run test

# Check for vulnerabilities
npm audit
```

## Environment Variables

Required security-related environment variables:

```bash
# Required
SESSION_SECRET=your-random-32-char-secret-here
ADMIN_PASSWORD=your-admin-password

# Recommended
NODE_ENV=production
ALLOWED_ORIGINS=https://your-domain.com
HTTPS=true

# Optional
MAX_FILE_SIZE=10485760
```

## Updates & Maintenance

### Keeping Secure

1. Regularly update dependencies: `npm update`
2. Check for security advisories: `npm audit`
3. Review access logs for suspicious patterns
4. Rotate session secrets periodically
5. Backup data before updates

### Security Audits

Schedule regular security reviews:

- [ ] Monthly dependency updates
- [ ] Quarterly security audits
- [ ] Annual penetration testing
- [ ] Continuous monitoring of logs

## Support

For security issues or questions:

1. Check this documentation
2. Review middleware code in `/server/middleware/`
3. Check CodeQL scan results
4. Open a GitHub issue (for non-sensitive matters)
5. Contact maintainers privately for vulnerabilities

---

**Last Updated**: 2026-02-14
**Security Version**: 1.0.0
**CodeQL Status**: ✅ 0 vulnerabilities
