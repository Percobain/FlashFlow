const hre = require("hardhat");

async function main() {
  const initialValue = Number(process.env.COUNTER_INITIAL ?? 0);

  console.log("Network:", hre.network.name);
  console.log("Deploying Counter with initial value:", initialValue);

  const Counter = await hre.ethers.getContractFactory("Counter");
  const counter = await Counter.deploy(initialValue);
  await counter.waitForDeployment();

  const address = await counter.getAddress();
  console.log("Counter deployed to:", address);

  const value = await counter.get();
  console.log("Current value:", value.toString());
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });