const Basket = require("../models/Basket");
const { ethers } = require("ethers");

class BasketService {
    async assignToBasket({
        riskScore,
        assetType,
        amount,
        assetId,
        forceBasketType,
    }) {
        // Determine basket type based on risk score (4 buckets as requested)
        let basketType = forceBasketType || this.determineBasketType(riskScore);

        // Find available basket for this risk tier
        let basket = await Basket.findOne({
            basketType,
            status: "open",
            isFull: false,
        });

        // Create new basket if none exists or current would exceed capacity
        if (
            !basket ||
            (await this.wouldExceedCapacity(basket, riskScore, amount))
        ) {
            basket = await this.createNewBasket(basketType, riskScore);
        }

        // Update basket with new asset
        await this.addAssetToBasket(basket, assetId, amount, riskScore);

        return basket;
    }

    determineBasketType(riskScore) {
        // 4 risk buckets as requested:
        if (riskScore >= 90) return "ultra_low"; // 90-100: Ultra Low Risk
        if (riskScore >= 80) return "low"; // 80-89: Low Risk
        if (riskScore >= 66) return "medium"; // 66-79: Medium Risk
        if (riskScore >= 50) return "high"; // 50-65: High Risk
        return "ultra_high"; // Below 50: Ultra High Risk (special handling)
    }

    getRiskRange(basketType) {
        const ranges = {
            ultra_low: { min: 90, max: 100, maxCapacity: 50 }, // 90-100 risk score
            low: { min: 80, max: 89, maxCapacity: 40 }, // 80-89 risk score
            medium: { min: 66, max: 79, maxCapacity: 30 }, // 66-79 risk score
            high: { min: 50, max: 65, maxCapacity: 25 }, // 50-65 risk score
            ultra_high: { min: 0, max: 49, maxCapacity: 15 }, // Below 50 (special handling)
        };
        return ranges[basketType] || ranges.medium;
    }

    async createNewBasket(basketType, initialRiskScore = 0) {
        const basketId = ethers.utils.id(`basket-${basketType}-${Date.now()}`);
        const riskRange = this.getRiskRange(basketType);
        const basketNumber = await this.getNextBasketNumber(basketType);

        const basket = new Basket({
            basketId,
            basketType,
            name: this.getBasketName(basketType, basketNumber),
            description: this.getBasketDescription(basketType, riskRange),
            maxRiskThreshold: riskRange.max,
            minRiskThreshold: riskRange.min,
            maxCapacity: riskRange.maxCapacity,
            currentRiskScore: initialRiskScore,
            averageRiskScore: initialRiskScore,
            expectedAPY: this.calculateExpectedAPY(basketType),
            riskTier: basketType,
        });

        console.log(`📦 Created new ${basketType} risk basket: ${basket.name}`);
        return await basket.save();
    }

    getBasketName(basketType, number) {
        const names = {
            ultra_low: `Ultra Low Risk Basket #${number}`,
            low: `Low Risk Basket #${number}`,
            medium: `Medium Risk Basket #${number}`,
            high: `High Risk Basket #${number}`,
            ultra_high: `Ultra High Risk Basket #${number}`,
        };
        return names[basketType] || `Risk Basket #${number}`;
    }

    getBasketDescription(basketType, riskRange) {
        return (
            `Automatically created basket for assets with risk scores ${riskRange.min}-${riskRange.max}. ` +
            `Maximum capacity: ${
                riskRange.maxCapacity
            } assets. Expected APY: ${this.calculateExpectedAPY(basketType)}%`
        );
    }

    async addAssetToBasket(basket, assetId, amount, riskScore) {
        // Add asset to basket
        basket.assetIds.push(assetId);
        basket.assetCount += 1;
        basket.totalValue += amount;
        basket.availableToInvest += amount * 0.85; // 85% typically unlockable

        // Recalculate weighted risk score
        basket.currentRiskScore = await this.calculateWeightedRisk(basket);

        // Check if basket is now full
        const riskRange = this.getRiskRange(basket.basketType);
        basket.isFull = basket.assetCount >= riskRange.maxCapacity;

        // Update performance tracking
        basket.performance.push({
            date: new Date(),
            value: basket.totalValue,
            apy: basket.expectedAPY,
        });

        return await basket.save();
    }

    async calculateWeightedRisk(basket) {
        // This would typically query all assets in the basket
        // For now, using simplified calculation
        const Asset = require("../models/Asset");
        const assets = await Asset.find({ assetId: { $in: basket.assetIds } });

        if (assets.length === 0) return 0;

        const totalValue = assets.reduce(
            (sum, asset) => sum + asset.faceAmount,
            0
        );
        const weightedRisk = assets.reduce((sum, asset) => {
            const weight = asset.faceAmount / totalValue;
            return sum + asset.riskScore * weight;
        }, 0);

        return Math.round(weightedRisk);
    }

