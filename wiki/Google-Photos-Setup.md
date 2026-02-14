# ☁️ Google Photos Setup Guide

This comprehensive guide walks you through setting up Google Photos integration with SORA Digital Photo Frame, allowing you to sync and display photos from your Google Photos library.

## 📋 Table of Contents

- [Overview](#-overview)
- [Prerequisites](#-prerequisites)
- [Step 1: Create Google Cloud Project](#-step-1-create-google-cloud-project)
- [Step 2: Enable Google Photos Library API](#-step-2-enable-google-photos-library-api)
- [Step 3: Create OAuth 2.0 Credentials](#-step-3-create-oauth-20-credentials)
- [Step 4: Configure OAuth Consent Screen](#-step-4-configure-oauth-consent-screen)
- [Step 5: Add Authorized Redirect URIs](#-step-5-add-authorized-redirect-uris)
- [Step 6: Configure SORA Frame](#-step-6-configure-sora-frame)
- [Step 7: Connect Google Photos](#-step-7-connect-google-photos)
- [Troubleshooting](#-troubleshooting)
- [Publishing Your App](#-publishing-your-app-for-public-use)
- [Security & Privacy](#-security--privacy)
- [API Quotas & Limits](#-api-quotas--limits)
- [Complete Configuration Example](#-complete-configuration-example)

## 🎯 Overview

Google Photos integration allows SORA Frame to:

- ✅ **Read your Google Photos library** - Access albums and photos
- ✅ **Sync photos automatically** - Keep your frame updated with new photos
- ✅ **Select specific albums** - Choose which albums to display
- ✅ **No photo storage** - Photos are fetched on-demand (metadata only is cached)
- ✅ **Secure OAuth 2.0** - Industry-standard authentication
- ✅ **Read-only access** - SORA Frame cannot modify or delete your photos

**What you'll need:**
- A Google account
- Access to Google Cloud Console (free)
- About 15-20 minutes to complete setup

## ✅ Prerequisites

Before starting, ensure you have:

- [ ] **Google Account** - Personal or Google Workspace account
- [ ] **SORA Frame installed** - See [Installation Guide](Installation-Guide)
- [ ] **SORA Frame accessible** - Know your access URL (e.g., `http://localhost:3000` or `https://photos.yourdomain.com`)
- [ ] **Admin access** - Ability to edit `.env` file and restart application

## 🔧 Step 1: Create Google Cloud Project

### 1.1 Access Google Cloud Console

1. Open your web browser
2. Navigate to [Google Cloud Console](https://console.cloud.google.com/)
3. Sign in with your Google account
4. Accept the terms of service if prompted

### 1.2 Create a New Project

1. **Click the project dropdown** at the top left (next to "Google Cloud")
   - If you have no projects, it will say "Select a project"
   - If you have existing projects, it will show your current project name

2. **Click "NEW PROJECT"** in the top right of the project selector dialog

3. **Fill in project details:**
   - **Project name**: `SORA Photo Frame` (or any name you prefer)
   - **Organization**: Leave as "No organization" (unless you have a Google Workspace)
   - **Location**: Leave as is

4. **Click "CREATE"**

5. **Wait for the project to be created** (this takes a few seconds)

6. **Select your new project** from the project dropdown

💡 **Tip**: The project ID will be auto-generated (e.g., `sora-photo-frame-123456`). You don't need to remember this.

## 🔌 Step 2: Enable Google Photos Library API

### 2.1 Navigate to APIs & Services

1. Click the **hamburger menu** (☰) in the top left
2. Navigate to **"APIs & Services"** → **"Library"**
   - Or use the search bar at the top and search for "APIs & Services"

### 2.2 Enable the API

1. In the API Library, use the search box
2. Type **"Google Photos Library API"**
3. Click on **"Google Photos Library API"** in the results
4. Click the **"ENABLE"** button
5. Wait for the API to be enabled (takes a few seconds)

✅ **Success indicator**: You'll see "API enabled" and be redirected to the API dashboard

💡 **Note**: This API is free for personal use within Google's quota limits.

## 🔐 Step 3: Create OAuth 2.0 Credentials

### 3.1 Navigate to Credentials

1. In the left sidebar, click **"Credentials"**
2. Click **"+ CREATE CREDENTIALS"** at the top
3. Select **"OAuth client ID"** from the dropdown

### 3.2 Configure OAuth Consent Screen (First Time Only)

If you haven't configured the consent screen yet, you'll be prompted to do so:

1. Click **"CONFIGURE CONSENT SCREEN"**
2. Proceed to [Step 4: Configure OAuth Consent Screen](#-step-4-configure-oauth-consent-screen)
3. Return here after completing Step 4

### 3.3 Create OAuth Client ID

1. **Application type**: Select **"Web application"**

2. **Name**: Enter a descriptive name
   - Example: `SORA Frame Web Client`

3. **Authorized JavaScript origins**: (Optional - can leave empty)
   - Click **"+ ADD URI"**
   - Enter your base URL (without path):
     - `http://localhost:3000` (for local access)
     - `https://photos.yourdomain.com` (for production)

4. **Authorized redirect URIs**: ⚠️ **CRITICAL - See Step 5 for details**
   - Click **"+ ADD URI"**
   - Enter: `http://localhost:3000/api/google/callback`
   - Click **"+ ADD URI"** for additional URIs if needed
   - See [Step 5](#-step-5-add-authorized-redirect-uris) for more examples

5. Click **"CREATE"**

### 3.4 Save Your Credentials

After creation, a dialog appears with your credentials:

1. **Client ID**: Copy this value
   - Format: `123456789-abc123def456.apps.googleusercontent.com`
   - Save it temporarily in a text file

2. **Client Secret**: Copy this value
   - Format: `GOCSPX-abcdefghijklmnopqrstuvw`
   - Save it temporarily in a text file

3. Click **"OK"** to close the dialog

💡 **Tip**: You can always retrieve these later from the Credentials page.

⚠️ **Security Warning**: Never share your Client Secret publicly or commit it to version control!

## 🎨 Step 4: Configure OAuth Consent Screen

The OAuth consent screen is what users see when authorizing your app to access Google Photos.

### 4.1 Choose User Type

1. Select **"External"** (unless you have a Google Workspace organization)
   - **External**: Available to any Google account user
   - **Internal**: Only for Google Workspace organization members

2. Click **"CREATE"**

### 4.2 App Information

Fill in the OAuth consent screen details:

1. **App name**: `SORA Photo Frame` (or your preferred name)
   - This is shown to users during authorization

2. **User support email**: Select your email from the dropdown
   - Users can contact this email for support

3. **App logo**: (Optional)
   - Upload a logo image if desired (120x120px PNG)

4. **Application home page**: (Optional)
   - Example: `https://photos.yourdomain.com`
   - Or leave blank

5. **Application privacy policy link**: (Optional)
   - Link to your privacy policy (if you have one)
   - For personal use, can leave blank

6. **Application terms of service link**: (Optional)
   - Link to terms of service (if you have one)
   - For personal use, can leave blank

7. **Authorized domains**: (Optional for localhost)
   - Add your domain if using one: `yourdomain.com`
   - Not needed for `localhost`

8. **Developer contact information**: Enter your email address
   - Google uses this to contact you about your project

9. Click **"SAVE AND CONTINUE"**

### 4.3 Scopes

Add the required scopes for Google Photos access:

1. Click **"ADD OR REMOVE SCOPES"**

2. In the "Manually add scopes" section at the bottom, add:
   ```
   https://www.googleapis.com/auth/photoslibrary.readonly
   ```

3. Or use the filter/search to find:
   - **Google Photos Library API** → `photoslibrary.readonly`

4. **Select the scope** by checking the checkbox

5. **Review scope details:**
   - **Scope**: `https://www.googleapis.com/auth/photoslibrary.readonly`
   - **Description**: "View your Google Photos library"
   - **Restriction**: Sensitive

6. Click **"UPDATE"** at the bottom

7. Click **"SAVE AND CONTINUE"**

💡 **Why readonly?** SORA Frame only needs to read photos, not modify or delete them.

### 4.4 Test Users

For apps in "External" mode with "Testing" status, you must add test users:

1. Click **"+ ADD USERS"**

2. **Enter email addresses** of users who should be able to use your app:
   - Your Google account email
   - Any other Google accounts that need access
   - One email per line

3. Click **"ADD"**

4. Click **"SAVE AND CONTINUE"**

⚠️ **Important**: Only these test users can authorize the app until you publish it (see [Publishing Your App](#-publishing-your-app-for-public-use)).

### 4.5 Summary

1. Review your OAuth consent screen configuration
2. Click **"BACK TO DASHBOARD"** or **"SAVE AND CONTINUE"**

✅ **Consent screen configured!** You can now create OAuth credentials.

## 🔗 Step 5: Add Authorized Redirect URIs

The redirect URI is where Google sends users after they authorize your app. This **must match exactly** or authentication will fail.

### 5.1 Understanding Redirect URIs

**Format**: `{BASE_URL}/api/google/callback`

Where `{BASE_URL}` is how you access SORA Frame:
- No trailing slash on BASE_URL
- Must include protocol (`http://` or `https://`)
- Must include port if not 80/443
- Path must be exactly `/api/google/callback`

### 5.2 Common Redirect URI Examples

#### Local Development (same device)
```
http://localhost:3000/api/google/callback
```

#### Local Network Access (by IP)
```
http://192.168.1.100:3000/api/google/callback
```
Replace `192.168.1.100` with your device's actual IP address.

#### Production with Domain
```
https://photos.yourdomain.com/api/google/callback
```

#### Production with Domain (non-standard port)
```
https://photos.yourdomain.com:8080/api/google/callback
```

#### Custom Port
```
http://localhost:8080/api/google/callback
```

### 5.3 Adding Multiple Redirect URIs

You can add multiple URIs to support different access methods:

1. Go to **Google Cloud Console** → **APIs & Services** → **Credentials**
2. Click on your **OAuth 2.0 Client ID**
3. Under **Authorized redirect URIs**, click **"+ ADD URI"** for each URI:
   - `http://localhost:3000/api/google/callback` (localhost)
   - `http://192.168.1.100:3000/api/google/callback` (LAN IP)
   - `https://photos.yourdomain.com/api/google/callback` (production)
4. Click **"SAVE"**

💡 **Best Practice**: Add all the ways you access your frame to avoid redirect errors.

### 5.4 Finding Your IP Address

**Linux/macOS**:
```bash
# Find your local IP
hostname -I | awk '{print $1}'

# Or
ip addr show | grep "inet " | grep -v 127.0.0.1
```

**Windows**:
```cmd
ipconfig | findstr IPv4
```

**From router**: Check your router's DHCP client list or admin panel.

## ⚙️ Step 6: Configure SORA Frame

Now configure SORA Frame with your Google OAuth credentials:

### 6.1 Edit .env File

**Docker installation**:
```bash
cd /path/to/sora-digital-photo-frame
nano .env
```

**Manual installation**:
```bash
cd /path/to/sora-digital-photo-frame/server
nano .env
```

### 6.2 Add Google Photos Settings

Add or update these lines in your `.env` file:

```bash
# Enable Google Photos integration
ENABLE_GOOGLE_PHOTOS=true

# Google OAuth credentials (from Step 3)
GOOGLE_CLIENT_ID=123456789-abc123def456.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abcdefghijklmnopqrstuvw

# Redirect URI (must match exactly what you added in Google Cloud Console)
GOOGLE_REDIRECT_URI=http://localhost:3000/api/google/callback
```

⚠️ **Critical**: The `GOOGLE_REDIRECT_URI` must match **exactly** (including port and protocol) with what you configured in Google Cloud Console.

### 6.3 Verify Configuration

Check that all three Google variables are set:

```bash
grep GOOGLE .env
```

Expected output:
```
ENABLE_GOOGLE_PHOTOS=true
GOOGLE_CLIENT_ID=123456789-abc123...
GOOGLE_CLIENT_SECRET=GOCSPX-abc123...
GOOGLE_REDIRECT_URI=http://localhost:3000/api/google/callback
```

### 6.4 Restart SORA Frame

**Docker**:
```bash
docker compose down
docker compose up -d
```

**Manual**:
```bash
# Stop the server (Ctrl+C if running in foreground)
npm start
```

### 6.5 Verify Application Started

```bash
# Check health endpoint
curl http://localhost:3000/api/health

# Expected: {"status":"ok",...}
```

## 🔌 Step 7: Connect Google Photos

Now connect your Google Photos account through the admin panel:

### 7.1 Access Admin Panel

1. Open SORA Frame in your browser: `http://localhost:3000` (or your URL)
2. Log in with your admin password
3. Navigate to the **Admin Panel**: `http://localhost:3000/admin`

### 7.2 Find Google Photos Section

Look for the **Google Photos** section in the admin panel:
- It should show a "Connect Google Photos" or "Sign in with Google" button
- If you don't see this section, Google Photos might not be enabled (check Step 6)

### 7.3 Authorize Access

1. Click **"Connect Google Photos"** or **"Sign in with Google"**

2. You'll be redirected to Google's authorization page

3. **Select your Google account** (if prompted)

4. **Review permissions** - The consent screen will show:
   - App name: "SORA Photo Frame" (or your configured name)
   - Permission requested: "View your Google Photos library"

5. **For test users**: If you see "This app isn't verified" warning:
   - Click **"Advanced"**
   - Click **"Go to SORA Photo Frame (unsafe)"**
   - This is normal for testing apps - your app is safe
   - See [Troubleshooting](#this-app-isnt-verified-warning) for details

6. Click **"Allow"** to grant access

7. You'll be redirected back to SORA Frame

### 7.4 Verify Connection

After authorization:

1. You should see **"Connected to Google Photos"** or similar confirmation
2. Your Google account email should be displayed
3. You may see album sync status or photo count

### 7.5 Sync Albums

1. Click **"Sync Albums"** or **"Refresh"** to fetch your Google Photos albums
2. Wait for the sync to complete (may take a few seconds)
3. Your albums should now appear in the admin panel

### 7.6 Select Albums for Slideshow

1. Browse your synced albums
2. Select which albums you want to include in the slideshow
3. Photos from selected albums will appear in your slideshow

✅ **Success!** Your Google Photos are now integrated with SORA Frame.

## 🔧 Troubleshooting

### redirect_uri_mismatch Error

**Symptom**: Error message: "Error 400: redirect_uri_mismatch"

**Cause**: The redirect URI in your `.env` file doesn't match what's configured in Google Cloud Console.

**Solution**:

1. **Check your `.env` file**:
   ```bash
   grep GOOGLE_REDIRECT_URI .env
   ```

2. **Check Google Cloud Console**:
   - Go to [Credentials](https://console.cloud.google.com/apis/credentials)
   - Click your OAuth 2.0 Client ID
   - View **Authorized redirect URIs**

3. **Ensure exact match**:
   - Protocol (`http://` vs `https://`)
   - Domain/IP address
   - Port (if non-standard)
   - Path (`/api/google/callback`)
   - No trailing slashes

4. **Common mistakes**:
   ```bash
   # ❌ Wrong - trailing slash
   GOOGLE_REDIRECT_URI=http://localhost:3000/api/google/callback/
   
   # ❌ Wrong - missing port
   GOOGLE_REDIRECT_URI=http://192.168.1.100/api/google/callback
   
   # ❌ Wrong - incorrect path
   GOOGLE_REDIRECT_URI=http://localhost:3000/callback
   
   # ✅ Correct
   GOOGLE_REDIRECT_URI=http://localhost:3000/api/google/callback
   ```

5. **If you changed the URI**:
   - Update in Google Cloud Console
   - Wait a few minutes for changes to propagate
   - Restart SORA Frame
   - Try again

### access_denied Error

**Symptom**: Error message: "Error: access_denied"

**Cause**: Authorization was denied or the user is not a test user.

**Solution**:

1. **Check test users** (for apps in testing):
   - Go to [OAuth consent screen](https://console.cloud.google.com/apis/credentials/consent)
   - Scroll to **Test users**
   - Verify your Google account email is listed
   - Add your email if missing
   - Click **"SAVE"**

2. **Try authorization again**:
   - Clear browser cookies for Google
   - Return to SORA Frame admin panel
   - Click **"Connect Google Photos"** again

3. **Check account permissions**:
   - Ensure you're signing in with the correct Google account
   - Verify the account has access to Google Photos

### invalid_client Error

**Symptom**: Error message: "Error 401: invalid_client"

**Cause**: Client ID or Client Secret is incorrect or mismatched.

**Solution**:

1. **Verify credentials in `.env`**:
   ```bash
   grep GOOGLE_CLIENT .env
   ```

2. **Check Google Cloud Console**:
   - Go to [Credentials](https://console.cloud.google.com/apis/credentials)
   - Click your OAuth 2.0 Client ID
   - Verify **Client ID** matches your `.env`
   - Click **"Download JSON"** for the complete credentials

3. **Common issues**:
   - Extra spaces before/after values
   - Quotes around values (should be no quotes)
   - Copy/paste errors (truncated values)

4. **Fix and restart**:
   ```bash
   # Edit .env
   nano .env
   
   # Restart SORA Frame
   docker compose restart  # Docker
   # or
   npm start  # Manual
   ```

### Photos Not Syncing

**Symptom**: Albums show as empty or photos don't appear.

**Solution**:

1. **Check API is enabled**:
   - Go to [API Library](https://console.cloud.google.com/apis/library)
   - Search for "Google Photos Library API"
   - Ensure it shows "API enabled"

2. **Verify album permissions**:
   - Check if albums exist in Google Photos
   - Ensure albums contain photos
   - Try a different album

3. **Check rate limits**:
   - See [API Quotas & Limits](#-api-quotas--limits)
   - Wait a few minutes and try again

4. **Force re-sync**:
   - In admin panel, disconnect Google Photos
   - Reconnect and authorize again
   - Click "Sync Albums"

5. **Check logs**:
   ```bash
   # Docker
   docker compose logs photo-frame | grep -i google
   
   # Manual
   tail -f logs/app.log | grep -i google
   ```

### "This app isn't verified" Warning

**Symptom**: Google shows "This app isn't verified" warning during authorization.

**Cause**: Your app is in testing status and hasn't been verified by Google.

**Solution**:

**For Personal Use** (Recommended):
1. Click **"Advanced"**
2. Click **"Go to SORA Photo Frame (unsafe)"**
3. Proceed with authorization
4. This is safe - it's your own app
5. You'll see this warning every time until the app is published

**To Remove Warning** (Optional):
- Publish your app (see [Publishing Your App](#-publishing-your-app-for-public-use))
- Or request verification from Google (complex process for public apps)

💡 **Note**: For personal use, the warning is harmless and can be safely ignored.

### Rate Limit Errors

**Symptom**: Error messages about quota exceeded or rate limits.

**Cause**: Too many API requests in a short time.

**Solution**:

1. **Wait**: Rate limits reset after time (usually 1 minute to 1 hour)

2. **Check quotas**:
   - Go to [API Dashboard](https://console.cloud.google.com/apis/dashboard)
   - Check "Google Photos Library API" metrics
   - Review quota limits

3. **Reduce sync frequency**:
   - Don't sync albums too frequently
   - Sync only when needed, not continuously

4. **Request quota increase** (if needed):
   - Go to [Quotas](https://console.cloud.google.com/apis/api/photoslibrary.googleapis.com/quotas)
   - Request increase if using heavily

See [API Quotas & Limits](#-api-quotas--limits) for more details.

### Token Expired or Invalid

**Symptom**: Previously working connection stops working with token errors.

**Solution**:

1. **Reconnect Google Photos**:
   - Go to admin panel
   - Click "Disconnect Google Photos"
   - Click "Connect Google Photos" again
   - Re-authorize

2. **Check token storage**:
   ```bash
   # Docker
   docker compose exec photo-frame ls -la /app/data
   
   # Manual
   ls -la server/data
   ```
   Look for Google token files

3. **Clear cached tokens**:
   - In admin panel, disconnect Google Photos
   - Delete token files from data directory (if accessible)
   - Reconnect

## 📤 Publishing Your App (For Public Use)

If you want to share your SORA Frame instance with others (beyond test users):

### When to Publish

- ✅ Personal use with only your accounts: **Keep in testing** (no need to publish)
- ✅ Sharing with family/friends (small group): **Add as test users** (up to 100)
- ⚠️ Public access or wide distribution: **Publish the app**

### Publishing Steps

1. **Go to OAuth consent screen**:
   - [OAuth Consent Screen](https://console.cloud.google.com/apis/credentials/consent)

2. **Prepare for verification**:
   - Add privacy policy URL
   - Add terms of service URL
   - Add verified domain
   - Review all app information

3. **Submit for verification**:
   - Click **"PUBLISH APP"**
   - Click **"Prepare for verification"**
   - Fill out the verification form
   - Submit to Google for review

4. **Wait for approval**:
   - Verification takes 4-6 weeks typically
   - Google will review your app for security and privacy
   - You may need to provide additional information

### Alternative: Keep in Testing

For most personal use cases, keeping the app in testing mode is sufficient:
- Add up to 100 test users
- No verification needed
- Users will see "unverified app" warning (can be bypassed)
- Suitable for family, friends, or internal use

## 🔒 Security & Privacy

### Data Protection

- **Read-only access**: SORA Frame can only view photos, not modify or delete
- **OAuth 2.0**: Industry-standard secure authentication
- **Token storage**: Access tokens are stored securely on your server
- **No photo storage**: Photos are not permanently stored by SORA Frame
- **Revokable access**: You can revoke access anytime

### Revoking Access

To disconnect Google Photos:

**Option 1: Through SORA Frame**
1. Go to admin panel
2. Click "Disconnect Google Photos"

**Option 2: Through Google Account**
1. Go to [Google Account - Third-party apps](https://myaccount.google.com/permissions)
2. Find "SORA Photo Frame" (or your app name)
3. Click **"Remove Access"**

### Best Practices

- ✅ Use HTTPS in production
- ✅ Keep `GOOGLE_CLIENT_SECRET` confidential
- ✅ Never commit secrets to version control
- ✅ Regularly review connected apps in your Google account
- ✅ Use strong admin password for SORA Frame
- ✅ Restrict network access if possible (firewall)

## 📊 API Quotas & Limits

### Default Quotas (Free Tier)

Google Photos Library API has the following default quotas:

| Quota | Limit |
|-------|-------|
| **Queries per day** | 10,000 |
| **Queries per 100 seconds** | 1,000 |
| **Queries per 100 seconds per user** | 100 |

### What This Means

- **Typical usage**: 10,000 queries/day is sufficient for personal use
- **Sync frequency**: Syncing albums uses 1-10 queries depending on album size
- **Photo loading**: Each photo displayed uses 1 query
- **Shared instances**: Multiple users share the daily quota

### Monitoring Usage

1. Go to [API Dashboard](https://console.cloud.google.com/apis/dashboard)
2. Select "Google Photos Library API"
3. View usage metrics and quota consumption

### Requesting Quota Increase

If you need more quota:

1. Go to [Quotas page](https://console.cloud.google.com/apis/api/photoslibrary.googleapis.com/quotas)
2. Select the quota to increase
3. Click "EDIT QUOTAS"
4. Fill out the request form with justification
5. Submit and wait for approval

### Optimizing API Usage

- Sync albums only when needed, not continuously
- Cache album and photo metadata
- Use reasonable slideshow intervals
- Avoid rapid manual refreshes

## ✅ Complete Configuration Example

Here's a complete working example of Google Photos setup:

### 1. Google Cloud Console Configuration

- **Project Name**: SORA Photo Frame
- **Project ID**: sora-photo-frame-123456
- **API Enabled**: Google Photos Library API ✅
- **OAuth Client Type**: Web application
- **Authorized redirect URIs**:
  - `http://localhost:3000/api/google/callback`
  - `http://192.168.1.100:3000/api/google/callback`
  - `https://photos.example.com/api/google/callback`
- **Consent Screen**: External, Testing
- **Test Users**: your-email@gmail.com
- **Scopes**: `https://www.googleapis.com/auth/photoslibrary.readonly`

### 2. SORA Frame .env Configuration

```bash
# Session and auth (required)
SESSION_SECRET=Xy9ZpQ2rWvN3jK8mL5nT6uB7cV4xF1gH0aS2dE9fR8qW3eR4tY5uI6oP7
ADMIN_PASSWORD=$2b$10$abcdefghijklmnopqrstuvwxyz

# Server config
NODE_ENV=production
PORT=3000

# Google Photos Integration
ENABLE_GOOGLE_PHOTOS=true
GOOGLE_CLIENT_ID=123456789-abc123def456ghi789jkl.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abcdefghijklmnopqrstuvwxyz
GOOGLE_REDIRECT_URI=http://localhost:3000/api/google/callback

# Image settings
IMAGE_QUALITY=85
MAX_RESOLUTION_WIDTH=1920
MAX_RESOLUTION_HEIGHT=1080
DEFAULT_SLIDESHOW_INTERVAL=15000
```

### 3. Verification Checklist

- ✅ Google Cloud project created
- ✅ Google Photos Library API enabled
- ✅ OAuth 2.0 credentials created
- ✅ Redirect URIs match exactly
- ✅ Test users added (if in testing)
- ✅ `.env` file configured with credentials
- ✅ SORA Frame restarted
- ✅ Successfully connected in admin panel
- ✅ Albums synced and visible
- ✅ Photos appear in slideshow

## 🎉 Success!

You've successfully set up Google Photos integration with SORA Frame!

### Next Steps

- Explore [Features](Features) to learn about all capabilities
- Check [Configuration Guide](Configuration-Guide) for advanced settings
- Visit [Troubleshooting](Troubleshooting) if you encounter issues

### Quick Reference

**To connect**: Admin panel → Connect Google Photos → Authorize  
**To sync**: Admin panel → Sync Albums  
**To disconnect**: Admin panel → Disconnect Google Photos  
**To reconnect**: Simply connect again (re-authorization needed)

---

**Questions?** Check the [Troubleshooting section](#-troubleshooting) or visit [GitHub Discussions](https://github.com/TLMInit/sora-digital-photo-frame/discussions).
