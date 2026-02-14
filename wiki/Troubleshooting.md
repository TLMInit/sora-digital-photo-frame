# 🔧 Troubleshooting

This guide helps you resolve common issues with SORA Digital Photo Frame. Issues are organized by category with clear symptoms and step-by-step solutions.

## 📋 Table of Contents

- [Installation Issues](#-installation-issues)
- [Configuration Problems](#-configuration-problems)
- [Docker-Specific Issues](#-docker-specific-issues)
- [Google Photos Integration Problems](#-google-photos-integration-problems)
- [Performance Issues](#-performance-issues)
- [Image Upload Problems](#-image-upload-problems)
- [Network and Access Issues](#-network-and-access-issues)
- [Browser Compatibility Issues](#-browser-compatibility-issues)
- [General Debugging](#-general-debugging)

## 🚨 Installation Issues

### Cannot Clone Repository

**Symptom**: `git clone` fails with error messages

**Possible Causes**:
- Git not installed
- No internet connection
- Repository URL incorrect

**Solutions**:

1. **Verify Git is installed**:
   ```bash
   git --version
   # Should show: git version 2.x.x
   ```
   
   **If not installed**:
   - **macOS**: `brew install git` or download from [git-scm.com](https://git-scm.com/)
   - **Linux**: `sudo apt install git` or `sudo yum install git`
   - **Windows**: Download from [git-scm.com](https://git-scm.com/)

2. **Check internet connection**:
   ```bash
   ping github.com
   ```

3. **Use correct repository URL**:
   ```bash
   git clone https://github.com/TLMInit/sora-digital-photo-frame.git
   ```

### Docker Not Found

**Symptom**: `docker: command not found` or `docker compose: command not found`

**Solutions**:

1. **Install Docker**:
   - Visit [docs.docker.com/get-docker](https://docs.docker.com/get-docker/)
   - Follow installation instructions for your OS

2. **Verify Docker installation**:
   ```bash
   docker --version
   docker compose version
   ```

3. **Start Docker service** (Linux):
   ```bash
   sudo systemctl start docker
   sudo systemctl enable docker
   ```

4. **Add user to docker group** (Linux):
   ```bash
   sudo usermod -aG docker $USER
   # Log out and back in for changes to take effect
   ```

### Node.js Version Too Old

**Symptom**: Errors about unsupported Node.js version or JavaScript syntax errors

**Solutions**:

1. **Check Node.js version**:
   ```bash
   node --version
   # Should be v18.x.x or higher
   ```

2. **Update Node.js**:
   
   **Using nvm (recommended)**:
   ```bash
   # Install nvm
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   
   # Install latest Node.js
   nvm install 18
   nvm use 18
   ```
   
   **Direct download**:
   - Visit [nodejs.org](https://nodejs.org/)
   - Download LTS version
   - Install and restart terminal

3. **Verify installation**:
   ```bash
   node --version
   npm --version
   ```

### Dependencies Installation Fails

**Symptom**: `npm install` fails with errors

**Solutions**:

1. **Clear npm cache**:
   ```bash
   npm cache clean --force
   ```

2. **Delete node_modules and package-lock**:
   ```bash
   cd server
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Use correct Node.js version**:
   ```bash
   nvm use 18
   npm install
   ```

4. **Check network connectivity**:
   - Verify internet connection
   - Check if behind corporate firewall/proxy
   - Try alternate npm registry:
     ```bash
     npm config set registry https://registry.npmjs.org/
     ```

5. **Install build tools** (if native modules fail):
   
   **macOS**:
   ```bash
   xcode-select --install
   ```
   
   **Linux**:
   ```bash
   sudo apt install build-essential
   ```
   
   **Windows**:
   ```bash
   npm install --global windows-build-tools
   ```

## ⚙️ Configuration Problems

### SESSION_SECRET Not Set

**Symptom**: Application fails to start with "SESSION_SECRET is not set" error

**Solution**:

1. **Check .env file exists**:
   ```bash
   # Docker installation
   ls -la .env
   
   # Manual installation
   ls -la server/.env
   ```

2. **Create .env from example**:
   ```bash
   cp .env.example .env
   ```

3. **Generate and add SESSION_SECRET**:
   
   **Linux/macOS**:
   ```bash
   echo "SESSION_SECRET=$(openssl rand -base64 32)" >> .env
   ```
   
   **Windows PowerShell**:
   ```powershell
   $secret = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
   Add-Content .env "SESSION_SECRET=$secret"
   ```

4. **Restart application**:
   ```bash
   # Docker
   docker compose restart
   
   # Manual
   npm start
   ```

### Cannot Login with Admin Password

**Symptom**: Login fails even with correct password

**Solutions**:

1. **Verify ADMIN_PASSWORD is set**:
   ```bash
   grep ADMIN_PASSWORD .env
   ```

2. **Check for typos**:
   - No quotes around password value
   - No spaces before/after `=`
   - Correct: `ADMIN_PASSWORD=MyPassword123`
   - Wrong: `ADMIN_PASSWORD = "MyPassword123"`

3. **Try default password** (if ADMIN_PASSWORD not set):
   - Default: `admin123`

4. **Reset password**:
   ```bash
   # Edit .env file
   nano .env
   
   # Change ADMIN_PASSWORD line
   ADMIN_PASSWORD=NewPassword123
   
   # Restart
   docker compose restart
   ```

5. **Clear browser cookies**:
   - Clear cookies for the domain
   - Try incognito/private browsing mode
   - Hard refresh: `Ctrl+Shift+R` or `Cmd+Shift+R`

6. **Check logs for errors**:
   ```bash
   # Docker
   docker compose logs photo-frame | grep -i auth
   
   # Manual
   cat logs/app.log | grep -i auth
   ```

### Port Already in Use

**Symptom**: Error: "Address already in use" or "Port 3000 is already allocated"

**Solutions**:

1. **Find process using the port**:
   
   **Linux/macOS**:
   ```bash
   lsof -i :3000
   # or
   sudo netstat -tlnp | grep :3000
   ```
   
   **Windows**:
   ```cmd
   netstat -ano | findstr :3000
   ```

2. **Stop the conflicting process**:
   ```bash
   # Kill by PID (from above command)
   kill <PID>
   
   # Windows
   taskkill /PID <PID> /F
   ```

3. **Or use a different port**:
   
   **Edit .env**:
   ```bash
   # For Docker
   HOST_PORT=8080
   
   # For manual install
   PORT=8080
   ```
   
   **Restart**:
   ```bash
   docker compose down
   docker compose up -d
   ```

4. **Access on new port**:
   ```
   http://localhost:8080
   ```

### Environment Variables Not Loading

**Symptom**: Application uses default values instead of .env values

**Solutions**:

1. **Verify .env file location**:
   - **Docker**: Same directory as `docker-compose.yml`
   - **Manual**: Inside `server/` directory

2. **Check .env file syntax**:
   ```bash
   # View file
   cat .env
   
   # Common mistakes:
   # ❌ Wrong: SESSION_SECRET = "value"
   # ❌ Wrong: SESSION_SECRET="value"
   # ✅ Correct: SESSION_SECRET=value
   ```

3. **No spaces around equals sign**:
   ```bash
   # Wrong
   PORT = 3000
   
   # Correct
   PORT=3000
   ```

4. **No empty lines with spaces**:
   - Remove any invisible whitespace
   - Use a proper text editor

5. **Restart application**:
   ```bash
   # Docker (always restart after .env changes)
   docker compose down
   docker compose up -d
   
   # Manual (restart required)
   # Stop with Ctrl+C
   npm start
   ```

## 🐳 Docker-Specific Issues

### Container Won't Start

**Symptom**: `docker compose up` fails or container immediately exits

**Solutions**:

1. **Check logs**:
   ```bash
   docker compose logs photo-frame
   ```

2. **Common issues**:
   
   **Missing .env file**:
   ```bash
   ls -la .env
   # If missing: cp .env.example .env
   ```
   
   **Invalid environment variables**:
   ```bash
   # Check for errors in .env
   cat .env
   ```
   
   **Port conflict**:
   ```bash
   # Change HOST_PORT in .env
   echo "HOST_PORT=8080" >> .env
   ```

3. **Try running with logs visible**:
   ```bash
   docker compose up
   # Watch for error messages
   ```

4. **Rebuild container**:
   ```bash
   docker compose down
   docker compose build --no-cache
   docker compose up -d
   ```

5. **Check Docker daemon**:
   ```bash
   # Verify Docker is running
   docker ps
   
   # Start Docker service (Linux)
   sudo systemctl start docker
   ```

### Images/Data Not Persisting

**Symptom**: Uploaded photos disappear after container restart

**Solutions**:

1. **Verify volumes exist**:
   ```bash
   docker volume ls | grep photo
   
   # Should show:
   # sora-digital-photo-frame_photo-uploads
   # sora-digital-photo-frame_photo-data
   # sora-digital-photo-frame_photo-logs
   ```

2. **Check volume mounts**:
   ```bash
   docker compose config | grep volumes
   ```

3. **Inspect volume**:
   ```bash
   docker volume inspect sora-digital-photo-frame_photo-uploads
   ```

4. **Re-create volumes**:
   ```bash
   # ⚠️ WARNING: This deletes all data!
   docker compose down -v
   docker compose up -d
   ```

5. **Use bind mount instead** (alternative):
   
   **Edit docker-compose.yml**:
   ```yaml
   volumes:
     - ./uploads:/app/uploads
     - ./data:/app/data
     - ./logs:/app/logs
   ```

### Cannot Access Container Logs

**Symptom**: Cannot view logs or logs are empty

**Solutions**:

1. **Check container is running**:
   ```bash
   docker compose ps
   ```

2. **View logs**:
   ```bash
   # All logs
   docker compose logs photo-frame
   
   # Follow logs in real-time
   docker compose logs -f photo-frame
   
   # Last 100 lines
   docker compose logs --tail=100 photo-frame
   ```

3. **Access logs from volume**:
   ```bash
   # Find volume mount point
   docker volume inspect sora-digital-photo-frame_photo-logs
   
   # Or exec into container
   docker compose exec photo-frame cat /app/logs/app.log
   ```

4. **Check Docker daemon logs** (if container crashes):
   ```bash
   # Linux
   sudo journalctl -u docker
   
   # macOS
   # Check Docker Desktop logs in UI
   ```

### High Memory Usage

**Symptom**: Docker container using too much RAM

**Solutions**:

1. **Check actual usage**:
   ```bash
   docker stats digital-photo-frame
   ```

2. **Reduce memory usage**:
   
   **Lower image quality**:
   ```bash
   # Add to .env
   IMAGE_QUALITY=75
   MAX_RESOLUTION_WIDTH=1280
   MAX_RESOLUTION_HEIGHT=720
   ```
   
   **Limit container memory**:
   ```yaml
   # Add to docker-compose.yml under photo-frame:
   deploy:
     resources:
       limits:
         memory: 512M
   ```

3. **Restart container**:
   ```bash
   docker compose restart
   ```

4. **Check for memory leaks**:
   ```bash
   # Monitor over time
   watch -n 5 docker stats --no-stream digital-photo-frame
   ```

### Permission Denied Errors

**Symptom**: "Permission denied" when accessing files in container

**Solutions**:

1. **Check volume permissions**:
   ```bash
   docker compose exec photo-frame ls -la /app/uploads
   ```

2. **Fix permissions on host**:
   ```bash
   # Find volume location
   docker volume inspect sora-digital-photo-frame_photo-uploads
   
   # Fix permissions (use path from above)
   sudo chmod -R 755 /var/lib/docker/volumes/sora-digital-photo-frame_photo-uploads/_data
   ```

3. **Use bind mount with correct permissions**:
   ```bash
   mkdir -p ./uploads ./data ./logs
   chmod 755 ./uploads ./data ./logs
   ```

4. **Rebuild container**:
   ```bash
   docker compose down
   docker compose up -d
   ```

## ☁️ Google Photos Integration Problems

### Cannot Connect Google Photos

**Symptom**: "Connect Google Photos" button doesn't work or shows errors

**Solutions**:

1. **Verify Google Photos is enabled**:
   ```bash
   grep GOOGLE .env
   
   # Should show:
   # ENABLE_GOOGLE_PHOTOS=true
   # GOOGLE_CLIENT_ID=...
   # GOOGLE_CLIENT_SECRET=...
   # GOOGLE_REDIRECT_URI=...
   ```

2. **Check all variables are set**:
   ```bash
   # All should have values
   grep -E "GOOGLE_CLIENT_ID|GOOGLE_CLIENT_SECRET|GOOGLE_REDIRECT_URI" .env
   ```

3. **Verify redirect URI format**:
   ```bash
   # Correct format:
   GOOGLE_REDIRECT_URI=http://localhost:3000/api/google/callback
   
   # Common mistakes:
   # ❌ Missing protocol: localhost:3000/api/google/callback
   # ❌ Trailing slash: http://localhost:3000/api/google/callback/
   # ❌ Wrong path: http://localhost:3000/callback
   ```

4. **Restart application**:
   ```bash
   docker compose restart
   ```

5. **Check application logs**:
   ```bash
   docker compose logs photo-frame | grep -i google
   ```

For detailed Google Photos troubleshooting, see the [Google Photos Setup Guide - Troubleshooting section](Google-Photos-Setup#-troubleshooting).

### redirect_uri_mismatch Error

**See**: [Google Photos Setup - redirect_uri_mismatch](Google-Photos-Setup#redirect_uri_mismatch-error)

### "This app isn't verified" Warning

**See**: [Google Photos Setup - This app isn't verified](Google-Photos-Setup#this-app-isnt-verified-warning)

### Photos Not Syncing from Google Photos

**See**: [Google Photos Setup - Photos Not Syncing](Google-Photos-Setup#photos-not-syncing)

## 🐌 Performance Issues

### Slideshow Is Laggy or Slow

**Symptom**: Images load slowly or slideshow stutters

**Solutions**:

1. **Check image sizes**:
   ```bash
   # Find large images
   find uploads -type f -size +10M
   ```
   
   **Optimize large images**:
   - Re-upload with lower quality
   - Use image editing tool to reduce size
   - Configure lower max resolution:
     ```bash
     # Add to .env
     MAX_RESOLUTION_WIDTH=1280
     MAX_RESOLUTION_HEIGHT=720
     IMAGE_QUALITY=75
     ```

2. **Check system resources**:
   ```bash
   # Docker
   docker stats digital-photo-frame
   
   # Manual
   top
   htop
   ```

3. **Reduce slideshow interval**:
   ```bash
   # Give more time for loading
   DEFAULT_SLIDESHOW_INTERVAL=20000  # 20 seconds
   ```

4. **Check network speed** (for Google Photos):
   ```bash
   # Test speed
   curl -o /dev/null https://www.google.com
   ```

5. **Use wired connection** instead of WiFi

6. **Close other applications** to free up resources

7. **Check browser performance**:
   - Try different browser (Chrome recommended)
   - Close other tabs
   - Disable browser extensions
   - Clear browser cache

### Admin Panel Slow to Load

**Symptom**: Admin panel takes long time to load or is unresponsive

**Solutions**:

1. **Check number of files**:
   ```bash
   find uploads -type f | wc -l
   ```

2. **Reduce files per folder**:
   - Organize into subfolders
   - Each folder with < 500 photos performs better

3. **Clear browser cache**:
   - Hard refresh: `Ctrl+Shift+R` or `Cmd+Shift+R`
   - Clear cookies and cache

4. **Check server load**:
   ```bash
   docker stats  # Docker
   top  # Manual install
   ```

5. **Restart application**:
   ```bash
   docker compose restart
   ```

### Image Upload is Slow

**Symptom**: Uploading images takes a very long time

**Solutions**:

1. **Check image size**:
   - Large RAW files (20+ MB) take time to process
   - Use JPEG instead of RAW for faster uploads

2. **Reduce max resolution**:
   ```bash
   # Add to .env for faster processing
   MAX_RESOLUTION_WIDTH=1920
   MAX_RESOLUTION_HEIGHT=1080
   IMAGE_QUALITY=80
   ```

3. **Check network speed**:
   - Use wired connection
   - Test upload speed: [speedtest.net](https://www.speedtest.net/)

4. **Upload smaller batches**:
   - Upload 10-20 photos at a time
   - Instead of 100+ at once

5. **Allocate more resources** (Docker):
   ```yaml
   # docker-compose.yml
   deploy:
     resources:
       limits:
         cpus: '2'
         memory: 2G
   ```

## 📸 Image Upload Problems

### Upload Button Doesn't Work

**Symptom**: Clicking upload button does nothing

**Solutions**:

1. **Check browser console**:
   - Open browser DevTools: `F12`
   - Check Console tab for errors
   - Look for JavaScript errors

2. **Try different browser**:
   - Chrome, Firefox, or Edge
   - Disable browser extensions

3. **Check file size**:
   ```bash
   # Verify MAX_FILE_SIZE setting
   grep MAX_FILE_SIZE .env
   ```

4. **Verify logged in**:
   - Ensure you're logged in to admin panel
   - Try refreshing and logging in again

5. **Check network connection**:
   - Verify server is accessible
   - Check browser network tab (F12 → Network)

### Drag and Drop Doesn't Work

**Symptom**: Dragging files to admin panel doesn't upload

**Solutions**:

1. **Check browser support**:
   - Use modern browser (Chrome 90+, Firefox 88+)
   - Drag and drop not supported on very old browsers

2. **Try upload button instead**:
   - Use traditional file picker as alternative

3. **Check file types**:
   - Only image files supported
   - Supported: JPEG, PNG, WebP, GIF

4. **Clear browser cache**:
   ```bash
   # Hard refresh
   Ctrl+Shift+R  # Windows/Linux
   Cmd+Shift+R   # macOS
   ```

### "File Too Large" Error

**Symptom**: Upload fails with "file size exceeds maximum" error

**Solutions**:

1. **Check current limit**:
   ```bash
   grep MAX_FILE_SIZE .env
   # Default: 10485760 (10 MB)
   ```

2. **Increase limit** (if needed):
   ```bash
   # Add to .env
   MAX_FILE_SIZE=20971520  # 20 MB
   # or
   MAX_FILE_SIZE=52428800  # 50 MB
   ```

3. **Restart application**:
   ```bash
   docker compose restart
   ```

4. **Or compress image**:
   - Use image editor to reduce file size
   - Export at lower quality
   - Resize image to smaller dimensions

5. **For Nginx reverse proxy**, also update:
   ```nginx
   # /etc/nginx/sites-available/sora-frame
   client_max_body_size 20M;  # Match or exceed MAX_FILE_SIZE
   ```
   
   Then restart Nginx:
   ```bash
   sudo systemctl reload nginx
   ```

### Uploaded Images Don't Appear

**Symptom**: Upload succeeds but images don't show in slideshow

**Solutions**:

1. **Refresh slideshow page**:
   - Hard refresh: `Ctrl+Shift+R` or `Cmd+Shift+R`

2. **Check folder selection**:
   - Click folder icon in slideshow
   - Ensure correct folder is selected
   - Try "All Photos" mode

3. **Verify upload location**:
   ```bash
   # Docker
   docker compose exec photo-frame ls -la /app/uploads
   
   # Manual
   ls -la server/uploads
   ```

4. **Check file permissions**:
   ```bash
   # Should be readable
   ls -l uploads/
   chmod 644 uploads/*.jpg
   ```

5. **Check logs for errors**:
   ```bash
   docker compose logs photo-frame | grep -i upload
   ```

6. **Try re-uploading**:
   - Delete and re-upload the image
   - Try different image format

## 🌐 Network and Access Issues

### Cannot Access from Other Devices

**Symptom**: Works on localhost but not from other devices on network

**Solutions**:

1. **Find your IP address**:
   
   **Linux/macOS**:
   ```bash
   hostname -I | awk '{print $1}'
   # or
   ip addr show | grep "inet " | grep -v 127.0.0.1
   ```
   
   **Windows**:
   ```cmd
   ipconfig | findstr IPv4
   ```

2. **Access using IP**:
   ```
   http://192.168.1.100:3000
   # Replace with your actual IP
   ```

3. **Check firewall**:
   
   **Linux (UFW)**:
   ```bash
   sudo ufw allow 3000
   sudo ufw status
   ```
   
   **Linux (firewalld)**:
   ```bash
   sudo firewall-cmd --add-port=3000/tcp --permanent
   sudo firewall-cmd --reload
   ```
   
   **Windows Firewall**:
   - Open Windows Defender Firewall
   - Allow inbound rule for port 3000

4. **Verify Docker port binding**:
   ```bash
   docker compose ps
   # Check PORTS column shows: 0.0.0.0:3000->3000/tcp
   ```

5. **Check network configuration**:
   - Ensure devices on same network
   - Check router settings
   - Try disabling VPN

### SSL/HTTPS Issues

**Symptom**: HTTPS not working or certificate errors

**Solutions**:

1. **For production**, use reverse proxy:
   - See [Installation Guide - Production Deployment](Installation-Guide#vps-deployment-with-nginx-reverse-proxy)
   - Use Let's Encrypt for free SSL

2. **For local network**, HTTP is sufficient:
   - SSL not required for local access
   - Only needed for public internet access

3. **Check certificate expiry**:
   ```bash
   sudo certbot certificates
   ```

4. **Renew certificate**:
   ```bash
   sudo certbot renew
   sudo systemctl reload nginx
   ```

5. **Test SSL configuration**:
   - Visit [SSL Labs Test](https://www.ssllabs.com/ssltest/)
   - Check Nginx configuration

### Connection Timeout

**Symptom**: Browser shows "Connection timed out" or "Cannot reach this page"

**Solutions**:

1. **Verify application is running**:
   ```bash
   # Docker
   docker compose ps
   
   # Manual
   ps aux | grep node
   ```

2. **Check port is open**:
   ```bash
   # Test locally
   curl http://localhost:3000/api/health
   
   # Test remotely
   telnet your-server-ip 3000
   ```

3. **Check firewall rules**:
   ```bash
   sudo ufw status
   # Ensure port 3000 is allowed
   ```

4. **Verify network connectivity**:
   ```bash
   ping your-server-ip
   ```

5. **Check router/NAT settings**:
   - Port forwarding configured correctly
   - No NAT blocking

## 🌐 Browser Compatibility Issues

### Fullscreen Not Working

**Symptom**: Fullscreen button doesn't work or exits immediately

**Solutions**:

1. **User gesture required**:
   - Fullscreen requires user interaction
   - Click fullscreen button (don't programmatically trigger)

2. **Try keyboard shortcut**:
   - Press `F` key in slideshow
   - Or press `F11` for browser fullscreen

3. **Check browser support**:
   - Update to latest browser version
   - Try Chrome or Firefox

4. **Disable browser extensions**:
   - Extensions may interfere
   - Try incognito mode

### Keyboard Shortcuts Don't Work

**Symptom**: Pressing keys doesn't control slideshow

**Solutions**:

1. **Click on slideshow area first**:
   - Focus must be on slideshow page
   - Click anywhere on the page

2. **Check browser focus**:
   - Ensure slideshow tab is active
   - Close any browser popups/prompts

3. **Try different keys**:
   - Space, K, or k for play/pause
   - Right arrow, N, or n for next
   - F for fullscreen
   - I for info

4. **Check browser console** for errors:
   - Open DevTools: `F12`
   - Look for JavaScript errors

### Dark Mode Not Working

**Symptom**: Dark mode doesn't activate or theme doesn't match system

**Solutions**:

1. **Check system preferences**:
   - Ensure system dark mode is enabled
   - Application follows system preference

2. **Clear browser cache**:
   ```bash
   # Hard refresh
   Ctrl+Shift+R
   ```

3. **Check localStorage**:
   - Open DevTools: `F12`
   - Application tab → Local Storage
   - Delete `themeMode` key
   - Refresh page

4. **Try manual toggle** (if available in UI)

## 🐛 General Debugging

### Getting More Information

1. **Check application logs**:
   
   **Docker**:
   ```bash
   # View all logs
   docker compose logs photo-frame
   
   # Follow logs
   docker compose logs -f photo-frame
   
   # Last 100 lines
   docker compose logs --tail=100 photo-frame
   
   # Filter errors
   docker compose logs photo-frame | grep -i error
   ```
   
   **Manual**:
   ```bash
   # Application logs
   tail -f server/logs/app.log
   
   # Error logs
   grep -i error server/logs/app.log
   ```

2. **Check browser console**:
   - Open DevTools: `F12`
   - Console tab for JavaScript errors
   - Network tab for failed requests

3. **Health check endpoint**:
   ```bash
   curl http://localhost:3000/api/health
   
   # Expected:
   # {"status":"ok","uptime":12345,"timestamp":"..."}
   ```

4. **Verify configuration**:
   ```bash
   # Check .env
   cat .env
   
   # Check for typos
   grep -E "^[A-Z_]+=.+" .env
   ```

### Common Error Messages

| Error Message | Cause | Solution |
|---------------|-------|----------|
| "SESSION_SECRET is not set" | Missing environment variable | Add SESSION_SECRET to .env |
| "Address already in use" | Port conflict | Change PORT or kill conflicting process |
| "ENOENT: no such file or directory" | Missing file/directory | Check file paths, permissions |
| "Cannot GET /" | Routing issue | Verify application started correctly |
| "401 Unauthorized" | Authentication failed | Check password, clear cookies |
| "413 Payload Too Large" | File size exceeded | Increase MAX_FILE_SIZE |
| "redirect_uri_mismatch" | Google OAuth URI mismatch | Fix GOOGLE_REDIRECT_URI |

### Reset to Clean State

If all else fails, reset to a clean state:

**Docker**:
```bash
# Stop and remove everything (⚠️ DELETES ALL DATA!)
docker compose down -v

# Clean up
rm -rf uploads/* data/* logs/*

# Start fresh
cp .env.example .env
nano .env  # Configure
docker compose up -d
```

**Manual**:
```bash
# Stop server
# Ctrl+C

# Clean up
rm -rf server/uploads/* server/data/* server/logs/*
rm -rf server/node_modules

# Reinstall
cd server
npm install

# Configure
cp .env.example .env
nano .env

# Start
npm start
```

### Still Having Issues?

If you still can't resolve the issue:

1. **Search existing issues**:
   - [GitHub Issues](https://github.com/TLMInit/sora-digital-photo-frame/issues)
   - Search for your error message

2. **Create new issue**:
   - Visit [New Issue](https://github.com/TLMInit/sora-digital-photo-frame/issues/new)
   - Provide:
     - Symptom and error messages
     - Installation method (Docker/Manual)
     - Operating system
     - Browser (if relevant)
     - Steps to reproduce
     - Relevant log excerpts
     - Configuration (hide secrets!)

3. **Ask in discussions**:
   - [GitHub Discussions](https://github.com/TLMInit/sora-digital-photo-frame/discussions)
   - Community may have solutions

4. **Check documentation**:
   - [Installation Guide](Installation-Guide)
   - [Configuration Guide](Configuration-Guide)
   - [Google Photos Setup](Google-Photos-Setup)
   - [Features](Features)

## 📚 Additional Resources

- **Online Docs**: [docs-sora-frame.vercel.app](https://docs-sora-frame.vercel.app/)
- **GitHub**: [Repository](https://github.com/TLMInit/sora-digital-photo-frame)
- **Issues**: [Report bugs](https://github.com/TLMInit/sora-digital-photo-frame/issues)
- **Discussions**: [Ask questions](https://github.com/TLMInit/sora-digital-photo-frame/discussions)

---

**Still stuck?** Don't hesitate to ask for help in [GitHub Discussions](https://github.com/TLMInit/sora-digital-photo-frame/discussions). The community is here to help! 🤝
