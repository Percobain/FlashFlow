const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Counter", function () {
  async function deploy(initial = 0) {
    const [owner, other] = await ethers.getSigners();
    const Counter = await ethers.getContractFactory("Counter");
    const counter = await Counter.deploy(initial);
    await counter.waitForDeployment();
    return { counter, owner, other, initial };
  }

  it("deploys with initial value", async function () {
    const { counter } = await deploy(5);
    expect(await counter.get()).to.equal(5n);
  });

  it("increments", async function () {
    const { counter } = await deploy(0);
    await (await counter.increment()).wait();
    expect(await counter.get()).to.equal(1n);
  });

  it("decrements and reverts on underflow", async function () {
    const { counter } = await deploy(2);
    await (await counter.decrement()).wait();
    expect(await counter.get()).to.equal(1n);

    await expect(counter.decrement()).to.not.be.reverted;
    expect(await counter.get()).to.equal(0n);

    await expect(counter.decrement()).to.be.revertedWith("Counter: underflow");
  });

  it("set and reset", async function () {
    const { counter } = await deploy(3);
    await (await counter.set(42)).wait();
    expect(await counter.get()).to.equal(42n);

    await (await counter.reset()).wait();
    expect(await counter.get()).to.equal(0n);
  });

  it("emits expected events", async function () {
    const { counter, owner } = await deploy(1);

    await expect(counter.increment())
      .to.emit(counter, "Increment")
      .withArgs(owner.address, 2);

    await expect(counter.decrement())
      .to.emit(counter, "Decrement")
      .withArgs(owner.address, 1);

    await expect(counter.set(10))
      .to.emit(counter, "Set")
      .withArgs(owner.address, 10);

    await expect(counter.reset())
      .to.emit(counter, "Reset")
      .withArgs(owner.address);
  });
});