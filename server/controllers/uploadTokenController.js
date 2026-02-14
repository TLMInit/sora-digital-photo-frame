const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

class UploadTokenController {
    constructor() {
        this.dataPath = path.join(__dirname, '../data');
        this.tokensFile = path.join(this.dataPath, 'upload-tokens.json');
        // Use SESSION_SECRET for encryption key, or generate a persistent one
        this.encryptionKey = this.getEncryptionKey();
        this.initializeDataDirectory();
    }

    getEncryptionKey() {
        // Use SESSION_SECRET if available, otherwise use a persistent key
        const secret = process.env.SESSION_SECRET || 'default_encryption_key_change_in_production';
        // Create a 32-byte key from the secret
        return crypto.scryptSync(secret, 'salt', 32);
    }

    encryptToken(plainToken) {
        // Encrypt token for storage (allows re-display)
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-cbc', this.encryptionKey, iv);
        let encrypted = cipher.update(plainToken, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return {
            encrypted: encrypted,
            iv: iv.toString('hex')
        };
    }

    decryptToken(encryptedData) {
        // Decrypt token for display
        try {
            const iv = Buffer.from(encryptedData.iv, 'hex');
            const decipher = crypto.createDecipheriv('aes-256-cbc', this.encryptionKey, iv);
            let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            return decrypted;
        } catch (error) {
            console.error('Decryption error:', error);
            return null;
        }
    }

    async initializeDataDirectory() {
        try {
            await fs.access(this.dataPath);
        } catch (error) {
            await fs.mkdir(this.dataPath, { recursive: true });
        }

        try {
            await fs.access(this.tokensFile);
        } catch (error) {
            await this.saveTokens([]);
        }
    }

    async loadTokens() {
        try {
            const data = await fs.readFile(this.tokensFile, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            return [];
        }
    }

    async saveTokens(tokens) {
        await fs.writeFile(this.tokensFile, JSON.stringify(tokens, null, 2));
    }

    generateTokenId() {
        return crypto.randomBytes(16).toString('hex');
    }

    generateSecureToken() {
        // Generate a cryptographically secure 32-byte token
        return crypto.randomBytes(32).toString('base64url');
    }

    async hashToken(token) {
        // Hash the token using bcrypt before storing
        const salt = await bcrypt.genSalt(10);
        return await bcrypt.hash(token, salt);
    }

    async verifyToken(plainToken, hashedToken) {
        return await bcrypt.compare(plainToken, hashedToken);
    }

    // Create a new upload token
    async createToken(req, res) {
        try {
            const { name, expiresAt, uploadLimit, targetFolder } = req.body;

            // Generate unique token
            const tokenId = this.generateTokenId();
            const plainToken = this.generateSecureToken();
            const tokenHash = await this.hashToken(plainToken);
            const encryptedToken = this.encryptToken(plainToken);

            const tokens = await this.loadTokens();

            const newToken = {
                id: tokenId,
                tokenHash: tokenHash,
                encryptedToken: encryptedToken, // Store encrypted version for later display
                name: name || 'Unnamed Token',
                createdAt: Date.now(),
                // If expiresAt is null, token never expires. Otherwise use provided value or default to 30 days
                expiresAt: expiresAt === null ? null : (expiresAt || (Date.now() + 30 * 24 * 60 * 60 * 1000)),
                uploadLimit: uploadLimit || null,
                uploadCount: 0,
                enabled: true,
                targetFolder: targetFolder || 'uploads',
                createdBy: req.session.authenticated ? 'admin' : null
            };

            tokens.push(newToken);
            await this.saveTokens(tokens);

            // Return the plain token only once (it won't be stored)
            res.json({
                success: true,
                token: newToken,
                plainToken: plainToken // Only sent once, never stored
            });
        } catch (error) {
            console.error('Error creating token:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to create upload token'
            });
        }
    }

    // Get all tokens (admin)
    async getAllTokens(req, res) {
        try {
            const tokens = await this.loadTokens();
            
            // Don't include token hashes or encrypted tokens in response
            const sanitizedTokens = tokens.map(token => {
                const { tokenHash, encryptedToken, ...rest } = token;
                return rest;
            });

            res.json({
                success: true,
                tokens: sanitizedTokens
            });
        } catch (error) {
            console.error('Error loading tokens:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to load upload tokens'
            });
        }
    }

