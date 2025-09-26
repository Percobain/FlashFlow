import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  Filter, 
  Search, 
  Download, 
  Eye, 
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp
} from 'lucide-react';
import NBButton from '../components/NBButton';
import NBCard from '../components/NBCard';
import RiskScoreBadge from '../components/RiskScoreBadge';
import PerformanceChart from '../components/PerformanceChart';
import receivablesService from '../services/receivablesService';

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoices, setSelectedInvoices] = useState(new Set());

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      const data = await receivablesService.fetchReceivables('invoice');
      setInvoices(data);
    } catch (error) {
      console.error('Failed to load invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesFilter = filter === 'all' || invoice.status === filter;
    const matchesSearch = invoice.seller.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.buyer.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid': return <CheckCircle className="text-nb-ok" size={16} />;
      case 'funded': return <TrendingUp className="text-nb-accent" size={16} />;
      case 'approved': return <Clock className="text-nb-warn" size={16} />;
      default: return <AlertCircle className="text-nb-ink/40" size={16} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'bg-nb-ok text-nb-ink';
      case 'funded': return 'bg-nb-accent text-nb-ink';
      case 'approved': return 'bg-nb-warn text-nb-ink';
      default: return 'bg-nb-ink/20 text-nb-ink';
    }
  };

  const toggleInvoiceSelection = (invoiceId) => {
    const newSelection = new Set(selectedInvoices);
    if (newSelection.has(invoiceId)) {
      newSelection.delete(invoiceId);
    } else {
      newSelection.add(invoiceId);
    }
    setSelectedInvoices(newSelection);
  };

  const mockPerformanceData = [
    { date: '2025-01', value: 100 },
    { date: '2025-02', value: 105 },
    { date: '2025-03', value: 112 },
    { date: '2025-04', value: 108 },
    { date: '2025-05', value: 118 },
    { date: '2025-06', value: 125 },
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
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <div>
              <h1 className="font-display font-bold text-4xl text-nb-ink mb-2">
                Invoice Factoring
              </h1>
              <p className="text-xl text-nb-ink/70">
                Convert B2B invoices into immediate cash flow
              </p>
            </div>
            <Link to="/get-cash">
              <NBButton size="lg">
                <Plus size={20} className="mr-2" />
                Add Invoices
              </NBButton>
            </Link>
          </div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-4 gap-4 mb-6">
            <NBCard hover={false} padding="sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-nb-accent">
                  ${invoices.reduce((sum, inv) => sum + inv.amount, 0).toLocaleString()}
                </div>
                <div className="text-sm text-nb-ink/60">Total Value</div>
              </div>
            </NBCard>
            <NBCard hover={false} padding="sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-nb-ok">
                  {invoices.filter(inv => inv.status === 'approved').length}
                </div>
                <div className="text-sm text-nb-ink/60">Ready to Fund</div>
              </div>
            </NBCard>
            <NBCard hover={false} padding="sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-nb-accent-2">
                  {Math.round(invoices.reduce((sum, inv) => sum + inv.riskScore, 0) / invoices.length)}
                </div>
                <div className="text-sm text-nb-ink/60">Avg Risk Score</div>
              </div>
            </NBCard>
            <NBCard hover={false} padding="sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-nb-purple">
                  9.2%
                </div>
                <div className="text-sm text-nb-ink/60">Avg APY</div>
              </div>
            </NBCard>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Filters */}
            <motion.div
              className="mb-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <NBCard hover={false} padding="sm">
                <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-nb-ink/40" size={16} />
                      <input
                        type="text"
                        placeholder="Search by seller or buyer..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 nb-border rounded-lg focus:outline-none focus:ring-2 focus:ring-nb-accent"
                      />
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    {['all', 'pending', 'approved', 'funded', 'paid'].map((status) => (
                      <button
                        key={status}
                        onClick={() => setFilter(status)}
                        className={`px-3 py-2 text-sm rounded-lg transition-colors capitalize ${
                          filter === status
                            ? 'bg-nb-accent text-nb-ink font-semibold'
                            : 'text-nb-ink/60 hover:bg-nb-accent/20'
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
              </NBCard>
            </motion.div>

            {/* Bulk Actions */}
            {selectedInvoices.size > 0 && (
              <motion.div
                className="mb-4"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <NBCard hover={false} padding="sm">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">
                      {selectedInvoices.size} invoice{selectedInvoices.size !== 1 ? 's' : ''} selected
                    </span>
                    <div className="flex space-x-2">
                      <NBButton size="sm" variant="outline">
                        Create Basket
                      </NBButton>
                      <NBButton size="sm">
                        Bulk Tokenize
                      </NBButton>
                    </div>
                  </div>
                </NBCard>
              </motion.div>
            )}

            {/* Invoice List */}
            <div className="space-y-4">
              {filteredInvoices.map((invoice, index) => (
                <motion.div
                  key={invoice.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <NBCard>
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <input
                            type="checkbox"
                            checked={selectedInvoices.has(invoice.id)}
                            onChange={() => toggleInvoiceSelection(invoice.id)}
                            className="mt-1 w-4 h-4 text-nb-accent border-nb-ink rounded focus:ring-nb-accent"
                          />
                          <div>
                            <h3 className="font-bold text-lg text-nb-ink mb-1">
                              {invoice.seller} → {invoice.buyer}
                            </h3>
                            <p className="text-sm text-nb-ink/70">
                              Invoice #{invoice.id} • Due {new Date(invoice.dueDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <RiskScoreBadge score={invoice.riskScore} size="sm" />
                          <div className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center space-x-1 ${getStatusColor(invoice.status)}`}>
                            {getStatusIcon(invoice.status)}
                            <span className="capitalize">{invoice.status}</span>
                          </div>
                        </div>
                      </div>

                      {/* Amount and Metrics */}
                      <div className="grid md:grid-cols-4 gap-4">
                        <div>
                          <div className="text-xs text-nb-ink/60">Invoice Amount</div>
                          <div className="font-bold text-lg">${invoice.amount.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-xs text-nb-ink/60">Unlockable</div>
                          <div className="font-bold text-lg text-nb-accent">
                            ${Math.round(invoice.amount * 0.85).toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-nb-ink/60">Est. APY</div>
                          <div className="font-bold text-lg text-nb-accent-2">
                            {((100 - invoice.riskScore) * 0.3 + 8).toFixed(1)}%
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-nb-ink/60">Days to Due</div>
                          <div className="font-bold text-lg">
                            {Math.ceil((new Date(invoice.dueDate) - new Date()) / (1000 * 60 * 60 * 24))}
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-sm text-nb-ink/70 line-clamp-2">
                        {invoice.description}
                      </p>

                      {/* Actions */}
                      <div className="flex justify-between items-center pt-4 border-t border-nb-ink/10">
                        <div className="text-xs text-nb-ink/60">
                          Created {new Date(invoice.created).toLocaleDateString()}
                        </div>
                        <div className="flex space-x-2">
                          <NBButton variant="outline" size="sm">
                            <Eye size={14} className="mr-1" />
                            View
                          </NBButton>
                          {invoice.status === 'approved' && (
                            <NBButton size="sm">
                              Tokenize
                            </NBButton>
                          )}
                        </div>
                      </div>
                    </div>
                  </NBCard>
                </motion.div>
              ))}
            </div>

            {filteredInvoices.length === 0 && (
              <NBCard>
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">📄</div>
                  <h3 className="font-bold text-xl text-nb-ink mb-2">No invoices found</h3>
                  <p className="text-nb-ink/70 mb-6">
                    {searchTerm || filter !== 'all' 
                      ? 'Try adjusting your filters or search terms'
                      : 'Connect your accounting software to get started'
                    }
                  </p>
                  <Link to="/get-cash">
                    <NBButton>
                      <Plus size={16} className="mr-2" />
                      Add Invoices
                    </NBButton>
                  </Link>
                </div>
              </NBCard>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Performance Chart */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <PerformanceChart
                title="Invoice Performance"
                data={mockPerformanceData}
                height={250}
                color="#6EE7B7"
              />
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <NBCard>
                <h3 className="font-bold text-lg mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <NBButton variant="outline" className="w-full justify-start">
                    <Download size={16} className="mr-2" />
                    Export Data
                  </NBButton>
                  <NBButton variant="outline" className="w-full justify-start">
                    <Filter size={16} className="mr-2" />
                    Advanced Filters
                  </NBButton>
                  <NBButton variant="outline" className="w-full justify-start">
                    <TrendingUp size={16} className="mr-2" />
                    Analytics Report
                  </NBButton>
                </div>
              </NBCard>
            </motion.div>

            {/* Integration Status */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <NBCard>
                <h3 className="font-bold text-lg mb-4">Connected Sources</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-nb-accent rounded-lg flex items-center justify-center">
                        📊
                      </div>
                      <span className="font-medium">QuickBooks</span>
                    </div>
                    <div className="w-2 h-2 bg-nb-ok rounded-full"></div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-nb-accent-2 rounded-lg flex items-center justify-center">
                        💼
                      </div>
                      <span className="font-medium">Xero</span>
                    </div>
                    <div className="w-2 h-2 bg-nb-ink/20 rounded-full"></div>
                  </div>
                </div>
                <NBButton variant="outline" size="sm" className="w-full mt-4">
                  <Plus size={14} className="mr-1" />
                  Add Source
                </NBButton>
              </NBCard>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Invoices;
