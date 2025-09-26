import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  Play, 
  Users, 
  Heart, 
  Eye, 
  TrendingUp,
  Star,
  Camera,
  Music,
  Video,
  Gamepad2
} from 'lucide-react';
import NBButton from '../components/NBButton';
import NBCard from '../components/NBCard';
import RiskScoreBadge from '../components/RiskScoreBadge';
import PerformanceChart from '../components/PerformanceChart';
import receivablesService from '../services/receivablesService';

const Creators = () => {
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [selectedCreator, setSelectedCreator] = useState(null);

  useEffect(() => {
    loadCreators();
  }, []);

  const loadCreators = async () => {
    try {
      const data = await receivablesService.fetchReceivables('creator');
      setCreators(data);
      if (data.length > 0) {
        setSelectedCreator(data[0]);
      }
    } catch (error) {
      console.error('Failed to load creators:', error);
    } finally {
      setLoading(false);
    }
  };

  const platforms = [
    { id: 'all', name: 'All Platforms', icon: '🌐', color: 'nb-accent' },
    { id: 'YouTube', name: 'YouTube', icon: '🎥', color: 'nb-error' },
    { id: 'Twitch', name: 'Twitch', icon: '🎮', color: 'nb-purple' },
    { id: 'TikTok', name: 'TikTok', icon: '🎵', color: 'nb-pink' },
    { id: 'Spotify', name: 'Spotify', icon: '🎧', color: 'nb-ok' },
  ];

  const filteredCreators = selectedPlatform === 'all' 
    ? creators 
    : creators.filter(creator => creator.platform === selectedPlatform);

  const getPlatformIcon = (platform) => {
    switch (platform) {
      case 'YouTube': return <Video className="text-red-500" size={16} />;
      case 'Twitch': return <Gamepad2 className="text-purple-500" size={16} />;
      case 'TikTok': return <Music className="text-pink-500" size={16} />;
      case 'Spotify': return <Music className="text-green-500" size={16} />;
      default: return <Camera className="text-nb-accent" size={16} />;
    }
  };

  const mockRevenueData = [
    { date: '2024-07', value: 6200 },
    { date: '2024-08', value: 6800 },
    { date: '2024-09', value: 7500 },
    { date: '2024-10', value: 8200 },
    { date: '2024-11', value: 7800 },
    { date: '2024-12', value: 8600 },
    { date: '2025-01', value: 9200 },
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
                Creator Economy
              </h1>
              <p className="text-xl text-nb-ink/70">
                Fund content creators and monetize audience engagement
              </p>
            </div>
            <Link to="/get-cash">
              <NBButton size="lg">
                <Plus size={20} className="mr-2" />
                Connect Platform
              </NBButton>
            </Link>
          </div>

          {/* Platform Filter */}
          <div className="flex flex-wrap gap-2 mb-6">
            {platforms.map((platform) => (
              <button
                key={platform.id}
                onClick={() => setSelectedPlatform(platform.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-nb nb-border transition-colors ${
                  selectedPlatform === platform.id
                    ? `bg-${platform.color} text-nb-ink font-semibold`
                    : 'bg-nb-card text-nb-ink/60 hover:bg-nb-accent/20'
                }`}
              >
                <span className="text-lg">{platform.icon}</span>
                <span>{platform.name}</span>
              </button>
            ))}
          </div>

          {/* Stats */}
          <div className="grid md:grid-cols-4 gap-4">
            <NBCard hover={false} padding="sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-nb-accent">
                  ${filteredCreators.reduce((sum, c) => sum + c.monthlyRevenue, 0).toLocaleString()}
                </div>
                <div className="text-sm text-nb-ink/60">Total Revenue</div>
              </div>
            </NBCard>
            <NBCard hover={false} padding="sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-nb-purple">
                  {(filteredCreators.reduce((sum, c) => sum + c.subscribers, 0) / 1000).toFixed(0)}K
                </div>
                <div className="text-sm text-nb-ink/60">Total Followers</div>
              </div>
            </NBCard>
            <NBCard hover={false} padding="sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-nb-ok">
                  {filteredCreators.length > 0 ? 
                    (filteredCreators.reduce((sum, c) => sum + c.engagementRate, 0) / filteredCreators.length).toFixed(1) : 0}%
                </div>
                <div className="text-sm text-nb-ink/60">Avg Engagement</div>
              </div>
            </NBCard>
            <NBCard hover={false} padding="sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-nb-accent-2">
                  13.5%
                </div>
                <div className="text-sm text-nb-ink/60">Avg APY</div>
              </div>
            </NBCard>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Creator List */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <NBCard>
                <h3 className="font-bold text-lg mb-4">Connected Creators</h3>
                <div className="space-y-3">
                  {filteredCreators.map((creator) => (
                    <motion.div
                      key={creator.id}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedCreator?.id === creator.id
                          ? 'bg-nb-accent/20 border-2 border-nb-accent'
                          : 'bg-nb-ink/5 hover:bg-nb-accent/10 border-2 border-transparent'
                      }`}
                      onClick={() => setSelectedCreator(creator)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center space-x-2">
                          {getPlatformIcon(creator.platform)}
                          <h4 className="font-semibold">{creator.channel}</h4>
                        </div>
                        <RiskScoreBadge score={creator.riskScore} size="sm" showTooltip={false} />
                      </div>
                      
                      <div className="text-xs text-nb-ink/60 mb-2">{creator.platform}</div>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-nb-ink/60">Revenue:</span>
                          <span className="ml-1 font-semibold">${creator.monthlyRevenue.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-nb-ink/60">Followers:</span>
                          <span className="ml-1 font-semibold">{(creator.subscribers / 1000).toFixed(0)}K</span>
                        </div>
                      </div>
                      
                      <div className={`mt-2 px-2 py-1 rounded text-xs font-semibold ${
                        creator.status === 'approved' ? 'bg-nb-ok text-nb-ink' :
                        creator.status === 'funded' ? 'bg-nb-accent text-nb-ink' :
                        'bg-nb-warn text-nb-ink'
                      }`}>
                        {creator.status === 'approved' ? '✅ Ready to Fund' :
                         creator.status === 'funded' ? '💰 Funded' :
                         '⏳ Under Review'}
                      </div>
                    </motion.div>
                  ))}
                </div>
                
                <NBButton variant="outline" className="w-full mt-4">
                  <Plus size={16} className="mr-2" />
                  Connect New Platform
                </NBButton>
              </NBCard>
            </motion.div>
          </div>

          {/* Creator Details */}
          <div className="lg:col-span-2 space-y-6">
            {selectedCreator ? (
              <>
                {/* Creator Overview */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <NBCard>
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-nb-accent to-nb-accent-2 rounded-nb flex items-center justify-center text-2xl">
                          {getPlatformIcon(selectedCreator.platform)}
                        </div>
                        <div>
                          <h2 className="font-display font-bold text-2xl text-nb-ink">
                            {selectedCreator.channel}
                          </h2>
                          <div className="flex items-center space-x-2 text-nb-ink/70">
                            <span>{selectedCreator.platform}</span>
                            <span>•</span>
                            <div className="flex items-center space-x-1">
                              <Star className="text-nb-warn" size={14} />
                              <span>{selectedCreator.engagementRate}% engagement</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-nb-accent">
                          ${selectedCreator.monthlyRevenue.toLocaleString()}
                        </div>
                        <div className="text-sm text-nb-ink/60">Monthly Revenue</div>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                      <div className="text-center">
                        <div className="flex items-center justify-center mb-2">
                          <Users className="text-nb-purple mr-1" size={20} />
                          <span className="text-2xl font-bold text-nb-purple">
                            {(selectedCreator.subscribers / 1000).toFixed(0)}K
                          </span>
                        </div>
                        <div className="text-sm text-nb-ink/60">Subscribers/Followers</div>
                      </div>

                      <div className="text-center">
                        <div className="flex items-center justify-center mb-2">
                          <Heart className="text-nb-pink mr-1" size={20} />
                          <span className="text-2xl font-bold text-nb-pink">
                            {selectedCreator.engagementRate}%
                          </span>
                        </div>
                        <div className="text-sm text-nb-ink/60">Engagement Rate</div>
                      </div>

                      <div className="text-center">
                        <div className="flex items-center justify-center mb-2">
                          <TrendingUp className="text-nb-ok mr-1" size={20} />
                          <span className="text-2xl font-bold text-nb-ok">
                            +15.2%
                          </span>
                        </div>
                        <div className="text-sm text-nb-ink/60">Growth Rate</div>
                      </div>
                    </div>
                  </NBCard>
                </motion.div>

                {/* Revenue Chart */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <PerformanceChart
                    title="Revenue Trend"
                    data={mockRevenueData}
                    color="#A855F7"
                    height={300}
                  />
                </motion.div>

                {/* Creator Lineup Options */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <NBCard>
                    <h3 className="font-bold text-xl mb-6">Creator Lineup Options</h3>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h4 className="font-semibold">Solo Creator Fund</h4>
                        <div className="p-4 bg-nb-accent/10 rounded-nb">
                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <span className="text-sm text-nb-ink/70">Available Amount:</span>
                              <span className="font-bold">${(selectedCreator.monthlyRevenue * 8).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-nb-ink/70">Est. APY:</span>
                              <span className="font-bold text-nb-accent">
                                {((100 - selectedCreator.riskScore) * 0.4 + 10).toFixed(1)}%
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-nb-ink/70">Funding Speed:</span>
                              <span className="font-bold">24-48 hours</span>
                            </div>
                          </div>
                          
                          {selectedCreator.status === 'approved' && (
                            <NBButton className="w-full mt-4">
                              Fund Solo Creator
                            </NBButton>
                          )}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-semibold">Creator Lineup (Diversified)</h4>
                        <div className="p-4 bg-nb-purple/10 rounded-nb">
                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <span className="text-sm text-nb-ink/70">Lineup Value:</span>
                              <span className="font-bold">${(selectedCreator.monthlyRevenue * 12).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-nb-ink/70">Est. APY:</span>
                              <span className="font-bold text-nb-purple">15.8%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-nb-ink/70">Risk Reduction:</span>
                              <span className="font-bold">~25%</span>
                            </div>
                          </div>
                          
                          <div className="mt-4 text-xs text-nb-ink/70">
                            Includes 3-5 similar creators for diversification
                          </div>
                          
                          <NBButton variant="outline" className="w-full mt-4">
                            Join Creator Lineup
                          </NBButton>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 p-4 bg-nb-warn/10 rounded-nb border border-nb-warn/20">
                      <h4 className="font-semibold mb-2">Creator Benefits</h4>
                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <TrendingUp className="text-nb-ok" size={14} />
                            <span>Revenue-based repayment</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Users className="text-nb-accent" size={14} />
                            <span>No equity dilution</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Star className="text-nb-purple" size={14} />
                            <span>Creator-friendly terms</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Eye className="text-nb-accent-2" size={14} />
                            <span>Platform agnostic</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </NBCard>
                </motion.div>
              </>
            ) : (
              <NBCard>
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">🎨</div>
                  <h3 className="font-bold text-xl text-nb-ink mb-2">No Creators Connected</h3>
                  <p className="text-nb-ink/70 mb-6">
                    Connect your creator platforms to access funding and lineup opportunities.
                  </p>
                  <Link to="/get-cash">
                    <NBButton>
                      <Plus size={16} className="mr-2" />
                      Connect Creator Platform
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

export default Creators;
