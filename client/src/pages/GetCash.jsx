import React, { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Zap, Shield, TrendingUp } from "lucide-react";
import TokenizationWizard from "../components/TokenizationWizard";
import NBButton from "../components/NBButton";
import NBCard from "../components/NBCard";
import AIAnalysisDemo from "../components/AIAnalysisDemo";
import useAppStore from "../stores/appStore";

const GetCash = () => {
    const [showWizard, setShowWizard] = useState(false);
    const [selectedType, setSelectedType] = useState(null);
    const { resetCurrentFlow, addNotification } = useAppStore();

    const useCases = [
        {
            id: "invoice",
            title: "Invoice Factoring",
            description: "Convert B2B invoices into immediate cash flow",
            icon: "📄",
            color: "nb-accent",
            features: [
                "Same-day funding",
                "90% advance rate",
                "No hidden fees",
            ],
            avgAmount: "$45K",
            avgAPY: "6.2%",
        },
        {
            id: "saas",
            title: "SaaS MRR Financing",
            description: "Monetize monthly recurring revenue streams",
            icon: "💻",
            color: "nb-accent-2",
            features: [
                "6-12x MRR available",
                "Growth-friendly terms",
                "No equity required",
            ],
            avgAmount: "$120K",
            avgAPY: "7.8%",
        },
        {
            id: "creator",
            title: "Creator Lineups",
            description: "Fund content creators and influencers",
            icon: "🎨",
            color: "nb-purple",
            features: [
                "Platform agnostic",
                "Revenue-based funding",
                "Creator-friendly",
            ],
            avgAmount: "$25K",
            avgAPY: "8.5%",
        },
        {
            id: "rental",
            title: "Rental Income Streams",
            description: "Tokenize real estate rental cash flows",
            icon: "🏠",
            color: "nb-ok",
            features: [
                "Property-backed",
                "Stable returns",
                "Geographic diversity",
            ],
            avgAmount: "$180K",
            avgAPY: "5.7%",
        },
        {
            id: "luxury",
            title: "Luxury Asset Leases",
            description: "High-value asset lease monetization",
            icon: "💎",
            color: "nb-pink",
            features: [
                "Premium assets",
                "Exclusive access",
                "High-yield potential",
            ],
            avgAmount: "$350K",
            avgAPY: "8.9%",
        },
    ];

    const startFlow = (type) => {
        resetCurrentFlow();
        setSelectedType(type);
        setShowWizard(true);
    };

    const handleComplete = (flowData) => {
        setShowWizard(false);
        addNotification({
            type: "success",
            title: "Tokenization Complete!",
            description: `Your ${flowData.type} cash flow has been successfully tokenized.`,
        });
    };

    const handleCancel = () => {
        setShowWizard(false);
        setSelectedType(null);
        resetCurrentFlow();
    };

    if (showWizard) {
        return (
            <div className="min-h-screen py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <TokenizationWizard
                        type={selectedType}
                        onComplete={handleComplete}
                        onCancel={handleCancel}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Hero Section */}
                <motion.div
                    className="text-center mb-16"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <h1 className="font-display font-bold text-5xl md:text-6xl text-nb-ink mb-6">
                        Get Cash{" "}
                        <span className="text-transparent bg-gradient-to-r from-nb-accent to-nb-accent-2 bg-clip-text">
                            Now
                        </span>
                    </h1>
                    <p className="text-xl text-nb-ink/70 mb-8 max-w-3xl mx-auto">
                        Transform your future cash flows into immediate capital.
                        Choose your revenue type and get personalized offers
                        powered by{" "}
                        <span className="font-semibold text-nb-accent">
                            GPT-4 AI risk scoring
                        </span>
                        .
                    </p>

                    <div className="flex flex-wrap justify-center gap-8 mb-12">
                        <div className="flex items-center space-x-2">
                            <Zap className="text-nb-accent" size={20} />
                            <span className="font-semibold">
                                GPT-4 AI Analysis
                            </span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Shield className="text-nb-ok" size={20} />
                            <span className="font-semibold">
                                Secure & Verified
                            </span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <TrendingUp
                                className="text-nb-accent-2"
                                size={20}
                            />
                            <span className="font-semibold">
                                Competitive Rates
                            </span>
                        </div>
                    </div>
                </motion.div>

                {/* Use Case Selection */}
                <motion.div
                    className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    {useCases.map((useCase, index) => (
                        <motion.div
                            key={useCase.id}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <NBCard className="h-full">
                                <div className="space-y-4">
                                    {/* Header */}
                                    <div className="flex items-start justify-between">
                                        <div
                                            className={`w-12 h-12 bg-${useCase.color} rounded-nb flex items-center justify-center text-2xl`}
                                        >
                                            {useCase.icon}
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs text-nb-ink/60">
                                                Avg Amount
                                            </div>
                                            <div className="font-bold">
                                                {useCase.avgAmount}
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="font-display font-bold text-xl text-nb-ink mb-2">
                                            {useCase.title}
                                        </h3>
                                        <p className="text-nb-ink/70 text-sm">
                                            {useCase.description}
                                        </p>
                                    </div>

                                    {/* Features */}
                                    <div className="space-y-2">
                                        {useCase.features.map(
                                            (feature, idx) => (
                                                <div
                                                    key={idx}
                                                    className="flex items-center space-x-2 text-sm"
                                                >
                                                    <div className="w-1.5 h-1.5 bg-nb-ok rounded-full"></div>
                                                    <span>{feature}</span>
                                                </div>
                                            )
                                        )}
                                    </div>

                                    {/* Stats */}
                                    <div className="flex justify-between items-center pt-4 border-t border-nb-ink/10">
                                        <div>
                                            <div className="text-xs text-nb-ink/60">
                                                Avg APY
                                            </div>
                                            <div
                                                className={`font-bold text-${useCase.color.replace(
                                                    "nb-",
                                                    ""
                                                )}`}
                                            >
                                                {useCase.avgAPY}
                                            </div>
                                        </div>
                                        <NBButton
                                            size="sm"
                                            onClick={() =>
                                                startFlow(useCase.id)
                                            }
                                            className="flex items-center space-x-1"
                                        >
                                            <span>Start</span>
                                            <ArrowRight size={14} />
                                        </NBButton>
                                    </div>
                                </div>
                            </NBCard>
                        </motion.div>
                    ))}
                </motion.div>

                {/* Process Overview */}
                <motion.div
                    className="text-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                >
                    <h2 className="font-display font-bold text-3xl text-nb-ink mb-8">
                        How It Works
                    </h2>

                    <div className="grid md:grid-cols-4 gap-6">
                        {[
                            {
                                step: "1",
                                title: "Connect",
                                description: "Link your revenue source",
                                icon: "🔗",
                            },
                            {
                                step: "2",
                                title: "AI Analysis",
                                description:
                                    "GPT-4 evaluates & enhances your data",
                                icon: "🤖",
                            },
                            {
                                step: "3",
                                title: "Offer",
                                description: "Get personalized terms",
                                icon: "💰",
                            },
                            {
                                step: "4",
                                title: "Fund",
                                description: "Receive instant capital",
                                icon: "⚡",
                            },
                        ].map((item, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6 + index * 0.1 }}
                            >
                                <NBCard hover={false}>
                                    <div className="text-center">
                                        <div className="text-4xl mb-3">
                                            {item.icon}
                                        </div>
                                        <div className="text-2xl font-display font-bold text-nb-accent mb-2">
                                            {item.step}
                                        </div>
                                        <h3 className="font-bold text-lg mb-2">
                                            {item.title}
                                        </h3>
                                        <p className="text-sm text-nb-ink/70">
                                            {item.description}
                                        </p>
                                    </div>
                                </NBCard>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* AI Analysis Demo */}
                <motion.div
                    className="mt-20"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                >
                    <div className="text-center mb-12">
                        <h2 className="font-display font-bold text-3xl text-nb-ink mb-4">
                            Experience AI-Powered Analysis
                        </h2>
                        <p className="text-lg text-nb-ink/70 max-w-2xl mx-auto">
                            See how our GPT-4 enhanced system analyzes and
                            validates your cash flow data in real-time
                        </p>
                    </div>

                    <AIAnalysisDemo />
                </motion.div>
            </div>
        </div>
    );
};

export default GetCash;
