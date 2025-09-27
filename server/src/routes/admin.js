const express = require('express');
const router = express.Router();
const Asset = require('../models/Asset');
const User = require('../models/User');
const Investment = require('../models/Investment');
const Transaction = require('../models/Transaction');
const Basket = require('../models/Basket');

// GET /api/admin/stats
router.get('/stats', async (req, res) => {
  try {
    // Basic platform statistics
    const totalUsers = await User.countDocuments();
    const totalAssets = await Asset.countDocuments();
    const totalInvestments = await Investment.countDocuments();
    const totalBaskets = await Basket.countDocuments();

    // Financial metrics
    const totalValueLocked = await Asset.aggregate([
      { $group: { _id: null, total: { $sum: '$faceAmount' } } }
    ]);

    const totalInvested = await Investment.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const totalPaidOut = await Investment.aggregate([
      { $match: { paidOut: true } },
      { $group: { _id: null, total: { $sum: '$payoutAmount' } } }
    ]);

    // User type distribution
    const userTypes = await User.aggregate([
      { $unwind: '$userType' },
      { $group: { _id: '$userType', count: { $sum: 1 } } }
    ]);

    // Asset type distribution
    const assetTypes = await Asset.aggregate([
      { $group: { _id: '$assetType', count: { $sum: 1 } } }
    ]);

    // Asset status distribution
    const assetStatuses = await Asset.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Recent activity (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentAssets = await Asset.countDocuments({ 
      createdAt: { $gte: thirtyDaysAgo } 
    });
    const recentInvestments = await Investment.countDocuments({ 
      investedAt: { $gte: thirtyDaysAgo } 
    });

    res.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalAssets,
          totalInvestments,
          totalBaskets,
          totalValueLocked: totalValueLocked[0]?.total || 0,
          totalInvested: totalInvested[0]?.total || 0,
          totalPaidOut: totalPaidOut[0]?.total || 0
        },
        distributions: {
          userTypes: userTypes.reduce((acc, curr) => {
            acc[curr._id] = curr.count;
            return acc;
          }, {}),
          assetTypes: assetTypes.reduce((acc, curr) => {
            acc[curr._id] = curr.count;
            return acc;
          }, {}),
          assetStatuses: assetStatuses.reduce((acc, curr) => {
            acc[curr._id] = curr.count;
            return acc;
          }, {})
        },
        recentActivity: {
          newAssets: recentAssets,
          newInvestments: recentInvestments
        }
      }
    });
  } catch (error) {
    console.error('Failed to fetch admin stats:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/admin/users
router.get('/users', async (req, res) => {
  try {
    const { kycStatus, userType, page = 1, limit = 50 } = req.query;

    const query = {};
    if (kycStatus) query.kycStatus = kycStatus;
    if (userType) query.userType = { $in: [userType] };

    const users = await User.find(query)
      .select('-kycData') // Exclude sensitive KYC data
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Failed to fetch users:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// PUT /api/admin/users/:address/kyc
router.put('/users/:address/kyc', async (req, res) => {
  try {
    const { address } = req.params;
    const { status, rejectionReason } = req.body;

    if (!['verified', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Status must be verified or rejected'
      });
    }

    const updateData = {
      kycStatus: status,
      [`kycData.${status}At`]: new Date()
    };

    if (status === 'rejected' && rejectionReason) {
      updateData['kycData.rejectionReason'] = rejectionReason;
    }

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
      data: {
        address: user.address,
        kycStatus: user.kycStatus,
        updatedAt: new Date()
      }
    });
  } catch (error) {
    console.error('KYC update failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/admin/transactions
router.get('/transactions', async (req, res) => {
  try {
    const { type, status, page = 1, limit = 50 } = req.query;

    const query = {};
    if (type) query.type = type;
    if (status) query.status = status;

    const transactions = await Transaction.find(query)
      .sort({ submittedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Transaction.countDocuments(query);

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Failed to fetch transactions:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;