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
  FileText,
  Monitor,
  Camera,
  Home as HomeIcon,
  Gem
} from 'lucide-react';
import NBButton from '../components/NBButton';
import NBCard from '../components/NBCard';
import StatPill from '../components/StatPill';
import PerformanceChart from '../components/PerformanceChart';

const Home = () => {
  const [stats, setStats] = useState({
    totalLocked: 2400000,
    investors: 1247,
    avgAPY: 12.4,
    payouts: 847
  });
  
  // Mock live stats updates
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => ({
        totalLocked: prev.totalLocked + Math.random() * 10000 - 5000,
        investors: prev.investors + Math.floor(Math.random() * 3),
        avgAPY: prev.avgAPY + (Math.random() - 0.5) * 0.1,
        payouts: prev.payouts + Math.floor(Math.random() * 2)
      }));
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  const useCases = [
    {
      id: 'invoices',
      title: 'Invoice Factoring',
      description: 'Convert B2B invoices into immediate cash flow',
      icon: FileText,
      color: 'nb-accent',
      stats: '$1.2M+ processed',
      path: '/invoices'
    },
    {
      id: 'saas',
      title: 'SaaS MRR',
      description: 'Monetize monthly recurring revenue streams',
      icon: Monitor,
      color: 'nb-accent-2',
      stats: '150+ SaaS funded',
      path: '/saas'
    },
    {
      id: 'creators',
      title: 'Creator Economy',
      description: 'Fund content creators and influencers',
      icon: Camera,
      color: 'nb-purple',
      stats: '500K+ followers',
      path: '/creators'
    },
    {
      id: 'rentals',
      title: 'Rental Income',
      description: 'Tokenize real estate rental cash flows',
      icon: HomeIcon,
      color: 'nb-ok',
      stats: '95% occupancy',
      path: '/rentals'
    },
    {
      id: 'luxury',
      title: 'Luxury Assets',
      description: 'Premium asset lease monetization',
      icon: Gem,
      color: 'nb-pink',
      stats: '$500K+ assets',
      path: '/luxury'
    }
  ];
  
  const mockChartData = [
    { date: '2025-01', value: 100 },
    { date: '2025-02', value: 105 },
    { date: '2025-03', value: 108 },
    { date: '2025-04', value: 112 },
    { date: '2025-05', value: 118 },
    { date: '2025-06', value: 124 },
    { date: '2025-07', value: 127 },
    { date: '2025-08', value: 131 },
    { date: '2025-09', value: 135 },
  ];
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };
  
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-nb-bg via-nb-accent/10 to-nb-accent-2/10 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.h1 
              className="font-display font-bold text-5xl md:text-7xl text-nb-ink mb-6"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              Turn Tomorrow's Cash Into{' '}
              <span className="text-transparent bg-gradient-to-r from-nb-accent to-nb-accent-2 bg-clip-text">
                Today's Capital
              </span>
            </motion.h1>
            
            <motion.p 
              className="text-xl text-nb-ink/70 mb-8 max-w-3xl mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              FlashFlow Protocol enables universal tokenization of cash flows across invoices, 
              SaaS revenue, creator income, rentals, and luxury assets with AI-powered risk scoring.
            </motion.p>
            
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Link to="/get-cash">
                <NBButton size="xl" className="w-full sm:w-auto">
                  Get Cash Now <ArrowRight className="ml-2" size={20} />
                </NBButton>
              </Link>
              <Link to="/invest">
                <NBButton variant="outline" size="xl" className="w-full sm:w-auto">
                  Explore Investments
                </NBButton>
              </Link>
            </motion.div>
            
            {/* Animated Cash Flow Visualization */}
            <motion.div 
              className="relative h-32 overflow-hidden rounded-nb bg-nb-card/50 backdrop-blur-sm nb-border"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex space-x-8 items-center">
                  <div className="text-center">
                    <div className="text-2xl mb-2">💰</div>
                    <div className="text-sm text-nb-ink/60">Future Cash</div>
                  </div>
                  <motion.div
                    className="flex space-x-2"
                    animate={{ x: [0, 20, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    {[...Array(5)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="w-2 h-2 bg-nb-accent rounded-full"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1, delay: i * 0.2, repeat: Infinity }}
                      />
                    ))}
                  </motion.div>
                  <div className="text-center">
                    <div className="text-2xl mb-2">🏦</div>
                    <div className="text-sm text-nb-ink/60">Instant Capital</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>
      
      {/* Live Stats Ticker */}
      <section className="bg-nb-ink text-nb-card py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="flex flex-wrap justify-center items-center gap-8"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.div variants={itemVariants}>
              <StatPill
                value={`$${(stats.totalLocked / 1000000).toFixed(1)}M`}
                label="Total Locked"
                icon={DollarSign}
                color="nb-accent"
                animated={false}
              />
            </motion.div>
            <motion.div variants={itemVariants}>
              <StatPill
                value={stats.investors.toLocaleString()}
                label="Investors"
                icon={Users}
                color="nb-accent-2"
                animated={false}
              />
            </motion.div>
            <motion.div variants={itemVariants}>
              <StatPill
                value={`${stats.avgAPY.toFixed(1)}%`}
                label="Avg APY"
                icon={TrendingUp}
                color="nb-ok"
                animated={false}
              />
            </motion.div>
            <motion.div variants={itemVariants}>
              <StatPill
                value={stats.payouts.toLocaleString()}
                label="Payouts Made"
                icon={Zap}
                color="nb-purple"
                animated={false}
              />
            </motion.div>
          </motion.div>
        </div>
      </section>
      
      {/* Use Cases */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display font-bold text-4xl text-nb-ink mb-4">
              Universal Cash Flow Tokenization
            </h2>
            <p className="text-xl text-nb-ink/70 max-w-3xl mx-auto">
              Five proven revenue streams, one unified protocol. Tokenize any cash flow 
              with AI risk scoring and decentralized reputation.
            </p>
          </motion.div>
          
          <motion.div 
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {useCases.map((useCase, index) => {
              const Icon = useCase.icon;
              return (
                <motion.div key={useCase.id} variants={itemVariants}>
                  <Link to={useCase.path}>
                    <NBCard className="h-full group cursor-pointer">
                      <div className={`w-12 h-12 bg-${useCase.color} rounded-nb flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                        <Icon size={24} className="text-nb-ink" />
                      </div>
                      
                      <h3 className="font-display font-bold text-xl text-nb-ink mb-2">
                        {useCase.title}
                      </h3>
                      
                      <p className="text-nb-ink/70 mb-4">
                        {useCase.description}
                      </p>
                      
                      <div className="flex justify-between items-center">
                        <span className={`text-sm font-semibold text-${useCase.color.replace('nb-', '')}`}>
                          {useCase.stats}
                        </span>
                        <ArrowRight 
                          size={16} 
                          className="text-nb-ink/40 group-hover:text-nb-ink group-hover:translate-x-1 transition-all" 
                        />
                      </div>
                    </NBCard>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>
      
      {/* How It Works */}
      <section className="py-20 bg-nb-accent/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display font-bold text-4xl text-nb-ink mb-4">
              How FlashFlow Works
            </h2>
            <p className="text-xl text-nb-ink/70">
              Three simple steps to unlock your cash flow potential
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Connect & Analyze',
                description: 'Connect your revenue source and let our AI analyze your cash flow patterns with 90%+ accuracy',
                icon: '🔗'
              },
              {
                step: '02', 
                title: 'Get Instant Offer',
                description: 'Receive a personalized offer based on AI risk scoring and DID reputation within minutes',
                icon: '⚡'
              },
              {
                step: '03',
                title: 'Tokenize & Earn',
                description: 'Your cash flow is tokenized into baskets where investors can fund your future revenue',
                icon: '💰'
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
              >
                <NBCard>
                  <div className="text-center">
                    <div className="text-4xl mb-4">{item.icon}</div>
                    <div className="text-6xl font-display font-bold text-nb-accent/20 mb-4">
                      {item.step}
                    </div>
                    <h3 className="font-display font-bold text-xl text-nb-ink mb-4">
                      {item.title}
                    </h3>
                    <p className="text-nb-ink/70">
                      {item.description}
                    </p>
                  </div>
                </NBCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Trust Indicators */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <NBCard>
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-12 h-12 bg-nb-accent rounded-nb flex items-center justify-center">
                    <Shield size={24} className="text-nb-ink" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Powered by Self.xyz DID</h3>
                    <p className="text-nb-ink/60">Universal reputation system</p>
                  </div>
                </div>
                <p className="text-sm text-nb-ink/70">
                  Cross-platform reputation tracking ensures trust and accountability 
                  across all cash flow tokenization activities.
                </p>
              </NBCard>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <NBCard>
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-12 h-12 bg-nb-accent-2 rounded-nb flex items-center justify-center">
                    <TrendingUp size={24} className="text-nb-ink" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">AI Risk Oracle</h3>
                    <p className="text-nb-ink/60">Real-time risk assessment</p>
                  </div>
                </div>
                <p className="text-sm text-nb-ink/70">
                  Advanced machine learning models provide transparent, 
                  accurate risk scoring for all tokenized cash flows.
                </p>
              </NBCard>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
            >
              <NBCard>
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-12 h-12 bg-nb-ok rounded-nb flex items-center justify-center">
                    <Users size={24} className="text-nb-ink" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">DAO Governance</h3>
                    <p className="text-nb-ink/60">Community-driven protocol</p>
                  </div>
                </div>
                <p className="text-sm text-nb-ink/70">
                  Decentralized governance ensures fair, transparent 
                  decision-making for protocol upgrades and parameters.
                </p>
              </NBCard>
            </motion.div>
          </div>
        </div>
      </section>
      
      {/* Live Performance Chart */}
      <section className="py-20 bg-nb-accent/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <PerformanceChart
              title="Live Basket Performance"
              data={mockChartData}
              type="area"
              color="#6EE7B7"
              height={400}
            />
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Home;