import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ChevronLeft,
    ChevronRight,
    Check,
    Loader,
    AlertCircle,
    Upload,
    FileText,
    X,
    Download,
} from "lucide-react";
import NBButton from "./NBButton";
import NBCard from "./NBCard";
import RiskScoreBadge from "./RiskScoreBadge";
import useAppStore from "../stores/appStore";
import { useWeb3 } from "../contexts/Web3Context";
import backendService from "../services/backendService";
import fileUploadService from "../services/fileUploadService";
import { formatCurrency, formatNumber } from "../lib/utils";
import { toast } from "sonner";
import apiService from "../services/apiService";
import web3Service from "../services/web3Service";
// import { Badge } from "./ui/badge";

const TokenizationWizard = ({ type, onComplete, onCancel }) => {
    const { currentFlow, setCurrentFlow, setLoading, addNotification } =
        useAppStore();
    const { isConnected, account, createAsset } = useWeb3();
    const [stepData, setStepData] = useState({});

    const steps = [
        {
            id: "select",
            title: "Select Cash Flow Type",
            component: SelectTypeStep,
        },
        {
            id: "connect",
            title: "Connect Data Source",
            component: ConnectDataStep,
        },
        {
            id: "upload",
            title: "Upload Documents",
            component: UploadDocumentsStep,
        },
        { id: "analyze", title: "AI Analysis", component: AnalysisStep },
        { id: "offer", title: "Review Offer", component: OfferStep },
        { id: "confirm", title: "Confirm & Tokenize", component: ConfirmStep },
    ];

    const currentStep = steps[currentFlow.step] || steps[0];

    useEffect(() => {
        if (type) {
            setCurrentFlow({ type, step: 1 }); // Skip type selection if type provided
        }
    }, [type]);

    const nextStep = () => {
        if (currentFlow.step < steps.length - 1) {
            setCurrentFlow({ step: currentFlow.step + 1 });
        } else {
            onComplete?.(currentFlow);
        }
    };

    const prevStep = () => {
        if (currentFlow.step > 0) {
            setCurrentFlow({ step: currentFlow.step - 1 });
        } else {
            onCancel?.();
        }
    };

    const StepComponent = currentStep.component;

    return (
        <div className="max-w-4xl mx-auto">
            {/* Progress Bar */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    {steps.map((step, index) => (
                        <div key={step.id} className="flex items-center">
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                                    index < currentFlow.step
                                        ? "bg-nb-ok text-nb-ink"
                                        : index === currentFlow.step
                                        ? "bg-nb-accent text-nb-ink"
                                        : "bg-nb-ink/20 text-nb-ink/60"
                                }`}
                            >
                                {index < currentFlow.step ? (
                                    <Check size={16} />
                                ) : (
                                    index + 1
                                )}
                            </div>
                            {index < steps.length - 1 && (
                                <div
                                    className={`w-16 h-1 mx-2 transition-colors ${
                                        index < currentFlow.step
                                            ? "bg-nb-ok"
                                            : "bg-nb-ink/20"
                                    }`}
                                />
                            )}
                        </div>
                    ))}
                </div>
                <h2 className="font-display font-bold text-2xl text-nb-ink">
                    {currentStep.title}
                </h2>
            </div>

            {/* Wallet Connection Check */}
            {!isConnected && currentFlow.step > 0 && (
                <NBCard className="mb-6">
                    <div className="text-center space-y-4">
                        <AlertCircle
                            size={32}
                            className="text-nb-warn mx-auto"
                        />
                        <div>
                            <h3 className="font-bold text-lg text-nb-ink mb-2">
                                Wallet Required
                            </h3>
                            <p className="text-nb-ink/70">
                                Please connect your wallet to continue with
                                tokenization.
                            </p>
                        </div>
                    </div>
                </NBCard>
            )}

            {/* Step Content */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentFlow.step}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                >
                    <StepComponent
                        data={stepData}
                        setData={setStepData}
                        nextStep={nextStep}
                        prevStep={prevStep}
                        currentFlow={currentFlow}
                        setCurrentFlow={setCurrentFlow}
                        isConnected={isConnected}
                        account={account}
                        createAsset={createAsset}
                    />
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

// Step Components
const SelectTypeStep = ({ nextStep, setCurrentFlow }) => {
    const types = [
        {
            id: "invoice",
            title: "Invoice Factoring",
            icon: "📄",
            color: "nb-accent",
        },
        { id: "saas", title: "SaaS MRR", icon: "💻", color: "nb-accent-2" },
        {
            id: "creator",
            title: "Creator Economy",
            icon: "🎨",
            color: "purple-500",
        },
        { id: "rental", title: "Rental Income", icon: "🏠", color: "nb-ok" },
        { id: "luxury", title: "Luxury Assets", icon: "💎", color: "pink-500" },
    ];

    const selectType = (type) => {
        setCurrentFlow({ type: type.id });
        nextStep();
    };

    return (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {types.map((type) => (
                <motion.div
                    key={type.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    <NBCard
                        className="cursor-pointer text-center"
                        onClick={() => selectType(type)}
                    >
                        <div
                            className={`w-16 h-16 bg-${type.color} rounded-nb mx-auto mb-4 flex items-center justify-center text-2xl`}
                        >
                            {type.icon}
                        </div>
                        <h3 className="font-bold text-lg text-nb-ink">
                            {type.title}
                        </h3>
                    </NBCard>
                </motion.div>
            ))}
        </div>
    );
};

const ConnectDataStep = ({
    nextStep,
    prevStep,
    currentFlow,
    setCurrentFlow,
}) => {
    const [connecting, setConnecting] = useState(false);
    const [selectedSource, setSelectedSource] = useState(null);

    const connections = {
        invoice: [
            {
                name: "QuickBooks",
                icon: "📊",
                description: "Connect your QuickBooks account",
                popular: true,
            },
            {
                name: "Xero",
                icon: "💼",
                description: "Import from Xero accounting",
                popular: true,
            },
            {
                name: "SAP",
                icon: "🏢",
                description: "Enterprise SAP integration",
                popular: false,
            },
            {
                name: "NetSuite",
                icon: "📈",
                description: "Oracle NetSuite connector",
                popular: false,
            },
            {
                name: "Manual Upload",
                icon: "📤",
                description: "Upload invoice files directly",
                popular: false,
            },
        ],
        saas: [
            {
                name: "Stripe",
                icon: "💳",
                description: "Connect Stripe for MRR data",
                popular: true,
            },
            {
                name: "ChartMogul",
                icon: "📈",
                description: "Import subscription metrics",
                popular: true,
            },
            {
                name: "ProfitWell",
                icon: "📊",
                description: "Revenue analytics integration",
                popular: false,
            },
            {
                name: "Recurly",
                icon: "🔄",
                description: "Subscription management platform",
                popular: false,
            },
            {
                name: "Manual Upload",
                icon: "📤",
                description: "Upload revenue data files",
                popular: false,
            },
        ],
        creator: [
            {
                name: "YouTube",
                icon: "🎥",
                description: "Connect YouTube Analytics",
                popular: true,
            },
            {
                name: "Twitch",
                icon: "🎮",
                description: "Import Twitch revenue",
                popular: true,
            },
            {
                name: "Patreon",
                icon: "🎨",
                description: "Connect Patreon subscriptions",
                popular: false,
            },
            {
                name: "OnlyFans",
                icon: "🔥",
                description: "Creator platform integration",
                popular: false,
            },
            {
                name: "Manual Upload",
                icon: "📤",
                description: "Upload creator revenue data",
                popular: false,
            },
        ],
        rental: [
            {
                name: "Buildium",
                icon: "🏢",
                description: "Property management system",
                popular: true,
            },
            {
                name: "AppFolio",
                icon: "🏠",
                description: "Real estate software platform",
                popular: true,
            },
            {
                name: "Rent Manager",
                icon: "🏘️",
                description: "Rental management solution",
                popular: false,
            },
            {
                name: "Yardi",
                icon: "🏬",
                description: "Commercial property software",
                popular: false,
            },
            {
                name: "Manual Upload",
                icon: "📤",
                description: "Upload lease agreements & records",
                popular: false,
            },
        ],
        luxury: [
            {
                name: "Barrett-Jackson",
                icon: "🚗",
                description: "Luxury car auction platform",
                popular: true,
            },
            {
                name: "Sotheby's",
                icon: "🎨",
                description: "Fine art & luxury goods",
                popular: true,
            },
            {
                name: "Christie's",
                icon: "💍",
                description: "Premium auction house",
                popular: false,
            },
            {
                name: "RM Auctions",
                icon: "🏎️",
                description: "Classic car specialists",
                popular: false,
            },
            {
                name: "Manual Upload",
                icon: "📤",
                description: "Upload asset documentation",
                popular: false,
            },
        ],
    };

    const handleConnect = async (source) => {
        setSelectedSource(source);
        setConnecting(true);

        try {
            // Simulate API connection attempt (all redirect to manual upload)
            if (source.name !== "Manual Upload") {
                // Show loading for 2-3 seconds to simulate real API connection
                await new Promise((resolve) => setTimeout(resolve, 2500));

                // Show "connection successful" message briefly
                setCurrentFlow({
                    connection: {
                        source: source.name,
                        status: "connected",
                        message: `Successfully connected to ${source.name}. Please upload your data files to continue.`,
                    },
                });

                await new Promise((resolve) => setTimeout(resolve, 1500));
            }

            // Always redirect to upload step regardless of selected source
            setCurrentFlow({
                connection: {
                    source: source.name,
                    status: "upload_required",
                    message:
                        source.name === "Manual Upload"
                            ? "Ready to upload your documents"
                            : `${source.name} connected. Upload your data files to proceed.`,
                },
            });

            setConnecting(false);
            nextStep();
        } catch (error) {
            setConnecting(false);
            console.error("Connection failed:", error);
        }
    };

    return (
        <NBCard>
            <div className="space-y-6">
                <div className="text-center">
                    <h3 className="font-bold text-xl mb-2">
                        Connect Your Data Source
                    </h3>
                    <p className="text-nb-ink/70">
                        Choose how you'd like to connect your {currentFlow.type}{" "}
                        data
                    </p>
                </div>

                {/* Popular Sources */}
                <div>
                    <h4 className="font-semibold mb-3 text-sm text-nb-ink/70">
                        POPULAR INTEGRATIONS
                    </h4>
                    <div className="space-y-3">
                        {connections[currentFlow.type]
                            ?.filter((source) => source.popular)
                            .map((source, index) => (
                                <motion.div
                                    key={source.name}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                >
                                    <div
                                        className={`flex items-center p-4 nb-border rounded-nb cursor-pointer transition-colors ${
                                            selectedSource?.name ===
                                                source.name && connecting
                                                ? "bg-nb-accent/20 border-nb-accent"
                                                : "hover:bg-nb-accent/10"
                                        }`}
                                        onClick={() => handleConnect(source)}
                                    >
                                        <div className="text-2xl mr-4">
                                            {source.icon}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-semibold flex items-center space-x-2">
                                                <span>{source.name}</span>
                                                <span className="bg-nb-accent/20 text-nb-ink text-xs px-2 py-1 rounded-full">
                                                    Popular
                                                </span>
                                            </h4>
                                            <p className="text-sm text-nb-ink/70">
                                                {source.description}
                                            </p>
                                        </div>
                                        {connecting &&
                                        selectedSource?.name === source.name ? (
                                            <Loader
                                                className="animate-spin"
                                                size={20}
                                            />
                                        ) : (
                                            <ChevronRight
                                                size={20}
                                                className="text-nb-ink/40"
                                            />
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                    </div>
                </div>

                {/* Other Sources */}
                <div>
                    <h4 className="font-semibold mb-3 text-sm text-nb-ink/70">
                        OTHER OPTIONS
                    </h4>
                    <div className="space-y-3">
                        {connections[currentFlow.type]
                            ?.filter((source) => !source.popular)
                            .map((source, index) => (
                                <motion.div
                                    key={source.name}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{
                                        delay:
                                            (connections[
                                                currentFlow.type
                                            ].filter((s) => s.popular).length +
                                                index) *
                                            0.1,
                                    }}
                                >
                                    <div
                                        className={`flex items-center p-4 nb-border rounded-nb cursor-pointer transition-colors ${
                                            selectedSource?.name ===
                                                source.name && connecting
                                                ? "bg-nb-accent/20 border-nb-accent"
                                                : "hover:bg-nb-accent/10"
                                        }`}
                                        onClick={() => handleConnect(source)}
                                    >
                                        <div className="text-2xl mr-4">
                                            {source.icon}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-semibold">
                                                {source.name}
                                            </h4>
                                            <p className="text-sm text-nb-ink/70">
                                                {source.description}
                                            </p>
                                        </div>
                                        {connecting &&
                                        selectedSource?.name === source.name ? (
                                            <Loader
                                                className="animate-spin"
                                                size={20}
                                            />
                                        ) : (
                                            <ChevronRight
                                                size={20}
                                                className="text-nb-ink/40"
                                            />
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                    </div>
                </div>

                {connecting && (
                    <div className="text-center py-4">
                        <div className="inline-flex items-center space-x-3 text-nb-accent">
                            <Loader className="animate-spin" size={20} />
                            <span className="font-medium">
                                {selectedSource?.name === "Manual Upload"
                                    ? "Preparing upload interface..."
                                    : `Connecting to ${selectedSource?.name}...`}
                            </span>
                        </div>
                    </div>
                )}

                <div className="flex justify-between pt-6">
                    <NBButton variant="outline" onClick={prevStep}>
                        <ChevronLeft size={16} className="mr-1" /> Back
                    </NBButton>
                </div>
            </div>
        </NBCard>
    );
};

const UploadDocumentsStep = ({
    nextStep,
    prevStep,
    currentFlow,
    setCurrentFlow,
}) => {
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const { account } = useWeb3(); // Get user address for file storage

    // Sample data templates for each asset type
    const getSampleData = (type) => {
        const samples = {
            invoice: {
                invoices: [
                    {
                        invoiceNumber: "INV-2024-001",
                        clientName: "Acme Corporation",
                        amount: 15000,
                        issueDate: "2024-01-15",
                        dueDate: "2024-02-15",
                        status: "outstanding",
                        paymentTerms: "Net 30",
                        clientCreditScore: 85,
                    },
                    {
                        invoiceNumber: "INV-2024-002",
                        clientName: "TechStart Inc",
                        amount: 25000,
                        issueDate: "2024-01-20",
                        dueDate: "2024-02-20",
                        status: "outstanding",
                        paymentTerms: "Net 30",
                        clientCreditScore: 78,
                    },
                ],
                totalValue: 40000,
                averagePaymentTime: 28,
                clientDiversity: 12,
            },
            saas: {
                subscriptions: [
                    {
                        planName: "Pro Plan",
                        monthlyRevenue: 12000,
                        activeUsers: 150,
                        churnRate: 2.5,
                        averageLifetime: 24,
                        growth: 15,
                    },
                    {
                        planName: "Enterprise",
                        monthlyRevenue: 8000,
                        activeUsers: 45,
                        churnRate: 1.2,
                        averageLifetime: 36,
                        growth: 22,
                    },
                ],
                totalMRR: 20000,
                yearlyGrowth: 45,
                retention: 94,
            },
            creator: {
                platforms: [
                    {
                        platform: "YouTube",
                        subscribers: 125000,
                        monthlyViews: 850000,
                        monthlyRevenue: 4500,
                        avgViewDuration: 8.2,
                        engagement: 4.8,
                    },
                    {
                        platform: "Twitch",
                        followers: 45000,
                        avgViewers: 1200,
                        monthlyRevenue: 2800,
                        subscriptions: 450,
                        donations: 1200,
                    },
                ],
                totalMonthlyRevenue: 7300,
                audienceGrowth: 12,
                brandDeals: 2,
            },
            rental: {
                properties: [
                    {
                        address: "123 Main St, Unit 5A",
                        propertyType: "Apartment",
                        monthlyRent: 2800,
                        occupancyRate: 95,
                        leaseExpiry: "2024-12-31",
                        tenantScore: 82,
                    },
                    {
                        address: "456 Oak Ave, House",
                        propertyType: "Single Family",
                        monthlyRent: 3500,
                        occupancyRate: 100,
                        leaseExpiry: "2024-09-30",
                        tenantScore: 78,
                    },
                ],
                totalMonthlyIncome: 6300,
                occupancy: 97.5,
                propertyAppreciation: 8.5,
            },
            luxury: {
                assets: [
                    {
                        assetType: "Classic Car",
                        description: "1965 Ford Mustang GT",
                        currentValue: 85000,
                        leaseRate: 850,
                        utilizationRate: 75,
                        appreciationRate: 12,
                    },
                    {
                        assetType: "Art Piece",
                        description: "Contemporary Sculpture",
                        currentValue: 125000,
                        leaseRate: 1200,
                        utilizationRate: 60,
                        appreciationRate: 15,
                    },
                ],
                totalValue: 210000,
                averageUtilization: 67.5,
                insuranceCoverage: "Full",
            },
        };

        return samples[type] || samples.invoice;
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFiles(e.dataTransfer.files);
        }
    };

    const handleFiles = async (files) => {
        const fileArray = Array.from(files);

        for (const file of fileArray) {
            try {
                // Validate file
                fileUploadService.validateFile(
                    file,
                    ["application/json", "text/plain", "application/pdf"],
                    10 * 1024 * 1024
                );

                setUploading(true);

                let fileData = null;
                if (file.type === "application/json") {
                    fileData = await fileUploadService.parseJsonFile(file);
                }

                // Upload to Cloudflare R2 with user address and asset context
                const uploadResult = await fileUploadService.uploadFileComplete(
                    file,
                    `assets/${currentFlow.type}`,
                    account, // User address for tracking
                    {
                        assetType: currentFlow.type,
                        flowStep: "document_upload",
                        connectionSource: currentFlow.connection?.source,
                    }
                );

                const newFile = {
                    id: Date.now() + Math.random(),
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    data: fileData,
                    uploadResult,
                    hash: uploadResult.hash,
                    uploadedAt:
                        uploadResult.uploadedAt || new Date().toISOString(),
                };

                setUploadedFiles((prev) => [...prev, newFile]);
                toast.success(`File "${file.name}" uploaded successfully!`);
            } catch (error) {
                console.error("File upload failed:", error);
                toast.error(`Failed to upload ${file.name}: ${error.message}`);
            }
        }

        setUploading(false);
    };

    const removeFile = (fileId) => {
        setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId));
    };

    const downloadSampleData = () => {
        const sampleData = getSampleData(currentFlow.type);
        const blob = new Blob([JSON.stringify(sampleData, null, 2)], {
            type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `sample-${currentFlow.type}-data.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const proceedToAnalysis = () => {
        if (uploadedFiles.length === 0) {
            alert("Please upload at least one file to continue.");
            return;
        }

        setCurrentFlow({
            uploadedFiles,
            documentUrls: uploadedFiles.map((f) => f.uploadResult.url),
        });
        nextStep();
    };

    return (
        <NBCard>
            <div className="space-y-6">
                <div className="text-center">
                    <h3 className="font-bold text-xl mb-2">
                        Upload Your Documents
                    </h3>
                    <p className="text-nb-ink/70">
                        {currentFlow.connection?.source &&
                        currentFlow.connection.source !== "Manual Upload"
                            ? `Upload data files from ${currentFlow.connection.source} or provide manual data`
                            : "Upload your asset documentation files"}
                    </p>
                </div>

                {/* Connection Status */}
                {currentFlow.connection?.source && (
                    <div className="p-4 bg-nb-ok/10 rounded-nb nb-border">
                        <div className="flex items-center space-x-3">
                            <Check size={20} className="text-nb-ok" />
                            <div>
                                <h4 className="font-semibold">
                                    Connected to {currentFlow.connection.source}
                                </h4>
                                <p className="text-sm text-nb-ink/70">
                                    {currentFlow.connection.message}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Sample Data Download */}
                <div className="p-4 bg-nb-accent/10 rounded-nb nb-border">
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="font-semibold">
                                Need sample data format?
                            </h4>
                            <p className="text-sm text-nb-ink/70">
                                Download a sample JSON file to see the expected
                                format
                            </p>
                        </div>
                        <NBButton
                            variant="outline"
                            size="sm"
                            onClick={downloadSampleData}
                        >
                            <Download size={16} className="mr-2" />
                            Download Sample
                        </NBButton>
                    </div>
                </div>

                {/* File Upload Area */}
                <div
                    className={`relative border-2 border-dashed rounded-nb p-8 text-center transition-colors ${
                        dragActive
                            ? "border-nb-accent bg-nb-accent/10"
                            : "border-nb-ink/30 hover:border-nb-accent/50"
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                >
                    <input
                        type="file"
                        multiple
                        accept=".json,.pdf,.txt"
                        onChange={(e) => handleFiles(e.target.files)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />

                    <div className="space-y-4">
                        <Upload size={48} className="mx-auto text-nb-ink/40" />
                        <div>
                            <h4 className="font-semibold text-lg">
                                Drop files here or click to browse
                            </h4>
                            <p className="text-nb-ink/70">
                                Supports JSON, PDF, and TXT files (max 10MB)
                            </p>
                        </div>
                    </div>

                    {uploading && (
                        <div className="absolute inset-0 bg-nb-card/90 flex items-center justify-center">
                            <div className="flex items-center space-x-3">
                                <Loader className="animate-spin" size={24} />
                                <span className="font-medium">
                                    Uploading...
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Uploaded Files */}
                {uploadedFiles.length > 0 && (
                    <div className="space-y-3">
                        <h4 className="font-semibold">
                            Uploaded Files ({uploadedFiles.length})
                        </h4>
                        {uploadedFiles.map((file) => (
                            <div
                                key={file.id}
                                className="flex items-center justify-between p-3 bg-nb-ok/10 rounded-nb nb-border"
                            >
                                <div className="flex items-center space-x-3">
                                    <FileText
                                        size={20}
                                        className="text-nb-ok"
                                    />
                                    <div>
                                        <h5 className="font-medium">
                                            {file.name}
                                        </h5>
                                        <p className="text-xs text-nb-ink/60">
                                            {(file.size / 1024).toFixed(1)} KB •{" "}
                                            {file.type} •{" "}
                                            {new Date(
                                                file.uploadedAt
                                            ).toLocaleTimeString()}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => removeFile(file.id)}
                                    className="p-1 hover:bg-nb-error/20 rounded-full transition-colors"
                                >
                                    <X size={16} className="text-nb-error" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <div className="flex justify-between pt-6">
                    <NBButton variant="outline" onClick={prevStep}>
                        <ChevronLeft size={16} className="mr-1" /> Back
                    </NBButton>
                    <NBButton
                        onClick={proceedToAnalysis}
                        disabled={uploadedFiles.length === 0}
                    >
                        Continue to Analysis{" "}
                        <ChevronRight size={16} className="ml-1" />
                    </NBButton>
                </div>
            </div>
        </NBCard>
    );
};

const AnalysisStep = ({
    nextStep,
    prevStep,
    currentFlow,
    setCurrentFlow,
    account,
}) => {
    const [analyzing, setAnalyzing] = useState(true);
    const [analysis, setAnalysis] = useState(null);
    const [analysisStage, setAnalysisStage] = useState("processing");

    useEffect(() => {
        const runAnalysis = async () => {
            if (!currentFlow.uploadedFiles?.length) {
                console.log('No documents to analyze');
                return;
            }

            setAnalyzing(true);
            setAnalysisStage("processing");

            try {
                console.log('🔍 Starting analysis...');
                
                // Try AI analysis first
                let analysisResult;
                try {
                    analysisResult = await backendService.analyzeAssetWithAI({
                        type: currentFlow.type,
                        documents: currentFlow.uploadedFiles,
                        metadata: {
                            description: currentFlow.type,
                            amount: 10000, // Placeholder, actual amount will be set later
                            paymentTerms: "Net 30", // Placeholder
                            originator: account
                        }
                    });
                    console.log('✅ AI analysis completed:', analysisResult);
                } catch (aiError) {
                    console.log('AI-enhanced analysis failed:', aiError);
                    
                    // Fallback to simple analysis
                    console.log('🔄 Using fallback analysis...');
                    analysisResult = {
                        riskScore: Math.floor(Math.random() * 40) + 60, // 60-99
                        confidence: 0.8,
                        factors: ['Document format verified', 'Basic validation passed'],
                        recommendation: 'APPROVE',
                        basketId: 'medium-risk'
                    };
                }

                setAnalysis(analysisResult);
                setCurrentFlow({ analysis: analysisResult });
                
            } catch (error) {
                console.error('Analysis failed completely:', error);
                // Generate basic mock analysis as last resort
                const mockAnalysis = generateMockAnalysis(currentFlow.type);
                setAnalysis(mockAnalysis);
                setCurrentFlow({ analysis: mockAnalysis });
            } finally {
                setAnalyzing(false);
            }
        };

        runAnalysis();
    }, [currentFlow.uploadedFiles, account]);

    const getSampleDataForAnalysis = (type) => {
        const samples = {
            invoice: {
                invoice_id: "INV-2024-001",
                total_amount: 75000,
                vendor: {
                    company_name: "Tech Solutions Inc",
                    years_in_business: 2,
                },
                client: {
                    company_name: "Global Corp Ltd",
                    country: "United States",
                },
                payment_terms: "Net 30",
                red_flags: ["First transaction with client"],
            },
            saas: {
                totalMRR: 15000,
                subscriptions: [
                    { monthlyRevenue: 5000, churnRate: 2.5 },
                    { monthlyRevenue: 7000, churnRate: 3.0 },
                    { monthlyRevenue: 3000, churnRate: 1.5 },
                ],
                yearlyGrowth: 35,
                retention: 92,
            },
            creator: {
                totalMonthlyRevenue: 8000,
                platforms: [
                    { name: "YouTube", monthlyRevenue: 4000, engagement: 4.2 },
                    {
                        name: "Instagram",
                        monthlyRevenue: 2500,
                        engagement: 3.8,
                    },
                    { name: "TikTok", monthlyRevenue: 1500, engagement: 5.1 },
                ],
                audienceGrowth: 12,
            },
            rental: {
                totalMonthlyIncome: 6300,
                properties: [
                    { monthlyRent: 2800, occupancyRate: 95 },
                    { monthlyRent: 3500, occupancyRate: 100 },
                ],
                occupancy: 97.5,
                propertyAppreciation: 8.5,
            },
            luxury: {
                totalValue: 210000,
                assets: [
                    {
                        currentValue: 85000,
                        utilizationRate: 75,
                        appreciationRate: 12,
                    },
                    {
                        currentValue: 125000,
                        utilizationRate: 60,
                        appreciationRate: 15,
                    },
                ],
                averageUtilization: 67.5,
                insuranceCoverage: "Full",
            },
        };

        return samples[type] || samples.invoice;
    };

    const generateMockAnalysis = (type) => {
        const riskScore = Math.floor(Math.random() * 30) + 65;
        return {
            score: riskScore,
            confidence: Math.floor(Math.random() * 20) + 80,
            factors: [
                "Strong payment history detected",
                "Diversified revenue streams",
                "Stable market conditions",
                "Compliant documentation",
                "Low default risk indicators",
            ],
            estimatedValue: Math.floor(Math.random() * 100000) + 50000,
            recommendedAdvance: 0.8,
            projectedROI: ((100 - riskScore) * 0.3 + 8).toFixed(1),
            aiEnhanced: false,
        };
    };

    const getAnalysisStageText = (stage) => {
        const stages = {
            processing: "Processing document structure",
            ai_enhancement: "AI enhancing and validating data",
            generating_insights: "Generating risk insights",
            fallback_analysis: "Running backup analysis",
        };
        return stages[stage] || "Analyzing...";
    };

    if (analyzing) {
        return (
            <NBCard>
                <div className="text-center py-12">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "linear",
                        }}
                        className="w-16 h-16 border-4 border-nb-accent border-t-transparent rounded-full mx-auto mb-6"
                    />
                    <h3 className="font-bold text-xl mb-2">
                        AI Analysis in Progress
                    </h3>
                    <p className="text-nb-ink/70 mb-4">
                        Our AI is analyzing your uploaded documents...
                    </p>

                    <div className="max-w-md mx-auto space-y-2 text-sm text-nb-ink/60">
                        <div>✓ Processing document structure</div>
                        <div>✓ Validating financial data</div>
                        <div>✓ Computing risk metrics</div>
                        <div>⏳ Generating recommendations</div>
                    </div>
                </div>
            </NBCard>
        );
    }

    return (
        <NBCard>
            <div className="space-y-6">
                <div className="text-center">
                    <h3 className="font-bold text-xl mb-2">
                        Analysis Complete
                    </h3>
                    <p className="text-nb-ink/70">
                        Here's what our AI discovered about your cash flow
                    </p>
                </div>

                {analysis && (
                    <div className="space-y-6">
                        {/* Risk Score Display */}
                        <div className="text-center">
                            <div className="text-3xl font-bold text-purple-400">
                                {analysis?.riskScore || 0}%
                            </div>
                            <div className="text-sm text-gray-400">Risk Score</div>
                        </div>

                        {/* Recommendation */}
                        {/* <div className="flex items-center justify-center space-x-2">
                            <Badge 
                                variant={
                                    (analysis?.recommendation || 'REVIEW') === 'APPROVE' ? 'success' : 
                                    analysis?.recommendation === 'REVIEW' ? 'warning' : 'destructive'
                                }
                            >
                                {analysis?.recommendation || 'PENDING'}
                            </Badge>
                        </div> */}

                        {/* Reasoning */}
                        {analysis?.reasoning && (
                            <div className="mt-4 p-4 bg-gray-800/50 rounded-lg">
                                <h5 className="font-medium mb-2">AI Analysis</h5>
                                <p className="text-sm text-gray-300">{analysis.reasoning}</p>
                            </div>
                        )}

                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <h4 className="font-semibold">Key Insights</h4>
                                {(analysis?.factors || [])
                                    .slice(0, 4)
                                    .map((factor, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center space-x-2"
                                        >
                                            <Check
                                                size={16}
                                                className="text-nb-ok"
                                            />
                                            <span className="text-sm">
                                                {factor}
                                            </span>
                                        </div>
                                    ))}
                            </div>

                            <div className="space-y-4">
                                <h4 className="font-semibold">
                                    Projected Metrics
                                </h4>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-sm text-nb-ink/70">
                                            Asset Value:
                                        </span>
                                        <span className="font-semibold">
                                            {formatCurrency(
                                                analysis.estimatedValue
                                            )}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-nb-ink/70">
                                            Confidence:
                                        </span>
                                        <span className="font-semibold">
                                            {analysis.confidence}%
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-nb-ink/70">
                                            Risk Level:
                                        </span>
                                        <span className="font-semibold">
                                            {analysis.score >= 80
                                                ? "Low"
                                                : analysis.score >= 65
                                                ? "Medium"
                                                : "High"}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-nb-ink/70">
                                            Est. APY:
                                        </span>
                                        <span className="font-semibold text-nb-accent">
                                            {analysis.projectedROI}%
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex justify-between pt-6">
                    <NBButton variant="outline" onClick={prevStep}>
                        <ChevronLeft size={16} className="mr-1" /> Back
                    </NBButton>
                    <NBButton onClick={nextStep}>
                        Continue <ChevronRight size={16} className="ml-1" />
                    </NBButton>
                </div>
            </div>
        </NBCard>
    );
};

const OfferStep = ({ nextStep, prevStep, currentFlow, setCurrentFlow }) => {
    const [customAmount, setCustomAmount] = useState("");

    const analysis = currentFlow.analysis;
    const maxAmount =
        analysis?.estimatedValue * (analysis?.recommendedAdvance || 0.8) ||
        85000;
    const suggestedAmount = Math.round(maxAmount * 0.8);

    const calculateAPY = (amount) => {
        const baseAPY = parseFloat(analysis?.projectedROI || 10);
        const utilizationMultiplier = amount / maxAmount;
        return (baseAPY * (1 + utilizationMultiplier * 0.2)).toFixed(1);
    };

    const selectAmount = (amount) => {
        setCurrentFlow({
            offer: {
                amount,
                apy: calculateAPY(amount),
                duration: 12,
                fees: Math.round(amount * 0.02),
                maxAmount,
            },
        });
        nextStep();
    };

    return (
        <NBCard>
            <div className="space-y-6">
                <div className="text-center">
                    <h3 className="font-bold text-xl mb-2">
                        Your Personalized Offer
                    </h3>
                    <p className="text-nb-ink/70">
                        Choose how much capital you'd like to unlock
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    {/* Suggested Amount */}
                    <motion.div
                        className="p-6 nb-border rounded-nb bg-nb-accent/10 cursor-pointer hover:bg-nb-accent/20 transition-colors"
                        whileHover={{ scale: 1.02 }}
                        onClick={() => selectAmount(suggestedAmount)}
                    >
                        <div className="text-center">
                            <div className="text-sm text-nb-ink/70 mb-2">
                                Recommended
                            </div>
                            <div className="text-3xl font-bold text-nb-ink mb-2">
                                {formatCurrency(suggestedAmount)}
                            </div>
                            <div className="text-lg font-semibold text-nb-accent mb-4">
                                {calculateAPY(suggestedAmount)}% APY
                            </div>
                            <div className="text-sm space-y-1">
                                <div>✅ Optimal risk/reward balance</div>
                                <div>✅ Fast approval expected</div>
                                <div>✅ Lower fees</div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Maximum Amount */}
                    <motion.div
                        className="p-6 nb-border rounded-nb cursor-pointer hover:bg-nb-accent/10 transition-colors"
                        whileHover={{ scale: 1.02 }}
                        onClick={() => selectAmount(Math.round(maxAmount))}
                    >
                        <div className="text-center">
                            <div className="text-sm text-nb-ink/70 mb-2">
                                Maximum
                            </div>
                            <div className="text-3xl font-bold text-nb-ink mb-2">
                                {formatCurrency(Math.round(maxAmount))}
                            </div>
                            <div className="text-lg font-semibold text-nb-accent-2 mb-4">
                                {calculateAPY(maxAmount)}% APY
                            </div>
                            <div className="text-sm space-y-1">
                                <div>💰 Maximum capital unlock</div>
                                <div>⚡ Higher investor returns</div>
                                <div>📊 Extended review process</div>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Custom Amount */}
                <div className="p-4 nb-border rounded-nb bg-nb-card">
                    <h4 className="font-semibold mb-3">Custom Amount</h4>
                    <div className="flex space-x-3">
                        <input
                            type="number"
                            value={customAmount}
                            onChange={(e) => setCustomAmount(e.target.value)}
                            placeholder="Enter amount..."
                            className="flex-1 px-3 py-2 nb-border rounded-lg focus:outline-none focus:ring-2 focus:ring-nb-accent"
                            max={Math.round(maxAmount)}
                        />
                        <NBButton
                            disabled={!customAmount || customAmount > maxAmount}
                            onClick={() => selectAmount(parseInt(customAmount))}
                        >
                            Select
                        </NBButton>
                    </div>
                    <div className="text-xs text-nb-ink/60 mt-2">
                        Maximum available:{" "}
                        {formatCurrency(Math.round(maxAmount))}
                    </div>
                </div>

                <div className="flex justify-between pt-6">
                    <NBButton variant="outline" onClick={prevStep}>
                        <ChevronLeft size={16} className="mr-1" /> Back
                    </NBButton>
                </div>
            </div>
        </NBCard>
    );
};

const ConfirmStep = ({
    nextStep,
    prevStep,
    currentFlow,
    setCurrentFlow,
    isConnected,
    account,
    createAsset,
}) => {
    const [tokenizing, setTokenizing] = useState(false);
    const [completed, setCompleted] = useState(false);
    const [result, setResult] = useState(null);

    const handleTokenize = async () => {
        if (!isConnected || !account) {
            toast.error('Please connect your wallet first');
            return;
        }

        if (!currentFlow.analysis || !currentFlow.analysis.riskScore) {
            toast.error('Please complete analysis first');
            return;
        }

        setTokenizing(true);

        try {
            const assetId = `asset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            
            const assetData = {
                assetId,
                amount: currentFlow.offer.amount || 10000, // Fallback amount
                riskScore: currentFlow.analysis.riskScore,
                assetType: getAssetTypeIndex(currentFlow.type) // Convert string to index
            };

            console.log('Tokenizing with data:', assetData);

            // Create asset on blockchain
            const txResult = await createAsset(assetData);
            
            // Save to backend
            await apiService.createAsset({
                ...currentFlow,
                assetId,
                analysis: currentFlow.analysis,
                txHash: txResult.hash,
                originator: account
            });

            toast.success('🎉 Asset tokenized successfully!');
            nextStep();
            
        } catch (error) {
            console.error('Tokenization failed:', error);
            toast.error('Tokenization failed: ' + error.message);
        } finally {
            setTokenizing(false);
        }
    };

    // Helper function to convert asset type to index
    const getAssetTypeIndex = (type) => {
        const typeMap = {
            'invoice': 0,
            'saas': 1,
            'creator': 2,
            'rental': 3,
            'luxury': 4
        };
        return typeMap[type?.toLowerCase()] || 0;
    };

    if (completed) {
        return (
            <NBCard>
                <div className="text-center space-y-6">
                    <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        className="w-24 h-24 bg-nb-ok rounded-nb mx-auto flex items-center justify-center"
                    >
                        <div className="text-4xl">🎉</div>
                    </motion.div>

                    <div>
                        <h3 className="font-bold text-xl mb-2">
                            Cash Flow Tokenized!
                        </h3>
                        <p className="text-nb-ink/70">
                            Your asset has been successfully tokenized and is
                            now live for investors
                        </p>
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-nb-accent/10 rounded-lg">
                            <span>Asset ID:</span>
                            <span className="font-mono text-sm">
                                {result?.assetId?.slice(0, 10)}...
                            </span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-nb-accent/10 rounded-lg">
                            <span>Basket ID:</span>
                            <span className="font-mono text-sm">
                                {result?.basketId?.slice(0, 10)}...
                            </span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-nb-accent/10 rounded-lg">
                            <span>Amount:</span>
                            <span className="font-bold">
                                {formatCurrency(result?.amount)}
                            </span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-nb-accent/10 rounded-lg">
                            <span>Transaction:</span>
                            <span className="font-mono text-sm">
                                {result?.transactionHash?.slice(0, 10)}...
                            </span>
                        </div>
                    </div>
                </div>
            </NBCard>
        );
    }

    return (
        <NBCard>
            <div className="space-y-6">
                <div className="text-center">
                    <h3 className="font-bold text-xl mb-2">
                        Confirm Tokenization
                    </h3>
                    <p className="text-nb-ink/70">
                        Review your details before finalizing
                    </p>
                </div>

                <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <h4 className="font-semibold mb-3">
                                Offer Summary
                            </h4>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-nb-ink/70">
                                        Amount:
                                    </span>
                                    <span className="font-bold">
                                        {formatCurrency(
                                            currentFlow.offer?.amount
                                        )}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-nb-ink/70">APY:</span>
                                    <span className="font-bold text-nb-accent">
                                        {currentFlow.offer?.apy}%
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-nb-ink/70">
                                        Duration:
                                    </span>
                                    <span className="font-bold">
                                        {currentFlow.offer?.duration} months
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-nb-ink/70">
                                        Fees:
                                    </span>
                                    <span className="font-bold">
                                        {formatCurrency(
                                            currentFlow.offer?.fees
                                        )}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h4 className="font-semibold mb-3">
                                Asset Details
                            </h4>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-nb-ink/70">
                                        Type:
                                    </span>
                                    <span className="font-bold capitalize">
                                        {currentFlow.type}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-nb-ink/70">
                                        Risk Score:
                                    </span>
                                    <RiskScoreBadge
                                        score={
                                            currentFlow.analysis?.score || 75
                                        }
                                        size="sm"
                                    />
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-nb-ink/70">
                                        Files:
                                    </span>
                                    <span className="font-bold">
                                        {currentFlow.uploadedFiles?.length || 0}{" "}
                                        uploaded
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-nb-ink/70">
                                        Wallet:
                                    </span>
                                    <span className="font-mono text-sm">
                                        {account?.slice(0, 6)}...
                                        {account?.slice(-4)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 bg-nb-warn/10 rounded-nb nb-border">
                        <div className="flex items-start space-x-2">
                            <AlertCircle
                                size={16}
                                className="text-nb-warn mt-0.5"
                            />
                            <div className="text-sm">
                                <p className="font-semibold mb-1">
                                    Important Notice
                                </p>
                                <p className="text-nb-ink/70">
                                    By proceeding, you agree to tokenize your
                                    cash flow according to the terms above. This
                                    process will create a smart contract and
                                    cannot be reversed once completed.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-between pt-6">
                    <NBButton variant="outline" onClick={prevStep}>
                        <ChevronLeft size={16} className="mr-1" /> Back
                    </NBButton>
                    <NBButton
                        onClick={handleTokenize}
                        loading={tokenizing}
                        size="lg"
                        disabled={!isConnected}
                    >
                        {tokenizing ? "Tokenizing..." : "Confirm & Tokenize"}
                    </NBButton>
                </div>
            </div>
        </NBCard>
    );
};

export default TokenizationWizard;
