class UploadTokensManager {
    constructor() {
        this.tokens = [];
        this.folders = [];
        this.currentQrToken = null;
        this.currentDeleteToken = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadTokens();
        this.loadFolders();
    }

    // Helper method to add CSRF token to fetch options
    addCsrfToken(options = {}) {
        if (window.csrfManager) {
            return window.csrfManager.addToRequest(options);
        }
        return options;
    }

    // Helper method to update CSRF token from response
    updateCsrfToken(data) {
        if (window.csrfManager && data) {
            window.csrfManager.updateFromResponse(data);
        }
    }

    bindEvents() {
        // Back button
        document.getElementById('backBtn').addEventListener('click', () => {
            window.location.href = '/admin';
        });

        // Create new token button
        document.getElementById('createTokenBtn').addEventListener('click', () => {
            this.openTokenModal();
        });

        // Modal events
        document.getElementById('cancelTokenBtn').addEventListener('click', () => {
            this.closeTokenModal();
        });

        document.getElementById('closeTokenModal').addEventListener('click', () => {
            this.closeTokenModal();
        });

        document.getElementById('tokenForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveToken();
        });

        // Save token button (triggers form submit)
        document.getElementById('saveTokenBtn').addEventListener('click', () => {
            document.getElementById('tokenForm').requestSubmit();
        });

        // Token created modal
        document.getElementById('closeCreatedModalBtn').addEventListener('click', () => {
            this.closeTokenCreatedModal();
        });

        document.getElementById('copyCreatedLinkBtn').addEventListener('click', () => {
            this.copyTokenLink(document.getElementById('createdTokenLink').textContent);
        });

        // QR modal events
        document.getElementById('closeQrModal').addEventListener('click', () => {
            this.closeQrModal();
        });

        document.getElementById('closeQrModalBtn').addEventListener('click', () => {
            this.closeQrModal();
        });

        document.getElementById('downloadQrBtn').addEventListener('click', () => {
            this.downloadQrCode();
        });

        // Delete modal events
        document.getElementById('cancelDeleteBtn').addEventListener('click', () => {
            this.closeDeleteModal();
        });

