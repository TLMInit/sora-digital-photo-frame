const path = require('path');
const fs = require('fs-extra');
const sharp = require('sharp');
const uploadMetadataController = require('./uploadMetadataController');

class GuestUploadController {
    constructor() {
        this.uploadsDir = path.join(__dirname, '..', 'uploads');
        this.serverRoot = path.join(__dirname, '..');
    }

    // Validate that a path stays within the server directory
    isPathSafe(targetPath) {
        const resolved = path.resolve(path.join(this.serverRoot, targetPath));
        return resolved.startsWith(path.resolve(this.serverRoot));
    }

    // Get folder contents for guest users - shows server folders + only own uploaded files
    async getFolderContents(req, res) {
        try {
            const folderPath = req.query.path || 'uploads';

            if (!this.isPathSafe(folderPath)) {
                return res.status(400).json({ message: 'Invalid path' });
            }

            const fullPath = path.join(this.serverRoot, folderPath);
            const accountId = req.session.accessAccount.id;

            if (!await fs.pathExists(fullPath)) {
                return res.status(404).json({ message: 'Folder not found' });
            }

            const items = await fs.readdir(fullPath, { withFileTypes: true });
            const folders = [];
            const files = [];

            // Get list of files uploaded by this user
            const userUploads = await uploadMetadataController.getUploadsByAccount(accountId);
            const userFilePaths = new Set(userUploads.map(u => u.filePath));

            for (const item of items) {
                if (item.isDirectory()) {
                    folders.push({
                        name: item.name,
                        type: 'folder',
                        path: path.join(folderPath, item.name)
                    });
                } else if (item.isFile() && /\.(jpg|jpeg|png|gif|webp)$/i.test(item.name)) {
                    const filePath = path.join(folderPath, item.name);
                    // Only show files uploaded by this user
                    if (userFilePaths.has(filePath)) {
                        const relativePath = path.relative(
                            this.uploadsDir,
                            path.join(this.serverRoot, filePath)
                        );
                        files.push({
                            name: item.name,
                            type: 'image',
                            path: filePath,
                            url: `/uploads/${relativePath}`,
                            ownedByUser: true
                        });
                    }
                }
            }

            res.json({
                currentPath: folderPath,
                folders: folders.sort((a, b) => a.name.localeCompare(b.name)),
                files: files.sort((a, b) => a.name.localeCompare(b.name))
            });
        } catch (error) {
            console.error('Error reading folder for guest:', error);
            res.status(500).json({ message: 'Server error' });
        }
    }

    // Upload images as guest user
    async uploadImages(req, res) {
        try {
            const uploadedFiles = req.files;
            const targetPath = req.body.path || 'uploads';
            const accountId = req.session.accessAccount.id;
            const accountName = req.session.accessAccount.name;
            const processedFiles = [];
            const uploadedPaths = [];

            if (!this.isPathSafe(targetPath)) {
                return res.status(400).json({ message: 'Invalid path' });
            }

            for (const file of uploadedFiles) {
                const targetDir = path.join(this.serverRoot, targetPath);
                const targetFilePath = path.join(targetDir, file.filename);

                await fs.ensureDir(targetDir);

                const processedPath = path.join(path.dirname(file.path), `processed_${file.filename}`);

                await sharp(file.path)
                    .rotate()
                    .resize(
                        parseInt(process.env.MAX_RESOLUTION_WIDTH) || 1920,
                        parseInt(process.env.MAX_RESOLUTION_HEIGHT) || 1080,
                        { fit: 'inside', withoutEnlargement: true }
                    )
                    .jpeg({ quality: parseInt(process.env.IMAGE_QUALITY) || 85 })
                    .toFile(processedPath);

                await fs.remove(file.path);
                await fs.move(processedPath, targetFilePath);

                const relativeFilePath = path.join(targetPath, file.filename);
                uploadedPaths.push(relativeFilePath);

                processedFiles.push({
                    filename: file.filename,
                    originalname: file.originalname,
                    path: targetFilePath,
                    size: file.size
                });
            }

            // Record upload metadata
            await uploadMetadataController.recordUploads(accountId, accountName, uploadedPaths);

            // Clear image cache
            const imageController = require('./imageController');
            imageController.clearImageCache();

            res.json({
                message: 'Images uploaded successfully',
                files: processedFiles
            });
        } catch (error) {
            console.error('Error uploading images (guest):', error);
            res.status(500).json({ message: 'Server error' });
        }
    }

    // Delete image - only if owned by the user
    async deleteImage(req, res) {
        try {
            const imagePath = req.query.path;
            const accountId = req.session.accessAccount.id;

            if (!imagePath || !this.isPathSafe(imagePath)) {
                return res.status(400).json({ message: 'Invalid path' });
            }

            // Check ownership
            const isOwned = await uploadMetadataController.isOwnedByAccount(accountId, imagePath);
            if (!isOwned) {
                return res.status(403).json({ message: 'You can only delete your own photos' });
            }

            const fullPath = path.join(this.serverRoot, imagePath);
            if (!await fs.pathExists(fullPath)) {
                return res.status(404).json({ message: 'Image not found' });
            }

            await fs.remove(fullPath);
            await uploadMetadataController.removeMetadata(imagePath);

            // Clear image cache
            const imageController = require('./imageController');
            imageController.clearImageCache();

            res.json({ message: 'Image deleted successfully' });
        } catch (error) {
            console.error('Error deleting image (guest):', error);
            res.status(500).json({ message: 'Server error' });
        }
    }

    // Batch delete images - only if all owned by the user
    async batchDeleteImages(req, res) {
        try {
            const { paths } = req.body;
            const accountId = req.session.accessAccount.id;

            if (!Array.isArray(paths) || paths.length === 0) {
                return res.status(400).json({ message: 'Invalid paths provided' });
            }

            // Validate all paths and check ownership
            for (const imagePath of paths) {
                if (!this.isPathSafe(imagePath)) {
                    return res.status(400).json({ message: 'Invalid path' });
                }
                const isOwned = await uploadMetadataController.isOwnedByAccount(accountId, imagePath);
                if (!isOwned) {
                    return res.status(403).json({ message: 'You can only delete your own photos' });
                }
            }

            const results = {
                deletedCount: 0,
                failedCount: 0,
                errors: []
            };

            for (const imagePath of paths) {
                try {
                    const fullPath = path.join(this.serverRoot, imagePath);
                    if (await fs.pathExists(fullPath)) {
                        await fs.remove(fullPath);
                        results.deletedCount++;
                    } else {
                        results.failedCount++;
                        results.errors.push(`Image not found: ${imagePath}`);
                    }
                } catch (error) {
                    results.failedCount++;
                    results.errors.push(`Failed to delete: ${imagePath}`);
                }
            }

            await uploadMetadataController.removeMetadataBatch(paths);

            // Clear image cache
            const imageController = require('./imageController');
            imageController.clearImageCache();

            if (results.failedCount > 0) {
                res.status(207).json({
                    message: `Deleted ${results.deletedCount} images, failed to delete ${results.failedCount}`,
                    ...results
                });
            } else {
                res.json({
                    message: `Successfully deleted ${results.deletedCount} images`,
                    ...results
                });
            }
        } catch (error) {
            console.error('Error in batch delete (guest):', error);
            res.status(500).json({ message: 'Server error during batch deletion' });
        }
    }
}

module.exports = new GuestUploadController();
