import { faker } from '@faker-js/faker';

faker.seed(123456);

class AIRiskOracleService {
  constructor() {
    this.riskUpdates = [];
    this.modelMetrics = this.generateModelMetrics();
    this.startMockUpdates();
  }

  // Calculate risk score with AI factors
  async calculateRiskScore(data) {
    await this.delay(1500); // Simulate AI processing
    
    const factorAnalysis = this.analyzeRiskFactors(data);
    const baseScore = this.calculateBaseScore(factorAnalysis);
    const adjustedScore = this.applyMarketConditions(baseScore);
    
    // Convert factors object to array for UI consumption
    const factorsArray = [
      'Payment history analysis',
      'Industry risk assessment', 
      'Market conditions evaluation',
      'Counterparty credit scoring',
      'Technical factor analysis',
      'Economic indicator review'
    ];
    
    return {
      score: Math.round(adjustedScore),
      confidence: faker.number.int({ min: 85, max: 98 }),
      factors: factorsArray, // Now an array instead of object
      breakdown: this.generateScoreBreakdown(factorAnalysis),
      lastUpdated: new Date().toISOString(),
      modelVersion: '2.1.3',
    };
  }

  // Predict cash flow
  async predictCashFlow(historical) {
    await this.delay(2000);
    
    const trend = this.analyzeTrend(historical);
    const seasonality = this.detectSeasonality(historical);
    const predictions = this.generatePredictions(historical, trend, seasonality);
    
    return {
      predictions,
      confidence: faker.number.int({ min: 78, max: 94 }),
      trend: trend,
      seasonality: seasonality,
      factors: [
        'Historical payment patterns',
        'Industry trends',
        'Economic indicators',
        'Seasonal adjustments',
        'Market volatility'
      ],
      methodology: 'Ensemble ML model with LSTM and XGBoost',
    };
  }

  // Monitor payments in real-time
  async monitorPayments() {
    return this.riskUpdates.slice(-10); // Return latest 10 updates
  }

  // Get live risk score updates
  async getLiveRiskFeed() {
    await this.delay(300);
    
    return {
      updates: this.riskUpdates.slice(-20),
      summary: {
        totalUpdates: this.riskUpdates.length,
        avgRiskScore: this.calculateAverageRisk(),
        riskTrend: this.getRiskTrend(),
        alertsActive: faker.number.int({ min: 0, max: 5 }),
      }
    };
  }

  // Explain risk score in detail
  async explainRisk(receivableId) {
    await this.delay(800);
    
    return {
      receivableId,
      explanation: this.generateRiskExplanation(),
      keyFactors: this.generateKeyFactors(),
      recommendations: this.generateRecommendations(),
      comparisons: this.generateComparisons(),
      confidence: faker.number.int({ min: 88, max: 96 }),
    };
  }

  // Get model performance metrics
  async getModelMetrics() {
    await this.delay(400);
    return this.modelMetrics;
  }

  // Submit dispute/appeal
  async submitDispute(receivableId, reason, evidence) {
    await this.delay(1000);
    
    return {
      disputeId: `dispute_${Date.now()}`,
      status: 'under_review',
      estimatedResolution: faker.date.future({ days: 7 }).toISOString().split('T')[0],
      reviewerAssigned: faker.person.fullName(),
      priority: faker.helpers.arrayElement(['low', 'medium', 'high']),
    };
  }

  // Helper methods
  analyzeRiskFactors(data) {
    return {
      paymentHistory: faker.number.float({ min: 0.6, max: 0.95, fractionDigits: 2 }),
      industryRisk: faker.number.float({ min: 0.7, max: 0.9, fractionDigits: 2 }),
      counterpartyCredit: faker.number.float({ min: 0.65, max: 0.92, fractionDigits: 2 }),
      marketConditions: faker.number.float({ min: 0.75, max: 0.88, fractionDigits: 2 }),
      technicalFactors: faker.number.float({ min: 0.8, max: 0.95, fractionDigits: 2 }),
    };
  }

  calculateBaseScore(factors) {
    const weights = {
      paymentHistory: 0.3,
      industryRisk: 0.2,
      counterpartyCredit: 0.25,
      marketConditions: 0.15,
      technicalFactors: 0.1,
    };
    
    return Object.entries(factors).reduce((score, [factor, value]) => {
      return score + (value * weights[factor] * 100);
    }, 0);
  }

  applyMarketConditions(baseScore) {
    const marketAdjustment = faker.number.float({ min: -5, max: 5, fractionDigits: 1 });
    return Math.max(30, Math.min(95, baseScore + marketAdjustment));
  }

  generateScoreBreakdown(factors) {
    return Object.entries(factors).map(([factor, value]) => ({
      factor: factor.replace(/([A-Z])/g, ' $1').toLowerCase(),
      score: Math.round(value * 100),
      impact: faker.helpers.arrayElement(['positive', 'neutral', 'negative']),
      weight: faker.number.float({ min: 0.1, max: 0.3, fractionDigits: 1 }),
    }));
  }

  analyzeTrend(historical) {
    const trend = faker.helpers.arrayElement(['increasing', 'stable', 'decreasing']);
    return {
      direction: trend,
      strength: faker.number.float({ min: 0.1, max: 0.9, fractionDigits: 2 }),
      confidence: faker.number.int({ min: 75, max: 95 }),
    };
  }

