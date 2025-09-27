import { faker } from '@faker-js/faker';
import apiService from './apiService';

faker.seed(123456);

class BasketService {
  constructor() {
    this.cache = new Map();
    this.cacheTime = 30000; // 30 seconds cache
  }

  // === MAIN API - REAL DATA FIRST ===
  async getAllBaskets() {
    try {
      // 1. Get real baskets from backend
      const realBaskets = await apiService.getBaskets();
      
      // 2. Enhance real baskets with live indicators
      const enhancedRealBaskets = realBaskets.map(basket => ({
        ...basket,
        isLive: true,
        isMock: false,
        status: 'active'
      }));

      // 3. Generate mock baskets for additional content
      const mockBaskets = this.generateMockBaskets(8); // Generate 8 mock baskets

      // 4. Combine: Real first, then mock
      const allBaskets = [...enhancedRealBaskets, ...mockBaskets];

      return {
        baskets: allBaskets,
        realCount: enhancedRealBaskets.length,
        mockCount: mockBaskets.length,
        total: allBaskets.length
      };
    } catch (error) {
      console.error('Error fetching baskets:', error);
      // Fallback to mock data only
      return {
        baskets: this.generateMockBaskets(12),
        realCount: 0,
        mockCount: 12,
        total: 12
      };
    }
  }

  async getBasketDetails(basketId) {
    try {
      // Check if it's a real basket or mock
      if (basketId.startsWith('mock_')) {
        return this.generateBasketDetails(basketId);
      }

      // Get real basket details from backend
      const realBasket = await apiService.getBasketDetails(basketId);
      return {
        ...realBasket,
        isLive: true,
        isMock: false
      };
    } catch (error) {
      console.error('Error fetching basket details:', error);
      return this.generateBasketDetails(basketId);
    }
  }

  async investInBasket(basketId, amount, investorAddress) {
    try {
      if (basketId.startsWith('mock_')) {
        // Simulate mock investment
        return {
          success: true,
          txData: {
            to: '0x0000000000000000000000000000000000000000',
            data: '0x',
            value: '0x0'
          },
          isMock: true
        };
      }

      // Real investment through backend
      const response = await apiService.investInBasket(basketId, {
        amount,
        investorAddress
      });

      return {
        ...response,
        isLive: true,
        isMock: false
      };
    } catch (error) {
      console.error('Investment error:', error);
      throw error;
    }
  }

  // === MOCK DATA GENERATION ===
  generateMockBaskets(count = 8) {
    return Array.from({ length: count }, (_, i) => this.generateBasket(i + 1));
  }

