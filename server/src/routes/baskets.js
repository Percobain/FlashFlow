const express = require('express');
const router = express.Router();
const Basket = require('../models/Basket');
const Asset = require('../models/Asset');
const Investment = require('../models/Investment');
const BasketService = require('../services/BasketService');

// GET /api/baskets
router.get('/', async (req, res) => {
  try {
    const { 
      basketType, 
      status = 'open', 
      page = 1, 
      limit = 20 
    } = req.query;

    const query = {};
    if (basketType) query.basketType = basketType;
    if (status) query.status = status;

    const baskets = await Basket.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    // Enrich with real-time data
    for (let basket of baskets) {
      // Get actual asset count and values
      const assets = await Asset.find({ basketId: basket.basketId }).lean();
      const investments = await Investment.find({ basketId: basket.basketId }).lean();
      
      basket.actualAssetCount = assets.length;
      basket.actualTotalValue = assets.reduce((sum, asset) => sum + asset.faceAmount, 0);
      basket.actualInvested = investments.reduce((sum, inv) => sum + inv.amount, 0);
      basket.availableToInvest = basket.actualTotalValue * 0.85 - basket.actualInvested;
    }

    const total = await Basket.countDocuments(query);

    res.json({
      success: true,
      data: {
        baskets,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Failed to fetch baskets:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/baskets/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const basket = await Basket.findOne({ basketId: id }).lean();
    
    if (!basket) {
      return res.status(404).json({
        success: false,
        error: 'Basket not found'
      });
    }

    // Get basket assets
    const assets = await Asset.find({ basketId: id })
      .sort({ createdAt: -1 })
      .lean();

    // Get basket investments
    const investments = await Investment.find({ basketId: id })
      .sort({ investedAt: -1 })
      .lean();

    // Calculate real-time metrics
    const totalValue = assets.reduce((sum, asset) => sum + asset.faceAmount, 0);
    const totalInvested = investments.reduce((sum, inv) => sum + inv.amount, 0);
    const averageRiskScore = assets.length > 0 
      ? assets.reduce((sum, asset) => sum + asset.riskScore, 0) / assets.length 
      : 0;

    // Asset type distribution
    const assetTypeDistribution = {};
    assets.forEach(asset => {
      assetTypeDistribution[asset.assetType] = 
        (assetTypeDistribution[asset.assetType] || 0) + 1;
    });

    // Performance calculation (simplified)
    const performanceHistory = [];
    for (let i = 0; i < 12; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      performanceHistory.unshift({
        date: date.toISOString().slice(0, 7),
        value: totalValue * (0.95 + Math.random() * 0.1), // Mock data
        apy: basket.expectedAPY * (0.9 + Math.random() * 0.2)
      });
    }

    res.json({
      success: true,
      data: {
        ...basket,
        assets,
        investments,
        metrics: {
          totalValue,
          totalInvested,
          availableToInvest: totalValue * 0.85 - totalInvested,
          averageRiskScore,
          assetCount: assets.length,
          investorCount: new Set(investments.map(inv => inv.investorAddress)).size,
          assetTypeDistribution,
          utilizationRate: totalInvested / (totalValue * 0.85) * 100
        },
        performance: performanceHistory
      }
    });
  } catch (error) {
    console.error('Failed to fetch basket details:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/baskets/allocate
router.post('/allocate', async (req, res) => {
  try {
    const { assetId, forceBasketType } = req.body;

    if (!assetId) {
      return res.status(400).json({
        success: false,
        error: 'Asset ID required'
      });
    }

    // Get asset details
    const asset = await Asset.findOne({ assetId });
    if (!asset) {
      return res.status(404).json({
        success: false,
        error: 'Asset not found'
      });
    }

    // Assign to basket (or reassign)
    const basket = await BasketService.assignToBasket({
      riskScore: asset.riskScore,
      assetType: asset.assetType,
      amount: asset.faceAmount,
      assetId,
      forceBasketType
    });

    // Update asset with new basket
    await Asset.updateOne(
      { assetId },
      { 
        basketId: basket.basketId,
        basketType: basket.basketType
      }
    );

    res.json({
      success: true,
      data: {
        assetId,
        previousBasketId: asset.basketId,
        newBasketId: basket.basketId,
        basketType: basket.basketType,
        riskScore: asset.riskScore
      }
    });
  } catch (error) {
    console.error('Basket allocation failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/baskets/:id/performance
router.get('/:id/performance', async (req, res) => {
  try {
    const { id } = req.params;
    const { period = '12m' } = req.query;

    const basket = await Basket.findOne({ basketId: id });
    if (!basket) {
      return res.status(404).json({
        success: false,
        error: 'Basket not found'
      });
    }

    // Generate performance data based on period
    const months = period === '6m' ? 6 : period === '24m' ? 24 : 12;
    const performance = [];

    for (let i = 0; i < months; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      
      // Mock performance data - in production, this would be calculated from actual data
      const baseValue = 10000;
      const volatility = basket.basketType === 'high' ? 0.15 : 
                        basket.basketType === 'medium' ? 0.08 : 0.04;
      
      performance.unshift({
        date: date.toISOString().slice(0, 7),
        value: baseValue * (1 + (Math.random() - 0.5) * volatility),
        apy: basket.expectedAPY * (0.8 + Math.random() * 0.4),
        assets: Math.floor(Math.random() * 20) + 5,
        volume: Math.floor(Math.random() * 50000) + 10000
      });
    }

    res.json({
      success: true,
      data: {
        basketId: id,
        period,
        performance,
        summary: {
          totalReturn: performance[performance.length - 1].value - performance[0].value,
          averageAPY: performance.reduce((sum, p) => sum + p.apy, 0) / performance.length,
          volatility: this.calculateVolatility(performance),
          sharpeRatio: this.calculateSharpeRatio(performance)
        }
      }
    });
  } catch (error) {
    console.error('Failed to fetch basket performance:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;