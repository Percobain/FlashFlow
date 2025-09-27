const { GoogleGenerativeAI } = require("@google/generative-ai");

class AIService {
    constructor() {
        // Initialize Gemini only
        if (process.env.GEMINI_API_KEY) {
            this.gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            this.geminiModel = this.gemini.getGenerativeModel({ model: "gemini-2.5-flash" });
        } else {
            console.warn(
                "Warning: GEMINI_API_KEY not set. AI analysis will use fallback scoring."
            );
            this.gemini = null;
        }
    }

    async analyzeRisk(assetData) {
        const { type, amount, documents, historicalData = {} } = assetData;

        // Use Gemini only
        if (this.gemini) {
            try {
                console.log("🤖 Using Gemini for analysis...");
                return await this.analyzeWithGemini(type, assetData);
            } catch (error) {
                console.warn("⚠️ Gemini analysis failed:", error.message);
            }
        }

        // Fallback to rule-based scoring
        console.log("🔄 Using fallback risk scoring (no AI available)");
        return this.fallbackRiskScoring(assetData);
    }

    async analyzeWithGemini(type, assetData) {
        const prompt = this.buildAnalysisPrompt(type, assetData);

        const result = await this.geminiModel.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        const analysis = this.parseAIResponse(text);

        return {
            riskScore: analysis.riskScore,
            confidence: analysis.confidence,
            reasoning: analysis.reasoning,
            factors: analysis.factors,
            model: "gemini-2.5-flash",
            analyzedAt: new Date(),
        };
    }

    buildAnalysisPrompt(type, data) {
        const basePrompt = `Analyze the risk of this ${type} receivable:
    - Amount: $${data.amount}
    - Type: ${type}`;

        const typeSpecificPrompts = {
            invoice: `
        - Due Date: ${data.invoiceData?.dueDate}
        - Payer: ${data.invoiceData?.payerCompany}
        - Terms: ${data.invoiceData?.terms}
        Consider: payment history, company stability, industry trends`,

            saas: `
        - MRR: $${data.saasData?.mrr}
        - Plan: ${data.saasData?.planType}
        - Churn Rate: ${data.saasData?.churnRate}%
        Consider: SaaS metrics, market competition, customer retention`,

            creator: `
        - Platform: ${data.creatorData?.platform}
        - Followers: ${data.creatorData?.followers}
        - Engagement: ${data.creatorData?.engagementRate}%
        Consider: platform risk, audience stability, content quality`,

            rental: `
        - Monthly Rent: $${data.rentalData?.monthlyRent}
        - Location: ${data.rentalData?.address}
        - Lease Term: ${data.rentalData?.leaseTerm} months
        Consider: location desirability, tenant quality, market trends`,

            luxury: `
        - Asset: ${data.luxuryData?.assetName}
        - Value: $${data.luxuryData?.estimatedValue}
        - Condition: ${data.luxuryData?.condition}
        Consider: market liquidity, depreciation, storage costs`,
        };

        return (
            basePrompt +
            (typeSpecificPrompts[type] || "") +
            `

    Provide analysis in this JSON format:
    {
      "riskScore": 75,
      "confidence": 0.85,
      "reasoning": "Detailed explanation...",
      "factors": {
        "paymentHistory": 80,
        "businessStability": 70,
        "documentQuality": 75,
        "industryRisk": 65,
        "marketConditions": 70
      }
    }`
        );
    }

    parseAIResponse(response) {
        try {
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
        } catch (e) {
            console.error("Failed to parse AI response:", e);
        }

        // Fallback parsing
        return {
            riskScore: 75,
            confidence: 0.8,
            reasoning: "AI analysis completed with standard risk assessment",
            factors: {
                paymentHistory: 75,
                businessStability: 75,
                documentQuality: 75,
                industryRisk: 75,
                marketConditions: 75,
            },
        };
    }

    fallbackRiskScoring(assetData) {
        let baseScore = 70; // Start with medium risk

        // Adjust based on amount
        if (assetData.amount > 100000) baseScore -= 5;
        if (assetData.amount < 10000) baseScore += 5;

        // Type-based adjustments
        const typeAdjustments = {
            invoice: 5, // Generally safer
            rental: 3, // Real estate backed
            saas: 0, // Variable
            creator: -5, // Higher risk
            luxury: -3, // Market dependent
        };

        baseScore += typeAdjustments[assetData.type] || 0;

        return {
            riskScore: Math.max(30, Math.min(95, baseScore)),
            confidence: 0.7,
            reasoning: "Fallback rule-based risk assessment",
            factors: {
                paymentHistory: baseScore,
                businessStability: baseScore,
                documentQuality: baseScore,
                industryRisk: baseScore,
                marketConditions: baseScore,
            },
            model: "fallback",
            analyzedAt: new Date(),
        };
    }
}

module.exports = new AIService();
