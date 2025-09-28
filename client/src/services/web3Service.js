import { ethers } from 'ethers';
import { toast } from 'sonner';

// Import ABIs
import { FlashFlow } from '../abis/FlashFlow.js';
import { FlashFlowToken } from '../abis/FlashFlowToken.js';

// Contract addresses from environment
const CONTRACT_ADDRESSES = {
  FUSD: import.meta.env.VITE_FUSD_ADDRESS,
  FLASHFLOW: import.meta.env.VITE_FLASHFLOW_ADDRESS
};

// Network configuration - Updated for your specific network
const KADENA_NETWORK = {
  chainId: '0x1720', // 5920 in hex
  chainName: 'Kadena Chainweb EVM Testnet 20',
  nativeCurrency: {
    name: 'KDA',
    symbol: 'KDA',
    decimals: 18
  },
  rpcUrls: ['https://evm-testnet.chainweb.com/chainweb/0.0/evm-testnet/chain/20/evm/rpc'],
  blockExplorerUrls: ['http://chain-20.evm-testnet-blockscout.chainweb.com']
};

class Web3Service {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.contracts = {};
    this.account = null;
    this.chainId = null;
    this.isInitialized = false;
  }

  // Check if current chain is Kadena EVM - FIXED FUNCTION
  isKadenaEVM(chainId) {
    const numericChainId = typeof chainId === 'string' ? parseInt(chainId, 16) : chainId;
    // Accept both 5920 and 20 as valid Kadena EVM chain IDs
    return numericChainId === 5920 || numericChainId === 20;
  }

  // Check if user is on correct network - FIXED FUNCTION
  isCorrectNetwork() {
    if (!this.chainId) return false;
    return this.isKadenaEVM(this.chainId);
  }

  // Initialize Web3 connection
  async initialize() {
    try {
      if (!window.ethereum) {
        throw new Error('MetaMask not found. Please install MetaMask.');
      }

      this.provider = new ethers.BrowserProvider(window.ethereum);
      this.isInitialized = true;
      
      // Setup event listeners
      this.setupEventListeners();
      
      console.log('✅ Web3Service initialized');
    } catch (error) {
      console.error('❌ Web3Service initialization failed:', error);
      throw error;
    }
  }

  // Connect wallet
  async connectWallet() {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      this.account = accounts[0];
      this.signer = await this.provider.getSigner();

      // Get network info
      const network = await this.provider.getNetwork();
      this.chainId = parseInt(network.chainId);

      console.log('🔗 Connected to chain ID:', this.chainId);
      console.log('🔗 Network name:', this.getNetworkName());

      // Check if we're on Kadena EVM
      if (this.isKadenaEVM(this.chainId)) {
        console.log('✅ Already on Kadena EVM!');
        await this.initializeContracts();
        toast.success('Wallet connected to Kadena EVM!');
      } else {
        console.log('⚠️  Not on Kadena EVM, attempting to switch...');
        await this.switchToKadenaEVM();
      }

      console.log('✅ Wallet connected:', this.account);

      return {
        account: this.account,
        chainId: this.chainId
      };
    } catch (error) {
      console.error('❌ Wallet connection failed:', error);
      toast.error('Failed to connect wallet: ' + error.message);
      throw error;
    }
  }

  // Connect alias
  async connect() {
    return await this.connectWallet();
  }

  // Switch to Kadena network
  async switchToKadenaEVM() {
    try {
      console.log('🔄 Attempting to switch to Kadena EVM...');
      
      // First try to switch to existing network
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: KADENA_NETWORK.chainId }]
      });
      
      console.log('✅ Switched to Kadena EVM');
      
      // Update chainId after switch
      const network = await this.provider.getNetwork();
      this.chainId = parseInt(network.chainId);
      
      // Initialize contracts after successful switch
      if (this.isKadenaEVM(this.chainId)) {
        await this.initializeContracts();
      }
      
    } catch (switchError) {
      console.log('⚠️  Switch failed, attempting to add network...', switchError.code);
      
      // Network doesn't exist, add it
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [KADENA_NETWORK]
          });
          
          console.log('✅ Added Kadena EVM network');
          
          // Update chainId after adding
          const network = await this.provider.getNetwork();
          this.chainId = parseInt(network.chainId);
          
          // Initialize contracts after successful add
          if (this.isKadenaEVM(this.chainId)) {
            await this.initializeContracts();
          }
        } catch (addError) {
          console.error('❌ Failed to add Kadena EVM network:', addError);
          throw new Error('Failed to add Kadena EVM network. Please add it manually.');
        }
      } else {
        console.error('❌ Failed to switch to Kadena EVM:', switchError);
        throw switchError;
      }
    }
  }

  // Initialize contract instances
  async initializeContracts() {
    if (!this.signer) {
      throw new Error('Signer not available');
    }

    if (!this.isCorrectNetwork()) {
      console.warn('⚠️  Not on Kadena EVM, skipping contract initialization');
      return;
    }

    try {
      // FlashFlow main contract
      this.contracts.flashFlow = new ethers.Contract(
        CONTRACT_ADDRESSES.FLASHFLOW,
        FlashFlow,
        this.signer
      );

      // fUSD token contract
      this.contracts.fUSD = new ethers.Contract(
        CONTRACT_ADDRESSES.FUSD,
        FlashFlowToken,
        this.signer
      );

      // For backward compatibility with old code
      this.contracts.flashFlowAgent = this.contracts.flashFlow;
      this.contracts.mainPool = this.contracts.flashFlow;

      console.log('✅ Contracts initialized');
    } catch (error) {
      console.error('❌ Contract initialization failed:', error);
      throw error;
    }
  }

  // Smart contract interactions (only work on Kadena EVM)

  // 1. Create Asset
  async createAsset(assetId, amount, riskScore, assetType) {
    if (!this.isCorrectNetwork()) {
      throw new Error('Please switch to Kadena EVM Testnet');
    }

    try {
      const tx = await this.contracts.flashFlow.createAsset(
        assetId,
        ethers.parseEther(amount.toString()),
        riskScore,
        assetType
      );
      
      toast.success('Asset creation transaction sent!');
      return await tx.wait();
    } catch (error) {
      console.error('Create asset error:', error);
      toast.error('Failed to create asset: ' + error.message);
      throw error;
    }
  }

  // 2. Approve fUSD for FlashFlow contract
  async approveFUSD(amount) {
    if (!this.isCorrectNetwork()) {
      throw new Error('Please switch to Kadena EVM Testnet');
    }

    try {
      const tx = await this.contracts.fUSD.approve(
        CONTRACT_ADDRESSES.FLASHFLOW,
        ethers.parseEther(amount.toString())
      );
      
      toast.success('Approval transaction sent!');
      return await tx.wait();
    } catch (error) {
      console.error('Approve error:', error);
      toast.error('Failed to approve fUSD: ' + error.message);
      throw error;
    }
  }

  // 3. Fund Asset
  async fundAsset(assetId) {
    if (!this.isCorrectNetwork()) {
      throw new Error('Please switch to Kadena EVM Testnet');
    }

    try {
      const tx = await this.contracts.flashFlow.fundAsset(assetId);
      
      toast.success('Funding transaction sent!');
      return await tx.wait();
    } catch (error) {
      console.error('Fund asset error:', error);
      toast.error('Failed to fund asset: ' + error.message);
      throw error;
    }
  }

  // 4. Invest in Basket
  async investInBasket(basketId, amount) {
    if (!this.isCorrectNetwork()) {
      throw new Error('Please switch to Kadena EVM Testnet');
    }

    try {
      // First approve fUSD
      await this.approveFUSD(amount);
      
      // Then invest
      const tx = await this.contracts.flashFlow.investInBasket(
        basketId,
        ethers.parseEther(amount.toString())
      );
      
      toast.success('Investment transaction sent!');
      return await tx.wait();
    } catch (error) {
      console.error('Investment error:', error);
      toast.error('Failed to invest: ' + error.message);
      throw error;
    }
  }

  // 5. Simulate Repayment
  async simulateRepayment(assetId, amount) {
    if (!this.isCorrectNetwork()) {
      throw new Error('Please switch to Kadena EVM Testnet');
    }

    try {
      // First approve fUSD
      await this.approveFUSD(amount);
      
      // Then repay
      const tx = await this.contracts.flashFlow.simulateRepayment(
        assetId,
        ethers.parseEther(amount.toString())
      );
      
      toast.success('Repayment simulation sent!');
      return await tx.wait();
    } catch (error) {
      console.error('Repayment error:', error);
      toast.error('Failed to simulate repayment: ' + error.message);
      throw error;
    }
  }

  // 6. Mint fUSD (for testing)
  async mintFUSD(amount) {
    if (!this.isCorrectNetwork()) {
      throw new Error('Please switch to Kadena EVM Testnet');
    }

    try {
      const tx = await this.contracts.fUSD.mint(
        this.account,
        ethers.parseEther(amount.toString())
      );
      
      toast.success('fUSD mint transaction sent!');
      return await tx.wait();
    } catch (error) {
      console.error('Mint error:', error);
      toast.error('Failed to mint fUSD: ' + error.message);
      throw error;
    }
  }

  // Read functions

  // Get native balance (KDA)
  async getNativeBalance() {
    try {
      if (!this.account) return '0';
      const balance = await this.provider.getBalance(this.account);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error('Get native balance error:', error);
      return '0';
    }
  }

  // Get token balance (fUSD)
  async getTokenBalance() {
    try {
      if (!this.account || !this.contracts.fUSD || !this.isCorrectNetwork()) return '0';
      const balance = await this.contracts.fUSD.balanceOf(this.account);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error('Get token balance error:', error);
      return '0';
    }
  }

  // Get balances (combined)
  async getBalances() {
    try {
      const [native, fusd] = await Promise.all([
        this.getNativeBalance(),
        this.getTokenBalance()
      ]);

      return { native, fusd, token: fusd }; // token alias for backward compatibility
    } catch (error) {
      console.error('Get balances error:', error);
      return { native: '0', fusd: '0', token: '0' };
    }
  }

  // Get basket stats
  async getBasketStats(basketId) {
    try {
      const stats = await this.contracts.flashFlow.getBasketStats(basketId);
      return {
        totalValue: ethers.formatEther(stats[0]),
        totalInvested: ethers.formatEther(stats[1]),
        investorCount: stats[2].toString()
      };
    } catch (error) {
      console.error('Get basket stats error:', error);
      return { totalValue: '0', totalInvested: '0', investorCount: '0' };
    }
  }

  // Get pool stats
  async getPoolStats() {
    try {
      if (!this.isCorrectNetwork()) return { 
        poolBalance: '0', 
        totalLiquidity: '0',
        contractAddress: CONTRACT_ADDRESSES.FLASHFLOW,
        fUSDAddress: CONTRACT_ADDRESSES.FUSD
      };

      const balance = await this.contracts.flashFlow.getPoolBalance();
      return {
        poolBalance: ethers.formatEther(balance),
        totalLiquidity: ethers.formatEther(balance),
        contractAddress: CONTRACT_ADDRESSES.FLASHFLOW,
        fUSDAddress: CONTRACT_ADDRESSES.FUSD
      };
    } catch (error) {
      console.error('Get pool stats error:', error);
      return { 
        poolBalance: '0', 
        totalLiquidity: '0',
        contractAddress: CONTRACT_ADDRESSES.FLASHFLOW,
        fUSDAddress: CONTRACT_ADDRESSES.FUSD
      };
    }
  }

  // Get protocol stats (for backward compatibility)
  async getProtocolStats() {
    try {
      const poolStats = await this.getPoolStats();
      return {
        totalAssets: '0',
        totalFunded: '0',
        totalPaid: '0',
        poolBalance: poolStats.poolBalance,
        contractAddress: CONTRACT_ADDRESSES.FLASHFLOW
      };
    } catch (error) {
      console.error('Get protocol stats error:', error);
      return {
        totalAssets: '0',
        totalFunded: '0', 
        totalPaid: '0',
        poolBalance: '0',
        contractAddress: CONTRACT_ADDRESSES.FLASHFLOW
      };
    }
  }

  // Get asset info
  async getAssetInfo(assetId) {
    try {
      const asset = await this.contracts.flashFlow.getAsset(assetId);
      return {
        originator: asset[0],
        amount: ethers.formatEther(asset[1]),
        unlockable: ethers.formatEther(asset[2]),
        riskScore: asset[3],
        basketId: asset[4],
        funded: asset[5],
        repaid: asset[6],
        repaidAmount: ethers.formatEther(asset[7])
      };
    } catch (error) {
      console.error('Get asset info error:', error);
      return null;
    }
  }

  // Get network name
  getNetworkName() {
    if (!this.chainId) return 'Unknown';
    
    if (this.isKadenaEVM(this.chainId)) {
      return 'Kadena EVM Testnet';
    }
    
    switch (this.chainId) {
      case 1:
        return 'Ethereum Mainnet';
      case 11155111:
        return 'Sepolia Testnet';
      case 137:
        return 'Polygon';
      case 56:
        return 'BSC';
      default:
        return `Chain ${this.chainId}`;
    }
  }

  // Utility functions
  isConnected() {
    return !!this.account;
  }

  getAccount() {
    return this.account;
  }

  getChainId() {
    return this.chainId;
  }

  // Event listeners
  setupEventListeners() {
    if (!window.ethereum) return;

    window.ethereum.on('accountsChanged', (accounts) => {
      if (accounts.length === 0) {
        this.disconnect();
      } else {
        this.account = accounts[0];
        window.location.reload();
      }
    });

    window.ethereum.on('chainChanged', (chainId) => {
      console.log('🔄 Chain changed to:', parseInt(chainId, 16));
      window.location.reload();
    });
  }

  disconnect() {
    this.account = null;
    this.signer = null;
    this.contracts = {};
    this.chainId = null;
    console.log('👋 Wallet disconnected');
  }

  // Additional utility functions for backward compatibility
  async executeTransaction(txData) {
    if (!this.signer) {
      throw new Error('No signer available');
    }
    
    if (!this.isCorrectNetwork()) {
      throw new Error('Please switch to Kadena EVM Testnet');
    }
    
    try {
      const tx = await this.signer.sendTransaction(txData);
      return await tx.wait();
    } catch (error) {
      console.error('Transaction execution failed:', error);
      throw error;
    }
  }

  // Get transaction data for approvals (for legacy support)
  getApprovalTxData(spender, amount) {
    if (!this.contracts.fUSD) {
      throw new Error('fUSD contract not initialized');
    }
    
    const iface = new ethers.Interface(FlashFlowToken);
    const data = iface.encodeFunctionData('approve', [
      spender,
      ethers.parseEther(amount.toString())
    ]);
    
    return {
      to: CONTRACT_ADDRESSES.FUSD,
      data,
      value: '0x0'
    };
  }
}

export default new Web3Service();
