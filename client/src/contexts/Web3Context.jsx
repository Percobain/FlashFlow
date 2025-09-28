import React, { createContext, useContext, useEffect, useState } from 'react';
import web3Service from '../services/web3Service.js';
import useAppStore from '../stores/appStore.js';
import { toast } from 'sonner';

const Web3Context = createContext();

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within Web3Provider');
  }
  return context;
};

export const Web3Provider = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [balances, setBalances] = useState({
    native: '0',
    fusd: '0',
    token: '0' // alias for fusd
  });

  const { setUser: setAppStoreUser, setLoading } = useAppStore();

  // Initialize Web3 service
  useEffect(() => {
    const initializeWeb3 = async () => {
      try {
        await web3Service.initialize();
        setIsInitialized(true);
        
        // Check if already connected
        if (web3Service.isConnected()) {
          await handleAccountConnected();
        }
      } catch (error) {
        console.error('Failed to initialize Web3:', error);
      }
    };

    initializeWeb3();
  }, []);

  // Handle account connection (simplified - no backend user creation)
  const handleAccountConnected = async () => {
    try {
      const account = web3Service.getAccount();
      const chainId = web3Service.getChainId();
      
      setAccount(account);
      setChainId(chainId);
      
      // Create simple user object without backend call
      const userData = {
        address: account,
        chainId: chainId,
        isConnected: true,
        networkName: web3Service.getNetworkName(),
        isCorrectNetwork: web3Service.isCorrectNetwork()
      };
      
      // Update app store
      setAppStoreUser(userData);
      
      // Load balances
      await loadBalances();
      
      const networkName = web3Service.getNetworkName();
      toast.success(`Wallet connected to ${networkName}! 🎉`);
      
    } catch (error) {
      console.error('Failed to handle account connection:', error);
      toast.error('Failed to connect account: ' + error.message);
    }
  };

  // Connect wallet
  const connectWallet = async () => {
    if (isConnecting) return;
    
    setIsConnecting(true);
    setLoading(true);
    
    try {
      const connection = await web3Service.connect();
      
      setAccount(connection.account);
      setChainId(connection.chainId);
      
      // Handle account connected (this creates user account)
      await handleAccountConnected();
      
      return connection;
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      toast.error('Failed to connect wallet: ' + error.message);
      throw error;
    } finally {
      setIsConnecting(false);
      setLoading(false);
    }
  };

  // Disconnect wallet
  const disconnectWallet = () => {
    web3Service.disconnect();
    setAccount(null);
    setChainId(null);
    setBalances({ native: '0', fusd: '0', token: '0' });
    
    // Clear app store
    setAppStoreUser({
      address: null,
      isConnected: false
    });
    
    toast.info('Wallet disconnected');
  };

  // Switch to Kadena EVM
  const switchToKadenaEVM = async () => {
    try {
      await web3Service.switchToKadenaEVM();
      // Reload page to refresh state
      window.location.reload();
    } catch (error) {
      console.error('Failed to switch network:', error);
      toast.error('Failed to switch network: ' + error.message);
    }
  };

  // Load balances
  const loadBalances = async () => {
    try {
      const balanceData = await web3Service.getBalances();
      setBalances(balanceData);
    } catch (error) {
      console.error('Failed to load balances:', error);
    }
  };

  // Smart contract interactions

  // Create Asset
  const createAsset = async (assetData) => {
    try {
        // Ensure all required parameters are present
        const {
            assetId,
            amount,
            riskScore = 75, // Default fallback
            assetType = 0   // Default to 0 (Invoice)
        } = assetData;

        if (!assetId || !amount) {
            throw new Error('Missing required asset parameters');
        }

        console.log('Creating asset with params:', { assetId, amount, riskScore, assetType });
        
        const result = await web3Service.createAsset(
            assetId,
            amount,
            riskScore,
            assetType
        );
        
        toast.success('Asset created successfully on blockchain!');
        return result;
    } catch (error) {
        console.error('Create asset failed:', error);
        toast.error('Failed to create asset: ' + error.message);
        throw error;
    }
};

  // Fund Asset  
  const fundAsset = async (assetId) => {
    try {
      if (!web3Service.isCorrectNetwork()) {
        throw new Error('Please switch to Kadena EVM Testnet');
      }

      const receipt = await web3Service.fundAsset(assetId);
      await loadBalances();
      return receipt;
    } catch (error) {
      console.error('Fund asset failed:', error);
      throw error;
    }
  };

  // Invest in Basket
  const investInBasket = async (basketId, amount) => {
    try {
      if (!web3Service.isCorrectNetwork()) {
        throw new Error('Please switch to Kadena EVM Testnet');
      }

      const receipt = await web3Service.investInBasket(basketId, amount);
      await loadBalances();
      return receipt;
    } catch (error) {
      console.error('Investment failed:', error);
      throw error;
    }
  };

  // Mint fUSD (for testing)
  const mintFUSD = async (amount) => {
    try {
      if (!web3Service.isCorrectNetwork()) {
        throw new Error('Please switch to Kadena EVM Testnet');
      }

      const receipt = await web3Service.mintFUSD(amount);
      await loadBalances();
      toast.success(`Minted ${amount} fUSD successfully!`);
      return receipt;
    } catch (error) {
      console.error('Mint fUSD failed:', error);
      throw error;
    }
  };

  // Simulate Repayment
  const simulateRepayment = async (assetId, amount) => {
    try {
      if (!web3Service.isCorrectNetwork()) {
        throw new Error('Please switch to Kadena EVM Testnet');
      }

      const receipt = await web3Service.simulateRepayment(assetId, amount);
      await loadBalances();
      return receipt;
    } catch (error) {
      console.error('Simulate repayment failed:', error);
      throw error;
    }
  };

  // Get Pool Stats
  const getPoolStats = async () => {
    try {
      return await web3Service.getPoolStats();
    } catch (error) {
      console.error('Failed to get pool stats:', error);
      return { poolBalance: '0', totalLiquidity: '0' };
    }
  };

  // Get Protocol Stats
  const getProtocolStats = async () => {
    try {
      return await web3Service.getProtocolStats();
    } catch (error) {
      console.error('Failed to get protocol stats:', error);
      return {
        totalAssets: '0',
        totalFunded: '0',
        totalPaid: '0',
        poolBalance: '0'
      };
    }
  };

  // Approve fUSD
  const approveFUSD = async (amount) => {
    try {
      if (!web3Service.isCorrectNetwork()) {
        throw new Error('Please switch to Kadena EVM Testnet');
      }

      const receipt = await web3Service.approveFUSD(amount);
      return receipt;
    } catch (error) {
      console.error('Approve fUSD failed:', error);
      throw error;
    }
  };

  const value = {
    // State
    isInitialized,
    isConnecting,
    isConnected: !!account,
    account,
    chainId,
    balances,
    
    // Network info - with safe fallbacks
    networkName: web3Service.getNetworkName ? web3Service.getNetworkName() : 'Unknown',
    isCorrectNetwork: web3Service.isCorrectNetwork ? web3Service.isCorrectNetwork() : false,
    
    // Actions
    connectWallet,
    disconnectWallet,
    switchToKadenaEVM,
    loadBalances,
    
    // Smart contract functions
    createAsset,
    fundAsset,
    investInBasket,
    mintFUSD,
    simulateRepayment,
    approveFUSD,
    
    // Read functions
    getPoolStats,
    getProtocolStats,
    
    // Legacy support
    signer: web3Service.signer,
    contracts: web3Service.contracts
  };

  return (
    <Web3Context.Provider value={value}>
      {children}
    </Web3Context.Provider>
  );
};
