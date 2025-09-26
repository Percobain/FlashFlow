import { faker } from '@faker-js/faker';

faker.seed(123456);

// Generate mock basket data
const generateBasket = (id) => {
  const riskLevels = ['Low', 'Medium', 'High'];
  const sectors = ['Invoice', 'SaaS', 'Creator', 'Rental', 'Luxury'];
  const riskLevel = faker.helpers.arrayElement(riskLevels);
  
  return {
    id: `basket_${id}`,
    name: faker.helpers.arrayElement([
      'Stable Income Plus',
      'Growth Accelerator',
      'Premium Yield',
      'Diversified Cash Flow',
      'Rising Stars',
      'Conservative Income',
      'High Velocity'
    ]),
    description: faker.company.catchPhrase(),
    totalValue: faker.number.int({ min: 100000, max: 2000000 }),
    apy: faker.number.float({ min: 6, max: 18, fractionDigits: 1 }),
    riskLevel,
    riskScore: riskLevel === 'Low' ? faker.number.int({ min: 80, max: 95 }) : 
               riskLevel === 'Medium' ? faker.number.int({ min: 65, max: 80 }) :
               faker.number.int({ min: 45, max: 65 }),
    composition: generateComposition(),
    performance: generatePerformanceData(),
    investorCount: faker.number.int({ min: 15, max: 250 }),
    created: faker.date.past({ days: 120 }).toISOString(),
    status: faker.helpers.arrayElement(['active', 'closed', 'filling']),
    minimumInvestment: faker.helpers.arrayElement([1000, 5000, 10000, 25000]),
    duration: faker.number.int({ min: 6, max: 36 }), // months
    sectors: faker.helpers.arrayElements(sectors, { min: 1, max: 3 }),
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

// Generate mock baskets
const mockBaskets = Array.from({ length: 25 }, (_, i) => generateBasket(i + 1));

class BasketService {
  constructor() {
    this.baskets = mockBaskets;
  }

  // Create new basket
  async createBasket(receivables, riskTier) {
    await this.delay(1500);
    
    const totalValue = receivables.reduce((sum, r) => sum + (r.amount || r.monthlyRevenue || r.leaseRevenue), 0);
    const avgRisk = receivables.reduce((sum, r) => sum + r.riskScore, 0) / receivables.length;
    
    const newBasket = {
      id: `basket_${Date.now()}`,
      name: `Custom Basket ${this.baskets.length + 1}`,
      description: 'Custom created basket',
      totalValue,
      apy: this.calculateAPYFromRisk(avgRisk),
      riskLevel: this.getRiskLevel(avgRisk),
      riskScore: Math.round(avgRisk),
      composition: this.calculateComposition(receivables),
      performance: generatePerformanceData(),
      investorCount: 0,
      created: new Date().toISOString(),
      status: 'filling',
      minimumInvestment: 1000,
      duration: 24,
      receivables: receivables.map(r => r.id),
    };
    
    this.baskets.push(newBasket);
    return newBasket;
  }

  // List baskets with filters
  async listBaskets(filters = {}) {
    await this.delay(500);
    
    let filtered = [...this.baskets];
    
    if (filters.riskLevel) {
      filtered = filtered.filter(b => b.riskLevel === filters.riskLevel);
    }
    
    if (filters.minAPY) {
      filtered = filtered.filter(b => b.apy >= filters.minAPY);
    }
    
    if (filters.maxAPY) {
      filtered = filtered.filter(b => b.apy <= filters.maxAPY);
    }
    
    if (filters.sector) {
      filtered = filtered.filter(b => b.sectors?.includes(filters.sector));
    }
    
    if (filters.status) {
      filtered = filtered.filter(b => b.status === filters.status);
    }
    
    return filtered;
  }

  // Get basket details
  async getBasketDetails(id) {
    await this.delay(300);
    const basket = this.baskets.find(b => b.id === id);
    if (!basket) throw new Error('Basket not found');
    
    return {
      ...basket,
      receivables: await this.getBasketReceivables(id),
      analytics: await this.getBasketAnalytics(id),
    };
  }

  // Invest in basket
  async investInBasket(basketId, amount) {
    await this.delay(1200);
    const basket = this.baskets.find(b => b.id === basketId);
    if (!basket) throw new Error('Basket not found');
    
    if (amount < basket.minimumInvestment) {
      throw new Error(`Minimum investment is $${basket.minimumInvestment}`);
    }
    
    const investment = {
      id: `inv_${Date.now()}`,
      basketId,
      amount,
      shares: amount / 100, // Mock share calculation
      timestamp: new Date().toISOString(),
      txHash: `0x${faker.string.hexadecimal({ length: 64 })}`,
      status: 'confirmed',
    };
    
    basket.investorCount += 1;
    basket.totalValue += amount;
    
    return investment;
  }

  // Get basket performance
  async getBasketPerformance(id, timeframe = '1M') {
    await this.delay(400);
    const basket = this.baskets.find(b => b.id === id);
    if (!basket) throw new Error('Basket not found');
    
    return {
      current: basket.performance[basket.performance.length - 1],
      history: basket.performance,
      metrics: {
        totalReturn: faker.number.float({ min: -5, max: 25, fractionDigits: 2 }),
        volatility: faker.number.float({ min: 2, max: 15, fractionDigits: 2 }),
        sharpeRatio: faker.number.float({ min: 0.5, max: 2.5, fractionDigits: 2 }),
        maxDrawdown: faker.number.float({ min: -15, max: -2, fractionDigits: 2 }),
      }
    };
  }

  // Get featured baskets
  async getFeaturedBaskets() {
    await this.delay(600);
    
    return {
      risingStars: this.baskets
        .filter(b => b.apy > 12 && b.riskLevel !== 'High')
        .slice(0, 3),
      stableIncome: this.baskets
        .filter(b => b.riskLevel === 'Low')
        .slice(0, 3),
      highYield: this.baskets
        .filter(b => b.apy > 15)
        .slice(0, 3),
    };
  }

  // Helper methods
  async getBasketReceivables(basketId) {
    // Mock receivables in basket
    return Array.from({ length: faker.number.int({ min: 3, max: 8 }) }, (_, i) => ({
      id: `recv_${basketId}_${i}`,
      type: faker.helpers.arrayElement(['invoice', 'saas', 'creator', 'rental', 'luxury']),
      amount: faker.number.int({ min: 5000, max: 50000 }),
      riskScore: faker.number.int({ min: 60, max: 95 }),
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
        riskTrend: faker.helpers.arrayElement(['improving', 'stable', 'declining']),
        yieldTrend: faker.helpers.arrayElement(['increasing', 'stable', 'decreasing']),
        demandTrend: faker.helpers.arrayElement(['high', 'moderate', 'low']),
      }
    };
  }

  calculateAPYFromRisk(riskScore) {
    const baseAPY = 8;
    const riskPremium = (100 - riskScore) * 0.3;
    return Math.round((baseAPY + riskPremium) * 10) / 10;
  }

  getRiskLevel(riskScore) {
    if (riskScore >= 80) return 'Low';
    if (riskScore >= 65) return 'Medium';
    return 'High';
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

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default new BasketService();
