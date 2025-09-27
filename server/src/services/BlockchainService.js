const { ethers } = require('ethers');
const FlashFlowABI = require('../abis/FlashFlow');

class BlockchainService {
  constructor() {
    // Read-only provider
    this.provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    
    // Contract instances
    this.flashFlow = new ethers.Contract(
      process.env.FLASHFLOW_ADDRESS,
      FlashFlowABI,
      this.provider
    );
    
    this.fUSD = new ethers.Contract(
      process.env.FUSD_ADDRESS,
      [
        'function balanceOf(address) view returns (uint256)',
        'function approve(address spender, uint256 amount) returns (bool)',
        'function mint(address to, uint256 amount) returns (bool)'
      ],
      this.provider
    );
  }

  // Get transaction data for frontend to execute
  getCreateAssetTxData({ assetId, amount, riskScore, assetType }) {
    const iface = new ethers.Interface(FlashFlowABI);
    const data = iface.encodeFunctionData('createAsset', [
      assetId,
      ethers.parseEther(amount.toString()),
      riskScore,
      assetType
    ]);

    return {
      to: process.env.FLASHFLOW_ADDRESS,
      data,
      value: '0x0'
    };
  }

  getFundAssetTxData(assetId) {
    const iface = new ethers.Interface(FlashFlowABI);
    const data = iface.encodeFunctionData('fundAsset', [assetId]);

    return {
      to: process.env.FLASHFLOW_ADDRESS,
      data,
      value: '0x0'
    };
  }

  getInvestTxData(basketId, amount) {
    const iface = new ethers.Interface(FlashFlowABI);
    const data = iface.encodeFunctionData('investInBasket', [
      basketId,
      ethers.parseEther(amount.toString())
    ]);

    return {
      to: process.env.FLASHFLOW_ADDRESS,
      data,
      value: '0x0'
    };
  }

  getRepaymentTxData(assetId, amount) {
    const iface = new ethers.Interface(FlashFlowABI);
    const data = iface.encodeFunctionData('simulateRepayment', [
      assetId,
      ethers.parseEther(amount.toString())
    ]);

    return {
      to: process.env.FLASHFLOW_ADDRESS,
      data,
      value: '0x0'
    };
  }

  // Read functions
  async getBasketStats(basketId) {
    try {
      const stats = await this.flashFlow.getBasketStats(basketId);
      return {
        totalValue: ethers.formatEther(stats[0]),
        totalInvested: ethers.formatEther(stats[1]),
        investorCount: stats[2].toString()
      };
    } catch (error) {
      return { totalValue: '0', totalInvested: '0', investorCount: '0' };
    }
  }

  async getPoolStats() {
    const poolBalance = await this.flashFlow.getPoolBalance();
    return {
      poolBalance: ethers.formatEther(poolBalance),
      contractAddress: process.env.FLASHFLOW_ADDRESS,
      fUSDAddress: process.env.FUSD_ADDRESS
    };
  }
}

module.exports = new BlockchainService();