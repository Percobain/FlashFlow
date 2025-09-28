import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

const useAppStore = create(
  subscribeWithSelector((set, get) => ({
    // User state
    user: {
      address: null,
      isConnected: false,
      kycStatus: 'pending',
      reputation: 0,
      totalInvested: 0,
      totalEarned: 0,
      assetsCreated: 0,
    },
    
    // Web3 state
    web3: {
      isInitialized: false,
      chainId: null,
      networkName: '',
      balances: {
        native: '0',
        token: '0'
      }
    },
    
    // Current flow state
    currentFlow: {
      step: 0,
      type: null, // 'invoice', 'saas', 'creator', 'rental', 'luxury'
      data: {},
      connection: null,
      analysis: null,
      offer: null,
    },
    
    // UI state
    ui: {
      loading: false,
      error: null,
      notifications: [],
      modals: {
        tokenization: false,
        investment: false,
        kycVerification: false,
      },
    },
    
    // Portfolio state
    portfolio: {
      totalValue: 0,
      positions: [],
      payouts: [],
      analytics: null,
    },
    
    // Protocol stats
    protocol: {
      totalAssets: 0,
      totalFunded: 0,
      totalPaid: 0,
      poolStats: {
        balance: '0',
        released: '0',
        deposited: '0'
      }
    },
    
    // Actions
    setUser: (user) => set((state) => ({ 
      user: { ...state.user, ...user } 
    })),
    
    setWeb3: (web3Data) => set((state) => ({
      web3: { ...state.web3, ...web3Data }
    })),
    
    setCurrentFlow: (flow) => set((state) => ({
      currentFlow: { ...state.currentFlow, ...flow }
    })),
    
    resetCurrentFlow: () => set(() => ({
      currentFlow: { step: 0, type: null, data: {}, connection: null, analysis: null, offer: null }
    })),
    
    setLoading: (loading) => set((state) => ({
      ui: { ...state.ui, loading }
    })),
    
    setError: (error) => set((state) => ({
      ui: { ...state.ui, error }
    })),
    
    addNotification: (notification) => set((state) => ({
      ui: {
        ...state.ui,
        notifications: [...state.ui.notifications, { ...notification, id: Date.now() }]
      }
    })),
    
    removeNotification: (id) => set((state) => ({
      ui: {
        ...state.ui,
        notifications: state.ui.notifications.filter(n => n.id !== id)
      }
    })),
    
    toggleModal: (modalName, isOpen) => set((state) => ({
      ui: {
        ...state.ui,
        modals: { ...state.ui.modals, [modalName]: isOpen ?? !state.ui.modals[modalName] }
      }
    })),
    
    setPortfolio: (portfolio) => set((state) => ({
      portfolio: { ...state.portfolio, ...portfolio }
    })),
    
    addPosition: (position) => set((state) => ({
      portfolio: {
        ...state.portfolio,
        positions: [...state.portfolio.positions, position],
        totalValue: state.portfolio.totalValue + position.amount
      }
    })),
    
    setProtocolStats: (stats) => set((state) => ({
      protocol: { ...state.protocol, ...stats }
    })),
    
    // Complex actions
    updateUserStats: (stats) => set((state) => ({
      user: {
        ...state.user,
        totalInvested: stats.totalInvested || state.user.totalInvested,
        totalEarned: stats.totalEarned || state.user.totalEarned,
        assetsCreated: stats.assetsCreated || state.user.assetsCreated,
        reputation: stats.reputation || state.user.reputation,
      }
    })),
    
    // Reset all data (for wallet disconnect)
    resetAppState: () => set(() => ({
      user: {
        address: null,
        isConnected: false,
        kycStatus: 'pending',
        reputation: 0,
        totalInvested: 0,
        totalEarned: 0,
        assetsCreated: 0,
      },
      web3: {
        isInitialized: false,
        chainId: null,
        networkName: '',
        balances: { native: '0', token: '0' }
      },
      currentFlow: {
        step: 0,
        type: null,
        data: {},
        connection: null,
        analysis: null,
        offer: null,
      },
      portfolio: {
        totalValue: 0,
        positions: [],
        payouts: [],
        analytics: null,
      }
    })),
  }))
);

export default useAppStore;
