const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

class ApiService {
    constructor() {
        this.baseURL = API_BASE_URL;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: {
                "Content-Type": "application/json",
            },
            ...options,
        };

        if (config.body && typeof config.body === "object") {
            config.body = JSON.stringify(config.body);
        }

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error || `HTTP error! status: ${response.status}`
                );
            }

            return data;
        } catch (error) {
            console.error("API request failed:", error);
            throw error;
        }
    }

    // Blockchain API endpoints
    async getNetworkInfo() {
        return this.request("/api/blockchain/network");
    }

    async createAssetOnBackend(assetData) {
        return this.request("/api/blockchain/assets", {
            method: "POST",
            body: assetData,
        });
    }

    async getAssetInfo(assetId) {
        return this.request(`/api/blockchain/assets/${assetId}`);
    }

    async releaseFunds(assetId, amount) {
        return this.request(`/api/blockchain/assets/${assetId}/release`, {
            method: "POST",
            body: { amount },
        });
    }

    async getPoolStats() {
        return this.request("/api/blockchain/pool/stats");
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
        return this.request("/api/assets", {
            method: "POST",
            body: assetData,
        });
    }

    async updateAsset(assetId, updateData) {
        return this.request(`/api/assets/${assetId}`, {
            method: "PUT",
            body: updateData,
        });
    }

    async deleteAsset(assetId) {
        return this.request(`/api/assets/${assetId}`, {
            method: "DELETE",
        });
    }

    // Investment endpoints
    async getInvestments(filters = {}) {
        const params = new URLSearchParams(filters);
        return this.request(`/api/investments?${params}`);
    }

    async createInvestment(investmentData) {
        return this.request("/api/investments", {
            method: "POST",
            body: investmentData,
        });
    }

    // Basket endpoints
    async getBaskets() {
        return this.request("/api/baskets");
    }

    async getBasket(basketId) {
        return this.request(`/api/baskets/${basketId}`);
    }

    // User endpoints
    async getUserProfile(address) {
        return this.request(`/api/users/${address}`);
    }

    async updateUserProfile(address, profileData) {
        return this.request(`/api/users/${address}`, {
            method: "PUT",
            body: profileData,
        });
    }

    // KYC endpoints
    async submitKYC(kycData) {
        return this.request("/api/users/kyc", {
            method: "POST",
            body: kycData,
        });
    }

    async getKYCStatus(address) {
        return this.request(`/api/users/${address}/kyc`);
    }

    // Payment endpoints
    async initiatePayment(paymentData) {
        return this.request("/api/payments", {
            method: "POST",
            body: paymentData,
        });
    }

    async getPaymentHistory(address) {
        return this.request(`/api/payments/history/${address}`);
    }

    // AI-Enhanced Asset Analysis endpoints
    async analyzeAsset(assetData) {
        return this.request("/api/analyze-asset", {
            method: "POST",
            body: assetData,
        });
    }

    async analyzeAssetWithAI(assetData) {
        return this.request("/api/analyze-asset-ai", {
            method: "POST",
            body: assetData,
        });
    }

    async performRiskAnalysis(type, data) {
        return this.request(`/api/risk-analysis/${type}`, {
            method: "POST",
            body: data,
        });
    }

    async getRiskConfig() {
        return this.request("/api/risk-config");
    }

    async getHealthCheck() {
        return this.request("/");
    }
}

export default new ApiService();
