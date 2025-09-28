import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Wallet, 
  Activity, 
  Shield, 
  Globe,
  Home,
  DollarSign,
  TrendingUp,
  LayoutDashboard,
  HelpCircle
} from 'lucide-react';
import { useWeb3 } from '../contexts/Web3Context';
import { formatBalance } from '../lib/utils';

const Layout = ({ children }) => {
  const location = useLocation();
  const { 
    isConnected, 
    account, 
    chainId,
    networkName,
    connectWallet, 
    isConnecting,
    balances
  } = useWeb3();
  
  const navItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Get Cash', path: '/get-cash', icon: DollarSign },
    { name: 'Invest', path: '/invest', icon: TrendingUp },
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'How It Works', path: '/ai-oracle', icon: HelpCircle },
  ];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const isKadenaEVM = chainId === 5920 || chainId === '5920';

  return (
    <div className="min-h-screen bg-nb-bg">
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 border-b-3 border-nb-ink bg-nb-card shadow-nb-sm z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2 shrink-0">
              <motion.div
                className="w-8 h-8 bg-gradient-to-r from-nb-accent to-nb-accent-2 rounded-lg nb-border flex items-center justify-center"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="text-nb-ink font-bold text-lg">₿</span>
              </motion.div>
              <span className="font-display font-bold text-xl text-nb-ink hidden sm:block">
                Flash<span className="text-nb-accent">Flow</span>
              </span>
            </Link>

            {/* Navigation */}
            <nav className="hidden lg:flex space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors text-sm ${
                      isActive(item.path)
                        ? 'bg-nb-accent text-nb-ink font-semibold'
                        : 'text-nb-ink hover:bg-nb-accent/20'
                    }`}
                  >
                    <Icon size={16} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Wallet & Network Info */}
            <div className="flex items-center space-x-2">
              {/* Network Status - Hidden on mobile */}
              {isConnected && (
                <div className="hidden xl:flex items-center space-x-3 text-xs">
                  <div className="flex items-center space-x-1">
                    <Globe size={12} className={isKadenaEVM ? "text-nb-ok" : "text-yellow-500"} />
                    <span className="text-nb-ink font-medium">Kadena EVM</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Shield size={12} className="text-nb-ok" />
                    <span className="text-nb-ink font-medium">Connected</span>
                  </div>
                </div>
              )}
              
              {/* Wallet Connection */}
              {!isConnected ? (
                <motion.button
                  onClick={connectWallet}
                  disabled={isConnecting}
                  className="flex items-center space-x-2 bg-nb-accent hover:bg-nb-accent/80 text-nb-ink font-semibold px-4 py-2 rounded-nb nb-border shadow-nb-sm transition-transform hover:-translate-y-1 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Wallet size={16} />
                  <span className="hidden sm:block">{isConnecting ? 'Connecting...' : 'Connect Wallet'}</span>
                </motion.button>
              ) : (
                <div className="flex items-center space-x-2">
                  {/* Balance Display */}
                  {balances && (
                    <div className="text-xs text-nb-ink text-right hidden md:block">
                      <div className="font-semibold">{formatBalance(balances.token)} fUSD</div>
                      <div className="text-nb-ink/60">{formatBalance(balances.native, 4)} KDA</div>
                    </div>
                  )}

                  {/* Connected Wallet */}
                  <motion.div
                    className="flex items-center space-x-2 bg-nb-ok/10 border border-nb-ok text-nb-ink font-semibold px-3 py-2 rounded-nb shadow-nb-sm"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="w-2 h-2 bg-nb-ok rounded-full animate-pulse"></div>
                    <Wallet size={14} />
                    <span className="font-mono text-sm">
                      {account?.slice(0, 4)}...{account?.slice(-4)}
                    </span>
                  </motion.div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content with proper top padding */}
      <main className="min-h-screen pt-16">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t-3 border-nb-ink bg-nb-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-4 mb-4 md:mb-0">
              <span className="text-nb-ink font-semibold">© 2025 FlashFlow Protocol</span>
              <div className="flex space-x-4 text-sm">
                <a href="#" className="text-nb-ink hover:text-nb-accent">Docs</a>
                <a href="#" className="text-nb-ink hover:text-nb-accent">GitHub</a>
                <a href="#" className="text-nb-ink hover:text-nb-accent">Discord</a>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Activity size={14} className="text-nb-ok" />
                <span className="text-sm text-nb-ink">Protocol: Live</span>
                <div className="w-2 h-2 bg-nb-ok rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;