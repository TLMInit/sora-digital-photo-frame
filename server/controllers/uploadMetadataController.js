const fs = require('fs').promises;
const path = require('path');

class UploadMetadataController {
    constructor() {
        this.dataPath = path.join(__dirname, '../data');
        this.metadataFile = path.join(this.dataPath, 'upload-metadata.json');
        this.initializeDataFile();
    }

    async initializeDataFile() {
        try {
            await fs.access(this.dataPath);
        } catch (error) {
            await fs.mkdir(this.dataPath, { recursive: true });
        }

        try {
            await fs.access(this.metadataFile);
        } catch (error) {
            await this.saveMetadata([]);
        }
    }

    async loadMetadata() {
        try {
            const data = await fs.readFile(this.metadataFile, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            return [];
        }
    }

    async saveMetadata(metadata) {
        await fs.writeFile(this.metadataFile, JSON.stringify(metadata, null, 2));
    }

    async recordUpload(accountId, accountName, filePath) {
        const metadata = await this.loadMetadata();
        metadata.push({
            accountId,
            accountName,
            filePath,
            uploadedAt: new Date().toISOString()
        });
        await this.saveMetadata(metadata);
    }

    async recordUploads(accountId, accountName, filePaths) {
        const metadata = await this.loadMetadata();
        for (const filePath of filePaths) {
            metadata.push({
                accountId,
                accountName,
                filePath,
                uploadedAt: new Date().toISOString()
            });
        }
        await this.saveMetadata(metadata);
    }

    async getUploadsByAccount(accountId) {
        const metadata = await this.loadMetadata();
        return metadata.filter(entry => entry.accountId === accountId);
    }

    async isOwnedByAccount(accountId, filePath) {
        const metadata = await this.loadMetadata();
        return metadata.some(entry => entry.accountId === accountId && entry.filePath === filePath);
    }

    async removeMetadata(filePath) {
        const metadata = await this.loadMetadata();
        const filtered = metadata.filter(entry => entry.filePath !== filePath);
        await this.saveMetadata(filtered);
    }

    async removeMetadataBatch(filePaths) {
        const metadata = await this.loadMetadata();
        const pathSet = new Set(filePaths);
        const filtered = metadata.filter(entry => !pathSet.has(entry.filePath));
        await this.saveMetadata(filtered);
    }
}

module.exports = new UploadMetadataController();
