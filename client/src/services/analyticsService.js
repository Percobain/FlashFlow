import apiService from "./apiService";

class AnalyticsService {
    async getDashboardOverview() {
        try {
            const response = await apiService.get(
                "/analytics/dashboard-overview"
            );
            return response.data;
        } catch (error) {
            console.error("Failed to fetch dashboard overview:", error);
            throw error;
        }
    }

    async getPortfolioPerformance(period = "12m") {
        try {
            const response = await apiService.get(
                `/analytics/portfolio-performance?period=${period}`
            );
            return response.data;
        } catch (error) {
            console.error("Failed to fetch portfolio performance:", error);
            throw error;
        }
    }

    async getAssetAllocation() {
        try {
            const response = await apiService.get(
                "/analytics/asset-allocation"
            );
            return response.data;
        } catch (error) {
            console.error("Failed to fetch asset allocation:", error);
            throw error;
        }
    }

    async getRiskAnalytics() {
        try {
            const response = await apiService.get("/analytics/risk-analytics");
            return response.data;
        } catch (error) {
            console.error("Failed to fetch risk analytics:", error);
            throw error;
        }
    }

    async getPayoutAnalytics() {
        try {
            const response = await apiService.get(
                "/analytics/payout-analytics"
            );
            return response.data;
        } catch (error) {
            console.error("Failed to fetch payout analytics:", error);
            throw error;
        }
    }
}

export default new AnalyticsService();