        document.getElementById('confirmDeleteBtn').addEventListener('click', () => {
            this.deleteToken();
        });
    }

    async loadTokens() {
        try {
            this.showLoading();
            const options = this.addCsrfToken({ credentials: 'include' });
            const response = await fetch('/api/upload-tokens', options);
            const data = await response.json();
            
            if (response.ok) {
                this.updateCsrfToken(data);
                this.tokens = data.tokens || [];
                this.renderTokens();
            } else {
                this.showToast('Failed to load upload links', 'error');
                this.showEmptyState();
            }
        } catch (error) {
            console.error('Error loading tokens:', error);
            this.showToast('Failed to load upload links', 'error');
            this.showEmptyState();
        }
    }

    async loadFolders() {
        try {
            const options = this.addCsrfToken({ credentials: 'include' });
            const response = await fetch('/api/folders', options);
            const data = await response.json();
            
            if (response.ok && data.folders) {
                this.updateCsrfToken(data);
                this.folders = data.folders.map(folder => ({
                    name: folder.name,
                    path: folder.path || folder.name
                }));
                this.populateFolderSelect();
            }
        } catch (error) {
            console.error('Error loading folders:', error);
        }
    }

    populateFolderSelect() {
        const select = document.getElementById('targetFolder');
        select.innerHTML = '<option value="uploads">uploads (default)</option>';
        
        this.folders.forEach(folder => {
            const option = document.createElement('option');
            option.value = folder.path;
            option.textContent = folder.name;
            select.appendChild(option);
        });
    }

    showLoading() {
        document.getElementById('loadingState').classList.remove('hidden');
        document.getElementById('tokensList').classList.add('hidden');
        document.getElementById('emptyState').classList.add('hidden');
    }

    showEmptyState() {
        document.getElementById('loadingState').classList.add('hidden');
        document.getElementById('tokensList').classList.add('hidden');
        document.getElementById('emptyState').classList.remove('hidden');
    }

    renderTokens() {
        document.getElementById('loadingState').classList.add('hidden');
        
        if (this.tokens.length === 0) {
            this.showEmptyState();
            return;
        }

        document.getElementById('emptyState').classList.add('hidden');
        const tokensList = document.getElementById('tokensList');
        tokensList.classList.remove('hidden');
        
        tokensList.innerHTML = this.tokens.map(token => this.renderTokenCard(token)).join('');
        
        // Bind token action events
        this.bindTokenActions();
    }

    renderTokenCard(token) {
        const now = Date.now();
        const isExpired = token.expiresAt && now > token.expiresAt;
        const isDisabled = !token.enabled;
        const isLimitReached = token.uploadLimit && token.uploadCount >= token.uploadLimit;
        
        let status = 'active';
        let statusText = 'Active';
        if (isExpired) {
            status = 'expired';
            statusText = 'Expired';
        } else if (isDisabled) {
            status = 'disabled';
            statusText = 'Disabled';
        } else if (isLimitReached) {
            status = 'expired';
            statusText = 'Limit Reached';
        }

        const expiresDate = token.expiresAt ? new Date(token.expiresAt).toLocaleDateString() : 'Never';
        const uploadProgress = token.uploadLimit 
            ? `${token.uploadCount} / ${token.uploadLimit}`
            : `${token.uploadCount} (unlimited)`;

        const shareUrl = `${window.location.origin}/guest-upload?token=TOKEN_HIDDEN`;

        return `
            <div class="card token-card" data-token-id="${token.id}">
                <div class="token-header">
                    <div>
                        <h3 class="font-semibold text-lg">${this.escapeHtml(token.name)}</h3>
                        <span class="token-status ${status}">${statusText}</span>
                    </div>
                    <div class="token-actions">
                        <button class="btn-sm-icon toggle-token-btn" data-token-id="${token.id}" data-enabled="${token.enabled}" title="${token.enabled ? 'Disable' : 'Enable'} link">
                            <span class="material-symbols-outlined">${token.enabled ? 'link_off' : 'link'}</span>
                        </button>
                        <button class="btn-sm-icon qr-btn" data-token-id="${token.id}" title="Show QR Code">
                            <span class="material-symbols-outlined">qr_code</span>
                        </button>
                        <button class="btn-sm-icon-destructive delete-token-btn" data-token-id="${token.id}" title="Delete link">
                            <span class="material-symbols-outlined">delete</span>
                        </button>
                    </div>
                </div>

                <div class="token-info">
                    <div>
                        <span class="text-muted-foreground">Target Folder:</span>
                        <span class="font-medium">${this.escapeHtml(token.targetFolder || 'uploads')}</span>
                    </div>
                    <div>
                        <span class="text-muted-foreground">Uploads:</span>
                        <span class="font-medium">${uploadProgress}</span>
                    </div>
                    <div>
                        <span class="text-muted-foreground">Expires:</span>
                        <span class="font-medium">${expiresDate}</span>
                    </div>
                    <div>
                        <span class="text-muted-foreground">Created:</span>
                        <span class="font-medium">${new Date(token.createdAt).toLocaleDateString()}</span>
                    </div>
                </div>

                <div class="mt-4">
                    <label class="label text-sm">Shareable Link</label>
                    <div class="token-link">
                        <span class="token-link-text">${shareUrl}</span>
                        <button type="button" class="btn-sm-icon copy-link-btn" data-token-id="${token.id}" title="Copy link">
                            <span class="material-symbols-outlined">content_copy</span>
                        </button>
                    </div>
                    <p class="text-xs text-muted-foreground mt-1">Click copy to get the full link with token</p>
                </div>
            </div>
        `;
    }

    bindTokenActions() {
        // Copy link buttons
        document.querySelectorAll('.copy-link-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const tokenId = btn.dataset.tokenId;
                await this.copyFullTokenLink(tokenId);
            });
        });

        // QR code buttons
        document.querySelectorAll('.qr-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const tokenId = btn.dataset.tokenId;
                await this.showQrCode(tokenId);
            });
        });

        // Toggle enable/disable
        document.querySelectorAll('.toggle-token-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const tokenId = btn.dataset.tokenId;
                const isEnabled = btn.dataset.enabled === 'true';
                await this.toggleToken(tokenId, !isEnabled);
            });
        });

        // Delete buttons
        document.querySelectorAll('.delete-token-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tokenId = btn.dataset.tokenId;
                this.confirmDeleteToken(tokenId);
            });
        });
    }

    openTokenModal() {
        document.getElementById('tokenForm').reset();
        document.getElementById('modal-title').textContent = 'Create Upload Link';
        document.getElementById('tokenModal').showModal();
    }

    closeTokenModal() {
        document.getElementById('tokenModal').close();
    }

    closeTokenCreatedModal() {
        document.getElementById('tokenCreatedModal').close();
    }

    async saveToken() {
        try {
            const form = document.getElementById('tokenForm');
            const formData = new FormData(form);
            
            const expiresInDays = parseInt(formData.get('expiresInDays'));
            // If 0 days, set to null (never expires). Otherwise calculate expiration timestamp
            const expiresAt = expiresInDays === 0 ? null : Date.now() + ((expiresInDays || 30) * 24 * 60 * 60 * 1000);
            
            const tokenData = {
                name: formData.get('name'),
                targetFolder: formData.get('targetFolder'),
                expiresAt: expiresAt,
                uploadLimit: formData.get('uploadLimit') ? parseInt(formData.get('uploadLimit')) : null
            };

            const options = this.addCsrfToken({
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(tokenData)
            });

            const response = await fetch('/api/upload-tokens', options);
            const data = await response.json();

            if (response.ok && data.success) {
                this.updateCsrfToken(data);
                this.closeTokenModal();
                this.showTokenCreated(data.plainToken, data.token);
                await this.loadTokens();
            } else {
                this.showToast(data.error || 'Failed to create upload link', 'error');
            }
        } catch (error) {
            console.error('Error creating token:', error);
            this.showToast('Failed to create upload link', 'error');
        }
    }

    showTokenCreated(plainToken, tokenMetadata) {
        const shareUrl = `${window.location.origin}/guest-upload?token=${plainToken}`;
        document.getElementById('createdTokenLink').textContent = shareUrl;
        
        // Generate QR code
        const canvas = document.getElementById('createdTokenQR');
        
        // Check if QRCode library is available
        if (typeof QRCode !== 'undefined') {
            try {
                QRCode.toCanvas(canvas, shareUrl, {
                    width: 256,
                    margin: 2,
                    color: {
                        dark: '#000000',
                        light: '#ffffff'
                    }
                }, (error) => {
                    if (error) {
                        console.error('QR code generation error:', error);
                        canvas.style.display = 'none';
                        const fallback = document.createElement('div');
                        fallback.className = 'alert alert-warning';
                        fallback.textContent = 'QR code generation failed. You can still copy the link above.';
                        canvas.parentNode.appendChild(fallback);
                    }
                });
            } catch (err) {
                console.error('QRCode error:', err);
                canvas.style.display = 'none';
            }
        } else {
            console.error('QRCode library not loaded');
            canvas.style.display = 'none';
            const fallback = document.createElement('div');
            fallback.className = 'alert alert-warning';
            fallback.textContent = 'QR code library not loaded. Please copy the link above to share.';
            canvas.parentNode.appendChild(fallback);
        }

        document.getElementById('tokenCreatedModal').showModal();
    }

    async copyFullTokenLink(tokenId) {
        try {
            // Fetch the token with decrypted plain token
            const options = this.addCsrfToken({ credentials: 'include' });
            const response = await fetch(`/api/upload-tokens/${tokenId}`, options);
            const data = await response.json();
            
            if (response.ok && data.success && data.token.plainToken) {
                this.updateCsrfToken(data);
                const shareUrl = `${window.location.origin}/guest-upload?token=${data.token.plainToken}`;
                await this.copyTokenLink(shareUrl);
            } else {
                this.showToast('Unable to retrieve full link', 'error');
            }
        } catch (error) {
            console.error('Error copying link:', error);
            this.showToast('Failed to copy link', 'error');
        }
    }

    async copyTokenLink(link) {
        try {
            await navigator.clipboard.writeText(link);
            this.showToast('Link copied to clipboard!', 'success');
        } catch (error) {
            console.error('Error copying link:', error);
            this.showToast('Failed to copy link', 'error');
        }
    }

    async showQrCode(tokenId) {
        try {
            // Check if QRCode library is available
            if (typeof QRCode === 'undefined') {
                console.error('QRCode library not loaded');
                this.showToast('QR code library not available. Please refresh the page.', 'error');
                return;
            }
            
            // Fetch the token with decrypted plain token
            const options = this.addCsrfToken({ credentials: 'include' });
            const response = await fetch(`/api/upload-tokens/${tokenId}`, options);
            const data = await response.json();
            
            if (response.ok && data.success && data.token.plainToken) {
                this.updateCsrfToken(data);
                const shareUrl = `${window.location.origin}/guest-upload?token=${data.token.plainToken}`;
                
                // Generate QR code
                const canvas = document.getElementById('qrCanvas');
                
                try {
                    await new Promise((resolve, reject) => {
                        QRCode.toCanvas(canvas, shareUrl, {
                            width: 300,
                            margin: 2,
                            color: {
                                dark: '#000000',
                                light: '#ffffff'
                            }
                        }, (error) => {
                            if (error) {
                                console.error('QR code generation error:', error);
                                reject(error);
                            } else {
                                resolve();
                            }
                        });
                    });
                } catch (qrError) {
                    console.error('QR code generation failed:', qrError);
                    canvas.style.display = 'none';
                    this.showToast('QR code generation failed, but you can still copy the link', 'warning');
                }
                
                // Set the link text and token name
                document.getElementById('qrLinkText').textContent = shareUrl;
                document.getElementById('qrTokenName').textContent = data.token.name;
                
                // Show modal
                document.getElementById('qrModal').showModal();
            } else {
                this.showToast('Unable to generate QR code', 'error');
            }
        } catch (error) {
            console.error('Error showing QR code:', error);
            this.showToast('Failed to generate QR code', 'error');
        }
    }

    async toggleToken(tokenId, enabled) {
        try {
            const options = this.addCsrfToken({
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ enabled })
            });

            const response = await fetch(`/api/upload-tokens/${tokenId}`, options);
            const data = await response.json();

            if (response.ok && data.success) {
                this.updateCsrfToken(data);
                this.showToast(enabled ? 'Link enabled' : 'Link disabled', 'success');
                await this.loadTokens();
            } else {
                this.showToast(data.error || 'Failed to update link', 'error');
            }
        } catch (error) {
            console.error('Error toggling token:', error);
            this.showToast('Failed to update link', 'error');
        }
    }

    confirmDeleteToken(tokenId) {
        this.currentDeleteToken = tokenId;
        document.getElementById('deleteModal').showModal();
    }

    async deleteToken() {
        try {
            const tokenId = this.currentDeleteToken;
            const options = this.addCsrfToken({
                method: 'DELETE',
                credentials: 'include'
            });

            const response = await fetch(`/api/upload-tokens/${tokenId}`, options);
            const data = await response.json();

            if (response.ok && data.success) {
                this.updateCsrfToken(data);
                this.showToast('Upload link deleted successfully', 'success');
                this.closeDeleteModal();
                await this.loadTokens();
            } else {
                this.showToast(data.error || 'Failed to delete link', 'error');
            }
        } catch (error) {
            console.error('Error deleting token:', error);
            this.showToast('Failed to delete link', 'error');
        }
    }

    closeDeleteModal() {
        this.currentDeleteToken = null;
        document.getElementById('deleteModal').close();
    }

    closeQrModal() {
        document.getElementById('qrModal').close();
    }

    downloadQrCode() {
        const canvas = document.getElementById('qrCanvas');
        const tokenName = document.getElementById('qrTokenName').textContent || 'upload-link';
        const link = document.createElement('a');
        link.download = `${tokenName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-qr-code.png`;
        link.href = canvas.toDataURL();
        link.click();
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showToast(message, type = 'info') {
        // Use Basecoat toast if available, otherwise simple alert
        console.log(`[${type.toUpperCase()}] ${message}`);
        
        // Create a simple toast notification
        const toast = document.createElement('div');
        toast.className = `alert-${type === 'error' ? 'destructive' : type === 'success' ? 'success' : 'default'}`;
        toast.style.cssText = 'position: fixed; top: 1rem; right: 1rem; z-index: 9999; min-width: 300px; animation: slideIn 0.3s ease;';
        toast.innerHTML = `
            <span class="material-symbols-outlined">${type === 'error' ? 'error' : type === 'success' ? 'check_circle' : 'info'}</span>
            <section>${message}</section>
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Debug: Check if QRCode is available
    console.log('QRCode library status:', typeof QRCode !== 'undefined' ? 'Loaded ✓' : 'NOT LOADED ✗');
    if (typeof QRCode !== 'undefined') {
        console.log('QRCode object:', QRCode);
    }
    new UploadTokensManager();
});