  detectSeasonality(historical) {
    return {
      detected: faker.datatype.boolean(),
      pattern: faker.helpers.arrayElement(['monthly', 'quarterly', 'none']),
      strength: faker.number.float({ min: 0.1, max: 0.7, fractionDigits: 2 }),
    };
  }

  generatePredictions(historical, trend, seasonality) {
    return Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() + i + 1);
      
      return {
        date: date.toISOString().split('T')[0],
        predicted: faker.number.int({ min: 80, max: 120 }),
        confidence: faker.number.int({ min: 70, max: 95 }),
        lower: faker.number.int({ min: 60, max: 90 }),
        upper: faker.number.int({ min: 100, max: 140 }),
      };
    });
  }

  generateRiskExplanation() {
    const explanations = [
      "This receivable shows strong payment history with consistent cash flows and low counterparty risk.",
      "The risk assessment indicates moderate volatility due to industry-specific factors and market conditions.",
      "High confidence in payment likelihood based on robust financial backing and proven track record.",
      "Some concern around market timing and seasonal variations affecting payment patterns.",
      "Excellent fundamentals with minor adjustments for current economic climate."
    ];
    
    return faker.helpers.arrayElement(explanations);
  }

  generateKeyFactors() {
    return [
      {
        factor: 'Payment History',
        impact: faker.helpers.arrayElement(['positive', 'negative', 'neutral']),
        description: 'Historical payment behavior analysis',
        confidence: faker.number.int({ min: 85, max: 95 }),
      },
      {
        factor: 'Industry Outlook',
        impact: faker.helpers.arrayElement(['positive', 'negative', 'neutral']),
        description: 'Sector-specific risk assessment',
        confidence: faker.number.int({ min: 80, max: 92 }),
      },
      {
        factor: 'Market Conditions',
        impact: faker.helpers.arrayElement(['positive', 'negative', 'neutral']),
        description: 'Current economic environment impact',
        confidence: faker.number.int({ min: 75, max: 88 }),
      },
    ];
  }

  generateRecommendations() {
    const recommendations = [
      'Consider portfolio diversification to reduce concentration risk',
      'Monitor payment dates closely for early warning signals',
      'Review counterparty creditworthiness quarterly',
      'Hedge against industry-specific risks',
      'Maintain adequate liquidity reserves'
    ];
    
    return faker.helpers.arrayElements(recommendations, { min: 2, max: 4 });
  }

  generateComparisons() {
    return {
      industry: {
        average: faker.number.int({ min: 70, max: 85 }),
        percentile: faker.number.int({ min: 25, max: 90 }),
      },
      portfolio: {
        average: faker.number.int({ min: 75, max: 88 }),
        percentile: faker.number.int({ min: 30, max: 85 }),
      },
    };
  }

  generateModelMetrics() {
    return {
      accuracy: faker.number.float({ min: 0.85, max: 0.94, fractionDigits: 3 }),
      precision: faker.number.float({ min: 0.82, max: 0.91, fractionDigits: 3 }),
      recall: faker.number.float({ min: 0.78, max: 0.89, fractionDigits: 3 }),
      f1Score: faker.number.float({ min: 0.80, max: 0.90, fractionDigits: 3 }),
      auc: faker.number.float({ min: 0.88, max: 0.96, fractionDigits: 3 }),
      lastTrained: faker.date.past({ days: 14 }).toISOString(),
      trainingData: faker.number.int({ min: 50000, max: 200000 }),
      version: '2.1.3',
    };
  }

  startMockUpdates() {
    // Generate initial updates
    for (let i = 0; i < 50; i++) {
      this.riskUpdates.push(this.generateRiskUpdate());
    }
    
    // Continue generating updates
    setInterval(() => {
      this.riskUpdates.push(this.generateRiskUpdate());
      if (this.riskUpdates.length > 100) {
        this.riskUpdates = this.riskUpdates.slice(-100);
      }
    }, faker.number.int({ min: 5000, max: 15000 })); // Random intervals
  }

  generateRiskUpdate() {
    return {
      id: `update_${Date.now()}_${faker.number.int({ max: 9999 })}`,
      receivableId: `recv_${faker.number.int({ min: 1, max: 100 })}`,
      oldScore: faker.number.int({ min: 60, max: 95 }),
      newScore: faker.number.int({ min: 60, max: 95 }),
      reason: faker.helpers.arrayElement([
        'Payment received',
        'Credit score update',
        'Market conditions change',
        'Industry report',
        'Counterparty update'
      ]),
      timestamp: new Date().toISOString(),
      severity: faker.helpers.arrayElement(['low', 'medium', 'high']),
    };
  }

  calculateAverageRisk() {
    if (this.riskUpdates.length === 0) return 75;
    const sum = this.riskUpdates.reduce((acc, update) => acc + update.newScore, 0);
    return Math.round(sum / this.riskUpdates.length);
  }

  getRiskTrend() {
    if (this.riskUpdates.length < 2) return 'stable';
    const recent = this.riskUpdates.slice(-10);
    const older = this.riskUpdates.slice(-20, -10);
    
    const recentAvg = recent.reduce((acc, u) => acc + u.newScore, 0) / recent.length;
    const olderAvg = older.reduce((acc, u) => acc + u.newScore, 0) / older.length;
    
    if (recentAvg > olderAvg + 2) return 'improving';
    if (recentAvg < olderAvg - 2) return 'declining';
    return 'stable';
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default new AIRiskOracleService();