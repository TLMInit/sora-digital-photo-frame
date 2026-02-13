class GuestUploadManager {
    constructor() {
        this.currentPath = 'uploads';
        this.selectedFiles = [];
        this.emptyStateSelectedFiles = [];
        this.selectedItems = new Set();
        this.deleteTarget = null;
        this.accountInfo = null;

        this.checkSession();
    }

    async checkSession() {
        try {
            const response = await fetch('/api/auth/session', { credentials: 'include' });
            const data = await response.json();

            if (!data.authenticated || !data.account || !data.account.uploadAccess) {
                this.showPinLogin();
                return;
            }

            this.accountInfo = data.account;
            document.getElementById('userName').textContent = `Welcome, ${data.account.name}`;
            this.showApp();
            this.init();
        } catch (error) {
            console.error('Session check failed:', error);
            this.showPinLogin();
        }
    }

    showPinLogin() {
        document.getElementById('pinLoginOverlay').style.display = 'flex';
        document.getElementById('appContainer').classList.add('hidden');
        if (!this.pinLoginInitialized) {
            this.pinLoginInitialized = true;
            this.setupPinLogin();
        }
    }

    showApp() {
        document.getElementById('pinLoginOverlay').style.display = 'none';
        document.getElementById('appContainer').classList.remove('hidden');
    }

    setupPinLogin() {
        const form = document.getElementById('pinLoginForm');
        const pinInput = document.getElementById('pinInput');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const pin = pinInput.value.trim();
            if (!pin) return;

            const btn = document.getElementById('pinLoginBtn');
            const spinner = document.getElementById('pinSpinner');
            const btnText = form.querySelector('.pin-btn-text');
            const errorDiv = document.getElementById('pinErrorMessage');
            const errorText = document.getElementById('pinErrorText');

            btn.disabled = true;
            btnText.textContent = 'Signing in...';
            spinner.style.display = 'inline-block';
            errorDiv.style.display = 'none';

            try {
                const response = await fetch('/api/auth/pin', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ pin })
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    if (!data.account.uploadAccess) {
                        errorText.textContent = 'Your account does not have upload access.';
                        errorDiv.style.display = 'grid';
                    } else {
                        this.accountInfo = data.account;
                        document.getElementById('userName').textContent = `Welcome, ${data.account.name}`;
                        this.showApp();
                        this.init();
                    }
                } else {
                    let message = data.error || 'Invalid PIN';
                    if (data.attemptsRemaining !== undefined) {
                        message += ` (${data.attemptsRemaining} attempts remaining)`;
                    }
                    errorText.textContent = message;
                    errorDiv.style.display = 'grid';
                }
            } catch (error) {
                console.error('PIN login error:', error);
                errorText.textContent = 'Connection error. Please try again.';
                errorDiv.style.display = 'grid';
            } finally {
                btn.disabled = false;
                btnText.textContent = 'Sign In';
                spinner.style.display = 'none';
            }
        });

        pinInput.addEventListener('input', () => {
            document.getElementById('pinErrorMessage').style.display = 'none';
        });
    }

    init() {
        this.bindEvents();
        this.loadFolderContents();
    }

    bindEvents() {
        // Navigation
        document.getElementById('backBtn').addEventListener('click', () => this.navigateBack());

        // Breadcrumb navigation
        document.getElementById('breadcrumbContainer').addEventListener('click', (e) => {
            if (e.target.classList.contains('breadcrumb-item')) {
                this.navigateTo(e.target.dataset.path);
            }
        });

        // Upload modal
        document.getElementById('uploadBtn').addEventListener('click', () => this.showUploadModal());
        document.getElementById('closeUploadModal').addEventListener('click', () => this.hideUploadModal());
        document.getElementById('confirmUploadBtn').addEventListener('click', () => this.uploadFiles());
        document.getElementById('cancelUploadBtn').addEventListener('click', () => this.hideUploadModal());
        document.getElementById('uploadDropZone').addEventListener('click', () => document.getElementById('fileInput').click());

        document.getElementById('fileInput').addEventListener('change', (e) => {
            this.selectedFiles = Array.from(e.target.files);
            this.updateUploadButton();
            this.updateSelectedFilesDisplay();
        });

        // Upload drag and drop
        this.setupUploadDragAndDrop();

        // Empty state
        this.setupEmptyStateDragAndDrop();

        // Delete modals
        document.getElementById('cancelDeleteBtn').addEventListener('click', () => {
            document.getElementById('deleteModal').close();
        });
        document.getElementById('confirmDeleteBtn').addEventListener('click', () => this.executeDelete());

        // Bulk delete
        document.getElementById('fabDeleteBtn').addEventListener('click', () => this.showBulkDeleteModal());
        document.getElementById('cancelBulkDeleteBtn').addEventListener('click', () => {
            document.getElementById('bulkDeleteModal').close();
        });
        document.getElementById('confirmBulkDeleteBtn').addEventListener('click', () => this.executeBulkDelete());

        // Photo modal
        document.getElementById('closePhotoModal').addEventListener('click', () => {
            document.getElementById('photoModal').close();
        });

        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => {
            const currentMode = localStorage.getItem('themeMode') || 'system';
            let nextMode;
            switch (currentMode) {
                case 'light': nextMode = 'dark'; break;
                case 'dark': nextMode = 'system'; break;
                default: nextMode = 'light'; break;
            }
            document.dispatchEvent(new CustomEvent('basecoat:theme', { detail: { mode: nextMode } }));
            this.updateThemeButton(nextMode);
        });
        this.updateThemeButton(localStorage.getItem('themeMode') || 'system');

        // Logout
        document.getElementById('logoutBtn').addEventListener('click', () => this.logout());

        // Dialog backdrop clicks
        document.querySelectorAll('dialog').forEach(dialog => {
            dialog.addEventListener('click', (e) => {
                if (e.target === dialog) dialog.close();
            });
        });
    }

    updateThemeButton(mode) {
        const icon = document.getElementById('themeIcon');
        const btn = document.getElementById('themeToggle');
        switch (mode) {
            case 'light':
                icon.textContent = 'light_mode';
                btn.title = 'Switch to dark mode';
                break;
            case 'dark':
                icon.textContent = 'dark_mode';
                btn.title = 'Switch to system theme';
                break;
            default:
                icon.textContent = 'brightness_auto';
                btn.title = 'Switch to light mode';
        }
    }

    // --- Navigation ---

    navigateTo(path) {
        this.currentPath = path;
        this.updateURL();
        this.loadFolderContents();
    }

    navigateBack() {
        if (this.currentPath === 'uploads') return;
        const pathParts = this.currentPath.split('/');
        pathParts.pop();
        this.currentPath = pathParts.join('/') || 'uploads';
        this.updateURL();
        this.loadFolderContents();
    }

    updateURL() {
        const url = new URL(window.location);
        if (this.currentPath === 'uploads') {
            url.searchParams.delete('path');
        } else {
            url.searchParams.set('path', this.currentPath);
        }
        window.history.replaceState({}, '', url);
    }

    updateBreadcrumb() {
        const container = document.getElementById('breadcrumbContainer');
        const pathParts = this.currentPath.split('/');
        container.innerHTML = '';

        let currentPath = '';
        pathParts.forEach((part, index) => {
            if (index > 0) currentPath += '/';
            currentPath += part;

            if (index > 0) {
                const separatorLi = document.createElement('li');
                separatorLi.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                         fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="m9 18 6-6-6-6"/>
                    </svg>`;
                container.appendChild(separatorLi);
            }

            const li = document.createElement('li');
            const span = document.createElement('span');
            span.className = 'breadcrumb-item';
            const isCurrentPage = index === pathParts.length - 1;
            if (isCurrentPage) {
                span.className += ' text-foreground font-medium';
            } else {
                span.className += ' cursor-pointer hover:text-foreground transition-colors';
            }
            span.dataset.path = currentPath;
            span.textContent = index === 0 ? 'Home' : part;
            li.appendChild(span);
            container.appendChild(li);
        });
    }

    updateBackButton() {
        const backBtn = document.getElementById('backBtn');
        backBtn.style.display = this.currentPath === 'uploads' ? 'none' : 'flex';
    }

    // --- Folder Contents ---

    async loadFolderContents() {
        this.clearSelection();
        try {
            const response = await fetch(`/api/guest/folders?path=${encodeURIComponent(this.currentPath)}`, {
                credentials: 'include'
            });

            if (response.status === 401) {
                window.location.href = '/slideshow';
                return;
            }

            const data = await response.json();
            if (response.ok) {
                this.renderFolderContents(data);
                this.updateBreadcrumb();
                this.updateBackButton();
            } else {
                this.showToast(data.message || 'Failed to load folder contents', 'error');
            }
        } catch (error) {
            console.error('Error loading folder contents:', error);
            this.showToast('Failed to load folder contents', 'error');
        }
    }

    renderFolderContents(data) {
        const fileGrid = document.getElementById('fileGrid');
        const emptyState = document.getElementById('emptyState');

        fileGrid.innerHTML = '';

        if (data.folders.length === 0 && data.files.length === 0) {
            emptyState.classList.remove('hidden');
            fileGrid.classList.add('hidden');
            return;
        }

        emptyState.classList.add('hidden');
        fileGrid.classList.remove('hidden');

        // Render folders
        data.folders.forEach(folder => {
            const div = document.createElement('div');
            div.className = 'file-item folder';
            div.dataset.path = folder.path;
            div.dataset.type = 'folder';
            div.innerHTML = `
                <div class="folder-icon">
                    <img src="icons/ic_folder.svg" alt="Folder" />
                </div>
                <div class="folder-name">${folder.name}</div>
            `;
            div.addEventListener('click', () => this.navigateTo(folder.path));
            fileGrid.appendChild(div);
        });

        // Render files (only user's own uploads)
        data.files.forEach(file => {
            const div = document.createElement('div');
            div.className = 'file-item image';
            div.dataset.path = file.path;
            div.dataset.type = 'image';
            div.innerHTML = `
                <div class="admin-photo-image">
                    <img src="${file.url}" alt="${file.name}" loading="lazy">
                </div>
                <div class="photo-grid-overlay">
                    <div class="photo-grid-overlay-top">
                        <div class="photo-grid-checkbox">
                            <label class="label">
                                <input type="checkbox" class="input" data-path="${file.path}" aria-label="Select Photo">
                                <span class="sr-only">Select Photo</span>
                            </label>
                        </div>
                    </div>
                    <div class="photo-grid-overlay-bottom">
                        <div class="photo-grid-actions">
                            <button class="btn-icon" data-action="view" aria-label="View Photo">
                                <span class="material-symbols-outlined">visibility</span>
                            </button>
                            <button class="btn-icon" data-action="delete" aria-label="Delete Photo">
                                <span class="material-symbols-outlined">delete</span>
                            </button>
                        </div>
                    </div>
                </div>
                <div class="photo-grid-info">
                    <div class="photo-grid-name">${file.name}</div>
                </div>
            `;

            // Handle checkbox selection
            const checkbox = div.querySelector('input[type="checkbox"]');
            checkbox.addEventListener('change', (e) => {
                e.stopPropagation();
                if (e.target.checked) {
                    this.selectedItems.add(file.path);
                    div.classList.add('selected');
                } else {
                    this.selectedItems.delete(file.path);
                    div.classList.remove('selected');
                }
                this.updateSelectionFab();
            });

            // Handle action buttons
            const actionButtons = div.querySelectorAll('.btn-icon');
            actionButtons.forEach(button => {
                button.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const action = button.getAttribute('data-action');
                    if (action === 'view') {
                        this.showPhotoModal(file.url, file.name);
                    } else if (action === 'delete') {
                        this.confirmDelete(file.path, file.name);
                    }
                });
            });

            // Click on image to view
            div.addEventListener('click', (e) => {
                if (e.target.closest('.photo-grid-checkbox') || e.target.closest('.btn-icon')) return;
                this.showPhotoModal(file.url, file.name);
            });

            fileGrid.appendChild(div);
        });
    }

    // --- Selection ---

    clearSelection() {
        this.selectedItems.clear();
        document.querySelectorAll('.photo-grid-checkbox input[type="checkbox"]').forEach(cb => {
            cb.checked = false;
        });
        document.querySelectorAll('.file-item.selected').forEach(el => {
            el.classList.remove('selected');
        });
        this.updateSelectionFab();
    }

    updateSelectionFab() {
        const fab = document.getElementById('selectionFab');
        const badge = document.getElementById('fabBadge');

        if (this.selectedItems.size > 0) {
            fab.classList.remove('hidden');
            badge.textContent = this.selectedItems.size;
        } else {
            fab.classList.add('hidden');
        }
    }

    // --- Photo Modal ---

    showPhotoModal(imageUrl, imageName) {
        const modal = document.getElementById('photoModal');
        const modalImage = document.getElementById('modalImage');
        modalImage.src = imageUrl;
        modalImage.alt = imageName || '';
        modal.showModal();
    }

    // --- Delete ---

    confirmDelete(filePath, fileName) {
        this.deleteTarget = filePath;
        document.getElementById('delete-description').textContent =
            `Are you sure you want to delete "${fileName}"?`;
        document.getElementById('deleteModal').showModal();
    }

    async executeDelete() {
        if (!this.deleteTarget) return;
        const filePath = this.deleteTarget;
        document.getElementById('deleteModal').close();
        this.deleteTarget = null;

        try {
            const response = await fetch(`/api/guest/images?path=${encodeURIComponent(filePath)}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            const data = await response.json();

            if (response.ok) {
                this.showToast('Photo deleted successfully', 'success');
                this.loadFolderContents();
            } else {
                this.showToast(data.message || 'Delete failed', 'error');
            }
        } catch (error) {
            console.error('Error deleting photo:', error);
            this.showToast('Delete failed', 'error');
        }
    }

    showBulkDeleteModal() {
        document.getElementById('deleteCount').textContent = this.selectedItems.size;
        document.getElementById('bulkDeleteModal').showModal();
    }

    async executeBulkDelete() {
        const paths = Array.from(this.selectedItems);
        document.getElementById('bulkDeleteModal').close();

        try {
            const response = await fetch('/api/guest/images/batch', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ paths })
            });
            const data = await response.json();

            if (response.ok) {
                this.showToast(`${data.deletedCount} photo(s) deleted successfully`, 'success');
                this.clearSelection();
                this.loadFolderContents();
            } else {
                this.showToast(data.message || 'Bulk delete failed', 'error');
            }
        } catch (error) {
            console.error('Error in bulk delete:', error);
            this.showToast('Bulk delete failed', 'error');
        }
    }

    // --- Upload ---

    showUploadModal() {
        const modal = document.getElementById('uploadModal');
        modal.showModal();
        this.selectedFiles = [];
        this.updateUploadButton();
        this.updateSelectedFilesDisplay();
    }

    hideUploadModal() {
        document.getElementById('uploadModal').close();
        document.getElementById('fileInput').value = '';
        this.selectedFiles = [];
        this.hideUploadProgress();
        this.updateSelectedFilesDisplay();
    }

    updateUploadButton() {
        const btn = document.getElementById('confirmUploadBtn');
        const btnText = document.getElementById('uploadBtnText');
        btn.disabled = this.selectedFiles.length === 0;
        btnText.textContent = this.selectedFiles.length > 0
            ? `Upload ${this.selectedFiles.length} file${this.selectedFiles.length > 1 ? 's' : ''}`
            : 'Select Files';
    }

    updateSelectedFilesDisplay() {
        const info = document.getElementById('selectedFilesInfo');
        const list = document.getElementById('filesList');
        if (this.selectedFiles.length > 0) {
            info.classList.remove('hidden');
            list.innerHTML = this.selectedFiles.map(file =>
                `<div class="flex items-center gap-2">
                    <span class="material-symbols-outlined text-sm">image</span>
                    <span class="flex-1">${file.name}</span>
                    <span class="text-xs">${this.formatFileSize(file.size)}</span>
                </div>`
            ).join('');
        } else {
            info.classList.add('hidden');
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    async uploadFiles() {
        if (this.selectedFiles.length === 0) return;

        const formData = new FormData();
        this.selectedFiles.forEach(file => {
            formData.append('images', file);
        });
        formData.append('path', this.currentPath);

        this.showUploadProgress();

        try {
            const response = await fetch('/api/guest/upload', {
                method: 'POST',
                body: formData,
                credentials: 'include'
            });

            const data = await response.json();

            if (response.ok) {
                this.showToast(`${data.files.length} file(s) uploaded successfully`, 'success');
                this.hideUploadModal();
                this.loadFolderContents();
            } else {
                this.showToast(data.message || 'Upload failed', 'error');
            }
        } catch (error) {
            console.error('Error uploading files:', error);
            this.showToast('Upload failed', 'error');
        }

        this.hideUploadProgress();
    }

    showUploadProgress() {
        document.getElementById('uploadProgress').classList.remove('hidden');
        const progressFill = document.querySelector('.progress-fill');
        progressFill.style.width = '0%';
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 20;
            if (progress > 90) progress = 90;
            progressFill.style.width = progress + '%';
            if (progress >= 90) clearInterval(interval);
        }, 200);
    }

    hideUploadProgress() {
        document.getElementById('uploadProgress').classList.add('hidden');
    }

    setupUploadDragAndDrop() {
        const dropZone = document.getElementById('uploadDropZone');
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('dragover');
        });
        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('dragover');
        });
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('dragover');
            const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
            this.selectedFiles = files;
            this.updateUploadButton();
            this.updateSelectedFilesDisplay();
        });
    }

    // Empty state upload
    setupEmptyStateDragAndDrop() {
        const dropZone = document.getElementById('emptyStateUploadZone');

        dropZone.addEventListener('click', () => {
            document.getElementById('emptyStateFileInput').click();
        });

        document.getElementById('emptyStateFileInput').addEventListener('change', (e) => {
            this.handleEmptyStateFileSelection(Array.from(e.target.files));
        });

        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('dragover');
        });

        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('dragover');
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('dragover');
            const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
            this.handleEmptyStateFileSelection(files);
        });

        document.getElementById('emptyStateUploadBtn').addEventListener('click', () => {
            if (this.emptyStateSelectedFiles.length > 0) {
                this.uploadEmptyStateFiles();
            } else {
                document.getElementById('emptyStateFileInput').click();
            }
        });

        document.getElementById('emptyStateCancelBtn').addEventListener('click', () => {
            this.resetEmptyStateUpload();
        });
    }

    handleEmptyStateFileSelection(files) {
        this.emptyStateSelectedFiles = files.filter(f => f.type.startsWith('image/'));
        this.updateEmptyStateUploadButton();
        this.updateEmptyStateFilesDisplay();
    }

    updateEmptyStateUploadButton() {
        const btn = document.getElementById('emptyStateUploadBtn');
        const btnText = document.getElementById('emptyStateUploadBtnText');
        const cancelBtn = document.getElementById('emptyStateCancelBtn');

        btn.disabled = !this.emptyStateSelectedFiles || this.emptyStateSelectedFiles.length === 0;

        if (this.emptyStateSelectedFiles && this.emptyStateSelectedFiles.length > 0) {
            btnText.textContent = `Upload ${this.emptyStateSelectedFiles.length} file${this.emptyStateSelectedFiles.length > 1 ? 's' : ''}`;
            cancelBtn.classList.remove('hidden');
        } else {
            btnText.textContent = 'Select Files';
            cancelBtn.classList.add('hidden');
        }
    }

    updateEmptyStateFilesDisplay() {
        const selectedFilesDiv = document.getElementById('emptyStateSelectedFiles');
        const filesList = document.getElementById('emptyStateFilesList');

        if (this.emptyStateSelectedFiles && this.emptyStateSelectedFiles.length > 0) {
            selectedFilesDiv.classList.remove('hidden');
            filesList.innerHTML = this.emptyStateSelectedFiles.map(file =>
                `<div class="flex items-center gap-2">
                    <span class="material-symbols-outlined text-sm">image</span>
                    <span class="flex-1">${file.name}</span>
                    <span class="text-xs">${this.formatFileSize(file.size)}</span>
                </div>`
            ).join('');
        } else {
            selectedFilesDiv.classList.add('hidden');
        }
    }

    async uploadEmptyStateFiles() {
        if (!this.emptyStateSelectedFiles || this.emptyStateSelectedFiles.length === 0) return;

        const formData = new FormData();
        this.emptyStateSelectedFiles.forEach(file => {
            formData.append('images', file);
        });
        formData.append('path', this.currentPath);

        document.getElementById('emptyStateUploadProgress').classList.remove('hidden');
        const progressFill = document.querySelector('.empty-state-progress-fill');
        progressFill.style.width = '0%';
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 20;
            if (progress > 90) progress = 90;
            progressFill.style.width = progress + '%';
            if (progress >= 90) clearInterval(interval);
        }, 200);

        try {
            const response = await fetch('/api/guest/upload', {
                method: 'POST',
                body: formData,
                credentials: 'include'
            });

            const data = await response.json();

            if (response.ok) {
                this.showToast(`${data.files.length} file(s) uploaded successfully`, 'success');
                this.resetEmptyStateUpload();
                this.loadFolderContents();
            } else {
                this.showToast(data.message || 'Upload failed', 'error');
            }
        } catch (error) {
            console.error('Error uploading files:', error);
            this.showToast('Upload failed', 'error');
        }

        document.getElementById('emptyStateUploadProgress').classList.add('hidden');
    }

    resetEmptyStateUpload() {
        this.emptyStateSelectedFiles = [];
        document.getElementById('emptyStateFileInput').value = '';
        this.updateEmptyStateUploadButton();
        this.updateEmptyStateFilesDisplay();
        document.getElementById('emptyStateUploadProgress').classList.add('hidden');
    }

    // --- Logout ---

    async logout() {
        try {
            await fetch('/api/auth/session', {
                method: 'DELETE',
                credentials: 'include'
            });
            this.showToast('Signing out...', 'info');
            setTimeout(() => {
                window.location.href = '/slideshow';
            }, 1000);
        } catch (error) {
            console.error('Error during logout:', error);
            window.location.href = '/slideshow';
        }
    }

    // --- Toast ---

    showToast(message, type = 'info') {
        const categoryMap = { info: 'info', success: 'success', error: 'error', warning: 'warning' };
        const titleMap = { success: 'Success!', error: 'Error!', warning: 'Warning!', info: 'Info' };

        document.dispatchEvent(new CustomEvent('basecoat:toast', {
            detail: {
                config: {
                    category: categoryMap[type] || 'info',
                    title: titleMap[type] || 'Notification',
                    description: message,
                    duration: 5000
                }
            }
        }));
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new GuestUploadManager();
});
