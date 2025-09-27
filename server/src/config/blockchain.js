const { ethers } = require("ethers");
const path = require("path");
const fs = require("fs");

// Load ABIs directly
const FlashFlowAgent = require("../abis/FlashFlowAgent.js");
const FlashFlowToken = require("../abis/FlashFlowToken.js");
const MainPool = require("../abis/MainPool.js");

// Contract addresses (will be loaded from environment or deployment file)
const CONTRACTS = {
    FLASHFLOW_AGENT: process.env.FLASHFLOW_AGENT_ADDRESS || "0x5F675D9E81bC91c73a41f3Ee377a7c1eeb2C062f",
    MAIN_POOL: process.env.MAIN_POOL_ADDRESS || "0xCA7c84C6Ca61f48fA04d7dBbA1649f269962997c",
    FLASHFLOW_TOKEN: process.env.FLASHFLOW_TOKEN_ADDRESS || "0xAdB17C7D41c065C0c57D69c7B4BC97A6fcD4D117",
    SELF_VERIFIER: process.env.SELF_VERIFIER_ADDRESS
};

// Network configurations
const NETWORKS = {
    localhost: {
        name: "localhost",
        rpc: "http://127.0.0.1:8545",
        chainId: 31337
    },
    sepolia: {
        name: "sepolia",
        rpc: `https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
        chainId: 11155111
    },
    kadenaTestnet: {
        name: "kadenaTestnet", 
        rpc: "https://evm-testnet.chainweb.com/chainweb/0.0/evm-testnet/chain/20/evm/rpc",
        chainId: 5920
    },
    celoTestnet: {
        name: "celoTestnet",
        rpc: "https://forno.celo-sepolia.celo-testnet.org", 
        chainId: 11142220
    }
};

class Web3Service {
    constructor() {
        this.provider = null;
        this.wallet = null;
        this.contracts = {};
        this.network = null;
    }

    async initialize() {
        try {
            // Get network configuration
            const networkName = process.env.NETWORK || "kadenaTestnet";
            this.network = NETWORKS[networkName];
            
            if (!this.network) {
                throw new Error(`Unknown network: ${networkName}`);
            }

            // Initialize provider (ethers v5 syntax)
            this.provider = new ethers.providers.JsonRpcProvider(this.network.rpc);
            
            // Test connection
            await this.provider.getNetwork();
            console.log(`✅ Connected to ${this.network.name} (Chain ID: ${this.network.chainId})`);

            // Initialize wallet if private key is provided
            const privateKey = process.env.PRIVATE_KEY_POOL;
            if (privateKey) {
                this.wallet = new ethers.Wallet(privateKey, this.provider);
                console.log(`✅ Wallet initialized: ${this.wallet.address}`);
                
                // Check wallet balance
                const balance = await this.provider.getBalance(this.wallet.address);
                console.log(`💰 Wallet balance: ${ethers.utils.formatEther(balance)} ETH`);
            } else {
                // console.log("ℹ️  Using read-only mode (no private key provided)");
            }

            // Load contract instances
            await this.loadContracts();
            
            return { provider: this.provider, wallet: this.wallet, contracts: this.contracts };
        } catch (error) {
            console.error("❌ Blockchain initialization failed:", error.message);
            throw error;
        }
    }

    async loadContracts() {
        try {
            // Load contracts with direct ABI imports
            await this.loadContract("FlashFlowAgent", CONTRACTS.FLASHFLOW_AGENT, FlashFlowAgent);
            await this.loadContract("MainPool", CONTRACTS.MAIN_POOL, MainPool);
            await this.loadContract("FlashFlowToken", CONTRACTS.FLASHFLOW_TOKEN, FlashFlowToken);
            
            console.log("✅ All contracts loaded successfully");
        } catch (error) {
            console.error("❌ Failed to load contracts:", error.message);
        }
    }

    async loadContract(contractName, address, abi) {
        try {
            if (!address) {
                console.warn(`⚠️  ${contractName} address not provided`);
                return;
            }

            if (!abi) {
                console.warn(`⚠️  ${contractName} ABI not found`);
                return;
            }

            const contract = new ethers.Contract(
                address, 
                abi, 
                this.wallet || this.provider
            );

            this.contracts[contractName] = contract;
            console.log(`✅ ${contractName} loaded at ${address}`);
        } catch (error) {
            console.error(`❌ Failed to load ${contractName}:`, error.message);
        }
    }

    // Helper methods for contract interactions
    async createAsset(assetData) {
        const contract = this.contracts.FlashFlowAgent;
        if (!contract) throw new Error("FlashFlowAgent contract not loaded");

        const tx = await contract.createAsset(
            assetData.assetId,
            assetData.originator,
            assetData.faceAmount,
            assetData.unlockable,
            assetData.riskScore,
            assetData.basketId,
            assetData.assetType,
            assetData.documentHash
        );

        return await tx.wait();
    }

    async getAssetInfo(assetId) {
        const contract = this.contracts.FlashFlowAgent;
        if (!contract) throw new Error("FlashFlowAgent contract not loaded");

        return await contract.getAssetInfo(assetId);
    }

    async releaseFunds(assetId, originator, amount) {
        const contract = this.contracts.MainPool;
        if (!contract) throw new Error("MainPool contract not loaded");

        const tx = await contract.releaseFunds(assetId, originator, amount);
        return await tx.wait();
    }

    async getPoolStats() {
        const contract = this.contracts.MainPool;
        if (!contract) throw new Error("MainPool contract not loaded");

        return await contract.getPoolStats();
    }

    // Event listeners
    setupEventListeners() {
        if (this.contracts.FlashFlowAgent) {
            this.contracts.FlashFlowAgent.on("AssetCreated", (assetId, originator, faceAmount, unlockable, riskScore, basketId, assetType, documentHash) => {
                console.log("🎉 New Asset Created:", { assetId, originator, faceAmount: ethers.utils.formatEther(faceAmount) });
            });

            this.contracts.FlashFlowAgent.on("AssetFunded", (assetId, unlockAmount) => {
                console.log("💰 Asset Funded:", { assetId, unlockAmount: ethers.utils.formatEther(unlockAmount) });
            });
        }

        if (this.contracts.MainPool) {
            this.contracts.MainPool.on("FundsReleased", (assetId, originator, amount) => {
                console.log("🚀 Funds Released:", { assetId, originator, amount: ethers.utils.formatEther(amount) });
            });
        }
    }

    // Utility methods
    generateAssetId(originatorAddress, timestamp) {
        return ethers.utils.keccak256(
            ethers.utils.defaultAbiCoder.encode(
                ["address", "uint256"],
                [originatorAddress, timestamp]
            )
        );
    }

    generateBasketId(assetType, timestamp) {
        return ethers.utils.keccak256(
            ethers.utils.defaultAbiCoder.encode(
                ["string", "uint256"],
                [assetType, timestamp]
            )
        );
    }
}

// Global instance
let web3Service = null;

const initBlockchain = async () => {
    if (!web3Service) {
        web3Service = new Web3Service();
        await web3Service.initialize();
        web3Service.setupEventListeners();
    }
    return web3Service;
};

const getWeb3Service = () => {
    if (!web3Service) {
        throw new Error("Web3Service not initialized. Call initBlockchain() first.");
    }
    return web3Service;
};

module.exports = { initBlockchain, getWeb3Service, Web3Service };