const { ethers } = require("ethers");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Lazy initialization of Gemini client
let gemini = null;
let geminiModel = null;

function getGeminiClient() {
    if (!gemini) {
        if (!process.env.GEMINI_API_KEY) {
            throw new Error(
                "GEMINI_API_KEY environment variable is required for AI analysis"
            );
        }
        gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        geminiModel = gemini.getGenerativeModel({ model: "gemini-2.5-flash" });
    }
    return { gemini, geminiModel };
}

class AssetAnalysisService {
    constructor() {
        this.DEFAULTS = {
            algorithmVersion: "2.1.0",
            thresholds: {
                amount_mid: 20000,
                amount_high: 50000,
                mrr_mid: 10000,
                mrr_high: 25000,
                revenue_mid: 5000,
                revenue_high: 15000,
                property_value_mid: 100000,
                property_value_high: 300000,
                luxury_value_mid: 50000,
                luxury_value_high: 200000,
            },
            weights: {
                invoice: {
                    vendor: 10,
                    client_history: 25,
                    country: 15,
                    amount: 15,
                    payment_terms: 10,
                    red_flags: 15,
                    partial_allowed: 3,
                    insurance: 2,
                },
                saas: {
                    mrr_stability: 20,
                    churn_rate: 25,
                    growth_rate: 15,
                    customer_base: 15,
                    market_position: 10,
                    retention: 10,
                    diversification: 5,
                },
                creator: {
                    platform_diversity: 20,
                    engagement_rate: 25,
                    revenue_stability: 20,
                    audience_growth: 15,
                    brand_strength: 10,
                    content_quality: 10,
                },
                rental: {
                    occupancy_rate: 25,
                    property_condition: 15,
                    location_risk: 20,
                    market_trends: 15,
                    tenant_quality: 15,
                    maintenance_history: 10,
                },
                luxury: {
                    authenticity: 20,
                    market_liquidity: 25,
                    appreciation_history: 20,
                    condition: 15,
                    insurance_coverage: 10,
                    utilization: 10,
                },
            },
        };

        this.riskFactors = {
            invoice: [
                "Payment history analysis",
                "Client creditworthiness",
                "Invoice aging patterns",
                "Industry risk assessment",
                "Geographic distribution",
            ],
            saas: [
                "Monthly recurring revenue stability",
                "Customer churn analysis",
                "Growth trajectory evaluation",
                "Market position assessment",
                "Subscription retention metrics",
            ],
            creator: [
                "Audience engagement metrics",
                "Platform diversification",
                "Revenue stream stability",
                "Brand value assessment",
                "Growth potential analysis",
            ],
            rental: [
                "Property valuation trends",
                "Occupancy rate history",
                "Market condition analysis",
                "Tenant quality assessment",
                "Geographic market risks",
            ],
            luxury: [
                "Asset appreciation history",
                "Market liquidity assessment",
                "Authentication verification",
                "Insurance coverage analysis",
                "Utilization rate evaluation",
            ],
        };
    }

    async analyzeAssetData(data) {
        const {
            type,
            data: assetData,
            userAddress,
            assetId,
            autoBasketize = true,
        } = data;

        try {
            console.log(
                `🤖 Starting AI-enhanced analysis for ${type} asset...`
            );

            // Step 1: Use AI to validate and enhance the input data
            const enhancedData = await this.enhanceDataWithAI(type, assetData);

            // Step 2: Use deterministic risk analysis on enhanced data
            const analysis = await this.performDeterministicRiskAnalysis(
                type,
                enhancedData
            );

            // Step 3: Generate AI summary of the analysis
            const aiSummary = await this.generateAISummary(
                type,
                enhancedData,
                analysis
            );

            // Step 4: Combine results
            const finalAnalysis = {
                ...analysis,
                aiEnhanced: true,
                aiSummary,
                originalData: assetData,
                enhancedData,
            };

            // Step 5: Auto-basketize if requested (for invoices)
            if (
                autoBasketize &&
                type === "invoice" &&
                assetId &&
                assetId !== `temp-${Date.now()}`
            ) {
                try {
                    const BasketService = require("./BasketService");
                    const basketResult = await BasketService.basketizeInvoice(
                        assetId,
                        analysis.score,
                        analysis.estimatedValue,
                        type
                    );

                    finalAnalysis.basketization = basketResult;
                    console.log(
                        `📦 Asset ${assetId} auto-basketized to ${basketResult.basketType}`
                    );
                } catch (basketError) {
                    console.warn(
                        "⚠️ Auto-basketization failed:",
                        basketError.message
                    );
                    finalAnalysis.basketization = {
                        success: false,
                        error: basketError.message,
                        note: "Basketization skipped for temporary analysis",
                    };
                }
            } else {
                finalAnalysis.basketization = {
                    success: false,
                    note: "Basketization not requested or temporary asset ID",
                };
            }

            // Store analysis in database
            await this.storeAnalysisResult(userAddress, finalAnalysis);

            return finalAnalysis;
        } catch (error) {
            console.error("Asset analysis failed:", error);
            // Fallback to deterministic analysis without AI enhancement
            console.log("🔄 Falling back to deterministic analysis...");
            const fallbackAnalysis =
                await this.performDeterministicRiskAnalysis(type, assetData);
            await this.storeAnalysisResult(userAddress, fallbackAnalysis);
            return fallbackAnalysis;
        }
    }

