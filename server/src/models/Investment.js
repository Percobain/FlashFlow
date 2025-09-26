const mongoose = require('mongoose');

const InvestmentSchema = new mongoose.Schema({
  investmentId: { 
    type: String, 
    required: true, 
    unique: true 
  },
  
  // Core Investment Data
  investorAddress: { 
    type: String, 
    required: true,
    match: /^0x[a-fA-F0-9]{40}$/
  },
  assetId: { 
    type: String, 
    required: true 
  },
  basketId: { 
    type: String, 
    required: true 
  },
  
  // Financial Details
  amount: { 
    type: Number, 
    required: true,
    min: 0
  },
  amountWei: { 
    type: String, 
    required: true 
  },
  
  // Returns Calculation
  expectedReturn: { 
    type: Number, 
    required: true 
  },
  expectedROI: { 
    type: Number, 
    required: true 
  },
  expectedAPY: { 
    type: Number, 
    required: true 
  },
  
  // Transaction Tracking
  investTxHash: String,
  investBlockNumber: Number,
  
  // Payout Information
  payoutAmount: { 
    type: Number, 
    default: 0 
  },
  payoutTxHash: String,
  payoutBlockNumber: Number,
  paidOut: { 
    type: Boolean, 
    default: false 
  },
  payoutDate: Date,
  
  // Status Tracking
  status: { 
    type: String, 
    enum: ['pending', 'active', 'matured', 'paid_out', 'defaulted'],
    default: 'pending'
  },
  
  // Investment Performance
  performance: {
    actualROI: Number,
    actualAPY: Number,
    holdingPeriod: Number, // days
    performanceRating: { type: String, enum: ['excellent', 'good', 'average', 'poor'] }
  },
  
  // Metadata
  investedAt: { 
    type: Date, 
    default: Date.now 
  },
  maturityDate: Date,
  
  // Risk Assessment at Investment Time
  riskAssessment: {
    assetRiskScore: Number,
    basketRiskScore: Number,
    investorRiskTolerance: String,
    riskAdjustedReturn: Number
  }
}, {
  timestamps: true
});

// Indexes
InvestmentSchema.index({ investorAddress: 1 });
InvestmentSchema.index({ assetId: 1 });
InvestmentSchema.index({ basketId: 1 });
InvestmentSchema.index({ status: 1 });
InvestmentSchema.index({ investedAt: -1 });

// Virtual for actual return percentage
InvestmentSchema.virtual('actualReturnPercentage').get(function() {
  if (this.paidOut && this.amount > 0) {
    return ((this.payoutAmount - this.amount) / this.amount) * 100;
  }
  return 0;
});

// Methods
InvestmentSchema.methods.calculateExpectedPayout = function() {
  return this.amount * (1 + this.expectedROI / 100);
};

InvestmentSchema.methods.isMatured = function() {
  return this.maturityDate && new Date() >= this.maturityDate;
};

InvestmentSchema.methods.getHoldingPeriod = function() {
  const endDate = this.payoutDate || new Date();
  return Math.floor((endDate - this.investedAt) / (1000 * 60 * 60 * 24));
};

module.exports = mongoose.model('Investment', InvestmentSchema);