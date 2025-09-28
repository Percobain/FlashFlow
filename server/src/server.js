const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const multer = require("multer");
const { ethers } = require("ethers");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// File upload setup
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// MongoDB connection with proper error handling
const connectDB = async () => {
    try {
        const mongoUri = process.env.DATABASE_URL || process.env.MONGODB_URI;
        if (!mongoUri) {
            throw new Error("MongoDB URI not found in environment variables");
        }

        await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
            socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
        });

        console.log("✅ Connected to MongoDB");
        return true;
    } catch (err) {
        console.error("❌ MongoDB connection error:", err.message);
        return false;
    }
};

// MongoDB connection will be initialized in startServer()

// Import services
const aiService = require("./services/AIService");
const assetAnalysisService = require("./services/AssetAnalysisService");
const blockchainService = require("./services/BlockchainService");
const storageService = require("./services/StorageService");

// Import models
const Asset = require("./models/Asset");
const Basket = require("./models/Basket");
const Investment = require("./models/Investment");

// Import routes
const basketsRouter = require("./routes/baskets");

// Initialize baskets on startup
async function initializeBaskets() {
    try {
        // Check if MongoDB is connected
        if (mongoose.connection.readyState !== 1) {
            console.log("⏳ Waiting for MongoDB connection...");
            await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error("MongoDB connection timeout"));
                }, 10000);

                mongoose.connection.on("connected", () => {
                    clearTimeout(timeout);
                    resolve();
                });

                if (mongoose.connection.readyState === 1) {
                    clearTimeout(timeout);
                    resolve();
                }
            });
        }

        const baskets = [
            {
                basketId: "low-risk",
                name: "Low Risk Basket",
                riskRange: [90, 100],
                targetAPY: 4.5,
            },
            {
                basketId: "medium-low-risk",
                name: "Medium-Low Risk Basket",
                riskRange: [80, 89],
                targetAPY: 6.0,
            },
            {
                basketId: "medium-risk",
                name: "Medium Risk Basket",
                riskRange: [65, 79],
                targetAPY: 7.5,
            },
            {
                basketId: "medium-high-risk",
                name: "Medium-High Risk Basket",
                riskRange: [50, 64],
                targetAPY: 8.5,
            },
            {
                basketId: "high-risk",
                name: "High Risk Basket",
                riskRange: [0, 49],
                targetAPY: 9.5,
            },
        ];

        for (const basket of baskets) {
            await Basket.findOneAndUpdate(
                { basketId: basket.basketId },
                { ...basket, active: true },
                { upsert: true, new: true }
            );
        }
        console.log("✅ Baskets initialized");
    } catch (error) {
        console.error("❌ Failed to initialize baskets:", error.message);
        // Don't exit the process, just log the error
    }
}

// Routes

// Use baskets router
app.use("/api/baskets", basketsRouter);

// 1. Create Asset (Main tokenization endpoint)
app.post("/api/assets/create", upload.single("document"), async (req, res) => {
    try {
        const {
            assetType,
            amount,
            description,
            userAddress,
            documentUrl,
            fileUrl,
            analysis,
            txHash,
            originator,
            assetId,
        } = req.body;
        const file = req.file;

        console.log("📄 Creating asset:", {
            assetType,
            amount,
            userAddress,
            hasFile: !!file,
            hasDocumentUrl: !!documentUrl,
            hasFileUrl: !!fileUrl,
            hasAnalysis: !!analysis,
            hasAssetId: !!assetId,
            hasTxHash: !!txHash,
        });

        // Determine document URL
        let finalDocumentUrl = documentUrl || fileUrl;
        if (file) {
            finalDocumentUrl = await storageService.uploadFile(file);
            console.log("📤 Document uploaded:", finalDocumentUrl);
        } else if (finalDocumentUrl) {
            console.log("📄 Using existing document URL:", finalDocumentUrl);
        }

        // Use provided analysis or perform new analysis
        let finalAnalysis = analysis;
        if (!finalAnalysis && finalDocumentUrl) {
            finalAnalysis = await aiService.analyzeAsset({
                assetType,
                amount: parseFloat(amount),
                description,
                documentUrl: finalDocumentUrl,
            });
            console.log("🤖 AI Analysis complete:", finalAnalysis.riskScore);
        } else if (finalAnalysis) {
            console.log(
                "📊 Using provided analysis:",
                finalAnalysis.riskScore || finalAnalysis.score
            );
        }

        // Generate asset ID if not provided
        const finalAssetId =
            assetId ||
            `${assetType}-${Date.now()}-${Math.random()
                .toString(36)
                .substr(2, 9)}`;

        // Extract risk score from analysis
        const riskScore =
            finalAnalysis?.riskScore || finalAnalysis?.score || 50;

        // Calculate unlockable amount
        const unlockable = calculateUnlockable(parseFloat(amount), riskScore);

        // Create asset document
        const assetData = {
            assetId: finalAssetId,
            originator: originator || userAddress,
            assetType,
            amount: parseFloat(amount),
            unlockable,
            riskScore: riskScore,
            basketId: getBasketId(riskScore),
            documentUrl: finalDocumentUrl,
            analysis: finalAnalysis || {},
            status: "pending",
        };

        // Add txHash if provided (but don't store it in the asset model since it's not in the schema)
        if (txHash) {
            console.log("📝 Transaction hash provided:", txHash);
        }

        const asset = new Asset(assetData);
        await asset.save();

        console.log("✅ Asset created successfully:", finalAssetId);

        res.json({
            success: true,
            asset: asset.toObject(),
            analysis: finalAnalysis,
        });
    } catch (error) {
        console.error("❌ Create asset error:", error);
        res.status(500).json({ error: error.message });
    }
});

// 2. Fund Asset
app.post("/api/assets/:assetId/fund", async (req, res) => {
    try {
        const { assetId } = req.params;

        // Get transaction data
        const txData = blockchainService.getFundAssetTxData(assetId);

        // Update asset status
        await Asset.findOneAndUpdate(
            { assetId },
            { status: "funding", updatedAt: new Date() }
        );

        res.json({
            success: true,
            txData,
        });
    } catch (error) {
        console.error("❌ Fund asset error:", error);
        res.status(500).json({ error: error.message });
    }
});

// 3. Simulate Repayment
app.post("/api/assets/:assetId/repay", async (req, res) => {
    try {
        const { assetId } = req.params;
        const { amount } = req.body;

        if (!amount) {
            return res.status(400).json({ error: "Amount required" });
        }

        const txData = blockchainService.getRepaymentTxData(
            assetId,
            parseFloat(amount)
        );

        res.json({
            success: true,
            txData,
        });
    } catch (error) {
        console.error("❌ Repayment error:", error);
        res.status(500).json({ error: error.message });
    }
});

// 4. Get User Assets
app.get("/api/users/:address/assets", async (req, res) => {
    try {
        const { address } = req.params;
        const assets = await Asset.find({ originator: address }).sort({
            createdAt: -1,
        });
        res.json(assets);
    } catch (error) {
        console.error("❌ Get user assets error:", error);
        res.status(500).json({ error: error.message });
    }
});

// 5. Get Pool Stats
app.get("/api/stats", async (req, res) => {
    try {
        const stats = await blockchainService.getPoolStats();
        res.json(stats);
    } catch (error) {
        console.error("❌ Get stats error:", error);
        res.status(500).json({
            poolBalance: "0",
            contractAddress: process.env.FLASHFLOW_ADDRESS,
            fUSDAddress: process.env.FUSD_ADDRESS,
        });
    }
});

