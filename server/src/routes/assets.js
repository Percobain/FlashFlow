const express = require('express');
const router = express.Router();
const Asset = require('../models/Asset');
const AIService = require('../services/AIService');
const BasketService = require('../services/BasketService');
const BlockchainService = require('../services/BlockchainService');
const { ethers } = require('ethers');
const crypto = require('crypto');

// POST /api/assets/create
router.post('/create', async (req, res) => {
  try {
    const { 
      type, 
      originatorAddress, 
      amount, 
      documents = [], 
      specificData = {} 
    } = req.body;

    // Step 1: Generate asset ID
    const assetId = ethers.utils.id(`${originatorAddress}-${type}-${Date.now()}`);
    
    // Step 2: AI Risk Assessment
    console.log('Starting AI risk analysis...');
    const aiAnalysis = await AIService.analyzeRisk({
      type,
      amount,
      documents,
      [`${type}Data`]: specificData
    });

    // Step 3: Calculate unlockable amount (based on risk)
    const riskAdjustment = (100 - aiAnalysis.riskScore) / 100; // Higher risk = lower unlock %
    const baseUnlockPercent = 85; // Base 85%
    const adjustedPercent = Math.max(70, baseUnlockPercent - (riskAdjustment * 20));
    const unlockableAmount = Math.floor((amount * adjustedPercent) / 100);

    // Step 4: Assign to basket
    console.log('Assigning to basket...');
    const basket = await BasketService.assignToBasket({
      riskScore: aiAnalysis.riskScore,
      assetType: type,
      amount,
      assetId
    });

    // Step 5: Create document hash
    const documentHash = crypto.createHash('sha256')
      .update(JSON.stringify({ assetId, documents, specificData }))
      .digest('hex');

    // Step 6: Create on blockchain
    console.log('Creating on blockchain...');
    const tx = await BlockchainService.createAsset({
      assetId,
      originator: originatorAddress,
      faceAmount: amount,
      unlockable: unlockableAmount,
      riskScore: aiAnalysis.riskScore,
      basketId: basket.basketId,
      assetType: type,
      documentHash: `0x${documentHash}`
    });

    // Step 7: Store in MongoDB
    const asset = new Asset({
      assetId,
      assetType: type,
      originatorAddress,
      faceAmount: amount,
      unlockableAmount,
      riskScore: aiAnalysis.riskScore,
      aiAnalysis,
      basketId: basket.basketId,
      documents: documents.map(doc => ({
        type: doc.type || 'supporting',
        url: doc.url,
        hash: doc.hash || crypto.createHash('sha256').update(doc.url).digest('hex')
      })),
      status: 'pending',
      [`${type}Data`]: specificData
    });

    await asset.save();

    res.json({
      success: true,
      data: {
        assetId,
        unlockableAmount,
        riskScore: aiAnalysis.riskScore,
        basketId: basket.basketId,
        txHash: tx.hash,
        confidence: aiAnalysis.confidence,
        reasoning: aiAnalysis.reasoning
      }
    });

  } catch (error) {
    console.error('Asset creation failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/assets/:id/fund
router.post('/:id/fund', async (req, res) => {
  try {
    const { id: assetId } = req.params;
    
    // Get asset
    const asset = await Asset.findOne({ assetId });
    if (!asset) {
      return res.status(404).json({ success: false, error: 'Asset not found' });
    }

    if (asset.funded) {
      return res.status(400).json({ success: false, error: 'Asset already funded' });
    }

    // Release funds from pool to originator
    const releaseTx = await BlockchainService.releaseFunds(
      assetId, 
      asset.originatorAddress, 
      asset.unlockableAmount
    );

    // Mark as funded on-chain
    const fundedTx = await BlockchainService.markFunded(assetId, asset.unlockableAmount);

    // Update asset status
    asset.funded = true;
    asset.fundedAt = new Date();
    asset.fundedTxHash = fundedTx.hash;
    asset.status = 'funded';
    await asset.save();

    res.json({
      success: true,
      data: {
        assetId,
        amount: asset.unlockableAmount,
        txHash: fundedTx.hash,
        releaseTxHash: releaseTx.hash
      }
    });

  } catch (error) {
    console.error('Asset funding failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/assets
router.get('/', async (req, res) => {
  try {
    const { 
      type, 
      status, 
      originatorAddress, 
      basketId,
      page = 1, 
      limit = 20 
    } = req.query;

    const query = {};
    if (type) query.assetType = type;
    if (status) query.status = status;
    if (originatorAddress) query.originatorAddress = originatorAddress;
    if (basketId) query.basketId = basketId;

    const assets = await Asset.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Asset.countDocuments(query);

    res.json({
      success: true,
      data: {
        assets,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Failed to fetch assets:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/assets/:id
router.get('/:id', async (req, res) => {
  try {
    const asset = await Asset.findOne({ assetId: req.params.id });
    
    if (!asset) {
      return res.status(404).json({
        success: false,
        error: 'Asset not found'
      });
    }

    res.json({
      success: true,
      data: asset
    });

  } catch (error) {
    console.error('Failed to fetch asset:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;