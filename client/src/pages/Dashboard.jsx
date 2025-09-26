import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar, 
  PieChart, 
  Bell,
  Eye,
  Download,
  Filter,
  ArrowUpRight,
  Clock,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import NBButton from '../components/NBButton';
import NBCard from '../components/NBCard';
import StatPill from '../components/StatPill';
import RiskScoreBadge from '../components/RiskScoreBadge';
import PerformanceChart from '../components/PerformanceChart';
import payoutService from '../services/payoutService';
import basketService from '../services/basketService';
import didService from '../services/didService';
import useAppStore from '../stores/appStore';

const Dashboard = () => {
  const { user, portfolio, setPortfolio } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [payoutHistory, setPayoutHistory] = useState([]);
  const [upcomingPayouts, setUpcomingPayouts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [portfolioData, setPortfolioData] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [payouts, upcoming, reputation] = await Promise.all([
        payoutService.getPayoutHistory(user.address),
        payoutService.getUpcomingPayouts(user.address),
        didService.getReputation(user.address)
      ]);

      setPayoutHistory(payouts.payouts || []);
      setUpcomingPayouts(upcoming || []);
      
      // Mock portfolio data
      setPortfolioData({
        totalValue: 45780,
        totalInvested: 42000,
        totalReturns: 3780,
        positions: [
          { id: 'basket_1', name: 'Stable Income Plus', amount: 15000, value: 16200, apy: 9.2, riskScore: 82 },
          { id: 'basket_5', name: 'Growth Accelerator', amount: 12000, value: 13100, apy: 12.8, riskScore: 71 },
          { id: 'basket_12', name: 'Premium Yield', amount: 15000, value: 16480, apy: 14.5, riskScore: 65 },
        ]
      });

      setNotifications([
        { id: 1, type: 'payout', title: 'Payout Received', message: '$245 from Stable Income Plus', time: '2 hours ago' },
        { id: 2, type: 'risk', title: 'Risk Score Update', message: 'Premium Yield basket score improved to 68', time: '1 day ago' },
        { id: 3, type: 'investment', title: 'New Position', message: 'Successfully invested in Growth Accelerator', time: '3 days ago' },
      ]);

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const mockPerformanceData = [
    { date: '2024-08', value: 38000 },
    { date: '2024-09', value: 39500 },
    { date: '2024-10', value: 41200 },
    { date: '2024-11', value: 43800 },
    { date: '2024-12', value: 45100 },
    { date: '2025-01', value: 45780 },
  ];

  const riskExposureData = [
    { name: 'Low Risk', value: 35, color: '#10B981' },
    { name: 'Medium Risk', value: 45, color: '#F59E0B' },
    { name: 'High Risk', value: 20, color: '#EF4444' },
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
                Dashboard
              </h1>
              <p className="text-xl text-nb-ink/70">
                Welcome back! Here's your portfolio overview.
              </p>
            </div>
            <div className="flex space-x-3">
              <Link to="/invest">
                <NBButton variant="outline">
                  <ArrowUpRight size={16} className="mr-2" />
                  Explore Investments
                </NBButton>
              </Link>
              <Link to="/get-cash">
                <NBButton>
                  <DollarSign size={16} className="mr-2" />
                  Get Cash
                </NBButton>
              </Link>
            </div>
          </div>

          {/* Portfolio Summary Cards */}
          <div className="grid md:grid-cols-4 gap-4">
            <StatPill
              value={`$${portfolioData?.totalValue.toLocaleString()}`}
              label="Portfolio Value"
              icon={DollarSign}
              color="nb-accent"
              trend={8.9}
            />
            <StatPill
              value={`$${portfolioData?.totalReturns.toLocaleString()}`}
              label="Total Returns"
              icon={TrendingUp}
              color="nb-ok"
              trend={12.4}
            />
            <StatPill
              value={`${portfolioData?.positions.length}`}
              label="Active Positions"
              icon={PieChart}
              color="nb-accent-2"
            />
            <StatPill
              value={`${user.reputation}`}
              label="DID Reputation"
              icon={CheckCircle}
              color="nb-purple"
            />
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex space-x-1 p-1 bg-nb-ink/5 rounded-nb w-fit">
            {[
              { id: 'overview', label: 'Overview', icon: PieChart },
              { id: 'positions', label: 'Positions', icon: TrendingUp },
              { id: 'payouts', label: 'Payouts', icon: Calendar },
              { id: 'notifications', label: 'Notifications', icon: Bell },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-nb-accent text-nb-ink font-semibold'
                      : 'text-nb-ink/70 hover:text-nb-ink hover:bg-nb-accent/20'
                  }`}
                >
                  <Icon size={16} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'overview' && (
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Portfolio Performance Chart */}
              <div className="lg:col-span-2">
                <PerformanceChart
                  title="Portfolio Performance"
                  data={mockPerformanceData}
                  type="area"
                  color="#6EE7B7"
                  height={350}
                />
              </div>

              {/* Quick Stats */}
              <div className="space-y-6">
                <NBCard>
                  <h3 className="font-bold text-lg mb-4">Risk Exposure</h3>
                  <div className="space-y-3">
                    {riskExposureData.map((item) => (
                      <div key={item.name} className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="text-sm">{item.name}</span>
                        </div>
                        <span className="font-semibold">{item.value}%</span>
                      </div>
                    ))}
                  </div>
                </NBCard>

                <NBCard>
                  <h3 className="font-bold text-lg mb-4">Next Payouts</h3>
                  <div className="space-y-3">
                    {upcomingPayouts.slice(0, 3).map((payout) => (
                      <div key={payout.id} className="flex justify-between items-center">
                        <div>
                          <div className="font-medium text-sm">{payout.basketId}</div>
                          <div className="text-xs text-nb-ink/60">{payout.dueDate}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">${payout.estimatedAmount}</div>
                          <div className="text-xs text-nb-ink/60">{payout.confidence}% conf.</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Link to="#" className="block mt-4">
                    <NBButton variant="outline" size="sm" className="w-full">
                      View All Payouts
                    </NBButton>
                  </Link>
                </NBCard>
              </div>
            </div>
          )}

          {activeTab === 'positions' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="font-bold text-2xl">Active Positions</h2>
                <div className="flex space-x-2">
                  <NBButton variant="outline" size="sm">
                    <Filter size={14} className="mr-1" />
                    Filter
                  </NBButton>
                  <NBButton variant="outline" size="sm">
                    <Download size={14} className="mr-1" />
                    Export
                  </NBButton>
                </div>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {portfolioData?.positions.map((position) => (
                  <NBCard key={position.id}>
                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-lg">{position.name}</h3>
                        <RiskScoreBadge score={position.riskScore} size="sm" />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs text-nb-ink/60">Invested</div>
                          <div className="font-bold">${position.amount.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-xs text-nb-ink/60">Current Value</div>
                          <div className="font-bold text-nb-accent">${position.value.toLocaleString()}</div>
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <div>
                          <div className="text-xs text-nb-ink/60">P&L</div>
                          <div className={`font-bold ${
                            position.value > position.amount ? 'text-nb-ok' : 'text-nb-error'
                          }`}>
                            {position.value > position.amount ? '+' : ''}
                            ${(position.value - position.amount).toLocaleString()}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-nb-ink/60">APY</div>
                          <div className="font-bold text-nb-accent-2">{position.apy}%</div>
                        </div>
                      </div>

                      <div className="flex space-x-2 pt-2">
                        <Link to={`/baskets/${position.id}`} className="flex-1">
                          <NBButton variant="outline" size="sm" className="w-full">
                            <Eye size={14} className="mr-1" />
                            View
                          </NBButton>
                        </Link>
                        <NBButton size="sm" className="flex-1">
                          Add More
                        </NBButton>
                      </div>
                    </div>
                  </NBCard>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'payouts' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="font-bold text-2xl">Payout History</h2>
                <NBButton variant="outline" size="sm">
                  <Download size={14} className="mr-1" />
                  Export CSV
                </NBButton>
              </div>

              <div className="space-y-4">
                {payoutHistory.map((payout) => (
                  <NBCard key={payout.id} hover={false}>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-4">
                        <div className={`p-2 rounded-lg ${
                          payout.status === 'completed' ? 'bg-nb-ok/20' :
                          payout.status === 'pending' ? 'bg-nb-warn/20' :
                          'bg-nb-error/20'
                        }`}>
                          {payout.status === 'completed' ? (
                            <CheckCircle className="text-nb-ok" size={16} />
                          ) : payout.status === 'pending' ? (
                            <Clock className="text-nb-warn" size={16} />
                          ) : (
                            <AlertTriangle className="text-nb-error" size={16} />
                          )}
                        </div>
                        
                        <div>
                          <div className="font-semibold">{payout.basketId}</div>
                          <div className="text-sm text-nb-ink/60">
                            {new Date(payout.timestamp).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-bold text-lg">${payout.amount.toLocaleString()}</div>
                        <div className={`text-sm capitalize ${
                          payout.status === 'completed' ? 'text-nb-ok' :
                          payout.status === 'pending' ? 'text-nb-warn' :
                          'text-nb-error'
                        }`}>
                          {payout.status}
                        </div>
                      </div>
                    </div>
                  </NBCard>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="font-bold text-2xl">Notifications</h2>
                <NBButton variant="outline" size="sm">
                  Mark All Read
                </NBButton>
              </div>

              <div className="space-y-4">
                {notifications.map((notification) => (
                  <NBCard key={notification.id} hover={false}>
                    <div className="flex items-start space-x-4">
                      <div className={`p-2 rounded-lg mt-1 ${
                        notification.type === 'payout' ? 'bg-nb-ok/20' :
                        notification.type === 'risk' ? 'bg-nb-warn/20' :
                        'bg-nb-accent/20'
                      }`}>
                        {notification.type === 'payout' ? (
                          <DollarSign className="text-nb-ok" size={16} />
                        ) : notification.type === 'risk' ? (
                          <AlertTriangle className="text-nb-warn" size={16} />
                        ) : (
                          <TrendingUp className="text-nb-accent" size={16} />
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <div className="font-semibold">{notification.title}</div>
                        <div className="text-sm text-nb-ink/70 mb-1">{notification.message}</div>
                        <div className="text-xs text-nb-ink/50">{notification.time}</div>
                      </div>
                    </div>
                  </NBCard>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;

