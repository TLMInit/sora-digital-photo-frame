const path = require('path');
const fs = require('fs-extra');
const sharp = require('sharp');
const uploadMetadataController = require('./uploadMetadataController');
const imageController = require('./imageController');
const { isPathSafe, normalizeTargetFolder } = require('../utils/pathValidator');
const thumbnailManager = require('../utils/thumbnailManager');

class GuestUploadController {
    constructor() {
        this.uploadsDir = path.join(__dirname, '..', 'uploads');
        this.serverRoot = path.join(__dirname, '..');
    }

    /**
     * Categorize a file processing error into a code and user-facing message.
     */
    categorizeFileError(error) {
        // Sharp-specific errors
        if (error.message && (error.message.includes('Input file') || error.message.includes('Input buffer') || error.message.includes('unsupported image format'))) {
            return {
                errorCode: 'IMAGE_PROCESSING_FAILED',
                errorMessage: 'Image could not be processed. The file may be corrupted or not a valid image.'
            };
        }
        return {
            errorCode: 'FILE_IO_ERROR',
            errorMessage: 'Failed to save file to destination folder.'
        };
    }

    // Get folder contents for token-based uploads - shows target folder only
    async getFolderContentsWithToken(req, res) {
        try {
            const token = req.uploadToken;
            const rawFolder = token.targetFolder || 'uploads';

            const { valid, normalized: folderPath, error: normError } = normalizeTargetFolder(rawFolder);
            if (!valid) {
                return res.status(400).json({
                    success: false,
                    code: 'INVALID_TARGET_FOLDER',
                    message: normError || 'Invalid target folder',
                    targetFolder: rawFolder
                });
            }

            const fullPath = path.join(this.serverRoot, folderPath);

            if (!await fs.pathExists(fullPath)) {
                return res.status(404).json({
                    success: false,
                    code: 'TARGET_FOLDER_NOT_FOUND',
                    message: 'Target folder not found',
                    targetFolder: folderPath
                });
            }

            const items = await fs.readdir(fullPath, { withFileTypes: true });
            const folders = [];
            const files = [];

            // Get list of files uploaded with this token
            const tokenUploads = await uploadMetadataController.getUploadsByToken(token.id);
            const tokenFilePaths = new Set(tokenUploads.map(u => u.filePath));

            for (const item of items) {
                if (item.isDirectory()) {
                    folders.push({
                        name: item.name,
                        type: 'folder',
                        path: path.join(folderPath, item.name)
                    });
                } else if (item.isFile() && /\.(jpg|jpeg|png|gif|webp)$/i.test(item.name)) {
                    const filePath = path.join(folderPath, item.name);
                    // Only show files uploaded with this token
                    if (tokenFilePaths.has(filePath)) {
                        const relativePath = path.relative(
                            this.uploadsDir,
                            path.join(this.serverRoot, filePath)
                        );
                        const tokenParam = encodeURIComponent(req.query.token || '');
                        files.push({
                            name: item.name,
                            type: 'image',
                            path: filePath,
                            url: `/api/token/image?token=${tokenParam}&path=${encodeURIComponent(relativePath)}`,
                            thumbnail: `/api/images/${encodeURIComponent(relativePath)}/thumbnail`,
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
            console.error('Error reading folder for token upload:', error);
            res.status(500).json({
                success: false,
                code: 'SERVER_ERROR',
                message: 'Failed to read folder contents'
            });
        }
    }

    // Get folder contents for guest users - shows server folders + only own uploaded files
    async getFolderContents(req, res) {
        try {
            const folderPath = req.query.path || 'uploads';

            if (!isPathSafe(folderPath)) {
                return res.status(400).json({
                    success: false,
                    code: 'INVALID_TARGET_FOLDER',
                    message: 'Invalid path'
                });
            }

            const fullPath = path.join(this.serverRoot, folderPath);
            const accountId = req.session.accessAccount.id;

            if (!await fs.pathExists(fullPath)) {
                return res.status(404).json({
                    success: false,
                    code: 'TARGET_FOLDER_NOT_FOUND',
                    message: 'Folder not found'
                });
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
                            thumbnail: `/api/images/${encodeURIComponent(relativePath)}/thumbnail`,
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
            res.status(500).json({
                success: false,
                code: 'SERVER_ERROR',
                message: 'Failed to read folder contents'
            });
        }
    }

    // Upload images with token
    async uploadImagesWithToken(req, res) {
        try {
            const uploadedFiles = req.files;
            const token = req.uploadToken;
            const uploadTokenController = require('./uploadTokenController');
            
            const rawTargetPath = token.targetFolder || 'uploads';
            const { valid, normalized: targetPath, error: normError } = normalizeTargetFolder(rawTargetPath);

            if (!valid) {
                return res.status(400).json({
                    success: false,
                    code: 'INVALID_TARGET_FOLDER',
                    message: normError || 'Invalid target folder path',
                    tokenId: token.id,
                    targetFolder: rawTargetPath
                });
            }

            if (!uploadedFiles || uploadedFiles.length === 0) {
                return res.status(400).json({
                    success: false,
                    code: 'NO_FILES',
                    message: 'No files were uploaded'
                });
            }

            const processedFiles = [];
            const failedFiles = [];
            const uploadedPaths = [];

            for (const file of uploadedFiles) {
                try {
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

                    // Generate thumbnail
                    const relativePath = path.relative(this.uploadsDir, targetFilePath);
                    await thumbnailManager.generateThumbnail(relativePath, targetFilePath);

                    const relativeFilePath = path.join(targetPath, file.filename);
                    uploadedPaths.push(relativeFilePath);

                    processedFiles.push({
                        filename: file.filename,
                        originalname: file.originalname,
                        size: file.size,
                        success: true
                    });
                } catch (fileError) {
                    console.error(`Error processing file ${file.originalname}:`, fileError);
                    // Clean up temp file on failure
                    await fs.remove(file.path).catch(() => {});

                    const { errorCode, errorMessage } = this.categorizeFileError(fileError);

                    failedFiles.push({
                        filename: file.filename,
                        originalname: file.originalname,
                        success: false,
                        errorCode,
                        errorMessage
                    });
                }
            }

            // Record upload metadata with token ID (only for successfully processed files)
            if (uploadedPaths.length > 0) {
                await uploadMetadataController.recordTokenUploads(token.id, token.name, uploadedPaths);
                await uploadTokenController.incrementUploadCount(token.id);
                imageController.clearImageCache();
            }

            const allSucceeded = failedFiles.length === 0;
            const statusCode = failedFiles.length > 0 && processedFiles.length > 0 ? 207 : (failedFiles.length > 0 ? 400 : 200);

            res.status(statusCode).json({
                success: allSucceeded,
                message: allSucceeded
                    ? `${processedFiles.length} image(s) uploaded successfully`
                    : `${processedFiles.length} succeeded, ${failedFiles.length} failed`,
                files: [...processedFiles, ...failedFiles],
                successCount: processedFiles.length,
                failedCount: failedFiles.length,
                uploadCount: token.uploadCount + processedFiles.length,
                uploadLimit: token.uploadLimit
            });
        } catch (error) {
            console.error('Error uploading images with token:', error);
            res.status(500).json({ 
                success: false,
                code: 'SERVER_ERROR',
                message: 'An unexpected error occurred during upload. Please try again.'
            });
        }
    }

    // Upload images as guest user
    async uploadImages(req, res) {
        try {
            const uploadedFiles = req.files;
            const rawTargetPath = req.body.path || 'uploads';
            const accountId = req.session.accessAccount.id;
            const accountName = req.session.accessAccount.name;

            const { valid, normalized: targetPath, error: normError } = normalizeTargetFolder(rawTargetPath);

            if (!valid) {
                return res.status(400).json({
                    success: false,
                    code: 'INVALID_TARGET_FOLDER',
                    message: normError || 'Invalid target folder path'
                });
            }

            if (!uploadedFiles || uploadedFiles.length === 0) {
                return res.status(400).json({
                    success: false,
                    code: 'NO_FILES',
                    message: 'No files were uploaded'
                });
            }

            const processedFiles = [];
            const failedFiles = [];
            const uploadedPaths = [];

            for (const file of uploadedFiles) {
                try {
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

                    // Generate thumbnail
                    const relativePath = path.relative(this.uploadsDir, targetFilePath);
                    await thumbnailManager.generateThumbnail(relativePath, targetFilePath);

                    const relativeFilePath = path.join(targetPath, file.filename);
                    uploadedPaths.push(relativeFilePath);

                    processedFiles.push({
                        filename: file.filename,
                        originalname: file.originalname,
                        size: file.size,
                        success: true
                    });
                } catch (fileError) {
                    console.error(`Error processing file ${file.originalname}:`, fileError);
                    await fs.remove(file.path).catch(() => {});

                    const { errorCode, errorMessage } = this.categorizeFileError(fileError);

                    failedFiles.push({
                        filename: file.filename,
                        originalname: file.originalname,
                        success: false,
                        errorCode,
                        errorMessage
                    });
                }
            }

            // Record upload metadata (only for successfully processed files)
            if (uploadedPaths.length > 0) {
                await uploadMetadataController.recordUploads(accountId, accountName, uploadedPaths);
                imageController.clearImageCache();
            }

            const allSucceeded = failedFiles.length === 0;
            const statusCode = failedFiles.length > 0 && processedFiles.length > 0 ? 207 : (failedFiles.length > 0 ? 400 : 200);

            res.status(statusCode).json({
                success: allSucceeded,
                message: allSucceeded
                    ? `${processedFiles.length} image(s) uploaded successfully`
                    : `${processedFiles.length} succeeded, ${failedFiles.length} failed`,
                files: [...processedFiles, ...failedFiles],
                successCount: processedFiles.length,
                failedCount: failedFiles.length
            });
        } catch (error) {
            console.error('Error uploading images (guest):', error);
            res.status(500).json({
                success: false,
                code: 'SERVER_ERROR',
                message: 'An unexpected error occurred during upload. Please try again.'
            });
        }
    }

    // Delete image - only if owned by the user
    async deleteImage(req, res) {
        try {
            const imagePath = req.query.path;
            const accountId = req.session.accessAccount.id;

            if (!imagePath || !isPathSafe(imagePath)) {
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
                if (!isPathSafe(imagePath)) {
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

    // Serve an image file to token-authenticated users
    async serveTokenImage(req, res) {
        try {
            const imagePath = req.query.path;
            if (!imagePath) {
                return res.status(400).json({ success: false, message: 'Image path is required' });
            }

            if (!isPathSafe(imagePath)) {
                return res.status(400).json({ success: false, message: 'Invalid image path' });
            }

            const fullPath = path.join(this.uploadsDir, imagePath);

            // Ensure resolved path is within uploads directory
            const resolvedPath = path.resolve(fullPath);
            const resolvedUploads = path.resolve(this.uploadsDir);
            if (!resolvedPath.startsWith(resolvedUploads + path.sep) && resolvedPath !== resolvedUploads) {
                return res.status(403).json({ success: false, message: 'Access denied' });
            }

            if (!await fs.pathExists(fullPath)) {
                return res.status(404).json({ success: false, message: 'Image not found' });
            }

            res.sendFile(resolvedPath);
        } catch (error) {
            console.error('Error serving token image:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }
}

module.exports = new GuestUploadController();
