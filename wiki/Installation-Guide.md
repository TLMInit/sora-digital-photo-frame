# 📦 Installation Guide

This guide covers all methods for installing SORA Digital Photo Frame, from quick Docker setup to manual installation and production deployment.

## 📋 Prerequisites

Before installing SORA Frame, ensure you have:

### For Docker Installation (Recommended)
- **Docker** version 20.10 or later ([Install Docker](https://docs.docker.com/get-docker/))
- **Docker Compose** version 2.0 or later (included with Docker Desktop)
- **Git** for cloning the repository
- At least **512 MB RAM** (1 GB recommended)
- **500 MB disk space** (plus space for your photos)

### For Manual Installation
- **Node.js** version 18.x or later ([Download Node.js](https://nodejs.org/))
- **npm** version 9.x or later (comes with Node.js)
- **Git** for cloning the repository
- At least **512 MB RAM** (1 GB recommended)
- **500 MB disk space** (plus space for your photos)

## 🚀 Method 1: Docker Compose Installation (Recommended)

Docker Compose is the easiest and most reliable way to run SORA Frame.

### Step 1: Clone the Repository

```bash
# Clone the repository
git clone https://github.com/TLMInit/sora-digital-photo-frame.git

# Navigate to the directory
cd sora-digital-photo-frame
```

### Step 2: Configure Environment Variables

Copy the example environment file and edit it:

```bash
# Copy the example file
cp .env.example .env

# Edit with your preferred editor
nano .env  # or vim, code, etc.
```

**Minimal required configuration:**

```bash
# Generate a secure session secret (Linux/macOS)
SESSION_SECRET=$(openssl rand -base64 32)

# Or manually set a long random string (32+ characters)
SESSION_SECRET=your-very-long-random-secret-key-here-min-32-chars

# Set a secure admin password
ADMIN_PASSWORD=YourSecurePassword123!

# Optional: Change the port (default is 3000)
HOST_PORT=3000
```

💡 **Tip**: See the [Configuration Guide](Configuration-Guide) for all available options.

### Step 3: Start the Application

```bash
# Start in detached mode (background)
docker compose up -d

# Or start with logs visible (useful for first run)
docker compose up
```

**Expected output:**
```
✔ Container digital-photo-frame  Started
```

### Step 4: Verify Installation

Check if the container is running:

```bash
# Check container status
docker compose ps

# Check application health
curl http://localhost:3000/api/health
```

**Expected response:**
```json
{"status":"ok","uptime":123,"timestamp":"2024-02-14T12:00:00.000Z"}
```

### Step 5: Access the Application

Open your web browser and navigate to:
- **Local access**: http://localhost:3000
- **Network access**: http://YOUR_IP_ADDRESS:3000

**Login credentials:**
- Password: Your configured `ADMIN_PASSWORD` (default: `admin123`)

⚠️ **Security Warning**: Change the default password immediately!

### Management Commands

```bash
# View logs
docker compose logs photo-frame
docker compose logs -f photo-frame  # Follow logs in real-time

# Restart the application
docker compose restart

# Stop the application
docker compose stop

# Stop and remove containers (keeps data in volumes)
docker compose down

# Update to latest version
git pull
docker compose pull
docker compose up -d

# View resource usage
docker stats digital-photo-frame
```

## 🛠️ Method 2: Docker Manual Build

If you want more control over the Docker build process:

### Step 1: Clone and Configure

```bash
# Clone the repository
git clone https://github.com/TLMInit/sora-digital-photo-frame.git
cd sora-digital-photo-frame

# Copy and edit .env file
cp .env.example .env
nano .env  # Configure SESSION_SECRET and ADMIN_PASSWORD
```

### Step 2: Build the Image

```bash
# Build the Docker image
docker build -t sora-frame:latest .
```

### Step 3: Run the Container

```bash
# Run with environment variables
docker run -d \
  --name sora-photo-frame \
  -p 3000:3000 \
  -e SESSION_SECRET="your-secure-session-secret-here" \
  -e ADMIN_PASSWORD="YourSecurePassword123!" \
  -e NODE_ENV=production \
  -v sora-uploads:/app/uploads \
  -v sora-data:/app/data \
  -v sora-logs:/app/logs \
  --restart unless-stopped \
  sora-frame:latest
```

### Management Commands

```bash
# View logs
docker logs sora-photo-frame
docker logs -f sora-photo-frame  # Follow logs

# Stop the container
docker stop sora-photo-frame

# Start the container
docker start sora-photo-frame

# Remove the container (keeps volumes)
docker rm sora-photo-frame

# Update to latest
git pull
docker build -t sora-frame:latest .
docker stop sora-photo-frame
docker rm sora-photo-frame
# Run the container again with same volumes
```

## 💻 Method 3: Manual Node.js Installation

For development or environments without Docker:

### Step 1: Clone the Repository

```bash
git clone https://github.com/TLMInit/sora-digital-photo-frame.git
cd sora-digital-photo-frame
```

### Step 2: Install Dependencies

```bash
# Navigate to server directory
cd server

# Install Node.js dependencies
npm install
```

### Step 3: Configure Environment

```bash
# Copy example environment file
cp .env.example .env

# Edit configuration
nano .env
```

**Required settings:**

```bash
# Server configuration
PORT=3000
NODE_ENV=development

# Generate session secret (Linux/macOS)
SESSION_SECRET=$(openssl rand -base64 32)

# Or on Windows (PowerShell)
# SESSION_SECRET=([System.Convert]::ToBase64String((1..32|%{Get-Random -Minimum 0 -Maximum 256})))

# Set admin password
ADMIN_PASSWORD=YourSecurePassword123!

# Upload configuration (defaults are good)
MAX_FILE_SIZE=10485760
UPLOAD_DIR=uploads

# Image processing
IMAGE_QUALITY=85
MAX_RESOLUTION_WIDTH=1920
MAX_RESOLUTION_HEIGHT=1080

# Slideshow
DEFAULT_SLIDESHOW_INTERVAL=15000
```

### Step 4: Start the Server

```bash
# Start in development mode (with auto-reload)
npm run dev

# Or start in production mode
npm start
```

### Step 5: Access the Application

- **Local**: http://localhost:3000
- **Network**: http://YOUR_IP_ADDRESS:3000

### Management Commands

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage

# Stop the server
# Press Ctrl+C in the terminal where it's running

# Update to latest version
git pull
npm install
npm start
```

## 🌐 Method 4: Production Deployment

### VPS Deployment with Nginx Reverse Proxy

#### Prerequisites
- VPS with Ubuntu 20.04+ or Debian 11+
- Domain name pointing to your VPS
- Root or sudo access

#### Step 1: Install Docker

```bash
# Update package list
sudo apt update

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add your user to docker group
sudo usermod -aG docker $USER

# Log out and back in for group changes to take effect
```

#### Step 2: Install and Configure SORA Frame

```bash
# Clone repository
cd /opt
sudo git clone https://github.com/TLMInit/sora-digital-photo-frame.git
cd sora-digital-photo-frame

# Create .env file with production settings
sudo nano .env
```

**Production .env configuration:**

```bash
# Generate secure session secret
SESSION_SECRET=$(openssl rand -base64 32)

# Strong admin password
ADMIN_PASSWORD=$(openssl rand -base64 16)

# Production environment
NODE_ENV=production

# Use default port (we'll proxy through Nginx)
CONTAINER_PORT=3000

# Disable external port binding (Nginx will handle this)
# HOST_PORT=3000  # Comment this out or remove
```

```bash
# Start the application
sudo docker compose up -d

# Verify it's running
docker compose ps
curl http://localhost:3000/api/health
```

#### Step 3: Install Nginx

```bash
# Install Nginx
sudo apt install nginx -y

# Enable and start Nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

#### Step 4: Configure Nginx Reverse Proxy

Create Nginx configuration:

```bash
sudo nano /etc/nginx/sites-available/sora-frame
```

**Configuration file:**

```nginx
server {
    listen 80;
    server_name photos.yourdomain.com;  # Replace with your domain

    client_max_body_size 20M;  # Allow large photo uploads

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable the configuration:

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/sora-frame /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

#### Step 5: SSL Setup with Let's Encrypt

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain SSL certificate
sudo certbot --nginx -d photos.yourdomain.com

# Follow the prompts:
# - Enter email address
# - Agree to terms of service
# - Choose whether to redirect HTTP to HTTPS (recommended: yes)
```

**Certbot will automatically update your Nginx configuration for HTTPS.**

Test SSL renewal:

```bash
# Dry run
sudo certbot renew --dry-run

# Certificates auto-renew via systemd timer
sudo systemctl status certbot.timer
```

#### Step 6: Configure Firewall

```bash
# Allow SSH (if not already allowed)
sudo ufw allow OpenSSH

# Allow HTTP and HTTPS
sudo ufw allow 'Nginx Full'

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

#### Step 7: Set Up Automatic Updates

Create update script:

```bash
sudo nano /opt/update-sora-frame.sh
```

**Script content:**

```bash
#!/bin/bash
cd /opt/sora-digital-photo-frame
git pull
docker compose pull
docker compose up -d
docker system prune -f
```

Make executable and schedule:

```bash
# Make executable
sudo chmod +x /opt/update-sora-frame.sh

# Add to crontab (weekly updates on Sunday at 3 AM)
sudo crontab -e

# Add this line:
# 0 3 * * 0 /opt/update-sora-frame.sh >> /var/log/sora-frame-update.log 2>&1
```

### Cloud Platform Deployment

#### Heroku

```bash
# Install Heroku CLI
# https://devcenter.heroku.com/articles/heroku-cli

# Login to Heroku
heroku login

# Create app
heroku create your-app-name

# Set environment variables
heroku config:set SESSION_SECRET=$(openssl rand -base64 32)
heroku config:set ADMIN_PASSWORD=YourSecurePassword
heroku config:set NODE_ENV=production

# Deploy
git push heroku main

# Open app
heroku open
```

💡 **Note**: Heroku's ephemeral filesystem means uploaded photos will be lost on restart. Consider using external storage like AWS S3.

#### Railway

1. Visit [railway.app](https://railway.app)
2. Click "Start a New Project"
3. Select "Deploy from GitHub repo"
4. Choose the sora-digital-photo-frame repository
5. Railway will auto-detect the Dockerfile
6. Add environment variables in Settings:
   - `SESSION_SECRET`
   - `ADMIN_PASSWORD`
   - `NODE_ENV=production`
7. Deploy and get your URL

#### DigitalOcean App Platform

1. Visit [DigitalOcean App Platform](https://cloud.digitalocean.com/apps)
2. Click "Create App"
3. Select GitHub repository
4. Configure:
   - **Resource Type**: Docker Container
   - **Port**: 3000
   - **Environment Variables**: Add `SESSION_SECRET`, `ADMIN_PASSWORD`, `NODE_ENV`
5. Add managed database (optional)
6. Deploy

## ✅ Health Check Verification

After installation, verify everything is working:

### Check Application Health

```bash
# Test health endpoint
curl http://localhost:3000/api/health

# Expected response:
# {"status":"ok","uptime":123,"timestamp":"..."}
```

### Check Docker Container (if using Docker)

```bash
# Check container status
docker compose ps

# Expected output:
# NAME                   STATUS
# digital-photo-frame    Up 5 minutes (healthy)

# View recent logs
docker compose logs --tail=50 photo-frame
```

### Access Web Interface

1. Open http://localhost:3000 (or your configured URL)
2. You should see the login page
3. Log in with your admin password
4. Navigate to `/admin` to access the admin panel
5. Upload a test photo to verify functionality

## 🔄 Update Procedures

### Docker Compose

```bash
# Stop the application
docker compose down

# Pull latest changes
git pull

# Pull latest image (if using pre-built images)
docker compose pull

# Restart with new version
docker compose up -d

# Verify
docker compose ps
```

### Manual Installation

```bash
# Stop the server (Ctrl+C if running in foreground)

# Pull latest changes
git pull

# Update dependencies
cd server
npm install

# Restart server
npm start
```

### Check Version

```bash
# View changelog
cat CHANGELOG.md

# Check package version
cat server/package.json | grep version
```

## 🗑️ Uninstall Procedures

### Docker Compose Uninstall

```bash
# Stop and remove containers
cd /path/to/sora-digital-photo-frame
docker compose down

# Remove volumes (⚠️ THIS DELETES ALL PHOTOS AND DATA)
docker volume rm sora-digital-photo-frame_photo-uploads
docker volume rm sora-digital-photo-frame_photo-data
docker volume rm sora-digital-photo-frame_photo-logs

# Or remove all project volumes at once
docker compose down -v

# Remove images
docker rmi digital-photo-frame

# Remove repository
cd ..
rm -rf sora-digital-photo-frame
```

### Manual Uninstall

```bash
# Stop the server (Ctrl+C)

# Remove repository
cd /path/to
rm -rf sora-digital-photo-frame

# Remove uploaded files and data
rm -rf ~/sora-frame-data  # If you moved data elsewhere
```

### Production VPS Uninstall

```bash
# Stop Docker containers
cd /opt/sora-digital-photo-frame
sudo docker compose down -v

# Remove Nginx configuration
sudo rm /etc/nginx/sites-enabled/sora-frame
sudo rm /etc/nginx/sites-available/sora-frame
sudo systemctl reload nginx

# Remove SSL certificates (optional)
sudo certbot delete -d photos.yourdomain.com

# Remove repository
cd /opt
sudo rm -rf sora-digital-photo-frame

# Remove update script and cron job
sudo rm /opt/update-sora-frame.sh
sudo crontab -e  # Remove the update line
```

## 🔧 Next Steps

After installation:

1. **Configure your setup**: See the [Configuration Guide](Configuration-Guide) for detailed options
2. **Set up Google Photos** (optional): Follow the [Google Photos Setup](Google-Photos-Setup) guide
3. **Learn the features**: Check out the [Features](Features) guide
4. **Troubleshoot issues**: Visit the [Troubleshooting](Troubleshooting) page if you encounter problems

## 📞 Need Help?

- Check the [Troubleshooting](Troubleshooting) guide
- Search [GitHub Issues](https://github.com/TLMInit/sora-digital-photo-frame/issues)
- Ask in [GitHub Discussions](https://github.com/TLMInit/sora-digital-photo-frame/discussions)
- Review the [Configuration Guide](Configuration-Guide)

---

**Installation complete!** 🎉 Head to the [Configuration Guide](Configuration-Guide) to customize your setup.
