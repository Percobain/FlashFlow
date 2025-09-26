import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

const useAppStore = create(
  subscribeWithSelector((set, get) => ({
    // User state
    user: {
      address: '0x1234567890123456789012345678901234567890',
      isConnected: true,
      kycStatus: 'verified',
      reputation: 785,
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
    
    // Actions
    setUser: (user) => set((state) => ({ user: { ...state.user, ...user } })),
    
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
  }))
);

export default useAppStore;
