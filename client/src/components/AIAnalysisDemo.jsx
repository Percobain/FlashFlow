import React, { useState } from "react";
import { motion } from "framer-motion";
import { Zap, Brain, CheckCircle, AlertCircle } from "lucide-react";
import NBButton from "./NBButton";
import NBCard from "./NBCard";
import backendService from "../services/backendService";

const AIAnalysisDemo = () => {
    const [analyzing, setAnalyzing] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    const sampleData = {
        invoice: {
            invoice_id: "INV-DEMO-001",
            total_amount: 45000,
            vendor: {
                company_name: "Demo Tech Solutions",
                years_in_business: 3,
            },
            client: {
                company_name: "Sample Corp",
                country: "United States",
            },
            payment_terms: "Net 30",
            red_flags: ["New client relationship"],
        },
    };

    const runAIAnalysis = async () => {
        setAnalyzing(true);
        setError(null);
        setResult(null);

        try {
            const analysisResult = await backendService.analyzeAssetWithAI({
                type: "invoice",
                data: sampleData.invoice,
                userAddress: "0xDemo...Address",
            });

            setResult(analysisResult);
        } catch (err) {
            console.error("AI Analysis Demo failed:", err);
            setError(err.message);
        } finally {
            setAnalyzing(false);
        }
    };

    return (
        <NBCard className="max-w-2xl mx-auto">
            <div className="space-y-6">
                <div className="text-center">
                    <div className="flex items-center justify-center space-x-2 mb-4">
                        <Brain className="text-nb-accent" size={24} />
                        <h3 className="font-display font-bold text-xl">
                            AI Analysis Demo
                        </h3>
                    </div>
                    <p className="text-nb-ink/70">
                        See our GPT-4 powered risk analysis in action with
                        sample invoice data
                    </p>
                </div>

                {/* Sample Data Preview */}
                <div className="bg-nb-ink/5 rounded-nb p-4">
                    <h4 className="font-semibold mb-2">Sample Invoice Data:</h4>
                    <div className="text-sm space-y-1">
                        <div>Invoice: {sampleData.invoice.invoice_id}</div>
                        <div>
                            Amount: $
                            {sampleData.invoice.total_amount.toLocaleString()}
                        </div>
                        <div>
                            Vendor: {sampleData.invoice.vendor.company_name}
                        </div>
                        <div>
                            Client: {sampleData.invoice.client.company_name}
                        </div>
                        <div>Terms: {sampleData.invoice.payment_terms}</div>
                    </div>
                </div>

                {/* Analysis Button */}
                <div className="text-center">
                    <NBButton
                        onClick={runAIAnalysis}
                        disabled={analyzing}
                        className="flex items-center space-x-2"
                    >
                        {analyzing ? (
                            <>
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{
                                        duration: 1,
                                        repeat: Infinity,
                                        ease: "linear",
                                    }}
                                >
                                    <Zap size={16} />
                                </motion.div>
                                <span>AI Analyzing...</span>
                            </>
                        ) : (
                            <>
                                <Brain size={16} />
                                <span>Run AI Analysis</span>
                            </>
                        )}
                    </NBButton>
                </div>

                {/* Analysis Result */}
                {result && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                    >
                        <div className="flex items-center space-x-2 text-nb-ok">
                            <CheckCircle size={20} />
                            <span className="font-semibold">
                                Analysis Complete!
                            </span>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <h5 className="font-semibold">Risk Metrics</h5>
                                <div className="text-sm space-y-1">
                                    <div>
                                        Risk Score:{" "}
                                        <span className="font-bold">
                                            {result.analysis?.score}/100
                                        </span>
                                    </div>
                                    <div>
                                        Confidence:{" "}
                                        <span className="font-bold">
                                            {result.analysis?.confidence}%
                                        </span>
                                    </div>
                                    <div>
                                        Estimated Value:{" "}
                                        <span className="font-bold">
                                            $
                                            {result.analysis?.estimatedValue?.toLocaleString()}
                                        </span>
                                    </div>
                                    <div>
                                        Recommended Advance:{" "}
                                        <span className="font-bold">
                                            {(
                                                result.analysis
                                                    ?.recommendedAdvance * 100
                                            ).toFixed(1)}
                                            %
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h5 className="font-semibold">
                                    AI Enhancement
                                </h5>
                                <div className="text-sm space-y-1">
                                    <div>
                                        AI Enhanced:{" "}
                                        <span className="font-bold text-nb-accent">
                                            {result.analysis?.aiEnhanced
                                                ? "Yes"
                                                : "No"}
                                        </span>
                                    </div>
                                    <div>
                                        Processing Time:{" "}
                                        <span className="font-bold">
                                            {
                                                result.analysis?.metadata
                                                    ?.processingTime
                                            }
                                            s
                                        </span>
                                    </div>
                                    <div>
                                        Algorithm:{" "}
                                        <span className="font-bold">
                                            {
                                                result.analysis?.metadata
                                                    ?.algorithmVersion
                                            }
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {result.analysis?.aiSummary && (
                            <div className="bg-nb-accent/10 rounded-nb p-4">
                                <h5 className="font-semibold mb-2">
                                    AI Executive Summary:
                                </h5>
                                <p className="text-sm">
                                    {result.analysis.aiSummary}
                                </p>
                            </div>
                        )}
                    </motion.div>
                )}

                {/* Error Display */}
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center space-x-2 text-nb-error bg-nb-error/10 rounded-nb p-4"
                    >
                        <AlertCircle size={20} />
                        <div>
                            <div className="font-semibold">Analysis Failed</div>
                            <div className="text-sm">{error}</div>
                        </div>
                    </motion.div>
                )}
            </div>
        </NBCard>
    );
};

export default AIAnalysisDemo;
