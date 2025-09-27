const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

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

        // Handle FormData (for file uploads)
        if (config.body instanceof FormData) {
            delete config.headers["Content-Type"]; // Let browser set boundary
        } else if (config.body && typeof config.body === "object") {
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

    // === ASSET CREATION FLOW ===

    // 1. Create Asset (upload + AI analysis)
    async createAsset(formData) {
        return this.request("/api/assets/create", {
            method: "POST",
            body: formData, // FormData with file + metadata
        });
    }

    // 1a. Create Asset with existing data (after tokenization)
    async createAssetWithData(assetData) {
        return this.request("/api/assets/create", {
            method: "POST",
            body: assetData, // Regular object with asset data
        });
    }

    // 2. AI Analysis (separate endpoint)
    async analyzeAssetWithAI(assetData) {
        return this.request("/api/ai/analyze", {
            method: "POST",
            body: assetData,
        });
    }

    // 2. Fund Asset
    async fundAsset(assetId) {
        return this.request(`/api/assets/${assetId}/fund`, {
            method: "POST",
        });
    }

    // 3. Get Asset Details
    async getAsset(assetId) {
        return this.request(`/api/assets/${assetId}`);
    }

    // 4. Get User Assets
    async getUserAssets(userAddress) {
        return this.request(`/api/users/${userAddress}/assets`);
    }

    // === INVESTMENT FLOW ===

    // 1. Get All Baskets
    async getBaskets() {
        return this.request("/api/baskets");
    }

    // 2. Invest in Basket
    async investInBasket(basketId, investmentData) {
        return this.request(`/api/baskets/${basketId}/invest`, {
            method: "POST",
            body: investmentData,
        });
    }

    // 3. Get Basket Details
    async getBasketDetails(basketId) {
        return this.request(`/api/baskets/${basketId}`);
    }

    // === SIMULATION ===

    // Simulate Repayment
    async simulateRepayment(assetId, amount) {
        return this.request(`/api/assets/${assetId}/repay`, {
            method: "POST",
            body: { amount },
        });
    }

    // === UTILITIES ===

    // Get Pool Stats
    async getPoolStats() {
        return this.request("/api/stats");
    }

    // Generate Mock Data
    async generateMockData() {
        return this.request("/api/mock/generate");
    }

    // fUSD Approval Transaction
    async getApprovalTxData(amount) {
        return this.request("/api/fusd/approve", {
            method: "POST",
            body: { amount },
        });
    }

    // Health Check
    async healthCheck() {
        return this.request("/health");
    }

    // === LEGACY SUPPORT (for backward compatibility) ===

    async getNetworkInfo() {
        return {
            chainId: 5920,
            name: "Kadena EVM Testnet",
            rpcUrl: import.meta.env.VITE_RPC_URL,
        };
    }

    async createAssetOnBackend(assetData) {
        // Convert to new format
        const formData = new FormData();
        Object.keys(assetData).forEach((key) => {
            if (key === "document" && assetData[key]) {
                formData.append("document", assetData[key]);
            } else {
                formData.append(key, assetData[key]);
            }
        });
        return this.createAsset(formData);
    }
}

export default new ApiService();
