const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  address: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true,
    match: /^0x[a-fA-F0-9]{40}$/
  },
  email: { 
    type: String, 
    sparse: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  userType: { 
    type: [String], 
    enum: ['seller', 'investor', 'buyer'],
    default: ['investor']
  },
  
  // KYC Information with Self Protocol support
  kycStatus: { 
    type: String, 
    enum: ['pending', 'verified', 'rejected', 'not_started'],
    default: 'not_started'
  },
  kycData: {
    // Self Protocol specific fields
    selfId: String,
    verificationMethod: {
      type: String,
      enum: ['self_protocol', 'demo_skip', 'manual'],
      default: 'self_protocol'
    },
    verifiedAt: Date,
    
    // KYC attributes from Self Protocol
    country: String,
    ageVerified: { type: Boolean, default: false },
    
    // Additional verification data
    txHash: String, // Blockchain transaction hash for verification
    configId: String, // Self Protocol config ID used
    
    // Traditional KYC fields (backup)
    fullName: String,
    dateOfBirth: Date,
    nationality: String,
    documentType: String,
    documentNumber: String,
    documentHash: String
  },
  
  // User Profile
  profile: {
    displayName: String,
    bio: String,
    avatarUrl: String,
    website: String,
    twitter: String,
    linkedin: String
  },
  
  // Investment Preferences
  preferences: {
    riskTolerance: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    preferredAssetTypes: {
      type: [String],
      enum: ['invoice', 'creator', 'saas', 'rental', 'luxury'],
      default: ['invoice']
    },
    minInvestment: { type: Number, default: 100 },
    maxInvestment: { type: Number, default: 10000 },
    targetAPY: { type: Number, default: 8 }
  },
  
  // Settings
  settings: {
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      sms: { type: Boolean, default: false }
    },
    privacy: {
      showProfile: { type: Boolean, default: true },
      showInvestments: { type: Boolean, default: false }
    },
    // Demo/Testing settings
    skipVerification: { type: Boolean, default: false }
  },
  
  // Statistics
  stats: {
    totalInvested: { type: Number, default: 0 },
    totalReturns: { type: Number, default: 0 },
    activeInvestments: { type: Number, default: 0 },
    successfulInvestments: { type: Number, default: 0 },
    averageROI: { type: Number, default: 0 }
  },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  lastLoginAt: Date
});

// Index for efficient queries
UserSchema.index({ address: 1 });
UserSchema.index({ kycStatus: 1 });
UserSchema.index({ userType: 1 });

// Update the updatedAt field on save
UserSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual field for display name
UserSchema.virtual('displayName').get(function() {
  return this.profile?.displayName || `${this.address.slice(0, 6)}...${this.address.slice(-4)}`;
});

// Methods for verification logic
UserSchema.methods.canInvest = function() {
  // Allow investment if KYC verified OR skip verification is enabled (demo mode)
  if (this.settings?.skipVerification) {
    return true;
  }
  
  return this.kycStatus === 'verified' && 
         this.userType.includes('investor');
};

UserSchema.methods.canSell = function() {
  // Allow selling if KYC verified OR skip verification is enabled (demo mode)
  if (this.settings?.skipVerification) {
    return true;
  }
  
  return this.kycStatus === 'verified' && 
         this.userType.includes('seller');
};

UserSchema.methods.canBuy = function() {
  // Allow buying if KYC verified OR skip verification is enabled (demo mode)
  if (this.settings?.skipVerification) {
    return true;
  }
  
  return this.kycStatus === 'verified' && 
         this.userType.includes('buyer');
};

UserSchema.methods.isVerified = function() {
  return this.kycStatus === 'verified' || this.settings?.skipVerification;
};

// Static methods
UserSchema.statics.findByAddress = function(address) {
  return this.findOne({ address: address.toLowerCase() });
};

UserSchema.statics.findVerifiedInvestors = function() {
  return this.find({ 
    $or: [
      { kycStatus: 'verified' },
      { 'settings.skipVerification': true }
    ],
    userType: 'investor' 
  });
};

module.exports = mongoose.model('User', UserSchema);
