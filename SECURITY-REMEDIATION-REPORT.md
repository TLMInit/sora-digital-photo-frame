# 🔒 Security Remediation Report — Sora Digital Photo Frame

**Repository:** `TLMInit/sora-digital-photo-frame`  
**Audit Date:** 2026-02-14  
**Commit Audited:** `87c41b60a1679ba236be50221f459099242fcf43`  
**Priority:** CRITICAL — Do NOT expose to the internet until all P0 items are resolved.

---

## Table of Contents

1. [P0 — Critical: Path Traversal in Upload Middleware](#p0-1-path-traversal-in-upload-middleware)
2. [P0 — Critical: Path Traversal in Image & Folder Controllers](#p0-2-path-traversal-in-image--folder-controllers)
3. [P0 — Critical: Wide-Open CORS Policy](#p0-3-wide-open-cors-policy)
4. [P0 — Critical: Default Admin Password Fallback](#p0-4-default-admin-password-fallback)
5. [P0 — Critical: No Rate Limiting on Admin Login](#p0-5-no-rate-limiting-on-admin-login)
6. [P1 — High: Session Cookie `secure: false` Hardcoded](#p1-1-session-cookie-secure-false-hardcoded)
7. [P1 — High: PINs Stored in Plaintext](#p1-2-pins-stored-in-plaintext)
8. [P1 — High: Session ID Leaked in Response](#p1-3-session-id-leaked-in-response)
9. [P1 — High: No Security Headers (Helmet)](#p1-4-no-security-headers-helmet)
10. [P1 — High: In-Memory Session Store](#p1-5-in-memory-session-store)
11. [P2 — Medium: Remove Unnecessary `path` npm Package](#p2-1-remove-unnecessary-path-npm-package)
12. [P2 — Medium: Excessive Debug Logging in Production](#p2-2-excessive-debug-logging-in-production)
13. [P2 — Medium: Uploaded Files Served Without Auth](#p2-3-uploaded-files-served-without-auth)
14. [P2 — Medium: npm Audit Vulnerabilities](#p2-4-npm-audit-vulnerabilities)
15. [P2 — Medium: Hardcoded OAuth Encryption Salt](#p2-5-hardcoded-oauth-encryption-salt)
16. [Testing Checklist](#testing-checklist)

---

## P0-1: Path Traversal in Upload Middleware

**Severity:** 🔴 CRITICAL  
**File:** `server/middleware/upload.js`  
**Lines:** 7–12  
**Type:** CWE-22 (Path Traversal)

### Current Code (Vulnerable)

```javascript
destination: (req, file, cb) => {
    const uploadPath = req.body.path || 'uploads';
    const fullPath = path.join(__dirname, '..', uploadPath);
    console.log('Upload destination:', uploadPath, 'Full path:', fullPath);
    fs.ensureDirSync(fullPath);
    cb(null, fullPath);
},
```

### Problem

`req.body.path` is user-controlled and used directly in `path.join()` with no validation. An attacker can send `path=../../etc/cron.d` to write files anywhere the process has access.

### Required Fix

Add path containment validation before using the upload path. The guest upload controller at `server/controllers/guestUploadController.js` already has a correct `isPathSafe()` implementation that should be reused:

```javascript
// Reference implementation from guestUploadController.js lines 14-20:
isPathSafe(targetPath) {
    if (!targetPath || targetPath.includes('\0')) {
        return false;
    }
    const normalized = path.normalize(targetPath);
    const resolved = path.resolve(path.join(this.serverRoot, normalized));
    return resolved.startsWith(this.resolvedServerRoot);
}
```

Create a shared utility function (e.g., `server/utils/pathValidator.js`) that exports an `isPathSafe(basePath, userPath)` function. Then use it in the multer destination callback:

```javascript
destination: (req, file, cb) => {
    const uploadPath = req.body.path || 'uploads';
    const serverRoot = path.join(__dirname, '..');
    const fullPath = path.resolve(path.join(serverRoot, uploadPath));

    // Validate path stays within server root
    if (!fullPath.startsWith(path.resolve(serverRoot))) {
        return cb(new Error('Invalid upload path'));
    }

    fs.ensureDirSync(fullPath);
    cb(null, fullPath);
},
```

### Acceptance Criteria

- [ ] User-supplied `path` values containing `..` are rejected
- [ ] Null bytes in paths are rejected
- [ ] Upload destination is always within the server root directory
- [ ] Existing upload functionality still works for valid paths like `uploads/family`

---

## P0-2: Path Traversal in Image & Folder Controllers

**Severity:** 🔴 CRITICAL  
**Files:** `server/controllers/imageController.js`, `server/controllers/folderController.js`  
**Type:** CWE-22 (Path Traversal)

### Affected Methods

All of the following methods use `path.join(__dirname, '..', userInput)` with NO path validation:

| File | Method | Line | Operation |
|------|--------|------|-----------|
| `imageController.js` | `uploadImages()` | 237, 242 | File write |
| `imageController.js` | `deleteImage()` | 289–290 | File delete |
| `imageController.js` | `batchDeleteImages()` | 323, 325 | File delete |
| `imageController.js` | `rotateImage()` | 364–365 | File read/write |
| `folderController.js` | `getFolderContents()` | 284–285 | Directory listing |
| `folderController.js` | `createFolder()` | 326–327 | Directory creation |
| `folderController.js` | `deleteFolder()` | 344–345 | Directory deletion |

### Example Vulnerable Code (imageController.js deleteImage)

```javascript
async deleteImage(req, res) {
    try {
        const imagePath = req.query.path;
        const fullPath = path.join(__dirname, '..', imagePath);
        // NO VALIDATION — attacker can send path=../../etc/passwd
        if (!await fs.pathExists(fullPath)) {
            return res.status(404).json({ message: 'Image not found' });
        }
        await fs.remove(fullPath);
```

### Required Fix

Use the shared `isPathSafe()` utility (from P0-1) in every method listed above. Each method must validate the user-supplied path before any filesystem operation.

Example fix for `deleteImage`:

```javascript
async deleteImage(req, res) {
    try {
        const imagePath = req.query.path;
        if (!imagePath || !isPathSafe(path.join(__dirname, '..'), imagePath)) {
            return res.status(400).json({ message: 'Invalid path' });
        }
        const fullPath = path.join(__dirname, '..', imagePath);
        if (!await fs.pathExists(fullPath)) {
            return res.status(404).json({ message: 'Image not found' });
        }
        await fs.remove(fullPath);
```

Apply the same pattern to ALL seven methods listed in the table above.

### Acceptance Criteria

- [ ] All 7 methods validate paths before filesystem operations
- [ ] Path traversal sequences (`../`, `..\\`, null bytes) are rejected with 400 status
- [ ] Valid paths like `uploads/family/photo.jpg` continue to work
- [ ] `guestUploadController.js` is refactored to use the same shared utility (removing duplicate code)

---

## P0-3: Wide-Open CORS Policy

**Severity:** 🔴 CRITICAL  
**File:** `server/server.js`  
**Line:** 24  
**Type:** CWE-942 (Overly Permissive CORS Policy)

### Current Code (Vulnerable)

```javascript
app.use(cors());
```

### Problem

`cors()` with no arguments allows requests from ANY origin. Any malicious website can make authenticated API requests (upload, delete, manage photos) if a user has an active session.

### Required Fix

Replace with a restrictive CORS configuration:

```javascript
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, curl, same-origin)
        if (!origin) return callback(null, true);

        // In production, only allow same-origin requests
        // Users can configure allowed origins via environment variable
        const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS
            ? process.env.CORS_ALLOWED_ORIGINS.split(',')
            : [];

        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
```

Also add `CORS_ALLOWED_ORIGINS` to the `.env.example` documentation and `docker-compose.yml` environment section.

### Acceptance Criteria

- [ ] CORS no longer allows arbitrary origins
- [ ] Same-origin requests continue to work (no `Origin` header)
- [ ] `CORS_ALLOWED_ORIGINS` environment variable is documented
- [ ] Admin panel and slideshow still function correctly

---

## P0-4: Default Admin Password Fallback

**Severity:** 🔴 CRITICAL  
**Files:** `server/middleware/auth.js` (line 78), `docker-compose.yml` (line 11)  
**Type:** CWE-1188 (Insecure Default Initialization)

### Current Code (Vulnerable)

```javascript
// auth.js
const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
```

```yaml
# docker-compose.yml
- ADMIN_PASSWORD=${ADMIN_PASSWORD:-admin123}
```

### Required Fix

**In `server/middleware/auth.js`:** Make `ADMIN_PASSWORD` required, just like `SESSION_SECRET`:

```javascript
const adminPassword = process.env.ADMIN_PASSWORD;
if (!adminPassword) {
    console.error('ADMIN_PASSWORD environment variable not set. Exiting for security.');
    process.exit(1);
}
```

Remove the `|| 'admin123'` fallback and the warning message on lines 80–82.

**In `docker-compose.yml`:** Remove the default value:

```yaml
- ADMIN_PASSWORD=${ADMIN_PASSWORD}
```

### Acceptance Criteria

- [ ] Application refuses to start without `ADMIN_PASSWORD` set
- [ ] No hardcoded password fallback exists anywhere in the codebase
- [ ] `docker-compose.yml` does not contain a default password
- [ ] Documentation/wiki is updated to reflect this is now required

---

## P0-5: No Rate Limiting on Admin Login

**Severity:** 🔴 CRITICAL  
**File:** `server/middleware/auth.js`  
**Lines:** 70–115  
**Type:** CWE-307 (Improper Restriction of Excessive Authentication Attempts)

### Problem

The `login()` function in `auth.js` has zero rate limiting. An attacker can brute-force the admin password with unlimited attempts. The PIN-based auth in `accessAccountController.js` already has proper rate limiting (5 attempts, 15-minute lockout) — the admin login does not.

### Required Fix

Add rate limiting to the `login()` function using the same pattern as `accessAccountController.js`. Create an in-memory rate limiter (or better yet, use the shared utility from `accessAccountController.js`):

```javascript
// Add at the top of auth.js
const rateLimiter = new Map();
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
const ATTEMPT_WINDOW = 5 * 60 * 1000; // 5 minutes

const login = async (req, res) => {
    const clientIP = req.ip || req.connection.remoteAddress;

    // Check rate limit before processing
    const rateCheck = checkRateLimit(clientIP);
    if (!rateCheck.allowed) {
        return res.status(429).json({
            message: rateCheck.message,
            code: 'RATE_LIMITED'
        });
    }

    const { password } = req.body;
    // ... existing password validation ...

    if (isValidPassword) {
        clearRateLimit(clientIP); // Clear on success
        // ... existing success logic ...
    } else {
        recordFailedAttempt(clientIP); // Record failure
        // ... existing failure logic ...
    }
};
```

### Acceptance Criteria

- [ ] Admin login is rate-limited to 5 attempts per 5-minute window
- [ ] After 5 failed attempts, login is locked for 15 minutes
- [ ] Successful login clears the rate limit counter
- [ ] Rate limit returns HTTP 429 with a clear message
- [ ] Existing login flow is unaffected for legitimate users

---

## P1-1: Session Cookie `secure: false` Hardcoded

**Severity:** 🟡 HIGH  
**File:** `server/server.js`  
**Line:** 41

### Current Code

```javascript
cookie: {
    secure: false, // Set to false for development, even in production for HTTP
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: 'lax'
}
```

### Required Fix

```javascript
cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: 'lax'
}
```

### Acceptance Criteria

- [ ] `secure` flag is `true` in production, `false` in development
- [ ] Application still works in development over HTTP
- [ ] Comment is updated to explain the conditional logic

---

## P1-2: PINs Stored in Plaintext

**Severity:** 🟡 HIGH  
**File:** `server/controllers/accessAccountController.js`  
**Lines:** 152–160 (storage), 289 (comparison)

### Current Code

```javascript
// Storage (line 155) — plaintext
const newAccount = { ...pin, ... };

// Comparison (line 289) — direct string match
const account = accounts.find(acc => acc.pin === pin);
```

### Required Fix

Hash PINs with bcrypt before storage (same as admin password support):

```javascript
const bcrypt = require('bcryptjs');

// When creating/updating account — hash the PIN
const hashedPin = await bcrypt.hash(pin, 10);
const newAccount = { ...name, pin: hashedPin, ... };

// When authenticating — use bcrypt.compare
const account = await findAccountByPin(accounts, pin);

async function findAccountByPin(accounts, pin) {
    for (const acc of accounts) {
        if (await bcrypt.compare(pin, acc.pin)) {
            return acc;
        }
    }
    return null;
}
```

**Note:** The duplicate PIN check also needs updating since you can't compare hashes directly. Remove the duplicate PIN check or use a different approach (e.g., store a PIN hint/identifier separately).

### Acceptance Criteria

- [ ] New PINs are hashed with bcrypt before storage
- [ ] PIN comparison uses `bcrypt.compare()`
- [ ] Existing plaintext PINs are migrated on first comparison (backward compatibility)
- [ ] `access-accounts.json` no longer contains readable PINs
- [ ] Duplicate PIN detection still works

---

## P1-3: Session ID Leaked in Response

**Severity:** 🟡 HIGH  
**File:** `server/controllers/accessAccountController.js`  
**Lines:** 330–331

### Current Code

```javascript
res.json({
    success: true,
    account: { ... },
    sessionId: req.sessionID  // REMOVE THIS
});
```

### Required Fix

Remove `sessionId: req.sessionID` from the response body. The session ID is already transmitted via the cookie — it should never appear in the response body.

```javascript
res.json({
    success: true,
    account: {
        id: account.id,
        name: account.name,
        assignedFolders: account.assignedFolders,
        uploadAccess: !!account.uploadAccess
    }
});
```

### Acceptance Criteria

- [ ] `sessionId` is removed from all API response bodies
- [ ] Client-side code does not depend on `sessionId` from the response (verify `guest-upload.js`, `slideshow.html`, `access-accounts.js`)

---

## P1-4: No Security Headers (Helmet)

**Severity:** 🟡 HIGH  
**File:** `server/server.js`  
**Type:** CWE-693 (Protection Mechanism Failure)

### Required Fix

Install and configure `helmet`:

```bash
npm install helmet
```

Add to `server/server.js` before other middleware:

```javascript
const helmet = require('helmet');
app.use(helmet());
```

This adds the following headers automatically:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN`
- `X-XSS-Protection: 0` (modern recommendation)
- `Strict-Transport-Security` (HSTS)
- `Content-Security-Policy`
- `Referrer-Policy`
- And more

### Acceptance Criteria

- [ ] `helmet` is added as a dependency in `package.json`
- [ ] `app.use(helmet())` is added before route handlers in `server.js`
- [ ] Admin panel and slideshow still render correctly (CSP may need tuning for inline scripts/styles)
- [ ] If CSP causes issues, configure helmet with appropriate exceptions rather than disabling it entirely

---

## P1-5: In-Memory Session Store

**Severity:** 🟡 HIGH  
**File:** `server/server.js`  
**Lines:** 35–46

### Problem

The default `express-session` `MemoryStore` is used. Express itself warns: *"MemoryStore is purposely not designed for a production environment"*. It leaks memory and does not persist across restarts.

### Required Fix

Install a session store. For a file-based approach (simplest for this app):

```bash
npm install session-file-store
```

```javascript
const session = require('express-session');
const FileStore = require('session-file-store')(session);

app.use(session({
    store: new FileStore({
        path: path.join(__dirname, 'data', 'sessions'),
        ttl: 86400, // 24 hours
        retries: 0
    }),
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    name: 'photoframe.sid',
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
        sameSite: 'lax'
    }
}));
```

Make sure the `data/sessions` directory is included in the Docker volume mounts if persistence across container restarts is desired.

### Acceptance Criteria

- [ ] A persistent session store is configured
- [ ] Sessions survive server restarts
- [ ] Session files are stored in the `data/` directory (covered by Docker volume)
- [ ] Old sessions are cleaned up after TTL expires

---

## P2-1: Remove Unnecessary `path` npm Package

**Severity:** 🟡 MEDIUM  
**File:** `server/package.json`  
**Line:** 31

### Problem

```json
"path": "^0.12.7",
```

`path` is a built-in Node.js core module. The npm package is unnecessary and represents a supply-chain attack risk. `require('path')` will resolve to the built-in module regardless.

### Required Fix

```bash
npm uninstall path
```

### Acceptance Criteria

- [ ] `path` is removed from `package.json`
- [ ] All `require('path')` calls still work (they use the built-in module)
- [ ] Application starts and functions normally

---

## P2-2: Excessive Debug Logging in Production

**Severity:** 🟡 MEDIUM  
**Files:** `server/middleware/auth.js`, `server/utils/oauthManager.js`, `server/controllers/accessAccountController.js`

### Problem

Session IDs, authentication states, IP addresses, and token metadata are logged via `console.log` at all times, including production.

### Required Fix

Wrap debug logging with environment checks:

```javascript
if (process.env.NODE_ENV !== 'production') {
    console.log('🔐 Auth Check:', { sessionId: req.sessionID, ... });
}
```

Or better yet, use the existing logger middleware with log levels. Only log security-relevant events (failed logins, rate limits) in production, not routine auth checks.

### Specific Lines to Guard

| File | Lines | Content |
|------|-------|---------|
| `auth.js` | 5–11 | Auth check with sessionId |
| `auth.js` | 94–98 | Login success with session data |
| `accessAccountController.js` | 272, 296, 308 | IP addresses and PIN attempts |
| `oauthManager.js` | 9–14 | Environment variable checks |
| `oauthManager.js` | 165–169 | Token exchange details |
| `oauthManager.js` | 176 | Full user profile data |
| `oauthManager.js` | 219–221 | Token validation info |

### Acceptance Criteria

- [ ] Debug logging is suppressed when `NODE_ENV=production`
- [ ] Security events (failed logins, rate limits) are still logged in production
- [ ] No session IDs or token data appear in production logs

---

## P2-3: Uploaded Files Served Without Auth

**Severity:** 🟡 MEDIUM  
**File:** `server/server.js`  
**Line:** 51

### Current Code

```javascript
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
```

### Problem

All uploaded photos are publicly accessible at `/uploads/*` with no authentication. Anyone who knows or guesses the filename can view any photo.

### Note

This is partially by design (the slideshow needs to load images), but for internet-facing deployments, consider adding authentication or signed URLs. This is a lower priority if the application is only exposed on a private network.

### Possible Fix (Optional)

If auth is desired, replace the static middleware with a route that checks authentication:

```javascript
app.use('/uploads', (req, res, next) => {
    // Allow if admin, PIN user, or slideshow viewer (configure as needed)
    if (req.session && (req.session.authenticated || req.session.accessAccount)) {
        return next();
    }
    return res.status(401).json({ message: 'Authentication required' });
}, express.static(path.join(__dirname, 'uploads')));
```

### Acceptance Criteria

- [ ] Decision made on whether uploads require auth
- [ ] If yes: auth middleware added before static serving
- [ ] If no: document that uploaded photos are publicly accessible by URL

---

## P2-4: npm Audit Vulnerabilities

**Severity:** 🟡 MEDIUM

### Current Audit Results

| Package | Severity | Issue | Fix |
|---------|----------|-------|-----|
| `qs` 6.7.0–6.14.1 | Low | DoS via arrayLimit bypass | `npm audit fix` |
| `elliptic` | Low | Risky crypto implementation (not in your code path) | `npm audit fix` |
| `cookie` (via `csurf`) | Low | Out-of-bounds characters | Remove `csurf` if installed |

### Required Fix

```bash
# Fix safe vulnerabilities
npm audit fix

# Remove csurf if it exists (it's deprecated)
npm uninstall csurf 2>/dev/null

# Remove unnecessary path package
npm uninstall path

# Verify
npm audit
```

**Do NOT run `npm audit fix --force`** — it will install an ancient version of `csurf`.

### Acceptance Criteria

- [ ] `npm audit` shows 0 vulnerabilities after fixes
- [ ] `csurf` is not in `package.json` or `node_modules`
- [ ] `path` npm package is removed
- [ ] Application starts and all tests pass

---

## P2-5: Hardcoded OAuth Encryption Salt

**Severity:** 🟡 MEDIUM  
**File:** `server/utils/oauthManager.js`  
**Line:** 46

### Current Code

```javascript
return crypto.scryptSync(sessionSecret, 'google-photos-salt', 32);
```

### Required Fix

Make the salt configurable via environment variable:

```javascript
const salt = process.env.OAUTH_ENCRYPTION_SALT || 'google-photos-salt';
return crypto.scryptSync(sessionSecret, salt, 32);
```

### Acceptance Criteria

- [ ] Salt is configurable via `OAUTH_ENCRYPTION_SALT` environment variable
- [ ] Default value maintains backward compatibility
- [ ] `.env.example` is updated with the new variable

---

## Testing Checklist

After implementing all fixes, verify the following:

### Functional Tests

- [ ] Admin login works with correct password
- [ ] Admin login is rejected with incorrect password
- [ ] Admin login is locked after 5 failed attempts
- [ ] Photo upload works to valid paths (e.g., `uploads/family`)
- [ ] Photo upload is rejected for traversal paths (e.g., `../../etc`)
- [ ] Photo delete works for valid image paths
- [ ] Photo delete is rejected for traversal paths
- [ ] Folder create/delete works for valid paths
- [ ] Folder create/delete is rejected for traversal paths
- [ ] Image rotation works for valid paths
- [ ] Batch delete works for valid paths
- [ ] PIN authentication works
- [ ] PIN authentication locks after 5 failed attempts
- [ ] Guest upload works within assigned folders
- [ ] Slideshow displays images correctly
- [ ] Google Photos integration works (if enabled)
- [ ] Docker build succeeds
- [ ] Health check endpoint returns 200

### Security Tests

- [ ] `curl -X POST http://host/api/upload -F "images=@test.jpg" -F "path=../../tmp"` → returns 400
- [ ] `curl -X DELETE "http://host/api/images?path=../../etc/passwd"` → returns 400
- [ ] `curl -H "Origin: https://evil.com" http://host/api/health` → CORS blocked
- [ ] Application refuses to start without `ADMIN_PASSWORD`
- [ ] Application refuses to start without `SESSION_SECRET`
- [ ] `npm audit` shows 0 vulnerabilities
- [ ] No session IDs in API response bodies
- [ ] Response headers include `X-Content-Type-Options`, `X-Frame-Options`, etc.
- [ ] 6 rapid failed login attempts → HTTP 429 rate limit response

---

## New Dependencies Required

```bash
npm install helmet session-file-store
npm uninstall path csurf
```

## New Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ADMIN_PASSWORD` | **Yes** (changed from optional) | None — app exits if missing | Admin panel password |
| `CORS_ALLOWED_ORIGINS` | No | Empty (same-origin only) | Comma-separated list of allowed CORS origins |
| `OAUTH_ENCRYPTION_SALT` | No | `google-photos-salt` | Salt for OAuth token encryption key derivation |

## Files Modified

| File | Changes |
|------|---------|
| `server/middleware/upload.js` | Add path traversal validation |
| `server/controllers/imageController.js` | Add path validation to 4 methods |
| `server/controllers/folderController.js` | Add path validation to 3 methods |
| `server/controllers/guestUploadController.js` | Refactor to use shared path validator |
| `server/controllers/accessAccountController.js` | Hash PINs with bcrypt, remove sessionId from response |
| `server/middleware/auth.js` | Add rate limiting to admin login, remove default password |
| `server/server.js` | Fix CORS, add helmet, add session store, fix secure cookie |
| `server/utils/oauthManager.js` | Configurable salt, guard debug logging |
| `server/utils/pathValidator.js` | **NEW FILE** — shared path validation utility |
| `server/package.json` | Add helmet, session-file-store; remove path, csurf |
| `docker-compose.yml` | Remove default ADMIN_PASSWORD, add new env vars |