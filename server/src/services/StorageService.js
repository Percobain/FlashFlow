const {
    S3Client,
    PutObjectCommand,
    GetObjectCommand,
    DeleteObjectCommand,
    ListObjectsV2Command,
    HeadObjectCommand
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const fs = require("fs");
const path = require("path");
const crypto = require('crypto');

class StorageService {
    constructor() {
        // Check for Cloudflare R2 credentials using your naming convention
        if (process.env.CLOUDFLARE_ACCESS_KEY_ID && process.env.CLOUDFLARE_SECRET_ACCESS_KEY && process.env.CLOUDFLARE_ACCOUNT_ID) {
            // Initialize S3 client for Cloudflare R2
            this.s3Client = new S3Client({
                region: "auto",
                endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
                credentials: {
                    accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID,
                    secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY,
                },
            });
            
            this.bucketName = process.env.CLOUDFLARE_BUCKET_NAME || 'flashflow-documents';
            
            console.log(`Storage service initialized with Cloudflare R2`);
            console.log(`Bucket: ${this.bucketName}`);
            console.log(`Account ID: ${process.env.CLOUDFLARE_ACCOUNT_ID}`);
        } else {
            console.warn('Cloudflare R2 credentials not configured. Storage service will use fallback mode.');
            console.warn('Required environment variables: CLOUDFLARE_ACCESS_KEY_ID, CLOUDFLARE_SECRET_ACCESS_KEY, CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_BUCKET_NAME');
            this.s3Client = null;
        }
    }

    getPublicBase() {
        // Prefer explicit public base if provided (e.g., https://pub-xxxx.r2.dev or https://bucket.r2.dev)
        if (process.env.CLOUDFLARE_PUBLIC_URL)
            return process.env.CLOUDFLARE_PUBLIC_URL;
        if (process.env.CLOUDFLARE_R2_PUBLIC_BASE)
            return process.env.CLOUDFLARE_R2_PUBLIC_BASE;
        // Fallback to cloudflarestorage endpoint if nothing else is configured
        return `https://${process.env.CLOUDFLARE_BUCKET_NAME}.${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`;
    }

    getPublicUrl(key) {
        const publicBase = this.getPublicBase();
        return `${publicBase}/${key}`;
    }

    generateUniqueFileName(originalName, prefix = "") {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        const extension = path.extname(originalName);
        const baseName = path.basename(originalName, extension);

        return `${prefix}${timestamp}-${random}-${baseName}${extension}`;
    }

    async uploadBufferToR2(buffer, key, contentType = "application/octet-stream", meta = {}) {
        try {
            if (!this.s3Client) {
                // Fallback for demo
                return {
                    url: `https://demo-storage.flashflow.com/${key}`,
                    key,
                    size: buffer.length,
                    timestamp: new Date().toISOString(),
                    etag: 'demo-etag',
                    provider: 'demo'
                };
            }

            const command = new PutObjectCommand({
                Bucket: process.env.CLOUDFLARE_BUCKET_NAME,
                Key: key,
                Body: buffer,
                ContentType: contentType,
                Metadata: meta,
            });

            const result = await this.s3Client.send(command);
            const publicBase = this.getPublicBase();
            
            return {
                url: `${publicBase}/${key}`,
                key,
                size: buffer.length,
                timestamp: new Date().toISOString(),
                etag: result.ETag,
                provider: 'cloudflare-r2'
            };
        } catch (error) {
            console.error("Cloudflare R2 buffer upload error:", error);
            throw error;
        }
    }

    async uploadFileToR2(filePath, fileName, meta = {}) {
        try {
            if (!this.s3Client) {
                // Fallback for demo
                const fileContent = fs.readFileSync(filePath);
                return {
                    url: `https://demo-storage.flashflow.com/${fileName}`,
                    key: fileName,
                    size: fileContent.length,
                    timestamp: new Date().toISOString(),
                    etag: 'demo-etag',
                    provider: 'demo'
                };
            }

            const fileContent = fs.readFileSync(filePath);
            const fileExtension = path.extname(fileName).toLowerCase();

            // Determine content type
            let contentType = "application/octet-stream";
            if ([".jpg", ".jpeg"].includes(fileExtension)) {
                contentType = "image/jpeg";
            } else if (fileExtension === ".png") {
                contentType = "image/png";
            } else if (fileExtension === ".gif") {
                contentType = "image/gif";
            } else if (fileExtension === ".webp") {
                contentType = "image/webp";
            } else if (fileExtension === ".pdf") {
                contentType = "application/pdf";
            }

            const command = new PutObjectCommand({
                Bucket: process.env.CLOUDFLARE_BUCKET_NAME,
                Key: fileName,
                Body: fileContent,
                ContentType: contentType,
                Metadata: meta,
            });

            const result = await this.s3Client.send(command);
            const publicBase = this.getPublicBase();
            
            return {
                url: `${publicBase}/${fileName}`,
                key: fileName,
                size: fileContent.length,
                timestamp: new Date().toISOString(),
                etag: result.ETag,
                provider: 'cloudflare-r2'
            };
        } catch (error) {
            console.error("Cloudflare R2 upload error:", error);
            throw error;
        }
    }

    async uploadJSONToR2(jsonData, fileName, meta = {}) {
        try {
            if (!this.s3Client) {
                // Fallback for demo
                const jsonString = JSON.stringify(jsonData, null, 2);
                return {
                    url: `https://demo-storage.flashflow.com/${fileName}`,
                    key: fileName,
                    size: jsonString.length,
                    timestamp: new Date().toISOString(),
                    etag: 'demo-etag',
                    provider: 'demo'
                };
            }

            const jsonString = JSON.stringify(jsonData, null, 2);

            const command = new PutObjectCommand({
                Bucket: process.env.CLOUDFLARE_BUCKET_NAME,
                Key: fileName,
                Body: jsonString,
                ContentType: "application/json",
                Metadata: meta,
            });

            const result = await this.s3Client.send(command);
            const publicBase = this.getPublicBase();
            
            return {
                url: `${publicBase}/${fileName}`,
                key: fileName,
                size: jsonString.length,
                timestamp: new Date().toISOString(),
                etag: result.ETag,
                provider: 'cloudflare-r2'
            };
        } catch (error) {
            console.error("Cloudflare R2 JSON upload error:", error);
            throw error;
        }
    }

    // Legacy method for compatibility with existing asset upload flow
    async uploadDocument(file, assetId, documentType = 'supporting') {
        try {
            if (!this.s3Client) {
                // Fallback for demo - return mock URL
                const mockUrl = `https://demo-storage.flashflow.com/${assetId}/${documentType}/${file.originalname}`;
                return {
                    url: mockUrl,
                    hash: this.calculateFileHash(file.buffer),
                    size: file.size,
                    contentType: file.mimetype,
                    provider: 'demo'
                };
            }

            // Generate unique filename using your pattern
            const fileName = this.generateUniqueFileName(
                file.originalname, 
                `${assetId}/${documentType}/`
            );

            // Upload using your method
            const result = await this.uploadBufferToR2(
                file.buffer,
                fileName,
                file.mimetype,
                {
                    assetId,
                    documentType,
                    originalName: file.originalname,
                    uploadedAt: new Date().toISOString()
                }
            );

            return {
                url: result.url,
                hash: this.calculateFileHash(file.buffer),
                size: file.size,
                contentType: file.mimetype,
                fileName: result.key,
                uploadedAt: new Date(),
                provider: 'cloudflare-r2',
                etag: result.etag
            };
        } catch (error) {
            console.error('Document upload failed:', error);
            throw new Error(`Failed to upload document: ${error.message}`);
        }
    }

    async getSignedDownloadUrl(fileName, expiresIn = 3600) {
        try {
            if (!this.s3Client) {
                // Return mock signed URL for demo
                return `https://demo-storage.flashflow.com/signed/${fileName}?expires=${Date.now() + expiresIn * 1000}`;
            }

            const getObjectCommand = new GetObjectCommand({
                Bucket: this.bucketName,
                Key: fileName
            });

            const signedUrl = await getSignedUrl(this.s3Client, getObjectCommand, {
                expiresIn
            });

            return signedUrl;
        } catch (error) {
            console.error('Failed to generate signed URL:', error);
            throw new Error(`Failed to generate download URL: ${error.message}`);
        }
    }

    async deleteDocument(fileName) {
        try {
            if (!this.s3Client) {
                console.log(`Mock delete: ${fileName}`);
                return { success: true, provider: 'demo' };
            }

            const deleteCommand = new DeleteObjectCommand({
                Bucket: this.bucketName,
                Key: fileName
            });

            await this.s3Client.send(deleteCommand);
            return { success: true, provider: 'cloudflare-r2' };
        } catch (error) {
            console.error('Document deletion failed:', error);
            throw new Error(`Failed to delete document: ${error.message}`);
        }
    }

    calculateFileHash(buffer) {
        return crypto.createHash('sha256').update(buffer).digest('hex');
    }

    validateFileType(file, allowedTypes = []) {
        if (allowedTypes.length === 0) {
            // Default allowed types for documents
            allowedTypes = [
                'application/pdf',
                'image/jpeg',
                'image/png',
                'image/gif',
                'image/webp',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'text/plain',
                'text/csv',
                'application/json'
            ];
        }

        return allowedTypes.includes(file.mimetype);
    }

    validateFileSize(file, maxSizeInMB = 10) {
        const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
        return file.size <= maxSizeInBytes;
    }

    async generatePresignedUploadUrl(assetId, documentType, fileName, contentType, expiresIn = 3600) {
        try {
            if (!this.s3Client) {
                // Return mock presigned URL for demo
                return `https://demo-storage.flashflow.com/upload/${assetId}/${documentType}/${fileName}`;
            }

            const key = `${assetId}/${documentType}/${fileName}`;
            
            const putObjectCommand = new PutObjectCommand({
                Bucket: this.bucketName,
                Key: key,
                ContentType: contentType
            });

            const signedUrl = await getSignedUrl(this.s3Client, putObjectCommand, {
                expiresIn
            });

            return signedUrl;
        } catch (error) {
            console.error('Failed to generate presigned upload URL:', error);
            throw new Error(`Failed to generate upload URL: ${error.message}`);
        }
    }

    // Utility methods for R2 management
    async listFiles(prefix = '', maxKeys = 1000) {
        try {
            if (!this.s3Client) {
                return { files: [], isTruncated: false };
            }

            const command = new ListObjectsV2Command({
                Bucket: this.bucketName,
                Prefix: prefix,
                MaxKeys: maxKeys
            });

            const response = await this.s3Client.send(command);
            
            return {
                files: response.Contents || [],
                isTruncated: response.IsTruncated || false,
                nextToken: response.NextContinuationToken
            };
        } catch (error) {
            console.error('Failed to list files:', error);
            throw new Error(`Failed to list files: ${error.message}`);
        }
    }

    async getFileInfo(fileName) {
        try {
            if (!this.s3Client) {
                return null;
            }

            const command = new HeadObjectCommand({
                Bucket: this.bucketName,
                Key: fileName
            });

            const response = await this.s3Client.send(command);
            
            return {
                size: response.ContentLength,
                contentType: response.ContentType,
                lastModified: response.LastModified,
                metadata: response.Metadata
            };
        } catch (error) {
            if (error.name === 'NotFound') {
                return null;
            }
            console.error('Failed to get file info:', error);
            throw new Error(`Failed to get file info: ${error.message}`);
        }
    }

    // Configuration getters
    isConfigured() {
        return this.s3Client !== null;
    }

    getConfiguration() {
        return {
            provider: 'cloudflare-r2',
            bucketName: this.bucketName,
            accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
            publicUrl: process.env.CLOUDFLARE_PUBLIC_URL,
            isConfigured: this.isConfigured()
        };
    }
}

module.exports = new StorageService();

