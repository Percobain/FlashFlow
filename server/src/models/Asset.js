const mongoose = require('mongoose');

const AssetSchema = new mongoose.Schema({
  assetId: { type: String, required: true, unique: true }, // bytes32 from contract
  assetType: { 
    type: String, 
    enum: ['invoice', 'saas', 'creator', 'rental', 'luxury'], 
    required: true 
  },
  
  // Owner info
  originatorAddress: { type: String, required: true },
  originatorEmail: String,
  
  // Financial details
  faceAmount: { type: Number, required: true }, // USD
  unlockableAmount: { type: Number, required: true },
  
  // Risk assessment
  riskScore: { type: Number, min: 0, max: 100, required: true },
  aiAnalysis: {
    model: String,
    reasoning: String,
    confidence: Number,
    factors: {
      paymentHistory: Number,
      businessStability: Number,
      documentQuality: Number,
      industryRisk: Number,
      marketConditions: Number
    },
    analyzedAt: Date
  },
  
  // Basket assignment
  basketId: String,
  basketType: { type: String, enum: ['low', 'medium', 'high', 'mixed'] },
  
  // Documents
  documents: [{
    type: { type: String, enum: ['invoice', 'contract', 'verification', 'supporting'] },
    url: String,
    hash: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  
  // Status tracking
  status: { 
    type: String, 
    enum: ['pending', 'funded', 'invested', 'paid', 'distributed'], 
    default: 'pending' 
  },
  funded: { type: Boolean, default: false },
  fundedAt: Date,
  fundedTxHash: String,
  
  // Payment tracking
  paid: { type: Boolean, default: false },
  paidAt: Date,
  paidAmount: { type: Number, default: 0 },
  
  // Type-specific data
  invoiceData: {
    invoiceNumber: String,
    dueDate: Date,
    payerCompany: String,
    terms: String
  },
  
  saasData: {
    planType: String,
    mrr: Number,
    subscriptionStart: Date,
    subscriptionEnd: Date,
    churnRate: Number
  },
  
  creatorData: {
    platform: String,
    contentType: String,
    followers: Number,
    engagementRate: Number,
    deliverables: [String]
  },
  
  rentalData: {
    propertyType: String,
    address: String,
    monthlyRent: Number,
    leaseTerm: Number
  },
  
  luxuryData: {
    assetName: String,
    brand: String,
    estimatedValue: Number,
    condition: String,
    images: [String]
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Asset', AssetSchema);