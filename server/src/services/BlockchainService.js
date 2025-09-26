const { ethers } = require("ethers");
const FlashFlowAgent = require("../abis/FlashFlowAgent");
const FlashFlowToken = require("../abis/FlashFlowToken");
const MainPool = require("../abis/MainPool");
const IERC20Simple = require("../abis/IERC20Simple");
const CONSTANTS = require("../config/constants");

class BlockchainService {
    constructor() {
        // Initialize provider for Kadena EVM testnet
        this.provider = new ethers.providers.JsonRpcProvider(
            CONSTANTS.NETWORK.RPC_URL
        );

        // Initialize read-only contracts
        this.tokenContract = new ethers.Contract(
            CONSTANTS.CONTRACTS.TOKEN,
            FlashFlowToken,
            this.provider
        );
        
        this.poolContract = new ethers.Contract(
            CONSTANTS.CONTRACTS.POOL,
            MainPool,
            this.provider
        );
        
        this.agentContract = new ethers.Contract(
            CONSTANTS.CONTRACTS.AGENT,
            FlashFlowAgent,
            this.provider
        );

        // Create wallet if private key is available
        if (process.env.PRIVATE_KEY) {
            try {
                this.wallet = new ethers.Wallet(
                    process.env.PRIVATE_KEY,
                    this.provider
                );
                
                // Create write-enabled contracts
                this.token = this.tokenContract.connect(this.wallet);
                this.pool = this.poolContract.connect(this.wallet);
                this.agent = this.agentContract.connect(this.wallet);

                console.log(`✅ Blockchain wallet initialized: ${this.wallet.address}`);
                console.log(`🔗 Connected to: ${CONSTANTS.NETWORK.RPC_URL}`);
                console.log(`📄 Contracts:`);
                console.log(`   Token: ${CONSTANTS.CONTRACTS.TOKEN}`);
                console.log(`   Pool: ${CONSTANTS.CONTRACTS.POOL}`);
                console.log(`   Agent: ${CONSTANTS.CONTRACTS.AGENT}`);
            } catch (error) {
                console.error("❌ Failed to initialize wallet:", error.message);
                this.wallet = null;
                this.token = null;
                this.pool = null;
                this.agent = null;
            }
        } else {
            console.warn("⚠️  PRIVATE_KEY not set. Add to .env for real blockchain transactions.");
            this.wallet = null;
            this.token = null;
            this.pool = null;
            this.agent = null;
        }
    }

    async createAsset(assetData) {
        if (!this.agent) {
            throw new Error("❌ No wallet configured. Set PRIVATE_KEY in .env for blockchain transactions.");
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
            console.log(`🚀 Creating asset on Kadena blockchain...`);
            console.log(`   Asset ID: ${assetId}`);
            console.log(`   Originator: ${originator}`);
            console.log(`   Face Amount: ${faceAmount} fUSD`);
            console.log(`   Risk Score: ${riskScore}`);

            // Prepare transaction
            const tx = await this.agent.createAsset(
                assetId,
                originator,
                ethers.utils.parseEther(faceAmount.toString()),
                ethers.utils.parseEther(unlockable.toString()),
                riskScore,
                basketId,
                assetType,
                documentHash,
                {
                    gasLimit: 500000 // Set gas limit for Kadena
                }
            );

            console.log(`⏳ Transaction sent: ${tx.hash}`);
            console.log(`🔍 Explorer: ${CONSTANTS.NETWORK.EXPLORER_URL}/tx/${tx.hash}`);

            // Wait for confirmation
            const receipt = await tx.wait();
            
            console.log(`✅ Asset created successfully!`);
            console.log(`   Block: ${receipt.blockNumber}`);
            console.log(`   Gas Used: ${receipt.gasUsed.toString()}`);

            return {
                hash: tx.hash,
                blockNumber: receipt.blockNumber,
                gasUsed: receipt.gasUsed.toString(),
                from: tx.from,
                to: tx.to,
                status: receipt.status
            };
        } catch (error) {
            console.error("❌ Blockchain createAsset failed:", error);
            
            // Parse error message for better debugging
            if (error.reason) {
                console.error(`   Reason: ${error.reason}`);
            }
            if (error.code) {
                console.error(`   Code: ${error.code}`);
            }
            
            throw new Error(`Blockchain transaction failed: ${error.reason || error.message}`);
        }
    }

