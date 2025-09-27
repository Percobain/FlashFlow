const Basket = require('../models/Basket');
const { ethers } = require('ethers');

class BasketService {
  async assignToBasket({ riskScore, assetType, amount, assetId }) {
    // Determine basket type based on risk score
    let basketType = this.determineBasketType(riskScore);
    
    // Find available basket
    let basket = await Basket.findOne({
      basketType,
      status: 'open',
      isFull: false,
      currentRiskScore: { $lt: this.getMaxRisk(basketType) - 5 }
    });
    
    // Create new basket if needed or current would exceed limits
    if (!basket || await this.wouldExceedThreshold(basket, riskScore, amount)) {
      basket = await this.createNewBasket(basketType);
    }
    
    // Update basket with new asset
    await this.addAssetToBasket(basket, assetId, amount, riskScore);
    
    return basket;
  }

  determineBasketType(riskScore) {
    if (riskScore >= 80) return 'low';      // Low risk (high score)
    if (riskScore >= 65) return 'medium';   // Medium risk
    return 'high';                          // High risk (low score)
  }

  getMaxRisk(basketType) {
    const limits = { 
      low: 30,      // Max 30% risk (min 70 score)
      medium: 50,   // Max 50% risk (min 50 score) 
      high: 70,     // Max 70% risk (min 30 score)
      mixed: 100    // No limit
    };
    return limits[basketType];
  }

  async createNewBasket(basketType) {
    const basketId = ethers.utils.id(`basket-${basketType}-${Date.now()}`);
    
    const basket = new Basket({
      basketId,
      basketType,
      name: `${basketType.toUpperCase()} Risk Basket #${await this.getNextBasketNumber(basketType)}`,
      description: `Automatically created ${basketType} risk basket`,
      maxRiskThreshold: this.getMaxRisk(basketType),
      currentRiskScore: 0,
      expectedAPY: this.calculateExpectedAPY(basketType)
    });

    return await basket.save();
  }

  async addAssetToBasket(basket, assetId, amount, riskScore) {
    // Add asset to basket
    basket.assetIds.push(assetId);
    basket.assetCount += 1;
    basket.totalValue += amount;
    basket.availableToInvest += amount * 0.85; // 85% typically unlockable
    
    // Recalculate weighted risk score
    basket.currentRiskScore = await this.calculateWeightedRisk(basket);
    
    // Check if basket is now full
    const riskPercentage = (100 - basket.currentRiskScore);
    basket.isFull = riskPercentage > this.getMaxRisk(basket.basketType);
    
    // Update performance tracking
    basket.performance.push({
      date: new Date(),
      value: basket.totalValue,
      apy: basket.expectedAPY
    });

    return await basket.save();
  }

  async calculateWeightedRisk(basket) {
    // This would typically query all assets in the basket
    // For now, using simplified calculation
    const Asset = require('../models/Asset');
    const assets = await Asset.find({ assetId: { $in: basket.assetIds } });
    
    if (assets.length === 0) return 0;
    
    const totalValue = assets.reduce((sum, asset) => sum + asset.faceAmount, 0);
    const weightedRisk = assets.reduce((sum, asset) => {
      const weight = asset.faceAmount / totalValue;
      return sum + (asset.riskScore * weight);
    }, 0);
    
    return Math.round(weightedRisk);
  }

  calculateExpectedAPY(basketType) {
    const baseAPY = { low: 8, medium: 12, high: 18, mixed: 15 };
    return baseAPY[basketType] || 12;
  }

  async wouldExceedThreshold(basket, newRiskScore, newAmount) {
    // Calculate what the new risk would be
    const currentTotalValue = basket.totalValue;
    const newTotalValue = currentTotalValue + newAmount;
    
    if (newTotalValue === 0) return false;
    
    const currentWeightedRisk = (basket.currentRiskScore * currentTotalValue) / newTotalValue;
    const newWeight = newAmount / newTotalValue;
    const newWeightedRisk = currentWeightedRisk + (newRiskScore * newWeight);
    
    const newRiskPercentage = 100 - newWeightedRisk;
    return newRiskPercentage > this.getMaxRisk(basket.basketType);
  }

  async getNextBasketNumber(basketType) {
    const count = await Basket.countDocuments({ basketType });
    return count + 1;
  }
}

module.exports = new BasketService();