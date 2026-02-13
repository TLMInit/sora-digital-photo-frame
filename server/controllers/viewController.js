const path = require('path');
const fs = require('fs');

class ViewController {
  // Helper method to inject BASE_PATH into HTML
  _injectBasePath(html, basePath) {
    // Inject a global variable in the head section
    const basePathScript = `<script>window.BASE_PATH = '${basePath || ''}';</script>`;
    
    // Inject after <head> tag
    const injectedHtml = html.replace(
      /(<head[^>]*>)/i,
      `$1\n    ${basePathScript}`
    );
    
    // Update relative paths for local resources
    return injectedHtml
      .replace(/src="\/js\//g, `src="${basePath}/js/`)
      .replace(/src="\/admin\//g, `src="${basePath}/admin/`)
      .replace(/href="\/js\//g, `href="${basePath}/js/`)
      .replace(/href="\/admin\//g, `href="${basePath}/admin/`)
      // Handle script tags without leading slash
      .replace(/src="admin\.js"/g, `src="${basePath}/admin.js"`)
      .replace(/src="js\//g, `src="${basePath}/js/`);
  }

  // Serve admin panel
  serveAdmin(req, res) {
    const basePath = res.locals.basePath || '';
    const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
    
    fs.readFile(adminPath, 'utf8', (err, data) => {
      if (err) {
        console.error('Error reading admin.html:', err);
        return res.status(500).send('Error loading admin panel');
      }
      
      const modifiedData = this._injectBasePath(data, basePath);
      res.setHeader('Content-Type', 'text/html');
      res.send(modifiedData);
    });
  }

  // Serve access accounts page
  serveAccessAccounts(req, res) {
    const basePath = res.locals.basePath || '';
    const accessAccountsPath = path.join(__dirname, '..', 'public', 'access-accounts.html');
    
    fs.readFile(accessAccountsPath, 'utf8', (err, data) => {
      if (err) {
        console.error('Error reading access-accounts.html:', err);
        return res.status(500).send('Error loading access accounts page');
      }
      
      const modifiedData = this._injectBasePath(data, basePath);
      res.setHeader('Content-Type', 'text/html');
      res.send(modifiedData);
    });
  }

  // Serve slideshow page
  serveSlideshow(req, res) {
    const slideshowPath = path.join(__dirname, '..', 'public', 'slideshow.html');
    const defaultInterval = process.env.DEFAULT_SLIDESHOW_INTERVAL || 15000;
    const basePath = res.locals.basePath || '';
    
    // Read the HTML file
    fs.readFile(slideshowPath, 'utf8', (err, data) => {
      if (err) {
        console.error('Error reading slideshow.html:', err);
        return res.status(500).send('Error loading slideshow');
      }
      
      // Replace the hardcoded interval with the environment variable
      let modifiedData = data.replace(
        /this\.interval = 15000;.*$/m,
        `this.interval = ${defaultInterval}; // From DEFAULT_SLIDESHOW_INTERVAL`
      );
      
      // Inject BASE_PATH
      modifiedData = this._injectBasePath(modifiedData, basePath);
      
      res.setHeader('Content-Type', 'text/html');
      res.send(modifiedData);
    });
  }

  // Serve folder selection page
  serveFolderSelection(req, res) {
    const basePath = res.locals.basePath || '';
    const folderSelectionPath = path.join(__dirname, '..', 'public', 'folder-selection.html');
    
    fs.readFile(folderSelectionPath, 'utf8', (err, data) => {
      if (err) {
        console.error('Error reading folder-selection.html:', err);
        return res.status(500).send('Error loading folder selection page');
      }
      
      const modifiedData = this._injectBasePath(data, basePath);
      res.setHeader('Content-Type', 'text/html');
      res.send(modifiedData);
    });
  }

  // Serve login page
  serveLogin(req, res) {
    const basePath = res.locals.basePath || '';
    const loginPath = path.join(__dirname, '..', 'public', 'login.html');
    
    fs.readFile(loginPath, 'utf8', (err, data) => {
      if (err) {
        console.error('Error reading login.html:', err);
        return res.status(500).send('Error loading login page');
      }
      
      const modifiedData = this._injectBasePath(data, basePath);
      res.setHeader('Content-Type', 'text/html');
      res.send(modifiedData);
    });
  }

  // Redirect root to slideshow
  redirectToSlideshow(req, res) {
    const basePath = res.locals.basePath || '';
    res.redirect(`${basePath}/slideshow`);
  }
}

module.exports = new ViewController();