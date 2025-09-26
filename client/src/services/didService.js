import { faker } from '@faker-js/faker';

faker.seed(123456);

class DIDService {
  constructor() {
    this.mockDIDData = this.generateMockDIDData();
  }

  // Connect to Self.xyz (mock)
  async connectSelfXYZ() {
    await this.delay(2000); // Simulate OAuth flow
    
    return {
      id: `did_${Date.now()}`,
      address: '0x1234567890123456789012345678901234567890',
      status: 'connected',
      verificationLevel: faker.helpers.arrayElement(['basic', 'enhanced', 'premium']),
      connectedAt: new Date().toISOString(),
      permissions: ['identity', 'credit', 'financial'],
    };
  }

  // Get reputation score
  async getReputation(address) {
    await this.delay(500);
    
    const userData = this.mockDIDData[address] || this.generateUserReputation();
    
    return {
      address,
      universalScore: userData.universalScore,
      breakdown: userData.breakdown,
      history: userData.history,
      verifications: userData.verifications,
      lastUpdated: new Date().toISOString(),
    };
  }

  // Record default event
  async recordDefault(address, amount) {
    await this.delay(800);
    
    const impact = this.calculateDefaultImpact(amount);
    
    return {
      defaultId: `default_${Date.now()}`,
      address,
      amount,
      timestamp: new Date().toISOString(),
      impact: impact,
      recoveryPath: this.generateRecoveryPath(impact),
    };
  }

  // Verify KYC status
  async verifyKYC(address) {
    await this.delay(1500);
    
    // Always return verified for demo
    return {
      address,
      status: 'verified',
      level: faker.helpers.arrayElement(['basic', 'enhanced', 'premium']),
      verifiedAt: faker.date.past({ days: 30 }).toISOString(),
      documents: [
        { type: 'identity', status: 'verified' },
        { type: 'address', status: 'verified' },
        { type: 'income', status: 'verified' },
      ],
      riskFlags: [],
    };
  }

  // Get universal credit score
  async getUniversalScore(address) {
    await this.delay(400);
    
    const userData = this.mockDIDData[address] || this.generateUserReputation();
    
    return {
      score: userData.universalScore,
      category: this.getScoreCategory(userData.universalScore),
      factors: userData.breakdown,
      trend: faker.helpers.arrayElement(['improving', 'stable', 'declining']),
      lastUpdated: new Date().toISOString(),
    };
  }

  // Get cross-platform reputation
  async getCrossPlatformReputation(address) {
    await this.delay(600);
    
    return {
      platforms: [
        {
          name: 'DeFi Protocols',
          score: faker.number.int({ min: 700, max: 850 }),
          activity: faker.number.int({ min: 50, max: 500 }),
          status: 'active',
        },
        {
          name: 'Traditional Credit',
          score: faker.number.int({ min: 650, max: 800 }),
          activity: faker.number.int({ min: 20, max: 100 }),
          status: 'verified',
        },
        {
          name: 'P2P Lending',
          score: faker.number.int({ min: 600, max: 750 }),
          activity: faker.number.int({ min: 10, max: 80 }),
          status: 'active',
        },
        {
          name: 'Business Credit',
          score: faker.number.int({ min: 550, max: 720 }),
          activity: faker.number.int({ min: 5, max: 40 }),
          status: 'pending',
        },
      ],
      aggregated: faker.number.int({ min: 680, max: 820 }),
      weightedScore: faker.number.int({ min: 700, max: 830 }),
    };
  }

  // Simulate reputation recovery
  async simulateRecovery(address, actions) {
    await this.delay(1200);
    
    const currentScore = (this.mockDIDData[address] || this.generateUserReputation()).universalScore;
    
    return {
      currentScore,
      projectedScore: Math.min(850, currentScore + faker.number.int({ min: 20, max: 80 })),
      timeframe: faker.number.int({ min: 3, max: 12 }), // months
      requiredActions: actions,
      probability: faker.number.float({ min: 0.6, max: 0.9, fractionDigits: 2 }),
    };
  }

