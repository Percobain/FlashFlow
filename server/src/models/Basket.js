const mongoose = require('mongoose');

const BasketSchema = new mongoose.Schema({
  basketId: { type: String, required: true, unique: true },
  basketType: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'mixed'], 
    required: true 
  },
  name: String,
  description: String,
  
  // Risk metrics
  averageRiskScore: Number,
  maxRiskThreshold: Number,
  currentRiskScore: Number,
  volatilityScore: Number,
  
  // Financial metrics
  totalValue: { type: Number, default: 0 },
  totalInvested: { type: Number, default: 0 },
  availableToInvest: { type: Number, default: 0 },
  expectedAPY: Number,
  
  // Assets
  assetIds: [String],
  assetCount: { type: Number, default: 0 },
  
  // Status
  status: { 
    type: String, 
    enum: ['open', 'closed', 'settled'], 
    default: 'open' 
  },
  isFull: { type: Boolean, default: false },
  
  // Performance tracking
  performance: [{
    date: Date,
    value: Number,
    apy: Number
  }],
  
  closedAt: Date
}, {
  timestamps: true
});

module.exports = mongoose.model('Basket', BasketSchema);