    async markFunded(assetId, unlockAmount) {
        if (!this.agent) {
            throw new Error("❌ No wallet configured. Set PRIVATE_KEY in .env for blockchain transactions.");
        }

        try {
            console.log(`🚀 Marking asset as funded on blockchain...`);
            console.log(`   Asset ID: ${assetId}`);
            console.log(`   Unlock Amount: ${unlockAmount} fUSD`);

            const tx = await this.agent.markFunded(
                assetId,
                ethers.utils.parseEther(unlockAmount.toString()),
                {
                    gasLimit: 200000
                }
            );

            console.log(`⏳ Transaction sent: ${tx.hash}`);
            const receipt = await tx.wait();
            
            console.log(`✅ Asset marked as funded!`);
            console.log(`   Block: ${receipt.blockNumber}`);

            return {
                hash: tx.hash,
                blockNumber: receipt.blockNumber,
                gasUsed: receipt.gasUsed.toString()
            };
        } catch (error) {
            console.error("❌ Blockchain markFunded failed:", error);
            throw new Error(`Mark funded failed: ${error.reason || error.message}`);
        }
    }

    async releaseFunds(assetId, originator, amount) {
        if (!this.pool) {
            throw new Error("❌ No wallet configured. Set PRIVATE_KEY in .env for blockchain transactions.");
        }

        try {
            console.log(`🚀 Releasing funds from pool...`);
            console.log(`   Asset ID: ${assetId}`);
            console.log(`   To: ${originator}`);
            console.log(`   Amount: ${amount} fUSD`);

            // Check pool balance first
            const poolBalance = await this.getPoolBalance();
            console.log(`   Pool Balance: ${poolBalance} fUSD`);

            if (parseFloat(poolBalance) < amount) {
                throw new Error(`Insufficient pool balance. Available: ${poolBalance}, Required: ${amount}`);
            }

            const tx = await this.pool.releaseFunds(
                assetId,
                originator,
                ethers.utils.parseEther(amount.toString()),
                {
                    gasLimit: 300000
                }
            );

            console.log(`⏳ Transaction sent: ${tx.hash}`);
            const receipt = await tx.wait();
            
            console.log(`✅ Funds released successfully!`);
            console.log(`   Block: ${receipt.blockNumber}`);

            return {
                hash: tx.hash,
                blockNumber: receipt.blockNumber,
                gasUsed: receipt.gasUsed.toString()
            };
        } catch (error) {
            console.error("❌ Blockchain releaseFunds failed:", error);
            throw new Error(`Release funds failed: ${error.reason || error.message}`);
        }
    }

    async recordInvestment(assetId, investor, amount) {
        if (!this.agent) {
            throw new Error("❌ No wallet configured. Set PRIVATE_KEY in .env for blockchain transactions.");
        }

        try {
            console.log(`🚀 Recording investment on blockchain...`);
            console.log(`   Asset ID: ${assetId}`);
            console.log(`   Investor: ${investor}`);
            console.log(`   Amount: ${amount} fUSD`);

            const tx = await this.agent.recordInvestment(
                assetId,
                investor,
                ethers.utils.parseEther(amount.toString()),
                {
                    gasLimit: 250000
                }
            );

            console.log(`⏳ Transaction sent: ${tx.hash}`);
            const receipt = await tx.wait();
            
            console.log(`✅ Investment recorded successfully!`);
            console.log(`   Block: ${receipt.blockNumber}`);

            return {
                hash: tx.hash,
                blockNumber: receipt.blockNumber,
                gasUsed: receipt.gasUsed.toString()
            };
        } catch (error) {
            console.error("❌ Blockchain recordInvestment failed:", error);
            throw new Error(`Record investment failed: ${error.reason || error.message}`);
        }
    }

    async confirmPayment(assetId, amount) {
        if (!this.agent) {
            throw new Error("❌ No wallet configured. Set PRIVATE_KEY in .env for blockchain transactions.");
        }

        try {
            console.log(`🚀 Confirming payment on blockchain...`);
            console.log(`   Asset ID: ${assetId}`);
            console.log(`   Amount: ${amount} fUSD`);

            const tx = await this.agent.confirmPayment(
                assetId,
                ethers.utils.parseEther(amount.toString()),
                {
                    gasLimit: 250000
                }
            );

            console.log(`⏳ Transaction sent: ${tx.hash}`);
            const receipt = await tx.wait();
            
            console.log(`✅ Payment confirmed successfully!`);
            console.log(`   Block: ${receipt.blockNumber}`);

            return {
                hash: tx.hash,
                blockNumber: receipt.blockNumber,
                gasUsed: receipt.gasUsed.toString()
            };
        } catch (error) {
            console.error("❌ Blockchain confirmPayment failed:", error);
            throw new Error(`Confirm payment failed: ${error.reason || error.message}`);
        }
    }

