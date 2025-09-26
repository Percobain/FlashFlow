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

const Layout = ({ children }) => {
  const location = useLocation();
  
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

  return (
    <div className="min-h-screen bg-nb-bg">
      {/* Header */}
      <header className="border-b-3 border-nb-ink bg-nb-card shadow-nb-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <motion.div
                className="w-8 h-8 bg-gradient-to-r from-nb-accent to-nb-accent-2 rounded-lg nb-border flex items-center justify-center"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="text-nb-ink font-bold text-lg">₿</span>
              </motion.div>
              <span className="font-display font-bold text-xl text-nb-ink">
                Flash<span className="text-nb-accent">Flow</span>
              </span>
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex space-x-8">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors ${
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

            {/* Connect Button */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm">
                <div className="flex items-center space-x-1">
                  <Globe size={14} className="text-nb-accent" />
                  <span className="text-nb-ink font-medium">Polygon</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Shield size={14} className="text-nb-ok" />
                  <span className="text-nb-ink font-medium">Verified</span>
                </div>
              </div>
              
              <motion.button
                className="flex items-center space-x-2 bg-nb-accent hover:bg-nb-accent/80 text-nb-ink font-semibold px-4 py-2 rounded-nb nb-border shadow-nb-sm transition-transform hover:-translate-y-1 active:translate-y-0"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Wallet size={16} />
                <span>0x1234...5678</span>
              </motion.button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t-3 border-nb-ink bg-nb-card mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                <span className="text-sm text-nb-ink">Risk Score: Live</span>
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