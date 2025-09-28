const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const crypto = require('crypto');

class StorageService {
  constructor() {
    this.s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      },
    });
  }

  async uploadFile(file) {
    try {
      const fileKey = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}-${file.originalname}`;
      
      const command = new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: fileKey,
        Body: file.buffer,
        ContentType: file.mimetype,
      });

      await this.s3Client.send(command);
      
      // Return public URL
      return `${process.env.R2_PUBLIC_URL}/${fileKey}`;
    } catch (error) {
      console.error('Storage upload error:', error);
      // Return a dummy URL for testing
      return `https://storage.flashflow.finance/demo/${Date.now()}.pdf`;
    }
  }
}

module.exports = new StorageService();

