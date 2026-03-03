const path = require('path');

const serverRoot = path.resolve(path.join(__dirname, '..'));
const uploadsRoot = path.join(serverRoot, 'uploads');

/**
 * Validates that a user-supplied path stays within the server root directory.
 * Rejects path traversal sequences, null bytes, and any path that resolves
 * outside the server root.
 *
 * @param {string} userPath - The user-supplied path to validate
 * @returns {boolean} true if the path is safe, false otherwise
 */
function isPathSafe(userPath) {
    if (!userPath || typeof userPath !== 'string') {
        return false;
    }

    // Reject null bytes
    if (userPath.includes('\0')) {
        return false;
    }

    const normalized = path.normalize(userPath);
    const resolved = path.resolve(path.join(serverRoot, normalized));
    return resolved.startsWith(serverRoot);
}

/**
 * Normalizes a target folder to a canonical path under uploads/.
 * Handles back-compat for tokens that stored folder names without uploads/ prefix.
 *
 * Examples:
 *   'uploads'         -> 'uploads'
 *   'uploads/family'  -> 'uploads/family'
 *   'family'          -> 'uploads/family'
 *   ''                -> 'uploads'
 *   null/undefined    -> 'uploads'
 *
 * @param {string} targetFolder - The target folder value (from token or form)
 * @returns {{ valid: boolean, normalized: string, error?: string }}
 */
function normalizeTargetFolder(targetFolder) {
    // Default to 'uploads' if not provided
    if (!targetFolder || typeof targetFolder !== 'string') {
        return { valid: true, normalized: 'uploads' };
    }

    const trimmed = targetFolder.trim();
    if (!trimmed) {
        return { valid: true, normalized: 'uploads' };
    }

    // Reject absolute paths
    if (path.isAbsolute(trimmed)) {
        return { valid: false, normalized: '', error: 'Absolute paths are not allowed' };
    }

    // Reject path traversal
    if (trimmed.includes('..') || trimmed.includes('\0')) {
        return { valid: false, normalized: '', error: 'Path traversal is not allowed' };
    }

    // Normalize: ensure path starts with 'uploads' or 'uploads/'
    let normalized;
    if (trimmed === 'uploads' || trimmed.startsWith('uploads/') || trimmed.startsWith('uploads\\')) {
        normalized = trimmed;
    } else {
        // Back-compat: bare folder name like 'family' -> 'uploads/family'
        normalized = path.join('uploads', trimmed);
    }

    // Normalize path separators
    normalized = path.normalize(normalized);

    // Verify the resolved absolute path stays within the uploads root
    const resolved = path.resolve(path.join(serverRoot, normalized));
    if (!resolved.startsWith(uploadsRoot)) {
        return { valid: false, normalized: '', error: 'Path resolves outside uploads directory' };
    }

    return { valid: true, normalized };
}

module.exports = { isPathSafe, normalizeTargetFolder, serverRoot, uploadsRoot };
