<div align="center">
<img width="1022" height="256" alt="sora_github_banner" src="https://github.com/user-attachments/assets/dc1dd451-e360-4245-a062-32e667db05bb" />
   
### Open Source Digital Photo Frame

[Website](https://sora-frame.vercel.app/)  |  [Quick Start](https://docs-sora-frame.vercel.app/quickstart/)  |  [Docs](https://docs-sora-frame.vercel.app/)  |  [API References](https://docs-sora-frame.vercel.app/api-reference/introduction)  |  [📚 Wiki Documentation](https://tlminit.github.io/sora-digital-photo-frame/)

</div>

> **Note:** This is a fork of [Sorbh/sora-digital-photo-frame](https://github.com/Sorbh/sora-digital-photo-frame). Visit the [original repository](https://github.com/Sorbh/sora-digital-photo-frame) for the upstream project.

# SORA Frame
Turn any device with a web browser into a smart, open-source digital photo frame. Manage your photos remotely and enjoy a beautiful, full-screen slideshow on any tablet, laptop, or smart TV.

<img width="1885" alt="slideshow-preview" src="https://github.com/user-attachments/assets/4740a698-08f5-4b7c-bb2e-603ca0ebf012" />

## Features Highlights

### Core Features
- **Run Anywhere**: Works on any device with a modern web browser.
- **Beautiful Slideshow**: A clean, full-screen photo display with smooth fade transitions, auto-advance, and random image display.
- **Remote Management**: A Finder-like admin panel to upload, organize, and delete photos and folders from any device on your network. Supports drag-and-drop.
- **Targeted Slideshows**: An interactive folder selector to display photos from specific folders, including nested ones. Your last selected folder is even remembered across sessions.
- **Modern UI**: Clean and responsive interface following Material Design 3 principles.
- **Keyboard-Friendly**: Full keyboard navigation and shortcuts for both the slideshow and admin panel.
- **Always On**: Wake Lock support prevents the display device from sleeping during a slideshow.
- **Responsive Design**: Optimized for all screen sizes and orientations.

### 👨‍👩‍👧‍👦 Family-Friendly Features

- **🎁 Guest Upload Links**: Perfect for family gatherings! Create secure upload links that allow family members and friends to contribute photos directly to your digital frame without needing admin access or technical knowledge.
  - **No login required** - Just click the link and upload
  - **Secure token-based access** - Cryptographically secure, one-time-use links
  - **Customizable settings**:
    - Set expiration dates (e.g., 30 days)
    - Limit number of uploads per link
    - Choose target folder for uploads
    - Enable/disable links at any time
  - **Easy to share** - Copy link or scan QR code
  - **Perfect for events** - Weddings, birthdays, reunions, holidays
  - **Real-time uploads** - Photos appear on your frame as they're uploaded
  - **Track usage** - See how many photos have been uploaded with each link

This makes SORA Frame ideal for keeping distant family members connected by allowing everyone to share moments that automatically appear on your display.

## How It Works

### Managing Photos

Access the admin panel by navigating to `http://your-server-ip:3000/admin` and logging in with your password.

From there, you can:
- **Upload Photos**: Drag and drop images directly into the current folder or use the upload button.
- **Organize**: Create and delete nested folders to organize your library.
- **Supported formats**: JPEG, PNG, WebP, GIF.

### Guest Upload Links for Family Events

SORA Frame makes it easy for everyone to contribute photos to your digital frame through secure, shareable upload links.

#### How to Create Upload Links:

1. **Access Admin Panel**: Navigate to `http://your-server-ip:3000/admin` and log in
2. **Click "Guest Upload Links"**: Find the button in the admin toolbar
3. **Create a New Link**:
   - Give it a memorable name (e.g., "Birthday Party 2024")
   - Choose where uploads should go (target folder)
   - Set an expiration date (default: 30 days)
   - Optionally set an upload limit (e.g., max 50 photos)
4. **Share the Link**: Copy the URL or generate a QR code for easy mobile scanning
5. **Manage Links**: View upload counts, disable links, or delete them when done

#### Guest Experience:
- No account creation or PIN required
- Simply visit the link and start uploading
- Drag-and-drop or browse to select photos
- Instant upload confirmation
- Photos appear on the frame immediately

Perfect for weddings, reunions, holidays, parties, and any event where you want everyone to share their favorite moments!

### Viewing the Slideshow

On the slideshow screen, you can:
- **Filter by Folder**: Click the folder icon to open the folder selector. You can view all photos or select a specific folder, including nested ones. The slideshow updates instantly.
- **Control Playback**: Use keyboard shortcuts to play/pause, advance to the next image, and more.

#### Slideshow Keyboard Shortcuts
- `Space` or `K`: Play/pause slideshow
- `Right Arrow` or `N`: Next image
- `F`: Toggle fullscreen mode
- `I`: Show/hide image information

## Documentation

📚 **[View Full Documentation](https://tlminit.github.io/sora-digital-photo-frame/)** - Complete guides including installation, configuration, features, Google Photos setup, and troubleshooting.

## License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## Support

- **This Fork**: [GitHub Issues](https://github.com/TLMInit/sora-digital-photo-frame/issues)
- **Original Project**: [Sorbh/sora-digital-photo-frame](https://github.com/Sorbh/sora-digital-photo-frame)
- **Original Issues**: [GitHub Issues](https://github.com/sorbh/digital-photo-frame/issues)
- **Discussions**: [GitHub Discussions](https://github.com/sorbh/digital-photo-frame/discussions)

## Repository Information

- **This Repository (Fork)**: [TLMInit/sora-digital-photo-frame](https://github.com/TLMInit/sora-digital-photo-frame)
- **Original Repository**: [Sorbh/sora-digital-photo-frame](https://github.com/Sorbh/sora-digital-photo-frame)

---

**Transform any device into a beautiful digital photo frame!** 📸✨

---

<p align="center">
Built with ❤️ by Claude Code - Monitored & Prompted by Saurabh K. Sharma
</p>