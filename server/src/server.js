const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

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
const selfVerificationRoutes = require("./routes/self-verification");

app.use("/api/assets", assetRoutes);
app.use("/api/investments", investmentRoutes);
app.use("/api/baskets", basketRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/self-verification", selfVerificationRoutes);

// Health check
app.get("/", (req, res) => {
    res.json({
        message: "FlashFlow Backend API",
        status: "running",
        timestamp: new Date().toISOString(),
        version: "1.0.0",
        selfVerification: {
            enabled: !!process.env.SELF_VERIFIER_ADDRESS,
            contract: process.env.SELF_VERIFIER_ADDRESS,
            chainId: process.env.CELO_CHAIN_ID
        },
        endpoints: {
            assets: "/api/assets",
            investments: "/api/investments", 
            baskets: "/api/baskets",
            payments: "/api/payments",
            users: "/api/users",
            admin: "/api/admin",
            selfVerification: "/api/self-verification"
        }
    });
});

app.get("/health",  (req, res) => {
    res.json("Cron huh?")
});

// Global error handler
app.use((err, req, res, next) => {
    console.error("Global error handler:", err);
    res.status(500).json({
        success: false,
        error: "Internal server error",
        ...(process.env.NODE_ENV === 'development' && { details: err.message })
    });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`FlashFlow Backend listening on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
    console.log(`API Documentation available at http://localhost:${PORT}/`);
});

module.exports = app;
