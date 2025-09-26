import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  Gem, 
  TrendingUp, 
  Calendar, 
  DollarSign,
  Car,
  Watch,
  Plane,
  Star,
  Award,
  Shield,
  Target
} from 'lucide-react';
import NBButton from '../components/NBButton';
import NBCard from '../components/NBCard';
import RiskScoreBadge from '../components/RiskScoreBadge';
import PerformanceChart from '../components/PerformanceChart';
import receivablesService from '../services/receivablesService';

const Luxury = () => {
  const [luxuryAssets, setLuxuryAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    loadLuxuryAssets();
  }, []);

  const loadLuxuryAssets = async () => {
    try {
      const data = await receivablesService.fetchReceivables('luxury');
      setLuxuryAssets(data);
      if (data.length > 0) {
        setSelectedAsset(data[0]);
      }
    } catch (error) {
      console.error('Failed to load luxury assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { id: 'all', name: 'All Categories', icon: Gem, color: 'nb-accent' },
    { id: 'automotive', name: 'Automotive', icon: Car, color: 'nb-error' },
    { id: 'watches', name: 'Watches', icon: Watch, color: 'nb-purple' },
    { id: 'aviation', name: 'Aviation', icon: Plane, color: 'nb-accent-2' },
    { id: 'jewelry', name: 'Jewelry', icon: Gem, color: 'nb-pink' },
  ];

  const getAssetIcon = (asset) => {
    if (asset.toLowerCase().includes('ferrari') || asset.toLowerCase().includes('lamborghini')) {
      return <Car className="text-red-500" size={24} />;
    }
    if (asset.toLowerCase().includes('rolex') || asset.toLowerCase().includes('patek')) {
      return <Watch className="text-yellow-600" size={24} />;
    }
    if (asset.toLowerCase().includes('yacht') || asset.toLowerCase().includes('jet')) {
      return <Plane className="text-blue-500" size={24} />;
    }
    return <Gem className="text-purple-500" size={24} />;
  };

  const mockValueData = [
    { date: '2024-07', value: 250000 },
    { date: '2024-08', value: 252000 },
    { date: '2024-09', value: 255000 },
    { date: '2024-10', value: 253000 },
    { date: '2024-11', value: 258000 },
    { date: '2024-12', value: 260000 },
    { date: '2025-01', value: 262000 },
  ];

  const mockLeaseData = [
    { date: '2024-07', value: 14000 },
    { date: '2024-08', value: 15200 },
    { date: '2024-09', value: 15000 },
    { date: '2024-10', value: 15800 },
    { date: '2024-11', value: 15500 },
    { date: '2024-12', value: 15000 },
    { date: '2025-01', value: 16200 },
  ];

  if (loading) {
    return (
      <div className="min-h-screen py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin w-8 h-8 border-4 border-nb-accent border-t-transparent rounded-full"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="font-display font-bold text-4xl text-nb-ink mb-2">
                Luxury Asset Leases
              </h1>
              <p className="text-xl text-nb-ink/70">
                Premium asset lease monetization with exclusive access
              </p>
            </div>
            <Link to="/get-cash">
              <NBButton size="lg">
                <Plus size={20} className="mr-2" />
                Add Asset
              </NBButton>
            </Link>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2 mb-6">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-nb nb-border transition-colors ${
                  selectedCategory === category.id
                    ? `bg-${category.color} text-nb-ink font-semibold`
                    : 'bg-nb-card text-nb-ink/60 hover:bg-nb-accent/20'
                }`}
              >
                <category.icon size={16} />
                <span>{category.name}</span>
              </button>
            ))}
          </div>

          {/* Stats */}
          <div className="grid md:grid-cols-4 gap-4">
            <NBCard hover={false} padding="sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-nb-accent">
                  ${luxuryAssets.reduce((sum, a) => sum + a.leaseRevenue, 0).toLocaleString()}
                </div>
                <div className="text-sm text-nb-ink/60">Monthly Revenue</div>
              </div>
            </NBCard>
            <NBCard hover={false} padding="sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-nb-purple">
                  ${luxuryAssets.reduce((sum, a) => sum + a.residualValue, 0).toLocaleString()}
                </div>
                <div className="text-sm text-nb-ink/60">Total Asset Value</div>
              </div>
            </NBCard>
            <NBCard hover={false} padding="sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-nb-ok">
                  {luxuryAssets.length}
                </div>
                <div className="text-sm text-nb-ink/60">Premium Assets</div>
              </div>
            </NBCard>
            <NBCard hover={false} padding="sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-nb-pink">
                  15.2%
                </div>
                <div className="text-sm text-nb-ink/60">Avg APY</div>
              </div>
            </NBCard>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Asset List */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <NBCard>
                <h3 className="font-bold text-lg mb-4">Luxury Portfolio</h3>
                <div className="space-y-3">
                  {luxuryAssets.map((asset) => (
                    <motion.div
                      key={asset.id}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedAsset?.id === asset.id
                          ? 'bg-nb-accent/20 border-2 border-nb-accent'
                          : 'bg-nb-ink/5 hover:bg-nb-accent/10 border-2 border-transparent'
                      }`}
                      onClick={() => setSelectedAsset(asset)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center space-x-2">
                          {getAssetIcon(asset.asset)}
                          <h4 className="font-semibold text-sm">{asset.asset}</h4>
                        </div>
                        <RiskScoreBadge score={asset.riskScore} size="sm" showTooltip={false} />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-nb-ink/60">Revenue:</span>
                          <span className="ml-1 font-semibold">${asset.leaseRevenue.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-nb-ink/60">Term:</span>
                          <span className="ml-1 font-semibold">{asset.leaseTerm}M</span>
                        </div>
                      </div>
                      
                      <div className="mt-2 text-xs text-nb-ink/60">
                        Value: ${asset.residualValue.toLocaleString()}
                      </div>
                      
                      <div className={`mt-2 px-2 py-1 rounded text-xs font-semibold ${
                        asset.status === 'approved' ? 'bg-nb-ok text-nb-ink' :
                        asset.status === 'funded' ? 'bg-nb-accent text-nb-ink' :
                        'bg-nb-warn text-nb-ink'
                      }`}>
                        {asset.status === 'approved' ? '✅ Ready to Fund' :
                         asset.status === 'funded' ? '💰 Funded' :
                         '⏳ Under Review'}
                      </div>
                    </motion.div>
                  ))}
                </div>
                
                <NBButton variant="outline" className="w-full mt-4">
                  <Plus size={16} className="mr-2" />
                  Add Luxury Asset
                </NBButton>
              </NBCard>
            </motion.div>
          </div>

          {/* Asset Details */}
          <div className="lg:col-span-2 space-y-6">
            {selectedAsset ? (
              <>
                {/* Asset Overview */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <NBCard>
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-nb-purple to-nb-pink rounded-nb flex items-center justify-center">
                          {getAssetIcon(selectedAsset.asset)}
                        </div>
                        <div>
                          <h2 className="font-display font-bold text-2xl text-nb-ink">
                            {selectedAsset.asset}
                          </h2>
                          <div className="flex items-center space-x-4 text-nb-ink/70">
                            <div className="flex items-center space-x-1">
                              <Star className="text-yellow-500" size={16} />
                              <span>Premium Asset</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Calendar size={16} />
                              <span>{selectedAsset.leaseTerm} month lease</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-nb-accent">
                          ${selectedAsset.leaseRevenue.toLocaleString()}
                        </div>
                        <div className="text-sm text-nb-ink/60">Monthly Lease</div>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                      <div className="text-center">
                        <div className="flex items-center justify-center mb-2">
                          <DollarSign className="text-nb-purple mr-1" size={20} />
                          <span className="text-2xl font-bold text-nb-purple">
                            ${selectedAsset.residualValue.toLocaleString()}
                          </span>
                        </div>
                        <div className="text-sm text-nb-ink/60">Asset Value</div>
                      </div>

                      <div className="text-center">
                        <div className="flex items-center justify-center mb-2">
                          <TrendingUp className="text-nb-ok mr-1" size={20} />
                          <span className="text-2xl font-bold text-nb-ok">
                            +3.2%
                          </span>
                        </div>
                        <div className="text-sm text-nb-ink/60">Annual Appreciation</div>
                      </div>

                      <div className="text-center">
                        <div className="flex items-center justify-center mb-2">
                          <Target className="text-nb-pink mr-1" size={20} />
                          <span className="text-2xl font-bold text-nb-pink">
                            {((100 - selectedAsset.riskScore) * 0.5 + 12).toFixed(1)}%
                          </span>
                        </div>
                        <div className="text-sm text-nb-ink/60">Target APY</div>
                      </div>
                    </div>
                  </NBCard>
                </motion.div>

                {/* Performance Charts */}
                <motion.div
                  className="grid md:grid-cols-2 gap-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <PerformanceChart
                    title="Asset Value"
                    data={mockValueData}
                    color="#A855F7"
                    height={250}
                  />
                  
                  <PerformanceChart
                    title="Lease Revenue"
                    data={mockLeaseData}
                    color="#EC4899"
                    height={250}
                  />
                </motion.div>

                {/* Asset Analysis */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <NBCard>
                    <h3 className="font-bold text-xl mb-6">Premium Asset Analysis</h3>
                    
                    <div className="grid md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <h4 className="font-semibold">Asset Details</h4>
                        
                        <div className="space-y-3">
                          <div className="p-4 bg-nb-purple/10 rounded-nb">
                            <h5 className="font-semibold mb-2 flex items-center">
                              <Award className="mr-2 text-nb-purple" size={16} />
                              Authenticity & Provenance
                            </h5>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-nb-ink/70">Authentication:</span>
                                <span className="font-semibold text-nb-ok">Verified</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-nb-ink/70">Provenance:</span>
                                <span className="font-semibold">Documented</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-nb-ink/70">Condition:</span>
                                <span className="font-semibold text-nb-ok">Excellent</span>
                              </div>
                            </div>
                          </div>

                          <div className="p-4 bg-nb-pink/10 rounded-nb">
                            <h5 className="font-semibold mb-2 flex items-center">
                              <Shield className="mr-2 text-nb-pink" size={16} />
                              Insurance & Storage
                            </h5>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-nb-ink/70">Insurance:</span>
                                <span className="font-semibold">Full Coverage</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-nb-ink/70">Storage:</span>
                                <span className="font-semibold">Climate Controlled</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-nb-ink/70">Security:</span>
                                <span className="font-semibold text-nb-ok">24/7 Monitored</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-semibold">Market Analysis</h4>
                        
                        <div className="space-y-3">
                          <div className="p-4 bg-nb-accent/10 rounded-nb">
                            <h5 className="font-semibold mb-2">Market Sentiment</h5>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-nb-ink/70">Collector Demand:</span>
                                <span className="font-semibold text-nb-ok">High</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-nb-ink/70">Market Liquidity:</span>
                                <span className="font-semibold">Good</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-nb-ink/70">Price Trend:</span>
                                <span className="font-semibold text-nb-ok">Stable+</span>
                              </div>
                            </div>
                          </div>

                          <div className="p-4 bg-nb-ok/10 rounded-nb">
                            <h5 className="font-semibold mb-2">Financing Terms</h5>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-nb-ink/70">Max Advance:</span>
                                <span className="font-semibold">${(selectedAsset.leaseRevenue * 24).toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-nb-ink/70">Recommended:</span>
                                <span className="font-semibold text-nb-accent">${(selectedAsset.leaseRevenue * 18).toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-nb-ink/70">Premium APY:</span>
                                <span className="font-semibold text-nb-pink">
                                  {((100 - selectedAsset.riskScore) * 0.5 + 12).toFixed(1)}%
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="p-4 bg-nb-warn/10 rounded-nb border border-nb-warn/20">
                            <h5 className="font-semibold mb-2">Risk Factors</h5>
                            <div className="space-y-1 text-sm">
                              <div>• Market volatility for luxury assets</div>
                              <div>• Depreciation risk consideration</div>
                              <div>• Maintenance and insurance costs</div>
                              <div>• Liquidity constraints during downturns</div>
                            </div>
                          </div>
                        </div>

                        {selectedAsset.status === 'approved' && (
                          <NBButton size="lg" className="w-full">
                            <Gem size={16} className="mr-2" />
                            Access Premium Funding
                          </NBButton>
                        )}
                      </div>
                    </div>
                  </NBCard>
                </motion.div>
              </>
            ) : (
              <NBCard>
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">💎</div>
                  <h3 className="font-bold text-xl text-nb-ink mb-2">No Luxury Assets</h3>
                  <p className="text-nb-ink/70 mb-6">
                    Add your premium assets to access exclusive financing opportunities.
                  </p>
                  <Link to="/get-cash">
                    <NBButton>
                      <Plus size={16} className="mr-2" />
                      Add Luxury Asset
                    </NBButton>
                  </Link>
                </div>
              </NBCard>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Luxury;