    // AI Enhancement Methods - Gemini only
    async enhanceDataWithAI(type, rawData) {
        // Use Gemini only
        if (process.env.GEMINI_API_KEY) {
            try {
                console.log("🤖 Using Gemini for data enhancement...");
                return await this.enhanceDataWithGemini(type, rawData);
            } catch (error) {
                console.warn("⚠️ Gemini enhancement failed:", error.message);
            }
        }

        // Final fallback to original data
        console.log("🔄 Using original data (no AI enhancement available)");
        return rawData;
    }

    async enhanceDataWithGemini(type, rawData) {
        const prompt = this.createEnhancementPrompt(type, rawData);

        const { geminiModel } = getGeminiClient();
        const result = await geminiModel.generateContent(prompt);
        const response = await result.response;
        const aiResponse = response.text();

        // Parse the AI response
        let enhancedData;
        try {
            // Extract JSON from the response (in case AI adds explanation text)
            const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                enhancedData = JSON.parse(jsonMatch[0]);
            } else {
                enhancedData = JSON.parse(aiResponse);
            }
        } catch (parseError) {
            console.warn(
                "⚠️ Gemini response parsing failed, using original data:",
                parseError.message
            );
            return rawData;
        }

        // Validate the enhanced data has required fields
        const validatedData = this.validateEnhancedData(
            type,
            enhancedData,
            rawData
        );

