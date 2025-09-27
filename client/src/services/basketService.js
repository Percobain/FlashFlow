import { faker } from '@faker-js/faker';
import apiService from './apiService';

faker.seed(123456);

// Generate mock basket data for fallback/additional baskets
const generateBasket = (id) => {
  const safetyLevels = ['High', 'Medium', 'Low']; // Changed from risk levels
  const sectors = ['Invoice', 'SaaS', 'Creator', 'Rental', 'Luxury'];
  const safetyLevel = faker.helpers.arrayElement(safetyLevels);
  
  // Generate a realistic safety score based on safety level
  const safetyScore = safetyLevel === 'High' ? faker.number.int({ min: 80, max: 95 }) : 
                     safetyLevel === 'Medium' ? faker.number.int({ min: 65, max: 80 }) :
                     faker.number.int({ min: 45, max: 65 });
  
  return {
    id: `mock_basket_${id}`,
    basketId: `mock_basket_${id}`,
    name: faker.helpers.arrayElement([
      'Stable Income Plus',
      'Growth Accelerator', 
      'Premium Yield',
      'Diversified Cash Flow',
      'Rising Stars',
      'Conservative Income',
      'High Velocity',
      'BluChip Portfolio',
      'Emerging Markets',
      'Tech Innovation Fund'
    ]),
    description: faker.company.catchPhrase(),
    totalValue: faker.number.int({ min: 100000, max: 2000000 }),
    apy: Math.min(faker.number.float({ min: 6, max: 9, fractionDigits: 1 }), 9), // Cap at 9%
    safetyLevel,
    safetyScore,
    composition: generateComposition(),
    performance: generatePerformanceData(),
    investorCount: faker.number.int({ min: 15, max: 250 }),
    created: faker.date.past({ days: 120 }).toISOString(),
    status: faker.helpers.arrayElement(['active', 'closed', 'filling']),
    minimumInvestment: faker.helpers.arrayElement([1000, 5000, 10000, 25000]),
    duration: faker.number.int({ min: 6, max: 36 }), // months
    sectors: faker.helpers.arrayElements(sectors, { min: 1, max: 3 }),
    basketType: safetyLevel.toLowerCase(),
    isMock: true, // Flag to identify mock baskets
  };
};

const generateComposition = () => {
  const types = ['invoice', 'saas', 'creator', 'rental', 'luxury'];
  const composition = [];
  let remaining = 100;
  
  types.forEach((type, index) => {
    if (index === types.length - 1) {
      composition.push({ type, percentage: remaining });
    } else {
      const percentage = faker.number.int({ min: 5, max: Math.min(40, remaining - (types.length - index - 1) * 5) });
      composition.push({ type, percentage });
      remaining -= percentage;
    }
  });
  
  return composition.filter(c => c.percentage > 0);
};

const generatePerformanceData = () => {
  const data = [];
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 12);
  
  for (let i = 0; i < 12; i++) {
    const date = new Date(startDate);
    date.setMonth(date.getMonth() + i);
    
    data.push({
      date: date.toISOString().split('T')[0],
      value: faker.number.float({ min: 0.95, max: 1.15, fractionDigits: 3 }),
      volume: faker.number.int({ min: 10000, max: 100000 })
    });
  }
  
  return data;
};

// Generate mock baskets for fallback
const mockBaskets = Array.from({ length: 15 }, (_, i) => generateBasket(i + 1));

class BasketService {
  constructor() {
    this.mockBaskets = mockBaskets;
  }

