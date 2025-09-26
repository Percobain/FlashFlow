import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  TrendingUp, 
  Users, 
  DollarSign, 
  PieChart, 
  BarChart3,
  Calendar,
  Shield,
  ExternalLink,
  Calculator,
  AlertCircle
} from 'lucide-react';
import NBButton from '../components/NBButton';
import NBCard from '../components/NBCard';
import RiskScoreBadge from '../components/RiskScoreBadge';
import PerformanceChart from '../components/PerformanceChart';
import basketService from '../services/basketService';
import useAppStore from '../stores/appStore';

const BasketDetails = () => {
  const { id } = useParams();
  const [basket, setBasket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [investmentAmount, setInvestmentAmount] = useState('');
  const [showInvestModal, setShowInvestModal] = useState(false);
  const { addNotification, addPosition } = useAppStore();

  useEffect(() => {
    loadBasketDetails();
  }, [id]);

  const loadBasketDetails = async () => {
    try {
      const data = await basketService.getBasketDetails(id);
      setBasket(data);
    } catch (error) {
      console.error('Failed to load basket details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInvestment = async () => {
    if (!investmentAmount || parseInt(investmentAmount) < basket.minimumInvestment) {
      addNotification({
        type: 'error',
        title: 'Invalid Amount',
        description: `Minimum investment is $${basket.minimumInvestment.toLocaleString()}`,
      });
      return;
    }

    try {
      const investment = await basketService.investInBasket(basket.id, parseInt(investmentAmount));
      
      addPosition({
        id: basket.id,
        name: basket.name,
        amount: parseInt(investmentAmount),
        value: parseInt(investmentAmount),
        apy: basket.apy,
        riskScore: basket.riskScore,
      });

      addNotification({
        type: 'success',
        title: 'Investment Successful!',
        description: `You've invested $${investmentAmount} in ${basket.name}`,
      });

      setShowInvestModal(false);
      setInvestmentAmount('');
    } catch (error) {
      console.error('Investment failed:', error);
      addNotification({
        type: 'error',
        title: 'Investment Failed',
        description: 'Please try again later.',
      });
    }
  };

  const calculateProjectedReturns = (amount, apy, months = 12) => {
    const monthlyRate = apy / 100 / 12;
    const futureValue = amount * Math.pow(1 + monthlyRate, months);
    return {
      total: futureValue,
      returns: futureValue - amount,
      monthly: (futureValue - amount) / months,
    };
  };

  const projectedReturns = investmentAmount ? 
    calculateProjectedReturns(parseInt(investmentAmount) || 0, basket?.apy || 0) : null;

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

  if (!basket) {
    return (
      <div className="min-h-screen py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <NBCard>
            <div className="text-center py-12">
              <div className="text-4xl mb-4">📊</div>
              <h2 className="font-bold text-xl text-nb-ink mb-2">Basket Not Found</h2>
              <p className="text-nb-ink/70 mb-6">The basket you're looking for doesn't exist.</p>
              <Link to="/invest">
                <NBButton>
                  <ArrowLeft size={16} className="mr-2" />
                  Back to Marketplace
                </NBButton>
              </Link>
            </div>
          </NBCard>
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
          <div className="flex items-center mb-4">
            <Link 
              to="/invest"
              className="flex items-center text-nb-ink/60 hover:text-nb-ink transition-colors mr-4"
            >
              <ArrowLeft size={16} className="mr-1" />
              Back to Marketplace
            </Link>
          </div>

          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start mb-6">
            <div className="mb-4 lg:mb-0">
              <h1 className="font-display font-bold text-4xl text-nb-ink mb-2">
                {basket.name}
              </h1>
              <p className="text-xl text-nb-ink/70">{basket.description}</p>
            </div>
            
            <div className="flex space-x-3">
              <NBButton 
                variant="outline"
                onClick={() => setShowInvestModal(true)}
              >
                <Calculator size={16} className="mr-2" />
                Investment Calculator
              </NBButton>
              <NBButton onClick={() => setShowInvestModal(true)}>
                <DollarSign size={16} className="mr-2" />
                Invest Now
              </NBButton>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid md:grid-cols-5 gap-4">
            <NBCard hover={false} padding="sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-nb-accent">{basket.apy}%</div>
                <div className="text-sm text-nb-ink/60">APY</div>
              </div>
            </NBCard>
            <NBCard hover={false} padding="sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-nb-ink">
                  ${(basket.totalValue / 1000000).toFixed(1)}M
                </div>
                <div className="text-sm text-nb-ink/60">Total Value</div>
              </div>
            </NBCard>
            <NBCard hover={false} padding="sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-nb-accent-2">{basket.investorCount}</div>
                <div className="text-sm text-nb-ink/60">Investors</div>
              </div>
            </NBCard>
            <NBCard hover={false} padding="sm">
              <div className="text-center">
                <RiskScoreBadge score={basket.riskScore} size="sm" showTooltip={false} />
                <div className="text-sm text-nb-ink/60 mt-1">Risk Score</div>
              </div>
            </NBCard>
            <NBCard hover={false} padding="sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-nb-purple">{basket.duration}M</div>
                <div className="text-sm text-nb-ink/60">Duration</div>
              </div>
            </NBCard>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Performance Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <PerformanceChart
                title="Historical Performance"
                data={basket.performance}
                type="area"
                color="#6EE7B7"
                height={350}
              />
            </motion.div>

            {/* Composition */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <NBCard>
                <div className="flex items-center mb-6">
                  <PieChart className="text-nb-accent mr-2" size={24} />
                  <h3 className="font-bold text-xl">Basket Composition</h3>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    {basket.composition.map((comp, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: `hsl(${index * 60}, 60%, 60%)` }}
                          />
                          <span className="capitalize font-medium">{comp.type}</span>
                        </div>
                        <span className="font-bold">{comp.percentage}%</span>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold">Diversification Benefits</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center space-x-2">
                        <Shield className="text-nb-ok" size={14} />
                        <span>Cross-sector risk reduction</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <BarChart3 className="text-nb-accent" size={14} />
                        <span>Optimized yield-risk ratio</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="text-nb-accent-2" size={14} />
                        <span>Balanced growth exposure</span>
                      </div>
                    </div>
                  </div>
                </div>
              </NBCard>
            </motion.div>

            {/* Receivables List */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <NBCard>
                <h3 className="font-bold text-xl mb-6">Individual Receivables</h3>
                <div className="space-y-4">
                  {basket.receivables?.slice(0, 5).map((receivable, index) => (
                    <div key={receivable.id} className="flex justify-between items-center p-4 bg-nb-ink/5 rounded-lg">
                      <div>
                        <div className="font-semibold capitalize">{receivable.type} #{receivable.id}</div>
                        <div className="text-sm text-nb-ink/70">
                          Due: {receivable.dueDate} • Status: {receivable.status}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">${receivable.amount.toLocaleString()}</div>
                        <RiskScoreBadge score={receivable.riskScore} size="sm" showTooltip={false} />
                      </div>
                    </div>
                  ))}
                  
                  {basket.receivables?.length > 5 && (
                    <div className="text-center py-4">
                      <NBButton variant="outline" size="sm">
                        View All {basket.receivables.length} Receivables
                      </NBButton>
                    </div>
                  )}
                </div>
              </NBCard>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Investment Summary */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <NBCard>
                <h3 className="font-bold text-lg mb-4">Investment Details</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-nb-ink/70">Minimum Investment:</span>
                    <span className="font-semibold">${basket.minimumInvestment.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-nb-ink/70">Expected APY:</span>
                    <span className="font-semibold text-nb-accent">{basket.apy}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-nb-ink/70">Duration:</span>
                    <span className="font-semibold">{basket.duration} months</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-nb-ink/70">Risk Level:</span>
                    <span className="font-semibold">{basket.riskLevel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-nb-ink/70">Status:</span>
                    <span className={`font-semibold capitalize ${
                      basket.status === 'active' ? 'text-nb-ok' : 'text-nb-warn'
                    }`}>
                      {basket.status}
                    </span>
                  </div>
                </div>

                <NBButton 
                  className="w-full mt-6"
                  onClick={() => setShowInvestModal(true)}
                >
                  <DollarSign size={16} className="mr-2" />
                  Invest in This Basket
                </NBButton>
              </NBCard>
            </motion.div>

            {/* AI Risk Analysis */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
            >
              <NBCard>
                <h3 className="font-bold text-lg mb-4">AI Risk Analysis</h3>
                <div className="space-y-4">
                  <div className="text-center">
                    <RiskScoreBadge score={basket.riskScore} size="lg" />
                  </div>
                  
                  {basket.analytics && (
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-nb-ink/70">Diversification:</span>
                        <span className="font-semibold">{basket.analytics.diversificationScore}/100</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-nb-ink/70">Liquidity:</span>
                        <span className="font-semibold">{basket.analytics.liquidityScore}/100</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-nb-ink/70">Quality:</span>
                        <span className="font-semibold">{basket.analytics.qualityScore}/100</span>
                      </div>
                    </div>
                  )}

                  <div className="text-xs text-nb-ink/60 mt-4">
                    Risk score updated in real-time by AI Oracle. 
                    <Link to="/ai-oracle" className="text-nb-accent hover:underline ml-1">
                      Learn more
                    </Link>
                  </div>
                </div>
              </NBCard>
            </motion.div>

            {/* Recent Activity */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 }}
            >
              <NBCard>
                <h3 className="font-bold text-lg mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-sm">
                    <div className="w-2 h-2 bg-nb-ok rounded-full"></div>
                    <span>New investor joined</span>
                    <span className="text-nb-ink/60 ml-auto">2h ago</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <div className="w-2 h-2 bg-nb-accent rounded-full"></div>
                    <span>Payout distributed</span>
                    <span className="text-nb-ink/60 ml-auto">1d ago</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <div className="w-2 h-2 bg-nb-warn rounded-full"></div>
                    <span>Risk score updated</span>
                    <span className="text-nb-ink/60 ml-auto">3d ago</span>
                  </div>
                </div>
              </NBCard>
            </motion.div>
          </div>
        </div>

        {/* Investment Modal */}
        {showInvestModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-nb-card rounded-nb nb-border shadow-nb-hover max-w-md w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-xl">Invest in {basket.name}</h3>
                  <button 
                    onClick={() => setShowInvestModal(false)}
                    className="text-nb-ink/60 hover:text-nb-ink"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Investment Amount
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-nb-ink/60">$</span>
                      <input
                        type="number"
                        value={investmentAmount}
                        onChange={(e) => setInvestmentAmount(e.target.value)}
                        placeholder="Enter amount..."
                        className="w-full pl-8 pr-4 py-3 nb-border rounded-nb focus:outline-none focus:ring-2 focus:ring-nb-accent text-lg font-semibold"
                        min={basket.minimumInvestment}
                      />
                    </div>
                    <div className="text-xs text-nb-ink/60 mt-1">
                      Minimum: ${basket.minimumInvestment.toLocaleString()}
                    </div>
                  </div>

                  {projectedReturns && (
                    <div className="p-4 bg-nb-accent/10 rounded-nb">
                      <h4 className="font-semibold mb-3">Projected Returns (12 months)</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-nb-ink/70">Investment:</span>
                          <span className="font-bold">${parseInt(investmentAmount).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-nb-ink/70">Expected Returns:</span>
                          <span className="font-bold text-nb-ok">+${projectedReturns.returns.toFixed(0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-nb-ink/70">Total Value:</span>
                          <span className="font-bold">${projectedReturns.total.toFixed(0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-nb-ink/70">Monthly Income:</span>
                          <span className="font-bold text-nb-accent">${projectedReturns.monthly.toFixed(0)}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {parseInt(investmentAmount) < basket.minimumInvestment && investmentAmount && (
                    <div className="p-3 bg-nb-error/10 rounded-nb border border-nb-error/20">
                      <div className="flex items-start space-x-2">
                        <AlertCircle className="text-nb-error mt-0.5" size={16} />
                        <div className="text-sm">
                          <div className="font-semibold">Minimum Investment Required</div>
                          <div className="text-nb-ink/70">
                            Please invest at least ${basket.minimumInvestment.toLocaleString()}.
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex space-x-3">
                    <NBButton 
                      variant="outline" 
                      onClick={() => setShowInvestModal(false)}
                      className="flex-1"
                    >
                      Cancel
                    </NBButton>
                    <NBButton 
                      onClick={handleInvestment}
                      disabled={!investmentAmount || parseInt(investmentAmount) < basket.minimumInvestment}
                      className="flex-1"
                    >
                      Invest Now
                    </NBButton>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BasketDetails;