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
  
  // KYC Information
  kycStatus: { 
    type: String, 
    enum: ['pending', 'verified', 'rejected', 'not_started'],
    default: 'not_started'
  },
  kycData: {
    fullName: String,
    dateOfBirth: Date,
    country: String,
    documentType: { type: String, enum: ['passport', 'drivers_license', 'national_id'] },
    documentNumber: String,
    documentExpiry: Date,
    verificationLevel: { type: String, enum: ['basic', 'enhanced', 'premium'], default: 'basic' },
    submittedAt: Date,
    verifiedAt: Date,
    rejectedAt: Date,
    rejectionReason: String
  },
  
  // Profile Information
  profile: {
    displayName: String,
    bio: String,
    avatar: String,
    company: String,
    website: String,
    location: String,
    timezone: String
  },
  
  // Investment Preferences
  investmentProfile: {
    riskTolerance: { type: String, enum: ['conservative', 'moderate', 'aggressive'], default: 'moderate' },
    preferredAssetTypes: [{ type: String, enum: ['invoice', 'saas', 'creator', 'rental', 'luxury'] }],
    minimumInvestment: { type: Number, default: 100 },
    maximumInvestment: { type: Number, default: 10000 },
    autoInvest: { type: Boolean, default: false },
    notifications: {
      email: { type: Boolean, default: true },
      browser: { type: Boolean, default: true },
      sms: { type: Boolean, default: false }
    }
  },
  
  // Statistics
  stats: {
    totalInvested: { type: Number, default: 0 },
    totalEarned: { type: Number, default: 0 },
    totalAssets: { type: Number, default: 0 },
    successfulExits: { type: Number, default: 0 },
    averageROI: { type: Number, default: 0 },
    lastActiveAt: { type: Date, default: Date.now }
  },
  
  // Settings
  settings: {
    currency: { type: String, default: 'USD' },
    language: { type: String, default: 'en' },
    twoFactorEnabled: { type: Boolean, default: false },
    emailNotifications: { type: Boolean, default: true },
    marketingEmails: { type: Boolean, default: false }
  },
  
  // Security
  lastLoginAt: Date,
  loginCount: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  isSuspended: { type: Boolean, default: false },
  
  // Testing flags
  skipVerification: { type: Boolean, default: false } // For testing purposes
}, {
  timestamps: true
});

// Indexes for performance
UserSchema.index({ address: 1 });
UserSchema.index({ email: 1 });
UserSchema.index({ kycStatus: 1 });
UserSchema.index({ 'userType': 1 });

// Methods
UserSchema.methods.updateLastActive = function() {
  this.stats.lastActiveAt = new Date();
  this.lastLoginAt = new Date();
  this.loginCount += 1;
  return this.save();
};

UserSchema.methods.canInvest = function() {
  // Allow testing without verification if skipVerification is true
  if (this.skipVerification) {
    return this.isActive && 
           !this.isSuspended &&
           this.userType.includes('investor');
  }
  
  return this.kycStatus === 'verified' && 
         this.isActive && 
         !this.isSuspended &&
         this.userType.includes('investor');
};

UserSchema.methods.canSell = function() {
  // Allow testing without verification if skipVerification is true
  if (this.skipVerification) {
    return this.isActive && 
           !this.isSuspended &&
           this.userType.includes('seller');
  }
  
  return this.kycStatus === 'verified' && 
         this.isActive && 
         !this.isSuspended &&
         this.userType.includes('seller');
};

module.exports = mongoose.model('User', UserSchema);
