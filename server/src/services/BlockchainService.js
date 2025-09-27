const { ethers } = require("ethers");
const FlashFlowAgent = require("../abis/FlashFlowAgent");
const FlashFlowToken = require("../abis/FlashFlowToken");
const MainPool = require("../abis/MainPool");
const IERC20Simple = require("../abis/IERC20Simple");
const CONSTANTS = require("../config/constants");

class BlockchainService {
    constructor() {
        // Initialize provider for Kadena EVM testnet (read-only)
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

        console.log(`✅ Read-only blockchain service initialized`);
        console.log(`🔗 Connected to: ${CONSTANTS.NETWORK.RPC_URL}`);
        console.log(`📄 Contracts:`);
        console.log(`   Token: ${CONSTANTS.CONTRACTS.TOKEN}`);
        console.log(`   Pool: ${CONSTANTS.CONTRACTS.POOL}`);
        console.log(`   Agent: ${CONSTANTS.CONTRACTS.AGENT}`);

        // Setup event listeners for database sync
        this.setupEventListeners();
    }

    // ===== TRANSACTION DATA PROVIDERS =====
    
    getCreateAssetTransactionData(assetData) {
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

        // Ensure assetId and basketId are properly formatted as bytes32
        const formattedAssetId = assetId.startsWith('0x') ? assetId : `0x${assetId}`;
        const formattedBasketId = basketId.startsWith('0x') ? basketId : `0x${basketId}`;
        const formattedDocumentHash = documentHash ? (documentHash.startsWith('0x') ? documentHash : `0x${documentHash}`) : '0x0000000000000000000000000000000000000000000000000000000000000000';

        const calldata = this.agentContract.interface.encodeFunctionData("createAsset", [
            formattedAssetId,
            originator,
            ethers.utils.parseEther(faceAmount.toString()),
            ethers.utils.parseEther(unlockable.toString()),
            riskScore,
            formattedBasketId,
            assetType,
            formattedDocumentHash
        ]);

        return {
            to: CONSTANTS.CONTRACTS.AGENT,
            data: calldata,
            gasLimit: 500000,
            value: "0"
        };
    }

    getMarkFundedTransactionData(assetId, unlockAmount) {
        const formattedAssetId = assetId.startsWith('0x') ? assetId : `0x${assetId}`;
        
        const calldata = this.agentContract.interface.encodeFunctionData("markFunded", [
            formattedAssetId,
            ethers.utils.parseEther(unlockAmount.toString())
        ]);

        return {
            to: CONSTANTS.CONTRACTS.AGENT,
            data: calldata,
            gasLimit: 200000,
            value: "0"
        };
    }

    getReleaseFundsTransactionData(assetId, originator, amount) {
        const formattedAssetId = assetId.startsWith('0x') ? assetId : `0x${assetId}`;
        
        const calldata = this.poolContract.interface.encodeFunctionData("releaseFunds", [
            formattedAssetId,
            originator,
            ethers.utils.parseEther(amount.toString())
        ]);

        return {
            to: CONSTANTS.CONTRACTS.POOL,
            data: calldata,
            gasLimit: 300000,
            value: "0"
        };
    }

    getRecordInvestmentTransactionData(assetId, investor, amount) {
        const formattedAssetId = assetId.startsWith('0x') ? assetId : `0x${assetId}`;
        
        const calldata = this.agentContract.interface.encodeFunctionData("recordInvestment", [
            formattedAssetId,
            investor,
            ethers.utils.parseEther(amount.toString())
        ]);

        return {
            to: CONSTANTS.CONTRACTS.AGENT,
            data: calldata,
            gasLimit: 250000,
            value: "0"
        };
    }

    getConfirmPaymentTransactionData(assetId, amount) {
        const formattedAssetId = assetId.startsWith('0x') ? assetId : `0x${assetId}`;
        
        const calldata = this.agentContract.interface.encodeFunctionData("confirmPayment", [
            formattedAssetId,
            ethers.utils.parseEther(amount.toString())
        ]);

        return {
            to: CONSTANTS.CONTRACTS.AGENT,
            data: calldata,
            gasLimit: 250000,
            value: "0"
        };
    }

    getApproveTokenTransactionData(spender, amount) {
        const calldata = this.tokenContract.interface.encodeFunctionData("approve", [
            spender,
            ethers.utils.parseEther(amount.toString())
        ]);

        return {
            to: CONSTANTS.CONTRACTS.TOKEN,
            data: calldata,
            gasLimit: 100000,
            value: "0"
        };
    }

    getDepositToPoolTransactionData(amount) {
        const calldata = this.poolContract.interface.encodeFunctionData("deposit", [
            ethers.utils.parseEther(amount.toString())
        ]);

        return {
            to: CONSTANTS.CONTRACTS.POOL,
            data: calldata,
            gasLimit: 200000,
            value: "0"
        };
    }

    // ===== EVENT LISTENERS FOR DATABASE SYNC =====

