import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Brain, 
  Activity, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  BarChart3,
  Eye,
  Shield,
  Zap,
  Database,
  Cpu
} from 'lucide-react';
import NBButton from '../components/NBButton';
import NBCard from '../components/NBCard';
import RiskScoreBadge from '../components/RiskScoreBadge';
import PerformanceChart from '../components/PerformanceChart';
import aiOracleService from '../services/aiOracleService';

const AIOracle = () => {
  const [liveUpdates, setLiveUpdates] = useState([]);
  const [modelMetrics, setModelMetrics] = useState(null);
  const [riskFeed, setRiskFeed] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedUpdate, setSelectedUpdate] = useState(null);

  useEffect(() => {
    loadOracleData();
    
    // Simulate live updates
    const interval = setInterval(() => {
      addRandomUpdate();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const loadOracleData = async () => {
    try {
      const [metrics, feed] = await Promise.all([
        aiOracleService.getModelMetrics(),
        aiOracleService.getLiveRiskFeed()
      ]);
      
      setModelMetrics(metrics);
      setRiskFeed(feed);
      setLiveUpdates(feed.updates.slice(0, 10));
    } catch (error) {
      console.error('Failed to load oracle data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addRandomUpdate = () => {
    const updates = [
      { type: 'score_update', severity: 'low', message: 'Risk score improved for Invoice #inv_045' },
      { type: 'payment', severity: 'low', message: 'Payment received for SaaS MRR basket' },
      { type: 'risk_alert', severity: 'medium', message: 'Market volatility detected in luxury assets' },
      { type: 'model_update', severity: 'low', message: 'AI model retrained with new data' },
    ];
    
    const randomUpdate = updates[Math.floor(Math.random() * updates.length)];
    const newUpdate = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      ...randomUpdate
    };
    
    setLiveUpdates(prev => [newUpdate, ...prev.slice(0, 9)]);
  };

  const getUpdateIcon = (type) => {
    switch (type) {
      case 'score_update': return <TrendingUp className="text-nb-accent" size={16} />;
      case 'payment': return <CheckCircle className="text-nb-ok" size={16} />;
      case 'risk_alert': return <AlertTriangle className="text-nb-warn" size={16} />;
      case 'model_update': return <Brain className="text-nb-purple" size={16} />;
      default: return <Activity className="text-nb-ink" size={16} />;
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return 'border-nb-error bg-nb-error/10';
      case 'medium': return 'border-nb-warn bg-nb-warn/10';
      case 'low': return 'border-nb-ok bg-nb-ok/10';
      default: return 'border-nb-ink/20 bg-nb-ink/5';
    }
  };

  const mockAccuracyData = [
    { date: '2024-08', value: 0.87 },
    { date: '2024-09', value: 0.89 },
    { date: '2024-10', value: 0.91 },
    { date: '2024-11', value: 0.92 },
    { date: '2024-12', value: 0.94 },
    { date: '2025-01', value: 0.94 },
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
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-nb-accent to-nb-purple rounded-nb flex items-center justify-center mr-4">
              <Brain size={32} className="text-nb-ink" />
            </div>
            <div>
              <h1 className="font-display font-bold text-5xl text-nb-ink">
                AI Risk Oracle
              </h1>
            </div>
          </div>
          <p className="text-xl text-nb-ink/70 max-w-3xl mx-auto">
            Transparent, real-time risk assessment powered by advanced machine learning. 
            Monitor model performance, accuracy metrics, and live risk scoring.
          </p>
        </motion.div>

        {/* Key Metrics */}
        <motion.div
          className="grid md:grid-cols-4 gap-4 mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <NBCard hover={false} padding="sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-nb-accent">
                {modelMetrics ? (modelMetrics.accuracy * 100).toFixed(1) : '94.2'}%
              </div>
              <div className="text-sm text-nb-ink/60">Model Accuracy</div>
            </div>
          </NBCard>
          <NBCard hover={false} padding="sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-nb-purple">
                {riskFeed?.summary.totalUpdates || 1247}
              </div>
              <div className="text-sm text-nb-ink/60">Risk Updates Today</div>
            </div>
          </NBCard>
          <NBCard hover={false} padding="sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-nb-ok">
                {modelMetrics ? modelMetrics.trainingData.toLocaleString() : '150K'}
              </div>
              <div className="text-sm text-nb-ink/60">Training Data Points</div>
            </div>
          </NBCard>
          <NBCard hover={false} padding="sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-nb-accent-2">
                {modelMetrics?.version || '2.1.3'}
              </div>
              <div className="text-sm text-nb-ink/60">Model Version</div>
            </div>
          </NBCard>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Live Risk Feed */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <NBCard>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-2">
                    <Activity className="text-nb-accent" size={24} />
                    <h3 className="font-bold text-xl">Live Risk Feed</h3>
                    <div className="w-2 h-2 bg-nb-ok rounded-full animate-pulse"></div>
                  </div>
                  <div className="text-sm text-nb-ink/60">
                    Last updated: {new Date().toLocaleTimeString()}
                  </div>
                </div>

                <div className="space-y-3">
                  {liveUpdates.map((update) => (
                    <motion.div
                      key={update.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`p-4 rounded-nb border-2 cursor-pointer transition-colors hover:bg-opacity-20 ${getSeverityColor(update.severity)}`}
                      onClick={() => setSelectedUpdate(update)}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="mt-0.5">
                          {getUpdateIcon(update.type)}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{update.message}</div>
                          <div className="text-sm text-nb-ink/60 mt-1">
                            {new Date(update.timestamp).toLocaleTimeString()}
                            <span className="mx-2">•</span>
                            <span className="capitalize">{update.severity} priority</span>
                          </div>
                        </div>
                        <Eye size={16} className="text-nb-ink/40" />
                      </div>
                    </motion.div>
                  ))}
                </div>

                <NBButton variant="outline" className="w-full mt-4">
                  View Full Risk History
                </NBButton>
              </NBCard>
            </motion.div>

            {/* Model Performance */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <PerformanceChart
                title="Model Accuracy Over Time"
                data={mockAccuracyData}
                color="#A855F7"
                height={350}
              />
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Model Details */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <NBCard>
                <div className="flex items-center mb-4">
                  <Cpu className="text-nb-purple mr-2" size={20} />
                  <h3 className="font-bold text-lg">Model Details</h3>
                </div>
                
                {modelMetrics && (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-nb-ink/70">Accuracy:</span>
                      <span className="font-semibold">{(modelMetrics.accuracy * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-nb-ink/70">Precision:</span>
                      <span className="font-semibold">{(modelMetrics.precision * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-nb-ink/70">Recall:</span>
                      <span className="font-semibold">{(modelMetrics.recall * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-nb-ink/70">F1 Score:</span>
                      <span className="font-semibold">{(modelMetrics.f1Score * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-nb-ink/70">AUC:</span>
                      <span className="font-semibold">{(modelMetrics.auc * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                )}

                <div className="mt-4 p-3 bg-nb-accent/10 rounded-lg">
                  <div className="text-sm">
                    <div className="font-semibold mb-1">Last Training:</div>
                    <div className="text-nb-ink/70">
                      {modelMetrics ? new Date(modelMetrics.lastTrained).toLocaleDateString() : 'January 15, 2025'}
                    </div>
                  </div>
                </div>
              </NBCard>
            </motion.div>

            {/* Risk Factors */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
            >
              <NBCard>
                <div className="flex items-center mb-4">
                  <BarChart3 className="text-nb-accent mr-2" size={20} />
                  <h3 className="font-bold text-lg">Risk Factors</h3>
                </div>
                
                <div className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Payment History</span>
                      <span className="font-semibold">35%</span>
                    </div>
                    <div className="w-full bg-nb-ink/10 rounded-full h-2">
                      <div className="bg-nb-accent h-2 rounded-full" style={{ width: '35%' }}></div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Industry Risk</span>
                      <span className="font-semibold">25%</span>
                    </div>
                    <div className="w-full bg-nb-ink/10 rounded-full h-2">
                      <div className="bg-nb-accent-2 h-2 rounded-full" style={{ width: '25%' }}></div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Market Conditions</span>
                      <span className="font-semibold">20%</span>
                    </div>
                    <div className="w-full bg-nb-ink/10 rounded-full h-2">
                      <div className="bg-nb-warn h-2 rounded-full" style={{ width: '20%' }}></div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Technical Factors</span>
                      <span className="font-semibold">20%</span>
                    </div>
                    <div className="w-full bg-nb-ink/10 rounded-full h-2">
                      <div className="bg-nb-purple h-2 rounded-full" style={{ width: '20%' }}></div>
                    </div>
                  </div>
                </div>
              </NBCard>
            </motion.div>

            {/* Oracle Staking */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 }}
            >
              <NBCard>
                <div className="flex items-center mb-4">
                  <Shield className="text-nb-ok mr-2" size={20} />
                  <h3 className="font-bold text-lg">Oracle Staking</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-nb-ok">8.5%</div>
                    <div className="text-sm text-nb-ink/60">Staking APY</div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-nb-ink/70">Total Staked:</span>
                      <span className="font-semibold">$2.4M</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-nb-ink/70">Validators:</span>
                      <span className="font-semibold">156</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-nb-ink/70">Your Stake:</span>
                      <span className="font-semibold">$0</span>
                    </div>
                  </div>
                  
                  <NBButton className="w-full">
                    <Zap size={16} className="mr-2" />
                    Stake Tokens
                  </NBButton>
                  
                  <div className="text-xs text-nb-ink/60">
                    Staking helps secure the oracle network and earns rewards
                  </div>
                </div>
              </NBCard>
            </motion.div>

            {/* Dispute Center */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 }}
            >
              <NBCard>
                <div className="flex items-center mb-4">
                  <AlertTriangle className="text-nb-warn mr-2" size={20} />
                  <h3 className="font-bold text-lg">Dispute Center</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="text-sm text-nb-ink/70">
                    Disagree with a risk score? Submit a dispute for human review.
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-nb-ink/70">Open Disputes:</span>
                      <span className="font-semibold">3</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-nb-ink/70">Resolved Today:</span>
                      <span className="font-semibold">12</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-nb-ink/70">Success Rate:</span>
                      <span className="font-semibold text-nb-ok">78%</span>
                    </div>
                  </div>
                  
                  <NBButton variant="outline" className="w-full">
                    Submit Dispute
                  </NBButton>
                </div>
              </NBCard>
            </motion.div>
          </div>
        </div>

        {/* Selected Update Modal */}
        {selectedUpdate && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-nb-card rounded-nb nb-border shadow-nb-hover max-w-md w-full"
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-lg">Risk Update Details</h3>
                  <button 
                    onClick={() => setSelectedUpdate(null)}
                    className="text-nb-ink/60 hover:text-nb-ink"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    {getUpdateIcon(selectedUpdate.type)}
                    <span className="font-medium capitalize">
                      {(selectedUpdate.type || '').replace('_', ' ')}
                    </span>
                  </div>
                  
                  <div className="p-3 bg-nb-ink/5 rounded-lg">
                    <div className="font-medium">{selectedUpdate.message || 'No message available'}</div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-nb-ink/70">Timestamp:</span>
                      <div className="font-medium">{new Date(selectedUpdate.timestamp).toLocaleString()}</div>
                    </div>
                    <div>
                      <span className="text-nb-ink/70">Severity:</span>
                      <div className={`font-medium capitalize ${
                        selectedUpdate.severity === 'high' ? 'text-nb-error' :
                        selectedUpdate.severity === 'medium' ? 'text-nb-warn' :
                        'text-nb-ok'
                      }`}>
                        {selectedUpdate.severity || 'unknown'}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-3 mt-6">
                  <NBButton variant="outline" onClick={() => setSelectedUpdate(null)} className="flex-1">
                    Close
                  </NBButton>
                  <NBButton className="flex-1">
                    View Details
                  </NBButton>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIOracle;
