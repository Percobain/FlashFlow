const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const morgan = require("morgan");
const helmet = require("helmet");

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(
    cors({
        origin: ["http://localhost:5173", "http://localhost:3000"],
        credentials: true,
    })
);
app.use(morgan("combined"));
app.use(helmet());

// Database connection
const connectDB = require("./config/database");
connectDB();

// Initialize blockchain
const { initBlockchain } = require("./config/blockchain");
initBlockchain();

// Routes
const assetRoutes = require("./routes/assets");
const investmentRoutes = require("./routes/investments");
const basketRoutes = require("./routes/baskets");
const paymentRoutes = require("./routes/payments");
const userRoutes = require("./routes/users");
const adminRoutes = require("./routes/admin");
// Import the new blockchain routes
const blockchainRoutes = require('./routes/blockchain');
const storageRoutes = require("./routes/storage");

// Import services
const AssetAnalysisService = require("./services/AssetAnalysisService");
const UserService = require("./services/UserService");

app.use("/api/assets", assetRoutes);
app.use("/api/investments", investmentRoutes);
app.use("/api/baskets", basketRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/blockchain", blockchainRoutes);
app.use("/api/storage", storageRoutes);

// Asset analysis endpoints
app.post("/api/analyze-asset", async (req, res) => {
    try {
        const analysis = await AssetAnalysisService.analyzeAssetData(req.body);
        res.json({
            success: true,
            analysis,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error("Asset analysis failed:", error);
        res.status(500).json({
            success: false,
            error: "Analysis failed",
            details:
                process.env.NODE_ENV === "development"
                    ? error.message
                    : undefined,
        });
    }
});

// Asset analysis with automatic basketization
app.post("/api/analyze-and-basketize", async (req, res) => {
    try {
        const { type, data, userAddress, assetId } = req.body;

        if (!assetId) {
            return res.status(400).json({
                success: false,
                error: "Asset ID is required for basketization",
            });
        }

        // Analyze with auto-basketization enabled
        const analysis = await AssetAnalysisService.analyzeAssetData({
            type,
            data,
            userAddress,
            assetId,
            autoBasketize: true,
        });

        res.json({
            success: true,
            analysis,
            basketized: !!analysis.basketization?.success,
            basketInfo: analysis.basketization,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error("Analysis and basketization failed:", error);
        res.status(500).json({
            success: false,
            error: "Analysis and basketization failed",
            details:
                process.env.NODE_ENV === "development"
                    ? error.message
                    : undefined,
        });
    }
});

// AI-Enhanced analysis endpoint (explicit)
app.post("/api/analyze-asset-ai", async (req, res) => {
    try {
        console.log("🤖 AI-Enhanced analysis requested");
        const analysis = await AssetAnalysisService.analyzeAssetData(req.body);
        res.json({
            success: true,
            analysis,
            aiEnhanced: true,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error("AI-Enhanced asset analysis failed:", error);
        res.status(500).json({
            success: false,
            error: "AI-Enhanced analysis failed",
            details:
                process.env.NODE_ENV === "development"
                    ? error.message
                    : undefined,
        });
    }
});

// Direct deterministic risk analysis endpoint
app.post("/api/risk-analysis/:type", async (req, res) => {
    try {
        const { type } = req.params;
        const data = req.body;

        const validTypes = ["invoice", "saas", "creator", "rental", "luxury"];
        if (!validTypes.includes(type)) {
            return res.status(400).json({ error: "Invalid asset type" });
        }

        const analysis =
            await AssetAnalysisService.performDeterministicRiskAnalysis(
                type,
                data
            );
        res.json({
            success: true,
            type,
            analysis,
        });
    } catch (error) {
        console.error("Risk analysis failed:", error);
        res.status(500).json({
            success: false,
            error: "Risk analysis failed",
            details:
                process.env.NODE_ENV === "development"
                    ? error.message
                    : undefined,
        });
    }
});

// Get risk algorithm configuration
app.get("/api/risk-config", (req, res) => {
    try {
        res.json({
            success: true,
            config: {
                algorithmVersion:
                    AssetAnalysisService.DEFAULTS.algorithmVersion,
                supportedTypes: [
                    "invoice",
                    "saas",
                    "creator",
                    "rental",
                    "luxury",
                ],
                thresholds: AssetAnalysisService.DEFAULTS.thresholds,
                weights: AssetAnalysisService.DEFAULTS.weights,
            },
        });
    } catch (error) {
        console.error("Failed to get risk config:", error);
        res.status(500).json({ error: "Failed to get configuration" });
    }
});

// Health check
app.get("/", (req, res) => {
    res.json({
        message: "FlashFlow Backend API",
        status: "running",
        timestamp: new Date().toISOString(),
        version: "1.0.0",
        riskAnalysis: {
            algorithmVersion: AssetAnalysisService.DEFAULTS.algorithmVersion,
            supportedTypes: ["invoice", "saas", "creator", "rental", "luxury"],
            aiEnhanced: true,
            aiModel: "gpt-4",
        },
        endpoints: {
            assets: "/api/assets",
            investments: "/api/investments",
            baskets: "/api/baskets",
            payments: "/api/payments",
            users: "/api/users",
            admin: "/api/admin",
            riskAnalysis: "/api/risk-analysis/:type",
            assetAnalysis: "/api/analyze-asset",
            aiAssetAnalysis: "/api/analyze-asset-ai",
            analyzeAndBasketize: "/api/analyze-and-basketize",
            basketStatistics: "/api/baskets/statistics",
            basketRiskTiers: "/api/baskets/risk-tiers",
            basketizeInvoice: "/api/baskets/basketize-invoice",
            analyzeAndBasketizeInvoice:
                "/api/baskets/analyze-and-basketize-invoice",
            riskBucketsOverview: "/api/baskets/risk-buckets-overview",
            riskConfig: "/api/risk-config",
        },
    });
});

app.get("/health", (req, res) => {
    res.json("Cron huh?");
});

// Global error handler
app.use((err, req, res, next) => {
    console.error("Global error handler:", err);
    res.status(500).json({
        success: false,
        error: "Internal server error",
        ...(process.env.NODE_ENV === "development" && { details: err.message }),
    });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`FlashFlow Backend listening on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
    console.log(`API Documentation available at http://localhost:${PORT}/`);
});

module.exports = app;