    // Token operations
    async mintTokens(to, amount) {
        if (!this.token) {
            throw new Error("❌ No wallet configured. Set PRIVATE_KEY in .env for blockchain transactions.");
        }

        try {
            console.log(`🚀 Minting tokens...`);
            console.log(`   To: ${to}`);
            console.log(`   Amount: ${amount} fUSD`);

            const tx = await this.token.mint(
                to,
                ethers.utils.parseEther(amount.toString()),
                {
                    gasLimit: 200000
                }
            );

            console.log(`⏳ Transaction sent: ${tx.hash}`);
            const receipt = await tx.wait();
            
            console.log(`✅ Tokens minted successfully!`);

            return {
                hash: tx.hash,
                blockNumber: receipt.blockNumber,
                gasUsed: receipt.gasUsed.toString()
            };
        } catch (error) {
            console.error("❌ Token minting failed:", error);
            throw new Error(`Token minting failed: ${error.reason || error.message}`);
        }
    }

    async depositToPool(amount) {
        if (!this.pool) {
            throw new Error("❌ No wallet configured. Set PRIVATE_KEY in .env for blockchain transactions.");
        }

        try {
            console.log(`🚀 Depositing to pool...`);
            console.log(`   Amount: ${amount} fUSD`);

            // First approve the pool to spend tokens
            const approveTx = await this.token.approve(
                CONSTANTS.CONTRACTS.POOL,
                ethers.utils.parseEther(amount.toString()),
                {
                    gasLimit: 100000
                }
            );

            console.log(`⏳ Approval sent: ${approveTx.hash}`);
            await approveTx.wait();
            console.log(`✅ Approval confirmed`);

            // Then deposit to pool
            const depositTx = await this.pool.deposit(
                ethers.utils.parseEther(amount.toString()),
                {
                    gasLimit: 200000
                }
            );

            console.log(`⏳ Deposit sent: ${depositTx.hash}`);
            const receipt = await depositTx.wait();
            
            console.log(`✅ Deposited to pool successfully!`);

            return {
                approveHash: approveTx.hash,
                depositHash: depositTx.hash,
                blockNumber: receipt.blockNumber,
                gasUsed: receipt.gasUsed.toString()
            };
        } catch (error) {
            console.error("❌ Pool deposit failed:", error);
            throw new Error(`Pool deposit failed: ${error.reason || error.message}`);
        }
    }

    // Read-only operations
    async getPoolBalance() {
        try {
            const balance = await this.poolContract.getPoolBalance();
            return ethers.utils.formatEther(balance);
        } catch (error) {
            console.error("Failed to get pool balance:", error);
            return "0";
        }
    }

    async getTokenBalance(address) {
        try {
            const balance = await this.tokenContract.balanceOf(address);
            return ethers.utils.formatEther(balance);
        } catch (error) {
            console.error("Failed to get token balance:", error);
            return "0";
        }
    }

    async getAssetInfo(assetId) {
        try {
            const info = await this.agentContract.getAssetInfo(assetId);
            return {
                originator: info.originator,
                faceAmount: ethers.utils.formatEther(info.faceAmount),
                unlockable: ethers.utils.formatEther(info.unlockable),
                riskScore: info.riskScore,
                basketId: info.basketId,
                funded: info.funded,
                paid: info.paid,
                paidAmount: ethers.utils.formatEther(info.paidAmount),
                assetType: info.assetType
            };
        } catch (error) {
            console.error("Failed to get asset info:", error);
            return null;
        }
    }

    async getBasketStats(basketId) {
        try {
            const stats = await this.agentContract.getBasketStats(basketId);
            return {
                totalValue: ethers.utils.formatEther(stats.totalValue),
                investedAmount: ethers.utils.formatEther(stats.investedAmount),
                assetCount: stats.assetCount.toNumber()
            };
        } catch (error) {
            console.error("Failed to get basket stats:", error);
            return null;
        }
    }

    async getProtocolStats() {
        try {
            const stats = await this.agentContract.getProtocolStats();
            return {
                totalAssets: stats._totalAssets.toNumber(),
                totalFunded: stats._totalFunded.toNumber(),
                totalPaid: stats._totalPaid.toNumber()
            };
        } catch (error) {
            console.error("Failed to get protocol stats:", error);
            return {
                totalAssets: 0,
                totalFunded: 0,
                totalPaid: 0
            };
        }
    }

    // Utility methods
    isDemoMode() {
        return !this.wallet;
    }

    getWalletAddress() {
        return this.wallet ? this.wallet.address : null;
    }

    getContractAddresses() {
        return CONSTANTS.CONTRACTS;
    }

    getNetworkInfo() {
        return CONSTANTS.NETWORK;
    }

    async getTransactionReceipt(txHash) {
        try {
            return await this.provider.getTransactionReceipt(txHash);
        } catch (error) {
            console.error("Failed to get transaction receipt:", error);
            return null;
        }
    }

    async getBlockNumber() {
        try {
            return await this.provider.getBlockNumber();
        } catch (error) {
            console.error("Failed to get block number:", error);
            return 0;
        }
    }
}

module.exports = new BlockchainService();