    // Get single token details (admin)
    async getToken(req, res) {
        try {
            const { id } = req.params;
            const tokens = await this.loadTokens();
            const token = tokens.find(t => t.id === id);

            if (!token) {
                return res.status(404).json({
                    success: false,
                    error: 'Token not found'
                });
            }

            // Don't include token hash but include decrypted token
            const { tokenHash, encryptedToken, ...sanitizedToken } = token;
            
            // Decrypt the token for display
            if (encryptedToken) {
                sanitizedToken.plainToken = this.decryptToken(encryptedToken);
            }

            res.json({
                success: true,
                token: sanitizedToken
            });
        } catch (error) {
            console.error('Error loading token:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to load token'
            });
        }
    }

    // Update token (enable/disable, extend expiry, etc.)
    async updateToken(req, res) {
        try {
            const { id } = req.params;
            const updates = req.body;

            const tokens = await this.loadTokens();
            const tokenIndex = tokens.findIndex(t => t.id === id);

            if (tokenIndex === -1) {
                return res.status(404).json({
                    success: false,
                    error: 'Token not found'
                });
            }

            // Only allow specific fields to be updated
            const allowedUpdates = ['name', 'expiresAt', 'uploadLimit', 'enabled', 'targetFolder'];
            allowedUpdates.forEach(field => {
                if (updates[field] !== undefined) {
                    tokens[tokenIndex][field] = updates[field];
                }
            });

            await this.saveTokens(tokens);

            const { tokenHash, ...sanitizedToken } = tokens[tokenIndex];

            res.json({
                success: true,
                token: sanitizedToken
            });
        } catch (error) {
            console.error('Error updating token:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to update token'
            });
        }
    }

    // Delete token
    async deleteToken(req, res) {
        try {
            const { id } = req.params;
            const tokens = await this.loadTokens();
            const filteredTokens = tokens.filter(t => t.id !== id);

            if (tokens.length === filteredTokens.length) {
                return res.status(404).json({
                    success: false,
                    error: 'Token not found'
                });
            }

            await this.saveTokens(filteredTokens);

            res.json({
                success: true,
                message: 'Token deleted successfully'
            });
        } catch (error) {
            console.error('Error deleting token:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to delete token'
            });
        }
    }

    // Validate token (public endpoint)
    async validateToken(req, res) {
        try {
            const { token: plainToken } = req.query;

            if (!plainToken) {
                return res.status(400).json({
                    success: false,
                    error: 'Token is required'
                });
            }

            const tokens = await this.loadTokens();
            
            // Find matching token by comparing hashes
            let matchedToken = null;
            for (const token of tokens) {
                if (await this.verifyToken(plainToken, token.tokenHash)) {
                    matchedToken = token;
                    break;
                }
            }

            if (!matchedToken) {
                return res.status(403).json({
                    success: false,
                    error: 'Invalid token'
                });
            }

            // Check if token is enabled
            if (!matchedToken.enabled) {
                return res.status(403).json({
                    success: false,
                    error: 'This upload link has been disabled'
                });
            }

            // Check if token is expired
            if (matchedToken.expiresAt && Date.now() > matchedToken.expiresAt) {
                return res.status(403).json({
                    success: false,
                    error: 'This upload link has expired'
                });
            }

            // Check if upload limit reached
            if (matchedToken.uploadLimit && matchedToken.uploadCount >= matchedToken.uploadLimit) {
                return res.status(403).json({
                    success: false,
                    error: 'Upload limit reached for this link'
                });
            }

            // Return token metadata (without hash)
            res.json({
                success: true,
                token: {
                    id: matchedToken.id,
                    name: matchedToken.name,
                    uploadCount: matchedToken.uploadCount,
                    uploadLimit: matchedToken.uploadLimit,
                    expiresAt: matchedToken.expiresAt,
                    targetFolder: matchedToken.targetFolder
                }
            });
        } catch (error) {
            console.error('Error validating token:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to validate token'
            });
        }
    }

    // Increment upload count for a token
    async incrementUploadCount(tokenId) {
        try {
            const tokens = await this.loadTokens();
            const tokenIndex = tokens.findIndex(t => t.id === tokenId);

            if (tokenIndex !== -1) {
                tokens[tokenIndex].uploadCount = (tokens[tokenIndex].uploadCount || 0) + 1;
                await this.saveTokens(tokens);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error incrementing upload count:', error);
            return false;
        }
    }

    // Find token by plain token value (for internal use)
    async findTokenByPlainToken(plainToken) {
        try {
            const tokens = await this.loadTokens();
            
            for (const token of tokens) {
                if (await this.verifyToken(plainToken, token.tokenHash)) {
                    return token;
                }
            }
            return null;
        } catch (error) {
            console.error('Error finding token:', error);
            return null;
        }
    }
}

module.exports = new UploadTokenController();
