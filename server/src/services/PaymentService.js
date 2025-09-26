const Asset = require('../models/Asset');
const Investment = require('../models/Investment');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const BlockchainService = require('./BlockchainService');
const { ethers } = require('ethers');
const crypto = require('crypto');

class PaymentService {
  async simulatePayment(assetId, paymentAmount, payerAddress = null) {
    try {
      const asset = await Asset.findOne({ assetId });
      if (!asset) {
        throw new Error('Asset not found');
      }

      if (asset.paid) {
        throw new Error('Asset already paid');
      }

      // Record payment on blockchain
      let paymentTxHash = null;
      try {
        const tx = await BlockchainService.confirmPayment(assetId, paymentAmount);
        paymentTxHash = tx.hash;
      } catch (blockchainError) {
        console.warn('Blockchain payment recording failed:', blockchainError);
        // Continue with off-chain processing for MVP demo
      }

      // Update asset payment status
      const isPaidInFull = paymentAmount >= asset.faceAmount;
      await Asset.updateOne(
        { assetId },
        {
          $inc: { paidAmount: paymentAmount },
          $set: {
            paid: isPaidInFull,
            paidAt: isPaidInFull ? new Date() : undefined
          }
        }
      );

      // Create transaction record
      if (paymentTxHash) {
        await this.createTransactionRecord({
          type: 'payment',
          txHash: paymentTxHash,
          from: payerAddress || '0x0000000000000000000000000000000000000000',
          to: process.env.AGENT_ADDRESS,
          amount: paymentAmount,
          assetId
        });
      }

      // If paid in full, trigger distribution
      if (isPaidInFull) {
        await this.distributeToInvestors(assetId, paymentAmount);
      }

      return {
        success: true,
        assetId,
        paymentAmount,
        isPaidInFull,
        txHash: paymentTxHash
      };
    } catch (error) {
      console.error('Payment simulation failed:', error);
      throw error;
    }
  }

  async distributeToInvestors(assetId, totalPayment) {
    try {
      // Get all investments for this asset
      const investments = await Investment.find({ 
        assetId, 
        status: 'active' 
      });

      if (investments.length === 0) {
        console.log(`No active investments found for asset ${assetId}`);
        return { distributed: 0, recipients: 0 };
      }

      const totalInvested = investments.reduce((sum, inv) => sum + inv.amount, 0);
      
      if (totalInvested === 0) {
        throw new Error('No investment amount found for distribution');
      }

      let totalDistributed = 0;
      const distributions = [];

      // Calculate and execute distributions
      for (const investment of investments) {
        // Calculate pro-rata share
        const investmentShare = investment.amount / totalInvested;
        const distributionAmount = totalPayment * investmentShare;

        // Update investment record
        await Investment.updateOne(
          { _id: investment._id },
          {
            $set: {
              payoutAmount: distributionAmount,
              paidOut: true,
              payoutDate: new Date(),
              status: 'paid_out',
              'performance.actualROI': ((distributionAmount - investment.amount) / investment.amount) * 100,
              'performance.holdingPeriod': Math.floor((new Date() - investment.investedAt) / (1000 * 60 * 60 * 24)),
              'performance.performanceRating': this.calculatePerformanceRating(distributionAmount, investment.amount)
            }
          }
        );

        // Update investor stats
        await this.updateInvestorStats(investment.investorAddress, distributionAmount, investment.amount);

        distributions.push({
          investorAddress: investment.investorAddress,
          investmentId: investment.investmentId,
          originalAmount: investment.amount,
          distributionAmount,
          roi: ((distributionAmount - investment.amount) / investment.amount) * 100
        });

        totalDistributed += distributionAmount;

        // Create transaction record for distribution
        await this.createTransactionRecord({
          type: 'distribution',
          txHash: `distribution_${crypto.randomBytes(16).toString('hex')}`,
          from: process.env.POOL_ADDRESS,
          to: investment.investorAddress,
          amount: distributionAmount,
          assetId,
          investmentId: investment.investmentId
        });
      }

      console.log(`Distributed ${totalDistributed} to ${investments.length} investors for asset ${assetId}`);

      return {
        success: true,
        totalDistributed,
        recipients: investments.length,
        distributions
      };
    } catch (error) {
      console.error('Distribution failed:', error);
      throw error;
    }
  }

  calculatePerformanceRating(payoutAmount, originalAmount) {
    const roi = ((payoutAmount - originalAmount) / originalAmount) * 100;
    
    if (roi >= 15) return 'excellent';
    if (roi >= 10) return 'good';
    if (roi >= 5) return 'average';
    return 'poor';
  }

  async updateInvestorStats(investorAddress, payoutAmount, originalAmount) {
    const returns = payoutAmount - originalAmount;
    
    await User.updateOne(
      { address: investorAddress },
      {
        $inc: {
          'stats.totalEarned': returns,
          'stats.successfulExits': 1
        },
        $set: {
          'stats.lastActiveAt': new Date()
        }
      }
    );

    // Update average ROI
    const user = await User.findOne({ address: investorAddress });
    if (user && user.stats.successfulExits > 0) {
      const newAvgROI = (user.stats.totalEarned / user.stats.totalInvested) * 100;
      await User.updateOne(
        { address: investorAddress },
        { $set: { 'stats.averageROI': newAvgROI } }
      );
    }
  }

  async createTransactionRecord(txData) {
    const transaction = new Transaction({
      transactionId: crypto.randomBytes(16).toString('hex'),
      ...txData,
      amountWei: ethers.utils.parseEther(txData.amount.toString()).toString(),
      status: 'confirmed',
      confirmedAt: new Date()
    });

    return await transaction.save();
  }

  async getPaymentHistory(options = {}) {
    const { assetId, page = 1, limit = 20 } = options;
    
    const query = { type: 'payment' };
    if (assetId) query.assetId = assetId;

    const payments = await Transaction.find(query)
      .sort({ confirmedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    // Enrich with asset data
    for (let payment of payments) {
      if (payment.assetId) {
        const asset = await Asset.findOne({ assetId: payment.assetId })
          .select('assetType originatorAddress faceAmount')
          .lean();
        payment.asset = asset;
      }
    }

    const total = await Transaction.countDocuments(query);

    return {
      payments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async getDistributionHistory(options = {}) {
    const { investorAddress, assetId, page = 1, limit = 20 } = options;
    
    const query = { type: 'distribution' };
    if (investorAddress) query.to = investorAddress;
    if (assetId) query.assetId = assetId;

    const distributions = await Transaction.find(query)
      .sort({ confirmedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Transaction.countDocuments(query);

    return {
      distributions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async getAssetPaymentStatus(assetId) {
    const asset = await Asset.findOne({ assetId })
      .select('faceAmount paidAmount paid paidAt')
      .lean();

    if (!asset) {
      throw new Error('Asset not found');
    }

    const paymentPercentage = (asset.paidAmount / asset.faceAmount) * 100;
    const remainingAmount = asset.faceAmount - asset.paidAmount;

    return {
      assetId,
      faceAmount: asset.faceAmount,
      paidAmount: asset.paidAmount,
      remainingAmount,
      paymentPercentage,
      isPaidInFull: asset.paid,
      paidAt: asset.paidAt
    };
  }
}

module.exports = new PaymentService();