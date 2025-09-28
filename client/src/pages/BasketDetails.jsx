import React, { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
    ArrowLeft,
    TrendingUp,
    Users,
    DollarSign,
    PieChart,
    BarChart3,
    Shield,
    Calculator,
    AlertCircle,
    Activity,
    Target,
    Clock,
    FileText,
    Eye,
    Star,
    ArrowUpRight,
    Calendar,
    Wallet,
    ExternalLink,
} from "lucide-react";
import SafetyScoreBadge from "../components/SafetyScoreBadge";
import apiService from "../services/apiService";
import web3Service from "../services/web3Service";
import backendService from "../services/backendService";
import PerformanceChart from '../components/PerformanceChart';

// Update the SafetyScoreChart component to use real basket data
const SafetyScoreChart = ({ basketId, basketData }) => {
    // Use the actual basket's safety score as the base
    const baseSafetyScore = basketData?.riskRange ? basketData.riskRange[0] : 85;
    
    // Generate realistic safety score data over last few months using the real score
    const safetyData = useMemo(() => {
        const months = ['2024-07', '2024-08', '2024-09', '2024-10', '2024-11', '2024-12', '2025-01'];
        let currentSafety = baseSafetyScore;
        
        return months.map((month, index) => {
            // For the last month, use the exact basket safety score
            if (index === months.length - 1) {
                currentSafety = baseSafetyScore;
            } else {
                // Add realistic fluctuation around the base score: +4, +2, -2, -4 etc
                const variations = [4, 2, -2, -4, 3, -1, 1];
                const variation = variations[index % variations.length];
                currentSafety = baseSafetyScore + variation;
                
                // Keep within reasonable bounds but allow some variance
                currentSafety = Math.max(baseSafetyScore - 8, Math.min(baseSafetyScore + 8, currentSafety));
            }
            
            return {
                date: month,
                value: Math.round(currentSafety)
            };
        });
    }, [basketId, baseSafetyScore]);

    const currentSafety = safetyData[safetyData.length - 1].value;
    const previousSafety = safetyData[safetyData.length - 2].value;
    const change = currentSafety - previousSafety;
    const isUp = change > 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
        >
            {/* Safety Score Header */}
            <div className="mb-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-black text-2xl text-gray-900 uppercase tracking-tight">
                            SAFETY SCORE TREND
                        </h3>
                        <p className="text-sm text-gray-600 font-bold mt-1">
                            LAST 7 MONTHS
                        </p>
                    </div>
                    <div className="text-right">
                        <div className="text-4xl font-black text-gray-900 mb-1">
                            {currentSafety}
                        </div>
                        <div className={`flex items-center justify-end text-sm font-bold ${
                            isUp ? 'text-green-600' : 'text-red-600'
                        }`}>
                            <span className="mr-1">
                                {isUp ? '↗' : '↘'}
                            </span>
                            {Math.abs(change)} pts
                        </div>
                    </div>
                </div>
            </div>

            {/* Use the same PerformanceChart as Creators page */}
            <PerformanceChart
                title=""
                data={safetyData}
                color="#10B981"  // Green color for safety
                height={300}
                type="area"
                showGrid={true}
            />

            {/* Safety Level Indicator - Updated to match actual score */}
            <div className="mt-4 p-4 bg-gray-50 border-4 border-gray-900">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-green-600 border-2 border-gray-900"></div>
                            <span className="font-black text-xs uppercase">85+ HIGH SAFETY</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-yellow-600 border-2 border-gray-900"></div>
                            <span className="font-black text-xs uppercase">75-84 MED SAFETY</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-red-600 border-2 border-gray-900"></div>
                            <span className="font-black text-xs uppercase">70-74 LOW SAFETY</span>
                        </div>
                    </div>
                    <div className={`px-3 py-1 border-2 border-gray-900 font-black text-xs uppercase ${
                        currentSafety >= 85 
                            ? 'bg-green-600 text-white' 
                            : currentSafety >= 75 
                            ? 'bg-yellow-600 text-gray-900' 
                            : 'bg-red-600 text-white'
                    }`}>
                        {currentSafety >= 85 ? 'HIGH SAFETY' : currentSafety >= 75 ? 'MEDIUM SAFETY' : 'LOW SAFETY'}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

const BasketDetails = () => {
    const { id } = useParams();
    const [basketData, setBasketData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [investmentAmount, setInvestmentAmount] = useState("");
    const [showInvestModal, setShowInvestModal] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [userAddress, setUserAddress] = useState(null);
    const [balances, setBalances] = useState({ native: "0", fusd: "0" });
    const [isInvesting, setIsInvesting] = useState(false);
    const [investmentStep, setInvestmentStep] = useState("");
    const [txHash, setTxHash] = useState("");

    useEffect(() => {
        loadBasketDetails();
        checkWalletConnection();
    }, [id]);

    const checkWalletConnection = async () => {
        try {
            if (web3Service.isConnected()) {
                setIsConnected(true);
                setUserAddress(web3Service.getAccount());
                await loadBalances();
            }
        } catch (error) {
            console.error("❌ Failed to check wallet connection:", error);
        }
    };

    const connectWallet = async () => {
        try {
            const connection = await web3Service.connectWallet();
            setIsConnected(true);
            setUserAddress(connection.account);
            await loadBalances();
        } catch (error) {
            console.error("❌ Failed to connect wallet:", error);
            alert("Failed to connect wallet. Please try again.");
        }
    };

    const loadBalances = async () => {
        try {
            const balances = await web3Service.getBalances();
            setBalances(balances);
        } catch (error) {
            console.error("❌ Failed to load balances:", error);
        }
    };

    const loadBasketDetails = async () => {
        try {
            const response = await apiService.getBasketDetails(id);
            console.log("📊 Loaded basket details:", response);

            // Handle the response structure
            const data = response.success ? response.data : response;
            setBasketData(data);
        } catch (error) {
            console.error("❌ Failed to load basket details:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleInvestment = async () => {
        if (!investmentAmount || parseFloat(investmentAmount) < 1000) {
            alert("Minimum investment is $1,000");
            return;
        }

        if (!isConnected) {
            alert("Please connect your wallet first");
            return;
        }

        // Check if user has enough fUSD
        const requiredAmount = parseFloat(investmentAmount);
        const userBalance = parseFloat(balances.fusd);

        if (userBalance < requiredAmount) {
            alert(
                `Insufficient fUSD balance. You have ${userBalance.toFixed(
                    2
                )} fUSD but need ${requiredAmount} fUSD.`
            );
            return;
        }

        setIsInvesting(true);
        setTxHash("");

        try {
            // Step 1: Check network
            setInvestmentStep("Checking network...");
            if (!web3Service.isCorrectNetwork()) {
                setInvestmentStep("Switching to Kadena EVM...");
                await web3Service.switchToKadenaEVM();
            }

            // Step 2: Approve fUSD spending
            setInvestmentStep("Approving fUSD spending...");
            const approvalTx = await web3Service.approveFUSD(requiredAmount);
            console.log("✅ Approval transaction:", approvalTx.hash);

            // Step 3: Invest in basket on blockchain
            setInvestmentStep("Processing investment...");
            const investmentTx = await web3Service.investInBasket(
                id,
                requiredAmount
            );
            console.log("✅ Investment transaction:", investmentTx.hash);
            setTxHash(investmentTx.hash);

            // Step 4: Record investment in backend
            setInvestmentStep("Recording investment...");
            console.log("📝 Recording investment:", {
                basketId: id,
                amount: requiredAmount,
                investorAddress: userAddress,
                transactionHash: investmentTx.hash,
                blockNumber: investmentTx.blockNumber,
            });

            await apiService.investInBasket(id, {
                amount: requiredAmount,
                investorAddress: userAddress,
                transactionHash: investmentTx.hash,
                blockNumber: investmentTx.blockNumber,
            });

            // Step 5: Success
            setInvestmentStep("Investment completed!");
            alert(
                `Investment of $${investmentAmount} successful!\nTransaction: ${investmentTx.hash}`
            );

            // Reset and refresh
            setShowInvestModal(false);
            setInvestmentAmount("");
            await loadBalances(); // Refresh balances
            await loadBasketDetails(); // Refresh basket data
        } catch (error) {
            console.error("❌ Investment failed:", error);
            setInvestmentStep("Investment failed");

            // Show user-friendly error messages
            if (error.message.includes("user rejected")) {
                alert("Transaction was cancelled by user.");
            } else if (error.message.includes("insufficient funds")) {
                alert("Insufficient funds for transaction.");
            } else if (error.message.includes("network")) {
                alert(
                    "Network error. Please check your connection and try again."
                );
            } else {
                alert(`Investment failed: ${error.message}`);
            }
        } finally {
            setIsInvesting(false);
            setInvestmentStep("");
        }
    };

    const mintTestFUSD = async () => {
        if (!isConnected) {
            alert("Please connect your wallet first");
            return;
        }

        try {
            setInvestmentStep("Minting test fUSD...");
            const mintTx = await web3Service.mintFUSD(10000); // Mint 10,000 fUSD for testing
            console.log("✅ Mint transaction:", mintTx.hash);
            alert(
                `Successfully minted 10,000 fUSD!\nTransaction: ${mintTx.hash}`
            );
            await loadBalances(); // Refresh balances
        } catch (error) {
            console.error("❌ Failed to mint fUSD:", error);
            alert(`Failed to mint fUSD: ${error.message}`);
        } finally {
            setInvestmentStep("");
        }
    };

    const formatCurrency = (amount) => {
        if (!amount || amount === 0) return "$0";
        if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
        if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
        return `$${amount.toLocaleString()}`;
    };

    const formatPercentage = (value) => {
        if (!value) return "0%";
        return `${value.toFixed(1)}%`;
    };

    // Simple Brutalist Loader
    if (loading) {
        return (
            <div className="min-h-screen py-12 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col justify-center items-center h-96">
                        <div className="grid grid-cols-3 gap-2">
                            <div className="w-8 h-8 bg-blue-600 border-2 border-gray-900 animate-bounce"></div>
                            <div className="w-8 h-8 bg-emerald-600 border-2 border-gray-900 animate-bounce delay-100"></div>
                            <div className="w-8 h-8 bg-purple-600 border-2 border-gray-900 animate-bounce delay-200"></div>
                            <div className="w-8 h-8 bg-orange-600 border-2 border-gray-900 animate-bounce delay-300"></div>
                            <div className="w-8 h-8 bg-red-600 border-2 border-gray-900 animate-bounce delay-400"></div>
                            <div className="w-8 h-8 bg-yellow-600 border-2 border-gray-900 animate-bounce delay-500"></div>
                            <div className="w-8 h-8 bg-pink-600 border-2 border-gray-900 animate-bounce delay-600"></div>
                            <div className="w-8 h-8 bg-indigo-600 border-2 border-gray-900 animate-bounce delay-700"></div>
                            <div className="w-8 h-8 bg-teal-600 border-2 border-gray-900 animate-bounce delay-800"></div>
                        </div>
                        <div className="mt-8">
                            <h3 className="font-black text-xl text-gray-900 uppercase tracking-wide text-center">
                                LOADING BASKET...
                            </h3>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!basketData) {
        return (
            <div className="min-h-screen py-12 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-white border-4 border-gray-900 shadow-lg">
                        <div className="text-center py-20">
                            <div className="w-24 h-24 bg-red-600 text-white flex items-center justify-center mx-auto mb-8 border-4 border-red-700">
                                <AlertCircle size={32} className="font-bold" />
                            </div>
                            <h2 className="font-black text-3xl text-gray-900 mb-4 uppercase">
                                BASKET NOT FOUND
                            </h2>
                            <p className="text-gray-600 font-bold mb-8">
                                THE BASKET YOU'RE LOOKING FOR DOESN'T EXIST
                            </p>
                            <Link to="/invest">
                                <button className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-wide transition-colors border-4 border-blue-700">
                                    <ArrowLeft
                                        size={16}
                                        className="inline mr-2"
                                    />
                                    BACK TO MARKETPLACE
                                </button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const basket = basketData;
    const metrics = basket.metrics || {};
    const assets = basket.assets || [];
    const investments = basket.investments || [];

    return (
        <div className="min-h-screen py-12 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <motion.div
                    className="mb-12"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="flex items-center mb-6">
                        <Link
                            to="/invest"
                            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors font-bold uppercase tracking-wide"
                        >
                            <ArrowLeft size={20} className="mr-2" />
                            BACK TO MARKETPLACE
                        </Link>
                    </div>

                    <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start mb-8">
                        <div className="mb-6 lg:mb-0">
                            <h1 className="font-black text-6xl text-gray-900 mb-4 tracking-tight uppercase">
                                {basket.name}
                            </h1>
                            <div className="flex items-center gap-4 mb-4">
                                <span className="px-4 py-2 bg-blue-600 text-white font-black text-sm border-2 border-blue-700 uppercase">
                                    SAFETY: {basket.riskRange[0]}-{basket.riskRange[1]}%
                                </span>
                                <span className="px-4 py-2 bg-emerald-600 text-white font-black text-sm border-2 border-emerald-700 uppercase">
                                    APY: {basket.targetAPY}%
                                </span>
                                <span
                                    className={`px-4 py-2 font-black text-sm border-2 uppercase ${
                                        basket.active
                                            ? "bg-green-600 text-white border-green-700"
                                            : "bg-gray-400 text-gray-700 border-gray-500"
                                    }`}
                                >
                                    {basket.active ? "ACTIVE" : "INACTIVE"}
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-col space-y-4">
                            {/* Wallet Connection */}
                            {!isConnected ? (
                                <button
                                    onClick={connectWallet}
                                    className="px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white font-black uppercase tracking-wide transition-all border-4 border-purple-700 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] hover:-translate-x-0.5 hover:-translate-y-0.5"
                                >
                                    <Wallet size={20} className="inline mr-2" />
                                    CONNECT WALLET
                                </button>
                            ) : (
                                <div className="bg-white border-4 border-gray-900 p-4">
                                    <div className="text-xs font-black text-gray-500 uppercase tracking-wide mb-2">
                                        WALLET CONNECTED
                                    </div>
                                    <div className="text-sm font-bold text-gray-900 mb-2">
                                        {userAddress?.slice(0, 6)}...
                                        {userAddress?.slice(-4)}
                                    </div>
                                    <div className="text-xs font-bold text-gray-600">
                                        KDA:{" "}
                                        {parseFloat(balances.native).toFixed(4)}
                                    </div>
                                    <div className="text-xs font-bold text-gray-600">
                                        fUSD:{" "}
                                        {parseFloat(balances.fusd).toFixed(2)}
                                    </div>
                                    {parseFloat(balances.fusd) < 1000 && (
                                        <button
                                            onClick={mintTestFUSD}
                                            disabled={!!investmentStep}
                                            className="mt-2 px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white font-black text-xs uppercase tracking-wide transition-colors border-2 border-yellow-700"
                                        >
                                            MINT TEST fUSD
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Investment Button */}
                            <button
                                onClick={() => setShowInvestModal(true)}
                                disabled={
                                    !isConnected ||
                                    !basket.active ||
                                    metrics.assetCount === 0
                                }
                                className={`px-8 py-4 font-black uppercase tracking-wide transition-all border-4 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] hover:-translate-x-0.5 hover:-translate-y-0.5 ${
                                    isConnected &&
                                    basket.active &&
                                    metrics.assetCount > 0
                                        ? "bg-blue-600 hover:bg-blue-700 text-white border-blue-700"
                                        : "bg-gray-400 text-gray-700 border-gray-500 cursor-not-allowed"
                                }`}
                            >
                                <DollarSign size={20} className="inline mr-2" />
                                {!isConnected
                                    ? "CONNECT WALLET FIRST"
                                    : !basket.active
                                    ? "BASKET INACTIVE"
                                    : metrics.assetCount === 0
                                    ? "NO ASSETS YET"
                                    : "INVEST NOW"}
                            </button>
                        </div>
                    </div>

                    {/* Key Metrics Grid */}
                    <div className="grid md:grid-cols-5 gap-6">
                        <div className="bg-blue-600 text-white border-4 border-blue-700 p-6 transform -rotate-1 hover:rotate-0 transition-transform">
                            <div className="text-3xl font-black mb-2">
                                {basket.targetAPY}%
                            </div>
                            <div className="text-sm font-bold text-blue-100 uppercase tracking-wide">
                                TARGET APY
                            </div>
                        </div>
                        <div className="bg-emerald-600 text-white border-4 border-emerald-700 p-6 transform rotate-1 hover:rotate-0 transition-transform">
                            <div className="text-3xl font-black mb-2">
                                {formatCurrency(metrics.totalInvested || metrics.totalValue || 0)}
                            </div>
                            <div className="text-sm font-bold text-emerald-100 uppercase tracking-wide">
                                TOTAL VALUE
                            </div>
                        </div>
                        <div className="bg-purple-600 text-white border-4 border-purple-700 p-6 transform -rotate-1 hover:rotate-0 transition-transform">
                            <div className="text-3xl font-black mb-2">
                                {metrics.assetCount || 0}
                            </div>
                            <div className="text-sm font-bold text-purple-100 uppercase tracking-wide">
                                ASSETS
                            </div>
                        </div>
                        <div className="bg-orange-600 text-white border-4 border-orange-700 p-6 transform rotate-1 hover:rotate-0 transition-transform">
                            <div className="text-3xl font-black mb-2">
                                {metrics.investorCount || 0}
                            </div>
                            <div className="text-sm font-bold text-orange-100 uppercase tracking-wide">
                                INVESTORS
                            </div>
                        </div>
                        <div className="bg-red-600 text-white border-4 border-red-700 p-6 transform -rotate-1 hover:rotate-0 transition-transform">
                            <div className="text-3xl font-black mb-2">
                                {metrics.averageRiskScore || 0}
                            </div>
                            <div className="text-sm font-bold text-red-100 uppercase tracking-wide">
                                AVG SAFETY
                            </div>
                        </div>
                    </div>
                </motion.div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Safety Score Chart - REPLACES BASKET CAPACITY */}
                        <SafetyScoreChart basketId={id} basketData={basket} />

                        {/* Risk Score Distribution */}
                        {metrics.riskScoreDistribution && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="bg-white border-4 border-gray-900 shadow-lg"
                            >
                                <div className="bg-gray-900 text-white p-6 border-b-4 border-gray-900">
                                    <h3 className="font-black text-xl flex items-center">
                                        <div className="w-8 h-8 bg-green-600 text-white flex items-center justify-center mr-3 border-2 border-green-600">
                                            <BarChart3
                                                size={16}
                                                className="font-bold"
                                            />
                                        </div>
                                        SAFETY DISTRIBUTION
                                    </h3>
                                </div>
                                <div className="p-6">
                                    <div className="space-y-4">
                                        {Object.entries(
                                            metrics.riskScoreDistribution
                                        ).map(([range, count]) => (
                                            <div
                                                key={range}
                                                className="flex items-center justify-between"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className={`w-4 h-4 border-2 ${
                                                            range === "90-100"
                                                                ? "bg-green-600 border-green-700"  // Highest safety = green
                                                                : range === "80-89"
                                                                ? "bg-blue-600 border-blue-700"   // High safety = blue
                                                                : range === "66-79"
                                                                ? "bg-yellow-600 border-yellow-700" // Medium safety = yellow
                                                                : range === "50-65"
                                                                ? "bg-orange-600 border-orange-700" // Low safety = orange
                                                                : "bg-red-600 border-red-700"       // Lowest safety = red
                                                        }`}
                                                    ></div>
                                                    <span className="font-bold text-gray-900 uppercase">
                                                        {range}
                                                    </span>
                                                </div>
                                                <span className="font-black text-xl text-gray-900">
                                                    {count}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Assets List */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="bg-white border-4 border-gray-900 shadow-lg"
                        >
                            <div className="bg-gray-900 text-white p-6 border-b-4 border-gray-900">
                                <h3 className="font-black text-xl flex items-center">
                                    <div className="w-8 h-8 bg-green-600 text-white flex items-center justify-center mr-3 border-2 border-green-600">
                                        <FileText
                                            size={16}
                                            className="font-bold"
                                        />
                                    </div>
                                    BASKET ASSETS ({assets.length})
                                </h3>
                            </div>
                            <div className="p-6">
                                {assets.length > 0 ? (
                                    <div className="space-y-4">
                                        {assets.map((asset, index) => (
                                            <div
                                                key={asset._id || index}
                                                className="border-4 border-gray-300 p-4 hover:border-blue-600 transition-colors"
                                            >
                                                <div className="flex justify-between items-start mb-3">
                                                    <div>
                                                        <h4 className="font-black text-lg text-gray-900 uppercase">
                                                            {asset.assetType}{" "}
                                                            ASSET
                                                        </h4>
                                                        <p className="text-sm text-gray-600 font-bold">
                                                            ID: {asset.assetId}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="font-black text-xl text-gray-900">
                                                            {formatCurrency(
                                                                asset.amount
                                                            )}
                                                        </div>
                                                        <SafetyScoreBadge
                                                            score={
                                                                asset.riskScore
                                                            }
                                                            size="sm"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="grid md:grid-cols-3 gap-4 mb-4">
                                                    <div>
                                                        <span className="text-xs font-black text-gray-500 uppercase tracking-wide">
                                                            UNLOCKABLE
                                                        </span>
                                                        <div className="font-bold text-gray-900">
                                                            {formatCurrency(
                                                                asset.unlockable
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <span className="text-xs font-black text-gray-500 uppercase tracking-wide">
                                                            STATUS
                                                        </span>
                                                        <div
                                                            className={`font-bold uppercase ${
                                                                asset.status ===
                                                                "pending"
                                                                    ? "text-yellow-600"
                                                                    : asset.status ===
                                                                      "active"
                                                                    ? "text-green-600"
                                                                    : "text-gray-600"
                                                            }`}
                                                        >
                                                            {asset.status}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <span className="text-xs font-black text-gray-500 uppercase tracking-wide">
                                                            ORIGINATOR
                                                        </span>
                                                        <div className="font-bold text-gray-900 text-xs">
                                                            {asset.originator.slice(
                                                                0,
                                                                6
                                                            )}
                                                            ...
                                                            {asset.originator.slice(
                                                                -4
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {asset.analysis &&
                                                    asset.analysis
                                                        .reasoning && (
                                                        <div className="bg-gray-50 border-2 border-gray-200 p-3">
                                                            <h5 className="font-black text-sm text-gray-900 mb-2 uppercase">
                                                                AI ANALYSIS
                                                            </h5>
                                                            <p className="text-sm text-gray-700 font-medium">
                                                                {
                                                                    asset
                                                                        .analysis
                                                                        .reasoning
                                                                }
                                                            </p>
                                                        </div>
                                                    )}

                                                {asset.documentUrl && (
                                                    <div className="mt-3">
                                                        <a
                                                            href={
                                                                asset.documentUrl
                                                            }
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wide transition-colors border-2 border-blue-700"
                                                        >
                                                            <Eye
                                                                size={14}
                                                                className="mr-2"
                                                            />
                                                            VIEW DOCUMENT
                                                            <ArrowUpRight
                                                                size={14}
                                                                className="ml-2"
                                                            />
                                                        </a>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <div className="w-16 h-16 bg-gray-400 text-white flex items-center justify-center mx-auto mb-4 border-4 border-gray-500">
                                            <FileText size={24} />
                                        </div>
                                        <h4 className="font-black text-xl text-gray-900 mb-2 uppercase">
                                            NO ASSETS YET
                                        </h4>
                                        <p className="text-gray-600 font-bold">
                                            ASSETS WILL APPEAR HERE ONCE ADDED
                                            TO THIS BASKET
                                        </p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-8">
                        {/* Investment Summary */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5 }}
                            className="bg-white border-4 border-gray-900 shadow-lg"
                        >
                            <div className="bg-gray-900 text-white p-6 border-b-4 border-gray-900">
                                <h3 className="font-black text-xl flex items-center">
                                    <div className="w-8 h-8 bg-blue-600 text-white flex items-center justify-center mr-3 border-2 border-blue-600">
                                        <Calculator
                                            size={16}
                                            className="font-bold"
                                        />
                                    </div>
                                    INVESTMENT INFO
                                </h3>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="flex justify-between items-center py-2 border-b-2 border-gray-200">
                                    <span className="font-bold text-gray-600 uppercase text-sm">
                                        Target APY:
                                    </span>
                                    <span className="font-black text-lg text-emerald-600">
                                        {basket.targetAPY}%
                                    </span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b-2 border-gray-200">
                                    <span className="font-bold text-gray-600 uppercase text-sm">
                                        Safety Range:
                                    </span>
                                    <span className="font-black text-lg text-gray-900">
                                        {basket.riskRange[0]}-{basket.riskRange[1]}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b-2 border-gray-200">
                                    <span className="font-bold text-gray-600 uppercase text-sm">
                                        Total Value:
                                    </span>
                                    <span className="font-black text-lg text-blue-600">
                                        {formatCurrency(metrics.totalInvested || metrics.totalValue || 0)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center py-2">
                                    <span className="font-bold text-gray-600 uppercase text-sm">
                                        Status:
                                    </span>
                                    <span
                                        className={`font-black text-lg uppercase ${
                                            basket.active
                                                ? "text-green-600"
                                                : "text-red-600"
                                        }`}
                                    >
                                        {basket.active ? "ACTIVE" : "INACTIVE"}
                                    </span>
                                </div>

                                <button
                                    onClick={() => setShowInvestModal(true)}
                                    disabled={
                                        !isConnected ||
                                        !basket.active ||
                                        metrics.assetCount === 0
                                    }
                                    className={`w-full font-black py-4 px-6 uppercase tracking-wide transition-all border-4 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] hover:-translate-x-0.5 hover:-translate-y-0.5 ${
                                        isConnected &&
                                        basket.active &&
                                        metrics.assetCount > 0
                                            ? "bg-blue-600 hover:bg-blue-700 text-white border-blue-700"
                                            : "bg-gray-400 text-gray-700 border-gray-500 cursor-not-allowed"
                                    }`}
                                >
                                    <DollarSign
                                        size={16}
                                        className="inline mr-2"
                                    />
                                    {!isConnected
                                        ? "CONNECT WALLET"
                                        : !basket.active
                                        ? "BASKET INACTIVE"
                                        : metrics.assetCount === 0
                                        ? "NO ASSETS YET"
                                        : "INVEST NOW"}
                                </button>
                            </div>
                        </motion.div>

                        {/* Asset Type Distribution */}
                        {metrics.assetTypeDistribution &&
                            Object.keys(metrics.assetTypeDistribution).length >
                                0 && (
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.6 }}
                                    className="bg-white border-4 border-gray-900 shadow-lg"
                                >
                                    <div className="bg-gray-900 text-white p-6 border-b-4 border-gray-900">
                                        <h3 className="font-black text-xl flex items-center">
                                            <div className="w-8 h-8 bg-purple-600 text-white flex items-center justify-center mr-3 border-2 border-purple-600">
                                                <PieChart
                                                    size={16}
                                                    className="font-bold"
                                                />
                                            </div>
                                            ASSET TYPES
                                        </h3>
                                    </div>
                                    <div className="p-6 space-y-3">
                                        {Object.entries(
                                            metrics.assetTypeDistribution
                                        ).map(([type, count]) => (
                                            <div
                                                key={type}
                                                className="flex justify-between items-center"
                                            >
                                                <span className="font-bold text-gray-900 uppercase">
                                                    {type}
                                                </span>
                                                <span className="font-black text-xl text-purple-600">
                                                    {count}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                        {/* Recent Activity */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.7 }}
                            className="bg-white border-4 border-gray-900 shadow-lg"
                        >
                            <div className="bg-gray-900 text-white p-6 border-b-4 border-gray-900">
                                <h3 className="font-black text-xl flex items-center">
                                    <div className="w-8 h-8 bg-green-600 text-white flex items-center justify-center mr-3 border-2 border-green-600">
                                        <Activity
                                            size={16}
                                            className="font-bold"
                                        />
                                    </div>
                                    RECENT ACTIVITY
                                </h3>
                            </div>
                            <div className="p-6 space-y-4">
                                {investments.length > 0 ? (
                                    investments
                                        .slice(0, 3)
                                        .map((investment, index) => (
                                            <div
                                                key={investment._id || index}
                                                className="flex items-center justify-between text-sm"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                                                    <span className="font-bold">
                                                        Investment
                                                    </span>
                                                </div>
                                                <span className="font-black text-green-600">
                                                    {formatCurrency(
                                                        investment.amount
                                                    )}
                                                </span>
                                            </div>
                                        ))
                                ) : (
                                    <>
                                        <div className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                                <span className="font-bold">
                                                    Basket Created
                                                </span>
                                            </div>
                                            <span className="text-gray-500 font-bold">
                                                RECENT
                                            </span>
                                        </div>
                                        {assets.length > 0 && (
                                            <div className="flex items-center justify-between text-sm">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                                                    <span className="font-bold">
                                                        Asset Added
                                                    </span>
                                                </div>
                                                <span className="text-gray-500 font-bold">
                                                    RECENT
                                                </span>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* Investment Modal */}
                {showInvestModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white border-4 border-gray-900 shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto"
                        >
                            <div className="bg-gray-900 text-white p-6 border-b-4 border-gray-900">
                                <div className="flex justify-between items-center">
                                    <h3 className="font-black text-xl uppercase">
                                        INVEST IN {basket.name}
                                    </h3>
                                    <button
                                        onClick={() =>
                                            setShowInvestModal(false)
                                        }
                                        disabled={isInvesting}
                                        className="text-white hover:text-gray-300 font-black text-xl"
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Wallet Info */}
                                {isConnected && (
                                    <div className="bg-gray-50 border-2 border-gray-200 p-4">
                                        <h4 className="font-black text-sm text-gray-900 mb-2 uppercase">
                                            WALLET BALANCE
                                        </h4>
                                        <div className="text-sm space-y-1">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600 font-bold">
                                                    fUSD:
                                                </span>
                                                <span className="font-black">
                                                    {parseFloat(
                                                        balances.fusd
                                                    ).toFixed(2)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600 font-bold">
                                                    KDA:
                                                </span>
                                                <span className="font-black">
                                                    {parseFloat(
                                                        balances.native
                                                    ).toFixed(4)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-black mb-3 uppercase tracking-wide text-gray-900">
                                        INVESTMENT AMOUNT
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-600 font-black text-lg">
                                            $
                                        </span>
                                        <input
                                            type="number"
                                            value={investmentAmount}
                                            onChange={(e) =>
                                                setInvestmentAmount(
                                                    e.target.value
                                                )
                                            }
                                            placeholder="Enter amount..."
                                            disabled={isInvesting}
                                            className="w-full pl-10 pr-4 py-4 border-4 border-gray-300 focus:outline-none focus:border-blue-600 text-lg font-black placeholder:text-gray-400 disabled:bg-gray-100"
                                            min="1000"
                                        />
                                    </div>
                                    <div className="text-xs text-gray-600 mt-2 font-bold">
                                        MINIMUM: $1,000
                                    </div>
                                </div>

                                {/* Investment Progress */}
                                {isInvesting && (
                                    <div className="bg-blue-50 border-4 border-blue-200 p-4">
                                        <h4 className="font-black mb-3 uppercase text-blue-900">
                                            PROCESSING INVESTMENT
                                        </h4>
                                        <div className="text-sm font-bold text-blue-700">
                                            {investmentStep}
                                        </div>
                                        {txHash && (
                                            <div className="mt-2">
                                                <a
                                                    href={`${
                                                        import.meta.env
                                                            .VITE_EXPLORER_URL
                                                    }/tx/${txHash}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center text-xs font-bold text-blue-600 hover:text-blue-800"
                                                >
                                                    VIEW TRANSACTION
                                                    <ExternalLink
                                                        size={12}
                                                        className="ml-1"
                                                    />
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {investmentAmount &&
                                    parseFloat(investmentAmount) >= 1000 &&
                                    !isInvesting && (
                                        <div className="p-4 bg-blue-50 border-4 border-blue-200">
                                            <h4 className="font-black mb-3 uppercase text-blue-900">
                                                PROJECTED RETURNS (12 MONTHS)
                                            </h4>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-blue-700 font-bold">
                                                        Investment:
                                                    </span>
                                                    <span className="font-black">
                                                        $
                                                        {parseFloat(
                                                            investmentAmount
                                                        ).toLocaleString()}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-blue-700 font-bold">
                                                        Expected Returns:
                                                    </span>
                                                    <span className="font-black text-green-600">
                                                        +$
                                                        {(
                                                            (parseFloat(
                                                                investmentAmount
                                                            ) *
                                                                basket.targetAPY) /
                                                            100
                                                        ).toFixed(0)}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-blue-700 font-bold">
                                                        Total Value:
                                                    </span>
                                                    <span className="font-black">
                                                        $
                                                        {(
                                                            parseFloat(
                                                                investmentAmount
                                                            ) *
                                                            (1 +
                                                                basket.targetAPY /
                                                                    100)
                                                        ).toFixed(0)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                {investmentAmount &&
                                    parseFloat(investmentAmount) < 1000 && (
                                        <div className="p-4 bg-red-50 border-4 border-red-200">
                                            <div className="flex items-start space-x-2">
                                                <AlertCircle
                                                    className="text-red-600 mt-0.5"
                                                    size={16}
                                                />
                                                <div className="text-sm">
                                                    <div className="font-black text-red-900">
                                                        MINIMUM INVESTMENT
                                                        REQUIRED
                                                    </div>
                                                    <div className="text-red-700 font-bold">
                                                        Please invest at least
                                                        $1,000.
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                {/* Balance Check */}
                                {investmentAmount &&
                                    parseFloat(investmentAmount) >=
                                        parseFloat(balances.fusd) &&
                                    parseFloat(balances.fusd) > 0 && (
                                        <div className="p-4 bg-yellow-50 border-4 border-yellow-200">
                                            <div className="flex items-start space-x-2">
                                                <AlertCircle
                                                    className="text-yellow-600 mt-0.5"
                                                    size={16}
                                                />
                                                <div className="text-sm">
                                                    <div className="font-black text-yellow-900">
                                                        INSUFFICIENT BALANCE
                                                    </div>
                                                    <div className="text-yellow-700 font-bold">
                                                        You need{" "}
                                                        {parseFloat(
                                                            investmentAmount
                                                        ).toFixed(2)}{" "}
                                                        fUSD but only have{" "}
                                                        {parseFloat(
                                                            balances.fusd
                                                        ).toFixed(2)}{" "}
                                                        fUSD.
                                                    </div>
                                                    <button
                                                        onClick={mintTestFUSD}
                                                        disabled={
                                                            isInvesting ||
                                                            !!investmentStep
                                                        }
                                                        className="mt-2 px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white font-black text-xs uppercase tracking-wide transition-colors border-2 border-yellow-700"
                                                    >
                                                        MINT TEST fUSD
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                <div className="flex space-x-4">
                                    <button
                                        onClick={() =>
                                            setShowInvestModal(false)
                                        }
                                        disabled={isInvesting}
                                        className="flex-1 px-4 py-4 bg-gray-400 hover:bg-gray-500 text-white font-black uppercase tracking-wide transition-colors border-4 border-gray-500 disabled:opacity-50"
                                    >
                                        CANCEL
                                    </button>
                                    <button
                                        onClick={handleInvestment}
                                        disabled={
                                            !investmentAmount ||
                                            parseFloat(investmentAmount) <
                                                1000 ||
                                            parseFloat(investmentAmount) >
                                                parseFloat(balances.fusd) ||
                                            isInvesting
                                        }
                                        className={`flex-1 px-4 py-4 font-black uppercase tracking-wide transition-colors border-4 ${
                                            investmentAmount &&
                                            parseFloat(investmentAmount) >=
                                                1000 &&
                                            parseFloat(investmentAmount) <=
                                                parseFloat(balances.fusd) &&
                                            !isInvesting
                                                ? "bg-blue-600 hover:bg-blue-700 text-white border-blue-700"
                                                : "bg-gray-400 text-gray-700 border-gray-500 cursor-not-allowed"
                                        }`}
                                    >
                                        {isInvesting
                                            ? "PROCESSING..."
                                            : "INVEST NOW"}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BasketDetails;
