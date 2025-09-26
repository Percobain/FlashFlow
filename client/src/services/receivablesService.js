import { faker } from '@faker-js/faker';

// Set consistent seed for demo
faker.seed(123456);

// Mock data generators
const generateInvoice = (id) => ({
  id: `inv_${id}`,
  type: 'invoice',
  seller: faker.company.name(),
  buyer: faker.company.name(),
  amount: faker.number.int({ min: 10000, max: 100000 }),
  dueDate: faker.date.future({ days: 90 }).toISOString().split('T')[0],
  riskScore: faker.number.int({ min: 60, max: 95 }),
  status: faker.helpers.arrayElement(['pending', 'approved', 'funded', 'paid']),
  description: faker.commerce.productDescription(),
  created: faker.date.past({ days: 30 }).toISOString(),
});

const generateSaaS = (id) => ({
  id: `saas_${id}`,
  type: 'saas',
  company: faker.company.name(),
  mrr: faker.number.int({ min: 5000, max: 50000 }),
  growth: faker.number.float({ min: -5, max: 25, fractionDigits: 1 }),
  churn: faker.number.float({ min: 1, max: 8, fractionDigits: 1 }),
  projection: null, // Will be calculated
  riskScore: faker.number.int({ min: 70, max: 95 }),
  status: faker.helpers.arrayElement(['pending', 'approved', 'funded']),
  created: faker.date.past({ days: 30 }).toISOString(),
});

const generateCreator = (id) => ({
  id: `creator_${id}`,
  type: 'creator',
  platform: faker.helpers.arrayElement(['YouTube', 'Twitch', 'TikTok', 'Spotify']),
  channel: faker.internet.username(),
  monthlyRevenue: faker.number.int({ min: 2000, max: 20000 }),
  subscribers: faker.number.int({ min: 10000, max: 500000 }),
  engagementRate: faker.number.float({ min: 2, max: 8, fractionDigits: 1 }),
  riskScore: faker.number.int({ min: 65, max: 90 }),
  status: faker.helpers.arrayElement(['pending', 'approved', 'funded']),
  created: faker.date.past({ days: 30 }).toISOString(),
});

const generateRental = (id) => ({
  id: `rental_${id}`,
  type: 'rental',
  property: `${faker.location.streetAddress()}, ${faker.location.city()}`,
  monthlyIncome: faker.number.int({ min: 15000, max: 60000 }),
  occupancy: faker.number.int({ min: 80, max: 100 }),
  location: faker.location.city(),
  riskScore: faker.number.int({ min: 75, max: 95 }),
  status: faker.helpers.arrayElement(['pending', 'approved', 'funded']),
  created: faker.date.past({ days: 30 }).toISOString(),
});

const generateLuxury = (id) => ({
  id: `luxury_${id}`,
  type: 'luxury',
  asset: faker.helpers.arrayElement([
    'Ferrari 488 Spider',
    'Rolex Submariner',
    'Yacht Princess Y85',
    'Lamborghini Aventador',
    'Patek Philippe Nautilus'
  ]),
  leaseRevenue: faker.number.int({ min: 8000, max: 25000 }),
  leaseTerm: faker.number.int({ min: 12, max: 48 }),
  residualValue: faker.number.int({ min: 100000, max: 500000 }),
  riskScore: faker.number.int({ min: 70, max: 88 }),
  status: faker.helpers.arrayElement(['pending', 'approved', 'funded']),
  created: faker.date.past({ days: 30 }).toISOString(),
});

// Generate mock data sets
const mockInvoices = Array.from({ length: 12 }, (_, i) => generateInvoice(i + 1));
const mockSaaS = Array.from({ length: 8 }, (_, i) => generateSaaS(i + 1));
const mockCreators = Array.from({ length: 10 }, (_, i) => generateCreator(i + 1));
const mockRentals = Array.from({ length: 6 }, (_, i) => generateRental(i + 1));
const mockLuxury = Array.from({ length: 5 }, (_, i) => generateLuxury(i + 1));

// Calculate projections for SaaS
mockSaaS.forEach(saas => {
  saas.projection = Math.round(saas.mrr * (1 + saas.growth / 100));
});

class ReceivablesService {
  constructor() {
    this.receivables = [
      ...mockInvoices,
      ...mockSaaS,
      ...mockCreators,
      ...mockRentals,
      ...mockLuxury
    ];
    this.tempReceivables = new Map(); // Store temporary receivables for tokenization flow
  }

