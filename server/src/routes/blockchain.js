const express = require("express");
const { getWeb3Service } = require("../config/blockchain");
const { ethers } = require("ethers");

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