  // List baskets - combines real backend baskets with mock baskets
  async listBaskets(filters = {}) {
    try {
      console.log('🔍 Fetching baskets from backend...');
      
      // Try to fetch real baskets from backend
      const backendBaskets = await this.fetchBackendBaskets(filters);
      
      // Transform backend baskets to match frontend format
      const transformedBackendBaskets = this.transformBackendBaskets(backendBaskets);
      
      // Apply frontend filters to both real and mock baskets separately
      const filteredRealBaskets = this.applyFilters(transformedBackendBaskets, filters);
      const filteredMockBaskets = this.applyFilters(this.mockBaskets, filters);
      
      // Check if any specific sorting/filtering is applied that should change priority
      const hasSpecificFilters = filters.safetyLevel || filters.minAPY || filters.maxAPY || filters.sector;
      const hasSearch = filters.searchTerm && filters.searchTerm.length > 0;
      
      if (hasSpecificFilters || hasSearch) {
        // If filters are applied, mix real and mock baskets and let natural sorting take over
        const allBaskets = [...filteredRealBaskets, ...filteredMockBaskets];
        console.log('🔍 Filters applied - using mixed sorting');
        return allBaskets;
      } else {
        // No specific filters - prioritize real baskets first
        const allBaskets = [...filteredRealBaskets, ...filteredMockBaskets];
        console.log('🔍 No filters - prioritizing real baskets first');
        console.log(`✅ Real baskets: ${filteredRealBaskets.length}, Mock baskets: ${filteredMockBaskets.length}`);
        return allBaskets;
      }
      
    } catch (error) {
      console.error('❌ Failed to fetch backend baskets, using mock data:', error);
      // Fallback to mock data only
      return this.applyFilters(this.mockBaskets, filters);
    }
  }

  // Fetch baskets from backend API
  async fetchBackendBaskets(filters = {}) {
    const queryParams = new URLSearchParams();
    
    if (filters.safetyLevel) {
      // Map safety level to risk level for backend compatibility
      const riskLevel = filters.safetyLevel === 'High' ? 'low' : 
                        filters.safetyLevel === 'Medium' ? 'medium' : 'high';
      queryParams.append('basketType', riskLevel);
    }
    if (filters.status) {
      queryParams.append('status', filters.status);
    }
    
    const response = await apiService.request(`/api/baskets?${queryParams.toString()}`);
    return response.data?.baskets || [];
  }

  // Transform backend basket format to frontend format
  transformBackendBaskets(backendBaskets) {
    return backendBaskets.map(basket => {
      // Map the database structure to frontend structure
      const safetyScore = basket.currentRiskScore || basket.averageRiskScore || 75;
      const safetyLevel = this.getSafetyLevel(safetyScore);
      
      return {
        id: basket.basketId,
        basketId: basket.basketId,
        name: basket.name || `${safetyLevel} Safety Basket`,
        description: basket.description || 'Automatically created basket based on safety threshold',
        totalValue: basket.totalValue || 0,
        totalInvested: basket.totalInvested || 0,
        availableToInvest: basket.availableToInvest || 0,
        apy: basket.expectedAPY || this.calculateAPYFromSafety(safetyScore),
        safetyLevel: safetyLevel,
        safetyScore: safetyScore,
        composition: this.generateCompositionFromAssetCount(basket.assetCount || 1),
        performance: basket.performance || generatePerformanceData(),
        investorCount: this.calculateInvestorCount(basket.totalInvested, basket.availableToInvest),
        created: basket.createdAt || new Date().toISOString(),
        status: basket.status === 'open' ? 'active' : basket.status || 'active',
        minimumInvestment: 1000,
        duration: 24,
        sectors: this.getSectorsFromBasketType(basket.basketType),
        basketType: basket.basketType,
        assetCount: basket.assetCount || 1,
        assetIds: basket.assetIds || [],
        isFull: basket.isFull || false,
        maxRiskThreshold: basket.maxRiskThreshold || 30,
        isMock: false, // Real backend basket
      };
    });
  }

  // Generate composition from actual assets
  generateCompositionFromAssets(assets) {
    if (!assets || assets.length === 0) {
      return generateComposition(); // Fallback to mock composition
    }
    
    const types = {};
    assets.forEach(asset => {
      const type = asset.assetType || 'invoice';
      types[type] = (types[type] || 0) + 1;
    });
    
    const total = assets.length;
    return Object.entries(types).map(([type, count]) => ({
      type,
      percentage: Math.round((count / total) * 100)
    }));
  }

  // Extract sectors from assets
  extractSectorsFromAssets(assets) {
    if (!assets || assets.length === 0) {
      return ['Invoice']; // Default sector
    }
    
    const sectors = [...new Set(assets.map(asset => 
      (asset.assetType || 'invoice').charAt(0).toUpperCase() + (asset.assetType || 'invoice').slice(1)
    ))];
    
    return sectors;
  }

