import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
    TrendingUp,
    DollarSign,
    Calendar,
    PieChart,
    Bell,
    Eye,
    Download,
    Filter,
    ArrowUpRight,
    Clock,
    CheckCircle,
    AlertTriangle,
    Target,
    Shield,
    Zap,
    Activity,
    BarChart3,
    Wallet,
    TrendingDown,
    Sparkles,
    Users,
    Award,
} from "lucide-react";
import NBButton from "../components/NBButton";
import NBCard from "../components/NBCard";
import StatPill from "../components/StatPill";
import RiskScoreBadge from "../components/RiskScoreBadge";
import MetricsCard from "../components/MetricsCard";
import PortfolioChart from "../components/charts/PortfolioChart";
import AssetAllocationChart from "../components/charts/AssetAllocationChart";
import PayoutTrendsChart from "../components/charts/PayoutTrendsChart";
import RiskMetricsChart from "../components/charts/RiskMetricsChart";
import analyticsService from "../services/analyticsService";
import payoutService from "../services/payoutService";
import didService from "../services/didService";
import useAppStore from "../stores/appStore";

const Dashboard = () => {
    const { user } = useAppStore();
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("overview");
    const [dashboardData, setDashboardData] = useState(null);
    const [performancePeriod, setPerformancePeriod] = useState("12m");

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            const [overview, payouts] = await Promise.all([
                analyticsService.getDashboardOverview(),
                payoutService.getPayoutHistory(user.address),
            ]);

            setDashboardData({
                ...overview,
                payoutHistory: payouts.payouts || [],
            });
        } catch (error) {
            console.error("Failed to load dashboard data:", error);
            // Fallback to mock data
            setDashboardData({
                portfolioValue: 45780,
                totalInvested: 42000,
                totalReturns: 3780,
                returnsPct: 9.0,
                activePositions: 3,
                monthlyIncome: 1247,
                nextPayout: {
                    amount: 342,
                    date: "2025-02-15",
                    source: "Premium Yield",
                },
                performance: [
                    {
                        date: "2024-02",
                        value: 38000,
                        returns: -4000,
                        returnsPct: "-9.52",
                    },
                    {
                        date: "2024-03",
                        value: 39500,
                        returns: -2500,
                        returnsPct: "-5.95",
                    },
                    {
                        date: "2024-04",
                        value: 41200,
                        returns: -800,
                        returnsPct: "-1.90",
                    },
                    {
                        date: "2024-05",
                        value: 43800,
                        returns: 1800,
                        returnsPct: "4.29",
                    },
                    {
                        date: "2024-06",
                        value: 45100,
                        returns: 3100,
                        returnsPct: "7.38",
                    },
                    {
                        date: "2025-01",
                        value: 45780,
                        returns: 3780,
                        returnsPct: "9.00",
                    },
                ],
                assetAllocation: [
                    {
                        name: "Stable Income Plus",
                        value: 35,
                        amount: 16200,
                        color: "#10B981",
                        apy: 9.2,
                    },
                    {
                        name: "Growth Accelerator",
                        value: 28,
                        amount: 13100,
                        color: "#6366F1",
                        apy: 12.8,
                    },
                    {
                        name: "Premium Yield",
                        value: 32,
                        amount: 16480,
                        color: "#F59E0B",
                        apy: 14.5,
                    },
                    {
                        name: "Cash Reserve",
                        value: 5,
                        amount: 2300,
                        color: "#6B7280",
                        apy: 2.1,
                    },
                ],
                riskMetrics: {
                    portfolioRisk: 72,
                    riskExposure: [
                        { name: "Low Risk", value: 35, color: "#10B981" },
                        { name: "Medium Risk", value: 45, color: "#F59E0B" },
                        { name: "High Risk", value: 20, color: "#EF4444" },
                    ],
                },
                payoutTrends: [
                    { month: "2024-02", amount: 850, count: 3 },
                    { month: "2024-03", amount: 920, count: 4 },
                    { month: "2024-04", amount: 1100, count: 4 },
                    { month: "2024-05", amount: 1180, count: 5 },
                    { month: "2024-06", amount: 1247, count: 4 },
                    { month: "2025-01", amount: 1340, count: 5 },
                ],
                topPerformers: [
                    {
                        id: "basket_12",
                        name: "Premium Yield",
                        performance: 18.7,
                        value: 16480,
                        change: "+2.3%",
                        trend: "up",
                    },
                    {
                        id: "basket_5",
                        name: "Growth Accelerator",
                        performance: 15.2,
                        value: 13100,
                        change: "+1.8%",
                        trend: "up",
                    },
                    {
                        id: "basket_1",
                        name: "Stable Income Plus",
                        performance: 12.1,
                        value: 16200,
                        change: "+0.9%",
                        trend: "up",
                    },
                ],
                marketInsights: {
                    marketSentiment: "Bullish",
                    confidenceScore: 78,
                    keyTrends: [
                        "DeFi yields trending upward (+2.3% this week)",
                        "Stable coin demand increasing across platforms",
                        "Risk-adjusted returns showing strong performance",
                    ],
                },
                payoutHistory: [],
                notifications: [
                    {
                        id: 1,
                        type: "payout",
                        title: "Payout Received",
                        message: "$342 from Premium Yield",
                        time: "2 hours ago",
                    },
                    {
                        id: 2,
                        type: "risk",
                        title: "Risk Score Update",
                        message: "Portfolio risk improved to 72",
                        time: "1 day ago",
                    },
                    {
                        id: 3,
                        type: "investment",
                        title: "New Opportunity",
                        message: "High-yield basket available",
                        time: "3 days ago",
                    },
                ],
            });
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin w-8 h-8 border-4 border-nb-accent border-t-transparent rounded-full"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (!dashboardData) return null;

    return (
        <div className="min-h-screen py-12 bg-gradient-to-br from-nb-accent/5 via-white to-nb-accent-2/5">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <motion.div
                    className="mb-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h1 className="font-display font-bold text-4xl text-nb-ink mb-2 flex items-center">
                                <Sparkles
                                    className="mr-3 text-nb-accent"
                                    size={32}
                                />
                                Portfolio Dashboard
                            </h1>
                            <p className="text-xl text-nb-ink/70">
                                Welcome back! Your investments are performing
                                exceptionally well.
                            </p>
                        </div>
                        <div className="flex space-x-3">
                            <Link to="/invest">
                                <NBButton variant="outline">
                                    <ArrowUpRight size={16} className="mr-2" />
                                    Explore Investments
                                </NBButton>
                            </Link>
                            <Link to="/get-cash">
                                <NBButton>
                                    <DollarSign size={16} className="mr-2" />
                                    Get Cash
                                </NBButton>
                            </Link>
                        </div>
                    </div>

                    {/* Key Metrics Cards */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <MetricsCard
                            title="Portfolio Value"
                            value={`$${dashboardData.portfolioValue.toLocaleString()}`}
                            change={dashboardData.returnsPct}
                            icon={Wallet}
                            color="nb-accent"
                            subtitle="Total investment value"
                        />
                        <MetricsCard
                            title="Total Returns"
                            value={`$${dashboardData.totalReturns.toLocaleString()}`}
                            change={12.4}
                            icon={TrendingUp}
                            color="nb-ok"
                            subtitle="Profit from investments"
                        />
                        <MetricsCard
                            title="Monthly Income"
                            value={`$${dashboardData.monthlyIncome.toLocaleString()}`}
                            change={8.7}
                            icon={Calendar}
                            color="nb-accent-2"
                            subtitle="Average monthly payouts"
                        />
                        <MetricsCard
                            title="DID Reputation"
                            value={user.reputation || "85"}
                            change={2.1}
                            icon={Award}
                            color="nb-purple"
                            subtitle="Trust score"
                        />
                    </div>
                </motion.div>

                {/* Tabs */}
                <motion.div
                    className="mb-8"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <div className="flex space-x-1 p-1 bg-white/80 backdrop-blur-sm rounded-nb border border-nb-ink/10 w-fit">
                        {[
                            {
                                id: "overview",
                                label: "Overview",
                                icon: BarChart3,
                            },
                            {
                                id: "analytics",
                                label: "Analytics",
                                icon: Activity,
                            },
                            {
                                id: "positions",
                                label: "Positions",
                                icon: PieChart,
                            },
                            { id: "payouts", label: "Payouts", icon: Calendar },
                            { id: "insights", label: "Insights", icon: Target },
                        ].map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center space-x-2 px-4 py-3 rounded-lg transition-all duration-200 ${
                                        activeTab === tab.id
                                            ? "bg-nb-accent text-white font-semibold shadow-md"
                                            : "text-nb-ink/70 hover:text-nb-ink hover:bg-nb-accent/10"
                                    }`}
                                >
                                    <Icon size={16} />
                                    <span>{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </motion.div>

                {/* Tab Content */}
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    {activeTab === "overview" && (
                        <div className="grid lg:grid-cols-3 gap-6">
                            {/* Portfolio Performance Chart */}
                            <div className="lg:col-span-2">
                                <NBCard className="h-full">
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="font-bold text-xl">
                                            Portfolio Performance
                                        </h3>
                                        <div className="flex space-x-2">
                                            {["3m", "6m", "12m"].map(
                                                (period) => (
                                                    <button
                                                        key={period}
                                                        onClick={() =>
                                                            setPerformancePeriod(
                                                                period
                                                            )
                                                        }
                                                        className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                                                            performancePeriod ===
                                                            period
                                                                ? "bg-nb-accent text-white"
                                                                : "text-nb-ink/60 hover:bg-nb-accent/10"
                                                        }`}
                                                    >
                                                        {period.toUpperCase()}
                                                    </button>
                                                )
                                            )}
                                        </div>
                                    </div>
                                    <PortfolioChart
                                        data={dashboardData.performance}
                                        height={350}
                                    />
                                </NBCard>
                            </div>

                            {/* Side Panel */}
                            <div className="space-y-6">
                                {/* Next Payout */}
                                <NBCard>
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="font-bold text-lg">
                                            Next Payout
                                        </h3>
                                        <Clock
                                            className="text-nb-accent"
                                            size={20}
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <div className="text-center p-4 bg-nb-accent/10 rounded-lg">
                                            <div className="text-2xl font-bold text-nb-accent">
                                                $
                                                {
                                                    dashboardData.nextPayout
                                                        .amount
                                                }
                                            </div>
                                            <div className="text-sm text-nb-ink/60">
                                                from{" "}
                                                {
                                                    dashboardData.nextPayout
                                                        .source
                                                }
                                            </div>
                                            <div className="text-xs text-nb-ink/50 mt-1">
                                                Due:{" "}
                                                {new Date(
                                                    dashboardData.nextPayout.date
                                                ).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>
                                </NBCard>

                                {/* Top Performers */}
                                <NBCard>
                                    <h3 className="font-bold text-lg mb-4">
                                        Top Performers
                                    </h3>
                                    <div className="space-y-3">
                                        {dashboardData.topPerformers.map(
                                            (performer, index) => (
                                                <div
                                                    key={performer.id}
                                                    className="flex justify-between items-center p-3 bg-nb-ink/5 rounded-lg"
                                                >
                                                    <div className="flex items-center space-x-3">
                                                        <div className="w-8 h-8 bg-nb-accent/20 rounded-full flex items-center justify-center">
                                                            <span className="text-xs font-bold text-nb-accent">
                                                                #{index + 1}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <div className="font-medium text-sm">
                                                                {performer.name}
                                                            </div>
                                                            <div className="text-xs text-nb-ink/60">
                                                                $
                                                                {performer.value.toLocaleString()}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="font-semibold text-nb-ok">
                                                            {performer.change}
                                                        </div>
                                                        <div className="text-xs text-nb-ink/60">
                                                            {
                                                                performer.performance
                                                            }
                                                            % APY
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        )}
                                    </div>
                                </NBCard>
                            </div>
                        </div>
                    )}

                    {activeTab === "analytics" && (
                        <div className="grid lg:grid-cols-2 gap-6">
                            {/* Asset Allocation */}
                            <NBCard>
                                <h3 className="font-bold text-xl mb-6">
                                    Asset Allocation
                                </h3>
                                <AssetAllocationChart
                                    data={dashboardData.assetAllocation}
                                    height={300}
                                />
                            </NBCard>

                            {/* Risk Metrics */}
                            <NBCard>
                                <h3 className="font-bold text-xl mb-6">
                                    Risk Analysis
                                </h3>
                                <RiskMetricsChart
                                    riskScore={
                                        dashboardData.riskMetrics.portfolioRisk
                                    }
                                    riskExposure={
                                        dashboardData.riskMetrics.riskExposure
                                    }
                                    height={300}
                                />
                            </NBCard>

                            {/* Payout Trends */}
                            <div className="lg:col-span-2">
                                <NBCard>
                                    <h3 className="font-bold text-xl mb-6">
                                        Payout Trends
                                    </h3>
                                    <PayoutTrendsChart
                                        data={dashboardData.payoutTrends}
                                        height={300}
                                    />
                                </NBCard>
                            </div>
                        </div>
                    )}

                    {activeTab === "positions" && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h2 className="font-bold text-2xl">
                                    Active Positions
                                </h2>
                                <div className="flex space-x-2">
                                    <NBButton variant="outline" size="sm">
                                        <Filter size={14} className="mr-1" />
                                        Filter
                                    </NBButton>
                                    <NBButton variant="outline" size="sm">
                                        <Download size={14} className="mr-1" />
                                        Export
                                    </NBButton>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {dashboardData.assetAllocation
                                    .filter(
                                        (asset) => asset.name !== "Cash Reserve"
                                    )
                                    .map((position) => (
                                        <NBCard
                                            key={position.name}
                                            className="hover:shadow-lg transition-shadow"
                                        >
                                            <div className="space-y-4">
                                                <div className="flex justify-between items-start">
                                                    <h3 className="font-bold text-lg">
                                                        {position.name}
                                                    </h3>
                                                    <RiskScoreBadge
                                                        score={75}
                                                        size="sm"
                                                    />
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <div className="text-xs text-nb-ink/60">
                                                            Value
                                                        </div>
                                                        <div className="font-bold text-nb-accent">
                                                            $
                                                            {position.amount.toLocaleString()}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs text-nb-ink/60">
                                                            Allocation
                                                        </div>
                                                        <div className="font-bold">
                                                            {position.value}%
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <div className="text-xs text-nb-ink/60">
                                                            APY
                                                        </div>
                                                        <div className="font-bold text-nb-accent-2">
                                                            {position.apy}%
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-xs text-nb-ink/60">
                                                            Performance
                                                        </div>
                                                        <div className="font-bold text-nb-ok">
                                                            +12.4%
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex space-x-2 pt-2">
                                                    <Link
                                                        to={`/baskets/${position.name
                                                            .toLowerCase()
                                                            .replace(
                                                                /\s+/g,
                                                                "-"
                                                            )}`}
                                                        className="flex-1"
                                                    >
                                                        <NBButton
                                                            variant="outline"
                                                            size="sm"
                                                            className="w-full"
                                                        >
                                                            <Eye
                                                                size={14}
                                                                className="mr-1"
                                                            />
                                                            View
                                                        </NBButton>
                                                    </Link>
                                                    <NBButton
                                                        size="sm"
                                                        className="flex-1"
                                                    >
                                                        Add More
                                                    </NBButton>
                                                </div>
                                            </div>
                                        </NBCard>
                                    ))}
                            </div>
                        </div>
                    )}

                    {activeTab === "payouts" && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h2 className="font-bold text-2xl">
                                    Payout History
                                </h2>
                                <NBButton variant="outline" size="sm">
                                    <Download size={14} className="mr-1" />
                                    Export CSV
                                </NBButton>
                            </div>

                            <div className="grid md:grid-cols-3 gap-6 mb-6">
                                <MetricsCard
                                    title="Total Payouts"
                                    value="$14,780"
                                    change={15.2}
                                    icon={DollarSign}
                                    color="nb-ok"
                                />
                                <MetricsCard
                                    title="This Month"
                                    value={`$${dashboardData.monthlyIncome}`}
                                    change={8.7}
                                    icon={Calendar}
                                    color="nb-accent"
                                />
                                <MetricsCard
                                    title="Reliability Score"
                                    value="94%"
                                    change={2.1}
                                    icon={Shield}
                                    color="nb-accent-2"
                                />
                            </div>

                            <div className="space-y-4">
                                {[
                                    {
                                        id: 1,
                                        basket: "Premium Yield",
                                        amount: 342,
                                        date: "2025-01-28",
                                        status: "completed",
                                    },
                                    {
                                        id: 2,
                                        basket: "Growth Accelerator",
                                        amount: 287,
                                        date: "2025-01-25",
                                        status: "completed",
                                    },
                                    {
                                        id: 3,
                                        basket: "Stable Income Plus",
                                        amount: 195,
                                        date: "2025-01-22",
                                        status: "completed",
                                    },
                                    {
                                        id: 4,
                                        basket: "Premium Yield",
                                        amount: 338,
                                        date: "2025-01-15",
                                        status: "completed",
                                    },
                                    {
                                        id: 5,
                                        basket: "Growth Accelerator",
                                        amount: 291,
                                        date: "2025-01-12",
                                        status: "pending",
                                    },
                                ].map((payout) => (
                                    <NBCard
                                        key={payout.id}
                                        hover={false}
                                        className="transition-all hover:shadow-md"
                                    >
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center space-x-4">
                                                <div
                                                    className={`p-3 rounded-lg ${
                                                        payout.status ===
                                                        "completed"
                                                            ? "bg-nb-ok/20"
                                                            : "bg-nb-warn/20"
                                                    }`}
                                                >
                                                    {payout.status ===
                                                    "completed" ? (
                                                        <CheckCircle
                                                            className="text-nb-ok"
                                                            size={20}
                                                        />
                                                    ) : (
                                                        <Clock
                                                            className="text-nb-warn"
                                                            size={20}
                                                        />
                                                    )}
                                                </div>

                                                <div>
                                                    <div className="font-semibold text-lg">
                                                        {payout.basket}
                                                    </div>
                                                    <div className="text-sm text-nb-ink/60">
                                                        {new Date(
                                                            payout.date
                                                        ).toLocaleDateString(
                                                            "en-US",
                                                            {
                                                                month: "long",
                                                                day: "numeric",
                                                                year: "numeric",
                                                            }
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="text-right">
                                                <div className="font-bold text-xl text-nb-accent">
                                                    ${payout.amount}
                                                </div>
                                                <div
                                                    className={`text-sm capitalize font-medium ${
                                                        payout.status ===
                                                        "completed"
                                                            ? "text-nb-ok"
                                                            : "text-nb-warn"
                                                    }`}
                                                >
                                                    {payout.status}
                                                </div>
                                            </div>
                                        </div>
                                    </NBCard>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === "insights" && (
                        <div className="space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                {/* Market Insights */}
                                <NBCard>
                                    <div className="flex items-center space-x-2 mb-4">
                                        <Target
                                            className="text-nb-accent"
                                            size={20}
                                        />
                                        <h3 className="font-bold text-lg">
                                            Market Insights
                                        </h3>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-3 bg-nb-ok/10 rounded-lg">
                                            <span className="font-medium">
                                                Market Sentiment
                                            </span>
                                            <span className="font-bold text-nb-ok">
                                                {
                                                    dashboardData.marketInsights
                                                        .marketSentiment
                                                }
                                            </span>
                                        </div>
                                        <div className="space-y-2">
                                            <h4 className="font-semibold text-sm text-nb-ink/70">
                                                Key Trends
                                            </h4>
                                            {dashboardData.marketInsights.keyTrends.map(
                                                (trend, index) => (
                                                    <div
                                                        key={index}
                                                        className="flex items-start space-x-2"
                                                    >
                                                        <div className="w-2 h-2 bg-nb-accent rounded-full mt-2 flex-shrink-0" />
                                                        <span className="text-sm text-nb-ink/80">
                                                            {trend}
                                                        </span>
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    </div>
                                </NBCard>

                                {/* Notifications */}
                                <NBCard>
                                    <div className="flex items-center space-x-2 mb-4">
                                        <Bell
                                            className="text-nb-accent-2"
                                            size={20}
                                        />
                                        <h3 className="font-bold text-lg">
                                            Recent Activity
                                        </h3>
                                    </div>
                                    <div className="space-y-4">
                                        {dashboardData.notifications.map(
                                            (notification) => (
                                                <div
                                                    key={notification.id}
                                                    className="flex items-start space-x-3 p-3 bg-nb-ink/5 rounded-lg"
                                                >
                                                    <div
                                                        className={`p-2 rounded-lg ${
                                                            notification.type ===
                                                            "payout"
                                                                ? "bg-nb-ok/20"
                                                                : notification.type ===
                                                                  "risk"
                                                                ? "bg-nb-warn/20"
                                                                : "bg-nb-accent/20"
                                                        }`}
                                                    >
                                                        {notification.type ===
                                                        "payout" ? (
                                                            <DollarSign
                                                                className="text-nb-ok"
                                                                size={14}
                                                            />
                                                        ) : notification.type ===
                                                          "risk" ? (
                                                            <Shield
                                                                className="text-nb-warn"
                                                                size={14}
                                                            />
                                                        ) : (
                                                            <TrendingUp
                                                                className="text-nb-accent"
                                                                size={14}
                                                            />
                                                        )}
                                                    </div>

                                                    <div className="flex-1">
                                                        <div className="font-semibold text-sm">
                                                            {notification.title}
                                                        </div>
                                                        <div className="text-xs text-nb-ink/70">
                                                            {
                                                                notification.message
                                                            }
                                                        </div>
                                                        <div className="text-xs text-nb-ink/50 mt-1">
                                                            {notification.time}
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        )}
                                    </div>
                                </NBCard>
                            </div>

                            {/* Performance Summary */}
                            <NBCard>
                                <h3 className="font-bold text-xl mb-6">
                                    Performance Summary
                                </h3>
                                <div className="grid md:grid-cols-4 gap-6">
                                    <div className="text-center p-4 bg-nb-accent/10 rounded-lg">
                                        <div className="text-2xl font-bold text-nb-accent">
                                            9.0%
                                        </div>
                                        <div className="text-sm text-nb-ink/60">
                                            Total Return
                                        </div>
                                    </div>
                                    <div className="text-center p-4 bg-nb-ok/10 rounded-lg">
                                        <div className="text-2xl font-bold text-nb-ok">
                                            94%
                                        </div>
                                        <div className="text-sm text-nb-ink/60">
                                            Success Rate
                                        </div>
                                    </div>
                                    <div className="text-center p-4 bg-nb-accent-2/10 rounded-lg">
                                        <div className="text-2xl font-bold text-nb-accent-2">
                                            72
                                        </div>
                                        <div className="text-sm text-nb-ink/60">
                                            Risk Score
                                        </div>
                                    </div>
                                    <div className="text-center p-4 bg-nb-purple/10 rounded-lg">
                                        <div className="text-2xl font-bold text-nb-purple">
                                            1.8
                                        </div>
                                        <div className="text-sm text-nb-ink/60">
                                            Sharpe Ratio
                                        </div>
                                    </div>
                                </div>
                            </NBCard>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
};

export default Dashboard;
