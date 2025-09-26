// Contract addresses from deployment
const DEPLOYMENT = require('../deployments/kda-testnet.json');

module.exports = {
  // Contract Addresses (loaded from deployment)
  CONTRACTS: {
    TOKEN: process.env.TOKEN_ADDRESS || DEPLOYMENT?.contracts?.token,
    POOL: process.env.POOL_ADDRESS || DEPLOYMENT?.contracts?.pool,
    AGENT: process.env.AGENT_ADDRESS || DEPLOYMENT?.contracts?.agent
  },

  // Network Configuration
  NETWORK: {
    CHAIN_ID: DEPLOYMENT?.chainId || 5920,
    RPC_URL: process.env.RPC_URL || "https://evm-testnet.kadena.io",
    EXPLORER_URL: "https://evm-testnet-explorer.kadena.io"
  },

  // Business Logic Constants
  BUSINESS: {
    // Risk Score Ranges
    RISK_TIERS: {
      LOW: { min: 80, max: 100 },
      MEDIUM: { min: 50, max: 79 },
      HIGH: { min: 0, max: 49 }
    },

    // Expected APY by Risk Tier
    BASE_APY: {
      low: 8,
      medium: 12,
      high: 18,
      mixed: 15
    },

    // Unlockable percentages
    UNLOCK_PERCENTAGE: {
      base: 85,
      min: 70,
      max: 90
    },

    // Investment limits
    INVESTMENT_LIMITS: {
      min: 100,
      max: 100000
    },

    // Asset type configurations
    ASSET_TYPES: {
      invoice: { baseRisk: 70, multiplier: 1.0 },
      rental: { baseRisk: 65, multiplier: 1.1 },
      saas: { baseRisk: 75, multiplier: 1.0 },
      creator: { baseRisk: 80, multiplier: 0.9 },
      luxury: { baseRisk: 85, multiplier: 0.8 }
    }
  },

  // Storage Configuration (Cloudflare R2)
  STORAGE: {
    PROVIDER: 'cloudflare-r2',
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_TYPES: [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/csv',
      'application/json'
    ],
    BUCKET_NAME: process.env.CLOUDFLARE_BUCKET_NAME || 'flashflow-documents',
    ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID,
    PUBLIC_URL: process.env.CLOUDFLARE_PUBLIC_URL
  },

  // API Configuration
  API: {
    DEFAULT_PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 100,
    RATE_LIMIT: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100 // limit each IP to 100 requests per windowMs
    }
  }
};
