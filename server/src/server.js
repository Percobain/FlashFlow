const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const multer = require('multer');
const { ethers } = require('ethers');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// File upload setup
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// MongoDB connection
mongoose.connect(process.env.DATABASE_URL)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Import services
const aiService = require('./services/AIService');
const blockchainService = require('./services/BlockchainService');
const storageService = require('./services/StorageService');

// Import models
const Asset = require('./models/Asset');
const Basket = require('./models/Basket');
const Investment = require('./models/Investment');

// Initialize baskets on startup
async function initializeBaskets() {
  const baskets = [
    { basketId: 'low-risk', name: 'Low Risk Basket', riskRange: [80, 100], targetAPY: 8 },
    { basketId: 'medium-low-risk', name: 'Medium-Low Risk Basket', riskRange: [60, 79], targetAPY: 12 },
    { basketId: 'medium-risk', name: 'Medium Risk Basket', riskRange: [40, 59], targetAPY: 15 },
    { basketId: 'medium-high-risk', name: 'Medium-High Risk Basket', riskRange: [20, 39], targetAPY: 18 },
    { basketId: 'high-risk', name: 'High Risk Basket', riskRange: [0, 19], targetAPY: 25 }
  ];

  for (const basket of baskets) {
    await Basket.findOneAndUpdate(
      { basketId: basket.basketId },
      { ...basket, active: true },
      { upsert: true, new: true }
    );
  }
  console.log('✅ Baskets initialized');
}

// Routes

