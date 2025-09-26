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

app.use("/api/assets", assetRoutes);

// Health check
app.get("/", (req, res) => {
    res.json({
        message: "FlashFlow Backend API",
        status: "running",
        timestamp: new Date().toISOString(),
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error("Global error handler:", err);
    res.status(500).json({
        success: false,
        error: "Internal server error",
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`FlashFlow Backend listening on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
});

module.exports = app;
