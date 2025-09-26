const { ethers } = require("ethers");

const initBlockchain = () => {
    // Using ethers v5 provider API
    const rpcUrl =
        process.env.RPC_URL ||
        "https://evm-testnet.chainweb.com/chainweb/0.0/evm-testnet/chain/20/evm/rpc";
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);

    const privateKey = process.env.PRIVATE_KEY_POOL;
    if (!privateKey) {
        console.warn(
            "Warning: PRIVATE_KEY_POOL is not set. Blockchain wallet will not be initialized."
        );
        console.log(`Blockchain connected to: ${rpcUrl}`);
        return { provider, wallet: null };
    }

    const wallet = new ethers.Wallet(privateKey, provider);

    console.log(`Blockchain connected to: ${rpcUrl}`);
    console.log(`Wallet address: ${wallet.address}`);

    return { provider, wallet };
};

module.exports = { initBlockchain };