  // Connect to data source (mock)
  async connectDataSource(type, credentials) {
    await this.delay(1500); // Simulate API call
    return {
      id: `conn_${Date.now()}`,
      type,
      status: 'connected',
      lastSync: new Date().toISOString(),
    };
  }

  // Fetch receivables by type
  async fetchReceivables(type = null) {
    await this.delay(800);
    if (type) {
      return this.receivables.filter(r => r.type === type);
    }
    return this.receivables;
  }

  // Get specific receivable
  async getReceivable(id) {
    await this.delay(300);
    // Check both permanent and temporary receivables
    const permanent = this.receivables.find(r => r.id === id);
    if (permanent) return permanent;
    
    const temp = this.tempReceivables.get(id);
    return temp || null;
  }

  // Analyze receivable with AI
  async analyzeReceivable(id) {
    await this.delay(2000); // Simulate AI processing
    
    // Create a temporary receivable for the tokenization flow
    const tempReceivable = {
      id: id || `temp_${Date.now()}`,
      type: 'mock', // Will be set based on current flow
      amount: faker.number.int({ min: 25000, max: 100000 }),
      riskScore: faker.number.int({ min: 65, max: 90 }),
      status: 'analyzed',
      created: new Date().toISOString(),
    };
    
    // Store temporary receivable
    this.tempReceivables.set(tempReceivable.id, tempReceivable);

    const factors = this.generateRiskFactors(tempReceivable);
    const unlockAmount = this.calculateUnlockAmount(tempReceivable);

    return {
      receivableId: tempReceivable.id,
      riskScore: tempReceivable.riskScore,
      confidence: faker.number.int({ min: 85, max: 98 }),
      factors,
      unlockAmount,
      apy: this.calculateAPY(tempReceivable.riskScore),
      projection: this.generateProjection(tempReceivable),
    };
  }

  // Tokenize receivable
  async tokenizeReceivable(id, amount) {
    await this.delay(1000);
    
    // Look for receivable in both permanent and temporary stores
    let receivable = this.receivables.find(r => r.id === id);
    if (!receivable) {
      receivable = this.tempReceivables.get(id);
    }
    
    // If still not found, create a mock receivable for the demo
    if (!receivable) {
      receivable = {
        id: id,
        type: 'mock',
        amount: amount,
        riskScore: faker.number.int({ min: 65, max: 90 }),
        status: 'pending',
        created: new Date().toISOString(),
      };
      // Store it temporarily
      this.tempReceivables.set(id, receivable);
    }

    receivable.status = 'funded';
    receivable.tokenizedAmount = amount;
    receivable.tokenId = `token_${Date.now()}`;

    return {
      tokenId: receivable.tokenId,
      amount,
      txHash: `0x${faker.string.hexadecimal({ length: 64 })}`,
      basketId: `basket_${faker.number.int({ min: 1, max: 50 })}`,
    };
  }

  // Helper methods
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  generateRiskFactors(receivable) {
    const baseFactors = [
      'Payment history analysis',
      'Industry risk assessment',
      'Market conditions',
      'Counterparty credit score'
    ];

    const typeSpecificFactors = {
      invoice: ['Buyer creditworthiness', 'Invoice age', 'Payment terms'],
      saas: ['Churn rate trend', 'Revenue growth', 'Customer concentration'],
      creator: ['Platform dependency', 'Engagement stability', 'Content category'],
      rental: ['Location desirability', 'Tenant quality', 'Property condition'],
      luxury: ['Asset depreciation', 'Market liquidity', 'Maintenance costs'],
      mock: ['General risk factors', 'Market analysis', 'Credit assessment']
    };

    return [
      ...baseFactors,
      ...(typeSpecificFactors[receivable.type] || typeSpecificFactors.mock)
    ];
  }

  calculateUnlockAmount(receivable) {
    const baseAmount = receivable.amount || receivable.monthlyRevenue || receivable.leaseRevenue || 50000;
    const riskMultiplier = receivable.riskScore / 100;
    return Math.round(baseAmount * riskMultiplier * 0.85); // 85% max unlock
  }

  calculateAPY(riskScore) {
    // Higher risk = higher APY for investors
    const baseAPY = 8;
    const riskPremium = (100 - riskScore) * 0.3;
    return Math.round((baseAPY + riskPremium) * 10) / 10;
  }

  generateProjection(receivable) {
    const months = Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() + i + 1);
      return date.toISOString().split('T')[0];
    });

    return months.map(month => ({
      month,
      projected: faker.number.int({ min: 80, max: 120 }) / 100,
      confidence: faker.number.int({ min: 75, max: 95 })
    }));
  }
}

export default new ReceivablesService();