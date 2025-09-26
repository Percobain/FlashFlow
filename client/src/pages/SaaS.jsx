import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  CreditCard,
  BarChart3,
  Calculator,
  Zap,
  AlertTriangle
} from 'lucide-react';
import NBButton from '../components/NBButton';
import NBCard from '../components/NBCard';
import RiskScoreBadge from '../components/RiskScoreBadge';
import PerformanceChart from '../components/PerformanceChart';
import receivablesService from '../services/receivablesService';

const SaaS = () => {
  const [saasData, setSaasData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [financingAmount, setFinancingAmount] = useState('');

  useEffect(() => {
    loadSaasData();
  }, []);

  const loadSaasData = async () => {
    try {
      const data = await receivablesService.fetchReceivables('saas');
      setSaasData(data);
      if (data.length > 0) {
        setSelectedCompany(data[0]);
      }
    } catch (error) {
      console.error('Failed to load SaaS data:', error);
    } finally {
      setLoading(false);
    }
  };

  const mockMRRData = [
    { date: '2024-07', value: 18000 },
    { date: '2024-08', value: 19200 },
    { date: '2024-09', value: 20100 },
    { date: '2024-10', value: 21800 },
    { date: '2024-11', value: 23400 },
    { date: '2024-12', value: 25000 },
    { date: '2025-01', value: 26500 },
  ];

  const mockChurnData = [
    { date: '2024-07', value: 4.2 },
    { date: '2024-08', value: 3.8 },
    { date: '2024-09', value: 3.5 },
    { date: '2024-10', value: 3.1 },
    { date: '2024-11', value: 2.9 },
    { date: '2024-12', value: 3.0 },
    { date: '2025-01', value: 2.8 },
  ];

  const calculateFinancingTerms = (company, amount) => {
    if (!company || !amount) return null;
    
    const monthsOfMRR = amount / company.mrr;
    const riskMultiplier = (100 - company.riskScore) / 100;
    const apy = 8 + (riskMultiplier * 8);
    const fees = amount * 0.03; // 3% origination fee
    
    return {
      monthsOfMRR: monthsOfMRR.toFixed(1),
      apy: apy.toFixed(1),
      fees,
      monthlyPayment: (amount * (1 + apy/100) / 12).toFixed(0),
      paybackPeriod: Math.ceil(monthsOfMRR * 1.2), // 20% buffer
    };
  };

  const terms = calculateFinancingTerms(selectedCompany, parseInt(financingAmount) || 0);

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
                SaaS MRR Financing
              </h1>
              <p className="text-xl text-nb-ink/70">
                Convert monthly recurring revenue into growth capital
              </p>
            </div>
            <Link to="/get-cash">
              <NBButton size="lg">
                <Plus size={20} className="mr-2" />
                Connect SaaS
              </NBButton>
            </Link>
          </div>

          {/* Key Metrics */}
          <div className="grid md:grid-cols-4 gap-4">
            <NBCard hover={false} padding="sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-nb-accent">
                  ${saasData.reduce((sum, s) => sum + s.mrr, 0).toLocaleString()}
                </div>
                <div className="text-sm text-nb-ink/60">Total MRR</div>
              </div>
            </NBCard>
            <NBCard hover={false} padding="sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-nb-ok">
                  {saasData.length > 0 ? 
                    (saasData.reduce((sum, s) => sum + s.growth, 0) / saasData.length).toFixed(1) : 0}%
                </div>
                <div className="text-sm text-nb-ink/60">Avg Growth</div>
              </div>
            </NBCard>
            <NBCard hover={false} padding="sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-nb-warn">
                  {saasData.length > 0 ? 
                    (saasData.reduce((sum, s) => sum + s.churn, 0) / saasData.length).toFixed(1) : 0}%
                </div>
                <div className="text-sm text-nb-ink/60">Avg Churn</div>
              </div>
            </NBCard>
            <NBCard hover={false} padding="sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-nb-accent-2">
                  11.8%
                </div>
                <div className="text-sm text-nb-ink/60">Avg APY</div>
              </div>
            </NBCard>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Company Selection */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <NBCard>
                <h3 className="font-bold text-lg mb-4">Connected SaaS Companies</h3>
                <div className="space-y-3">
                  {saasData.map((company) => (
                    <motion.div
                      key={company.id}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedCompany?.id === company.id
                          ? 'bg-nb-accent/20 border-2 border-nb-accent'
                          : 'bg-nb-ink/5 hover:bg-nb-accent/10 border-2 border-transparent'
                      }`}
                      onClick={() => setSelectedCompany(company)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold">{company.company}</h4>
                        <RiskScoreBadge score={company.riskScore} size="sm" showTooltip={false} />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-nb-ink/60">MRR:</span>
                          <span className="ml-1 font-semibold">${company.mrr.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-nb-ink/60">Growth:</span>
                          <span className={`ml-1 font-semibold ${company.growth > 0 ? 'text-nb-ok' : 'text-nb-error'}`}>
                            {company.growth > 0 ? '+' : ''}{company.growth}%
                          </span>
                        </div>
                      </div>
                      
                      <div className={`mt-2 px-2 py-1 rounded text-xs font-semibold ${
                        company.status === 'approved' ? 'bg-nb-ok text-nb-ink' :
                        company.status === 'funded' ? 'bg-nb-accent text-nb-ink' :
                        'bg-nb-warn text-nb-ink'
                      }`}>
                        {company.status === 'approved' ? '✅ Ready to Fund' :
                         company.status === 'funded' ? '💰 Funded' :
                         '⏳ Under Review'}
                      </div>
                    </motion.div>
                  ))}
                </div>
                
                <NBButton variant="outline" className="w-full mt-4">
                  <Plus size={16} className="mr-2" />
                  Add SaaS Company
                </NBButton>
              </NBCard>
            </motion.div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {selectedCompany ? (
              <>
                {/* Company Overview */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <NBCard>
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h2 className="font-display font-bold text-2xl text-nb-ink mb-2">
                          {selectedCompany.company}
                        </h2>
                        <p className="text-nb-ink/70">SaaS Revenue Analysis & Financing</p>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-nb-accent">
                          ${selectedCompany.mrr.toLocaleString()}
                        </div>
                        <div className="text-sm text-nb-ink/60">Monthly Recurring Revenue</div>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                      <div className="text-center">
                        <div className="flex items-center justify-center mb-2">
                          {selectedCompany.growth > 0 ? (
                            <TrendingUp className="text-nb-ok mr-1" size={20} />
                          ) : (
                            <TrendingDown className="text-nb-error mr-1" size={20} />
                          )}
                          <span className={`text-2xl font-bold ${
                            selectedCompany.growth > 0 ? 'text-nb-ok' : 'text-nb-error'
                          }`}>
                            {selectedCompany.growth > 0 ? '+' : ''}{selectedCompany.growth}%
                          </span>
                        </div>
                        <div className="text-sm text-nb-ink/60">Monthly Growth Rate</div>
                      </div>

                      <div className="text-center">
                        <div className="flex items-center justify-center mb-2">
                          <Users className="text-nb-accent-2 mr-1" size={20} />
                          <span className="text-2xl font-bold text-nb-accent-2">
                            {selectedCompany.churn}%
                          </span>
                        </div>
                        <div className="text-sm text-nb-ink/60">Churn Rate</div>
                      </div>

                      <div className="text-center">
                        <div className="flex items-center justify-center mb-2">
                          <BarChart3 className="text-nb-purple mr-1" size={20} />
                          <span className="text-2xl font-bold text-nb-purple">
                            ${selectedCompany.projection?.toLocaleString() || 'N/A'}
                          </span>
                        </div>
                        <div className="text-sm text-nb-ink/60">Projected Next Month</div>
                      </div>
                    </div>
                  </NBCard>
                </motion.div>

                {/* Charts */}
                <motion.div
                  className="grid md:grid-cols-2 gap-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <PerformanceChart
                    title="MRR Trend"
                    data={mockMRRData}
                    color="#60A5FA"
                    height={250}
                  />
                  
                  <PerformanceChart
                    title="Churn Rate"
                    data={mockChurnData}
                    color="#F59E0B"
                    height={250}
                  />
                </motion.div>

                {/* Financing Calculator */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <NBCard>
                    <div className="flex items-center mb-6">
                      <Calculator className="text-nb-accent mr-2" size={24} />
                      <h3 className="font-bold text-xl">Financing Calculator</h3>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-semibold mb-2">
                            Financing Amount
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-nb-ink/60">$</span>
                            <input
                              type="number"
                              value={financingAmount}
                              onChange={(e) => setFinancingAmount(e.target.value)}
                              placeholder="Enter amount..."
                              className="w-full pl-8 pr-4 py-3 nb-border rounded-nb focus:outline-none focus:ring-2 focus:ring-nb-accent text-lg font-semibold"
                            />
                          </div>
                          <div className="text-xs text-nb-ink/60 mt-1">
                            Recommended: {(selectedCompany.mrr * 6).toLocaleString()} - {(selectedCompany.mrr * 12).toLocaleString()} 
                            (6-12x MRR)
                          </div>
                        </div>

                        {terms && (
                          <div className="space-y-3 p-4 bg-nb-accent/10 rounded-nb">
                            <h4 className="font-semibold">Quick Estimate</h4>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div>
                                <span className="text-nb-ink/60">Months of MRR:</span>
                                <span className="ml-2 font-bold">{terms.monthsOfMRR}</span>
                              </div>
                              <div>
                                <span className="text-nb-ink/60">Est. APY:</span>
                                <span className="ml-2 font-bold text-nb-accent">{terms.apy}%</span>
                              </div>
                              <div>
                                <span className="text-nb-ink/60">Origination Fee:</span>
                                <span className="ml-2 font-bold">${terms.fees.toLocaleString()}</span>
                              </div>
                              <div>
                                <span className="text-nb-ink/60">Payback Period:</span>
                                <span className="ml-2 font-bold">{terms.paybackPeriod}M</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-semibold">Key Benefits</h4>
                        <div className="space-y-3">
                          <div className="flex items-start space-x-2">
                            <Zap className="text-nb-ok mt-0.5" size={16} />
                            <div>
                              <div className="font-medium">No Equity Dilution</div>
                              <div className="text-sm text-nb-ink/70">Keep 100% ownership of your company</div>
                            </div>
                          </div>
                          <div className="flex items-start space-x-2">
                            <TrendingUp className="text-nb-accent mt-0.5" size={16} />
                            <div>
                              <div className="font-medium">Growth-Friendly Terms</div>
                              <div className="text-sm text-nb-ink/70">Payments adjust with your revenue</div>
                            </div>
                          </div>
                          <div className="flex items-start space-x-2">
                            <CreditCard className="text-nb-accent-2 mt-0.5" size={16} />
                            <div>
                              <div className="font-medium">Quick Approval</div>
                              <div className="text-sm text-nb-ink/70">Get approved in 24-48 hours</div>
                            </div>
                          </div>
                        </div>

                        {selectedCompany.status === 'approved' && financingAmount && (
                          <NBButton size="lg" className="w-full mt-6">
                            <TrendingUp size={16} className="mr-2" />
                            Apply for ${parseInt(financingAmount).toLocaleString()}
                          </NBButton>
                        )}
                      </div>
                    </div>

                    {terms && parseInt(financingAmount) > selectedCompany.mrr * 12 && (
                      <div className="mt-4 p-3 bg-nb-warn/10 rounded-nb border border-nb-warn/20">
                        <div className="flex items-start space-x-2">
                          <AlertTriangle className="text-nb-warn mt-0.5" size={16} />
                          <div className="text-sm">
                            <div className="font-semibold">High Risk Warning</div>
                            <div className="text-nb-ink/70">
                              Requesting more than 12x MRR may result in higher interest rates or rejection.
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </NBCard>
                </motion.div>
              </>
            ) : (
              <NBCard>
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">💻</div>
                  <h3 className="font-bold text-xl text-nb-ink mb-2">No SaaS Companies Connected</h3>
                  <p className="text-nb-ink/70 mb-6">
                    Connect your SaaS platform to analyze MRR and access financing options.
                  </p>
                  <Link to="/get-cash">
                    <NBButton>
                      <Plus size={16} className="mr-2" />
                      Connect SaaS Platform
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

export default SaaS;
