const express = require('express');
const router = express.Router();
const SelfVerificationService = require('../services/SelfVerificationService');
const User = require('../models/User');

// GET /api/self-verification/status - Service health check
router.get('/status', async (req, res) => {
    try {
        const contractInfo = SelfVerificationService.getContractInfo();

        res.json({
            success: true,
            service: 'SelfVerificationService',
            status: 'active',
            contract: contractInfo,
            demo: {
                skipKycAvailable: true,
                realVerificationAvailable: true,
                note: "Real verification requires Self Protocol mobile app"
            },
            instructions: {
                demoMode: "Use POST /api/self-verification/skip-kyc for instant verification",
                realMode: "Use POST /api/self-verification/generate-url for mobile app instructions"
            }
        });
    } catch (error) {
        console.error('Service status check failed:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// GET /api/self-verification/status/:address - Check user verification status
router.get('/status/:address', async (req, res) => {
    try {
        const { address } = req.params;

        const userStatus = await SelfVerificationService.getUserVerificationStatus(address);

        res.json({
            success: true,
            user: userStatus
        });
    } catch (error) {
        console.error('Failed to check verification status:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// POST /api/self-verification/skip-kyc - Skip KYC for demo purposes
router.post('/skip-kyc', async (req, res) => {
    try {
        const { userAddress } = req.body;

        if (!userAddress) {
            return res.status(400).json({
                success: false,
                error: 'User address required'
            });
        }

        const result = await SelfVerificationService.skipKYCVerification(userAddress);

        res.json({
            success: true,
            message: 'KYC verification skipped successfully',
            user: result.user,
            note: 'This is for demo purposes only. In production, use real Self Protocol verification.'
        });
    } catch (error) {
        console.error('Demo KYC skip failed:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// POST /api/self-verification/generate-url - Generate Self Protocol verification instructions
router.post('/generate-url', async (req, res) => {
    try {
        const { userAddress } = req.body;

        if (!userAddress) {
            return res.status(400).json({
                success: false,
                error: 'User address required'
            });
        }

        const verificationInfo = SelfVerificationService.generateVerificationUrl(userAddress);
        const demoUrl = SelfVerificationService.generateDemoVerificationUrl(userAddress);

        res.json({
            success: true,
            realVerification: verificationInfo,
            demoVerification: {
                url: demoUrl,
                note: "This is a demo verification page that simulates the Self Protocol flow"
            },
            recommendation: "For demo purposes, use the demo verification URL or skip KYC entirely"
        });
    } catch (error) {
        console.error('Failed to generate verification info:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// POST /api/self-verification/verify - Complete Self verification with real TX
router.post('/verify', async (req, res) => {
    try {
        const { userAddress, verificationData } = req.body;

        if (!userAddress || !verificationData) {
            return res.status(400).json({
                success: false,
                error: 'User address and verification data required'
            });
        }

        const result = await SelfVerificationService.processVerificationCallback(
            userAddress,
            verificationData
        );

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Self verification failed:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// GET /api/self-verification/blockchain-status/:address - Check blockchain verification
router.get('/blockchain-status/:address', async (req, res) => {
    try {
        const { address } = req.params;

        const blockchainStatus = await SelfVerificationService.verifyUserKYC(address);

        res.json({
            success: true,
            blockchain: blockchainStatus
        });
    } catch (error) {
        console.error('Failed to check blockchain verification status:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;