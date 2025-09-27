import React, { createContext, useContext, useEffect, useState } from 'react';
import web3Service from '../services/web3Service.js';
import backendService from '../services/backendService.js';
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
    token: '0'
  });
  const [user, setUser] = useState(null);

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

  // Handle account connection and user creation
  const handleAccountConnected = async () => {
    try {
      const account = web3Service.getAccount();
      const chainId = web3Service.getChainId();
      
      setAccount(account);
      setChainId(chainId);
      
      // Create or get user account from backend
      const userData = await createOrGetUserAccount(account);
      setUser(userData);
      
      // Update app store
      setAppStoreUser({
        address: account,
        isConnected: true,
        ...userData
      });
      
      // Load balances
      await loadBalances();
      
      toast.success('Wallet connected successfully! 🎉');
      
    } catch (error) {
      console.error('Failed to handle account connection:', error);
      toast.error('Failed to connect account: ' + error.message);
    }
  };

  // Create or get user account
  const createOrGetUserAccount = async (address) => {
    try {
      // This will automatically create user if doesn't exist
      const response = await fetch(`http://localhost:3000/api/users/${address}`);
      
      if (!response.ok) {
        throw new Error('Failed to create/get user account');
      }
      
      const userData = await response.json();
      console.log('✅ User account ready:', userData.address);
      
      return userData;
    } catch (error) {
      console.error('Error creating/getting user account:', error);
      throw error;
    }
  };

  // Connect wallet
  const connectWallet = async () => {
    if (!isInitialized) {
      toast.error('Web3 service not initialized');
      return;
    }

    try {
      setIsConnecting(true);
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
    }
  };

  // Disconnect wallet
  const disconnectWallet = () => {
    web3Service.disconnect();
    setAccount(null);
    setChainId(null);
    setUser(null);
    setBalances({ native: '0', token: '0' });
    
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
      // Reload after network switch
      window.location.reload();
    } catch (error) {
      console.error('Failed to switch network:', error);
      throw error;
    }
  };

  // Load balances
  const loadBalances = async () => {
    if (!account) return;

    try {
      const [nativeBalance, tokenBalance] = await Promise.all([
        web3Service.getNativeBalance(),
        web3Service.getTokenBalance()
      ]);

      setBalances({
        native: nativeBalance,
        token: tokenBalance
      });
    } catch (error) {
      console.error('Failed to load balances:', error);
    }
  };

  // Refresh balances
  const refreshBalances = async () => {
    await loadBalances();
  };

  // Initiate seller flow (when trying to get funding)
  const initiateSellerFlow = async (assetData) => {
    try {
      if (!account) {
        throw new Error('Wallet not connected');
      }

      const response = await fetch(`http://localhost:3000/api/users/${account}/seller`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ assetData }),
      });

      if (!response.ok) {
        throw new Error('Failed to initiate seller flow');
      }

      const result = await response.json();
      
      // Update user data
      setUser(result.user);
      
      return result;
    } catch (error) {
      console.error('Failed to initiate seller flow:', error);
      throw error;
    }
  };

  // Initiate investor flow (when trying to invest)
  const initiateInvestorFlow = async () => {
    try {
      if (!account) {
        throw new Error('Wallet not connected');
      }

      const response = await fetch(`http://localhost:3000/api/users/${account}/investor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to initiate investor flow');
      }

      const result = await response.json();
      
      // Update user data
      setUser(result.user);
      
      return result;
    } catch (error) {
      console.error('Failed to initiate investor flow:', error);
      throw error;
    }
  };

  // ===== SMART CONTRACT INTERACTIONS =====

  // Create asset (with seller flow initiation)
  const createAsset = async (assetData) => {
    try {
      setLoading(true);
      
      // First initiate seller flow (adds seller type and checks KYC)
      const sellerFlow = await initiateSellerFlow(assetData);
      
      if (sellerFlow.kycRequired && !user?.settings?.skipVerification) {
        throw new Error('KYC verification required before creating assets');
      }
      
      return await backendService.completeAssetTokenization(assetData, web3Service);
    } catch (error) {
      console.error('Failed to create asset:', error);
      throw error;
    } finally {
      setLoading(false);
      await refreshBalances();
    }
  };

  // Invest in asset (with investor flow initiation)
  const investInAsset = async (investmentData) => {
    try {
      setLoading(true);
      
      // First initiate investor flow (adds investor type)
      const investorFlow = await initiateInvestorFlow();
      
      if (!investorFlow.canInvest) {
        throw new Error('KYC verification required before investing');
      }
      
      // First approve tokens if needed
      if (investmentData.amount > 0) {
        await web3Service.approveToken(
          web3Service.contracts.flashFlowAgent.target,
          investmentData.amount
        );
      }
      
      const result = await backendService.completeInvestmentWorkflow(investmentData, web3Service);
      
      // Update user stats
      await updateUserStats({
        invested: investmentData.amount
      });
      
      return result;
    } catch (error) {
      console.error('Failed to invest in asset:', error);
      throw error;
    } finally {
      setLoading(false);
      await refreshBalances();
    }
  };

  // Update user stats
  const updateUserStats = async (statsUpdate) => {
    try {
      const response = await fetch(`http://localhost:3000/api/users/${account}/stats`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(statsUpdate),
      });

      if (!response.ok) {
        throw new Error('Failed to update user stats');
      }

      const result = await response.json();
      
      // Update local user data
      if (user) {
        setUser({
          ...user,
          stats: result.stats
        });
      }
      
      return result;
    } catch (error) {
      console.error('Failed to update user stats:', error);
    }
  };

  // Deposit to pool
  const depositToPool = async (amount) => {
    try {
      setLoading(true);
      const result = await web3Service.depositToPool(amount);
      
      // Sync with backend
      await backendService.syncBlockchainData(account, {
        type: 'pool_deposit',
        amount,
        transactionHash: result.hash
      });
      
      return result;
    } catch (error) {
      console.error('Failed to deposit to pool:', error);
      throw error;
    } finally {
      setLoading(false);
      await refreshBalances();
    }
  };

  // Get pool stats
  const getPoolStats = async () => {
    try {
      return await web3Service.getPoolStats();
    } catch (error) {
      console.error('Failed to get pool stats:', error);
      throw error;
    }
  };

  // Get protocol stats
  const getProtocolStats = async () => {
    try {
      const [blockchainStats, backendStats] = await Promise.all([
        web3Service.getProtocolStats(),
        backendService.getProtocolAnalytics()
      ]);
      
      return {
        blockchain: blockchainStats,
        backend: backendStats
      };
    } catch (error) {
      console.error('Failed to get protocol stats:', error);
      throw error;
    }
  };

  // Get user analytics
  const getUserAnalytics = async () => {
    if (!account) return null;

    try {
      const response = await fetch(`http://localhost:3000/api/users/${account}/analytics`);
      
      if (!response.ok) {
        throw new Error('Failed to get user analytics');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to get user analytics:', error);
      throw error;
    }
  };

  const value = {
    // State
    isInitialized,
    isConnecting,
    account,
    chainId,
    balances,
    user,
    isConnected: !!account,
    networkName: web3Service.getNetworkName(),
    
    // Wallet functions
    connectWallet,
    disconnectWallet,
    switchToKadenaEVM,
    refreshBalances,
    
    // User management
    initiateSellerFlow,
    initiateInvestorFlow,
    updateUserStats,
    
    // Smart contract interactions
    createAsset,
    investInAsset,
    depositToPool,
    getPoolStats,
    getProtocolStats,
    getUserAnalytics,
    
    // Services (for advanced usage)
    web3Service,
    backendService
  };

  return (
    <Web3Context.Provider value={value}>
      {children}
    </Web3Context.Provider>
  );
};