  // Helper methods
  generateMockDIDData() {
    const data = {};
    const addresses = [
      '0x1234567890123456789012345678901234567890',
      '0x0987654321098765432109876543210987654321',
      '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
    ];
    
    addresses.forEach(address => {
      data[address] = this.generateUserReputation();
    });
    
    return data;
  }

  generateUserReputation() {
    const score = faker.number.int({ min: 650, max: 850 });
    
    return {
      universalScore: score,
      breakdown: {
        paymentHistory: faker.number.int({ min: 70, max: 95 }),
        creditUtilization: faker.number.int({ min: 60, max: 90 }),
        accountAge: faker.number.int({ min: 75, max: 95 }),
        accountMix: faker.number.int({ min: 65, max: 85 }),
        newCredit: faker.number.int({ min: 70, max: 90 }),
      },
      history: this.generateScoreHistory(),
      verifications: this.generateVerifications(),
    };
  }

  generateScoreHistory() {
    const history = [];
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 12);
    
    let currentScore = faker.number.int({ min: 650, max: 750 });
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(startDate);
      date.setMonth(date.getMonth() + i);
      
      // Random walk for score changes
      const change = faker.number.int({ min: -20, max: 30 });
      currentScore = Math.max(300, Math.min(850, currentScore + change));
      
      history.push({
        date: date.toISOString().split('T')[0],
        score: currentScore,
        change: i === 0 ? 0 : change,
        reason: faker.helpers.arrayElement([
          'Payment received',
          'Credit inquiry',
          'Account opened',
          'Balance update',
          'Score review'
        ]),
      });
    }
    
    return history;
  }

  generateVerifications() {
    return [
      {
        type: 'identity',
        status: 'verified',
        provider: 'Self.xyz',
        verifiedAt: faker.date.past({ days: 60 }).toISOString(),
        score: faker.number.int({ min: 85, max: 98 }),
      },
      {
        type: 'financial',
        status: 'verified',
        provider: 'Plaid',
        verifiedAt: faker.date.past({ days: 30 }).toISOString(),
        score: faker.number.int({ min: 80, max: 95 }),
      },
      {
        type: 'social',
        status: faker.helpers.arrayElement(['verified', 'pending']),
        provider: 'Twitter',
        verifiedAt: faker.date.past({ days: 90 }).toISOString(),
        score: faker.number.int({ min: 70, max: 90 }),
      },
      {
        type: 'professional',
        status: 'verified',
        provider: 'LinkedIn',
        verifiedAt: faker.date.past({ days: 45 }).toISOString(),
        score: faker.number.int({ min: 75, max: 92 }),
      },
    ];
  }

  calculateDefaultImpact(amount) {
    const severity = amount > 50000 ? 'severe' : amount > 20000 ? 'moderate' : 'minor';
    const scoreImpact = severity === 'severe' ? -80 : severity === 'moderate' ? -50 : -20;
    
    return {
      severity,
      scoreImpact,
      recoveryTime: severity === 'severe' ? 12 : severity === 'moderate' ? 6 : 3, // months
    };
  }

  generateRecoveryPath(impact) {
    const actions = [
      'Complete additional verification',
      'Provide income documentation',
      'Establish payment plan',
      'Complete financial counseling',
      'Maintain good standing for 90 days',
    ];
    
    return {
      steps: faker.helpers.arrayElements(actions, { min: 2, max: 4 }),
      timeframe: impact.recoveryTime,
      milestones: [
        { step: 'Initial assessment', timeframe: '1 week' },
        { step: 'Documentation review', timeframe: '2 weeks' },
        { step: 'Plan implementation', timeframe: '1 month' },
        { step: 'Progress review', timeframe: `${impact.recoveryTime} months` },
      ],
    };
  }

  getScoreCategory(score) {
    if (score >= 800) return 'Excellent';
    if (score >= 740) return 'Very Good';
    if (score >= 670) return 'Good';
    if (score >= 580) return 'Fair';
    return 'Poor';
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default new DIDService();


