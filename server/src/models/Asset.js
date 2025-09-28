const mongoose = require('mongoose');

const assetSchema = new mongoose.Schema({
  assetId: { type: String, required: true, unique: true },
  originator: { type: String, required: true },
  assetType: { type: String, required: true },
  amount: { type: Number, required: true },
  unlockable: { type: Number, required: true },
  riskScore: { type: Number, required: true },
  basketId: { type: String, required: true },
  documentUrl: { type: String },
  analysis: {
    reasoning: String,
    keyFactors: [String]
  },
  status: { 
    type: String, 
    enum: ['pending', 'funding', 'funded', 'repaid'],
    default: 'pending'
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Asset', assetSchema);