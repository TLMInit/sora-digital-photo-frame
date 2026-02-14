# ⚙️ Configuration Guide

This guide provides detailed information about configuring SORA Digital Photo Frame through environment variables in the `.env` file.

## 📋 Table of Contents

- [Quick Start Configuration](#-quick-start-configuration)
- [Environment File Location](#-environment-file-location)
- [Required Settings](#-required-settings)
- [Server Configuration](#-server-configuration)
- [Authentication Settings](#-authentication-settings)
- [Upload Configuration](#-upload-configuration)
- [Image Processing](#-image-processing)
- [Slideshow Configuration](#-slideshow-configuration)
- [Google Photos Integration](#-google-photos-integration)
- [Docker-Specific Settings](#-docker-specific-settings)
- [Default Folders Configuration](#-default-folders-configuration)
- [Security Best Practices](#-security-best-practices)
- [Example Configurations](#-example-configurations)
- [Complete .env Template](#-complete-env-template)
- [Validation and Troubleshooting](#-validation-and-troubleshooting)

## 🚀 Quick Start Configuration

**Minimum required configuration for Docker:**

```bash
# Copy the example file
cp .env.example .env

# Edit with your values
SESSION_SECRET=your-very-long-random-secret-key-min-32-chars
ADMIN_PASSWORD=YourSecurePassword123!
```

That's it! The application will use sensible defaults for everything else.

## 📁 Environment File Location

The `.env` file location depends on your installation method:

### Docker Installation
```
/path/to/sora-digital-photo-frame/.env
```
The `.env` file should be in the same directory as `docker-compose.yml`.

### Manual Installation
```
/path/to/sora-digital-photo-frame/server/.env
```
The `.env` file should be in the `server/` directory alongside `server.js`.

💡 **Tip**: Use the provided `.env.example` as a template:
```bash
cp .env.example .env
```

## 🔐 Required Settings

### SESSION_SECRET

**Purpose**: Encrypts session cookies for security

**Required**: Yes ✅

**Format**: Long random string (minimum 32 characters recommended)

**Example**:
```bash
SESSION_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

**How to Generate**:

**Linux/macOS**:
```bash
# Using openssl (recommended)
openssl rand -base64 32

# Using /dev/urandom
cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1

# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Windows PowerShell**:
```powershell
# Using .NET
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})

# Or with Base64
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

**Windows Command Prompt**:
```cmd
# Generate manually or use an online generator
# Example: use a password manager to generate a 32+ character random string
```

⚠️ **Security Warning**: Never commit your `SESSION_SECRET` to version control!

### ADMIN_PASSWORD

**Purpose**: Password for admin panel access

**Required**: Highly Recommended ✅

**Format**: Plain text or bcrypt hash

**Default**: `admin123` (⚠️ CHANGE THIS!)

#### Option 1: Plain Text Password (Development)

```bash
ADMIN_PASSWORD=MySecurePassword123!
```

**Pros**: Simple to set up  
**Cons**: Stored in plain text in .env file  
**Use case**: Development environments, personal use

#### Option 2: Bcrypt Hashed Password (Production)

```bash
ADMIN_PASSWORD=$2b$10$abcdefghijklmnopqrstuvwxyz1234567890ABCDEF
```

**Pros**: Secure, hashed password  
**Cons**: Requires generation step  
**Use case**: Production environments, public-facing deployments

**How to Generate Bcrypt Hash**:

**Using Node.js** (if Node.js is installed):
```bash
# Install bcryptjs if not already installed
npm install -g bcryptjs

# Generate hash
node -e "console.log(require('bcryptjs').hashSync('YourPassword', 10))"
```

**Using Online Tools**:
- Visit [bcrypt-generator.com](https://bcrypt-generator.com/)
- Enter your password
- Use cost factor 10 (default)
- Copy the generated hash

**Using Docker** (without Node.js installed locally):
```bash
docker run --rm -it node:18 node -e "console.log(require('bcryptjs').hashSync('YourPassword', 10))"
```

💡 **Tip**: The application automatically detects whether the password is plain text or bcrypt hashed.

## 🖥️ Server Configuration

### PORT

**Purpose**: Port the server listens on

**Required**: No

**Default**: `3000`

**Format**: Integer (1-65535)

**Example**:
```bash
PORT=8080
```

**Notes**:
- For Docker, use `CONTAINER_PORT` instead (see Docker-Specific Settings)
- Common ports: 80 (HTTP), 443 (HTTPS), 3000, 8080

### NODE_ENV

**Purpose**: Node.js environment mode

**Required**: No

**Default**: `development` (manual install), `production` (Docker)

**Options**: `development`, `production`, `test`

**Example**:
```bash
NODE_ENV=production
```

**Impact**:
- **development**: Verbose logging, no caching, auto-reload (with nodemon)
- **production**: Minimal logging, optimized performance, caching enabled
- **test**: Used for running tests

## 🔑 Authentication Settings

Authentication is controlled through `SESSION_SECRET` and `ADMIN_PASSWORD` (see [Required Settings](#-required-settings)).

**Additional Options**:

### Session Configuration

Sessions are automatically configured with secure defaults:
- **Session Duration**: 24 hours
- **Cookie Security**: Enabled in production (HTTPS required)
- **HTTP Only**: Yes (prevents XSS attacks)
- **Same Site**: Lax (CSRF protection)

💡 **Note**: Session configuration is handled internally and doesn't require additional environment variables.

## 📤 Upload Configuration

### MAX_FILE_SIZE

**Purpose**: Maximum file size for photo uploads (in bytes)

**Required**: No

**Default**: `10485760` (10 MB)

**Format**: Integer (bytes)

**Examples**:
```bash
# 10 MB (default)
MAX_FILE_SIZE=10485760

# 20 MB
MAX_FILE_SIZE=20971520

# 50 MB
MAX_FILE_SIZE=52428800

# 100 MB
MAX_FILE_SIZE=104857600
```

**Common Size Conversions**:
| Size | Bytes |
|------|-------|
| 5 MB | 5242880 |
| 10 MB | 10485760 |
| 20 MB | 20971520 |
| 50 MB | 52428800 |
| 100 MB | 104857600 |

**Formula**: `MB × 1024 × 1024 = Bytes`

⚠️ **Note**: Large files require more memory for processing. Ensure adequate system resources.

### UPLOAD_DIR

**Purpose**: Directory path for storing uploaded photos

**Required**: No

**Default**: `uploads`

**Format**: Relative or absolute path

**Examples**:
```bash
# Relative path (default)
UPLOAD_DIR=uploads

# Absolute path
UPLOAD_DIR=/var/photos/uploads

# Custom location
UPLOAD_DIR=/mnt/storage/sora-photos
```

**Notes**:
- Relative paths are relative to the server directory
- Ensure the directory has write permissions
- For Docker, use volumes instead of changing this setting

## 🖼️ Image Processing

### IMAGE_QUALITY

**Purpose**: JPEG compression quality for processed images

**Required**: No

**Default**: `85`

**Format**: Integer (0-100)

**Range**: 
- `0` = Lowest quality, smallest file size
- `100` = Highest quality, largest file size

**Examples**:
```bash
# High quality (larger files)
IMAGE_QUALITY=95

# Balanced quality (default)
IMAGE_QUALITY=85

# Lower quality (smaller files, faster processing)
IMAGE_QUALITY=75

# Web optimized
IMAGE_QUALITY=80
```

**Recommendations**:
| Use Case | Quality | File Size | Visual Quality |
|----------|---------|-----------|----------------|
| High-res displays | 90-95 | Large | Excellent |
| Balanced | 85 | Medium | Very Good |
| Web/mobile | 75-80 | Small | Good |
| Bandwidth limited | 65-75 | Very Small | Acceptable |

### MAX_RESOLUTION_WIDTH

**Purpose**: Maximum width for resized images (in pixels)

**Required**: No

**Default**: `1920`

**Format**: Integer (pixels)

**Examples**:
```bash
# Full HD (default)
MAX_RESOLUTION_WIDTH=1920

# 4K displays
MAX_RESOLUTION_WIDTH=3840

# HD displays
MAX_RESOLUTION_WIDTH=1280

# Tablet optimized
MAX_RESOLUTION_WIDTH=1024
```

### MAX_RESOLUTION_HEIGHT

**Purpose**: Maximum height for resized images (in pixels)

**Required**: No

**Default**: `1080`

**Format**: Integer (pixels)

**Examples**:
```bash
# Full HD (default)
MAX_RESOLUTION_HEIGHT=1080

# 4K displays
MAX_RESOLUTION_HEIGHT=2160

# HD displays
MAX_RESOLUTION_HEIGHT=720

# Tablet optimized
MAX_RESOLUTION_HEIGHT=768
```

**Common Resolution Presets**:
| Display | Width | Height | Preset Name |
|---------|-------|--------|-------------|
| 4K UHD | 3840 | 2160 | 4K |
| Full HD | 1920 | 1080 | 1080p (default) |
| HD | 1280 | 720 | 720p |
| iPad Pro | 2048 | 2732 | Tablet |
| Standard | 1024 | 768 | SD |

**Notes**:
- Images larger than these dimensions are automatically resized
- Aspect ratio is always preserved
- Smaller images are not upscaled
- Higher resolutions require more memory and processing time

## 🎬 Slideshow Configuration

### DEFAULT_SLIDESHOW_INTERVAL

**Purpose**: Time between slides in milliseconds

**Required**: No

**Default**: `15000` (15 seconds)

**Format**: Integer (milliseconds)

**Examples**:
```bash
# 5 seconds
DEFAULT_SLIDESHOW_INTERVAL=5000

# 10 seconds
DEFAULT_SLIDESHOW_INTERVAL=10000

# 15 seconds (default)
DEFAULT_SLIDESHOW_INTERVAL=15000

# 30 seconds
DEFAULT_SLIDESHOW_INTERVAL=30000

# 1 minute
DEFAULT_SLIDESHOW_INTERVAL=60000

# 5 minutes
DEFAULT_SLIDESHOW_INTERVAL=300000
```

**Common Interval Conversions**:
| Duration | Milliseconds |
|----------|--------------|
| 3 seconds | 3000 |
| 5 seconds | 5000 |
| 10 seconds | 10000 |
| 15 seconds | 15000 |
| 30 seconds | 30000 |
| 1 minute | 60000 |
| 2 minutes | 120000 |
| 5 minutes | 300000 |

**Formula**: `Seconds × 1000 = Milliseconds`

**Recommendations**:
- **5-10 seconds**: Fast-paced, many photos
- **15-20 seconds**: Balanced (default)
- **30-60 seconds**: Slow, contemplative viewing
- **2+ minutes**: Background display

## ☁️ Google Photos Integration

For detailed setup instructions, see the [Google Photos Setup](Google-Photos-Setup) guide.

### ENABLE_GOOGLE_PHOTOS

**Purpose**: Enable or disable Google Photos integration

**Required**: No

**Default**: `false`

**Format**: `true` or `false`

**Example**:
```bash
ENABLE_GOOGLE_PHOTOS=true
```

### GOOGLE_CLIENT_ID

**Purpose**: OAuth 2.0 Client ID from Google Cloud Console

**Required**: Only if Google Photos is enabled

**Format**: String (Google Client ID)

**Example**:
```bash
GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
```

**How to Get**: See [Google Photos Setup Guide](Google-Photos-Setup) Step 3

### GOOGLE_CLIENT_SECRET

**Purpose**: OAuth 2.0 Client Secret from Google Cloud Console

**Required**: Only if Google Photos is enabled

**Format**: String (Google Client Secret)

**Example**:
```bash
GOOGLE_CLIENT_SECRET=GOCSPX-abcdefghijklmnopqrstuvwxyz
```

**How to Get**: See [Google Photos Setup Guide](Google-Photos-Setup) Step 3

⚠️ **Security Warning**: Never commit client secrets to version control!

### GOOGLE_REDIRECT_URI

**Purpose**: OAuth 2.0 callback URL

**Required**: Only if Google Photos is enabled

**Format**: Full URL with protocol

**Examples**:
```bash
# Local development
GOOGLE_REDIRECT_URI=http://localhost:3000/api/google/callback

# Production with domain
GOOGLE_REDIRECT_URI=https://photos.yourdomain.com/api/google/callback

# Production with IP
GOOGLE_REDIRECT_URI=http://192.168.1.100:3000/api/google/callback
```

**Format Rules**:
- Must include protocol (`http://` or `https://`)
- Must include full domain or IP
- Must include port if not 80/443
- Must end with `/api/google/callback`
- Must match exactly what's configured in Google Cloud Console

💡 **Complete Guide**: See [Google Photos Setup](Google-Photos-Setup) for step-by-step configuration.

## 🐳 Docker-Specific Settings

These settings only apply when using Docker:

### HOST_PORT

**Purpose**: External port on the host machine

**Required**: No

**Default**: `3000`

**Format**: Integer (1-65535)

**Example**:
```bash
# Default
HOST_PORT=3000

# Custom port
HOST_PORT=8080

# HTTP port (requires root/privileges)
HOST_PORT=80
```

**Usage**: Access the app at `http://localhost:HOST_PORT`

### CONTAINER_PORT

**Purpose**: Internal port inside the Docker container

**Required**: No

**Default**: `3000`

**Format**: Integer (1-65535)

**Example**:
```bash
CONTAINER_PORT=3000
```

**Notes**:
- Usually no need to change this
- Must match the `PORT` setting in docker-compose.yml
- Only change if you know what you're doing

### Docker Volume Configuration

Volumes are configured in `docker-compose.yml`, not `.env`:

```yaml
volumes:
  - photo-uploads:/app/uploads    # Uploaded photos
  - photo-data:/app/data          # Application data
  - photo-logs:/app/logs          # Application logs
```

**To access volume data**:
```bash
# List volumes
docker volume ls

# Inspect volume
docker volume inspect sora-digital-photo-frame_photo-uploads

# Backup volume
docker run --rm -v sora-digital-photo-frame_photo-uploads:/data -v $(pwd):/backup alpine tar czf /backup/photos-backup.tar.gz /data
```

## 📁 Default Folders Configuration

### DEFAULT_FOLDERS

**Purpose**: Comma-separated list of folders to create on first run

**Required**: No

**Default**: `family,vacation,holidays,misc`

**Format**: Comma-separated folder names (no spaces)

**Examples**:
```bash
# Default folders
DEFAULT_FOLDERS=family,vacation,holidays,misc

# Simple setup
DEFAULT_FOLDERS=photos

# Organized structure
DEFAULT_FOLDERS=2024,2023,2022,favorites

# Custom categories
DEFAULT_FOLDERS=pets,travel,events,memories,daily
```

**Notes**:
- Folders are created only if they don't already exist
- No spaces in folder names
- Use commas to separate multiple folders
- Can be empty for no default folders

## 🔒 Security Best Practices

### Development Environment

```bash
# Minimal security (development only)
SESSION_SECRET=$(openssl rand -base64 32)
ADMIN_PASSWORD=admin123
NODE_ENV=development
```

### Production Environment

```bash
# Strong security (production)
SESSION_SECRET=$(openssl rand -base64 48)  # Longer secret
ADMIN_PASSWORD=$2b$10$... # Bcrypt hashed password
NODE_ENV=production

# Use HTTPS with reverse proxy
# Change default ports if publicly accessible
# Enable firewall rules
```

### Security Checklist

- ✅ Use a strong, random `SESSION_SECRET` (32+ characters)
- ✅ Change `ADMIN_PASSWORD` from default
- ✅ Use bcrypt hashed passwords in production
- ✅ Never commit `.env` file to git (it's in `.gitignore`)
- ✅ Use HTTPS in production (reverse proxy with SSL)
- ✅ Set `NODE_ENV=production` in production
- ✅ Regularly update dependencies (`npm update`)
- ✅ Use firewall rules to restrict access
- ✅ Keep `GOOGLE_CLIENT_SECRET` confidential
- ✅ Regularly backup your data volumes
- ✅ Monitor logs for suspicious activity

### Environment-Specific .gitignore

The repository includes a `.gitignore` file that prevents `.env` from being committed:

```gitignore
# Environment files
.env
.env.local
.env.*.local
```

⚠️ **Never** commit secrets to version control!

## 📋 Example Configurations

### Example 1: Development - Minimal Setup

```bash
# .env for local development
SESSION_SECRET=dev-secret-key-minimum-32-characters-long-random-string
ADMIN_PASSWORD=admin123
NODE_ENV=development
PORT=3000
```

### Example 2: Production - Basic

```bash
# .env for production (basic)
SESSION_SECRET=Xy9ZpQ2rWvN3jK8mL5nT6uB7cV4xF1gH0aS2dE9fR8qW3eR4tY5uI6oP7
ADMIN_PASSWORD=$2b$10$xyzABC123... # Use bcrypt hash!
NODE_ENV=production
PORT=3000

# Image settings
IMAGE_QUALITY=90
MAX_RESOLUTION_WIDTH=1920
MAX_RESOLUTION_HEIGHT=1080

# Slideshow
DEFAULT_SLIDESHOW_INTERVAL=15000
```

### Example 3: Production - With Google Photos

```bash
# .env for production with Google Photos
SESSION_SECRET=Xy9ZpQ2rWvN3jK8mL5nT6uB7cV4xF1gH0aS2dE9fR8qW3eR4tY5uI6oP7
ADMIN_PASSWORD=$2b$10$xyzABC123...
NODE_ENV=production
PORT=3000

# Google Photos Integration
ENABLE_GOOGLE_PHOTOS=true
GOOGLE_CLIENT_ID=123456789-abcdefg.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abcdefghijklmnop
GOOGLE_REDIRECT_URI=https://photos.yourdomain.com/api/google/callback

# Image processing
IMAGE_QUALITY=85
MAX_RESOLUTION_WIDTH=1920
MAX_RESOLUTION_HEIGHT=1080

# Slideshow
DEFAULT_SLIDESHOW_INTERVAL=20000
```

### Example 4: Docker - Custom Port

```bash
# .env for Docker with custom port
SESSION_SECRET=Xy9ZpQ2rWvN3jK8mL5nT6uB7cV4xF1gH0aS2dE9fR8qW3eR4tY5uI6oP7
ADMIN_PASSWORD=MySecurePassword123!
NODE_ENV=production

# Docker settings
HOST_PORT=8080          # Access at http://localhost:8080
CONTAINER_PORT=3000

# Image settings
IMAGE_QUALITY=85
MAX_FILE_SIZE=20971520  # 20 MB
```

### Example 5: High Performance - 4K Display

```bash
# .env for 4K displays
SESSION_SECRET=Xy9ZpQ2rWvN3jK8mL5nT6uB7cV4xF1gH0aS2dE9fR8qW3eR4tY5uI6oP7
ADMIN_PASSWORD=$2b$10$xyzABC123...
NODE_ENV=production
PORT=3000

# High-res image processing
IMAGE_QUALITY=95
MAX_RESOLUTION_WIDTH=3840
MAX_RESOLUTION_HEIGHT=2160
MAX_FILE_SIZE=52428800  # 50 MB for high-res photos

# Slower slideshow for detailed viewing
DEFAULT_SLIDESHOW_INTERVAL=30000  # 30 seconds
```

## 📝 Complete .env Template

Here's a complete, annotated `.env` template with all available options:

```bash
# ============================================
# SORA Digital Photo Frame Configuration
# ============================================

# ----------------
# Required Settings
# ----------------

# Session encryption key (REQUIRED)
# Generate with: openssl rand -base64 32
SESSION_SECRET=your-very-long-random-secret-key-minimum-32-characters

# Admin panel password (REQUIRED)
# Use plain text or bcrypt hash
# Generate bcrypt: node -e "console.log(require('bcryptjs').hashSync('YourPassword', 10))"
ADMIN_PASSWORD=YourSecurePassword123!

# ----------------
# Server Configuration
# ----------------

# Server port (default: 3000)
PORT=3000

# Node environment (development, production, test)
NODE_ENV=production

# ----------------
# Upload Configuration
# ----------------

# Maximum file size in bytes (default: 10485760 = 10 MB)
# 5 MB = 5242880, 20 MB = 20971520, 50 MB = 52428800
MAX_FILE_SIZE=10485760

# Upload directory (default: uploads)
UPLOAD_DIR=uploads

# ----------------
# Image Processing
# ----------------

# JPEG quality (0-100, default: 85)
IMAGE_QUALITY=85

# Maximum image resolution
# Full HD: 1920x1080, 4K: 3840x2160
MAX_RESOLUTION_WIDTH=1920
MAX_RESOLUTION_HEIGHT=1080

# ----------------
# Slideshow Configuration
# ----------------

# Interval between slides in milliseconds (default: 15000 = 15 seconds)
# 5s = 5000, 10s = 10000, 30s = 30000, 1min = 60000
DEFAULT_SLIDESHOW_INTERVAL=15000

# ----------------
# Random Image Configuration
# ----------------

# Maximum number of recent images to track for random selection
MAX_RECENT_IMAGES=10

# Image cache expiry in milliseconds (default: 60000 = 1 minute)
IMAGE_CACHE_EXPIRY=60000

# ----------------
# Default Folders
# ----------------

# Comma-separated list of default folders to create
DEFAULT_FOLDERS=family,vacation,holidays,misc

# ----------------
# Google Photos Integration (Optional)
# ----------------

# Enable Google Photos (true/false, default: false)
ENABLE_GOOGLE_PHOTOS=false

# Google OAuth Credentials (required if enabled)
# See: https://console.cloud.google.com/
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/google/callback

# ----------------
# Docker-Specific Settings
# ----------------

# External port on host machine (Docker only)
HOST_PORT=3000

# Internal container port (Docker only)
CONTAINER_PORT=3000
```

## ✅ Validation and Troubleshooting

### Validate Configuration

After editing `.env`, verify your configuration:

```bash
# Check if required variables are set
grep SESSION_SECRET .env
grep ADMIN_PASSWORD .env

# Test the application starts
# Docker:
docker compose up

# Manual:
cd server && npm start
```

### Common Configuration Issues

#### Issue: "SESSION_SECRET is not set"

**Solution**:
```bash
# Generate and add to .env
echo "SESSION_SECRET=$(openssl rand -base64 32)" >> .env
```

#### Issue: "Cannot connect to application"

**Check**:
```bash
# Verify port is not in use
lsof -i :3000  # Linux/macOS
netstat -ano | findstr :3000  # Windows

# Check .env has correct PORT
grep PORT .env

# For Docker, check HOST_PORT
grep HOST_PORT .env
```

#### Issue: "Permission denied" on uploads

**Solution**:
```bash
# Check upload directory permissions
ls -la uploads/  # Should be writable

# Fix permissions
chmod 755 uploads/
```

#### Issue: "Google Photos not working"

**Check**:
```bash
# Verify all Google variables are set
grep GOOGLE .env

# Ensure redirect URI matches exactly
# Format: http://domain:port/api/google/callback
```

**See**: [Google Photos Setup](Google-Photos-Setup) for detailed troubleshooting

### Environment Validation Checklist

- ✅ `.env` file exists in correct location
- ✅ `SESSION_SECRET` is set and 32+ characters
- ✅ `ADMIN_PASSWORD` is set and changed from default
- ✅ `PORT` or `HOST_PORT` is not in use
- ✅ File paths (UPLOAD_DIR) exist and are writable
- ✅ Image processing values are reasonable
- ✅ Google Photos variables are complete (if enabled)
- ✅ No syntax errors (no spaces around `=`)

### Check Current Configuration

```bash
# View current configuration (hides secrets)
docker compose config

# Or for manual installation
cat server/.env | grep -v SECRET | grep -v PASSWORD
```

## 🔧 Next Steps

- **Installed already?** Fine-tune your configuration
- **Google Photos:** Set up [Google Photos Integration](Google-Photos-Setup)
- **Need help?** Check the [Troubleshooting](Troubleshooting) guide
- **Learn more:** Explore [Features](Features) documentation

---

**Configuration complete!** 🎉 Your SORA Frame is ready to use. Visit `/admin` to start uploading photos!
