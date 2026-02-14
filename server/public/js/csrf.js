/**
 * CSRF Token Management Utility
 * Handles CSRF token retrieval and injection into API requests
 */

class CsrfTokenManager {
  constructor() {
    this.token = null;
    this.tokenName = '_csrf';
    this.init();
  }

  init() {
    // Try to get CSRF token from meta tag
    const metaTag = document.querySelector('meta[name="csrf-token"]');
    if (metaTag) {
      this.token = metaTag.getAttribute('content');
    }
    
    // Try to get from cookie
    if (!this.token) {
      this.token = this.getCsrfFromCookie();
    }
  }

  getCsrfFromCookie() {
    const name = 'XSRF-TOKEN=';
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      cookie = cookie.trim();
      if (cookie.indexOf(name) === 0) {
        return decodeURIComponent(cookie.substring(name.length));
      }
    }
    return null;
  }

  getToken() {
    return this.token;
  }

  setToken(token) {
    this.token = token;
  }

  /**
   * Update CSRF token from API response
   */
  updateFromResponse(data) {
    if (data && data._csrf) {
      this.token = data._csrf;
    }
  }

  /**
   * Add CSRF token to request options
   */
  addToRequest(options = {}) {
    if (!options.headers) {
      options.headers = {};
    }

    // Add CSRF token to headers
    if (this.token) {
      options.headers['X-CSRF-Token'] = this.token;
      options.headers['CSRF-Token'] = this.token;
    }

    // For POST/PUT/PATCH/DELETE, also add to body if it's FormData
    if (options.body instanceof FormData && this.token) {
      options.body.append(this.tokenName, this.token);
    }

    return options;
  }

  /**
   * Wrapper for fetch that automatically adds CSRF token
   */
  async fetch(url, options = {}) {
    options = this.addToRequest(options);
    
    try {
      const response = await fetch(url, options);
      
      // Try to extract CSRF token from response if it's JSON
      if (response.ok && response.headers.get('content-type')?.includes('application/json')) {
        try {
          const clone = response.clone();
          const data = await clone.json();
          this.updateFromResponse(data);
        } catch (e) {
          // Ignore JSON parse errors
        }
      }
      
      return response;
    } catch (error) {
      throw error;
    }
  }
}

// Create global instance
const csrfManager = new CsrfTokenManager();

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = csrfManager;
}

// Make available globally
if (typeof window !== 'undefined') {
  window.csrfManager = csrfManager;
}
