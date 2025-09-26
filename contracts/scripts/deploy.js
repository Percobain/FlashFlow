const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Deploying FlashFlow Protocol to Kadena EVM Testnet (Chain 20)...");
  
  // Get network info
  const network = await hre.ethers.provider.getNetwork();
  console.log(`Network: ${network.name} (Chain ID: ${network.chainId})`);
  
  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  const balance = await hre.ethers.provider.getBalance(deployerAddress);
  
  console.log(`Deployer: ${deployerAddress}`);
  console.log(`Balance: ${hre.ethers.formatEther(balance)} KDA`);
  
  if (balance === 0n) {
    console.error("Deployer has no KDA balance. Please fund the account first.");
    console.log("Get testnet KDA from: https://faucet.testnet.chainweb.com/");
    process.exit(1);
  }

  try {
    // Deploy fUSD Token with 100Trillion initial supply
    console.log("\nDeploying FlashFlowToken (fUSD)...");
    const FlashFlowToken = await hre.ethers.getContractFactory("FlashFlowToken");
    const token = await FlashFlowToken.deploy(
      hre.ethers.parseEther("100000000000000") // 100Trillion fUSD
    );
    await token.waitForDeployment();
    const tokenAddress = await token.getAddress();
    console.log("fUSD Token deployed to:", tokenAddress);

    // Deploy MainPool
    console.log("\nDeploying MainPool...");
    const MainPool = await hre.ethers.getContractFactory("MainPool");
    const pool = await MainPool.deploy(tokenAddress);
    await pool.waitForDeployment();
    const poolAddress = await pool.getAddress();
    console.log("MainPool deployed to:", poolAddress);

    // Deploy FlashFlowAgent
    console.log("\nDeploying FlashFlowAgent...");
    const FlashFlowAgent = await hre.ethers.getContractFactory("FlashFlowAgent");
    const agent = await FlashFlowAgent.deploy();
    await agent.waitForDeployment();
    const agentAddress = await agent.getAddress();
    console.log("FlashFlowAgent deployed to:", agentAddress);

    // Transfer 100M fUSD to pool for demo liquidity
    console.log("\nFunding MainPool with initial liquidity...");
    const transferTx = await token.transfer(poolAddress, hre.ethers.parseEther("100000000"));
    await transferTx.wait();
    console.log("Transferred 100M fUSD to MainPool");

    // Save deployment addresses
    const deployment = {
      network: "kdaTestnet",
      chainId: Number(network.chainId),
      timestamp: new Date().toISOString(),
      deployer: deployerAddress,
      contracts: {
        token: tokenAddress,
        pool: poolAddress,
        agent: agentAddress
      },
      transactionHashes: {
        token: token.deploymentTransaction().hash,
        pool: pool.deploymentTransaction().hash,
        agent: agent.deploymentTransaction().hash,
        funding: transferTx.hash
      }
    };

    // Save to deployments directory
    const deploymentsDir = path.join(__dirname, "../deployments");
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }
    
    const deploymentFile = path.join(deploymentsDir, "kda-testnet.json");
    fs.writeFileSync(deploymentFile, JSON.stringify(deployment, null, 2));
    console.log(`Deployment info saved to: ${deploymentFile}`);

    // Display summary
    console.log("\nDeployment Complete!");
    console.log("═".repeat(60));
    console.log("Contract Addresses:");
    console.log(`   • fUSD Token:      ${tokenAddress}`);
    console.log(`   • MainPool:        ${poolAddress}`);
    console.log(`   • FlashFlowAgent:  ${agentAddress}`);
    console.log("═".repeat(60));
    
    console.log("\nEnvironment Variables for Frontend:");
    console.log(`VITE_TOKEN_ADDRESS=${tokenAddress}`);
    console.log(`VITE_POOL_ADDRESS=${poolAddress}`);
    console.log(`VITE_AGENT_ADDRESS=${agentAddress}`);
    console.log(`VITE_CHAIN_ID=20`);
    console.log(`VITE_RPC_URL=https://evm-testnet.chainweb.com/chainweb/0.0/evm-testnet/chain/20/evm/rpc`);

    console.log("\nBlock Explorer:");
    console.log(`View your contracts at: https://chain-20.evm-testnet-blockscout.chainweb.com`);
    
  } catch (error) {
    console.error("Deployment failed:", error);
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});