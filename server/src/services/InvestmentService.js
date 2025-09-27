const Investment = require('../models/Investment');
const Asset = require('../models/Asset');
const Basket = require('../models/Basket');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const BlockchainService = require('./BlockchainService');
const { ethers } = require('ethers');
const crypto = require('crypto');

class InvestmentService {
  async createInvestment({
    investorAddress,
    assetId,
    amount,
    expectedROI,
    expectedAPY
  }) {
    try {
      // Validate investor
      const investor = await User.findOne({ address: investorAddress });
      if (!investor || !investor.canInvest()) {
        throw new Error('Investor not authorized to invest');
      }

      // Get asset details
      const asset = await Asset.findOne({ assetId });
      if (!asset) {
        throw new Error('Asset not found');
      }

      if (asset.status !== 'funded') {
        throw new Error('Asset not available for investment');
      }

      // Generate investment ID
      const investmentId = crypto.randomBytes(16).toString('hex');

      // Convert amount to wei
      const amountWei = ethers.utils.parseEther(amount.toString()).toString();

      // Calculate expected return
      const expectedReturn = amount * (1 + expectedROI / 100);

      // Record investment on blockchain
      let investTxHash = null;
      try {
        const tx = await BlockchainService.recordInvestment(
          assetId,
          investorAddress,
          amount
        );
        investTxHash = tx.hash;
      } catch (blockchainError) {
        console.warn('Blockchain investment recording failed:', blockchainError);
        // Continue with off-chain recording for MVP demo
      }

      // Create investment record
      const investment = new Investment({
        investmentId,
        investorAddress,
        assetId,
        basketId: asset.basketId,
        amount,
        amountWei,
        expectedReturn,
        expectedROI,
        expectedAPY,
        investTxHash,
        status: 'active',
        riskAssessment: {
          assetRiskScore: asset.riskScore,
          basketRiskScore: asset.riskScore, // Simplified for demo
          investorRiskTolerance: investor.investmentProfile?.riskTolerance || 'moderate',
          riskAdjustedReturn: expectedROI
        }
      });

      await investment.save();

      // Update user stats
      await this.updateInvestorStats(investorAddress, amount);

      // Update basket invested amount
      await Basket.updateOne(
        { basketId: asset.basketId },
        { $inc: { totalInvested: amount } }
      );

      // Create transaction record
      if (investTxHash) {
        await this.createTransactionRecord({
          type: 'investment',
          txHash: investTxHash,
          from: investorAddress,
          to: process.env.AGENT_ADDRESS,
          amount,
          assetId,
          basketId: asset.basketId,
          investmentId
        });
      }

      return investment;
    } catch (error) {
      console.error('Investment creation failed:', error);
      throw error;
    }
  }

  async getInvestmentsByUser(userAddress, options = {}) {
    const { status, assetType, page = 1, limit = 20 } = options;
    
    const query = { investorAddress: userAddress };
    if (status) query.status = status;

    let investments = await Investment.find(query)
      .sort({ investedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    // Enrich with asset data
    for (let investment of investments) {
      const asset = await Asset.findOne({ assetId: investment.assetId }).lean();
      if (asset && (!assetType || asset.assetType === assetType)) {
        investment.asset = asset;
      }
    }

    // Filter by asset type if specified
    if (assetType) {
      investments = investments.filter(inv => inv.asset?.assetType === assetType);
    }

    const total = await Investment.countDocuments(query);

    return {
      investments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async getInvestmentsByAsset(assetId) {
    const investments = await Investment.find({ assetId })
      .sort({ investedAt: -1 });

    // Calculate total invested
    const totalInvested = investments.reduce((sum, inv) => sum + inv.amount, 0);

    return {
      investments,
      totalInvested,
      investorCount: investments.length
    };
  }

  async calculateExpectedReturns(assetId, amount) {
    const asset = await Asset.findOne({ assetId });
    if (!asset) {
      throw new Error('Asset not found');
    }

    const basket = await Basket.findOne({ basketId: asset.basketId });
    const baseAPY = basket?.expectedAPY || 12;

    // Risk-adjusted returns
    const riskMultiplier = this.calculateRiskMultiplier(asset.riskScore);
    const expectedAPY = baseAPY * riskMultiplier;
    
    // Calculate time to maturity (simplified - 90 days for demo)
    const daysToMaturity = 90;
    const expectedROI = (expectedAPY / 365) * daysToMaturity;
    
    const expectedReturn = amount * (1 + expectedROI / 100);

    return {
      amount,
      expectedReturn,
      expectedROI,
      expectedAPY,
      daysToMaturity,
      riskScore: asset.riskScore,
      assetType: asset.assetType
    };
  }

  calculateRiskMultiplier(riskScore) {
    // Higher risk = higher returns
    // Risk score: 0-100 (lower is higher risk)
    const riskLevel = 100 - riskScore; // Invert to get risk level
    
    if (riskLevel >= 70) return 1.5;  // High risk = 50% bonus
    if (riskLevel >= 50) return 1.25; // Medium risk = 25% bonus
    if (riskLevel >= 30) return 1.1;  // Low-medium risk = 10% bonus
    return 1.0; // Very low risk = base rate
  }

  async updateInvestorStats(investorAddress, investmentAmount) {
    await User.updateOne(
      { address: investorAddress },
      {
        $inc: {
          'stats.totalInvested': investmentAmount,
          'stats.totalAssets': 1
        },
        $set: {
          'stats.lastActiveAt': new Date()
        }
      }
    );
  }

  async createTransactionRecord(txData) {
    const transaction = new Transaction({
      transactionId: crypto.randomBytes(16).toString('hex'),
      ...txData,
      amountWei: ethers.utils.parseEther(txData.amount.toString()).toString(),
      status: 'confirmed' // Simplified for demo
    });

    return await transaction.save();
  }

  async getPortfolioSummary(userAddress) {
    const investments = await Investment.find({ 
      investorAddress: userAddress 
    }).lean();

    const totalInvested = investments.reduce((sum, inv) => sum + inv.amount, 0);
    const totalPaidOut = investments
      .filter(inv => inv.paidOut)
      .reduce((sum, inv) => sum + inv.payoutAmount, 0);
    
    const activeInvestments = investments.filter(inv => inv.status === 'active');
    const completedInvestments = investments.filter(inv => inv.status === 'paid_out');

    // Calculate portfolio performance
    const totalReturns = totalPaidOut - completedInvestments.reduce((sum, inv) => sum + inv.amount, 0);
    const avgROI = completedInvestments.length > 0 
      ? completedInvestments.reduce((sum, inv) => sum + (inv.performance?.actualROI || 0), 0) / completedInvestments.length 
      : 0;

    return {
      totalInvested,
      totalPaidOut,
      totalReturns,
      activeInvestments: activeInvestments.length,
      completedInvestments: completedInvestments.length,
      averageROI: avgROI,
      portfolio: {
        byAssetType: this.groupByAssetType(investments),
        byRiskLevel: this.groupByRiskLevel(investments),
        performance: await this.calculatePortfolioPerformance(investments)
      }
    };
  }

  groupByAssetType(investments) {
    const groups = {};
    investments.forEach(inv => {
      const type = inv.asset?.assetType || 'unknown';
      if (!groups[type]) {
        groups[type] = { count: 0, totalAmount: 0 };
      }
      groups[type].count++;
      groups[type].totalAmount += inv.amount;
    });
    return groups;
  }

  groupByRiskLevel(investments) {
    const groups = { low: 0, medium: 0, high: 0 };
    investments.forEach(inv => {
      const riskScore = inv.riskAssessment?.assetRiskScore || 50;
      if (riskScore >= 80) groups.low++;
      else if (riskScore >= 50) groups.medium++;
      else groups.high++;
    });
    return groups;
  }

  async calculatePortfolioPerformance(investments) {
    // Simplified performance calculation
    const monthlyPerformance = [];
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 12);

    for (let i = 0; i < 12; i++) {
      const month = new Date(startDate);
      month.setMonth(month.getMonth() + i);
      
      monthlyPerformance.push({
        month: month.toISOString().slice(0, 7),
        value: Math.random() * 1000 + 5000, // Demo data
        return: (Math.random() - 0.5) * 10 // -5% to +5%
      });
    }

    return monthlyPerformance;
  }
}

module.exports = new InvestmentService();