    setupEventListeners() {
        try {
            // Listen for AssetCreated events
            this.agentContract.on("AssetCreated", async (assetId, originator, faceAmount, unlockable, riskScore, basketId, assetType, documentHash, event) => {
                console.log(`🎉 AssetCreated event detected:`, {
                    assetId,
                    originator,
                    faceAmount: ethers.utils.formatEther(faceAmount),
                    assetType
                });

                try {
                    // Import Asset model here to avoid circular dependencies
                    const Asset = require('../models/Asset');
                    
                    // Create or update asset in database
                    await Asset.findOneAndUpdate(
                        { assetId },
                        {
                            assetId,
                            originatorAddress: originator,
                            faceAmount: parseFloat(ethers.utils.formatEther(faceAmount)),
                            unlockable: parseFloat(ethers.utils.formatEther(unlockable)),
                            riskScore,
                            basketId,
                            assetType,
                            documentHash,
                            status: 'created',
                            createdAt: new Date(),
                            blockchainTxHash: event.transactionHash,
                            blockNumber: event.blockNumber
                        },
                        { upsert: true, new: true }
                    );
                    
                    console.log(`✅ Asset ${assetId} synced to database`);
                } catch (error) {
                    console.error(`❌ Failed to sync AssetCreated event:`, error);
                }
            });

            // Listen for AssetFunded events
            this.agentContract.on("AssetFunded", async (assetId, unlockAmount, event) => {
                console.log(`💰 AssetFunded event detected:`, {
                    assetId,
                    unlockAmount: ethers.utils.formatEther(unlockAmount)
                });

                try {
                    const Asset = require('../models/Asset');
                    
                    await Asset.updateOne(
                        { assetId },
                        {
                            $set: {
                                status: 'funded',
                                fundedAt: new Date(),
                                unlockable: parseFloat(ethers.utils.formatEther(unlockAmount))
                            }
                        }
                    );
                    
                    console.log(`✅ Asset ${assetId} marked as funded in database`);
                } catch (error) {
                    console.error(`❌ Failed to sync AssetFunded event:`, error);
                }
            });

            // Listen for InvestmentRecorded events
            this.agentContract.on("InvestmentRecorded", async (assetId, investor, amount, event) => {
                console.log(`📈 InvestmentRecorded event detected:`, {
                    assetId,
                    investor,
                    amount: ethers.utils.formatEther(amount)
                });

                try {
                    const Investment = require('../models/Investment');
                    
                    // Create investment record if it doesn't exist
                    const investmentData = {
                        investmentId: ethers.utils.keccak256(ethers.utils.defaultAbiCoder.encode(
                            ["bytes32", "address", "uint256"],
                            [assetId, investor, amount]
                        )),
                        investorAddress: investor,
                        assetId,
                        amount: parseFloat(ethers.utils.formatEther(amount)),
                        status: 'active',
                        investedAt: new Date(),
                        blockchainTxHash: event.transactionHash,
                        blockNumber: event.blockNumber
                    };

                    await Investment.findOneAndUpdate(
                        { assetId, investorAddress: investor },
                        { $inc: { amount: investmentData.amount } },
                        { upsert: true, new: true, setDefaultsOnInsert: true }
                    );
                    
                    console.log(`✅ Investment for ${assetId} synced to database`);
                } catch (error) {
                    console.error(`❌ Failed to sync InvestmentRecorded event:`, error);
                }
            });

            // Listen for PaymentConfirmed events
            this.agentContract.on("PaymentConfirmed", async (assetId, amount, event) => {
                console.log(`💳 PaymentConfirmed event detected:`, {
                    assetId,
                    amount: ethers.utils.formatEther(amount)
                });

                try {
                    const Asset = require('../models/Asset');
                    
                    await Asset.updateOne(
                        { assetId },
                        {
                            $inc: { paidAmount: parseFloat(ethers.utils.formatEther(amount)) },
                            $set: { lastPaymentAt: new Date() }
                        }
                    );

                    // Check if fully paid
                    const asset = await Asset.findOne({ assetId });
                    if (asset && asset.paidAmount >= asset.faceAmount) {
                        await Asset.updateOne(
                            { assetId },
                            {
                                $set: {
                                    status: 'paid',
                                    paid: true,
                                    paidAt: new Date()
                                }
                            }
                        );
                    }
                    
                    console.log(`✅ Payment for ${assetId} synced to database`);
                } catch (error) {
                    console.error(`❌ Failed to sync PaymentConfirmed event:`, error);
                }
            });

            // Listen for FundsReleased events from MainPool
            this.poolContract.on("FundsReleased", async (assetId, originator, amount, event) => {
                console.log(`🚀 FundsReleased event detected:`, {
                    assetId,
                    originator,
                    amount: ethers.utils.formatEther(amount)
                });

                try {
                    const Transaction = require('../models/Transaction');
                    
                    // Create transaction record
                    await Transaction.create({
                        transactionId: ethers.utils.keccak256(event.transactionHash),
                        type: 'fund_release',
                        txHash: event.transactionHash,
                        from: CONSTANTS.CONTRACTS.POOL,
                        to: originator,
                        amount: parseFloat(ethers.utils.formatEther(amount)),
                        assetId,
                        status: 'confirmed',
                        confirmedAt: new Date(),
                        blockNumber: event.blockNumber
                    });
                    
                    console.log(`✅ Fund release for ${assetId} synced to database`);
                } catch (error) {
                    console.error(`❌ Failed to sync FundsReleased event:`, error);
                }
            });

            console.log(`✅ Event listeners setup complete`);
        } catch (error) {
            console.error(`❌ Failed to setup event listeners:`, error);
        }
    }

    // ===== READ-ONLY OPERATIONS =====

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

    // ===== UTILITY METHODS =====

    isDemoMode() {
        return true; // Always in user-tx mode now
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

    // ===== LEGACY METHODS (throw errors to guide migration) =====

    async createAsset() {
        throw new Error("Use getCreateAssetTransactionData() and let user sign the transaction");
    }

    async markFunded() {
        throw new Error("Use getMarkFundedTransactionData() and let user sign the transaction");
    }

    async releaseFunds() {
        throw new Error("Use getReleaseFundsTransactionData() and let user sign the transaction");
    }

    async recordInvestment() {
        throw new Error("Use getRecordInvestmentTransactionData() and let user sign the transaction");
    }

    async confirmPayment() {
        throw new Error("Use getConfirmPaymentTransactionData() and let user sign the transaction");
    }
}

module.exports = new BlockchainService();