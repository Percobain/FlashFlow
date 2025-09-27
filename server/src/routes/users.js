const express = require('express');
const router = express.Router();
const UserService = require('../services/UserService');

// Middleware to validate Ethereum address
const validateAddress = (req, res, next) => {
  const { address } = req.params;
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return res.status(400).json({ error: 'Invalid Ethereum address' });
  }
  next();
};

// GET user by address (creates if doesn't exist - for wallet connection)
router.get('/:address', validateAddress, async (req, res) => {
  try {
    const { address } = req.params;
    
    // This will create user if doesn't exist
    const user = await UserService.createOrGetUser(address);
    
    // Return user data (excluding sensitive fields)
    const userResponse = {
      address: user.address,
      email: user.email,
      userType: user.userType,
      kycStatus: user.kycStatus,
      profile: user.profile,
      preferences: user.preferences,
      settings: {
        notifications: user.settings.notifications,
        privacy: user.settings.privacy
      },
      stats: user.stats,
      capabilities: {
        canInvest: user.canInvest(),
        canSell: user.canSell(),
        canBuy: user.canBuy(),
        isVerified: user.isVerified()
      },
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt
    };

    res.json(userResponse);
  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// PUT update user profile
router.put('/:address', validateAddress, async (req, res) => {
  try {
    const { address } = req.params;
    const updateData = req.body;

    const user = await UserService.updateProfile(address, updateData);
    
    res.json({
      message: 'Profile updated successfully',
      user: {
        address: user.address,
        email: user.email,
        userType: user.userType,
        kycStatus: user.kycStatus,
        profile: user.profile,
        preferences: user.preferences,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// POST initiate seller flow (when trying to get funding)
router.post('/:address/seller', validateAddress, async (req, res) => {
  try {
    const { address } = req.params;
    const { assetData } = req.body;

    const result = await UserService.initiateSellerKYC(address, assetData);
    
    res.json(result);
  } catch (error) {
    console.error('Error initiating seller flow:', error);
    res.status(500).json({ error: 'Failed to initiate seller flow' });
  }
});

// POST initiate investor flow (when trying to invest)
router.post('/:address/investor', validateAddress, async (req, res) => {
  try {
    const { address } = req.params;

    const result = await UserService.initiateInvestorFlow(address);
    
    res.json(result);
  } catch (error) {
    console.error('Error initiating investor flow:', error);
    res.status(500).json({ error: 'Failed to initiate investor flow' });
  }
});

// POST complete KYC verification
router.post('/:address/kyc', validateAddress, async (req, res) => {
  try {
    const { address } = req.params;
    const kycData = req.body;

    const user = await UserService.completeKYC(address, kycData);
    
    res.json({
      message: 'KYC verification completed',
      kycStatus: user.kycStatus,
      verifiedAt: user.kycData.verifiedAt
    });
  } catch (error) {
    console.error('Error completing KYC:', error);
    res.status(500).json({ error: 'Failed to complete KYC' });
  }
});

// GET KYC status
router.get('/:address/kyc', validateAddress, async (req, res) => {
  try {
    const { address } = req.params;
    
    const user = await UserService.createOrGetUser(address);
    
    res.json({
      kycStatus: user.kycStatus,
      isVerified: user.isVerified(),
      kycRequired: !user.isVerified(),
      verifiedAt: user.kycData?.verifiedAt,
      skipVerification: user.settings?.skipVerification || false
    });
  } catch (error) {
    console.error('Error getting KYC status:', error);
    res.status(500).json({ error: 'Failed to get KYC status' });
  }
});

// GET user analytics
router.get('/:address/analytics', validateAddress, async (req, res) => {
  try {
    const { address } = req.params;
    
    const analytics = await UserService.getUserAnalytics(address);
    
    res.json(analytics);
  } catch (error) {
    console.error('Error getting user analytics:', error);
    res.status(500).json({ error: 'Failed to get user analytics' });
  }
});

// PUT update user stats (internal use)
router.put('/:address/stats', validateAddress, async (req, res) => {
  try {
    const { address } = req.params;
    const statsUpdate = req.body;

    const user = await UserService.updateUserStats(address, statsUpdate);
    
    res.json({
      message: 'Stats updated successfully',
      stats: user.stats
    });
  } catch (error) {
    console.error('Error updating user stats:', error);
    res.status(500).json({ error: 'Failed to update user stats' });
  }
});

// GET all users (admin endpoint)
router.get('/', async (req, res) => {
  try {
    const filters = req.query;
    const users = await UserService.getAllUsers(filters);
    
    res.json({
      users,
      total: users.length
    });
  } catch (error) {
    console.error('Error getting all users:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

module.exports = router;