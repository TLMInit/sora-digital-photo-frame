# CDN to Local Migration - QRCode Library

## Problem Summary

The QRCode library from CDN (cdn.jsdelivr.net) was causing multiple critical errors:

```
GET https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js
CORS Failed

Cross-Origin Request Blocked: The Same Origin Policy disallows reading 
the remote resource at https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js. 
(Reason: CORS request did not succeed). Status code: (null).

The resource from "https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js" 
was blocked due to MIME type ("text/plain") mismatch (X-Content-Type-Options: nosniff).
```

## Root Causes

1. **CORS Policy**: CDN not sending proper CORS headers for cross-origin requests
2. **MIME Type Mismatch**: CDN serving file as `text/plain` instead of `application/javascript`
3. **X-Content-Type-Options**: nosniff CSP header rejecting incorrect MIME type
4. **CDN Reliability**: External service dependency creating single point of failure
5. **Network Blocking**: Corporate firewalls, ad blockers, or privacy extensions blocking CDN

## Solution: Local Bundling

### Step 1: Install Dependencies

```bash
cd server
npm install qrcode@1.5.3
npm install --save-dev browserify terser
```

### Step 2: Create Browser Bundle

```bash
# Create browserified and minified bundle
npx browserify -r qrcode -s QRCode | npx terser --compress --mangle > public/js/qrcode.min.js
```

This creates a 27KB minified bundle that:
- Works in browsers (UMD format)
- Exposes global `QRCode` object
- Includes all dependencies
- Is optimized for production

### Step 3: Update HTML Reference

**Before:**
```html
<script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js" crossorigin="anonymous"></script>
```

**After:**
```html
<script src="/js/qrcode.min.js"></script>
```

## Benefits

### Reliability
- ✅ No external service dependency
- ✅ Works offline
- ✅ No CDN outages
- ✅ No blocking by firewalls/ad blockers

### Performance
- ✅ Faster loading (no DNS lookup, same-origin connection reuse)
- ✅ Consistent load times
- ✅ Better caching control

### Security
- ✅ No third-party code injection risk
- ✅ No CDN compromise risk
- ✅ Content integrity guaranteed
- ✅ No tracking from CDN

### Compatibility
- ✅ No CORS issues
- ✅ Correct MIME type (application/javascript)
- ✅ CSP compliant (`script-src-elem 'self'`)
- ✅ Works in all environments

## Testing

### Verify Local Bundle Works

```bash
# Start server
cd server
npm start

# Test file is accessible
curl http://localhost:3000/js/qrcode.min.js | head -c 100
# Should output: !function(t){if("object"==typeof exports...

# Test in browser
# 1. Open browser console
# 2. Navigate to http://localhost:3000/upload-tokens
# 3. Check console for errors (should be none)
# 4. Type: typeof QRCode
# 5. Should return: "object" or "function"
```

### Verify QR Code Generation

```bash
# 1. Login to admin panel
# 2. Navigate to Guest Upload Links
# 3. Create a new upload link
# 4. Click "QR Code" button on created token
# 5. QR code should display without errors
```

## Maintenance

### Updating QRCode Library

When a new version of the QRCode library is released:

```bash
cd server

# Install latest version
npm install qrcode@latest

# Rebuild bundle
npx browserify -r qrcode -s QRCode | npx terser --compress --mangle > public/js/qrcode.min.js

# Test thoroughly
npm start
# Verify QR code generation works
```

### Troubleshooting

**Issue: QRCode is not defined**
- Check browser console for load errors
- Verify `/js/qrcode.min.js` exists in public directory
- Check file permissions (should be readable)
- Verify script tag in HTML is before usage

**Issue: QR code not generating**
- Check for JavaScript errors in console
- Verify `typeof QRCode !== 'undefined'` returns true
- Check token validation and retrieval
- Verify canvas element exists in DOM

**Issue: Build fails**
- Ensure browserify is installed: `npm install --save-dev browserify`
- Ensure terser is installed: `npm install --save-dev terser`
- Check qrcode package is installed: `npm list qrcode`

## Alternative Solutions (Not Implemented)

### Option 1: Different CDN
- Try unpkg.com or cdnjs.com
- Problem: Still has CDN dependency issues

### Option 2: Download Pre-built
- Download from GitHub releases
- Problem: Manual updates, less control

### Option 3: Subresource Integrity (SRI)
- Add integrity attribute to script tag
- Problem: Doesn't fix CORS or MIME issues

### Option 4: Proxy CDN Through Server
- Create endpoint that proxies CDN
- Problem: Server becomes bottleneck, adds complexity

## Conclusion

**Local bundling is the best solution** because it:
- Eliminates all CDN-related issues
- Improves reliability and performance
- Enhances security
- Simplifies deployment
- Works in all environments

The small cost of including the library in the repository (27KB) is far outweighed by the benefits of reliability and eliminating external dependencies.

## Files Changed

- `server/package.json` - Added qrcode and browserify dependencies
- `server/public/js/qrcode.min.js` - Local QRCode bundle (new file)
- `server/public/upload-tokens.html` - Updated script reference to local file

## References

- QRCode Library: https://github.com/soldair/node-qrcode
- Browserify: https://browserify.org/
- CORS Explanation: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
- CSP nosniff: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Content-Type-Options