  generateBasket(id) {
    const riskLevels = ['low-risk', 'medium-low-risk', 'medium-risk', 'medium-high-risk', 'high-risk'];
    const riskLevel = faker.helpers.arrayElement(riskLevels);
    
    // Map risk level to safety level for UI
    const safetyLevel = this.riskToSafetyLevel(riskLevel);
    const safetyScore = this.generateSafetyScore(riskLevel);
    
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
      riskRange: this.getRiskRange(riskLevel),
      targetAPY: this.getTargetAPY(riskLevel),
      totalValue: faker.number.int({ min: 100000, max: 2000000 }),
      totalInvested: faker.number.int({ min: 50000, max: 1500000 }),
      assetCount: faker.number.int({ min: 5, max: 25 }),
      safetyLevel,
      safetyScore,
      composition: this.generateComposition(),
      performance: this.generatePerformanceData(),
      investorCount: faker.number.int({ min: 15, max: 250 }),
      created: faker.date.past({ days: 120 }).toISOString(),
      status: 'active',
      minimumInvestment: faker.helpers.arrayElement([1000, 5000, 10000, 25000]),
      duration: faker.number.int({ min: 6, max: 36 }),
      basketType: riskLevel,
      isLive: false,
      isMock: true,
      assets: this.generateBasketAssets(faker.number.int({ min: 3, max: 8 }))
    };
  }

  riskToSafetyLevel(riskLevel) {
    const mapping = {
      'low-risk': 'High',
      'medium-low-risk': 'Medium-High',
      'medium-risk': 'Medium',
      'medium-high-risk': 'Low-Medium',
      'high-risk': 'Low'
    };
    return mapping[riskLevel] || 'Medium';
  }

  generateSafetyScore(riskLevel) {
    const scoreRanges = {
      'low-risk': { min: 80, max: 95 },
      'medium-low-risk': { min: 70, max: 85 },
      'medium-risk': { min: 55, max: 75 },
      'medium-high-risk': { min: 40, max: 60 },
      'high-risk': { min: 25, max: 45 }
    };
    const range = scoreRanges[riskLevel] || { min: 50, max: 70 };
    return faker.number.int(range);
  }

  getRiskRange(riskLevel) {
    const ranges = {
      'low-risk': [80, 100],
      'medium-low-risk': [60, 79],
      'medium-risk': [40, 59],
      'medium-high-risk': [20, 39],
      'high-risk': [0, 19]
    };
    return ranges[riskLevel] || [40, 59];
  }

  getTargetAPY(riskLevel) {
    const apyRanges = {
      'low-risk': { min: 6, max: 9 },
      'medium-low-risk': { min: 9, max: 12 },
      'medium-risk': { min: 12, max: 16 },
      'medium-high-risk': { min: 16, max: 20 },
      'high-risk': { min: 20, max: 30 }
    };
    const range = apyRanges[riskLevel] || { min: 10, max: 15 };
    return faker.number.float({ min: range.min, max: range.max, fractionDigits: 1 });
  }

  generateComposition() {
    const types = ['Invoice', 'SaaS', 'Creator', 'Rental', 'Luxury'];
    const composition = {};
    let total = 0;
    
    types.forEach((type, index) => {
      if (index === types.length - 1) {
        composition[type] = 100 - total;
      } else {
        const percentage = faker.number.int({ min: 5, max: 30 });
        composition[type] = percentage;
        total += percentage;
      }
    });
    
    return composition;
  }

  generatePerformanceData() {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map(month => ({
      month,
      value: faker.number.float({ min: -2, max: 8, fractionDigits: 1 })
    }));
  }

  generateBasketAssets(count) {
    return Array.from({ length: count }, (_, i) => ({
      assetId: `mock_asset_${faker.string.alphanumeric(8)}`,
      originator: `0x${faker.string.hexadecimal({ length: 40, prefix: '' })}`,
      amount: faker.number.int({ min: 10000, max: 100000 }),
      assetType: faker.helpers.arrayElement(['invoice', 'saas', 'creator', 'rental', 'luxury']),
      riskScore: faker.number.int({ min: 20, max: 90 }),
      status: faker.helpers.arrayElement(['funded', 'pending', 'repaid']),
      createdAt: faker.date.past({ days: 60 }).toISOString()
    }));
  }

  generateBasketDetails(basketId) {
    if (basketId.startsWith('mock_')) {
      const basket = this.generateBasket(parseInt(basketId.split('_')[2]) || 1);
      return {
        ...basket,
        assets: this.generateBasketAssets(faker.number.int({ min: 5, max: 15 })),
        analytics: {
          totalReturn: faker.number.float({ min: 5, max: 25, fractionDigits: 2 }),
          monthlyReturn: faker.number.float({ min: 0.5, max: 2.1, fractionDigits: 2 }),
          sharpeRatio: faker.number.float({ min: 0.8, max: 2.5, fractionDigits: 2 }),
          volatility: faker.number.float({ min: 2, max: 15, fractionDigits: 2 })
        }
      };
    }
    return null;
  }

  // === FEATURED BASKETS ===
  async getFeaturedBaskets() {
    try {
      const allBaskets = await this.getAllBaskets();
      
      // Get top performing real baskets first
      const realBaskets = allBaskets.baskets.filter(b => b.isLive);
      const mockBaskets = allBaskets.baskets.filter(b => b.isMock);
      
      // Sort by APY and take best ones
      const topReal = realBaskets.sort((a, b) => b.targetAPY - a.targetAPY).slice(0, 2);
      const topMock = mockBaskets.sort((a, b) => b.targetAPY - a.targetAPY).slice(0, 2);
      
      return [...topReal, ...topMock];
    } catch (error) {
      console.error('Error fetching featured baskets:', error);
      return this.generateMockBaskets(4);
    }
  }

  // === PLATFORM STATS ===
  async getPlatformStats() {
    try {
      const poolStats = await apiService.getPoolStats();
      const allBaskets = await this.getAllBaskets();
      
      const totalValue = allBaskets.baskets.reduce((sum, basket) => sum + (basket.totalValue || 0), 0);
      const avgAPY = allBaskets.baskets.reduce((sum, basket) => sum + (basket.targetAPY || 0), 0) / allBaskets.baskets.length;
      
      return {
        totalAUM: totalValue,
        poolBalance: parseFloat(poolStats.poolBalance || '0'),
        avgAPY: avgAPY.toFixed(1),
        activeInvestors: allBaskets.baskets.reduce((sum, basket) => sum + (basket.investorCount || 0), 0),
        liveBaskets: allBaskets.realCount,
        totalBaskets: allBaskets.total
      };
    } catch (error) {
      console.error('Error fetching platform stats:', error);
      return {
        totalAUM: 2400000,
        poolBalance: 100000000,
        avgAPY: 12.4,
        activeInvestors: 847,
        liveBaskets: 0,
        totalBaskets: 12
      };
    }
  }
}

export default new BasketService();