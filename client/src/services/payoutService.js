import { faker } from '@faker-js/faker';

faker.seed(123456);

class PayoutService {
  constructor() {
    this.payouts = this.generateMockPayouts();
    this.schedules = this.generateMockSchedules();
  }

  // Schedule payout for receivable
  async schedulePayout(receivableId) {
    await this.delay(600);
    
    const schedule = {
      id: `schedule_${Date.now()}`,
      receivableId,
      amount: faker.number.int({ min: 5000, max: 50000 }),
      currency: 'USD',
      frequency: faker.helpers.arrayElement(['monthly', 'quarterly', 'maturity']),
      nextPayout: faker.date.future({ days: 30 }).toISOString().split('T')[0],
      endDate: faker.date.future({ days: 365 }).toISOString().split('T')[0],
      status: 'active',
      created: new Date().toISOString(),
    };
    
    this.schedules.push(schedule);
    return schedule;
  }

  // Process individual payout
  async processPayout(payoutId) {
    await this.delay(1500);
    
    const payout = {
      id: payoutId,
      amount: faker.number.int({ min: 1000, max: 25000 }),
      currency: 'USD',
      recipients: faker.number.int({ min: 5, max: 50 }),
      status: 'processing',
      txHash: `0x${faker.string.hexadecimal({ length: 64 })}`,
      gasUsed: faker.number.int({ min: 21000, max: 150000 }),
      timestamp: new Date().toISOString(),
    };
    
    // Simulate processing delay
    setTimeout(() => {
      payout.status = 'completed';
      this.payouts.push(payout);
    }, 2000);
    
    return payout;
  }

  // Distribute to basket investors
  async distributeToInvestors(basketId, amount) {
    await this.delay(1200);
    
    const investorCount = faker.number.int({ min: 10, max: 100 });
    const distributions = [];
    
    for (let i = 0; i < investorCount; i++) {
      const share = faker.number.float({ min: 0.1, max: 5, fractionDigits: 2 });
      distributions.push({
        investor: `0x${faker.string.hexadecimal({ length: 40 })}`,
        amount: Math.round(amount * (share / 100)),
        percentage: share,
        txHash: `0x${faker.string.hexadecimal({ length: 64 })}`,
      });
    }
    
    return {
      distributionId: `dist_${Date.now()}`,
      basketId,
      totalAmount: amount,
      distributions,
      status: 'completed',
      timestamp: new Date().toISOString(),
    };
  }

  // Get payout history for user
  async getPayoutHistory(userId, filters = {}) {
    await this.delay(400);
    
    let history = [...this.payouts];
    
    if (filters.startDate) {
      history = history.filter(p => p.timestamp >= filters.startDate);
    }
    
    if (filters.endDate) {
      history = history.filter(p => p.timestamp <= filters.endDate);
    }
    
    if (filters.status) {
      history = history.filter(p => p.status === filters.status);
    }
    
    return {
      payouts: history.slice(0, filters.limit || 50),
      total: history.length,
      summary: {
        totalReceived: history.reduce((sum, p) => sum + p.amount, 0),
        averageAmount: history.length > 0 ? history.reduce((sum, p) => sum + p.amount, 0) / history.length : 0,
        lastPayout: history.length > 0 ? history[0].timestamp : null,
      }
    };
  }

  // Get upcoming payouts
  async getUpcomingPayouts(userId) {
    await this.delay(300);
    
    const upcoming = Array.from({ length: faker.number.int({ min: 3, max: 8 }) }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() + faker.number.int({ min: 1, max: 60 }));
      
      return {
        id: `upcoming_${i}`,
        basketId: `basket_${faker.number.int({ min: 1, max: 25 })}`,
        estimatedAmount: faker.number.int({ min: 500, max: 5000 }),
        dueDate: date.toISOString().split('T')[0],
        confidence: faker.number.int({ min: 85, max: 98 }),
        type: faker.helpers.arrayElement(['regular', 'maturity', 'early']),
      };
    });
    
    return upcoming.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  }

  // Get payout analytics
  async getPayoutAnalytics(userId, timeframe = '1Y') {
    await this.delay(500);
    
    const monthlyData = Array.from({ length: 12 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (11 - i));
      
      return {
        month: date.toISOString().split('T')[0].substring(0, 7),
        amount: faker.number.int({ min: 1000, max: 15000 }),
        count: faker.number.int({ min: 2, max: 12 }),
        averageAmount: faker.number.int({ min: 500, max: 2000 }),
      };
    });
    
    return {
      monthlyData,
      trends: {
        totalGrowth: faker.number.float({ min: -5, max: 25, fractionDigits: 1 }),
        frequencyGrowth: faker.number.float({ min: -10, max: 30, fractionDigits: 1 }),
        consistencyScore: faker.number.int({ min: 75, max: 95 }),
      },
      projections: {
        nextMonth: faker.number.int({ min: 2000, max: 8000 }),
        nextQuarter: faker.number.int({ min: 8000, max: 25000 }),
        confidence: faker.number.int({ min: 80, max: 92 }),
      }
    };
  }

  // Simulate real-time payout notification
  startPayoutStream(callback) {
    const interval = setInterval(() => {
      if (Math.random() < 0.3) { // 30% chance of payout event
        const event = {
          type: 'payout_received',
          basketId: `basket_${faker.number.int({ min: 1, max: 25 })}`,
          amount: faker.number.int({ min: 100, max: 2000 }),
          timestamp: new Date().toISOString(),
          txHash: `0x${faker.string.hexadecimal({ length: 64 })}`,
        };
        callback(event);
      }
    }, faker.number.int({ min: 10000, max: 30000 })); // Random intervals
    
    return interval;
  }

  // Helper methods
  generateMockPayouts() {
    return Array.from({ length: 50 }, (_, i) => ({
      id: `payout_${i + 1}`,
      amount: faker.number.int({ min: 500, max: 10000 }),
      currency: 'USD',
      basketId: `basket_${faker.number.int({ min: 1, max: 25 })}`,
      status: faker.helpers.arrayElement(['completed', 'pending', 'failed']),
      txHash: `0x${faker.string.hexadecimal({ length: 64 })}`,
      timestamp: faker.date.past({ days: 180 }).toISOString(),
      type: faker.helpers.arrayElement(['regular', 'maturity', 'early', 'penalty']),
    }));
  }

  generateMockSchedules() {
    return Array.from({ length: 15 }, (_, i) => ({
      id: `schedule_${i + 1}`,
      receivableId: `recv_${faker.number.int({ min: 1, max: 100 })}`,
      amount: faker.number.int({ min: 1000, max: 15000 }),
      frequency: faker.helpers.arrayElement(['monthly', 'quarterly', 'maturity']),
      nextPayout: faker.date.future({ days: 30 }).toISOString().split('T')[0],
      status: faker.helpers.arrayElement(['active', 'paused', 'completed']),
      created: faker.date.past({ days: 90 }).toISOString(),
    }));
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default new PayoutService();