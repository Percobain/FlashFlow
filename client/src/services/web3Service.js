import { ethers } from 'ethers';
import { toast } from 'sonner';

// Import ABIs
import { FlashFlowAgent } from '../abis/FlashFlowAgent.js';
import { FlashFlowToken } from '../abis/FlashFlowToken.js';
import { MainPool } from '../abis/MainPool.js';
import { SelfVerifier } from '../abis/SelfVerifier.js';

// Contract addresses from deployment
const CONTRACT_ADDRESSES = {
  // Kadena EVM Testnet addresses
  FLASHFLOW_TOKEN: '0xAdB17C7D41c065C0c57D69c7B4BC97A6fcD4D117',
  MAIN_POOL: '0xCA7c84C6Ca61f48fA04d7dBbA1649f269962997c',
  FLASHFLOW_AGENT: '0x5F675D9E81bC91c73a41f3Ee377a7c1eeb2C062f'
};

// Network configurations
const NETWORKS = {
  KADENA_TESTNET: {
    chainId: '0x1720', // 5920 in hex
    chainName: 'Kadena EVM Testnet',
    nativeCurrency: {
      name: 'KDA',
      symbol: 'KDA',
      decimals: 18
    },
    rpcUrls: ['https://evm-testnet.chainweb.com/chainweb/0.0/evm-testnet/chain/20/evm/rpc'],
    blockExplorerUrls: ['https://explorer.evm-testnet.chainweb.com']
  }
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

  // Initialize Web3 connection
  async initialize() {
    try {
      if (!window.ethereum) {
        throw new Error('MetaMask not found. Please install MetaMask.');
      }

      this.provider = new ethers.BrowserProvider(window.ethereum);
      
      // Check if already connected
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (accounts.length > 0) {
        await this.connect();
      }

      // Setup event listeners
      this.setupEventListeners();
      this.isInitialized = true;
      
      console.log('✅ Web3Service initialized');
      return true;
    } catch (error) {
      console.error('❌ Web3Service initialization failed:', error);
      throw error;
    }
  }

  // Connect wallet
  async connect() {
    try {
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
      this.chainId = network.chainId.toString();
      
      // Initialize contracts
      await this.initializeContracts();
      
      toast.success('Wallet connected successfully! 🎉');
      return {
        account: this.account,
        chainId: this.chainId,
        network: network.name
      };
    } catch (error) {
      console.error('❌ Wallet connection failed:', error);
      toast.error(`Failed to connect wallet: ${error.message}`);
      throw error;
    }
  }

  // Switch to Kadena EVM Testnet
  async switchToKadenaEVM() {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: NETWORKS.KADENA_TESTNET.chainId }]
      });
      
      toast.success('Switched to Kadena EVM Testnet');
      return true;
    } catch (switchError) {
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [NETWORKS.KADENA_TESTNET]
          });
          
          toast.success('Kadena EVM Testnet added and switched');
          return true;
        } catch (addError) {
          toast.error('Failed to add Kadena EVM Testnet');
          throw addError;
        }
      } else {
        toast.error('Failed to switch network');
        throw switchError;
      }
    }
  }

  // Initialize contract instances
  async initializeContracts() {
    try {
      if (!this.signer) {
        throw new Error('Signer not available');
      }

      this.contracts = {
        flashFlowToken: new ethers.Contract(
          CONTRACT_ADDRESSES.FLASHFLOW_TOKEN,
          FlashFlowToken,
          this.signer
        ),
        mainPool: new ethers.Contract(
          CONTRACT_ADDRESSES.MAIN_POOL,
          MainPool,
          this.signer
        ),
        flashFlowAgent: new ethers.Contract(
          CONTRACT_ADDRESSES.FLASHFLOW_AGENT,
          FlashFlowAgent,
          this.signer
        )
      };

      console.log('✅ Contracts initialized');
    } catch (error) {
      console.error('❌ Contract initialization failed:', error);
      throw error;
    }
  }

  // Setup event listeners
  setupEventListeners() {
    if (!window.ethereum) return;

    window.ethereum.on('accountsChanged', (accounts) => {
      if (accounts.length === 0) {
        this.disconnect();
        toast.info('Wallet disconnected');
      } else if (accounts[0] !== this.account) {
        this.account = accounts[0];
        this.connect();
        toast.success('Account changed');
      }
    });

    window.ethereum.on('chainChanged', (chainId) => {
      this.chainId = parseInt(chainId, 16).toString();
      toast.info('Network changed');
      // Reinitialize contracts if needed
      if (this.signer) {
        this.initializeContracts();
      }
    });
  }

  // Disconnect wallet
  disconnect() {
    this.account = null;
    this.signer = null;
    this.contracts = {};
    this.chainId = null;
  }

  // Get account info
  getAccount() {
    return this.account;
  }

  // Get chain ID
  getChainId() {
    return this.chainId;
  }

  // Check if connected
  isConnected() {
    return !!this.account;
  }

  // Get network name
  getNetworkName() {
    const networks = {
      '1': 'Ethereum Mainnet',
      '11155111': 'Sepolia Testnet',
      '5920': 'Kadena EVM Testnet',
      '11142220': 'Celo Sepolia Testnet'
    };
    return networks[this.chainId] || `Chain ID: ${this.chainId}`;
  }

  // ===== TOKEN OPERATIONS =====

  // Get token balance
  async getTokenBalance(address = null) {
    try {
      const targetAddress = address || this.account;
      if (!targetAddress) throw new Error('No address provided');

      const balance = await this.contracts.flashFlowToken.balanceOf(targetAddress);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error('❌ Failed to get token balance:', error);
      throw error;
    }
  }

  // Get native balance (ETH/TKDA)
  async getNativeBalance(address = null) {
    try {
      const targetAddress = address || this.account;
      if (!targetAddress) throw new Error('No address provided');

      const balance = await this.provider.getBalance(targetAddress);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error('❌ Failed to get native balance:', error);
      throw error;
    }
  }

  // Approve token spending
  async approveToken(spender, amount) {
    try {
      const amountWei = ethers.parseEther(amount.toString());
      const tx = await this.contracts.flashFlowToken.approve(spender, amountWei);
      
      toast.loading('Approving tokens...', { id: 'approve' });
      const receipt = await tx.wait();
      
      toast.success('Tokens approved successfully!', { id: 'approve' });
      return receipt;
    } catch (error) {
      toast.error('Failed to approve tokens', { id: 'approve' });
      console.error('❌ Token approval failed:', error);
      throw error;
    }
  }

  // Transfer tokens
  async transferToken(to, amount) {
    try {
      const amountWei = ethers.parseEther(amount.toString());
      const tx = await this.contracts.flashFlowToken.transfer(to, amountWei);
      
      toast.loading('Transferring tokens...', { id: 'transfer' });
      const receipt = await tx.wait();
      
      toast.success('Tokens transferred successfully!', { id: 'transfer' });
      return receipt;
    } catch (error) {
      toast.error('Failed to transfer tokens', { id: 'transfer' });
      console.error('❌ Token transfer failed:', error);
      throw error;
    }
  }

  // ===== POOL OPERATIONS =====

  // Deposit to pool
  async depositToPool(amount) {
    try {
      const amountWei = ethers.parseEther(amount.toString());
      
      // First approve the pool to spend tokens
      await this.approveToken(CONTRACT_ADDRESSES.MAIN_POOL, amount);
      
      // Then deposit
      const tx = await this.contracts.mainPool.deposit(amountWei);
      
      toast.loading('Depositing to pool...', { id: 'deposit' });
      const receipt = await tx.wait();
      
      toast.success('Deposited to pool successfully!', { id: 'deposit' });
      return receipt;
    } catch (error) {
      toast.error('Failed to deposit to pool', { id: 'deposit' });
      console.error('❌ Pool deposit failed:', error);
      throw error;
    }
  }

  // Get pool stats
  async getPoolStats() {
    try {
      const stats = await this.contracts.mainPool.getPoolStats();
      return {
        balance: ethers.formatEther(stats.balance),
        released: ethers.formatEther(stats.released),
        deposited: ethers.formatEther(stats.deposited)
      };
    } catch (error) {
      console.error('❌ Failed to get pool stats:', error);
      throw error;
    }
  }

  // Release funds from pool
  async releaseFunds(assetId, originator, amount) {
    try {
      const amountWei = ethers.parseEther(amount.toString());
      const tx = await this.contracts.mainPool.releaseFunds(assetId, originator, amountWei);
      
      toast.loading('Releasing funds...', { id: 'release' });
      const receipt = await tx.wait();
      
      toast.success('Funds released successfully!', { id: 'release' });
      return receipt;
    } catch (error) {
      toast.error('Failed to release funds', { id: 'release' });
      console.error('❌ Fund release failed:', error);
      throw error;
    }
  }

  // ===== ASSET OPERATIONS =====

  // Create asset
  async createAsset(assetData) {
    try {
      const {
        originator,
        faceAmount,
        unlockable,
        riskScore,
        basketId,
        assetType,
        documentHash
      } = assetData;

      // Generate asset ID
      const assetId = this.generateAssetId(originator, Date.now());
      
      const faceAmountWei = ethers.parseEther(faceAmount.toString());
      const unlockableWei = ethers.parseEther(unlockable.toString());
      
      const tx = await this.contracts.flashFlowAgent.createAsset(
        assetId,
        originator,
        faceAmountWei,
        unlockableWei,
        riskScore,
        basketId,
        assetType,
        documentHash
      );
      
      toast.loading('Creating asset...', { id: 'create-asset' });
      const receipt = await tx.wait();
      
      toast.success('Asset created successfully!', { id: 'create-asset' });
      return { receipt, assetId };
    } catch (error) {
      toast.error('Failed to create asset', { id: 'create-asset' });
      console.error('❌ Asset creation failed:', error);
      throw error;
    }
  }

  // Get asset info
  async getAssetInfo(assetId) {
    try {
      const info = await this.contracts.flashFlowAgent.getAssetInfo(assetId);
      return {
        originator: info.originator,
        faceAmount: ethers.formatEther(info.faceAmount),
        unlockable: ethers.formatEther(info.unlockable),
        riskScore: info.riskScore,
        basketId: info.basketId,
        funded: info.funded,
        paid: info.paid,
        paidAmount: ethers.formatEther(info.paidAmount),
        assetType: info.assetType
      };
    } catch (error) {
      console.error('❌ Failed to get asset info:', error);
      throw error;
    }
  }

  // Record investment
  async recordInvestment(assetId, investor, amount) {
    try {
      const amountWei = ethers.parseEther(amount.toString());
      const tx = await this.contracts.flashFlowAgent.recordInvestment(assetId, investor, amountWei);
      
      toast.loading('Recording investment...', { id: 'record-investment' });
      const receipt = await tx.wait();
      
      toast.success('Investment recorded successfully!', { id: 'record-investment' });
      return receipt;
    } catch (error) {
      toast.error('Failed to record investment', { id: 'record-investment' });
      console.error('❌ Investment recording failed:', error);
      throw error;
    }
  }

  // Mark asset as funded
  async markFunded(assetId, unlockAmount) {
    try {
      const unlockAmountWei = ethers.parseEther(unlockAmount.toString());
      const tx = await this.contracts.flashFlowAgent.markFunded(assetId, unlockAmountWei);
      
      toast.loading('Marking asset as funded...', { id: 'mark-funded' });
      const receipt = await tx.wait();
      
      toast.success('Asset marked as funded!', { id: 'mark-funded' });
      return receipt;
    } catch (error) {
      toast.error('Failed to mark asset as funded', { id: 'mark-funded' });
      console.error('❌ Asset funding failed:', error);
      throw error;
    }
  }

  // Confirm payment
  async confirmPayment(assetId, amount) {
    try {
      const amountWei = ethers.parseEther(amount.toString());
      const tx = await this.contracts.flashFlowAgent.confirmPayment(assetId, amountWei);
      
      toast.loading('Confirming payment...', { id: 'confirm-payment' });
      const receipt = await tx.wait();
      
      toast.success('Payment confirmed successfully!', { id: 'confirm-payment' });
      return receipt;
    } catch (error) {
      toast.error('Failed to confirm payment', { id: 'confirm-payment' });
      console.error('❌ Payment confirmation failed:', error);
      throw error;
    }
  }

  // ===== BASKET OPERATIONS =====

  // Get basket stats
  async getBasketStats(basketId) {
    try {
      const stats = await this.contracts.flashFlowAgent.getBasketStats(basketId);
      return {
        totalValue: ethers.formatEther(stats.totalValue),
        investedAmount: ethers.formatEther(stats.investedAmount),
        assetCount: stats.assetCount.toString()
      };
    } catch (error) {
      console.error('❌ Failed to get basket stats:', error);
      throw error;
    }
  }

  // Get basket assets
  async getBasketAssets(basketId) {
    try {
      const assets = await this.contracts.flashFlowAgent.getBasketAssets(basketId);
      return assets;
    } catch (error) {
      console.error('❌ Failed to get basket assets:', error);
      throw error;
    }
  }

  // Get protocol stats
  async getProtocolStats() {
    try {
      const stats = await this.contracts.flashFlowAgent.getProtocolStats();
      return {
        totalAssets: stats._totalAssets.toString(),
        totalFunded: ethers.formatEther(stats._totalFunded),
        totalPaid: ethers.formatEther(stats._totalPaid)
      };
    } catch (error) {
      console.error('❌ Failed to get protocol stats:', error);
      throw error;
    }
  }

  // ===== UTILITY FUNCTIONS =====

  // Generate asset ID
  generateAssetId(originatorAddress, timestamp) {
    return ethers.keccak256(
      ethers.AbiCoder.defaultAbiCoder().encode(
        ['address', 'uint256'],
        [originatorAddress, timestamp]
      )
    );
  }

  // Generate basket ID
  generateBasketId(assetType, timestamp) {
    return ethers.keccak256(
      ethers.AbiCoder.defaultAbiCoder().encode(
        ['string', 'uint256'],
        [assetType, timestamp]
      )
    );
  }

  // Generate document hash
  generateDocumentHash(documentData) {
    return ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(documentData)));
  }

  // Format address for display
  formatAddress(address) {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  // Parse error message
  parseErrorMessage(error) {
    if (error.reason) return error.reason;
    if (error.message) {
      // Extract revert reason from error message
      const match = error.message.match(/reason="([^"]+)"/);
      if (match) return match[1];
      return error.message;
    }
    return 'Unknown error occurred';
  }
}

// Create and export singleton instance
const web3Service = new Web3Service();
export default web3Service;
