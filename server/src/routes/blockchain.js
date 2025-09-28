const express = require("express");
const { getWeb3Service } = require("../config/blockchain");
const { ethers } = require("ethers");
const BlockchainService = require('../services/BlockchainService');

const router = express.Router();

// Middleware to ensure Web3 service is available
const requireWeb3 = (req, res, next) => {
    try {
        req.web3 = getWeb3Service();
        next();
    } catch (error) {
        res.status(503).json({
            success: false,
            error: "Blockchain service unavailable",
            details: error.message
        });
    }
};

// Get transaction data for creating an asset
router.post('/transaction-data/create-asset', async (req, res) => {
    try {
        const { assetData } = req.body;
        
        // Generate assetId and basketId if not provided
        if (!assetData.assetId) {
            assetData.assetId = ethers.utils.keccak256(
                ethers.utils.defaultAbiCoder.encode(
                    ["address", "uint256"],
                    [assetData.originator, Date.now()]
                )
            );
        }
        
        if (!assetData.basketId) {
            assetData.basketId = ethers.utils.keccak256(
                ethers.utils.defaultAbiCoder.encode(
                    ["string", "uint256"],
                    [assetData.assetType, Date.now()]
                )
            );
        }

        // Ensure documentHash is provided
        if (!assetData.documentHash) {
            assetData.documentHash = ethers.utils.keccak256(
                ethers.utils.toUtf8Bytes(JSON.stringify(assetData))
            );
        }

        const txData = BlockchainService.getCreateAssetTransactionData(assetData);
        
        res.json({
            success: true,
            transactionData: txData,
            assetId: assetData.assetId,
            basketId: assetData.basketId,
            documentHash: assetData.documentHash
        });
    } catch (error) {
        console.error('Failed to get create asset transaction data:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get transaction data for recording investment
router.post('/transaction-data/record-investment', async (req, res) => {
    try {
        const { assetId, investor, amount } = req.body;
        
        const txData = BlockchainService.getRecordInvestmentTransactionData(assetId, investor, amount);
        
        res.json({
            success: true,
            transactionData: txData
        });
    } catch (error) {
        console.error('Failed to get record investment transaction data:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get transaction data for releasing funds
router.post('/transaction-data/release-funds', async (req, res) => {
    try {
        const { assetId, originator, amount } = req.body;
        
        const txData = BlockchainService.getReleaseFundsTransactionData(assetId, originator, amount);
        
        res.json({
            success: true,
            transactionData: txData
        });
    } catch (error) {
        console.error('Failed to get release funds transaction data:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get transaction data for marking asset as funded
router.post('/transaction-data/mark-funded', async (req, res) => {
    try {
        const { assetId, unlockAmount } = req.body;
        
        const txData = BlockchainService.getMarkFundedTransactionData(assetId, unlockAmount);
        
        res.json({
            success: true,
            transactionData: txData
        });
    } catch (error) {
        console.error('Failed to get mark funded transaction data:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get transaction data for confirming payment
router.post('/transaction-data/confirm-payment', async (req, res) => {
    try {
        const { assetId, amount } = req.body;
        
        const txData = BlockchainService.getConfirmPaymentTransactionData(assetId, amount);
        
        res.json({
            success: true,
            transactionData: txData
        });
    } catch (error) {
        console.error('Failed to get confirm payment transaction data:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get transaction data for token approval
router.post('/transaction-data/approve-token', async (req, res) => {
    try {
        const { spender, amount } = req.body;
        
        const txData = BlockchainService.getApproveTokenTransactionData(spender, amount);
        
        res.json({
            success: true,
            transactionData: txData
        });
    } catch (error) {
        console.error('Failed to get approve token transaction data:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get transaction data for pool deposit
router.post('/transaction-data/deposit-pool', async (req, res) => {
    try {
        const { amount } = req.body;
        
        const txData = BlockchainService.getDepositToPoolTransactionData(amount);
        
        res.json({
            success: true,
            transactionData: txData
        });
    } catch (error) {
        console.error('Failed to get deposit pool transaction data:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Sync transaction result (called after user completes transaction)
router.post('/sync-transaction', async (req, res) => {
    try {
        const { txHash, type, metadata } = req.body;
        
        // Get transaction receipt to verify it was mined
        const receipt = await BlockchainService.getTransactionReceipt(txHash);
        
        if (!receipt) {
            return res.status(400).json({
                success: false,
                error: 'Transaction not found or not mined yet'
            });
        }

        // Events will be automatically processed by the event listeners
        // Just confirm the transaction was successful
        res.json({
            success: true,
            message: 'Transaction synced successfully',
            receipt: {
                transactionHash: receipt.transactionHash,
                blockNumber: receipt.blockNumber,
                status: receipt.status,
                gasUsed: receipt.gasUsed.toString()
            }
        });
    } catch (error) {
        console.error('Failed to sync transaction:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get blockchain network info
router.get("/network", requireWeb3, async (req, res) => {
    try {
        const network = await req.web3.provider.getNetwork();
        const blockNumber = await req.web3.provider.getBlockNumber();
        
        res.json({
            success: true,
            data: {
                name: network.name,
                chainId: Number(network.chainId),
                blockNumber,
                contracts: {
                    FlashFlowAgent: req.web3.contracts.FlashFlowAgent?.target || null,
                    MainPool: req.web3.contracts.MainPool?.target || null,
                    FlashFlowToken: req.web3.contracts.FlashFlowToken?.target || null,
                    SelfVerifier: req.web3.contracts.SelfVerifier?.target || null
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: "Failed to get network info",
            details: error.message
        });
    }
});

// Create new asset on blockchain
router.post("/assets", requireWeb3, async (req, res) => {
    try {
        const { originator, faceAmount, riskScore, assetType, documentHash } = req.body;
        
        // Validate required fields
        if (!originator || !faceAmount || !assetType) {
            return res.status(400).json({
                success: false,
                error: "Missing required fields: originator, faceAmount, assetType"
            });
        }

        // Generate asset and basket IDs
        const timestamp = Math.floor(Date.now() / 1000);
        const assetId = req.web3.generateAssetId(originator, timestamp);
        const basketId = req.web3.generateBasketId(assetType, timestamp);

        // Calculate unlockable amount (85% of face amount)
        const faceAmountWei = ethers.parseEther(faceAmount.toString());
        const unlockableWei = (faceAmountWei * 85n) / 100n;

        const assetData = {
            assetId,
            originator,
            faceAmount: faceAmountWei,
            unlockable: unlockableWei,
            riskScore: riskScore || 50,
            basketId,
            assetType,
            documentHash: documentHash || ethers.ZeroHash
        };

        // Create asset on blockchain
        const receipt = await req.web3.createAsset(assetData);

        res.json({
            success: true,
            data: {
                assetId,
                basketId,
                transactionHash: receipt.hash,
                blockNumber: receipt.blockNumber,
                gasUsed: receipt.gasUsed.toString()
            }
        });
    } catch (error) {
        console.error("Create asset error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to create asset",
            details: error.message
        });
    }
});

// Get asset information
router.get("/assets/:assetId", requireWeb3, async (req, res) => {
    try {
        const { assetId } = req.params;
        
        const assetInfo = await req.web3.getAssetInfo(assetId);
        
        res.json({
            success: true,
            data: {
                originator: assetInfo[0],
                faceAmount: ethers.formatEther(assetInfo[1]),
                unlockable: ethers.formatEther(assetInfo[2]),
                riskScore: assetInfo[3],
                basketId: assetInfo[4],
                funded: assetInfo[5],
                paid: assetInfo[6],
                paidAmount: ethers.formatEther(assetInfo[7]),
                assetType: assetInfo[8]
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: "Failed to get asset info",
            details: error.message
        });
    }
});

// Release funds for an asset
router.post("/assets/:assetId/release", requireWeb3, async (req, res) => {
    try {
        const { assetId } = req.params;
        const { amount } = req.body;
        
        if (!amount) {
            return res.status(400).json({
                success: false,
                error: "Amount is required"
            });
        }

        // Get asset info to find originator
        const assetInfo = await req.web3.getAssetInfo(assetId);
        const originator = assetInfo[0];
        
        if (originator === ethers.ZeroAddress) {
            return res.status(404).json({
                success: false,
                error: "Asset not found"
            });
        }

        const amountWei = ethers.parseEther(amount.toString());
        const receipt = await req.web3.releaseFunds(assetId, originator, amountWei);

        res.json({
            success: true,
            data: {
                transactionHash: receipt.hash,
                blockNumber: receipt.blockNumber,
                gasUsed: receipt.gasUsed.toString()
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: "Failed to release funds",
            details: error.message
        });
    }
});

// Get pool statistics
router.get("/pool/stats", requireWeb3, async (req, res) => {
    try {
        const stats = await req.web3.getPoolStats();
        
        res.json({
            success: true,
            data: {
                balance: ethers.formatEther(stats[0]),
                totalReleased: ethers.formatEther(stats[1]),
                totalDeposited: ethers.formatEther(stats[2])
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: "Failed to get pool stats",
            details: error.message
        });
    }
});

// Get wallet balance
router.get("/wallet/balance/:address", requireWeb3, async (req, res) => {
    try {
        const { address } = req.params;
        
        if (!ethers.isAddress(address)) {
            return res.status(400).json({
                success: false,
                error: "Invalid address format"
            });
        }

        const balance = await req.web3.provider.getBalance(address);
        
        res.json({
            success: true,
            data: {
                address,
                balance: ethers.formatEther(balance),
                balanceWei: balance.toString()
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: "Failed to get wallet balance",
            details: error.message
        });
    }
});

module.exports = router;