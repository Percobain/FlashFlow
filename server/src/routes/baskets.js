const express = require("express");
const router = express.Router();
const Basket = require("../models/Basket");
const Asset = require("../models/Asset");
const Investment = require("../models/Investment");
const BasketService = require("../services/BasketService");

// GET /api/baskets
router.get("/", async (req, res) => {
    try {
        const { basketType, status = "open", page = 1, limit = 20 } = req.query;

        const query = {};
        if (basketType) query.basketType = basketType;

        // Handle status mapping - treat 'active' filter as 'open' in database
        if (status) {
            if (status === "active") {
                query.status = "open"; // Map frontend 'active' to backend 'open'
            } else {
                query.status = status;
            }
        }

        const baskets = await Basket.find(query)
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .lean();

        // Enrich with real-time data
        for (let basket of baskets) {
            // Get actual asset count and values
            const assets = await Asset.find({
                basketId: basket.basketId,
            }).lean();
            const investments = await Investment.find({
                basketId: basket.basketId,
            }).lean();

            basket.actualAssetCount = assets.length;
            basket.actualTotalValue = assets.reduce(
                (sum, asset) => sum + asset.faceAmount,
                0
            );
            basket.actualInvested = investments.reduce(
                (sum, inv) => sum + inv.amount,
                0
            );
            basket.availableToInvest =
                basket.actualTotalValue * 0.85 - basket.actualInvested;
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
                    pages: Math.ceil(total / limit),
                },
            },
        });
    } catch (error) {
        console.error("Failed to fetch baskets:", error);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

// GET /api/baskets/:id
router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const basket = await Basket.findOne({ basketId: id }).lean();

        if (!basket) {
            return res.status(404).json({
                success: false,
                error: "Basket not found",
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
        const totalValue = assets.reduce(
            (sum, asset) => sum + asset.faceAmount,
            0
        );
        const totalInvested = investments.reduce(
            (sum, inv) => sum + inv.amount,
            0
        );
        const averageRiskScore =
            assets.length > 0
                ? assets.reduce((sum, asset) => sum + asset.riskScore, 0) /
                  assets.length
                : 0;

        // Asset type distribution
        const assetTypeDistribution = {};
        assets.forEach((asset) => {
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
                apy: basket.expectedAPY * (0.9 + Math.random() * 0.2),
            });
        }

        // Risk score distribution for this basket
        const riskScoreDistribution = {
            "90-100": assets.filter((a) => a.riskScore >= 90).length,
            "80-89": assets.filter((a) => a.riskScore >= 80 && a.riskScore < 90)
                .length,
            "66-79": assets.filter((a) => a.riskScore >= 66 && a.riskScore < 80)
                .length,
            "50-65": assets.filter((a) => a.riskScore >= 50 && a.riskScore < 66)
                .length,
            "Below 50": assets.filter((a) => a.riskScore < 50).length,
        };

        // Get basket capacity info
        const riskRange = BasketService.getRiskRange(basket.basketType);
        const capacityInfo = {
            current: assets.length,
            maximum: riskRange.maxCapacity,
            utilizationRate: (
                (assets.length / riskRange.maxCapacity) *
                100
            ).toFixed(1),
            isFull: assets.length >= riskRange.maxCapacity,
            riskRange: `${riskRange.min}-${riskRange.max}`,
            riskTier: BasketService.getRiskTierName(basket.basketType),
        };

        res.json({
            success: true,
            data: {
                ...basket,
                assets,
                investments,
                capacityInfo,
                metrics: {
                    totalValue,
                    totalInvested,
                    availableToInvest: totalValue * 0.85 - totalInvested,
                    averageRiskScore: Math.round(averageRiskScore),
                    assetCount: assets.length,
                    investorCount: new Set(
                        investments.map((inv) => inv.investorAddress)
                    ).size,
                    assetTypeDistribution,
                    riskScoreDistribution,
                    utilizationRate:
                        (totalInvested / (totalValue * 0.85)) * 100,
                },
                performance: performanceHistory,
            },
        });
    } catch (error) {
        console.error("Failed to fetch basket details:", error);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

// POST /api/baskets/allocate
router.post("/allocate", async (req, res) => {
    try {
        const { assetId, forceBasketType } = req.body;

        if (!assetId) {
            return res.status(400).json({
                success: false,
                error: "Asset ID required",
            });
        }

        // Get asset details
        const asset = await Asset.findOne({ assetId });
        if (!asset) {
            return res.status(404).json({
                success: false,
                error: "Asset not found",
            });
        }

        // Assign to basket (or reassign)
        const basket = await BasketService.assignToBasket({
            riskScore: asset.riskScore,
            assetType: asset.assetType,
            amount: asset.faceAmount,
            assetId,
            forceBasketType,
        });

        // Update asset with new basket
        await Asset.updateOne(
            { assetId },
            {
                basketId: basket.basketId,
                basketType: basket.basketType,
            }
        );

        res.json({
            success: true,
            data: {
                assetId,
                previousBasketId: asset.basketId,
                newBasketId: basket.basketId,
                basketType: basket.basketType,
                riskScore: asset.riskScore,
                riskTier: BasketService.getRiskTierName(basket.basketType),
            },
        });
    } catch (error) {
        console.error("Basket allocation failed:", error);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

// POST /api/baskets/basketize-invoice
router.post("/basketize-invoice", async (req, res) => {
    try {
        const { assetId, riskScore, amount, assetType = "invoice" } = req.body;

        if (!assetId || !riskScore || !amount) {
            return res.status(400).json({
                success: false,
                error: "Asset ID, risk score, and amount are required",
            });
        }

        // Basketize the invoice
        const result = await BasketService.basketizeInvoice(
            assetId,
            riskScore,
            amount,
            assetType
        );

        res.json({
            success: true,
            data: result,
        });
    } catch (error) {
        console.error("Invoice basketization failed:", error);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

// GET /api/baskets/statistics
router.get("/statistics", async (req, res) => {
    try {
        const stats = await BasketService.getBasketStatistics();

        res.json({
            success: true,
            data: {
                statistics: stats,
                summary: {
                    totalBaskets: Object.values(stats).reduce(
                        (sum, stat) => sum + stat.basketCount,
                        0
                    ),
                    totalValue: Object.values(stats).reduce(
                        (sum, stat) => sum + stat.totalValue,
                        0
                    ),
                    totalAssets: Object.values(stats).reduce(
                        (sum, stat) => sum + stat.totalAssets,
                        0
                    ),
                    averageAPY:
                        Object.values(stats).reduce(
                            (sum, stat) => sum + stat.averageAPY,
                            0
                        ) / Object.keys(stats).length || 0,
                },
            },
        });
    } catch (error) {
        console.error("Failed to get basket statistics:", error);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

// GET /api/baskets/risk-tiers
router.get("/risk-tiers", async (req, res) => {
    try {
        const allBaskets = await BasketService.getAllBaskets();

        // Group by risk tier
        const riskTiers = {
            ultra_low: [],
            low: [],
            medium: [],
            high: [],
            ultra_high: [],
        };

        allBaskets.forEach((basket) => {
            if (riskTiers[basket.basketType]) {
                riskTiers[basket.basketType].push(basket);
            }
        });

        res.json({
            success: true,
            data: {
                riskTiers,
                tierInfo: {
                    ultra_low: {
                        range: "90-100",
                        description: "Ultra Low Risk",
                        expectedAPY: "4.5%",
                    },
                    low: {
                        range: "80-89",
                        description: "Low Risk",
                        expectedAPY: "5.8%",
                    },
                    medium: {
                        range: "66-79",
                        description: "Medium Risk",
                        expectedAPY: "7.2%",
                    },
                    high: {
                        range: "50-65",
                        description: "High Risk",
                        expectedAPY: "8.5%",
                    },
                    ultra_high: {
                        range: "0-49",
                        description: "Ultra High Risk",
                        expectedAPY: "8.9%",
                    },
                },
            },
        });
    } catch (error) {
        console.error("Failed to get risk tiers:", error);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

// GET /api/baskets/:id/performance
router.get("/:id/performance", async (req, res) => {
    try {
        const { id } = req.params;
        const { period = "12m" } = req.query;

        const basket = await Basket.findOne({ basketId: id });
        if (!basket) {
            return res.status(404).json({
                success: false,
                error: "Basket not found",
            });
        }

        // Generate performance data based on period
        const months = period === "6m" ? 6 : period === "24m" ? 24 : 12;
        const performance = [];

        for (let i = 0; i < months; i++) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);

            // Mock performance data - in production, this would be calculated from actual data
            const baseValue = 10000;
            const volatility =
                basket.basketType === "high"
                    ? 0.15
                    : basket.basketType === "medium"
                    ? 0.08
                    : 0.04;

            performance.unshift({
                date: date.toISOString().slice(0, 7),
                value: baseValue * (1 + (Math.random() - 0.5) * volatility),
                apy: basket.expectedAPY * (0.8 + Math.random() * 0.4),
                assets: Math.floor(Math.random() * 20) + 5,
                volume: Math.floor(Math.random() * 50000) + 10000,
            });
        }

        res.json({
            success: true,
            data: {
                basketId: id,
                period,
                performance,
                summary: {
                    totalReturn:
                        performance[performance.length - 1].value -
                        performance[0].value,
                    averageAPY:
                        performance.reduce((sum, p) => sum + p.apy, 0) /
                        performance.length,
                    volatility: this.calculateVolatility(performance),
                    sharpeRatio: this.calculateSharpeRatio(performance),
                },
            },
        });
    } catch (error) {
        console.error("Failed to fetch basket performance:", error);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

// POST /api/baskets/analyze-and-basketize-invoice
router.post("/analyze-and-basketize-invoice", async (req, res) => {
    try {
        const { invoiceData, userAddress, assetId } = req.body;

        if (!invoiceData || !assetId) {
            return res.status(400).json({
                success: false,
                error: "Invoice data and asset ID are required",
            });
        }

        console.log(
            `🔄 Processing invoice ${assetId} for analysis and basketization`
        );

        // Step 1: Analyze the invoice using AI-enhanced analysis
        const AssetAnalysisService = require("../services/AssetAnalysisService");
        const analysisResult = await AssetAnalysisService.analyzeAssetData({
            type: "invoice",
            data: invoiceData,
            userAddress: userAddress || "system",
            assetId,
            autoBasketize: false, // We'll handle basketization manually for better control
        });

        // Step 2: Determine appropriate basket based on risk score
        const riskScore = analysisResult.score;
        const estimatedValue = analysisResult.estimatedValue;

        // Step 3: Find or create appropriate basket
        const basket = await BasketService.findOrCreateBasketForRisk(
            riskScore,
            estimatedValue,
            "invoice"
        );

        // Step 4: Add invoice to basket
        await BasketService.addAssetToBasket(
            basket,
            assetId,
            estimatedValue,
            riskScore
        );

        // Step 5: Update asset record with basket information (if Asset model exists)
        try {
            await Asset.updateOne(
                { assetId },
                {
                    basketId: basket.basketId,
                    basketType: basket.basketType,
                    riskScore,
                    analysisResult: analysisResult,
                    basketizedAt: new Date(),
                },
                { upsert: true }
            );
        } catch (assetError) {
            console.warn(
                "Asset record update failed (model may not exist):",
                assetError.message
            );
        }

        // Step 6: Return comprehensive result
        res.json({
            success: true,
            data: {
                analysis: analysisResult,
                basketization: {
                    basketId: basket.basketId,
                    basketType: basket.basketType,
                    basketName: basket.name,
                    riskTier: BasketService.getRiskTierName(basket.basketType),
                    expectedAPY: basket.expectedAPY,
                    riskRange: BasketService.getRiskRange(basket.basketType),
                    capacityUsed: basket.assetCount,
                    maxCapacity: BasketService.getRiskRange(basket.basketType)
                        .maxCapacity,
                },
                invoice: {
                    assetId,
                    riskScore,
                    estimatedValue,
                    recommendedAdvance: analysisResult.recommendedAdvance,
                    projectedROI: analysisResult.projectedROI,
                },
            },
        });
    } catch (error) {
        console.error("Invoice analysis and basketization failed:", error);
        res.status(500).json({
            success: false,
            error: error.message,
            details:
                process.env.NODE_ENV === "development"
                    ? error.stack
                    : undefined,
        });
    }
});

// GET /api/baskets/risk-buckets-overview
router.get("/risk-buckets-overview", async (req, res) => {
    try {
        // Get all baskets grouped by risk tier
        const baskets = await Basket.find({}).lean();

        const riskBuckets = {
            ultra_low: {
                range: "90-100",
                baskets: [],
                totalAssets: 0,
                totalValue: 0,
                avgAPY: 4.5,
            },
            low: {
                range: "80-89",
                baskets: [],
                totalAssets: 0,
                totalValue: 0,
                avgAPY: 5.8,
            },
            medium: {
                range: "66-79",
                baskets: [],
                totalAssets: 0,
                totalValue: 0,
                avgAPY: 7.2,
            },
            high: {
                range: "50-65",
                baskets: [],
                totalAssets: 0,
                totalValue: 0,
                avgAPY: 8.5,
            },
        };

        // Group baskets by type and calculate totals
        baskets.forEach((basket) => {
            if (riskBuckets[basket.basketType]) {
                riskBuckets[basket.basketType].baskets.push({
                    basketId: basket.basketId,
                    name: basket.name,
                    assetCount: basket.assetCount,
                    totalValue: basket.totalValue,
                    expectedAPY: basket.expectedAPY,
                    status: basket.status,
                    isFull: basket.isFull,
                    utilizationRate: (
                        (basket.assetCount /
                            BasketService.getRiskRange(basket.basketType)
                                .maxCapacity) *
                        100
                    ).toFixed(1),
                });

                riskBuckets[basket.basketType].totalAssets += basket.assetCount;
                riskBuckets[basket.basketType].totalValue += basket.totalValue;
            }
        });

        // Calculate summary statistics
        const summary = {
            totalBuckets: Object.keys(riskBuckets).length,
            totalBaskets: baskets.length,
            totalAssets: Object.values(riskBuckets).reduce(
                (sum, bucket) => sum + bucket.totalAssets,
                0
            ),
            totalValue: Object.values(riskBuckets).reduce(
                (sum, bucket) => sum + bucket.totalValue,
                0
            ),
            averageAPY:
                Object.values(riskBuckets).reduce(
                    (sum, bucket) => sum + bucket.avgAPY,
                    0
                ) / 4,
        };

        res.json({
            success: true,
            data: {
                riskBuckets,
                summary,
                bucketDefinitions: {
                    ultra_low:
                        "Ultra Low Risk (90-100 score) - Highest quality invoices",
                    low: "Low Risk (80-89 score) - High quality invoices",
                    medium: "Medium Risk (66-79 score) - Standard quality invoices",
                    high: "High Risk (50-65 score) - Higher risk invoices",
                },
            },
        });
    } catch (error) {
        console.error("Failed to get risk buckets overview:", error);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

module.exports = router;
