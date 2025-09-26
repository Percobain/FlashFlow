import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, 
  Filter, 
  Search, 
  Star, 
  Eye, 
  DollarSign,
  Clock,
  Users,
  BarChart3,
  ArrowUpRight
} from 'lucide-react';
import NBButton from '../components/NBButton';
import NBCard from '../components/NBCard';
import RiskScoreBadge from '../components/RiskScoreBadge';
import StatPill from '../components/StatPill';
import basketService from '../services/basketService';

const Invest = () => {
  const [baskets, setBaskets] = useState([]);
  const [featuredBaskets, setFeaturedBaskets] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    riskLevel: '',
    minAPY: '',
    maxAPY: '',
    sector: '',
    status: 'active'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('apy'); // 'apy', 'risk', 'value', 'recent'

  useEffect(() => {
    loadBaskets();
    loadFeaturedBaskets();
  }, [filters]);

  const loadBaskets = async () => {
    try {
      const data = await basketService.listBaskets(filters);
      setBaskets(data);
    } catch (error) {
      console.error('Failed to load baskets:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFeaturedBaskets = async () => {
    try {
      const featured = await basketService.getFeaturedBaskets();
      setFeaturedBaskets(featured);
    } catch (error) {
      console.error('Failed to load featured baskets:', error);
    }
  };

  const filteredAndSortedBaskets = baskets
    .filter(basket => 
      basket.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      basket.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'apy':
          return b.apy - a.apy;
        case 'risk':
          return b.riskScore - a.riskScore;
        case 'value':
          return b.totalValue - a.totalValue;
        case 'recent':
          return new Date(b.created) - new Date(a.created);
        default:
          return 0;
      }
    });

  const getRiskLevelColor = (level) => {
    switch (level) {
      case 'Low': return 'nb-ok';
      case 'Medium': return 'nb-warn';
      case 'High': return 'nb-error';
      default: return 'nb-ink/20';
    }
  };

  const formatCurrency = (amount) => {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${amount}`;
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
          <h1 className="font-display font-bold text-5xl text-nb-ink mb-4">
            Investment{' '}
            <span className="text-transparent bg-gradient-to-r from-nb-accent to-nb-accent-2 bg-clip-text">
              Marketplace
            </span>
          </h1>
          <p className="text-xl text-nb-ink/70 max-w-3xl mx-auto">
            Discover diversified cash flow baskets with transparent risk scoring 
            and competitive returns across multiple sectors.
          </p>
        </motion.div>

        {/* Market Stats */}
        <motion.div
          className="grid md:grid-cols-4 gap-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <StatPill
            value="$2.4M"
            label="Total AUM"
            icon={DollarSign}
            color="nb-accent"
          />
          <StatPill
            value="12.4%"
            label="Avg APY"
            icon={TrendingUp}
            color="nb-accent-2"
            trend={2.1}
          />
          <StatPill
            value="847"
            label="Active Investors"
            icon={Users}
            color="nb-ok"
          />
          <StatPill
            value="25"
            label="Live Baskets"
            icon={BarChart3}
            color="nb-purple"
          />
        </motion.div>

        {/* Featured Baskets */}
        {featuredBaskets && (
          <motion.div
            className="mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="font-display font-bold text-3xl text-nb-ink mb-6">Featured Baskets</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {Object.entries(featuredBaskets).map(([category, baskets]) => (
                <div key={category}>
                  <h3 className="font-semibold text-lg text-nb-ink mb-3 capitalize">
                    {category.replace(/([A-Z])/g, ' $1').trim()}
                  </h3>
                  <div className="space-y-3">
                    {baskets.slice(0, 1).map(basket => (
                      <FeaturedBasketCard key={basket.id} basket={basket} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <NBCard>
                <h3 className="font-bold text-lg mb-4 flex items-center">
                  <Filter size={16} className="mr-2" />
                  Filters
                </h3>
                
                <div className="space-y-6">
                  {/* Search */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Search</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-nb-ink/40" size={16} />
                      <input
                        type="text"
                        placeholder="Search baskets..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 nb-border rounded-lg focus:outline-none focus:ring-2 focus:ring-nb-accent"
                      />
                    </div>
                  </div>

                  {/* Risk Level */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Risk Level</label>
                    <select
                      value={filters.riskLevel}
                      onChange={(e) => setFilters(prev => ({ ...prev, riskLevel: e.target.value }))}
                      className="w-full px-3 py-2 nb-border rounded-lg focus:outline-none focus:ring-2 focus:ring-nb-accent"
                    >
                      <option value="">All Levels</option>
                      <option value="Low">Low Risk</option>
                      <option value="Medium">Medium Risk</option>
                      <option value="High">High Risk</option>
                    </select>
                  </div>

                  {/* APY Range */}
                  <div>
                    <label className="block text-sm font-medium mb-2">APY Range</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        placeholder="Min %"
                        value={filters.minAPY}
                        onChange={(e) => setFilters(prev => ({ ...prev, minAPY: e.target.value }))}
                        className="px-3 py-2 nb-border rounded-lg focus:outline-none focus:ring-2 focus:ring-nb-accent"
                      />
                      <input
                        type="number"
                        placeholder="Max %"
                        value={filters.maxAPY}
                        onChange={(e) => setFilters(prev => ({ ...prev, maxAPY: e.target.value }))}
                        className="px-3 py-2 nb-border rounded-lg focus:outline-none focus:ring-2 focus:ring-nb-accent"
                      />
                    </div>
                  </div>

                  {/* Sector */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Sector</label>
                    <select
                      value={filters.sector}
                      onChange={(e) => setFilters(prev => ({ ...prev, sector: e.target.value }))}
                      className="w-full px-3 py-2 nb-border rounded-lg focus:outline-none focus:ring-2 focus:ring-nb-accent"
                    >
                      <option value="">All Sectors</option>
                      <option value="Invoice">Invoice</option>
                      <option value="SaaS">SaaS</option>
                      <option value="Creator">Creator</option>
                      <option value="Rental">Rental</option>
                      <option value="Luxury">Luxury</option>
                    </select>
                  </div>

                  <NBButton 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setFilters({ riskLevel: '', minAPY: '', maxAPY: '', sector: '', status: 'active' })}
                  >
                    Clear Filters
                  </NBButton>
                </div>
              </NBCard>
            </motion.div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Sort and View Controls */}
            <motion.div
              className="flex justify-between items-center mb-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <div className="flex items-center space-x-4">
                <span className="text-sm text-nb-ink/70">
                  {filteredAndSortedBaskets.length} basket{filteredAndSortedBaskets.length !== 1 ? 's' : ''}
                </span>
                <div className="flex space-x-1">
                  {['apy', 'risk', 'value', 'recent'].map((sort) => (
                    <button
                      key={sort}
                      onClick={() => setSortBy(sort)}
                      className={`px-3 py-1 text-xs rounded-lg transition-colors capitalize ${
                        sortBy === sort
                          ? 'bg-nb-accent text-nb-ink font-semibold'
                          : 'text-nb-ink/60 hover:bg-nb-accent/20'
                      }`}
                    >
                      {sort === 'apy' ? 'APY' : sort}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Baskets Grid */}
            <div className="grid md:grid-cols-2 gap-6">
              {filteredAndSortedBaskets.map((basket, index) => (
                <motion.div
                  key={basket.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                >
                  <BasketCard basket={basket} />
                </motion.div>
              ))}
            </div>

            {filteredAndSortedBaskets.length === 0 && (
              <NBCard>
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">📊</div>
                  <h3 className="font-bold text-xl text-nb-ink mb-2">No baskets found</h3>
                  <p className="text-nb-ink/70 mb-6">
                    Try adjusting your filters or search terms to find matching baskets.
                  </p>
                  <NBButton 
                    variant="outline"
                    onClick={() => {
                      setFilters({ riskLevel: '', minAPY: '', maxAPY: '', sector: '', status: 'active' });
                      setSearchTerm('');
                    }}
                  >
                    Clear All Filters
                  </NBButton>
                </div>
              </NBCard>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Featured Basket Card Component
const FeaturedBasketCard = ({ basket }) => (
  <NBCard className="relative overflow-hidden">
    <div className="absolute top-0 right-0 bg-nb-accent px-2 py-1 rounded-bl-nb">
      <Star size={12} className="text-nb-ink" />
    </div>
    
    <div className="space-y-3">
      <h4 className="font-bold text-lg">{basket.name}</h4>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <span className="text-nb-ink/60">APY:</span>
          <span className="ml-1 font-bold text-nb-accent">{basket.apy}%</span>
        </div>
        <div>
          <span className="text-nb-ink/60">Value:</span>
          <span className="ml-1 font-bold">{formatCurrency(basket.totalValue)}</span>
        </div>
      </div>
      <Link to={`/baskets/${basket.id}`}>
        <NBButton size="sm" className="w-full">
          View Details
        </NBButton>
      </Link>
    </div>
  </NBCard>
);

// Main Basket Card Component  
const BasketCard = ({ basket }) => (
  <NBCard className="h-full">
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-bold text-lg text-nb-ink mb-1">{basket.name}</h3>
          <p className="text-sm text-nb-ink/70 line-clamp-2">{basket.description}</p>
        </div>
        <RiskScoreBadge score={basket.riskScore} size="sm" />
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <div className="text-xs text-nb-ink/60">APY</div>
          <div className="font-bold text-xl text-nb-accent">{basket.apy}%</div>
        </div>
        <div>
          <div className="text-xs text-nb-ink/60">Total Value</div>
          <div className="font-bold text-lg">{formatCurrency(basket.totalValue)}</div>
        </div>
        <div>
          <div className="text-xs text-nb-ink/60">Investors</div>
          <div className="font-bold text-lg">{basket.investorCount}</div>
        </div>
      </div>

      {/* Composition */}
      <div>
        <div className="text-xs text-nb-ink/60 mb-2">Composition</div>
        <div className="flex flex-wrap gap-1">
          {basket.composition.slice(0, 3).map((comp, index) => (
            <span 
              key={index}
              className="px-2 py-1 text-xs bg-nb-accent/20 rounded-full capitalize"
            >
              {comp.type} {comp.percentage}%
            </span>
          ))}
          {basket.composition.length > 3 && (
            <span className="px-2 py-1 text-xs bg-nb-ink/10 rounded-full">
              +{basket.composition.length - 3} more
            </span>
          )}
        </div>
      </div>

      {/* Status and Duration */}
      <div className="flex justify-between items-center text-sm">
        <div className={`px-3 py-1 rounded-full font-semibold ${
          basket.status === 'active' ? 'bg-nb-ok text-nb-ink' :
          basket.status === 'filling' ? 'bg-nb-warn text-nb-ink' :
          'bg-nb-ink/20 text-nb-ink'
        }`}>
          {basket.status}
        </div>
        <div className="flex items-center space-x-1 text-nb-ink/60">
          <Clock size={12} />
          <span>{basket.duration}M duration</span>
        </div>
      </div>

      {/* Minimum Investment */}
      <div className="text-sm text-nb-ink/70">
        Min. investment: ${basket.minimumInvestment.toLocaleString()}
      </div>

      {/* Actions */}
      <div className="flex space-x-2 pt-2">
        <Link to={`/baskets/${basket.id}`} className="flex-1">
          <NBButton variant="outline" size="sm" className="w-full">
            <Eye size={14} className="mr-1" />
            View Details
          </NBButton>
        </Link>
        <NBButton size="sm" className="flex-1">
          <ArrowUpRight size={14} className="mr-1" />
          Invest
        </NBButton>
      </div>
    </div>
  </NBCard>
);

const formatCurrency = (amount) => {
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
  return `$${amount}`;
};

export default Invest;