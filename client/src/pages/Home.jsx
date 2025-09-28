import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  TrendingUp, 
  Shield, 
  Zap, 
  Users, 
  DollarSign,
  BarChart3,
  Activity,
  Globe,
  Wallet
} from 'lucide-react';
import { formatNumber, formatCurrency } from '../lib/utils';

// Import Web3Integration for testing
import Web3Integration from '../components/Web3Integration';

const Home = () => {
  const [stats, setStats] = useState({
    totalAssets: 2400000000, // 2.4B
    totalFunded: 1800000000, // 1.8B
    activeInvestors: 45000, // 45K
    averageReturn: 12.3
  });

  const [showWeb3Test, setShowWeb3Test] = useState(false);

  const assetTypes = [
    {
      id: 'invoices',
      title: 'Invoices & Receivables',
      description: 'Convert outstanding invoices into immediate cash flow',
      icon: DollarSign,
      color: 'from-green-400 to-green-600',
      stats: { volume: 847000000, count: 12400, apy: 8.2 },
      path: '/invoices'
    },
    {
      id: 'saas',
      title: 'SaaS Revenue Streams', 
      description: 'Tokenize recurring SaaS revenue for upfront capital',
      icon: TrendingUp,
      color: 'from-blue-400 to-blue-600',
      stats: { volume: 423000000, count: 3200, apy: 11.5 },
      path: '/saas'
    },
    {
      id: 'creators',
      title: 'Creator Economy',
      description: 'Fund creators against future revenue potential',
      icon: Users,
      color: 'from-purple-400 to-purple-600', 
      stats: { volume: 156000000, count: 8700, apy: 15.2 },
      path: '/creators'
    },
    {
      id: 'rentals',
      title: 'Real Estate Income',
      description: 'Liquidity against rental property cash flows',
      icon: BarChart3,
      color: 'from-orange-400 to-orange-600',
      stats: { volume: 892000000, count: 2100, apy: 9.8 },
      path: '/rentals'
    }
  ];

  const features = [
    {
      icon: Shield,
      title: 'AI-Powered Risk Assessment',
      description: 'Advanced algorithms evaluate asset quality and predict payment behavior with 94% accuracy.'
    },
    {
      icon: Zap,
      title: 'Instant Liquidity',
      description: 'Access cash within minutes of asset verification. No lengthy approval processes.'
    },
    {
      icon: Globe,
      title: 'Global Asset Network',
      description: 'Diversified exposure across industries, geographies, and asset classes for optimal returns.'
    },
    {
      icon: Activity,
      title: 'Real-Time Analytics',
      description: 'Live performance tracking, risk monitoring, and automated rebalancing for your portfolio.'
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="min-h-screen bg-gradient-to-br from-nb-bg via-nb-card to-nb-bg flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-8"
            >
              <div className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="inline-flex items-center space-x-2 bg-nb-accent/10 border border-nb-accent px-4 py-2 rounded-full"
                >
                  <Zap size={16} className="text-nb-accent" />
                  <span className="text-sm font-medium text-nb-ink">AI-Powered Asset Financing</span>
                </motion.div>
                
                <h1 className="text-4xl lg:text-6xl font-display font-bold text-nb-ink leading-tight">
                  Turn Future Cash Flow Into{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-nb-accent to-nb-accent-2">
                    Instant Liquidity
                  </span>
                </h1>
                
                <p className="text-xl text-nb-ink/70 leading-relaxed">
                  FlashFlow connects asset originators with global investors through AI-driven risk assessment 
                  and blockchain-secured transactions. Get funding in minutes, not months.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/get-cash">
                  <motion.button
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center space-x-2 bg-nb-accent hover:bg-nb-accent/90 text-nb-ink font-semibold px-6 py-3 rounded-nb nb-border shadow-nb-lg transition-all group"
                  >
                    <DollarSign size={20} />
                    <span>Get Cash Now</span>
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </motion.button>
                </Link>
                
                <Link to="/invest">
                  <motion.button
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center space-x-2 bg-nb-card border-2 border-nb-ink hover:bg-nb-accent/10 text-nb-ink font-semibold px-6 py-3 rounded-nb shadow-nb-sm transition-all group"
                  >
                    <TrendingUp size={20} />
                    <span>Start Investing</span>
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </motion.button>
                </Link>
              </div>

              {/* Web3 Test Button */}
              <div className="pt-4">
                <button
                  onClick={() => setShowWeb3Test(!showWeb3Test)}
                  className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors"
                >
                  <Wallet size={16} />
                  <span>{showWeb3Test ? 'Hide' : 'Show'} Web3 Integration Test</span>
                </button>
              </div>
            </motion.div>

            {/* Right Column - Stats Dashboard */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="relative"
            >
              <div className="bg-nb-card nb-border rounded-2xl shadow-nb-lg p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-nb-ink">Protocol Statistics</h3>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-nb-ok rounded-full animate-pulse"></div>
                    <span className="text-sm text-nb-ok font-medium">Live</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <p className="text-sm text-nb-ink/60">Total Assets</p>
                    <p className="text-2xl font-bold text-nb-ink">{formatCurrency(stats.totalAssets)}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-nb-ink/60">Total Funded</p>
                    <p className="text-2xl font-bold text-nb-ink">{formatCurrency(stats.totalFunded)}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-nb-ink/60">Active Investors</p>
                    <p className="text-2xl font-bold text-nb-ink">{formatNumber(stats.activeInvestors)}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-nb-ink/60">Avg. Return</p>
                    <p className="text-2xl font-bold text-nb-ok">{stats.averageReturn.toFixed(2)}%</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Web3 Integration Test Section */}
      {showWeb3Test && (
        <section className="py-16 bg-nb-card border-t border-nb-ink">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-nb-ink mb-4">Web3 Integration Test</h2>
              <p className="text-nb-ink/70">Test wallet connection and smart contract interactions</p>
            </div>
            <Web3Integration />
          </div>
        </section>
      )}

      {/* Asset Types Section */}
      <section className="py-20 bg-nb-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-nb-ink mb-4">
              Supported Asset Classes
            </h2>
            <p className="text-xl text-nb-ink/70 max-w-3xl mx-auto">
              Diversify your liquidity strategy across multiple asset types, each with unique risk profiles and return characteristics.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {assetTypes.map((asset, index) => {
              const Icon = asset.icon;
              return (
                <motion.div
                  key={asset.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -8 }}
                  className="group"
                >
                  <Link to={asset.path}>
                    <div className="bg-nb-card nb-border rounded-xl p-6 shadow-nb-sm hover:shadow-nb-lg transition-all duration-300 h-full">
                      <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${asset.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                        <Icon size={24} className="text-white" />
                      </div>
                      
                      <h3 className="text-lg font-semibold text-nb-ink mb-2 group-hover:text-nb-accent transition-colors">
                        {asset.title}
                      </h3>
                      
                      <p className="text-nb-ink/70 text-sm mb-4 leading-relaxed">
                        {asset.description}
                      </p>
                      
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-nb-ink/60">Volume:</span>
                          <span className="font-semibold text-nb-ink">{formatCurrency(asset.stats.volume)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-nb-ink/60">Assets:</span>
                          <span className="font-semibold text-nb-ink">{formatNumber(asset.stats.count)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-nb-ink/60">Avg APY:</span>
                          <span className="font-semibold text-nb-ok">{asset.stats.apy.toFixed(2)}%</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-nb-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-nb-ink mb-4">
              Why Choose FlashFlow?
            </h2>
            <p className="text-xl text-nb-ink/70 max-w-3xl mx-auto">
              Built on cutting-edge technology to deliver the fastest, safest, and most efficient asset financing platform.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="text-center group"
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-nb-accent to-nb-accent-2 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform shadow-nb-sm">
                    <Icon size={28} className="text-nb-ink" />
                  </div>
                  
                  <h3 className="text-lg font-semibold text-nb-ink mb-3">
                    {feature.title}
                  </h3>
                  
                  <p className="text-nb-ink/70 leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-nb-accent/10 to-nb-accent-2/10 border-t border-nb-ink">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-nb-ink">
              Ready to Transform Your Cash Flow?
            </h2>
            <p className="text-xl text-nb-ink/70 max-w-2xl mx-auto">
              Join thousands of businesses and investors who trust FlashFlow for their financing needs.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/get-cash">
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center space-x-2 bg-nb-accent hover:bg-nb-accent/90 text-nb-ink font-semibold px-8 py-4 rounded-nb nb-border shadow-nb-lg transition-all group"
                >
                  <DollarSign size={20} />
                  <span>Get Instant Funding</span>
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </motion.button>
              </Link>
              
              <Link to="/invest">
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center space-x-2 bg-nb-card border-2 border-nb-ink hover:bg-nb-accent/10 text-nb-ink font-semibold px-8 py-4 rounded-nb shadow-nb-sm transition-all group"
                >
                  <TrendingUp size={20} />
                  <span>Start Investing</span>
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Home;