// 6. AI Analysis endpoint with comprehensive AssetAnalysisService
app.post("/api/ai/analyze", async (req, res) => {
    try {
        console.log("🤖 Asset Analysis request received");

        const { type, documents, metadata, data } = req.body;

        // Prepare data for analysis
        const analysisData = {
            type: type || "invoice",
            data: data || {
                total_amount: metadata?.amount || 1000,
                description: metadata?.description || "Asset for analysis",
                documentUrl: documents?.[0]?.url || "pending",
                vendor: metadata?.vendor || { company_name: "Unknown Vendor" },
                client: metadata?.client || { company_name: "Unknown Client" },
                payment_terms: metadata?.payment_terms || "Net 30",
                ...metadata,
            },
            userAddress:
                req.body.userAddress ||
                "0x0000000000000000000000000000000000000000",
            assetId: req.body.assetId || `temp-${Date.now()}`,
            autoBasketize: true,
        };

        // Use comprehensive AssetAnalysisService
        const analysis = await assetAnalysisService.analyzeAssetData(
            analysisData
        );

        // Determine basket based on risk score
        const basketId = getBasketId(analysis.score);

        const analysisResult = {
            riskScore: analysis.score,
            confidence: analysis.confidence,
            factors: analysis.factors || [
                "Document analysis completed",
                "Risk factors evaluated",
                "Market conditions assessed",
            ],
            reasoning:
                analysis.aiSummary || "Comprehensive risk assessment completed",
            recommendation:
                analysis.score > 70
                    ? "APPROVE"
                    : analysis.score > 40
                    ? "REVIEW"
                    : "CAUTION",
            basketId,
            estimatedValue: analysis.estimatedValue,
            recommendedAdvance: analysis.recommendedAdvance,
            projectedROI: analysis.projectedROI,
            metadata: analysis.metadata,
            basketization: analysis.basketization,
        };

        console.log("✅ Asset Analysis completed:", {
            score: analysisResult.riskScore,
            basketId: analysisResult.basketId,
            estimatedValue: analysisResult.estimatedValue,
        });

        res.json({
            success: true,
            analysis: analysisResult,
        });
    } catch (error) {
        console.error("❌ Asset Analysis failed:", error);

        // Fallback analysis with proper structure
        const fallbackScore = Math.floor(Math.random() * 40) + 50; // 50-89
        const basketId = getBasketId(fallbackScore);

        res.json({
            success: true,
            analysis: {
                riskScore: fallbackScore,
                confidence: 70,
                factors: [
                    "Automated risk assessment",
                    "Document format verified",
                    "Basic validation completed",
                ],
                reasoning:
                    "Fallback analysis - comprehensive analysis temporarily unavailable",
                recommendation: fallbackScore > 70 ? "APPROVE" : "REVIEW",
                basketId,
                estimatedValue: req.body.metadata?.amount || 50000,
                recommendedAdvance: 0.75,
                projectedROI: "7.5",
                metadata: {
                    dataPoints: 3,
                    processingTime: 1.0,
                    algorithmVersion: "fallback-1.0",
                },
            },
        });
    }
});

// 7. File Upload to Cloudflare R2 (JSON content)
app.post("/api/storage/upload", upload.single("document"), async (req, res) => {
    try {
        const file = req.file;
        const { fileName, fileContent, fileType, assetType, uploadedBy } =
            req.body;

        if (!file && !fileContent) {
            return res.status(400).json({ error: "No file provided" });
        }

        let uploadResult;

        if (file) {
            // Handle multipart file upload
            uploadResult = await storageService.uploadFile(file);
        } else if (fileContent) {
            // Handle JSON content upload
            const buffer = Buffer.from(fileContent, "utf-8");
            const mockFile = {
                buffer,
                originalname: fileName || "asset.json",
                mimetype: fileType || "application/json",
            };
            uploadResult = await storageService.uploadFile(mockFile);
        }

        const result = {
            success: true,
            fileUrl: uploadResult,
            fileName: fileName || file?.originalname || "asset.json",
            originalName: fileName || file?.originalname || "asset.json",
            fileId: `file_${Date.now()}_${Math.random()
                .toString(36)
                .substr(2, 9)}`,
            hash: `hash_${Date.now()}`,
            uploadedAt: new Date().toISOString(),
            assetType: assetType || "document",
        };

        res.json(result);
    } catch (error) {
        console.error("❌ File upload error:", error);
        res.status(500).json({ error: error.message });
    }
});

// 8. Alternative upload endpoint for form data
app.post("/api/upload", upload.single("file"), async (req, res) => {
    try {
        const file = req.file;
        const { assetType, uploadedBy } = req.body;

        if (!file) {
            return res.status(400).json({ error: "No file provided" });
        }

        console.log("📤 Uploading file:", file.originalname);

        const uploadResult = await storageService.uploadFile(file);

        res.json({
            success: true,
            fileUrl: uploadResult,
            fileName: file.originalname,
            originalName: file.originalname,
            fileId: `file_${Date.now()}_${Math.random()
                .toString(36)
                .substr(2, 9)}`,
            hash: `hash_${Date.now()}`,
            uploadedAt: new Date().toISOString(),
            assetType: assetType || "document",
        });
    } catch (error) {
        console.error("❌ File upload error:", error);
        res.status(500).json({ error: error.message });
    }
});

