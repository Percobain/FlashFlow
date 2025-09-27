const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const crypto = require('crypto');
const path = require('path');

/**
 * Enhanced Storage Service for Cloudflare R2
 * Provides secure file upload/download with presigned URLs
 * Supports various file types for invoice processing and asset documentation
 */
class StorageService {
    constructor() {
        // Check for Cloudflare R2 credentials using your exact naming convention
        if (process.env.CLOUDFLARE_ACCESS_KEY_ID && process.env.CLOUDFLARE_SECRET_ACCESS_KEY && process.env.CLOUDFLARE_S3_API) {
            // Initialize S3 client for Cloudflare R2
            this.s3Client = new S3Client({
                region: "auto",
                endpoint: process.env.CLOUDFLARE_S3_API.replace('/flashflow', ''), // Remove bucket from endpoint
                credentials: {
                    accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID,
                    secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY,
                },
            });
            
            this.bucketName = process.env.CLOUDFLARE_BUCKET_NAME || 'flashflow';
            
            console.log(`✅ Storage service initialized with Cloudflare R2`);
            console.log(`📦 Bucket: ${this.bucketName}`);
            console.log(`🌐 Public URL: ${process.env.CLOUDFLARE_PUBLIC_URL}`);
        } else {
            console.warn('⚠️  Cloudflare R2 credentials not configured. Storage service will use fallback mode.');
            console.warn('Required environment variables: CLOUDFLARE_ACCESS_KEY_ID, CLOUDFLARE_SECRET_ACCESS_KEY, CLOUDFLARE_S3_API, CLOUDFLARE_BUCKET_NAME');
            this.s3Client = null;
        }
    }

    getPublicBase() {
        // Use your exact public URL
        if (process.env.CLOUDFLARE_PUBLIC_URL)
            return process.env.CLOUDFLARE_PUBLIC_URL;
        
        // Fallback
        return `https://pub-default.r2.dev`;
    }

    /**
     * Generate presigned URL for file upload
     * @param {string} fileName - Name of the file to upload
     * @param {string} contentType - MIME type of the file
     * @param {number} expiresIn - URL expiration time in seconds (default: 15 minutes)
     * @returns {Promise<{uploadUrl: string, downloadUrl: string}>}
     */
    async getPresignedUploadUrl(fileName, contentType, expiresIn = 900) {
        if (!this.s3Client) {
            throw new Error('Storage service not initialized. Please configure Cloudflare R2 credentials.');
        }

        try {
            // Generate unique filename to prevent conflicts
            const timestamp = Date.now();
            const randomBytes = crypto.randomBytes(8).toString('hex');
            const uniqueFileName = `${timestamp}-${randomBytes}-${fileName}`;

            const command = new PutObjectCommand({
                Bucket: this.bucketName,
                Key: uniqueFileName,
                ContentType: contentType,
            });

            const uploadUrl = await getSignedUrl(this.s3Client, command, { expiresIn });
            const downloadUrl = `${this.getPublicBase()}/${uniqueFileName}`;

            return {
                uploadUrl,
                downloadUrl,
                fileName: uniqueFileName,
            };
        } catch (error) {
            console.error('Error generating presigned upload URL:', error);
            throw new Error(`Failed to generate upload URL: ${error.message}`);
        }
    }

    /**
     * Generate presigned URL for file download
     * @param {string} fileName - Name of the file to download
     * @param {number} expiresIn - URL expiration time in seconds (default: 1 hour)
     * @returns {Promise<string>}
     */
    async getPresignedDownloadUrl(fileName, expiresIn = 3600) {
        if (!this.s3Client) {
            throw new Error('Storage service not initialized. Please configure Cloudflare R2 credentials.');
        }

        try {
            const command = new GetObjectCommand({
                Bucket: this.bucketName,
                Key: fileName,
            });

            const downloadUrl = await getSignedUrl(this.s3Client, command, { expiresIn });
            return downloadUrl;
        } catch (error) {
            console.error('Error generating presigned download URL:', error);
            throw new Error(`Failed to generate download URL: ${error.message}`);
        }
    }

    /**
     * Upload file directly to R2 (server-side upload)
     * @param {Buffer} fileBuffer - File content as buffer
     * @param {string} fileName - Name of the file
     * @param {string} contentType - MIME type of the file
     * @param {object} metadata - Additional metadata to store with file
     * @returns {Promise<{fileName: string, downloadUrl: string}>}
     */
    async uploadFile(fileBuffer, fileName, contentType, metadata = {}) {
        if (!this.s3Client) {
            throw new Error('Storage service not initialized. Please configure Cloudflare R2 credentials.');
        }

        try {
            // Generate unique filename
            const timestamp = Date.now();
            const randomBytes = crypto.randomBytes(8).toString('hex');
            const uniqueFileName = `${timestamp}-${randomBytes}-${fileName}`;

            const command = new PutObjectCommand({
                Bucket: this.bucketName,
                Key: uniqueFileName,
                Body: fileBuffer,
                ContentType: contentType,
                Metadata: metadata,
            });

            await this.s3Client.send(command);

            const downloadUrl = `${this.getPublicBase()}/${uniqueFileName}`;

            return {
                fileName: uniqueFileName,
                downloadUrl,
            };
        } catch (error) {
            console.error('Error uploading file:', error);
            throw new Error(`Failed to upload file: ${error.message}`);
        }
    }