  // Apply frontend filters
  applyFilters(baskets, filters) {
    return baskets.filter(basket => {
      // Search filter (if provided)
      if (filters.searchTerm && filters.searchTerm.length > 0) {
        const searchLower = filters.searchTerm.toLowerCase();
        const matchesSearch = 
          basket.name.toLowerCase().includes(searchLower) ||
          basket.description.toLowerCase().includes(searchLower) ||
          basket.sectors?.some(sector => sector.toLowerCase().includes(searchLower));
        
        if (!matchesSearch) return false;
      }
      
      // Safety level filter
      if (filters.safetyLevel && basket.safetyLevel !== filters.safetyLevel) return false;
      
      // APY range filter
      if (filters.minAPY && basket.apy < parseFloat(filters.minAPY)) return false;
      if (filters.maxAPY && basket.apy > parseFloat(filters.maxAPY)) return false;
      
      // Sector filter
      if (filters.sector && !basket.sectors?.includes(filters.sector)) return false;
      
      // Status filter - be flexible with active/open mapping
      if (filters.status) {
        const allowedStatuses = filters.status === 'active' ? ['active', 'open'] : [filters.status];
        if (!allowedStatuses.includes(basket.status)) return false;
      }
      
      return true;
    });
  }

  // Get basket details
  async getBasketDetails(id) {
    try {
      // Check if it's a mock basket
      if (id.startsWith('mock_basket_')) {
        const mockBasket = this.mockBaskets.find(b => b.id === id);
        if (!mockBasket) throw new Error('Mock basket not found');
        
        return {
          ...mockBasket,
          receivables: await this.getBasketReceivables(id),
          analytics: await this.getBasketAnalytics(id),
        };
      }
      
      // Try to fetch from backend
      const response = await apiService.request(`/api/baskets/${id}`);
      const basket = response.data;
      
      // Transform backend response
      return {
        id: basket.basketId,
        basketId: basket.basketId,
        name: basket.name,
        description: basket.description,
        totalValue: basket.metrics?.totalValue || basket.totalValue,
        apy: basket.expectedAPY,
        safetyLevel: this.getSafetyLevel(basket.averageRiskScore || basket.currentRiskScore),
        safetyScore: basket.averageRiskScore || basket.currentRiskScore,
        composition: this.generateCompositionFromAssets(basket.assets),
        performance: basket.performance,
        investorCount: basket.metrics?.investorCount || 0,
        created: basket.createdAt,
        status: basket.status,
        minimumInvestment: 1000,
        duration: 24,
        sectors: this.extractSectorsFromAssets(basket.assets),
        basketType: basket.basketType,
        availableToInvest: basket.metrics?.availableToInvest,
        assetCount: basket.metrics?.assetCount,
        assets: basket.assets || [],
        investments: basket.investments || [],
        receivables: basket.assets || [], // Backend uses 'assets' for what frontend calls 'receivables'
        analytics: {
          diversificationScore: faker.number.int({ min: 70, max: 95 }),
          liquidityScore: faker.number.int({ min: 60, max: 90 }),
          qualityScore: faker.number.int({ min: 75, max: 95 }),
          trends: {
            safetyTrend: faker.helpers.arrayElement(['improving', 'stable', 'declining']),
            yieldTrend: faker.helpers.arrayElement(['increasing', 'stable', 'decreasing']),
            demandTrend: faker.helpers.arrayElement(['high', 'moderate', 'low']),
          }
        },
      };
      
    } catch (error) {
      console.error('❌ Failed to fetch basket details from backend:', error);
      
      // Fallback to mock data
      const mockBasket = this.mockBaskets.find(b => b.id === id);
      if (!mockBasket) throw new Error('Basket not found');
      
      return {
        ...mockBasket,
        receivables: await this.getBasketReceivables(id),
        analytics: await this.getBasketAnalytics(id),
      };
    }
  }

