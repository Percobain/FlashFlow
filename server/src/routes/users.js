const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Investment = require('../models/Investment');
const Asset = require('../models/Asset');

// POST /api/users/register
router.post('/register', async (req, res) => {
  try {
    const { address, email, userType = ['investor'] } = req.body;

    if (!address) {
      return res.status(400).json({
        success: false,
        error: 'Wallet address required'
      });
    }

    // Check if user already exists
    let user = await User.findOne({ address: address.toLowerCase() });
    
    if (user) {
      // Update existing user
      if (email) user.email = email;
      if (userType) user.userType = userType;
      await user.save();
    } else {
      // Create new user
      user = new User({
        address: address.toLowerCase(),
        email,
        userType
      });
      await user.save();
    }

    res.json({
      success: true,
      data: {
        address: user.address,
        userType: user.userType,
        kycStatus: user.kycStatus,
        isNew: !user
      }
    });
  } catch (error) {
    console.error('User registration failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/users/:address
router.get('/:address', async (req, res) => {
  try {
    const { address } = req.params;

    const user = await User.findOne({ address: address.toLowerCase() })
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Get user's investment summary
    const investments = await Investment.find({ 
      investorAddress: address.toLowerCase() 
    }).lean();

    const assets = await Asset.find({ 
      originatorAddress: address.toLowerCase() 
    }).lean();

    const summary = {
      totalInvestments: investments.length,
      totalInvested: investments.reduce((sum, inv) => sum + inv.amount, 0),
      totalReturns: investments
        .filter(inv => inv.paidOut)
        .reduce((sum, inv) => sum + (inv.payoutAmount - inv.amount), 0),
      totalAssets: assets.length,
      totalAssetValue: assets.reduce((sum, asset) => sum + asset.faceAmount, 0)
    };

    res.json({
      success: true,
      data: {
        ...user,
        summary
      }
    });
  } catch (error) {
    console.error('Failed to fetch user:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// PUT /api/users/:address/profile
router.put('/:address/profile', async (req, res) => {
  try {
    const { address } = req.params;
    const { profile, investmentProfile, settings } = req.body;

    const updateData = {};
    if (profile) updateData.profile = profile;
    if (investmentProfile) updateData.investmentProfile = investmentProfile;
    if (settings) updateData.settings = settings;

    const user = await User.findOneAndUpdate(
      { address: address.toLowerCase() },
      { $set: updateData },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Profile update failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/users/:address/kyc
router.post('/:address/kyc', async (req, res) => {
  try {
    const { address } = req.params;
    const { kycData } = req.body;

    const user = await User.findOneAndUpdate(
      { address: address.toLowerCase() },
      {
        $set: {
          kycData: {
            ...kycData,
            submittedAt: new Date()
          },
          kycStatus: 'pending'
        }
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        kycStatus: user.kycStatus,
        submittedAt: user.kycData.submittedAt
      }
    });
  } catch (error) {
    console.error('KYC submission failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;