const mongoose = require('mongoose');

const FileSchema = new mongoose.Schema({
  fileName: {
    type: String,
    required: true,
    unique: true
  },
  originalName: {
    type: String,
    required: true
  },
  fileUrl: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    required: true
  },
  hash: {
    type: String,
    required: true,
    unique: true
  },
  // Who uploaded the file
  uploadedBy: {
    type: String, // wallet address
    required: true
  },
  // What asset/context this file belongs to
  assetId: {
    type: String,
    sparse: true
  },
  assetType: {
    type: String,
    enum: ['invoice', 'saas', 'creator', 'rental', 'luxury'],
    sparse: true
  },
  // Additional metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  // File processing status
  status: {
    type: String,
    enum: ['uploaded', 'processing', 'processed', 'failed'],
    default: 'uploaded'
  },
  // Timestamps
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  processedAt: {
    type: Date
  }
});

// Index for efficient queries
FileSchema.index({ uploadedBy: 1 });
FileSchema.index({ assetId: 1 });
FileSchema.index({ assetType: 1 });
FileSchema.index({ hash: 1 });
FileSchema.index({ uploadedAt: -1 });

// Methods
FileSchema.methods.generateHash = function() {
  const crypto = require('crypto');
  this.hash = crypto.createHash('sha256')
    .update(this.fileName + this.uploadedBy + this.uploadedAt)
    .digest('hex');
  return this.hash;
};

module.exports = mongoose.model('File', FileSchema);