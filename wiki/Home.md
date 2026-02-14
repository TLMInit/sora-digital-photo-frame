# 🖼️ SORA Digital Photo Frame Wiki

Welcome to the comprehensive documentation for **SORA Frame** - an open-source digital photo frame that turns any device with a web browser into a smart, beautiful photo display.

## 🎯 Overview

SORA Frame is a self-hosted web application that lets you:
- 📸 Display your photos in a beautiful full-screen slideshow
- 🌐 Manage photos remotely from any device
- 📁 Organize photos in nested folders
- ☁️ Sync with Google Photos (optional)
- 🔒 Secure admin access with authentication
- 🐳 Easy deployment with Docker

Perfect for tablets, smart TVs, old laptops, or any device with a modern web browser!

## 📚 Documentation Navigation

This wiki provides comprehensive guides for installing, configuring, and using SORA Frame:

### Getting Started
- **[Installation Guide](Installation-Guide)** - Complete installation instructions for all platforms
- **[Configuration Guide](Configuration-Guide)** - Detailed .env configuration reference
- **[Google Photos Setup](Google-Photos-Setup)** - Step-by-step OAuth integration guide

### Using SORA Frame
- **[Features](Features)** - Complete feature documentation with keyboard shortcuts
- **[Troubleshooting](Troubleshooting)** - Common issues and solutions

## ⚡ Quick Start with Docker

The fastest way to get started:

```bash
# 1. Clone the repository
git clone https://github.com/TLMInit/sora-digital-photo-frame.git
cd sora-digital-photo-frame

# 2. Copy and edit environment configuration
cp .env.example .env
nano .env  # Set SESSION_SECRET and ADMIN_PASSWORD

# 3. Start with Docker Compose
docker compose up -d

# 4. Access the application
# Open http://localhost:3000 in your browser
```

Default admin password is `admin123` (change this immediately!)

📖 **Full instructions:** See the [Installation Guide](Installation-Guide) for detailed setup steps.

## 🌟 Key Features

- ✨ **Beautiful Slideshow** - Full-screen display with smooth transitions
- 🎮 **Remote Management** - Finder-like admin panel with drag & drop
- 📂 **Folder Organization** - Nested folders with targeted slideshows
- ☁️ **Google Photos Sync** - Optional integration with your Google Photos library
- 🎨 **Modern UI** - Material Design 3 with responsive layout
- ⌨️ **Keyboard Navigation** - Full keyboard shortcuts for slideshow and admin
- 🔒 **Secure** - Session-based authentication with bcrypt password hashing
- 📱 **Responsive** - Works on all screen sizes and orientations
- 🛡️ **Always On** - Wake Lock prevents display from sleeping
- 🐳 **Docker Ready** - Easy deployment with Docker Compose

## 📖 Documentation Structure

### For New Users
1. Start with the [Installation Guide](Installation-Guide) to get SORA Frame running
2. Follow the [Configuration Guide](Configuration-Guide) to customize your setup
3. Optional: Set up [Google Photos integration](Google-Photos-Setup)
4. Explore all [Features](Features) available

### For Troubleshooting
- Check the [Troubleshooting](Troubleshooting) guide for common issues
- Review configuration in the [Configuration Guide](Configuration-Guide)
- Verify Google Photos setup in [Google Photos Setup](Google-Photos-Setup)

## 🆘 Support & Resources

- 🌐 **Website**: [sora-frame.vercel.app](https://sora-frame.vercel.app/)
- 📚 **Online Docs**: [docs-sora-frame.vercel.app](https://docs-sora-frame.vercel.app/)
- 🐛 **Issues**: [GitHub Issues](https://github.com/TLMInit/sora-digital-photo-frame/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/TLMInit/sora-digital-photo-frame/discussions)
- 📋 **Changelog**: [CHANGELOG.md](../CHANGELOG.md)

## 🔗 Quick Links

- [README](../README.md) - Project overview
- [DOCKER.md](../DOCKER.md) - Docker-specific documentation
- [.env.example](../server/.env.example) - Environment configuration template
- [docker-compose.yml](../docker-compose.yml) - Docker Compose configuration

## 🤝 Contributing

SORA Frame is open source and welcomes contributions! If you find issues or have suggestions, please:
1. Check existing [Issues](https://github.com/TLMInit/sora-digital-photo-frame/issues)
2. Create a new issue with detailed information
3. Submit pull requests with improvements

## 📝 License

This project is licensed under the ISC License.

---

**Ready to get started?** Head over to the [Installation Guide](Installation-Guide) to begin! 🚀
