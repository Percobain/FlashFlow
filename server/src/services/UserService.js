const User = require('../models/User');
const { getWeb3Service } = require('../config/blockchain');

class UserService {
  constructor() {
    this.web3Service = null;
  }

  async initialize() {
    try {
      this.web3Service = getWeb3Service();
    } catch (error) {
      console.warn('Web3Service not available, user service running in limited mode');
    }
  }

  // Create or get user when wallet connects
  async createOrGetUser(address) {
    try {
      const normalizedAddress = address.toLowerCase();
      
      // Check if user already exists
      let user = await User.findByAddress(normalizedAddress);
      
      if (!user) {
        // Create new user with default settings
        user = new User({
          address: normalizedAddress,
          userType: [], // Start with empty array, will be populated based on actions
          kycStatus: 'not_started',
          settings: {
            skipVerification: process.env.NODE_ENV === 'development', // Enable skip in dev
            notifications: {
              email: true,
              push: true,
              sms: false
            },
            privacy: {
              showProfile: true,
              showInvestments: false
            }
          },
          stats: {
            totalInvested: 0,
            totalReturns: 0,
            activeInvestments: 0,
            successfulInvestments: 0,
            averageROI: 0
          },
          preferences: {
            riskTolerance: 'medium',
            preferredAssetTypes: ['invoice'],
            minInvestment: 100,
            maxInvestment: 10000,
            targetAPY: 8
          },
          lastLoginAt: new Date()
        });

        await user.save();
        console.log(`✅ New user created: ${normalizedAddress}`);
      } else {
        // Update last login
        user.lastLoginAt = new Date();
        await user.save();
        console.log(`✅ User login: ${normalizedAddress}`);
      }

      return user;
    } catch (error) {
      console.error('Error creating/getting user:', error);
      throw error;
    }
  }

  // Add user type if not already present
  async addUserType(address, userType) {
    try {
      const user = await User.findByAddress(address.toLowerCase());
      if (!user) {
        throw new Error('User not found');
      }

      if (!user.userType.includes(userType)) {
        user.userType.push(userType);
        await user.save();
        console.log(`✅ Added user type '${userType}' to ${address}`);
      }

      return user;
    } catch (error) {
      console.error('Error adding user type:', error);
      throw error;
    }
  }

  // Update user profile
  async updateProfile(address, profileData) {
    try {
      const user = await User.findByAddress(address.toLowerCase());
      if (!user) {
        throw new Error('User not found');
      }

      // Update profile fields
      if (profileData.email) user.email = profileData.email;
      if (profileData.profile) {
        user.profile = { ...user.profile, ...profileData.profile };
      }
      if (profileData.preferences) {
        user.preferences = { ...user.preferences, ...profileData.preferences };
      }
      if (profileData.settings) {
        user.settings = { ...user.settings, ...profileData.settings };
      }

      await user.save();
      return user;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }

  // Initiate KYC process for seller (when trying to get funding)
  async initiateSellerKYC(address, assetData) {
    try {
      const user = await this.addUserType(address, 'seller');
      
      // Update KYC status to pending if not already done
      if (user.kycStatus === 'not_started') {
        user.kycStatus = 'pending';
        await user.save();
      }

      return {
        user,
        kycRequired: user.kycStatus !== 'verified' && !user.settings?.skipVerification,
        message: user.settings?.skipVerification 
          ? 'KYC verification skipped (demo mode)'
          : 'KYC verification required before funding'
      };
    } catch (error) {
      console.error('Error initiating seller KYC:', error);
      throw error;
    }
  }

  // Complete KYC verification
  async completeKYC(address, kycData) {
    try {
      const user = await User.findByAddress(address.toLowerCase());
      if (!user) {
        throw new Error('User not found');
      }

      // Update KYC data
      user.kycStatus = 'verified';
      user.kycData = {
        ...user.kycData,
        ...kycData,
        verifiedAt: new Date()
      };

      await user.save();
      console.log(`✅ KYC completed for ${address}`);
      return user;
    } catch (error) {
      console.error('Error completing KYC:', error);
      throw error;
    }
  }

  // Add investor type when user tries to invest
  async initiateInvestorFlow(address) {
    try {
      const user = await this.addUserType(address, 'investor');
      
      return {
        user,
        canInvest: user.canInvest(),
        kycRequired: !user.isVerified(),
        message: user.canInvest() 
          ? 'Ready to invest'
          : 'KYC verification required to invest'
      };
    } catch (error) {
      console.error('Error initiating investor flow:', error);
      throw error;
    }
  }

  // Update user stats after successful transaction
  async updateUserStats(address, statsUpdate) {
    try {
      const user = await User.findByAddress(address.toLowerCase());
      if (!user) {
        throw new Error('User not found');
      }

      // Update stats
      if (statsUpdate.invested) {
        user.stats.totalInvested += statsUpdate.invested;
        user.stats.activeInvestments += 1;
      }

      if (statsUpdate.returns) {
        user.stats.totalReturns += statsUpdate.returns;
        user.stats.successfulInvestments += 1;
      }

      // Recalculate average ROI
      if (user.stats.totalInvested > 0) {
        user.stats.averageROI = (user.stats.totalReturns / user.stats.totalInvested) * 100;
      }

      await user.save();
      return user;
    } catch (error) {
      console.error('Error updating user stats:', error);
      throw error;
    }
  }

  // Get user analytics
  async getUserAnalytics(address) {
    try {
      const user = await User.findByAddress(address.toLowerCase());
      if (!user) {
        throw new Error('User not found');
      }

      // Calculate additional metrics
      const totalROI = user.stats.totalInvested > 0 
        ? ((user.stats.totalReturns / user.stats.totalInvested) * 100).toFixed(2)
        : 0;

      const successRate = user.stats.activeInvestments > 0
        ? ((user.stats.successfulInvestments / user.stats.activeInvestments) * 100).toFixed(2)
        : 0;

      return {
        profile: {
          address: user.address,
          userType: user.userType,
          kycStatus: user.kycStatus,
          isVerified: user.isVerified(),
          memberSince: user.createdAt,
          lastLogin: user.lastLoginAt
        },
        stats: {
          ...user.stats,
          totalROI: parseFloat(totalROI),
          successRate: parseFloat(successRate)
        },
        capabilities: {
          canInvest: user.canInvest(),
          canSell: user.canSell(),
          canBuy: user.canBuy()
        }
      };
    } catch (error) {
      console.error('Error getting user analytics:', error);
      throw error;
    }
  }

  // Get all users (admin function)
  async getAllUsers(filters = {}) {
    try {
      const query = {};
      
      if (filters.userType) {
        query.userType = filters.userType;
      }
      
      if (filters.kycStatus) {
        query.kycStatus = filters.kycStatus;
      }

      const users = await User.find(query)
        .select('-kycData.documentNumber -kycData.documentHash') // Hide sensitive data
        .sort({ createdAt: -1 });

      return users;
    } catch (error) {
      console.error('Error getting all users:', error);
      throw error;
    }
  }
}

module.exports = new UserService();
