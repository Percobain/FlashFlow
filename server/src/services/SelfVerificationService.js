const { ethers } = require('ethers');
const User = require('../models/User');

class SelfVerificationService {
    constructor() {
        try {
            // Initialize Celo provider
            this.celoProvider = new ethers.providers.JsonRpcProvider(
                process.env.CELO_RPC_URL || 'https://alfajores-forno.celo-testnet.org'
            );

            // Initialize contract instance
            this.initializeContract();
        } catch (error) {
            console.error('SelfVerificationService initialization error:', error);
            this.contract = null;
        }
    }

    async initializeContract() {
        try {
            // Import the SelfVerifier ABI dynamically to handle ES6 exports
            const { SelfVerifier: SelfVerifierABI } = await import('../abis/SelfVerifier.js');
            
            // Create contract instance
            this.contract = new ethers.Contract(
                process.env.SELF_VERIFIER_ADDRESS || '0xc47bA4fA2B3713Fe1B1d62b5aF18B649aD36329A',
                SelfVerifierABI,
                this.celoProvider
            );

            console.log('✅ SelfVerifier contract initialized');
        } catch (error) {
            console.error('❌ Failed to initialize SelfVerifier contract:', error);
            this.contract = null;
        }
    }

    /**
     * Get contract information
     */
    getContractInfo() {
        return {
            address: process.env.SELF_VERIFIER_ADDRESS || '0xc47bA4fA2B3713Fe1B1d62b5aF18B649aD36329A',
            network: 'Celo Sepolia',
            configId: process.env.SELF_CONFIG_ID || '0xc52f992ebee4435b00b65d2c74b12435e96359d1ccf408041528414e6ea687bc',
            rpcUrl: process.env.CELO_RPC_URL || 'https://alfajores-forno.celo-testnet.org'
        };
    }

    /**
     * Skip KYC verification for demo purposes
     * Updates user KYC status to 'verified' without actual verification
     */
    async skipKYCVerification(userAddress) {
        try {
            let user = await User.findOne({ address: userAddress.toLowerCase() });
            
            // Create user if doesn't exist
            if (!user) {
                user = new User({
                    address: userAddress.toLowerCase(),
                    userType: ['investor'],
                    kycStatus: 'not_started'
                });
            }

            // Update KYC status to verified (demo mode)
            user.kycStatus = 'verified';
            user.kycData = {
                verificationMethod: 'demo_skip',
                verifiedAt: new Date(),
                country: 'DEMO',
                ageVerified: true,
                note: 'KYC skipped for demo purposes'
            };
            user.settings = {
                ...user.settings,
                skipVerification: true
            };

            await user.save();

            return {
                success: true,
                user: {
                    address: user.address,
                    kycStatus: user.kycStatus,
                    verificationMethod: 'demo_skip'
                }
            };
        } catch (error) {
            console.error('Skip KYC verification error:', error);
            throw error;
        }
    }

    /**
     * Generate Self Protocol verification instructions
     * Since Self Protocol verification requires the mobile app, we provide instructions
     */
    generateVerificationUrl(userAddress) {
        // Self Protocol verification is done through their mobile app, not a web URL
        // Users need to download the Self app and follow the verification process
        
        const contractInfo = this.getContractInfo();
        
        return {
            // This is not a clickable URL, but instructions for users
            mobileAppRequired: true,
            instructions: {
                step1: "Download the Self Protocol mobile app from app store",
                step2: "Create a Self ID if you don't have one",
                step3: "Go to 'Verify Identity' section in the app",
                step4: "Scan your passport using NFC verification",
                step5: "Generate your zero-knowledge proof",
                step6: "Submit the proof to our contract on Celo Sepolia",
                step7: "Return to FlashFlow to complete verification"
            },
            contractAddress: contractInfo.address,
            networkInfo: {
                name: "Celo Sepolia Testnet",
                chainId: 11142220,
                rpcUrl: "https://forno.celo-sepolia.celo-testnet.org"
            },
            configId: contractInfo.configId,
            userAddress: userAddress,
            // Alternative: QR code data for mobile app deep linking
            qrCodeData: {
                contract: contractInfo.address,
                network: "celo-sepolia", 
                user: userAddress,
                config: contractInfo.configId
            }
        };
    }