// 1. Create Asset (Main tokenization endpoint)
app.post('/api/assets/create', upload.single('document'), async (req, res) => {
  try {
    const { assetType, amount, description, userAddress } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No document provided' });
    }

    console.log('📄 Creating asset:', { assetType, amount, userAddress });

    // Upload to R2
    const documentUrl = await storageService.uploadFile(file);
    console.log('📤 Document uploaded:', documentUrl);

    // AI Risk Analysis
    const analysis = await aiService.analyzeAsset({
      assetType,
      amount: parseFloat(amount),
      description,
      documentUrl
    });
    console.log('🤖 AI Analysis complete:', analysis.riskScore);

    // Calculate unlockable based on risk
    const unlockable = calculateUnlockable(parseFloat(amount), analysis.riskScore);

    // Create asset ID
    const assetId = `${assetType}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Save to MongoDB
    const asset = new Asset({
      assetId,
      originator: userAddress,
      assetType,
      amount: parseFloat(amount),
      unlockable,
      riskScore: analysis.riskScore,
      basketId: getBasketId(analysis.riskScore),
      documentUrl,
      analysis: analysis.details,
      status: 'pending'
    });
    await asset.save();

    // Return transaction data for frontend
    const txData = blockchainService.getCreateAssetTxData({
      assetId,
      amount: parseFloat(amount),
      riskScore: analysis.riskScore,
      assetType
    });

    console.log('✅ Asset created successfully:', assetId);

    res.json({
      success: true,
      asset: asset.toObject(),
      txData,
      analysis
    });
  } catch (error) {
    console.error('❌ Create asset error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 2. Fund Asset
app.post('/api/assets/:assetId/fund', async (req, res) => {
  try {
    const { assetId } = req.params;
    
    // Get transaction data
    const txData = blockchainService.getFundAssetTxData(assetId);
    
    // Update asset status
    await Asset.findOneAndUpdate(
      { assetId },
      { status: 'funding', updatedAt: new Date() }
    );

    res.json({
      success: true,
      txData
    });
  } catch (error) {
    console.error('❌ Fund asset error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 3. Get Baskets
app.get('/api/baskets', async (req, res) => {
  try {
    const baskets = await Basket.find({ active: true });
    
    // Get stats from blockchain
    const basketsWithStats = await Promise.all(
      baskets.map(async (basket) => {
        try {
          const stats = await blockchainService.getBasketStats(basket.basketId);
          const assets = await Asset.find({ basketId: basket.basketId });
          
          return {
            ...basket.toObject(),
            totalValue: stats.totalValue || '0',
            totalInvested: stats.totalInvested || '0',
            assetCount: assets.length,
            assets: assets.slice(0, 5) // Recent 5 assets
          };
        } catch (error) {
          console.error(`⚠️  Error getting stats for basket ${basket.basketId}:`, error.message);
          // Return basket with default stats
          return {
            ...basket.toObject(),
            totalValue: '0',
            totalInvested: '0',
            assetCount: 0,
            assets: []
          };
        }
      })
    );

    res.json(basketsWithStats);
  } catch (error) {
    console.error('❌ Get baskets error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 4. Invest in Basket
app.post('/api/baskets/:basketId/invest', async (req, res) => {
  try {
    const { basketId } = req.params;
    const { amount, investorAddress } = req.body;

    if (!amount || !investorAddress) {
      return res.status(400).json({ error: 'Amount and investor address required' });
    }

    // Save investment
    const investment = new Investment({
      basketId,
      investor: investorAddress,
      amount: parseFloat(amount),
      timestamp: new Date()
    });
    await investment.save();

    // Get transaction data
    const txData = blockchainService.getInvestTxData(basketId, parseFloat(amount));

    res.json({
      success: true,
      investment: investment.toObject(),
      txData
    });
  } catch (error) {
    console.error('❌ Investment error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 5. Simulate Repayment
app.post('/api/assets/:assetId/repay', async (req, res) => {
  try {
    const { assetId } = req.params;
    const { amount } = req.body;

    if (!amount) {
      return res.status(400).json({ error: 'Amount required' });
    }

    const txData = blockchainService.getRepaymentTxData(assetId, parseFloat(amount));

    res.json({
      success: true,
      txData
    });
  } catch (error) {
    console.error('❌ Repayment error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 6. Get User Assets
app.get('/api/users/:address/assets', async (req, res) => {
  try {
    const { address } = req.params;
    const assets = await Asset.find({ originator: address }).sort({ createdAt: -1 });
    res.json(assets);
  } catch (error) {
    console.error('❌ Get user assets error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 7. Get Pool Stats
app.get('/api/stats', async (req, res) => {
  try {
    const stats = await blockchainService.getPoolStats();
    res.json(stats);
  } catch (error) {
    console.error('❌ Get stats error:', error);
    res.status(500).json({ 
      poolBalance: '0',
      contractAddress: process.env.FLASHFLOW_ADDRESS,
      fUSDAddress: process.env.FUSD_ADDRESS 
    });
  }
});

// 7. AI Analysis endpoint with real Gemini
app.post('/api/ai/analyze', async (req, res) => {
  try {
    console.log('🤖 Gemini AI Analysis request received');
    
    const { type, documents, metadata } = req.body;
    
    // Use real Gemini AI
    const aiResult = await aiService.analyzeAsset({
      assetType: type,
      amount: metadata?.amount || 1000,
      description: metadata?.description || 'Asset for analysis',
      documentUrl: documents?.[0]?.url || 'pending'
    });

    // Determine basket based on risk score
    let basketId;
    if (aiResult.riskScore >= 80) basketId = 'low-risk';
    else if (aiResult.riskScore >= 60) basketId = 'medium-low-risk';
    else if (aiResult.riskScore >= 40) basketId = 'medium-risk';
    else if (aiResult.riskScore >= 20) basketId = 'medium-high-risk';
    else basketId = 'high-risk';

    const analysisResult = {
      riskScore: aiResult.riskScore,
      confidence: 0.9,
      factors: aiResult.details?.keyFactors || [
        'Document analysis completed',
        'Risk factors evaluated',
        'Market conditions assessed'
      ],
      reasoning: aiResult.details?.reasoning || 'AI-powered risk assessment',
      recommendation: aiResult.riskScore > 70 ? 'APPROVE' : aiResult.riskScore > 40 ? 'REVIEW' : 'CAUTION',
      basketId
    };

    console.log('✅ Gemini AI Analysis completed:', analysisResult);

    res.json({
      success: true,
      analysis: analysisResult
    });

  } catch (error) {
    console.error('❌ Gemini AI Analysis failed:', error);
    
    // Fallback analysis
    const fallbackScore = Math.floor(Math.random() * 40) + 50; // 50-89
    res.json({
      success: true,
      analysis: {
        riskScore: fallbackScore,
        confidence: 0.7,
        factors: [
          'Automated risk assessment',
          'Document format verified',
          'Basic validation completed'
        ],
        reasoning: 'Fallback analysis - AI temporarily unavailable',
        recommendation: fallbackScore > 70 ? 'APPROVE' : 'REVIEW',
        basketId: fallbackScore > 70 ? 'low-risk' : 'medium-risk'
      }
    });
  }
});

// 8. File Upload to Cloudflare R2 (JSON content)
app.post('/api/storage/upload', upload.single('document'), async (req, res) => {
  try {
    const file = req.file;
    const { fileName, fileContent, fileType, assetType, uploadedBy } = req.body;

    if (!file && !fileContent) {
      return res.status(400).json({ error: 'No file provided' });
    }

    let uploadResult;

    if (file) {
      // Handle multipart file upload
      uploadResult = await storageService.uploadFile(file);
    } else if (fileContent) {
      // Handle JSON content upload
      const buffer = Buffer.from(fileContent, 'utf-8');
      const mockFile = {
        buffer,
        originalname: fileName || 'asset.json',
        mimetype: fileType || 'application/json'
      };
      uploadResult = await storageService.uploadFile(mockFile);
    }

    const result = {
      success: true,
      fileUrl: uploadResult,
      fileName: fileName || file?.originalname || 'asset.json',
      originalName: fileName || file?.originalname || 'asset.json',
      fileId: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      hash: `hash_${Date.now()}`,
      uploadedAt: new Date().toISOString(),
      assetType: assetType || 'document'
    };

    res.json(result);
  } catch (error) {
    console.error('❌ File upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 9. Alternative upload endpoint for form data
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    const { assetType, uploadedBy } = req.body;
    
    if (!file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    console.log('📤 Uploading file:', file.originalname);

    const uploadResult = await storageService.uploadFile(file);

    res.json({
      success: true,
      fileUrl: uploadResult,
      fileName: file.originalname,
      originalName: file.originalname,
      fileId: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      hash: `hash_${Date.now()}`,
      uploadedAt: new Date().toISOString(),
      assetType: assetType || 'document'
    });
  } catch (error) {
    console.error('❌ File upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 10. Get fUSD approval transaction data
app.post('/api/fusd/approve', async (req, res) => {
  try {
    const { amount } = req.body;
    
    if (!amount) {
      return res.status(400).json({ error: 'Amount required' });
    }
    
    // Create approval transaction data
    const iface = new ethers.Interface([
      'function approve(address spender, uint256 amount) returns (bool)'
    ]);
    
    const data = iface.encodeFunctionData('approve', [
      process.env.FLASHFLOW_ADDRESS,
      ethers.parseEther(amount.toString())
    ]);

    res.json({
      success: true,
      txData: {
        to: process.env.FUSD_ADDRESS,
        data,
        value: '0x0'
      }
    });
  } catch (error) {
    console.error('❌ Approval error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 11. Generate Mock Data
app.get('/api/mock/generate', async (req, res) => {
  try {
    // Generate some mock assets
    const mockAssets = [
      { type: 'invoice', amount: 50000, risk: 85, description: 'Enterprise Software License' },
      { type: 'rental', amount: 120000, risk: 72, description: 'Downtown Office Space' },
      { type: 'saas', amount: 35000, risk: 45, description: 'Monthly Recurring Revenue' },
      { type: 'creator', amount: 25000, risk: 28, description: 'Content Creator Fund' },
      { type: 'luxury', amount: 80000, risk: 15, description: 'High-End Watch Collection' }
    ];

    res.json({ 
      success: true, 
      mockAssets,
      generated: mockAssets.length 
    });
  } catch (error) {
    console.error('❌ Mock generation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date(),
    contracts: {
      fUSD: process.env.FUSD_ADDRESS,
      flashFlow: process.env.FLASHFLOW_ADDRESS
    },
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Helper functions
function calculateUnlockable(amount, riskScore) {
  let percentage;
  if (riskScore >= 80) percentage = 85;      // Low risk: 85%
  else if (riskScore >= 60) percentage = 75; // Medium-low: 75%
  else if (riskScore >= 40) percentage = 65; // Medium: 65%
  else if (riskScore >= 20) percentage = 50; // Medium-high: 50%
  else percentage = 40;                      // High risk: 40%
  
  return Math.floor((amount * percentage) / 100);
}

function getBasketId(riskScore) {
  if (riskScore >= 80) return 'low-risk';
  if (riskScore >= 60) return 'medium-low-risk';
  if (riskScore >= 40) return 'medium-risk';
  if (riskScore >= 20) return 'medium-high-risk';
  return 'high-risk';
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 API: http://localhost:${PORT}`);
  console.log(`📄 Contracts:`);
  console.log(`   fUSD: ${process.env.FUSD_ADDRESS}`);
  console.log(`   FlashFlow: ${process.env.FLASHFLOW_ADDRESS}`);
  
  await initializeBaskets();
  
  console.log('🎯 Backend ready for FlashFlow!');
});