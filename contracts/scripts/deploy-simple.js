const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Deploying Simplified FlashFlow to Kadena Testnet Chain 20...");
  
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  
  // Get network info
  const network = await hre.ethers.provider.getNetwork();
  console.log(`Network: Chain ID ${network.chainId}`);
  
  // Using existing fUSD token
  const FUSD_ADDRESS = "0xAdB17C7D41c065C0c57D69c7B4BC97A6fcD4D117";
  
  // Deploy FlashFlow contract
  console.log("\n📄 Deploying FlashFlow contract...");
  const FlashFlow = await hre.ethers.getContractFactory("FlashFlow");
  const flashFlow = await FlashFlow.deploy(FUSD_ADDRESS);
  await flashFlow.waitForDeployment();
  
  const flashFlowAddress = await flashFlow.getAddress();
  console.log("✅ FlashFlow deployed to:", flashFlowAddress);
  
  // Pre-fund the pool with 100M fUSD
  console.log("\n💰 Pre-funding pool with 100M fUSD...");
  const fUSD = await hre.ethers.getContractAt("IERC20", FUSD_ADDRESS);
  
  // First, mint fUSD to deployer if needed (assuming fUSD has public mint)
  try {
    const FlashFlowToken = await hre.ethers.getContractAt("FlashFlowToken", FUSD_ADDRESS);
    const mintAmount = hre.ethers.parseEther("100000000"); // 100M
    const mintTx = await FlashFlowToken.mint(deployer.address, mintAmount);
    await mintTx.wait();
    console.log("✅ Minted 100M fUSD to deployer");
  } catch (e) {
    console.log("⚠️  Could not mint fUSD (might not have permission)");
  }
  
  // Transfer 100M fUSD to FlashFlow contract
  const transferAmount = hre.ethers.parseEther("100000000"); // 100M
  const transferTx = await fUSD.transfer(flashFlowAddress, transferAmount);
  await transferTx.wait();
  console.log("✅ Transferred 100M fUSD to FlashFlow pool");
  
  // Sync pool balance
  const syncTx = await flashFlow.syncPoolBalance();
  await syncTx.wait();
  console.log("✅ Synced pool balance");
  
  // Verify pool balance
  const poolBalance = await flashFlow.getPoolBalance();
  console.log("✅ Pool balance:", hre.ethers.formatEther(poolBalance), "fUSD");
  
  // Save deployment
  const deployment = {
    network: "kadena-testnet",
    chainId: Number(network.chainId),
    chainName: "Kadena EVM Testnet Chain 20",
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      fUSD: FUSD_ADDRESS,
      flashFlow: flashFlowAddress
    },
    initialPoolBalance: hre.ethers.formatEther(poolBalance),
    transactionHashes: {
      deployment: flashFlow.deploymentTransaction().hash,
      funding: transferTx.hash,
      sync: syncTx.hash
    }
  };
  
  // Save to deployments directory
  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  
  const deploymentPath = path.join(deploymentsDir, "kda-testnet.json");
  fs.writeFileSync(deploymentPath, JSON.stringify(deployment, null, 2));
  
  console.log("\n" + "=".repeat(60));
  console.log("🎉 Deployment Complete!");
  console.log("=".repeat(60));
  console.log("📍 Contract Addresses:");
  console.log(`   • fUSD Token:  ${FUSD_ADDRESS}`);
  console.log(`   • FlashFlow:   ${flashFlowAddress}`);
  console.log(`   • Pool Balance: ${hre.ethers.formatEther(poolBalance)} fUSD`);
  console.log("=".repeat(60));
  
  // Environment variables
  console.log("\n📝 Add to .env files:");
  console.log("\n🖥️  Server .env:");
  console.log(`FUSD_ADDRESS=${FUSD_ADDRESS}`);
  console.log(`FLASHFLOW_ADDRESS=${flashFlowAddress}`);
  console.log(`PRIVATE_KEY=${process.env.SEPOLIA_API_KEY || 'your_private_key_here'}`);
  console.log(`RPC_URL=https://evm-testnet.kadena.io`);
  console.log(`GEMINI_API_KEY=your_gemini_api_key`);
  console.log(`DATABASE_URL=mongodb://localhost:27017/flashflow`);
  console.log(`R2_ACCOUNT_ID=your_cloudflare_account_id`);
  console.log(`R2_ACCESS_KEY_ID=your_r2_access_key`);
  console.log(`R2_SECRET_ACCESS_KEY=your_r2_secret_key`);
  console.log(`R2_BUCKET_NAME=flashflow-assets`);
  
  console.log("\n💻 Client .env:");
  console.log(`VITE_FUSD_ADDRESS=${FUSD_ADDRESS}`);
  console.log(`VITE_FLASHFLOW_ADDRESS=${flashFlowAddress}`);
  console.log(`VITE_CHAIN_ID=5920`);
  console.log(`VITE_API_URL=http://localhost:3000`);
  
  console.log("\n🔍 Block Explorer:");
  console.log(`https://chain-20.evm-testnet-blockscout.chainweb.com/address/${flashFlowAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});