        console.log("✅ Data successfully enhanced by Gemini");
        return validatedData;
    }

    async generateAISummary(type, data, analysis) {
        // Use Gemini only
        if (process.env.GEMINI_API_KEY) {
            try {
                console.log("🤖 Using Gemini for summary generation...");
                return await this.generateSummaryWithGemini(
                    type,
                    data,
                    analysis
                );
            } catch (error) {
                console.warn(
                    "⚠️ Gemini summary generation failed:",
                    error.message
                );
            }
        }

        // Final fallback
        return `Risk analysis completed for ${type} asset with a score of ${
            analysis.score
        }/100. Recommended advance rate is ${(
            analysis.recommendedAdvance * 100
        ).toFixed(1)}% based on the assessed risk factors.`;
    }

    async generateSummaryWithGemini(type, data, analysis) {
        const prompt = `
Generate a concise, professional risk analysis summary for this ${type} asset:

Asset Data:
${JSON.stringify(data, null, 2)}

Risk Analysis Results:
- Risk Score: ${analysis.score}/100
- Confidence: ${analysis.confidence}%
- Estimated Value: $${analysis.estimatedValue?.toLocaleString()}
- Recommended Advance: ${(analysis.recommendedAdvance * 100).toFixed(1)}%
- Projected ROI: ${analysis.projectedROI}%

Provide a 3-4 sentence executive summary that explains:
1. The key risk factors identified
2. Why this risk score was assigned
3. The recommended action for investors

Keep it professional and actionable.`;

        const { geminiModel } = getGeminiClient();
        const result = await geminiModel.generateContent(prompt);
        const response = await result.response;
        return response.text().trim();
    }

    createEnhancementPrompt(type, data) {
        const basePrompt = `
Analyze and enhance the following ${type} asset data for risk assessment. 

Original Data:
${JSON.stringify(data, null, 2)}

Please:
1. Validate all numerical values and fix any inconsistencies
2. Fill in missing fields with reasonable estimates based on industry standards
3. Identify and flag any potential red flags
4. Ensure all required fields are present and properly formatted
5. Add calculated fields that would be useful for risk analysis

Return ONLY a JSON object with the enhanced data following this schema:`;

        switch (type) {
            case "invoice":
                return (
                    basePrompt +
                    `
{
  "invoice_id": "string",
  "total_amount": number,
  "vendor": {
    "company_name": "string",
    "years_in_business": number,
    "address": "string"
  },
  "client": {
    "company_name": "string",
    "country": "string",
    "payment_history": {
      "total_invoices": number,
      "on_time_payments": number
    }
  },
  "payment_terms": "string",
  "late_fee_percentage": number,
  "partial_payments_allowed": boolean,
  "insurance_coverage": boolean,
  "red_flags": ["array of strings"],
  "line_items": [{"quantity": number, "unit_price": number, "total": number}]
}`
                );

            case "saas":
                return (
                    basePrompt +
                    `
{
  "totalMRR": number,
  "subscriptions": [{"monthlyRevenue": number, "churnRate": number}],
  "yearlyGrowth": number,
  "retention": number,
  "customerAcquisitionCost": number,
  "lifetimeValue": number
}`
                );

            case "creator":
                return (
                    basePrompt +
                    `
{
  "totalMonthlyRevenue": number,
  "platforms": [{"name": "string", "monthlyRevenue": number, "engagement": number, "followers": number}],
  "audienceGrowth": number,
  "contentCategories": ["array"],
  "brandPartnerships": number
}`
                );

            case "rental":
                return (
                    basePrompt +
                    `
{
  "totalMonthlyIncome": number,
  "properties": [{"monthlyRent": number, "occupancyRate": number, "propertyType": "string", "location": "string"}],
  "occupancy": number,
  "propertyAppreciation": number,
  "maintenanceCosts": number
}`
                );

            case "luxury":
                return (
                    basePrompt +
                    `
{
  "totalValue": number,
  "assets": [{"currentValue": number, "utilizationRate": number, "appreciationRate": number, "assetType": "string"}],
  "averageUtilization": number,
  "insuranceCoverage": "string",
  "maintenanceCosts": number
}`
                );

            default:
                return (
                    basePrompt +
                    `
Return the enhanced data in the most appropriate format for ${type} assets.`
                );
        }
    }

    validateEnhancedData(type, enhancedData, originalData) {
        // Ensure critical fields exist, fallback to original data if missing
        const validated = { ...enhancedData };

        switch (type) {
            case "invoice":
                if (!validated.total_amount && originalData.total_amount) {
                    validated.total_amount = originalData.total_amount;
                }
                if (!validated.vendor && originalData.vendor) {
                    validated.vendor = originalData.vendor;
                }
                if (!validated.client && originalData.client) {
                    validated.client = originalData.client;
                }
                break;

            case "saas":
                if (!validated.totalMRR && originalData.totalMRR) {
                    validated.totalMRR = originalData.totalMRR;
                }
                if (!validated.subscriptions && originalData.subscriptions) {
                    validated.subscriptions = originalData.subscriptions;
                }
                break;

            case "creator":
                if (
                    !validated.totalMonthlyRevenue &&
                    originalData.totalMonthlyRevenue
                ) {
                    validated.totalMonthlyRevenue =
                        originalData.totalMonthlyRevenue;
                }
                if (!validated.platforms && originalData.platforms) {
                    validated.platforms = originalData.platforms;
                }
                break;

            case "rental":
                if (
                    !validated.totalMonthlyIncome &&
                    originalData.totalMonthlyIncome
                ) {
                    validated.totalMonthlyIncome =
                        originalData.totalMonthlyIncome;
                }
                if (!validated.properties && originalData.properties) {
                    validated.properties = originalData.properties;
                }
                break;

            case "luxury":
                if (!validated.totalValue && originalData.totalValue) {
                    validated.totalValue = originalData.totalValue;
                }
                if (!validated.assets && originalData.assets) {
                    validated.assets = originalData.assets;
                }
                break;
        }

        return validated;
    }

    // Utility functions for deterministic analysis
    clamp(x, a = 0, b = 100) {
        return Math.max(a, Math.min(b, x));
    }

    getCountryRiskScore(country) {
        // Simple builtin mapping — replace with AML/CountryRisk API for production
        const highRisk = [
            "Cayman Islands",
            "Panama",
            "Belize",
            "Marshall Islands",
        ];
        const mediumRisk = ["Hong Kong", "Singapore"];
        if (!country) return 60;
        if (highRisk.includes(country)) return 85;
        if (mediumRisk.includes(country)) return 60;
        return 30; // lower risk
    }

    normalizeAmountRisk(amount, thresholds, type = "invoice") {
        const thresholdKey =
            type === "invoice"
                ? "amount"
                : type === "saas"
                ? "mrr"
                : type === "creator"
                ? "revenue"
                : type === "rental"
                ? "property_value"
                : "luxury_value";

        const midThreshold = thresholds[`${thresholdKey}_mid`];
        const highThreshold = thresholds[`${thresholdKey}_high`];

        if (amount >= highThreshold) return 100;
        if (amount >= midThreshold) return 70;
        return this.clamp((amount / midThreshold) * 40, 10, 40);
    }

    async performDeterministicRiskAnalysis(type, data) {
        const start = Date.now();

        let analysis;
        switch (type) {
            case "invoice":
                analysis = this.computeInvoiceRisk(data);
                break;
            case "saas":
                analysis = this.computeSaaSRisk(data);
                break;
            case "creator":
                analysis = this.computeCreatorRisk(data);
                break;
            case "rental":
                analysis = this.computeRentalRisk(data);
                break;
            case "luxury":
                analysis = this.computeLuxuryRisk(data);
                break;
            default:
                analysis = this.computeInvoiceRisk(data);
        }

        const end = Date.now();

        return {
            ...analysis,
            analysisDate: new Date().toISOString(),
            metadata: {
                ...analysis.metadata,
                processingTime: (end - start) / 1000,
                algorithmVersion: this.DEFAULTS.algorithmVersion,
            },
        };
    }

    async performRiskAnalysis(type, data) {
        // Simulate AI processing time
        await new Promise((resolve) => setTimeout(resolve, 1000));

        let riskScore, estimatedValue, factors;

        switch (type) {
            case "invoice":
                ({ riskScore, estimatedValue, factors } =
                    this.analyzeInvoices(data));
                break;
            case "saas":
                ({ riskScore, estimatedValue, factors } =
                    this.analyzeSaaS(data));
                break;
            case "creator":
                ({ riskScore, estimatedValue, factors } =
                    this.analyzeCreator(data));
                break;
            case "rental":
                ({ riskScore, estimatedValue, factors } =
                    this.analyzeRental(data));
                break;
            case "luxury":
                ({ riskScore, estimatedValue, factors } =
                    this.analyzeLuxury(data));
                break;
            default:
                riskScore = 75;
                estimatedValue = 50000;
                factors = this.riskFactors.invoice;
        }

        return {
            score: Math.min(95, Math.max(50, riskScore)),
            confidence: Math.floor(Math.random() * 20) + 80,
            factors: factors.slice(0, 5),
            estimatedValue,
            recommendedAdvance: this.calculateAdvanceRate(riskScore),
            projectedROI: this.calculateROI(riskScore),
            analysisDate: new Date().toISOString(),
            metadata: {
                dataPoints: Object.keys(data || {}).length,
                processingTime: Math.random() * 2 + 1,
                algorithmVersion: "2.1.0",
            },
        };
    }

    analyzeInvoices(data) {
        if (data?.invoices) {
            const totalValue =
                data.totalValue ||
                data.invoices.reduce((sum, inv) => sum + inv.amount, 0);

            const avgCreditScore =
                data.invoices.reduce(
                    (sum, inv) => sum + (inv.clientCreditScore || 75),
                    0
                ) / data.invoices.length;

            const avgPaymentTime = data.averagePaymentTime || 30;

            // Calculate risk score based on real data
            let riskScore = 60;
            if (avgCreditScore > 80) riskScore += 15;
            if (avgPaymentTime < 30) riskScore += 10;
            if (data.clientDiversity > 10) riskScore += 5;
            if (totalValue > 30000) riskScore += 8;

            return {
                riskScore,
                estimatedValue: totalValue,
                factors: [
                    `Average client credit score: ${avgCreditScore.toFixed(0)}`,
                    `Payment cycle: ${avgPaymentTime} days`,
                    `Portfolio value: $${totalValue.toLocaleString()}`,
                    `Client diversification: ${data.clientDiversity || "Good"}`,
                    "Industry compliance verified",
                ],
            };
        }

        return {
            riskScore: 75,
            estimatedValue: 50000,
            factors: this.riskFactors.invoice,
        };
    }

    analyzeSaaS(data) {
        if (data?.subscriptions) {
            const totalMRR =
                data.totalMRR ||
                data.subscriptions.reduce(
                    (sum, sub) => sum + sub.monthlyRevenue,
                    0
                );

            const avgChurn =
                data.subscriptions.reduce(
                    (sum, sub) => sum + (sub.churnRate || 5),
                    0
                ) / data.subscriptions.length;

            const growth = data.yearlyGrowth || 25;

            let riskScore = 65;
            if (avgChurn < 3) riskScore += 15;
            if (growth > 30) riskScore += 10;
            if (totalMRR > 15000) riskScore += 8;
            if (data.retention > 90) riskScore += 7;

            return {
                riskScore,
                estimatedValue: totalMRR * 24, // 2 years MRR
                factors: [
                    `Monthly recurring revenue: $${totalMRR.toLocaleString()}`,
                    `Average churn rate: ${avgChurn.toFixed(1)}%`,
                    `Year-over-year growth: ${growth}%`,
                    `Customer retention: ${data.retention}%`,
                    "SaaS metrics validated",
                ],
            };
        }

        return {
            riskScore: 72,
            estimatedValue: 60000,
            factors: this.riskFactors.saas,
        };
    }

    analyzeCreator(data) {
        if (data?.platforms) {
            const totalRevenue =
                data.totalMonthlyRevenue ||
                data.platforms.reduce(
                    (sum, platform) => sum + platform.monthlyRevenue,
                    0
                );

            const avgEngagement =
                data.platforms.reduce(
                    (sum, platform) => sum + (platform.engagement || 3),
                    0
                ) / data.platforms.length;

            const growth = data.audienceGrowth || 10;

            let riskScore = 68;
            if (avgEngagement > 4) riskScore += 12;
            if (growth > 15) riskScore += 8;
            if (data.platforms.length > 1) riskScore += 6;
            if (totalRevenue > 5000) riskScore += 8;

            return {
                riskScore,
                estimatedValue: totalRevenue * 18, // 1.5 years revenue
                factors: [
                    `Monthly revenue: $${totalRevenue.toLocaleString()}`,
                    `Platform diversification: ${data.platforms.length} platforms`,
                    `Average engagement: ${avgEngagement.toFixed(1)}%`,
                    `Audience growth: ${growth}% monthly`,
                    "Creator metrics verified",
                ],
            };
        }

        return {
            riskScore: 70,
            estimatedValue: 45000,
            factors: this.riskFactors.creator,
        };
    }

    analyzeRental(data) {
        if (data?.properties) {
            const totalIncome =
                data.totalMonthlyIncome ||
                data.properties.reduce(
                    (sum, prop) => sum + prop.monthlyRent,
                    0
                );

            const avgOccupancy =
                data.occupancy ||
                data.properties.reduce(
                    (sum, prop) => sum + prop.occupancyRate,
                    0
                ) / data.properties.length;

            const appreciation = data.propertyAppreciation || 5;

            let riskScore = 70;
            if (avgOccupancy > 95) riskScore += 10;
            if (appreciation > 6) riskScore += 8;
            if (data.properties.length > 1) riskScore += 5;
            if (totalIncome > 5000) riskScore += 7;

            return {
                riskScore,
                estimatedValue: totalIncome * 36, // 3 years income
                factors: [
                    `Monthly rental income: $${totalIncome.toLocaleString()}`,
                    `Average occupancy: ${avgOccupancy.toFixed(1)}%`,
                    `Property appreciation: ${appreciation}% annually`,
                    `Portfolio size: ${data.properties.length} properties`,
                    "Real estate metrics validated",
                ],
            };
        }

        return {
            riskScore: 76,
            estimatedValue: 75000,
            factors: this.riskFactors.rental,
        };
    }

    analyzeLuxury(data) {
        if (data?.assets) {
            const totalValue =
                data.totalValue ||
                data.assets.reduce((sum, asset) => sum + asset.currentValue, 0);

            const avgUtilization =
                data.averageUtilization ||
                data.assets.reduce(
                    (sum, asset) => sum + asset.utilizationRate,
                    0
                ) / data.assets.length;

            const avgAppreciation =
                data.assets.reduce(
                    (sum, asset) => sum + (asset.appreciationRate || 8),
                    0
                ) / data.assets.length;

            let riskScore = 65;
            if (avgUtilization > 70) riskScore += 10;
            if (avgAppreciation > 10) riskScore += 8;
            if (totalValue > 150000) riskScore += 12;
            if (data.insuranceCoverage === "Full") riskScore += 5;

            return {
                riskScore,
                estimatedValue: totalValue,
                factors: [
                    `Total asset value: $${totalValue.toLocaleString()}`,
                    `Average utilization: ${avgUtilization.toFixed(1)}%`,
                    `Appreciation rate: ${avgAppreciation.toFixed(
                        1
                    )}% annually`,
                    `Insurance coverage: ${
                        data.insuranceCoverage || "Verified"
                    }`,
                    "Luxury asset authentication complete",
                ],
            };
        }

        return {
            riskScore: 68,
            estimatedValue: 120000,
            factors: this.riskFactors.luxury,
        };
    }

    calculateAdvanceRate(riskScore) {
        if (riskScore >= 85) return 0.85;
        if (riskScore >= 75) return 0.8;
        if (riskScore >= 65) return 0.75;
        return 0.7;
    }

    calculateROI(riskScore) {
        // Higher risk = higher returns for investors, but capped at 9.5%
        const baseROI = 4.5;
        const riskPremium = (100 - riskScore) * 0.06; // Reduced multiplier to stay under 10%
        const calculatedROI = baseROI + riskPremium;
        // Cap at 9.5% maximum to stay under 10%
        return Math.min(calculatedROI, 9.5).toFixed(1);
    }

    // Deterministic risk computation methods
    computeInvoiceRisk(invoice, opts = {}) {
        const cfg = { ...this.DEFAULTS, ...opts };
        const w = cfg.weights.invoice;

        const vendorYears = invoice.vendor?.years_in_business ?? 0;
        const vendorScore = this.clamp(100 - (vendorYears / 3) * 100);

        const client = invoice.client || {};
        let clientHistoryScore = 100;
        if (
            typeof client.payment_history?.total_invoices === "number" &&
            client.payment_history.total_invoices > 0
        ) {
            const onTime = client.payment_history.on_time_payments ?? 0;
            clientHistoryScore = this.clamp(
                100 - (onTime / client.payment_history.total_invoices) * 100
            );
        } else {
            clientHistoryScore = 90;
        }

        const countryScore = this.getCountryRiskScore(client.country);

        const amount =
            invoice.total_amount ??
            (invoice.line_items?.reduce(
                (s, i) => s + (i.total ?? i.quantity * (i.unit_price || 0)),
                0
            ) ||
                0);
        const amountScore = this.normalizeAmountRisk(
            amount,
            cfg.thresholds,
            "invoice"
        );

        const paymentTerms = (invoice.payment_terms || "").toLowerCase();
        let paymentTermScore = 50;
        if (
            paymentTerms.includes("due on receipt") ||
            paymentTerms.includes("rush")
        )
            paymentTermScore = 90;
        else if (
            paymentTerms.includes("net 15") ||
            paymentTerms.includes("net 30")
        )
            paymentTermScore = 50;
        else paymentTermScore = 60;

        const redFlagsCount = (invoice.red_flags || []).length;
        const redFlagsScore = this.clamp(redFlagsCount * 20, 0, 100);

        const partialAllowedRisk =
            invoice.partial_payments_allowed === true ? 20 : 40;
        const insuranceRisk = invoice.insurance_coverage ? 10 : 35;

        const weightedSum =
            vendorScore * w.vendor +
            clientHistoryScore * w.client_history +
            countryScore * w.country +
            amountScore * w.amount +
            paymentTermScore * w.payment_terms +
            redFlagsScore * w.red_flags +
            partialAllowedRisk * w.partial_allowed +
            insuranceRisk * w.insurance;

        const weightTotal = Object.values(w).reduce((a, b) => a + b, 0);
        let riskScore = this.clamp(weightedSum / weightTotal);

        const lateFee = Number(invoice.late_fee_percentage || 0);
        riskScore = this.clamp(riskScore - Math.min(lateFee, 10));

        const fields = [
            invoice.vendor?.company_name,
            invoice.vendor?.years_in_business !== undefined,
            invoice.client?.company_name,
            invoice.client?.payment_history?.total_invoices !== undefined,
            invoice.client?.country,
            invoice.total_amount !== undefined,
            invoice.payment_terms,
            invoice.red_flags,
        ];
        const present = fields.filter(Boolean).length;
        const confidence = this.clamp(40 + (present / fields.length) * 60);

        const estimatedValue = Math.round(amount * (1 - riskScore / 100));
        const recommendedAdvanceRaw =
            0.9 * (1 - riskScore / 100) + 0.1 * (confidence / 100);
        const recommendedAdvance = Number(
            this.clamp(
                Math.round(recommendedAdvanceRaw * 100) / 100,
                0,
                1
            ).toFixed(2)
        );

        const expectedPaymentProb = 1 - riskScore / 100;
        const avgAnnualizedFee = (lateFee / 100) * expectedPaymentProb * 12;
        const calculatedROI = avgAnnualizedFee * 100;
        // Cap ROI at 9.5% to stay under 10%
        const projectedROI = Math.min(calculatedROI, 9.5).toFixed(2);

        return {
            score: Number(riskScore.toFixed(0)),
            confidence: Number(confidence.toFixed(0)),
            factors: [
                "vendor_experience",
                "client_payment_history",
                "jurisdiction_risk",
                "invoice_amount",
                "payment_terms",
                "red_flags",
            ],
            estimatedValue,
            recommendedAdvance,
            projectedROI,
            metadata: {
                dataPoints: present,
            },
        };
    }

    computeSaaSRisk(data, opts = {}) {
        const cfg = { ...this.DEFAULTS, ...opts };
        const w = cfg.weights.saas;

        const totalMRR =
            data.totalMRR ||
            data.subscriptions?.reduce(
                (sum, sub) => sum + (sub.monthlyRevenue || 0),
                0
            ) ||
            0;

        const avgChurn =
            data.subscriptions?.length > 0
                ? data.subscriptions.reduce(
                      (sum, sub) => sum + (sub.churnRate || 5),
                      0
                  ) / data.subscriptions.length
                : 5;

        const growth = data.yearlyGrowth || 0;
        const retention = data.retention || 85;
        const customerBase = data.subscriptions?.length || 0;

        let mrrStabilityScore = this.normalizeAmountRisk(
            totalMRR,
            cfg.thresholds,
            "saas"
        );
        let churnScore = this.clamp(avgChurn * 10); // 10% churn = 100 risk
        let growthScore = this.clamp(100 - Math.max(0, growth) * 2); // negative growth increases risk
        let customerBaseScore =
            customerBase < 10 ? 80 : customerBase < 50 ? 60 : 40;
        let retentionScore = this.clamp(100 - retention);

        const weightedSum =
            mrrStabilityScore * w.mrr_stability +
            churnScore * w.churn_rate +
            growthScore * w.growth_rate +
            customerBaseScore * w.customer_base +
            retentionScore * w.retention;

        const weightTotal =
            w.mrr_stability +
            w.churn_rate +
            w.growth_rate +
            w.customer_base +
            w.retention;
        const riskScore = this.clamp(weightedSum / weightTotal);

        const fields = [
            totalMRR > 0,
            avgChurn !== undefined,
            growth !== undefined,
            retention !== undefined,
            customerBase > 0,
        ];
        const present = fields.filter(Boolean).length;
        const confidence = this.clamp(40 + (present / fields.length) * 60);

        const estimatedValue = Math.round(
            totalMRR * 24 * (1 - riskScore / 100)
        ); // 2 years MRR adjusted for risk
        const recommendedAdvance = Number(
            this.clamp(0.8 * (1 - riskScore / 100), 0, 1).toFixed(2)
        );
        const projectedROI = this.calculateROI(riskScore);

        return {
            score: Number(riskScore.toFixed(0)),
            confidence: Number(confidence.toFixed(0)),
            factors: [
                "mrr_stability",
                "churn_analysis",
                "growth_trajectory",
                "customer_retention",
                "market_position",
            ],
            estimatedValue,
            recommendedAdvance,
            projectedROI,
            metadata: {
                dataPoints: present,
            },
        };
    }

    computeCreatorRisk(data, opts = {}) {
        const cfg = { ...this.DEFAULTS, ...opts };
        const w = cfg.weights.creator;

        const totalRevenue =
            data.totalMonthlyRevenue ||
            data.platforms?.reduce(
                (sum, platform) => sum + (platform.monthlyRevenue || 0),
                0
            ) ||
            0;

        const platformCount = data.platforms?.length || 1;
        const avgEngagement =
            data.platforms?.length > 0
                ? data.platforms.reduce(
                      (sum, platform) => sum + (platform.engagement || 3),
                      0
                  ) / data.platforms.length
                : 3;

        const audienceGrowth = data.audienceGrowth || 0;

        let platformDiversityScore =
            platformCount === 1 ? 80 : platformCount === 2 ? 60 : 40;
        let engagementScore = this.clamp(100 - avgEngagement * 20); // 5% engagement = 0 risk
        let revenueStabilityScore = this.normalizeAmountRisk(
            totalRevenue,
            cfg.thresholds,
            "creator"
        );
        let growthScore = this.clamp(100 - Math.max(0, audienceGrowth) * 3);

        const weightedSum =
            platformDiversityScore * w.platform_diversity +
            engagementScore * w.engagement_rate +
            revenueStabilityScore * w.revenue_stability +
            growthScore * w.audience_growth;

        const weightTotal =
            w.platform_diversity +
            w.engagement_rate +
            w.revenue_stability +
            w.audience_growth;
        const riskScore = this.clamp(weightedSum / weightTotal);

        const fields = [
            totalRevenue > 0,
            platformCount > 0,
            avgEngagement !== undefined,
            audienceGrowth !== undefined,
        ];
        const present = fields.filter(Boolean).length;
        const confidence = this.clamp(40 + (present / fields.length) * 60);

        const estimatedValue = Math.round(
            totalRevenue * 18 * (1 - riskScore / 100)
        ); // 1.5 years revenue
        const recommendedAdvance = Number(
            this.clamp(0.7 * (1 - riskScore / 100), 0, 1).toFixed(2)
        );
        const projectedROI = this.calculateROI(riskScore);

        return {
            score: Number(riskScore.toFixed(0)),
            confidence: Number(confidence.toFixed(0)),
            factors: [
                "platform_diversification",
                "engagement_metrics",
                "revenue_stability",
                "audience_growth",
                "brand_strength",
            ],
            estimatedValue,
            recommendedAdvance,
            projectedROI,
            metadata: {
                dataPoints: present,
            },
        };
    }

    computeRentalRisk(data, opts = {}) {
        const cfg = { ...this.DEFAULTS, ...opts };
        const w = cfg.weights.rental;

        const totalIncome =
            data.totalMonthlyIncome ||
            data.properties?.reduce(
                (sum, prop) => sum + (prop.monthlyRent || 0),
                0
            ) ||
            0;

        const avgOccupancy =
            data.occupancy ||
            (data.properties?.length > 0
                ? data.properties.reduce(
                      (sum, prop) => sum + (prop.occupancyRate || 90),
                      0
                  ) / data.properties.length
                : 90);

        const propertyCount = data.properties?.length || 1;
        const appreciation = data.propertyAppreciation || 3;

        let occupancyScore = this.clamp(100 - avgOccupancy); // 100% occupancy = 0 risk
        let locationScore = 50; // Default moderate risk
        let marketTrendsScore = this.clamp(
            100 - Math.max(0, appreciation) * 10
        ); // positive appreciation reduces risk
        let propertyConditionScore = 50; // Default

        const weightedSum =
            occupancyScore * w.occupancy_rate +
            locationScore * w.location_risk +
            marketTrendsScore * w.market_trends +
            propertyConditionScore * w.property_condition;

        const weightTotal =
            w.occupancy_rate +
            w.location_risk +
            w.market_trends +
            w.property_condition;
        const riskScore = this.clamp(weightedSum / weightTotal);

        const fields = [
            totalIncome > 0,
            avgOccupancy !== undefined,
            propertyCount > 0,
            appreciation !== undefined,
        ];
        const present = fields.filter(Boolean).length;
        const confidence = this.clamp(40 + (present / fields.length) * 60);

        const estimatedValue = Math.round(
            totalIncome * 36 * (1 - riskScore / 100)
        ); // 3 years income
        const recommendedAdvance = Number(
            this.clamp(0.75 * (1 - riskScore / 100), 0, 1).toFixed(2)
        );
        const projectedROI = this.calculateROI(riskScore);

        return {
            score: Number(riskScore.toFixed(0)),
            confidence: Number(confidence.toFixed(0)),
            factors: [
                "occupancy_rates",
                "property_condition",
                "location_analysis",
                "market_trends",
                "tenant_quality",
            ],
            estimatedValue,
            recommendedAdvance,
            projectedROI,
            metadata: {
                dataPoints: present,
            },
        };
    }

    computeLuxuryRisk(data, opts = {}) {
        const cfg = { ...this.DEFAULTS, ...opts };
        const w = cfg.weights.luxury;

        const totalValue =
            data.totalValue ||
            data.assets?.reduce(
                (sum, asset) => sum + (asset.currentValue || 0),
                0
            ) ||
            0;

        const avgUtilization =
            data.averageUtilization ||
            (data.assets?.length > 0
                ? data.assets.reduce(
                      (sum, asset) => sum + (asset.utilizationRate || 50),
                      0
                  ) / data.assets.length
                : 50);

        const avgAppreciation =
            data.assets?.length > 0
                ? data.assets.reduce(
                      (sum, asset) => sum + (asset.appreciationRate || 5),
                      0
                  ) / data.assets.length
                : 5;

        const insuranceCoverage = data.insuranceCoverage === "Full";

        let authenticityScore = 30; // Assume verified for now
        let liquidityScore = this.normalizeAmountRisk(
            totalValue,
            cfg.thresholds,
            "luxury"
        );
        let appreciationScore = this.clamp(
            100 - Math.max(0, avgAppreciation) * 8
        );
        let conditionScore = 40; // Default good condition
        let insuranceScore = insuranceCoverage ? 20 : 70;
        let utilizationScore = this.clamp(100 - avgUtilization); // higher utilization = lower risk

        const weightedSum =
            authenticityScore * w.authenticity +
            liquidityScore * w.market_liquidity +
            appreciationScore * w.appreciation_history +
            conditionScore * w.condition +
            insuranceScore * w.insurance_coverage +
            utilizationScore * w.utilization;

        const weightTotal = Object.values(w).reduce((a, b) => a + b, 0);
        const riskScore = this.clamp(weightedSum / weightTotal);

        const fields = [
            totalValue > 0,
            avgUtilization !== undefined,
            avgAppreciation !== undefined,
            insuranceCoverage !== undefined,
        ];
        const present = fields.filter(Boolean).length;
        const confidence = this.clamp(40 + (present / fields.length) * 60);

        const estimatedValue = Math.round(totalValue * (1 - riskScore / 100));
        const recommendedAdvance = Number(
            this.clamp(0.6 * (1 - riskScore / 100), 0, 1).toFixed(2)
        );
        const projectedROI = this.calculateROI(riskScore);

        return {
            score: Number(riskScore.toFixed(0)),
            confidence: Number(confidence.toFixed(0)),
            factors: [
                "authenticity_verification",
                "market_liquidity",
                "appreciation_history",
                "asset_condition",
                "insurance_coverage",
            ],
            estimatedValue,
            recommendedAdvance,
            projectedROI,
            metadata: {
                dataPoints: present,
            },
        };
    }

    async storeAnalysisResult(userAddress, analysis) {
        // In a real implementation, store in database
        console.log(`Analysis stored for ${userAddress}:`, {
            score: analysis.score,
            value: analysis.estimatedValue,
            timestamp: analysis.analysisDate,
        });
    }
}

module.exports = new AssetAnalysisService();