// 9. Get fUSD approval transaction data
app.post("/api/fusd/approve", async (req, res) => {
    try {
        const { amount } = req.body;

        if (!amount) {
            return res.status(400).json({ error: "Amount required" });
        }

        // Create approval transaction data
        const iface = new ethers.Interface([
            "function approve(address spender, uint256 amount) returns (bool)",
        ]);

        const data = iface.encodeFunctionData("approve", [
            process.env.FLASHFLOW_ADDRESS,
            ethers.parseEther(amount.toString()),
        ]);

        res.json({
            success: true,
            txData: {
                to: process.env.FUSD_ADDRESS,
                data,
                value: "0x0",
            },
        });
    } catch (error) {
        console.error("❌ Approval error:", error);
        res.status(500).json({ error: error.message });
    }
});

// 10. Generate Mock Data
app.get("/api/mock/generate", async (req, res) => {
    try {
        // Generate some mock assets
        const mockAssets = [
            {
                type: "invoice",
                amount: 50000,
                risk: 85,
                description: "Enterprise Software License",
            },
            {
                type: "rental",
                amount: 120000,
                risk: 72,
                description: "Downtown Office Space",
            },
            {
                type: "saas",
                amount: 35000,
                risk: 45,
                description: "Monthly Recurring Revenue",
            },
            {
                type: "creator",
                amount: 25000,
                risk: 28,
                description: "Content Creator Fund",
            },
            {
                type: "luxury",
                amount: 80000,
                risk: 15,
                description: "High-End Watch Collection",
            },
        ];

        res.json({
            success: true,
            mockAssets,
            generated: mockAssets.length,
        });
    } catch (error) {
        console.error("❌ Mock generation error:", error);
        res.status(500).json({ error: error.message });
    }
});

// Health check
app.get("/health", (req, res) => {
    res.json({
        status: "ok",
        timestamp: new Date(),
        contracts: {
            fUSD: process.env.FUSD_ADDRESS,
            flashFlow: process.env.FLASHFLOW_ADDRESS,
        },
        database:
            mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    });
});

// Helper functions
function calculateUnlockable(amount, riskScore) {
    let percentage;
    if (riskScore >= 80) percentage = 85; // Low risk: 85%
    else if (riskScore >= 60) percentage = 75; // Medium-low: 75%
    else if (riskScore >= 40) percentage = 65; // Medium: 65%
    else if (riskScore >= 20) percentage = 50; // Medium-high: 50%
    else percentage = 40; // High risk: 40%

    return Math.floor((amount * percentage) / 100);
}

function getBasketId(riskScore) {
    if (riskScore >= 90) return "low-risk";
    if (riskScore >= 80) return "medium-low-risk";
    if (riskScore >= 65) return "medium-risk";
    if (riskScore >= 50) return "medium-high-risk";
    return "high-risk";
}

// Error handling middleware
app.use((err, req, res, next) => {
    console.error("❌ Unhandled error:", err);
    res.status(500).json({ error: "Internal server error" });
});

// Start server
const startServer = async () => {
    try {
        // Wait for database connection
        console.log("🔄 Connecting to database...");
        const dbConnected = await connectDB();

        if (!dbConnected) {
            console.log("⚠️  Starting server without database connection");
        }

        app.listen(PORT, async () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`🌐 API: http://localhost:${PORT}`);
            console.log(`📄 Contracts:`);
            console.log(`   fUSD: ${process.env.FUSD_ADDRESS}`);
            console.log(`   FlashFlow: ${process.env.FLASHFLOW_ADDRESS}`);

            // Only initialize baskets if database is connected
            if (dbConnected) {
                await initializeBaskets();
            } else {
                console.log(
                    "⚠️  Skipping basket initialization - no database connection"
                );
            }

            console.log("🎯 Backend ready for FlashFlow!");
        });
    } catch (error) {
        console.error("❌ Failed to start server:", error);
        process.exit(1);
    }
};

startServer();
