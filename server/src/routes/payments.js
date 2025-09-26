const express = require('express');
const router = express.Router();
const PaymentService = require('../services/PaymentService');

// POST /api/payments/simulate
router.post('/simulate', async (req, res) => {
  try {
    const { assetId, paymentAmount, payerAddress } = req.body;

    if (!assetId || !paymentAmount) {
      return res.status(400).json({
        success: false,
        error: 'Asset ID and payment amount required'
      });
    }

    const result = await PaymentService.simulatePayment(
      assetId, 
      parseFloat(paymentAmount),
      payerAddress
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Payment simulation failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/payments/distribute
router.post('/distribute', async (req, res) => {
  try {
    const { assetId, totalPayment } = req.body;

    if (!assetId || !totalPayment) {
      return res.status(400).json({
        success: false,
        error: 'Asset ID and total payment required'
      });
    }

    const result = await PaymentService.distributeToInvestors(
      assetId, 
      parseFloat(totalPayment)
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Distribution failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/payments/history
router.get('/history', async (req, res) => {
  try {
    const { assetId, page, limit } = req.query;

    const result = await PaymentService.getPaymentHistory({
      assetId,
      page,
      limit
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Failed to fetch payment history:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/payments/distributions
router.get('/distributions', async (req, res) => {
  try {
    const { investorAddress, assetId, page, limit } = req.query;

    const result = await PaymentService.getDistributionHistory({
      investorAddress,
      assetId,
      page,
      limit
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Failed to fetch distribution history:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/payments/status/:assetId
router.get('/status/:assetId', async (req, res) => {
  try {
    const { assetId } = req.params;

    const status = await PaymentService.getAssetPaymentStatus(assetId);

    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Failed to fetch payment status:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;