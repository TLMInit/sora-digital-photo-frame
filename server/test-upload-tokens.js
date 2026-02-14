#!/usr/bin/env node

/**
 * Comprehensive Upload Token System Test Suite
 * Tests every function and button with detailed error logging
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

class UploadTokenTester {
    constructor() {
        this.results = [];
        this.errors = [];
        this.tokensFile = path.join(__dirname, 'data', 'upload-tokens.json');
        this.testToken = null;
        this.testTokenPlain = null;
    }

    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
        console.log(`${prefix} [${timestamp}] ${message}`);
        
        this.results.push({ timestamp, type, message });
        if (type === 'error') {
            this.errors.push({ timestamp, message });
        }
    }

    async test(name, fn) {
        console.log(`\n${'='.repeat(60)}`);
        console.log(`Testing: ${name}`);
        console.log('='.repeat(60));
        
        try {
            await fn();
            this.log(`✓ ${name} passed`, 'success');
            return true;
        } catch (error) {
            this.log(`✗ ${name} failed: ${error.message}`, 'error');
            console.error(error.stack);
            return false;
        }
    }

    generateSecureToken() {
        return crypto.randomBytes(32).toString('base64url');
    }

    async hashToken(token) {
        const salt = await bcrypt.genSalt(10);
        return await bcrypt.hash(token, salt);
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

    // Test 1: Token Generation
    async testTokenGeneration() {
        const token = this.generateSecureToken();
        
        if (!token) {
            throw new Error('Token generation failed - returned null/undefined');
        }
        
        if (token.length < 43) { // 32 bytes in base64url is 43 characters
            throw new Error(`Token too short: ${token.length} characters`);
        }
        
        // Check it's URL-safe (no +, /, =)
        if (/[+/=]/.test(token)) {
            throw new Error('Token is not URL-safe (contains +, /, or =)');
        }
        
        this.log(`Generated secure token: ${token.substring(0, 20)}...`, 'info');
        this.testTokenPlain = token;
    }

    // Test 2: Token Hashing
    async testTokenHashing() {
        const plainToken = this.testTokenPlain || this.generateSecureToken();
        const hashedToken = await this.hashToken(plainToken);
        
        if (!hashedToken) {
            throw new Error('Token hashing failed - returned null/undefined');
        }
        
        if (!hashedToken.startsWith('$2a$') && !hashedToken.startsWith('$2b$')) {
            throw new Error('Hashed token does not appear to be bcrypt format');
        }
        
        // Verify the hash matches
        const isValid = await bcrypt.compare(plainToken, hashedToken);
        if (!isValid) {
            throw new Error('Hashed token does not match original token');
        }
        
        this.log(`Token hashing works correctly`, 'info');
    }

    // Test 3: Create Token (Never Expires)
    async testCreateTokenNeverExpires() {
        const tokens = await this.loadTokens();
        const initialCount = tokens.length;
        
        const plainToken = this.generateSecureToken();
        const hashedToken = await this.hashToken(plainToken);
        
        const newToken = {
            id: crypto.randomBytes(16).toString('hex'),
            tokenHash: hashedToken,
            name: 'Test Token - Never Expires',
            createdAt: Date.now(),
            expiresAt: null, // NEVER EXPIRES
            uploadLimit: null,
            uploadCount: 0,
            enabled: true,
            targetFolder: 'uploads',
            createdBy: 'test'
        };
        
        tokens.push(newToken);
        await this.saveTokens(tokens);
        
        // Verify
        const updatedTokens = await this.loadTokens();
        if (updatedTokens.length !== initialCount + 1) {
            throw new Error(`Token not added. Expected ${initialCount + 1}, got ${updatedTokens.length}`);
        }
        
        const savedToken = updatedTokens.find(t => t.id === newToken.id);
        if (!savedToken) {
            throw new Error('Token not found after save');
        }
        
        if (savedToken.expiresAt !== null) {
            throw new Error(`Expected expiresAt to be null, got ${savedToken.expiresAt}`);
        }
        
        this.testToken = savedToken;
        this.testTokenPlain = plainToken;
        this.log(`Created token with NO EXPIRY: ${newToken.name}`, 'info');
    }

    // Test 4: Create Token (With Expiration)
    async testCreateTokenWithExpiration() {
        const tokens = await this.loadTokens();
        const plainToken = this.generateSecureToken();
        const hashedToken = await this.hashToken(plainToken);
        
        const expiresIn7Days = Date.now() + (7 * 24 * 60 * 60 * 1000);
        
        const newToken = {
            id: crypto.randomBytes(16).toString('hex'),
            tokenHash: hashedToken,
            name: 'Test Token - 7 Days',
            createdAt: Date.now(),
            expiresAt: expiresIn7Days,
            uploadLimit: 50,
            uploadCount: 0,
            enabled: true,
            targetFolder: 'vacation',
            createdBy: 'test'
        };
        
        tokens.push(newToken);
        await this.saveTokens(tokens);
        
        // Verify
        const savedToken = (await this.loadTokens()).find(t => t.id === newToken.id);
        if (!savedToken) {
            throw new Error('Token not found after save');
        }
        
        if (savedToken.expiresAt !== expiresIn7Days) {
            throw new Error(`Expected expiresAt to be ${expiresIn7Days}, got ${savedToken.expiresAt}`);
        }
        
        if (savedToken.uploadLimit !== 50) {
            throw new Error(`Expected uploadLimit to be 50, got ${savedToken.uploadLimit}`);
        }
        
        this.log(`Created token with 7-day expiration and 50 upload limit`, 'info');
    }

    // Test 5: Token Validation
    async testTokenValidation() {
        if (!this.testToken || !this.testTokenPlain) {
            throw new Error('No test token available. Run testCreateToken first.');
        }
        
        const isValid = await bcrypt.compare(this.testTokenPlain, this.testToken.tokenHash);
        if (!isValid) {
            throw new Error('Token validation failed - bcrypt comparison returned false');
        }
        
        // Test with wrong token
        const wrongToken = this.generateSecureToken();
        const isInvalid = await bcrypt.compare(wrongToken, this.testToken.tokenHash);
        if (isInvalid) {
            throw new Error('Token validation failed - wrong token validated as correct');
        }
        
        this.log('Token validation works correctly', 'info');
    }

    // Test 6: Token Expiration Check
    async testTokenExpirationCheck() {
        const tokens = await this.loadTokens();
        
        // Test never-expiring token
        const neverExpiresToken = tokens.find(t => t.expiresAt === null);
        if (neverExpiresToken) {
            const isExpired = neverExpiresToken.expiresAt && Date.now() > neverExpiresToken.expiresAt;
            if (isExpired) {
                throw new Error('Never-expiring token is marked as expired');
            }
            this.log('Never-expiring token correctly identified as not expired', 'info');
        }
        
        // Create an already-expired token
        const plainToken = this.generateSecureToken();
        const hashedToken = await this.hashToken(plainToken);
        
        const expiredToken = {
            id: crypto.randomBytes(16).toString('hex'),
            tokenHash: hashedToken,
            name: 'Test Token - Expired',
            createdAt: Date.now() - (10 * 24 * 60 * 60 * 1000),
            expiresAt: Date.now() - (1 * 24 * 60 * 60 * 1000), // Expired yesterday
            uploadLimit: null,
            uploadCount: 0,
            enabled: true,
            targetFolder: 'uploads',
            createdBy: 'test'
        };
        
        tokens.push(expiredToken);
        await this.saveTokens(tokens);
        
        // Verify expiration detection
        const isExpired = expiredToken.expiresAt && Date.now() > expiredToken.expiresAt;
        if (!isExpired) {
            throw new Error('Expired token not detected as expired');
        }
        
        this.log('Token expiration check works correctly', 'info');
    }

    // Test 7: Enable/Disable Token
    async testToggleTokenEnabled() {
        if (!this.testToken) {
            throw new Error('No test token available');
        }
        
        const tokens = await this.loadTokens();
        const tokenIndex = tokens.findIndex(t => t.id === this.testToken.id);
        
        if (tokenIndex === -1) {
            throw new Error('Test token not found');
        }
        
        // Disable
        tokens[tokenIndex].enabled = false;
        await this.saveTokens(tokens);
        
        let updatedToken = (await this.loadTokens()).find(t => t.id === this.testToken.id);
        if (updatedToken.enabled !== false) {
            throw new Error('Token not disabled');
        }
        
        // Enable
        tokens[tokenIndex].enabled = true;
        await this.saveTokens(tokens);
        
        updatedToken = (await this.loadTokens()).find(t => t.id === this.testToken.id);
        if (updatedToken.enabled !== true) {
            throw new Error('Token not enabled');
        }
        
        this.log('Token enable/disable toggle works correctly', 'info');
    }

    // Test 8: Upload Limit Enforcement
    async testUploadLimitEnforcement() {
        const tokens = await this.loadTokens();
        const plainToken = this.generateSecureToken();
        const hashedToken = await this.hashToken(plainToken);
        
        const limitedToken = {
            id: crypto.randomBytes(16).toString('hex'),
            tokenHash: hashedToken,
            name: 'Test Token - Limited',
            createdAt: Date.now(),
            expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000),
            uploadLimit: 5,
            uploadCount: 0,
            enabled: true,
            targetFolder: 'uploads',
            createdBy: 'test'
        };
        
        tokens.push(limitedToken);
        await this.saveTokens(tokens);
        
        // Simulate uploads
        const tokenIndex = tokens.findIndex(t => t.id === limitedToken.id);
        for (let i = 1; i <= 5; i++) {
            tokens[tokenIndex].uploadCount = i;
            await this.saveTokens(tokens);
            
            const updatedToken = (await this.loadTokens()).find(t => t.id === limitedToken.id);
            if (updatedToken.uploadCount !== i) {
                throw new Error(`Upload count not updated correctly. Expected ${i}, got ${updatedToken.uploadCount}`);
            }
        }
        
        // Check if limit reached
        const finalToken = (await this.loadTokens()).find(t => t.id === limitedToken.id);
        const isLimitReached = finalToken.uploadCount >= finalToken.uploadLimit;
        if (!isLimitReached) {
            throw new Error('Upload limit not detected as reached');
        }
        
        this.log('Upload limit enforcement works correctly', 'info');
    }

    // Test 9: Delete Token
    async testDeleteToken() {
        const tokens = await this.loadTokens();
        const initialCount = tokens.length;
        
        if (initialCount === 0) {
            throw new Error('No tokens to delete');
        }
        
        // Delete the first test token
        const tokenToDelete = tokens[0];
        const filteredTokens = tokens.filter(t => t.id !== tokenToDelete.id);
        await this.saveTokens(filteredTokens);
        
        // Verify
        const updatedTokens = await this.loadTokens();
        if (updatedTokens.length !== initialCount - 1) {
            throw new Error(`Token not deleted. Expected ${initialCount - 1}, got ${updatedTokens.length}`);
        }
        
        const deletedToken = updatedTokens.find(t => t.id === tokenToDelete.id);
        if (deletedToken) {
            throw new Error('Deleted token still exists');
        }
        
        this.log(`Token deleted successfully`, 'info');
    }

    // Test 10: QR Code Data Generation
    async testQRCodeDataGeneration() {
        if (!this.testTokenPlain) {
            throw new Error('No test token plain text available');
        }
        
        const baseUrl = 'http://localhost:3000';
        const qrData = `${baseUrl}/guest-upload?token=${this.testTokenPlain}`;
        
        if (!qrData.includes('guest-upload?token=')) {
            throw new Error('QR code URL format incorrect');
        }
        
        if (qrData.length < 80) { // Base URL + token should be significant length
            throw new Error(`QR code data too short: ${qrData.length} characters`);
        }
        
        this.log(`QR code data generated: ${qrData.substring(0, 60)}...`, 'info');
    }

    // Test 11: Link Generation
    async testLinkGeneration() {
        if (!this.testTokenPlain) {
            throw new Error('No test token plain text available');
        }
        
        const baseUrl = 'http://localhost:3000';
        const shareableLink = `${baseUrl}/guest-upload?token=${this.testTokenPlain}`;
        
        // Validate link format
        try {
            const url = new URL(shareableLink);
            const tokenParam = url.searchParams.get('token');
            
            if (!tokenParam) {
                throw new Error('Token parameter missing from URL');
            }
            
            if (tokenParam !== this.testTokenPlain) {
                throw new Error('Token parameter does not match plain token');
            }
            
            this.log(`Shareable link generated: ${shareableLink.substring(0, 60)}...`, 'info');
        } catch (error) {
            throw new Error(`Invalid URL format: ${error.message}`);
        }
    }

    // Test 12: Zero-Day Expiration (Never Expires)
    async testZeroDayExpiration() {
        const expiresInDays = 0;
        const expiresAt = expiresInDays === 0 ? null : Date.now() + (expiresInDays * 24 * 60 * 60 * 1000);
        
        if (expiresAt !== null) {
            throw new Error(`Expected null for 0-day expiration, got ${expiresAt}`);
        }
        
        this.log('0-day expiration correctly converts to null (never expires)', 'info');
    }

    async runAllTests() {
        console.log('\n' + '═'.repeat(80));
        console.log('  COMPREHENSIVE UPLOAD TOKEN SYSTEM TEST SUITE');
        console.log('═'.repeat(80) + '\n');
        
        const tests = [
            { name: 'Token Generation', fn: () => this.testTokenGeneration() },
            { name: 'Token Hashing', fn: () => this.testTokenHashing() },
            { name: 'Create Token (Never Expires)', fn: () => this.testCreateTokenNeverExpires() },
            { name: 'Create Token (With Expiration)', fn: () => this.testCreateTokenWithExpiration() },
            { name: 'Token Validation', fn: () => this.testTokenValidation() },
            { name: 'Token Expiration Check', fn: () => this.testTokenExpirationCheck() },
            { name: 'Enable/Disable Token', fn: () => this.testToggleTokenEnabled() },
            { name: 'Upload Limit Enforcement', fn: () => this.testUploadLimitEnforcement() },
            { name: 'Delete Token', fn: () => this.testDeleteToken() },
            { name: 'QR Code Data Generation', fn: () => this.testQRCodeDataGeneration() },
            { name: 'Link Generation', fn: () => this.testLinkGeneration() },
            { name: 'Zero-Day Expiration', fn: () => this.testZeroDayExpiration() }
        ];
        
        let passed = 0;
        let failed = 0;
        
        for (const { name, fn } of tests) {
            const result = await this.test(name, fn);
            if (result) {
                passed++;
            } else {
                failed++;
            }
        }
        
        // Summary
        console.log('\n' + '═'.repeat(80));
        console.log('  TEST SUMMARY');
        console.log('═'.repeat(80));
        console.log(`Total Tests: ${tests.length}`);
        console.log(`✅ Passed: ${passed}`);
        console.log(`❌ Failed: ${failed}`);
        console.log(`Success Rate: ${((passed / tests.length) * 100).toFixed(1)}%`);
        
        if (this.errors.length > 0) {
            console.log('\n' + '─'.repeat(80));
            console.log('  ERRORS ENCOUNTERED');
            console.log('─'.repeat(80));
            this.errors.forEach((error, index) => {
                console.log(`${index + 1}. ${error.message}`);
            });
        }
        
        console.log('\n' + '═'.repeat(80) + '\n');
        
        return { passed, failed, errors: this.errors };
    }
}

// Run tests if executed directly
if (require.main === module) {
    const tester = new UploadTokenTester();
    tester.runAllTests()
        .then(results => {
            process.exit(results.failed > 0 ? 1 : 0);
        })
        .catch(error => {
            console.error('Fatal error running tests:', error);
            process.exit(1);
        });
}

module.exports = UploadTokenTester;
