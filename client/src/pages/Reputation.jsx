import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, 
  TrendingUp, 
  TrendingDown,
  CheckCircle, 
  AlertTriangle,
  Eye,
  EyeOff,
  Settings,
  Award,
  Star,
  Link as LinkIcon,
  RefreshCw
} from 'lucide-react';
import NBButton from '../components/NBButton';
import NBCard from '../components/NBCard';
import PerformanceChart from '../components/PerformanceChart';
import didService from '../services/didService';
import useAppStore from '../stores/appStore';

const Reputation = () => {
  const { user } = useAppStore();
  const [reputation, setReputation] = useState(null);
  const [crossPlatform, setCrossPlatform] = useState(null);
  const [loading, setLoading] = useState(true);
  const [privacySettings, setPrivacySettings] = useState({
    showScore: true,
    showHistory: true,
    showVerifications: true,
    shareData: false,
  });

  useEffect(() => {
    loadReputationData();
  }, []);

  const loadReputationData = async () => {
    try {
      const [repData, crossData] = await Promise.all([
        didService.getReputation(user.address),
        didService.getCrossPlatformReputation(user.address)
      ]);
      
      setReputation(repData);
      setCrossPlatform(crossData);
    } catch (error) {
      console.error('Failed to load reputation data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 800) return 'text-nb-ok';
    if (score >= 740) return 'text-nb-accent';
    if (score >= 670) return 'text-nb-warn';
    return 'text-nb-error';
  };

  const getScoreCategory = (score) => {
    if (score >= 800) return 'Excellent';
    if (score >= 740) return 'Very Good';
    if (score >= 670) return 'Good';
    if (score >= 580) return 'Fair';
    return 'Poor';
  };

  const togglePrivacySetting = (setting) => {
    setPrivacySettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

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
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-nb-accent to-nb-ok rounded-nb flex items-center justify-center mr-4">
              <Shield size={32} className="text-nb-ink" />
            </div>
            <div>
              <h1 className="font-display font-bold text-5xl text-nb-ink">
                DID Reputation Center
              </h1>
            </div>
          </div>
          <p className="text-xl text-nb-ink/70 max-w-3xl mx-auto">
            Your universal credit score powered by Self.xyz. Track cross-platform reputation, 
            manage privacy settings, and build financial credibility.
          </p>
        </motion.div>

        {/* Universal Score */}
        <motion.div
          className="mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <NBCard>
            <div className="text-center">
              <h2 className="font-bold text-2xl mb-6">Universal Credit Score</h2>
              
              <div className="flex items-center justify-center mb-6">
                <div className={`text-8xl font-bold ${getScoreColor(reputation?.universalScore || 785)}`}>
                  {reputation?.universalScore || 785}
                </div>
                <div className="ml-6 text-left">
                  <div className="text-2xl font-bold">{getScoreCategory(reputation?.universalScore || 785)}</div>
                  <div className="flex items-center space-x-2 text-nb-ink/70">
                    <TrendingUp className="text-nb-ok" size={16} />
                    <span>+12 this month</span>
                  </div>
                  <div className="text-sm text-nb-ink/60 mt-1">
                    Last updated: {new Date().toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-5 gap-4">
                {reputation?.breakdown && Object.entries(reputation.breakdown).map(([factor, score]) => (
                  <div key={factor} className="text-center">
                    <div className="text-2xl font-bold text-nb-accent">{score}</div>
                    <div className="text-sm text-nb-ink/60 capitalize">
                      {factor.replace(/([A-Z])/g, ' $1').trim()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </NBCard>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Score History */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <PerformanceChart
                title="Credit Score History"
                data={reputation?.history?.map(h => ({
                  date: h.date,
                  value: h.score
                })) || []}
                color="#10B981"
                height={350}
              />
            </motion.div>

            {/* Cross-Platform Reputation */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <NBCard>
                <h3 className="font-bold text-xl mb-6">Cross-Platform Reputation</h3>
                
                <div className="space-y-4">
                  {crossPlatform?.platforms?.map((platform, index) => (
                    <div key={index} className="flex justify-between items-center p-4 bg-nb-ink/5 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          platform.status === 'active' ? 'bg-nb-ok/20' : 
                          platform.status === 'verified' ? 'bg-nb-accent/20' : 'bg-nb-warn/20'
                        }`}>
                          <LinkIcon className="text-nb-ink" size={16} />
                        </div>
                        <div>
                          <div className="font-semibold">{platform.name}</div>
                          <div className="text-sm text-nb-ink/60">
                            {platform.activity} transactions • {platform.status}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className={`text-lg font-bold ${getScoreColor(platform.score)}`}>
                          {platform.score}
                        </div>
                        <div className="text-xs text-nb-ink/60">Score</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-nb-accent/10 rounded-nb">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-nb-ink/70">Aggregated Score:</span>
                      <span className="ml-2 font-bold text-lg">{crossPlatform?.aggregated || 785}</span>
                    </div>
                    <div>
                      <span className="text-nb-ink/70">Weighted Score:</span>
                      <span className="ml-2 font-bold text-lg">{crossPlatform?.weightedScore || 798}</span>
                    </div>
                  </div>
                </div>
              </NBCard>
            </motion.div>

            {/* Verifications */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <NBCard>
                <h3 className="font-bold text-xl mb-6">Verification Badges</h3>
                
                <div className="grid md:grid-cols-2 gap-4">
                  {reputation?.verifications?.map((verification, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 bg-nb-ink/5 rounded-lg">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        verification.status === 'verified' ? 'bg-nb-ok/20' : 'bg-nb-warn/20'
                      }`}>
                        {verification.status === 'verified' ? (
                          <CheckCircle className="text-nb-ok" size={16} />
                        ) : (
                          <AlertTriangle className="text-nb-warn" size={16} />
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <div className="font-semibold capitalize">{verification.type} Verification</div>
                        <div className="text-sm text-nb-ink/60">
                          {verification.provider} • Score: {verification.score}
                        </div>
                      </div>
                      
                      <div className={`px-2 py-1 rounded text-xs font-semibold ${
                        verification.status === 'verified' ? 'bg-nb-ok text-nb-ink' : 'bg-nb-warn text-nb-ink'
                      }`}>
                        {verification.status === 'verified' ? '✅ Verified' : '⏳ Pending'}
                      </div>
                    </div>
                  ))}
                </div>
                
                <NBButton variant="outline" className="w-full mt-4">
                  <Award size={16} className="mr-2" />
                  Add More Verifications
                </NBButton>
              </NBCard>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Privacy Settings */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
            >
              <NBCard>
                <div className="flex items-center mb-4">
                  <Settings className="text-nb-accent mr-2" size={20} />
                  <h3 className="font-bold text-lg">Privacy Settings</h3>
                </div>
                
                <div className="space-y-4">
                  {[
                    { key: 'showScore', label: 'Show Credit Score', description: 'Display your score publicly' },
                    { key: 'showHistory', label: 'Show History', description: 'Display score history' },
                    { key: 'showVerifications', label: 'Show Verifications', description: 'Display verification badges' },
                    { key: 'shareData', label: 'Share Data', description: 'Allow data sharing for research' },
                  ].map((setting) => (
                    <div key={setting.key} className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium">{setting.label}</div>
                        <div className="text-sm text-nb-ink/60">{setting.description}</div>
                      </div>
                      <button
                        onClick={() => togglePrivacySetting(setting.key)}
                        className={`ml-3 p-1 rounded-lg transition-colors ${
                          privacySettings[setting.key] ? 'bg-nb-ok' : 'bg-nb-ink/20'
                        }`}
                      >
                        {privacySettings[setting.key] ? (
                          <Eye className="text-nb-ink" size={16} />
                        ) : (
                          <EyeOff className="text-nb-ink/60" size={16} />
                        )}
                      </button>
                    </div>
                  ))}
                </div>

                <NBButton variant="outline" className="w-full mt-4">
                  <Shield size={16} className="mr-2" />
                  Update Privacy Settings
                </NBButton>
              </NBCard>
            </motion.div>

            {/* Recovery Simulator */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 }}
            >
              <NBCard>
                <div className="flex items-center mb-4">
                  <RefreshCw className="text-nb-purple mr-2" size={20} />
                  <h3 className="font-bold text-lg">Score Improvement</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-nb-purple">+45</div>
                    <div className="text-sm text-nb-ink/60">Potential Increase</div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-nb-ink/70">Current Score:</span>
                      <span className="font-semibold">{reputation?.universalScore || 785}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-nb-ink/70">Projected Score:</span>
                      <span className="font-semibold text-nb-ok">{(reputation?.universalScore || 785) + 45}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-nb-ink/70">Timeframe:</span>
                      <span className="font-semibold">6-9 months</span>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-nb-purple/10 rounded-lg">
                    <h5 className="font-semibold mb-2">Recommended Actions</h5>
                    <div className="space-y-1 text-sm">
                      <div>• Complete additional verifications</div>
                      <div>• Maintain consistent payment history</div>
                      <div>• Increase platform activity</div>
                      <div>• Link more financial accounts</div>
                    </div>
                  </div>
                  
                  <NBButton className="w-full">
                    <Star size={16} className="mr-2" />
                    Start Improvement Plan
                  </NBButton>
                </div>
              </NBCard>
            </motion.div>

            {/* Score Impact */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 }}
            >
              <NBCard>
                <h3 className="font-bold text-lg mb-4">Default Impact Simulator</h3>
                
                <div className="space-y-4">
                  <div className="text-sm text-nb-ink/70">
                    Understand how defaults would affect your reputation
                  </div>
                  
                  <div className="space-y-3">
                    <div className="p-3 bg-nb-error/10 rounded-lg border border-nb-error/20">
                      <div className="font-semibold text-sm">Small Default ($1K-$5K)</div>
                      <div className="text-xs text-nb-ink/70">Impact: -15 to -25 points</div>
                      <div className="text-xs text-nb-ink/70">Recovery: 3-6 months</div>
                    </div>
                    
                    <div className="p-3 bg-nb-warn/10 rounded-lg border border-nb-warn/20">
                      <div className="font-semibold text-sm">Medium Default ($5K-$25K)</div>
                      <div className="text-xs text-nb-ink/70">Impact: -30 to -50 points</div>
                      <div className="text-xs text-nb-ink/70">Recovery: 6-12 months</div>
                    </div>
                    
                    <div className="p-3 bg-nb-error/20 rounded-lg border border-nb-error/30">
                      <div className="font-semibold text-sm">Large Default ($25K+)</div>
                      <div className="text-xs text-nb-ink/70">Impact: -60 to -100 points</div>
                      <div className="text-xs text-nb-ink/70">Recovery: 12-24 months</div>
                    </div>
                  </div>
                  
                  <NBButton variant="outline" className="w-full">
                    View Recovery Pathways
                  </NBButton>
                </div>
              </NBCard>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reputation;
