const express = require("express");
const router = express.Router();

// Mock data generators for realistic dashboard stats
const generatePortfolioPerformance = (months = 12) => {
    const data = [];
    const baseValue = 35000;
    let currentValue = baseValue;

    for (let i = months; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);

        // Simulate realistic growth with some volatility
        const growthRate = 0.08 + (Math.random() - 0.5) * 0.04; // 6-10% annual growth
        const monthlyGrowth = growthRate / 12;
        const volatility = (Math.random() - 0.5) * 0.02; // ±1% monthly volatility

        currentValue *= 1 + monthlyGrowth + volatility;

        data.push({
            date: date.toISOString().slice(0, 7), // YYYY-MM format
            value: Math.round(currentValue),
            returns: Math.round(currentValue - baseValue),
            returnsPct: (
                ((currentValue - baseValue) / baseValue) *
                100
            ).toFixed(2),
        });
    }

    return data;
};

const generateAssetAllocation = () => [
    {
        name: "Stable Income Plus",
        value: 35,
        amount: 16200,
        color: "#10B981",
        apy: 9.2,
    },
    {
        name: "Growth Accelerator",
        value: 28,
        amount: 13100,
        color: "#6366F1",
        apy: 12.8,
    },
    {
        name: "Premium Yield",
        value: 32,
        amount: 16480,
        color: "#F59E0B",
        apy: 14.5,
    },
    {
        name: "Cash Reserve",
        value: 5,
        amount: 2300,
        color: "#6B7280",
        apy: 2.1,
    },
];

const generateRiskMetrics = () => ({
    portfolioRisk: 72,
    diversificationScore: 85,
    volatility: 12.4,
    sharpeRatio: 1.8,
    maxDrawdown: -8.2,
    riskExposure: [
        { name: "Low Risk", value: 35, color: "#10B981" },
        { name: "Medium Risk", value: 45, color: "#F59E0B" },
        { name: "High Risk", value: 20, color: "#EF4444" },
    ],
});

const generatePayoutTrends = () => {
    const data = [];
    for (let i = 11; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);

        const basePayout = 800 + Math.random() * 400;
        data.push({
            month: date.toISOString().slice(0, 7),
            amount: Math.round(basePayout),
            count: Math.floor(Math.random() * 5) + 3,
        });
    }
    return data;
};

const generateTopPerformers = () => [
    {
        id: "basket_12",
        name: "Premium Yield",
        performance: 18.7,
        value: 16480,
        change: "+2.3%",
        trend: "up",
    },
    {
        id: "basket_5",
        name: "Growth Accelerator",
        performance: 15.2,
        value: 13100,
        change: "+1.8%",
        trend: "up",
    },
    {
        id: "basket_1",
        name: "Stable Income Plus",
        performance: 12.1,
        value: 16200,
        change: "+0.9%",
        trend: "up",
    },
];

const generateMarketInsights = () => ({
    marketSentiment: "Bullish",
    confidenceScore: 78,
    keyTrends: [
        "DeFi yields trending upward (+2.3% this week)",
        "Stable coin demand increasing across platforms",
        "Risk-adjusted returns showing strong performance",
    ],
    recommendations: [
        "Consider increasing allocation to growth baskets",
        "Monitor upcoming payout schedules for optimization",
        "Diversification score is excellent - maintain current strategy",
    ],
});

// Dashboard overview endpoint
router.get("/dashboard-overview", async (req, res) => {
    try {
        const overview = {
            portfolioValue: 45780,
            totalInvested: 42000,
            totalReturns: 3780,
            returnsPct: 9.0,
            activePositions: 3,
            monthlyIncome: 1247,
            nextPayout: {
                amount: 342,
                date: "2025-02-15",
                source: "Premium Yield",
            },
            performance: generatePortfolioPerformance(12),
            assetAllocation: generateAssetAllocation(),
            riskMetrics: generateRiskMetrics(),
            payoutTrends: generatePayoutTrends(),
            topPerformers: generateTopPerformers(),
            marketInsights: generateMarketInsights(),
        };

        res.json(overview);
    } catch (error) {
        console.error("Error fetching dashboard overview:", error);
        res.status(500).json({ error: "Failed to fetch dashboard data" });
    }
});

// Portfolio performance endpoint
router.get("/portfolio-performance", async (req, res) => {
    try {
        const { period = "12m" } = req.query;
        const months =
            period === "1y"
                ? 12
                : period === "6m"
                ? 6
                : period === "3m"
                ? 3
                : 12;

        const performance = generatePortfolioPerformance(months);

        res.json({
            period,
            data: performance,
            summary: {
                totalReturn: performance[performance.length - 1].returns,
                totalReturnPct: performance[performance.length - 1].returnsPct,
                bestMonth: Math.max(
                    ...performance.map((p) => parseFloat(p.returnsPct))
                ),
                worstMonth: Math.min(
                    ...performance.map((p) => parseFloat(p.returnsPct))
                ),
            },
        });
    } catch (error) {
        console.error("Error fetching portfolio performance:", error);
        res.status(500).json({ error: "Failed to fetch performance data" });
    }
});

// Asset allocation endpoint
router.get("/asset-allocation", async (req, res) => {
    try {
        const allocation = generateAssetAllocation();
        const totalValue = allocation.reduce(
            (sum, asset) => sum + asset.amount,
            0
        );

        res.json({
            allocation,
            totalValue,
            diversificationScore: 85,
            rebalanceRecommendation: "Portfolio is well-balanced",
        });
    } catch (error) {
        console.error("Error fetching asset allocation:", error);
        res.status(500).json({ error: "Failed to fetch allocation data" });
    }
});

// Risk analytics endpoint
router.get("/risk-analytics", async (req, res) => {
    try {
        const riskData = generateRiskMetrics();

        res.json({
            ...riskData,
            riskScore: 72,
            riskLevel: "Moderate",
            recommendations: [
                "Consider adding more low-risk assets for better balance",
                "Current volatility is within acceptable range",
                "Diversification score is excellent",
            ],
        });
    } catch (error) {
        console.error("Error fetching risk analytics:", error);
        res.status(500).json({ error: "Failed to fetch risk data" });
    }
});

// Payout analytics endpoint
router.get("/payout-analytics", async (req, res) => {
    try {
        const payoutData = generatePayoutTrends();
        const totalPayouts = payoutData.reduce((sum, p) => sum + p.amount, 0);
        const avgMonthlyPayout = Math.round(totalPayouts / payoutData.length);

        res.json({
            trends: payoutData,
            summary: {
                totalPayouts,
                avgMonthlyPayout,
                payoutGrowth: 12.5,
                nextPayoutEstimate: 1340,
                payoutReliability: 94,
            },
        });
    } catch (error) {
        console.error("Error fetching payout analytics:", error);
        res.status(500).json({ error: "Failed to fetch payout data" });
    }
});

module.exports = router;
