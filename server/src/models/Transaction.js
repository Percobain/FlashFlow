const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  transactionId: { 
    type: String, 
    required: true, 
    unique: true 
  },
  
  // Transaction Type
  type: { 
    type: String, 
    enum: [
      'asset_creation', 
      'funding', 
      'investment', 
      'payment', 
      'distribution',
      'token_mint',
      'token_transfer',
      'pool_deposit',
      'pool_withdrawal'
    ],
    required: true 
  },
  
  // Blockchain Data
  txHash: { 
    type: String, 
    required: true,
    unique: true
  },
  blockNumber: Number,
  blockHash: String,
  gasUsed: Number,
  gasPrice: String,
  
  // Parties Involved
  from: { 
    type: String, 
    required: true,
    match: /^0x[a-fA-F0-9]{40}$/
  },
  to: { 
    type: String, 
    required: true,
    match: /^0x[a-fA-F0-9]{40}$/
  },
  
  // Financial Details
  amount: { 
    type: Number, 
    required: true 
  },
  amountWei: { 
    type: String, 
    required: true 
  },
  feeAmount: { 
    type: Number, 
    default: 0 
  },
  feeAmountWei: { 
    type: String, 
    default: '0' 
  },
  
  // Related Entities
  assetId: String,
  basketId: String,
  investmentId: String,
  
  // Status
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'failed', 'reverted'],
    default: 'pending'
  },
  confirmations: { 
    type: Number, 
    default: 0 
  },
  
  // Metadata
  metadata: {
    description: String,
    category: String,
    tags: [String],
    internalNotes: String,
    relatedTransactions: [String]
  },
  
  // Timing
  submittedAt: { 
    type: Date, 
    default: Date.now 
  },
  confirmedAt: Date,
  timestamp: Date
}, {
  timestamps: true
});

// Indexes
TransactionSchema.index({ txHash: 1 });
TransactionSchema.index({ from: 1 });
TransactionSchema.index({ to: 1 });
TransactionSchema.index({ type: 1 });
TransactionSchema.index({ status: 1 });
TransactionSchema.index({ assetId: 1 });
TransactionSchema.index({ basketId: 1 });
TransactionSchema.index({ submittedAt: -1 });

// Methods
TransactionSchema.methods.isConfirmed = function() {
  return this.status === 'confirmed' && this.confirmations > 0;
};

TransactionSchema.methods.isFailed = function() {
  return this.status === 'failed' || this.status === 'reverted';
};

module.exports = mongoose.model('Transaction', TransactionSchema);