  // Create new basket (backend integration)
  async createBasket(receivables, safetyTier) {
    await this.delay(1500);
    
    const totalValue = receivables.reduce((sum, r) => sum + (r.amount || r.monthlyRevenue || r.leaseRevenue), 0);
    const avgSafety = receivables.reduce((sum, r) => sum + r.safetyScore, 0) / receivables.length;
    
    const newBasket = {
      id: `basket_${Date.now()}`,
      basketId: `basket_${Date.now()}`,
      name: `Custom Basket ${this.mockBaskets.length + 1}`,
      description: 'Custom created basket',
      totalValue,
      apy: this.calculateAPYFromSafety(avgSafety),
      safetyLevel: this.getSafetyLevel(avgSafety),
      safetyScore: Math.round(avgSafety),
      composition: this.calculateComposition(receivables),
      performance: generatePerformanceData(),
      investorCount: 0,
      created: new Date().toISOString(),
      status: 'filling',
      minimumInvestment: 1000,
      duration: 24,
      receivables: receivables.map(r => r.id),
      basketType: this.getSafetyLevel(avgSafety).toLowerCase(),
      isMock: false,
    };
    
    this.mockBaskets.push(newBasket);
    return newBasket;
  }

  // Get featured baskets
  async getFeaturedBaskets() {
    await this.delay(600);
    
    // Try to get mix of backend and mock baskets
    const allBaskets = await this.listBaskets();
    
    return {
      risingStars: allBaskets
        .filter(b => b.apy > 12 && b.safetyLevel !== 'Low')
        .slice(0, 3),
      stableIncome: allBaskets
        .filter(b => b.safetyLevel === 'High')
        .slice(0, 3),
      highYield: allBaskets
        .filter(b => b.apy > 15)
        .slice(0, 3),
    };
  }

  // Get platform statistics
  async getPlatformStats() {
    try {
      // Try to get real stats from backend
      const allBaskets = await this.listBaskets();
      
      const totalAUM = allBaskets.reduce((sum, basket) => sum + (basket.totalValue || 0), 0);
      const avgAPY = allBaskets.length > 0 
        ? allBaskets.reduce((sum, basket) => sum + (basket.apy || 0), 0) / allBaskets.length 
        : 0;
      const activeInvestors = allBaskets.reduce((sum, basket) => sum + (basket.investorCount || 0), 0);
      const liveBaskets = allBaskets.filter(basket => basket.status === 'active').length;
      
      return {
        totalAUM: totalAUM || 2400000, // Fallback to hardcoded value
        avgAPY: Math.min(avgAPY || 7.2, 9), // Cap average APY at 9% and adjust default
        activeInvestors: activeInvestors || 847,
        liveBaskets: liveBaskets || 25,
      };
    } catch (error) {
      console.error('❌ Failed to get platform stats:', error);
      // Return hardcoded stats with capped APY
      return {
        totalAUM: 2400000,
        avgAPY: 7.2, // Reduced from 12.4% to realistic 7.2%
        activeInvestors: 847,
        liveBaskets: 25,
      };
    }
  }

  // Helper methods
  async getBasketReceivables(basketId) {
    // Mock receivables in basket
    return Array.from({ length: faker.number.int({ min: 3, max: 8 }) }, (_, i) => ({
      id: `recv_${basketId}_${i}`,
      type: faker.helpers.arrayElement(['invoice', 'saas', 'creator', 'rental', 'luxury']),
      amount: faker.number.int({ min: 5000, max: 50000 }),
      safetyScore: faker.number.int({ min: 60, max: 95 }),
      status: faker.helpers.arrayElement(['active', 'paid', 'overdue']),
      dueDate: faker.date.future({ days: 90 }).toISOString().split('T')[0],
    }));
  }

  async getBasketAnalytics(basketId) {
    return {
      diversificationScore: faker.number.int({ min: 70, max: 95 }),
      liquidityScore: faker.number.int({ min: 60, max: 90 }),
      qualityScore: faker.number.int({ min: 75, max: 95 }),
      trends: {
        safetyTrend: faker.helpers.arrayElement(['improving', 'stable', 'declining']),
        yieldTrend: faker.helpers.arrayElement(['increasing', 'stable', 'decreasing']),
        demandTrend: faker.helpers.arrayElement(['high', 'moderate', 'low']),
      }
    };
  }

