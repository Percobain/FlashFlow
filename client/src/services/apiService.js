const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
      ...options,
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }
      
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Blockchain API endpoints
  async getNetworkInfo() {
    return this.request('/api/blockchain/network');
  }

  async createAssetOnBackend(assetData) {
    return this.request('/api/blockchain/assets', {
      method: 'POST',
      body: assetData,
    });
  }

  async getAssetInfo(assetId) {
    return this.request(`/api/blockchain/assets/${assetId}`);
  }

  async releaseFunds(assetId, amount) {
    return this.request(`/api/blockchain/assets/${assetId}/release`, {
      method: 'POST',
      body: { amount },
    });
  }

  async getPoolStats() {
    return this.request('/api/blockchain/pool/stats');
  }

  async getWalletBalance(address) {
    return this.request(`/api/blockchain/wallet/balance/${address}`);
  }

  // Asset management endpoints
  async getAssets(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.request(`/api/assets?${params}`);
  }

  async createAsset(assetData) {
    return this.request('/api/assets', {
      method: 'POST',
      body: assetData,
    });
  }

  async updateAsset(assetId, updateData) {
    return this.request(`/api/assets/${assetId}`, {
      method: 'PUT',
      body: updateData,
    });
  }

  async deleteAsset(assetId) {
    return this.request(`/api/assets/${assetId}`, {
      method: 'DELETE',
    });
  }

  // Investment endpoints
  async getInvestments(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.request(`/api/investments?${params}`);
  }

  async createInvestment(investmentData) {
    return this.request('/api/investments', {
      method: 'POST',
      body: investmentData,
    });
  }

  // Basket API endpoints
  async getBaskets(filters = {}) {
    const queryParams = new URLSearchParams();
    
    if (filters.basketType) queryParams.append('basketType', filters.basketType);
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.page) queryParams.append('page', filters.page);
    if (filters.limit) queryParams.append('limit', filters.limit);
    
    return this.request(`/api/baskets?${queryParams.toString()}`);
  }

  async getBasketDetails(basketId) {
    return this.request(`/api/baskets/${basketId}`);
  }

  async investInBasket(basketId, amount) {
    return this.request(`/api/baskets/${basketId}/invest`, {
      method: 'POST',
      body: { amount },
    });
  }

  async getBasketPerformance(basketId, period = '12m') {
    return this.request(`/api/baskets/${basketId}/performance?period=${period}`);
  }

  // User endpoints
  async getUserProfile(address) {
    return this.request(`/api/users/${address}`);
  }

  async updateUserProfile(address, profileData) {
    return this.request(`/api/users/${address}`, {
      method: 'PUT',
      body: profileData,
    });
  }

  // KYC endpoints
  async submitKYC(kycData) {
    return this.request('/api/users/kyc', {
      method: 'POST',
      body: kycData,
    });
  }

  async getKYCStatus(address) {
    return this.request(`/api/users/${address}/kyc`);
  }

  // Payment endpoints
  async initiatePayment(paymentData) {
    return this.request('/api/payments', {
      method: 'POST',
      body: paymentData,
    });
  }

  async getPaymentHistory(address) {
    return this.request(`/api/payments/history/${address}`);
  }
}

export default new ApiService();