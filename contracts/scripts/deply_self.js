const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  
  const network = await hre.ethers.provider.getNetwork();
  console.log(`Network: ${network.name} (Chain ID: ${network.chainId})`);
  
  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  const deployerAddress = await deployer.getAddress();

  try {
    // Deploy fUSD Token with 100Trillion initial supply
    const SelfVerifier = await hre.ethers.getContractFactory("SelfVerifier");
    const token = await SelfVerifier.deploy();
    await token.waitForDeployment();
    
  } catch (error) {
    console.error("Deployment failed:", error);
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});