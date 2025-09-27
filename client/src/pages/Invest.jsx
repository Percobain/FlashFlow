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
  ArrowUpRight,
  Shield,
  Calendar,
  Target,
  TrendingDown,
  Activity,
  Calculator
} from 'lucide-react';
import NBButton from '../components/NBButton';
import NBCard from '../components/NBCard';
import SafetyScoreBadge from '../components/SafetyScoreBadge';
import StatPill from '../components/StatPill';
import basketService from '../services/basketService';

const Invest = () => {
  const [baskets, setBaskets] = useState([]);
  const [featuredBaskets, setFeaturedBaskets] = useState(null);
  const [platformStats, setPlatformStats] = useState({
    totalAUM: 2400000,
    avgAPY: 12.4,
    activeInvestors: 847,
    liveBaskets: 25,
  });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    safetyLevel: '',
    minAPY: '',
    maxAPY: '',
    sector: '',
    status: 'active'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('apy');

  useEffect(() => {
    loadData();
  }, [filters, searchTerm]);

  const loadData = async () => {
    setLoading(true);
    try {
      const basketFilters = {
        ...filters,
        searchTerm: searchTerm
      };
      
      const [basketsData, featuredData, statsData] = await Promise.all([
        basketService.listBaskets(basketFilters),
        basketService.getFeaturedBaskets(),
        basketService.getPlatformStats(),
      ]);
      
      setBaskets(basketsData);
      setFeaturedBaskets(featuredData);
      setPlatformStats(statsData);
    } catch (error) {
      console.error('Failed to load investment data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedBaskets = baskets
    .sort((a, b) => {
      if (sortBy === 'apy' && !filters.safetyLevel && !filters.minAPY && !filters.maxAPY && !filters.sector && !searchTerm) {
        if (a.isMock !== b.isMock) {
          return a.isMock ? 1 : -1;
        }
      }
      
      switch (sortBy) {
        case 'apy':
          return b.apy - a.apy;
        case 'safety':
          return b.safetyScore - a.safetyScore;
        case 'value':
          return b.totalValue - a.totalValue;
        case 'recent':
          return new Date(b.created) - new Date(a.created);
        default:
          return 0;
      }
    });

  const formatCurrency = (amount) => {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${amount}`;
  };

  // Simple Brutalist Loader
  if (loading) {
    return (
      <div className="min-h-screen py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-center items-center h-96">
            {/* Simple geometric loader */}
            <div className="grid grid-cols-3 gap-2">
              <div className="w-8 h-8 bg-blue-600 border-2 border-gray-900 animate-bounce"></div>
              <div className="w-8 h-8 bg-emerald-600 border-2 border-gray-900 animate-bounce delay-100"></div>
              <div className="w-8 h-8 bg-purple-600 border-2 border-gray-900 animate-bounce delay-200"></div>
              <div className="w-8 h-8 bg-orange-600 border-2 border-gray-900 animate-bounce delay-300"></div>
              <div className="w-8 h-8 bg-red-600 border-2 border-gray-900 animate-bounce delay-400"></div>
              <div className="w-8 h-8 bg-yellow-600 border-2 border-gray-900 animate-bounce delay-500"></div>
              <div className="w-8 h-8 bg-pink-600 border-2 border-gray-900 animate-bounce delay-600"></div>
              <div className="w-8 h-8 bg-indigo-600 border-2 border-gray-900 animate-bounce delay-700"></div>
              <div className="w-8 h-8 bg-teal-600 border-2 border-gray-900 animate-bounce delay-800"></div>
            </div>
            
            <div className="mt-8">
              <h3 className="font-black text-xl text-gray-900 uppercase tracking-wide text-center">
                LOADING...
              </h3>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header - Minimalist with Color */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="font-black text-6xl text-gray-900 mb-6 tracking-tight">
            INVESTMENT
            <br />
            <span className="bg-blue-600 text-white px-4 py-2 inline-block transform rotate-1">
              MARKETPLACE
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto font-medium">
            Discover diversified cash flow baskets with transparent safety scoring
          </p>
        </motion.div>

        {/* Market Stats - Colorful Cards */}
        <motion.div
          className="grid md:grid-cols-4 gap-6 mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="bg-blue-600 text-white border-4 border-blue-700 p-6 transform -rotate-1 hover:rotate-0 transition-transform">
            <div className="text-3xl font-black mb-2">{formatCurrency(platformStats.totalAUM)}</div>
            <div className="text-sm font-bold text-blue-100 uppercase tracking-wide">TOTAL AUM</div>
          </div>
          <div className="bg-emerald-600 text-white border-4 border-emerald-700 p-6 transform rotate-1 hover:rotate-0 transition-transform">
            <div className="text-3xl font-black mb-2">{platformStats.avgAPY.toFixed(1)}%</div>
            <div className="text-sm font-bold text-emerald-100 uppercase tracking-wide">AVG APY</div>
          </div>
          <div className="bg-purple-600 text-white border-4 border-purple-700 p-6 transform -rotate-1 hover:rotate-0 transition-transform">
            <div className="text-3xl font-black mb-2">{platformStats.activeInvestors.toLocaleString()}</div>
            <div className="text-sm font-bold text-purple-100 uppercase tracking-wide">INVESTORS</div>
          </div>
          <div className="bg-orange-600 text-white border-4 border-orange-700 p-6 transform rotate-1 hover:rotate-0 transition-transform">
            <div className="text-3xl font-black mb-2">{platformStats.liveBaskets}</div>
            <div className="text-sm font-bold text-orange-100 uppercase tracking-wide">LIVE BASKETS</div>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Filters Sidebar - Clean with Accent Colors */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="sticky top-8"
            >
              <div className="bg-white border-4 border-gray-900 shadow-lg">
                {/* Filter Header */}
                <div className="bg-gray-900 text-white p-6 border-b-4 border-gray-900">
                  <h3 className="font-black text-xl flex items-center">
                    <div className="w-8 h-8 bg-blue-600 text-white flex items-center justify-center mr-3 border-2 border-blue-600">
                      <Filter size={16} className="font-bold" />
                    </div>
                    FILTERS
                  </h3>
                </div>

                <div className="p-6 space-y-8">
                  {/* Search */}
                  <div>
                    <label className="block text-sm font-black text-gray-900 mb-3 uppercase tracking-wide">
                      SEARCH
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-4 bg-gray-50 border-4 border-gray-300 focus:outline-none focus:border-blue-600 font-bold placeholder:text-gray-400"
                      />
                      <Search size={20} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500" />
                    </div>
                  </div>

                  {/* Safety Level */}
                  <div>
                    <label className="block text-sm font-black text-gray-900 mb-3 uppercase tracking-wide">
                      SAFETY LEVEL
                    </label>
                    <div className="relative">
                      <select
                        value={filters.safetyLevel}
                        onChange={(e) => setFilters(prev => ({ ...prev, safetyLevel: e.target.value }))}
                        className="w-full px-4 py-4 bg-gray-50 border-4 border-gray-300 focus:outline-none focus:border-blue-600 font-bold appearance-none cursor-pointer"
                      >
                        <option value="">ALL LEVELS</option>
                        <option value="High">HIGH SAFETY</option>
                        <option value="Medium">MEDIUM SAFETY</option>
                        <option value="Low">LOW SAFETY</option>
                      </select>
                      <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                        <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-600"></div>
                      </div>
                    </div>
                  </div>

                  {/* APY Range */}
                  <div>
                    <label className="block text-sm font-black text-gray-900 mb-3 uppercase tracking-wide">
                      APY RANGE
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="number"
                        placeholder="MIN"
                        value={filters.minAPY}
                        onChange={(e) => setFilters(prev => ({ ...prev, minAPY: e.target.value }))}
                        className="px-4 py-3 bg-gray-50 border-4 border-gray-300 focus:outline-none focus:border-blue-600 font-bold placeholder:text-gray-400"
                      />
                      <input
                        type="number"
                        placeholder="MAX"
                        value={filters.maxAPY}
                        onChange={(e) => setFilters(prev => ({ ...prev, maxAPY: e.target.value }))}
                        className="px-4 py-3 bg-gray-50 border-4 border-gray-300 focus:outline-none focus:border-blue-600 font-bold placeholder:text-gray-400"
                      />
                    </div>
                  </div>

                  {/* Sort By */}
                  <div>
                    <label className="block text-sm font-black text-gray-900 mb-3 uppercase tracking-wide">
                      SORT BY
                    </label>
                    <div className="relative">
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="w-full px-4 py-4 bg-gray-50 border-4 border-gray-300 focus:outline-none focus:border-blue-600 font-bold appearance-none cursor-pointer"
                      >
                        <option value="apy">HIGHEST APY</option>
                        <option value="safety">HIGHEST SAFETY</option>
                        <option value="value">TOTAL VALUE</option>
                        <option value="recent">MOST RECENT</option>
                      </select>
                      <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                        <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-600"></div>
                      </div>
                    </div>
                  </div>

                  {/* Clear Filters */}
                  <button
                    onClick={() => {
                      setFilters({
                        safetyLevel: '',
                        minAPY: '',
                        maxAPY: '',
                        sector: '',
                        status: 'active'
                      });
                      setSearchTerm('');
                      setSortBy('apy');
                    }}
                    className="w-full px-4 py-4 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-wide transition-colors border-4 border-red-700"
                  >
                    CLEAR ALL
                  </button>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Baskets List */}
          <div className="lg:col-span-4">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              {/* Header */}
              <div className="flex justify-between items-center mb-12">
                <div>
                  <h2 className="font-black text-4xl text-gray-900 mb-2 uppercase tracking-tight">
                    INVESTMENT BASKETS
                  </h2>
                  <p className="text-gray-600 font-bold">
                    {filteredAndSortedBaskets.length} BASKETS AVAILABLE
                  </p>
                </div>
              </div>

              {/* Cards Grid */}
              <div className="grid lg:grid-cols-2 gap-8">
                {filteredAndSortedBaskets.map(basket => (
                  <BasketCard key={basket.id} basket={basket} />
                ))}
              </div>

              {/* Empty State */}
              {filteredAndSortedBaskets.length === 0 && (
                <div className="text-center py-20">
                  <div className="w-24 h-24 bg-gray-600 text-white flex items-center justify-center mx-auto mb-8 border-4 border-gray-700">
                    <BarChart3 size={32} className="font-bold" />
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 mb-4 uppercase">NO BASKETS FOUND</h3>
                  <p className="text-gray-600 font-bold mb-8">
                    ADJUST YOUR FILTERS TO SEE MORE RESULTS
                  </p>
                  <button
                    onClick={() => {
                      setFilters({
                        safetyLevel: '',
                        minAPY: '',
                        maxAPY: '',
                        sector: '',
                        status: 'active'
                      });
                      setSearchTerm('');
                    }}
                    className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-wide transition-colors border-4 border-blue-700"
                  >
                    CLEAR FILTERS
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Enhanced BasketCard with Colors
const BasketCard = ({ basket }) => (
  <Link to={`/baskets/${basket.id}`} className="block group">
    <div className="bg-white border-4 border-gray-900 hover:shadow-[8px_8px_0px_0px_rgba(59,130,246,0.5)] transition-all duration-200 group-hover:-translate-x-1 group-hover:-translate-y-1">
      {/* Header with Color Accent */}
      <div className={`p-6 border-b-4 border-gray-900 ${
        !basket.isMock 
          ? 'bg-gradient-to-r from-blue-600 to-gray-900 text-white' 
          : 'bg-gradient-to-r from-blue-600 to-gray-900 text-white'
      }`}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="font-black text-xl uppercase tracking-tight">
                {basket.name}
              </h3>
              {!basket.isMock && (
                <span className="px-3 py-1 text-xs font-black bg-emerald-500 text-white border-2 border-emerald-600">
                  LIVE
                </span>
              )}
            </div>
            <p className="text-white/90 font-bold text-sm">
              {basket.description}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 bg-white">
        {/* Main Metrics */}
        <div className="grid grid-cols-3 gap-6 mb-6">
          <div className="text-center">
            <div className="text-4xl font-black text-emerald-600 mb-1">
              {basket.apy}%
            </div>
            <div className="text-xs font-black text-gray-500 uppercase tracking-wide">
              APY
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg font-black text-gray-900 mb-1">
              {formatCurrency(basket.totalValue)}
            </div>
            <div className="text-xs font-black text-gray-500 uppercase tracking-wide">
              TOTAL
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg font-black text-gray-900 mb-1">
              {formatCurrency(basket.availableToInvest || basket.totalValue * 0.85)}
            </div>
            <div className="text-xs font-black text-gray-500 uppercase tracking-wide">
              AVAILABLE
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-sm font-bold text-gray-600 mb-6 py-4 border-t-2 border-b-2 border-gray-200">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-blue-600" />
            <span>{basket.investorCount || 0}</span>
          </div>
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-purple-600" />
            <span>{basket.assetCount || 1}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-orange-600" />
            <span>{basket.duration || 24}M</span>
          </div>
        </div>

        {/* Status and Safety */}
        <div className="flex items-center justify-between mb-6">
          <span className={`px-4 py-2 text-xs font-black uppercase tracking-wide border-2 ${
            basket.status === 'open' || basket.status === 'active' 
              ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
              : 'bg-gray-100 text-gray-800 border-gray-300'
          }`}>
            {basket.status === 'open' ? 'ACTIVE' : basket.status?.toUpperCase()}
          </span>
          <SafetyScoreBadge 
            score={basket.safetyScore} 
            level={basket.safetyLevel}
            size="sm"
          />
        </div>

        {/* Asset Mix */}
        {basket.composition && basket.composition.length > 0 && (
          <div className="mb-6">
            <div className="text-xs font-black text-gray-500 mb-3 uppercase tracking-wide">
              ASSET MIX
            </div>
            <div className="flex flex-wrap gap-2">
              {basket.composition.slice(0, 3).map((comp, index) => (
                <span 
                  key={index}
                  className="px-3 py-1 text-xs font-black bg-blue-50 text-blue-800 border-2 border-blue-200 uppercase"
                >
                  {comp.type} {comp.percentage}%
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Action Button */}
        <button className={`w-full font-black py-4 px-6 uppercase tracking-wide transition-all border-4 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] hover:-translate-x-0.5 hover:-translate-y-0.5 ${
          !basket.isMock 
            ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-700' 
            : 'bg-blue-600 hover:bg-blue-700 text-white border-blue-700'
        }`}>
          <span className="flex items-center justify-center gap-2">
            <span>
              {!basket.isMock ? 'INVEST NOW' : 'VIEW DETAILS'}
            </span>
            <ArrowUpRight size={16} className="font-bold" />
          </span>
        </button>
      </div>
    </div>
  </Link>
);

const formatCurrency = (amount) => {
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
  return `$${amount}`;
};

export default Invest;