    /**
     * Delete file from R2
     * @param {string} fileName - Name of the file to delete
     * @returns {Promise<boolean>}
     */
    async deleteFile(fileName) {
        if (!this.s3Client) {
            throw new Error('Storage service not initialized. Please configure Cloudflare R2 credentials.');
        }

        try {
            const command = new DeleteObjectCommand({
                Bucket: this.bucketName,
                Key: fileName,
            });

            await this.s3Client.send(command);
            return true;
        } catch (error) {
            console.error('Error deleting file:', error);
            throw new Error(`Failed to delete file: ${error.message}`);
        }
    }

    /**
     * Get file metadata
     * @param {string} fileName - Name of the file
     * @returns {Promise<object>}
     */
    async getFileMetadata(fileName) {
        if (!this.s3Client) {
            throw new Error('Storage service not initialized. Please configure Cloudflare R2 credentials.');
        }

        try {
            const command = new HeadObjectCommand({
                Bucket: this.bucketName,
                Key: fileName,
            });

            const response = await this.s3Client.send(command);
            return {
                fileName,
                size: response.ContentLength,
                contentType: response.ContentType,
                lastModified: response.LastModified,
                metadata: response.Metadata,
            };
        } catch (error) {
            console.error('Error getting file metadata:', error);
            throw new Error(`Failed to get file metadata: ${error.message}`);
        }
    }

    /**
     * List files in a directory
     * @param {string} prefix - Directory prefix to list files from
     * @param {number} maxKeys - Maximum number of files to return
     * @returns {Promise<Array>}
     */
    async listFiles(prefix = '', maxKeys = 100) {
        if (!this.s3Client) {
            throw new Error('Storage service not initialized. Please configure Cloudflare R2 credentials.');
        }

        try {
            const command = new ListObjectsV2Command({
                Bucket: this.bucketName,
                Prefix: prefix,
                MaxKeys: maxKeys,
            });

            const response = await this.s3Client.send(command);
            
            if (!response.Contents) {
                return [];
            }

            return response.Contents.map(object => ({
                fileName: object.Key,
                size: object.Size,
                lastModified: object.LastModified,
                downloadUrl: `${this.getPublicBase()}/${object.Key}`,
            }));
        } catch (error) {
            console.error('Error listing files:', error);
            throw new Error(`Failed to list files: ${error.message}`);
        }
    }

    /**
     * Upload multiple files (batch upload)
     * @param {Array} files - Array of {buffer, fileName, contentType, metadata}
     * @returns {Promise<Array>}
     */
    async uploadMultipleFiles(files) {
        const uploadPromises = files.map(file => 
            this.uploadFile(file.buffer, file.fileName, file.contentType, file.metadata)
        );

        try {
            const results = await Promise.all(uploadPromises);
            return results;
        } catch (error) {
            console.error('Error in batch upload:', error);
            throw new Error(`Batch upload failed: ${error.message}`);
        }
    }

    /**
     * Get storage statistics
     * @returns {Promise<object>}
     */
    async getStorageStats() {
        try {
            const files = await this.listFiles('', 1000); // Get up to 1000 files for stats
            
            const totalSize = files.reduce((sum, file) => sum + (file.size || 0), 0);
            const totalFiles = files.length;
            
            // Group by file type
            const fileTypes = files.reduce((acc, file) => {
                const ext = path.extname(file.fileName).toLowerCase();
                acc[ext] = (acc[ext] || 0) + 1;
                return acc;
            }, {});

            return {
                totalFiles,
                totalSize,
                totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
                fileTypes,
                bucketName: this.bucketName,
                publicUrl: this.getPublicBase(),
            };
        } catch (error) {
            console.error('Error getting storage stats:', error);
            return {
                totalFiles: 0,
                totalSize: 0,
                totalSizeMB: '0.00',
                fileTypes: {},
                bucketName: this.bucketName,
                publicUrl: this.getPublicBase(),
                error: error.message,
            };
        }
    }

    /**
     * Health check for storage service
     * @returns {Promise<object>}
     */
    async healthCheck() {
        if (!this.s3Client) {
            return {
                status: 'error',
                message: 'Storage service not initialized',
                configured: false,
            };
        }

        try {
            // Try to list a few files as a health check
            await this.listFiles('', 1);
            
            return {
                status: 'healthy',
                message: 'Storage service is operational',
                configured: true,
                bucketName: this.bucketName,
                publicUrl: this.getPublicBase(),
            };
        } catch (error) {
            return {
                status: 'error',
                message: `Storage service error: ${error.message}`,
                configured: true,
                bucketName: this.bucketName,
            };
        }
    }
}

module.exports = new StorageService();

