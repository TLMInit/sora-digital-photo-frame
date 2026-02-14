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
            const response = await fetch('/api/upload-tokens', { credentials: 'include' });
            const data = await response.json();
            
            if (response.ok) {
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
            const response = await fetch('/api/folders', { credentials: 'include' });
            const data = await response.json();
            
            if (response.ok && data.folders) {
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
            
            const expiresInDays = parseInt(formData.get('expiresInDays')) || 30;
            const expiresAt = Date.now() + (expiresInDays * 24 * 60 * 60 * 1000);
            
            const tokenData = {
                name: formData.get('name'),
                targetFolder: formData.get('targetFolder'),
                expiresAt: expiresAt,
                uploadLimit: formData.get('uploadLimit') ? parseInt(formData.get('uploadLimit')) : null
            };

            const response = await fetch('/api/upload-tokens', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(tokenData)
            });

            const data = await response.json();

            if (response.ok && data.success) {
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
        QRCode.toCanvas(canvas, shareUrl, {
            width: 256,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#ffffff'
            }
        }, (error) => {
            if (error) console.error('QR code generation error:', error);
        });

        document.getElementById('tokenCreatedModal').showModal();
    }

    async copyFullTokenLink(tokenId) {
        try {
            // We need to get the actual token to build the link
            // Since we don't store plain tokens, show a message
            this.showToast('⚠️ For security, full links are only shown once when created', 'warning');
        } catch (error) {
            console.error('Error copying link:', error);
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
        this.showToast('⚠️ QR codes can only be generated when link is first created', 'warning');
    }

    async toggleToken(tokenId, enabled) {
        try {
            const response = await fetch(`/api/upload-tokens/${tokenId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ enabled })
            });

            const data = await response.json();

            if (response.ok && data.success) {
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
            const response = await fetch(`/api/upload-tokens/${tokenId}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            const data = await response.json();

            if (response.ok && data.success) {
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
        const link = document.createElement('a');
        link.download = 'upload-qr-code.png';
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
    new UploadTokensManager();
});
