const hre = require("hardhat");

async function main() {
  console.log("Checking Kadena EVM Testnet Connection...");
  
  try {
    // Get network info
    const network = await hre.ethers.provider.getNetwork();
    console.log(`Connected to: ${network.name} (Chain ID: ${network.chainId})`);
    
    // Verify we're on the correct network
    if (network.chainId === 5920n) {
      console.log("Connected to Kadena EVM Testnet");
    } else {
      console.log(`Unexpected chain ID. Expected 5920, got ${network.chainId}`);
    }
    
    // Get latest block
    const blockNumber = await hre.ethers.provider.getBlockNumber();
    console.log(`Latest block: ${blockNumber}`);
    
    // Check deployer account
    const [deployer] = await hre.ethers.getSigners();
    const deployerAddress = await deployer.getAddress();
    const balance = await hre.ethers.provider.getBalance(deployerAddress);
    
    console.log(`Deployer address: ${deployerAddress}`);
    console.log(`KDA balance: ${hre.ethers.formatEther(balance)} KDA`);
    
    if (balance === 0n) {
      console.log("\nYour account has no KDA balance!");
      console.log("Get testnet KDA from the faucet:");
      console.log("https://evm.kadena.io/");
      console.log(`Send KDA to: ${deployerAddress}`);
    } else {
      console.log("\nReady to deploy!");
    }
    
  } catch (error) {
    console.error("Connection failed:", error.message);
    console.log("\nTroubleshooting:");
    console.log("1. Check your SEPOLIA_API_KEY (private key) in .env file");
    console.log("2. Ensure you're connected to the internet");
    console.log("3. Verify the RPC URL is working");
    console.log("4. Make sure you have testnet KDA in your wallet");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});