  async getBasketPerformance(id, timeframe = '1M') {
    await this.delay(400);
    // Mock performance data
    return generatePerformanceData();
  }

  // NEW APY CALCULATION WITH 9% CAP
  calculateAPYFromSafety(safetyScore) {
    // New formula: Lower safety score = Higher risk = Higher APY
    // Platform keeps 1% as fees, investors get up to 99%
    // Maximum APY is capped at 9%
    
    const baseAPY = 6; // Minimum APY for highest safety (score 100)
    const maxAPY = 9; // Maximum APY cap
    
    // Convert safety score to risk percentage (inverse relationship)
    const riskFactor = (100 - safetyScore) / 100;
    
    // Calculate APY with linear interpolation between baseAPY and maxAPY
    // Safety score 100 → 6% APY
    // Safety score 0 → 9% APY
    const calculatedAPY = baseAPY + ((maxAPY - baseAPY) * riskFactor);
    
    // Platform keeps 1% fee, investors get 99% of returns
    const investorAPY = calculatedAPY * 0.99;
    
    // Ensure we don't exceed 9% even after platform fee calculation
    const finalAPY = Math.min(investorAPY, 9);
    
    return Math.round(finalAPY * 10) / 10;
  }

  getSafetyLevel(safetyScore) {
    if (safetyScore >= 80) return 'High';   // High safety (low risk)
    if (safetyScore >= 65) return 'Medium'; // Medium safety
    return 'Low';                           // Low safety (high risk)
  }

  calculateComposition(receivables) {
    const types = {};
    receivables.forEach(r => {
      types[r.type] = (types[r.type] || 0) + 1;
    });
    
    const total = receivables.length;
    return Object.entries(types).map(([type, count]) => ({
      type,
      percentage: Math.round((count / total) * 100)
    }));
  }

  // Calculate detailed returns breakdown for explanation
  calculateReturnsBreakdown(faceValue, safetyScore, collectionRate = 1.0) {
    const baseAPY = 6;
    const maxAPY = 9;
    const riskFactor = (100 - safetyScore) / 100;
    const grossAPY = baseAPY + ((maxAPY - baseAPY) * riskFactor);
    
    // Collection amount (usually face value, but could be less if partial collection)
    const collectedAmount = faceValue * collectionRate;
    
    // Platform fee (1% of collected amount)
    const platformFee = collectedAmount * 0.01;
    
    // Amount distributed to investors (99% of collected amount)
    const investorPayout = collectedAmount * 0.99;
    
    // Net APY for investors (capped at 9%)
    const investorAPY = Math.min(grossAPY * 0.99, 9);
    
    return {
      faceValue,
      collectedAmount,
      platformFee,
      investorPayout,
      grossAPY,
      investorAPY,
      safetyScore,
      riskFactor: riskFactor * 100,
    };
  }
                                                                                                                                                                                                                                                  
  // Calculate estimated investor count based on investment amounts
  calculateInvestorCount(totalInvested, availableToInvest) {
    if (!totalInvested || totalInvested === 0) return 0;
    
    // Assume average investment of $5000
    const avgInvestment = 5000;
    return Math.floor(totalInvested / avgInvestment);
  }

  // Generate composition based on asset count (simplified)
  generateCompositionFromAssetCount(assetCount) {
    // For now, generate mock composition based on count
    if (assetCount <= 1) {
      return [{ type: 'invoice', percentage: 100 }];
    } else if (assetCount <= 3) {
      return [
        { type: 'invoice', percentage: 60 },
        { type: 'saas', percentage: 40 }
      ];
    } else {
      return [
        { type: 'invoice', percentage: 40 },
        { type: 'saas', percentage: 35 },
        { type: 'creator', percentage: 25 }
      ];
    }
  }

  // Get sectors based on basket type
  getSectorsFromBasketType(basketType) {
    const sectorMap = {
      'low': ['Invoice', 'SaaS'], // Low risk typically more traditional
      'medium': ['Invoice', 'SaaS', 'Creator'],
      'high': ['Creator', 'Luxury', 'Rental'], // High risk more diverse
    };
    
    return sectorMap[basketType] || ['Invoice'];
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default new BasketService();