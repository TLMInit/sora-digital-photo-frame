const path = require('path');

const serverRoot = path.resolve(path.join(__dirname, '..'));

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

module.exports = { isPathSafe, serverRoot };
