const express = require('express');
const router = express.Router();
const InvestmentService = require('../services/InvestmentService');
const Asset = require('../models/Asset');
const User = require('../models/User');

// POST /api/investments/create
router.post('/create', async (req, res) => {
  try {
    const {
      investorAddress,
      assetId,
      amount
    } = req.body;

    // Validate required fields
    if (!investorAddress || !assetId || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: investorAddress, assetId, amount'
      });
    }

    // Calculate expected returns
    const returns = await InvestmentService.calculateExpectedReturns(assetId, amount);

    // Create investment
    const investment = await InvestmentService.createInvestment({
      investorAddress,
      assetId,
      amount,
      expectedROI: returns.expectedROI,
      expectedAPY: returns.expectedAPY
    });

    res.json({
      success: true,
      data: {
        investmentId: investment.investmentId,
        amount: investment.amount,
        expectedReturn: investment.expectedReturn,
        expectedROI: investment.expectedROI,
        txHash: investment.investTxHash,
        ...returns
      }
    });
  } catch (error) {
    console.error('Investment creation failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/investments/user/:address
router.get('/user/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const { status, assetType, page, limit } = req.query;

    const result = await InvestmentService.getInvestmentsByUser(address, {
      status,
      assetType,
      page,
      limit
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Failed to fetch user investments:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/investments/asset/:assetId
router.get('/asset/:assetId', async (req, res) => {
  try {
    const { assetId } = req.params;

    const result = await InvestmentService.getInvestmentsByAsset(assetId);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Failed to fetch asset investments:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/investments/returns/:assetId
router.get('/returns/:assetId', async (req, res) => {
  try {
    const { assetId } = req.params;
    const { amount } = req.query;

    if (!amount) {
      return res.status(400).json({
        success: false,
        error: 'Amount parameter required'
      });
    }

    const returns = await InvestmentService.calculateExpectedReturns(
      assetId, 
      parseFloat(amount)
    );

    res.json({
      success: true,
      data: returns
    });
  } catch (error) {
    console.error('Failed to calculate returns:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/investments/portfolio/:address
router.get('/portfolio/:address', async (req, res) => {
  try {
    const { address } = req.params;

    const portfolio = await InvestmentService.getPortfolioSummary(address);

    res.json({
      success: true,
      data: portfolio
    });
  } catch (error) {
    console.error('Failed to fetch portfolio:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;