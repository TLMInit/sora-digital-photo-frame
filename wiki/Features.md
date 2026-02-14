# 🌟 Features

SORA Digital Photo Frame is packed with features designed to provide a beautiful, easy-to-use photo viewing experience. This guide covers all features in detail.

## 📋 Table of Contents

- [Core Features](#-core-features)
- [Slideshow Features](#-slideshow-features)
- [Admin Panel Features](#-admin-panel-features)
- [Keyboard Shortcuts](#-keyboard-shortcuts)
- [Authentication & Security](#-authentication--security)
- [Image Processing](#-image-processing)
- [Google Photos Integration](#-google-photos-integration)
- [Docker Support](#-docker-support)
- [Advanced Features](#-advanced-features)
- [Browser Compatibility](#-browser-compatibility)
- [Performance Metrics](#-performance-metrics)

## 🎯 Core Features

### Beautiful Full-Screen Slideshow

- **Smooth transitions**: Elegant fade effects between photos
- **Auto-advance**: Configurable interval (default: 15 seconds)
- **Smart randomization**: Avoids showing the same photo repeatedly
- **Aspect ratio preservation**: Photos display correctly without distortion
- **High-quality rendering**: Sharp images optimized for your display
- **Background color**: Clean black background for focus on photos

### Remote Management

- **Web-based admin panel**: Manage photos from any device on your network
- **No app installation required**: Works in any modern web browser
- **Multi-device support**: Access from phones, tablets, laptops simultaneously
- **Responsive design**: Optimized for all screen sizes
- **Real-time updates**: Changes reflect immediately in the slideshow

### Folder Organization

- **Nested folder structure**: Organize photos in hierarchical folders
- **Unlimited depth**: Create as many subfolders as needed
- **Drag-and-drop**: Easy file and folder manipulation
- **Finder-like interface**: Intuitive navigation similar to file explorers
- **Targeted slideshows**: Display photos from specific folders
- **Folder memory**: Last selected folder is remembered across sessions
- **Breadcrumb navigation**: Easy navigation through folder hierarchy

### Google Photos Integration

- **Read-only access**: Safely view your Google Photos library
- **Album sync**: Automatically sync albums from Google Photos
- **OAuth 2.0 security**: Industry-standard authentication
- **On-demand loading**: Photos fetched as needed (not stored locally)
- **Album selection**: Choose which albums to include in slideshow
- **Automatic updates**: New photos appear automatically

📖 **Setup Guide**: See [Google Photos Setup](Google-Photos-Setup) for detailed instructions.

### Modern UI Design

- **Material Design 3**: Clean, modern interface following Google's design system
- **Dark/Light mode**: Automatic theme switching based on system preference
- **Smooth animations**: Polished transitions and interactions
- **Icon system**: Clear, recognizable Material Icons
- **Typography**: Beautiful Nunito font family
- **Color system**: Cohesive color palette with proper contrast
- **Accessibility**: Semantic HTML and ARIA labels

### Always On Display

- **Wake Lock API**: Prevents screen from sleeping during slideshow
- **Automatic activation**: Enabled when slideshow is playing
- **Battery-friendly**: Releases wake lock when paused
- **Cross-platform**: Works on supported devices and browsers
- **Fallback behavior**: Graceful degradation on unsupported browsers

### Security & Authentication

- **Password-protected admin**: Secure access to management features
- **Session-based auth**: Industry-standard session management
- **Bcrypt password hashing**: Optional secure password storage
- **Session encryption**: Encrypted cookies with secure secrets
- **HTTP-only cookies**: Protection against XSS attacks
- **CSRF protection**: SameSite cookie policy
- **Automatic logout**: Session expiry after inactivity

## 🎬 Slideshow Features

### Playback Controls

- **Play/Pause**: Toggle automatic advancement
- **Manual navigation**: Skip to next image instantly
- **Progress indicator**: Visual progress bar showing time until next image
- **Resume position**: Continues from last viewed photo on refresh

### Display Options

- **Fullscreen mode**: Immersive viewing experience
- **Image information**: Toggle photo details overlay
  - Filename
  - Folder path
  - File size
  - Dimensions
  - Upload date
- **Cursor auto-hide**: Mouse cursor hides after 3 seconds of inactivity
- **Controls fade-out**: UI controls hide during playback for clean viewing

### Folder Selection

- **Interactive selector**: Click folder icon to choose photo source
- **All photos mode**: Display photos from all folders
- **Specific folder**: View photos from a single folder and its subfolders
- **Nested folder support**: Navigate through folder hierarchy
- **Session persistence**: Selected folder remembered across page reloads
- **Instant updates**: Slideshow updates immediately on folder change

### Smart Randomization

- **True random selection**: Photos displayed in random order
- **Recent photo tracking**: Prevents immediate repeats (tracks last 10 photos)
- **Efficient algorithm**: Fast selection even with thousands of photos
- **Fair distribution**: All photos have equal chance of being shown
- **Cache optimization**: Minimal memory footprint

## 🛠️ Admin Panel Features

### Photo Upload

- **Drag-and-drop**: Drag files directly into the admin panel
- **Multi-file upload**: Upload multiple photos at once
- **Upload button**: Traditional file picker for selecting photos
- **Progress indicator**: Visual feedback during upload
- **Format support**: JPEG, PNG, WebP, GIF
- **Size validation**: Configurable maximum file size (default: 10 MB)
- **Auto-processing**: Images automatically optimized on upload

### Folder Management

- **Create folders**: Add new folders at any level
- **Delete folders**: Remove folders and their contents
- **Rename support**: Modify folder names (via delete and recreate)
- **Nested structure**: Create complex hierarchies
- **Breadcrumb navigation**: Easy traversal through folders
- **Visual hierarchy**: Clear parent-child relationships

### Photo Management

- **Delete photos**: Remove individual photos
- **Bulk operations**: Select and delete multiple photos (via folder deletion)
- **Preview thumbnails**: See photo previews in admin panel
- **Photo details**: View filename, size, and metadata
- **Search**: Find photos by name (browser search functionality)

### Interface Features

- **Responsive layout**: Adapts to screen size
- **Touch-friendly**: Works great on tablets
- **Keyboard navigation**: Full keyboard support
- **Loading states**: Clear feedback during operations
- **Error handling**: User-friendly error messages
- **Toast notifications**: Non-intrusive success/error messages

## ⌨️ Keyboard Shortcuts

### Slideshow Shortcuts

| Key | Action | Description |
|-----|--------|-------------|
| `Space` or `K` | Play/Pause | Toggle automatic slideshow advancement |
| `→` (Right Arrow) or `N` | Next Image | Skip to the next photo immediately |
| `F` | Fullscreen | Toggle fullscreen mode |
| `I` | Info | Show/hide image information overlay |
| `Esc` | Exit Fullscreen | Exit fullscreen mode (when in fullscreen) |

### Admin Panel Shortcuts

| Key | Action | Description |
|-----|--------|-------------|
| `Ctrl+V` / `Cmd+V` | Paste | Paste images from clipboard (if supported by browser) |
| Mouse hover | Show Controls | Display UI controls |
| Click outside | Close Modal | Close folder selector or dialogs |

### Universal Shortcuts

| Action | Method | Description |
|--------|--------|-------------|
| **Refresh page** | `F5` or `Ctrl+R` | Reload page (maintains session) |
| **Back** | Browser back button | Return to previous page |
| **New tab** | `Ctrl+Click` | Open links in new tab |

💡 **Tip**: Keyboard shortcuts work case-insensitively (both `k` and `K` work the same).

### Mouse Controls

| Action | Method | Description |
|--------|--------|-------------|
| **Show controls** | Move mouse | Reveal UI controls in slideshow |
| **Click button** | Click | Activate fullscreen, info, or folder selector |
| **Drag & drop** | Drag files | Upload photos to admin panel |

## 🔐 Authentication & Security

### Admin Authentication

- **Password protection**: Admin panel requires authentication
- **Configurable password**: Set via `ADMIN_PASSWORD` environment variable
- **Bcrypt support**: Optional password hashing for enhanced security
- **Session-based**: Persistent login across page refreshes
- **Auto-logout**: Session expires after period of inactivity (24 hours default)

### Session Management

- **Secure sessions**: Encrypted with `SESSION_SECRET`
- **HTTP-only cookies**: Protected from JavaScript access
- **SameSite policy**: CSRF protection enabled
- **Secure flag**: Automatic in production with HTTPS
- **Session duration**: 24-hour default expiry
- **Persistent storage**: Sessions survive server restarts (with proper storage)

### Security Features

- **Input validation**: All user inputs validated and sanitized
- **Path traversal protection**: Prevents access to files outside upload directory
- **File type validation**: Only allowed image formats accepted
- **Size limits**: Configurable maximum upload size
- **Rate limiting**: API endpoints protected from abuse (future enhancement)
- **SQL injection protection**: Not applicable (no SQL database used)
- **XSS protection**: Content Security Policy and sanitization

### Best Practices

- ✅ Change default password immediately
- ✅ Use bcrypt hashed passwords in production
- ✅ Set strong `SESSION_SECRET` (32+ characters)
- ✅ Enable HTTPS with reverse proxy in production
- ✅ Restrict network access with firewall rules
- ✅ Regularly update dependencies
- ✅ Monitor application logs
- ✅ Backup data volumes regularly

## 🖼️ Image Processing

### Automatic Optimization

- **Resize**: Large images automatically resized to configured maximum resolution
- **Compression**: JPEG quality optimization for faster loading
- **Format conversion**: Consistent output format for web display
- **Aspect ratio preservation**: No cropping or distortion
- **Orientation correction**: EXIF orientation data respected
- **Progressive rendering**: Images load progressively for better UX

### Processing Pipeline

1. **Upload**: Image received via HTTP multipart upload
2. **Validation**: File type and size checked
3. **Processing**: Sharp library processes the image
   - Read image metadata
   - Apply max resolution constraints
   - Set JPEG quality
   - Correct orientation
   - Generate output
4. **Storage**: Optimized image saved to upload directory
5. **Metadata**: Image info cached for quick access

### Configuration Options

| Setting | Purpose | Default | Range |
|---------|---------|---------|-------|
| `IMAGE_QUALITY` | JPEG compression quality | 85 | 0-100 |
| `MAX_RESOLUTION_WIDTH` | Maximum width in pixels | 1920 | Any integer |
| `MAX_RESOLUTION_HEIGHT` | Maximum height in pixels | 1080 | Any integer |
| `MAX_FILE_SIZE` | Maximum upload size | 10 MB | Any size in bytes |

📖 **Full Details**: See [Configuration Guide](Configuration-Guide) for image processing settings.

### Performance

- **Sharp library**: Fast, efficient image processing powered by libvips
- **Memory efficient**: Streaming processing reduces memory usage
- **Multi-format support**: JPEG, PNG, WebP, GIF handled efficiently
- **Parallel processing**: Multiple uploads processed concurrently
- **Caching**: Processed images cached for fast subsequent access

## ☁️ Google Photos Integration

### Capabilities

- **Album syncing**: Fetch albums from your Google Photos library
- **Read-only access**: Cannot modify or delete photos
- **OAuth 2.0**: Secure, standard authentication
- **Metadata caching**: Album and photo info cached locally
- **On-demand loading**: Photos fetched when needed, not stored permanently
- **Album selection**: Choose which albums to include in slideshow
- **Automatic updates**: Sync to get new photos

### Features

- **Multiple albums**: Select any number of albums to display
- **Mixed sources**: Show both uploaded photos and Google Photos
- **Smart mixing**: Random selection across all sources
- **Sync on demand**: Manual sync triggered from admin panel
- **Token management**: Secure storage of OAuth tokens
- **Quota awareness**: Respects Google API rate limits

### Configuration

Required environment variables:
- `ENABLE_GOOGLE_PHOTOS=true`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI`

📖 **Setup Guide**: See [Google Photos Setup](Google-Photos-Setup) for complete instructions.

### Limitations

- **API quotas**: Subject to Google Photos API rate limits
- **Internet required**: Must have internet connection to load photos
- **Token expiry**: Tokens expire and require re-authentication
- **Test users**: Apps in testing mode limited to 100 test users
- **No local storage**: Photos not permanently stored (always fetched from Google)

## 🐳 Docker Support

### Features

- **Docker Compose**: Simple one-command deployment
- **Official Dockerfile**: Optimized for production use
- **Persistent volumes**: Photos and data survive container restarts
- **Health checks**: Built-in container health monitoring
- **Multi-stage build**: Optimized image size
- **Automatic restart**: Container restarts on failure
- **Port mapping**: Flexible port configuration

### Volumes

Three persistent volumes for data:
- **photo-uploads**: Stores uploaded images
- **photo-data**: Stores application data (access accounts, tokens)
- **photo-logs**: Stores application logs

### Configuration

- **Environment variables**: All configuration via `.env` file
- **Port mapping**: `HOST_PORT:CONTAINER_PORT` configurable
- **Resource limits**: Can set memory and CPU limits
- **Network isolation**: Runs in isolated Docker network
- **Logging**: Container logs accessible via `docker compose logs`

### Benefits

- ✅ **Consistent environment**: Same environment everywhere
- ✅ **Easy updates**: Pull and restart to update
- ✅ **Isolation**: No conflicts with system packages
- ✅ **Portability**: Move between systems easily
- ✅ **Scalability**: Easy to deploy multiple instances
- ✅ **Backup**: Simple volume backup and restore

📖 **Installation**: See [Installation Guide](Installation-Guide) for Docker setup instructions.

## 🚀 Advanced Features

### Health Monitoring

- **Health endpoint**: `/api/health` reports application status
- **Docker health check**: Built-in container health monitoring
- **Uptime tracking**: Reports server uptime
- **Status codes**: Standard HTTP status codes
- **Timestamp**: UTC timestamp in health response

**Example**:
```bash
curl http://localhost:3000/api/health
# {"status":"ok","uptime":12345,"timestamp":"2024-02-14T12:00:00.000Z"}
```

### Logging

- **Winston logger**: Professional logging framework
- **Log levels**: Debug, info, warn, error
- **File rotation**: Automatic log file rotation
- **Console output**: Colorized console logs in development
- **Error tracking**: Detailed error logs with stack traces
- **Request logging**: HTTP request/response logging

**Log locations**:
- Docker: `/app/logs/` (volume: `photo-logs`)
- Manual: `server/logs/`

### API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/health` | GET | Health check |
| `/api/images` | GET | List images |
| `/api/images/random` | GET | Get random image |
| `/api/folders` | GET | List folders |
| `/api/folders` | POST | Create folder |
| `/api/folders/:path` | DELETE | Delete folder |
| `/api/upload` | POST | Upload images |
| `/api/google/auth` | GET | Initiate Google OAuth |
| `/api/google/callback` | GET | OAuth callback |
| `/api/google/albums` | GET | List Google Photos albums |

📖 **API Docs**: See [online documentation](https://docs-sora-frame.vercel.app/api-reference/introduction) for full API reference.

### Configuration Flexibility

- **Environment variables**: All settings via `.env` file
- **Default values**: Sensible defaults for all optional settings
- **Validation**: Configuration validated on startup
- **Hot reload**: Some settings can be changed without restart (future enhancement)
- **Multiple environments**: Different configs for dev/prod

### Extensibility

- **Modular architecture**: Clean separation of concerns
- **Express middleware**: Standard middleware pattern
- **Plugin-ready**: Easy to add new features
- **API-first design**: All features accessible via API
- **Open source**: Contribute improvements and fixes

## 🌐 Browser Compatibility

### Supported Browsers

| Browser | Version | Support Level | Notes |
|---------|---------|---------------|-------|
| **Chrome** | 90+ | ✅ Full Support | Recommended browser |
| **Edge** | 90+ | ✅ Full Support | Chromium-based Edge |
| **Firefox** | 88+ | ✅ Full Support | All features work |
| **Safari** | 14+ | ✅ Full Support | macOS and iOS |
| **Opera** | 76+ | ✅ Full Support | Chromium-based |
| **Brave** | 1.24+ | ✅ Full Support | Chromium-based |
| **Samsung Internet** | 14+ | ✅ Full Support | Android browser |

### Mobile Browser Support

| Browser | Platform | Support Level | Notes |
|---------|----------|---------------|-------|
| **Chrome Mobile** | Android/iOS | ✅ Full Support | Recommended |
| **Safari Mobile** | iOS | ✅ Full Support | iPhone/iPad |
| **Firefox Mobile** | Android | ✅ Full Support | All features |
| **Samsung Internet** | Android | ✅ Full Support | Samsung devices |
| **Edge Mobile** | Android/iOS | ✅ Full Support | Chromium-based |

### Feature Support

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Slideshow | ✅ | ✅ | ✅ | ✅ |
| Fullscreen | ✅ | ✅ | ✅ | ✅ |
| Wake Lock | ✅ | ⚠️ Limited | ⚠️ Limited | ✅ |
| Drag & Drop | ✅ | ✅ | ✅ | ✅ |
| File Upload | ✅ | ✅ | ✅ | ✅ |
| Keyboard Shortcuts | ✅ | ✅ | ✅ | ✅ |
| Dark Mode | ✅ | ✅ | ✅ | ✅ |

⚠️ **Wake Lock**: Limited support in Firefox and Safari, but gracefully degrades.

### Screen Sizes

- **Desktop**: 1920×1080 and higher (optimal)
- **Laptop**: 1366×768 and higher
- **Tablet**: 768×1024 and higher (landscape/portrait)
- **Phone**: 375×667 and higher (landscape/portrait)
- **4K Displays**: 3840×2160 supported
- **Ultra-wide**: 2560×1080 and wider supported

### Requirements

- **JavaScript**: Required (application won't work without it)
- **Cookies**: Required for session management
- **LocalStorage**: Used for preferences (optional, graceful degradation)
- **Internet**: Required only for Google Photos integration
- **HTTPS**: Recommended for production (required for some features like Wake Lock on remote domains)

## 📊 Performance Metrics

### Load Times

| Operation | Time | Notes |
|-----------|------|-------|
| Initial page load | < 2s | First visit |
| Slideshow start | < 1s | After login |
| Image transition | < 500ms | Fade animation |
| Upload (10 MB photo) | 5-15s | Depends on network |
| Folder navigation | < 200ms | Instant |
| Google Photos sync | 2-10s | Depends on album size |

### Resource Usage

| Resource | Usage | Notes |
|----------|-------|-------|
| **RAM** (Container) | 100-200 MB | Idle state |
| **RAM** (Processing) | 200-500 MB | During image upload |
| **CPU** (Idle) | < 1% | No active processing |
| **CPU** (Upload) | 10-50% | Image processing |
| **Disk** | 50 MB + photos | Application + uploaded photos |
| **Network** (Slideshow) | ~2 MB/min | At 1920×1080, quality 85 |

### Scalability

| Metric | Limit | Notes |
|--------|-------|-------|
| **Photos** | 10,000+ | Tested with thousands of photos |
| **Folders** | 1,000+ | Deep nesting supported |
| **File size** | 100 MB | Configurable, 10 MB default |
| **Concurrent users** | 10+ | Multiple simultaneous admin sessions |
| **Upload bandwidth** | Limited by network | Parallel uploads supported |
| **API requests** | Thousands/day | No built-in rate limiting |

### Optimization Tips

1. **Image size**: Upload appropriately sized images (don't upload 50 MB RAW files)
2. **Resolution**: Match `MAX_RESOLUTION` to your display resolution
3. **Quality**: Balance `IMAGE_QUALITY` between file size and visual quality
4. **Interval**: Use longer `DEFAULT_SLIDESHOW_INTERVAL` to reduce resource usage
5. **Docker**: Allocate sufficient memory (minimum 512 MB, recommend 1 GB)
6. **Network**: Use wired connection for 4K displays or large photos
7. **Browser**: Use Chromium-based browsers for best performance
8. **Hardware**: SSD storage for faster image loading

### Benchmarks

Tested on:
- **CPU**: Intel Core i5 (4 cores)
- **RAM**: 4 GB
- **Storage**: SSD
- **Network**: 100 Mbps

Results:
- ✅ 1000 photos, smooth slideshow performance
- ✅ 10 simultaneous admin sessions, no slowdown
- ✅ 10 MB photo upload in 8 seconds (processing)
- ✅ Container memory usage stable at ~150 MB
- ✅ Zero memory leaks over 72-hour continuous operation

## 🎉 What's Next?

Now that you know all the features:

1. **Customize**: Adjust settings in the [Configuration Guide](Configuration-Guide)
2. **Integrate**: Set up [Google Photos](Google-Photos-Setup) if desired
3. **Troubleshoot**: Visit [Troubleshooting](Troubleshooting) if needed
4. **Enjoy**: Start your slideshow and enjoy your photos! 📸

## 💡 Tips & Tricks

### Pro Tips

- **Quick folder switch**: Click the folder icon in slideshow to instantly change photo source
- **Fullscreen shortcut**: Press `F` to quickly toggle fullscreen
- **Pause before exit**: Press `Space` to pause before exiting, preserving your position
- **Keyboard navigation**: Use keyboard shortcuts for hands-free control
- **Multiple displays**: Open slideshow on multiple devices simultaneously
- **Background display**: Perfect for waiting rooms, offices, or home displays

### Best Practices

- **Organize first**: Create folder structure before uploading
- **Optimize images**: Don't upload unnecessarily large files
- **Test slideshow**: View slideshow after uploading to check results
- **Regular backups**: Backup Docker volumes or upload directory
- **Security**: Change default password immediately
- **Updates**: Keep application updated with `git pull` and `docker compose pull`

---

**Explore all features and make SORA Frame your own!** 🌟

For questions or issues, visit [GitHub Discussions](https://github.com/TLMInit/sora-digital-photo-frame/discussions).