    calculateExpectedAPY(basketType) {
        // APY based on risk tier (keeping under 9% as requested)
        const baseAPY = {
            ultra_low: 4.5, // 90-100 risk score: Lowest risk, lowest return
            low: 5.8, // 80-89 risk score: Low risk
            medium: 7.2, // 66-79 risk score: Medium risk
            high: 8.5, // 50-65 risk score: High risk
            ultra_high: 8.9, // Below 50: Ultra high risk, capped at 8.9%
            mixed: 6.5, // Mixed baskets
        };
        return baseAPY[basketType] || 6.5;
    }

    async wouldExceedCapacity(basket, newRiskScore, newAmount) {
        const riskRange = this.getRiskRange(basket.basketType);

        // Check if adding this asset would exceed capacity
        if (basket.assetCount >= riskRange.maxCapacity) {
            return true;
        }

        // Check if risk score is within acceptable range for this basket type
        if (newRiskScore < riskRange.min || newRiskScore > riskRange.max) {
            return true;
        }

        // Check if total value would be too large (optional limit)
        const maxBasketValue = 10000000; // $10M max per basket
        if (basket.totalValue + newAmount > maxBasketValue) {
            return true;
        }

        return false;
    }

    async getNextBasketNumber(basketType) {
        const count = await Basket.countDocuments({ basketType });
        return count + 1;
    }

    // New method to automatically basketize invoices after analysis
    async basketizeInvoice(assetId, riskScore, amount, assetType = "invoice") {
        try {
            console.log(
                `🔄 Basketizing invoice ${assetId} with risk score ${riskScore}`
            );

            // Assign to appropriate basket
            const basket = await this.assignToBasket({
                riskScore,
                assetType,
                amount,
                assetId,
            });

            console.log(
                `✅ Invoice ${assetId} assigned to basket ${basket.basketId} (${basket.basketType})`
            );

            return {
                success: true,
                basketId: basket.basketId,
                basketType: basket.basketType,
                basketName: basket.name,
                riskTier: this.getRiskTierName(basket.basketType),
                expectedAPY: basket.expectedAPY,
            };
        } catch (error) {
            console.error(`❌ Failed to basketize invoice ${assetId}:`, error);
            throw error;
        }
    }

    // Get all baskets with their current status
    async getAllBaskets() {
        try {
            const baskets = await Basket.find({}).sort({
                basketType: 1,
                createdAt: -1,
            });

            return baskets.map((basket) => ({
                basketId: basket.basketId,
                basketType: basket.basketType,
                name: basket.name,
                riskTier: this.getRiskTierName(basket.basketType),
                assetCount: basket.assetCount,
                totalValue: basket.totalValue,
                availableToInvest: basket.availableToInvest,
                expectedAPY: basket.expectedAPY,
                currentRiskScore: basket.currentRiskScore,
                status: basket.status,
                isFull: basket.isFull,
                capacity: this.getRiskRange(basket.basketType).maxCapacity,
                utilizationRate: (
                    (basket.assetCount /
                        this.getRiskRange(basket.basketType).maxCapacity) *
                    100
                ).toFixed(1),
            }));
        } catch (error) {
            console.error("Failed to get all baskets:", error);
            throw error;
        }
    }

    // Get basket statistics by risk tier
    async getBasketStatistics() {
        try {
            const stats = await Basket.aggregate([
                {
                    $group: {
                        _id: "$basketType",
                        count: { $sum: 1 },
                        totalValue: { $sum: "$totalValue" },
                        totalAssets: { $sum: "$assetCount" },
                        avgRiskScore: { $avg: "$currentRiskScore" },
                        avgAPY: { $avg: "$expectedAPY" },
                    },
                },
            ]);

            const result = {};
            stats.forEach((stat) => {
                result[stat._id] = {
                    basketCount: stat.count,
                    totalValue: stat.totalValue || 0,
                    totalAssets: stat.totalAssets || 0,
                    averageRiskScore: Math.round(stat.avgRiskScore || 0),
                    averageAPY: Number((stat.avgAPY || 0).toFixed(2)),
                    riskTier: this.getRiskTierName(stat._id),
                };
            });

            return result;
        } catch (error) {
            console.error("Failed to get basket statistics:", error);
            throw error;
        }
    }

    getRiskTierName(basketType) {
        const names = {
            ultra_low: "Ultra Low Risk (90-100)",
            low: "Low Risk (80-89)",
            medium: "Medium Risk (66-79)",
            high: "High Risk (50-65)",
            ultra_high: "Ultra High Risk (0-49)",
        };
        return names[basketType] || basketType;
    }

    // Find or create basket for a specific risk score
    async findOrCreateBasketForRisk(riskScore, amount, assetType = "invoice") {
        const basketType = this.determineBasketType(riskScore);

        // Try to find existing basket
        let basket = await Basket.findOne({
            basketType,
            status: "open",
            isFull: false,
        });

        // Check if existing basket can accommodate this asset
        if (
            basket &&
            (await this.wouldExceedCapacity(basket, riskScore, amount))
        ) {
            basket = null; // Force creation of new basket
        }

        // Create new basket if needed
        if (!basket) {
            basket = await this.createNewBasket(basketType, riskScore);
        }

        return basket;
    }
}

module.exports = new BasketService();