    /**
     * Generate demo verification URL (for testing purposes)
     * This creates a mock verification page that simulates the Self Protocol flow
     */
    generateDemoVerificationUrl(userAddress) {
        const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const params = new URLSearchParams({
            mode: 'demo',
            contract: process.env.SELF_VERIFIER_ADDRESS || '0xc47bA4fA2B3713Fe1B1d62b5aF18B649aD36329A',
            config: process.env.SELF_CONFIG_ID || '0xc52f992ebee4435b00b65d2c74b12435e96359d1ccf408041528414e6ea687bc',
            user: userAddress,
            callback: `${baseUrl}/kyc-callback`
        });

        return `${baseUrl}/self-verification-demo?${params.toString()}`;
    }

    /**
     * Verify user's KYC status on blockchain
     * In production, this would check the actual Self Protocol verification
     */
    async verifyUserKYC(userAddress) {
        try {
            if (!this.contract) {
                console.warn('SelfVerifier contract not available, using database verification');
                const user = await User.findOne({ address: userAddress.toLowerCase() });
                return {
                    isVerified: user?.kycStatus === 'verified',
                    country: user?.kycData?.country,
                    ageVerified: user?.kycData?.ageVerified,
                    method: 'database'
                };
            }

            // Check verification status on blockchain
            try {
                const verificationResult = await this.contract.isUserVerified(userAddress);
                
                return {
                    isVerified: verificationResult.isVerified,
                    country: verificationResult.country,
                    ageVerified: verificationResult.ageVerified,
                    method: 'blockchain'
                };
            } catch (contractError) {
                console.warn('Contract call failed, falling back to database:', contractError.message);
                // Fallback to database check
                const user = await User.findOne({ address: userAddress.toLowerCase() });
                return {
                    isVerified: user?.kycStatus === 'verified',
                    country: user?.kycData?.country || 'UNKNOWN',
                    ageVerified: user?.kycData?.ageVerified || false,
                    method: 'database_fallback'
                };
            }
        } catch (error) {
            console.error('Verify user KYC error:', error);
            // Fallback to database check
            const user = await User.findOne({ address: userAddress.toLowerCase() });
            return {
                isVerified: user?.kycStatus === 'verified',
                country: user?.kycData?.country || 'UNKNOWN',
                ageVerified: user?.kycData?.ageVerified || false,
                method: 'database_fallback'
            };
        }
    }

    /**
     * Process Self Protocol callback (for real KYC)
     * This would be called when user completes verification
     */
    async processVerificationCallback(userAddress, verificationData) {
        try {
            let user = await User.findOne({ address: userAddress.toLowerCase() });
            
            if (!user) {
                user = new User({
                    address: userAddress.toLowerCase(),
                    userType: ['investor'],
                    kycStatus: 'not_started'
                });
            }

            // Update user with verification data
            user.kycStatus = verificationData.verified ? 'verified' : 'rejected';
            user.kycData = {
                verificationMethod: 'self_protocol',
                verifiedAt: new Date(),
                country: verificationData.country,
                ageVerified: verificationData.ageVerified,
                selfId: verificationData.selfId,
                txHash: verificationData.txHash
            };

            await user.save();

            return {
                success: true,
                user: {
                    address: user.address,
                    kycStatus: user.kycStatus,
                    verificationMethod: 'self_protocol'
                }
            };
        } catch (error) {
            console.error('Process verification callback error:', error);
            throw error;
        }
    }

    /**
     * Get user's verification status
     */
    async getUserVerificationStatus(userAddress) {
        try {
            const user = await User.findOne({ address: userAddress.toLowerCase() });
            if (!user) {
                return {
                    address: userAddress.toLowerCase(),
                    isVerified: false,
                    status: 'not_found',
                    canSkip: true,
                    skipEnabled: false
                };
            }

            return {
                address: user.address,
                isVerified: user.kycStatus === 'verified',
                status: user.kycStatus,
                verificationMethod: user.kycData?.verificationMethod,
                canSkip: user.kycStatus !== 'verified',
                skipEnabled: user.settings?.skipVerification || false
            };
        } catch (error) {
            console.error('Get user verification status error:', error);
            throw error;
        }
    }

    /**
     * Check verification status (alias for backward compatibility)
     */
    async checkVerificationStatus(userAddress) {
        return await this.verifyUserKYC(userAddress);
    }
}

module.exports = new SelfVerificationService();
