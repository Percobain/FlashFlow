const { ethers } = require("ethers");
const FlashFlowAgent = require("../abis/FlashFlowAgent");
const FlashFlowToken = require("../abis/FlashFlowToken");
const MainPool = require("../abis/MainPool");

class BlockchainService {
    constructor() {
        this.provider = new ethers.providers.JsonRpcProvider(
            process.env.RPC_URL
        );

        // Only create wallet if private key is available
        if (process.env.PRIVATE_KEY_POOL) {
            this.wallet = new ethers.Wallet(
                process.env.PRIVATE_KEY_POOL,
                this.provider
            );
        } else {
            console.warn(
                "Warning: PRIVATE_KEY_POOL not set. Blockchain operations will be limited."
            );
            this.wallet = null;
        }

        // Use proper ABIs from contracts
        this.tokenABI = FlashFlowToken;
        this.poolABI = MainPool;
        this.agentABI = FlashFlowAgent;

        // Initialize contracts only if wallet is available
        if (this.wallet) {
            this.token = new ethers.Contract(
                process.env.TOKEN_ADDRESS,
                this.tokenABI,
                this.wallet
            );
            this.pool = new ethers.Contract(
                process.env.POOL_ADDRESS,
                this.poolABI,
                this.wallet
            );
            this.agent = new ethers.Contract(
                process.env.AGENT_ADDRESS,
                this.agentABI,
                this.wallet
            );
        } else {
            this.token = null;
            this.pool = null;
            this.agent = null;
        }
    }

    async createAsset(assetData) {
        if (!this.agent) {
            throw new Error(
                "Blockchain wallet not initialized. Cannot create asset."
            );
        }

        const {
            assetId,
            originator,
            faceAmount,
            unlockable,
            riskScore,
            basketId,
            assetType,
            documentHash,
        } = assetData;

        try {
            const tx = await this.agent.createAsset(
                assetId,
                originator,
                ethers.utils.parseEther(faceAmount.toString()),
                ethers.utils.parseEther(unlockable.toString()),
                riskScore,
                basketId,
                assetType,
                documentHash
            );

            await tx.wait();
            return tx;
        } catch (error) {
            console.error("Blockchain createAsset failed:", error);
            throw error;
        }
    }

    async markFunded(assetId, unlockAmount) {
        if (!this.agent) {
            throw new Error(
                "Blockchain wallet not initialized. Cannot mark as funded."
            );
        }

        try {
            const tx = await this.agent.markFunded(
                assetId,
                ethers.utils.parseEther(unlockAmount.toString())
            );
            await tx.wait();
            return tx;
        } catch (error) {
            console.error("Blockchain markFunded failed:", error);
            throw error;
        }
    }

    async releaseFunds(assetId, originator, amount) {
        if (!this.pool) {
            throw new Error(
                "Blockchain wallet not initialized. Cannot release funds."
            );
        }

        try {
            const tx = await this.pool.releaseFunds(
                assetId,
                originator,
                ethers.utils.parseEther(amount.toString())
            );
            await tx.wait();
            return tx;
        } catch (error) {
            console.error("Blockchain releaseFunds failed:", error);
            throw error;
        }
    }

    async recordInvestment(assetId, investor, amount) {
        if (!this.agent) {
            throw new Error(
                "Blockchain wallet not initialized. Cannot record investment."
            );
        }

        try {
            const tx = await this.agent.recordInvestment(
                assetId,
                investor,
                ethers.utils.parseEther(amount.toString())
            );
            await tx.wait();
            return tx;
        } catch (error) {
            console.error("Blockchain recordInvestment failed:", error);
            throw error;
        }
    }

    async confirmPayment(assetId, amount) {
        if (!this.agent) {
            throw new Error(
                "Blockchain wallet not initialized. Cannot confirm payment."
            );
        }

        try {
            const tx = await this.agent.confirmPayment(
                assetId,
                ethers.utils.parseEther(amount.toString())
            );
            await tx.wait();
            return tx;
        } catch (error) {
            console.error("Blockchain confirmPayment failed:", error);
            throw error;
        }
    }

    async getPoolBalance() {
        if (!this.pool) {
            console.warn(
                "Blockchain wallet not initialized. Cannot get pool balance."
            );
            return "0";
        }

        try {
            const balance = await this.pool.getPoolBalance();
            return ethers.utils.formatEther(balance);
        } catch (error) {
            console.error("Failed to get pool balance:", error);
            return "0";
        }
    }
}

module.exports = new BlockchainService();
