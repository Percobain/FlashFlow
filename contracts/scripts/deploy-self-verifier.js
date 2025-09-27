const { ethers } = require("hardhat");

async function main() {
    console.log("🚀 Deploying SelfVerifier to Celo Sepolia...");

    // Self Protocol's Identity Verification Hub V2 address on Celo Sepolia
    const IDENTITY_HUB_V2_ADDRESS = "0x16ECBA51e18a4a7e61fdC417f0d47AFEeDfbed74";
    
    // Use string scope (not the config object)
    const SCOPE_STRING = "flashflow-protocol";

    console.log("📋 Deployment Parameters:");
    console.log("   Identity Hub V2:", IDENTITY_HUB_V2_ADDRESS);
    console.log("   Scope String:", SCOPE_STRING);

    try {
        // Get deployer account
        const [deployer] = await ethers.getSigners();
        const deployerAddress = await deployer.getAddress();
        console.log("🔑 Deploying with account:", deployerAddress);
        
        // Check balance
        const balance = await ethers.provider.getBalance(deployerAddress);
        console.log("💰 Account balance:", ethers.formatEther(balance), "CELO");

        if (balance === 0n) {
            console.error("❌ Deployer has no CELO balance. Please fund the account first.");
            console.log("🔗 Get testnet CELO from: https://faucet.celo.org/alfajores");
            process.exit(1);
        }

        // Deploy SelfVerifier with correct parameters
        console.log("⏳ Deploying SelfVerifier contract...");
        const SelfVerifier = await ethers.getContractFactory("SelfVerifier");
        
        const selfVerifier = await SelfVerifier.deploy(
            IDENTITY_HUB_V2_ADDRESS,
            SCOPE_STRING  // Only 2 parameters needed!
        );

        console.log("⏳ Waiting for deployment confirmation...");
        await selfVerifier.waitForDeployment(); // Updated method
        
        const selfVerifierAddress = await selfVerifier.getAddress(); // Updated method
        console.log("✅ SelfVerifier deployed to:", selfVerifierAddress);
        console.log("🔍 View on explorer:", `https://celo-sepolia.blockscout.com/address/${selfVerifierAddress}`);

        // Get the verification config ID
        console.log("📝 Getting verification config...");
        const configId = await selfVerifier.verificationConfigId();
        console.log("📝 Verification Config ID:", configId);

        // Get deployment transaction hash
        const deploymentTx = selfVerifier.deploymentTransaction();
        console.log("🔗 Deployment Transaction:", deploymentTx.hash);

        // Create deployment directory if it doesn't exist
        const fs = require('fs');
        const path = require('path');
        const deploymentsDir = path.join(__dirname, '../deployments');
        if (!fs.existsSync(deploymentsDir)) {
            fs.mkdirSync(deploymentsDir, { recursive: true });
        }

        // Save deployment info
        const deployment = {
            network: "celoSepoliaTestnet",
            chainId: 11142220, // Celo Sepolia testnet
            timestamp: new Date().toISOString(),
            deployer: deployerAddress,
            contracts: {
                selfVerifier: selfVerifierAddress,
                identityHub: IDENTITY_HUB_V2_ADDRESS
            },
            config: {
                scopeString: SCOPE_STRING,
                verificationConfigId: configId
            },
            transactionHash: deploymentTx.hash
        };

        const deploymentFile = path.join(deploymentsDir, 'celo-alfajores.json');
        fs.writeFileSync(deploymentFile, JSON.stringify(deployment, null, 2));

        console.log("📄 Deployment info saved to:", deploymentFile);

        // Display summary
        console.log("\n🎉 Deployment Complete!");
        console.log("═".repeat(60));
        console.log("Contract Addresses:");
        console.log(`   • SelfVerifier:    ${selfVerifierAddress}`);
        console.log(`   • Identity Hub:    ${IDENTITY_HUB_V2_ADDRESS}`);
        console.log("═".repeat(60));
        
        console.log("\nEnvironment Variables for Backend:");
        console.log(`SELF_VERIFIER_ADDRESS=${selfVerifierAddress}`);
        console.log(`SELF_CONFIG_ID=${configId}`);
        console.log(`CELO_RPC_URL=https://alfajores-forno.celo-testnet.org`);

        console.log("\nNext Steps:");
        console.log("1. Add the environment variables to your .env file");
        console.log("2. Update your backend to use Self verification");
        console.log("3. Integrate the frontend with Self SDK");
        
        // Test contract functions
        console.log("\n🧪 Testing contract functions...");
        
        const hubAddress = await selfVerifier.getHubAddress();
        console.log("   Hub Address:", hubAddress);
        
        const scope = await selfVerifier.getScope();
        console.log("   Scope:", scope.toString());
        
        const contractInfo = await selfVerifier.getContractInfo();
        console.log("   Contract Info:", {
            hub: contractInfo.hub,
            configId: contractInfo.configId,
            scopeString: contractInfo.scopeString
        });

        console.log("\n✅ All tests passed!");

    } catch (error) {
        console.error("❌ Deployment failed:", error);
        
        if (error.reason) {
            console.error("   Reason:", error.reason);
        }
        if (error.code) {
            console.error("   Code:", error.code);
        }
        if (error.data) {
            console.error("   Data:", error.data);
        }
        
        throw error;
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });