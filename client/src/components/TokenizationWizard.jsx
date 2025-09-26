import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Check, Loader, AlertCircle } from 'lucide-react';
import NBButton from './NBButton';
import NBCard from './NBCard';
import RiskScoreBadge from './RiskScoreBadge';
import useAppStore from '../stores/appStore';
import receivablesService from '../services/receivablesService';
import aiOracleService from '../services/aiOracleService';
import didService from '../services/didService';

const TokenizationWizard = ({ type, onComplete, onCancel }) => {
  const { currentFlow, setCurrentFlow, setLoading, addNotification } = useAppStore();
  const [stepData, setStepData] = useState({});
  
  const steps = [
    { id: 'select', title: 'Select Cash Flow Type', component: SelectTypeStep },
    { id: 'connect', title: 'Connect Data Source', component: ConnectDataStep },
    { id: 'analyze', title: 'AI Analysis', component: AnalysisStep },
    { id: 'offer', title: 'Review Offer', component: OfferStep },
    { id: 'kyc', title: 'KYC Verification', component: KYCStep },
    { id: 'confirm', title: 'Confirm & Tokenize', component: ConfirmStep },
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
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                index < currentFlow.step ? 'bg-nb-ok text-nb-ink' :
                index === currentFlow.step ? 'bg-nb-accent text-nb-ink' :
                'bg-nb-ink/20 text-nb-ink/60'
              }`}>
                {index < currentFlow.step ? <Check size={16} /> : index + 1}
              </div>
              {index < steps.length - 1 && (
                <div className={`w-16 h-1 mx-2 transition-colors ${
                  index < currentFlow.step ? 'bg-nb-ok' : 'bg-nb-ink/20'
                }`} />
              )}
            </div>
          ))}
        </div>
        <h2 className="font-display font-bold text-2xl text-nb-ink">{currentStep.title}</h2>
      </div>
      
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
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

// Step Components
const SelectTypeStep = ({ nextStep, setCurrentFlow }) => {
  const types = [
    { id: 'invoice', title: 'Invoice Factoring', icon: '📄', color: 'nb-accent' },
    { id: 'saas', title: 'SaaS MRR', icon: '💻', color: 'nb-accent-2' },
    { id: 'creator', title: 'Creator Economy', icon: '🎨', color: 'nb-purple' },
    { id: 'rental', title: 'Rental Income', icon: '🏠', color: 'nb-ok' },
    { id: 'luxury', title: 'Luxury Assets', icon: '💎', color: 'nb-pink' },
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
          <NBCard className="cursor-pointer text-center" onClick={() => selectType(type)}>
            <div className={`w-16 h-16 bg-${type.color} rounded-nb mx-auto mb-4 flex items-center justify-center text-2xl`}>
              {type.icon}
            </div>
            <h3 className="font-bold text-lg text-nb-ink">{type.title}</h3>
          </NBCard>
        </motion.div>
      ))}
    </div>
  );
};

const ConnectDataStep = ({ nextStep, prevStep, currentFlow, setCurrentFlow }) => {
  const [connecting, setConnecting] = useState(false);
  
  const connections = {
    invoice: [
      { name: 'QuickBooks', icon: '📊', description: 'Connect your QuickBooks account' },
      { name: 'Xero', icon: '💼', description: 'Import from Xero accounting' },
      { name: 'Manual Upload', icon: '📤', description: 'Upload invoice files' },
    ],
    saas: [
      { name: 'Stripe', icon: '💳', description: 'Connect Stripe for MRR data' },
      { name: 'ChartMogul', icon: '📈', description: 'Import subscription metrics' },
      { name: 'Custom API', icon: '🔗', description: 'Connect via API' },
    ],
    creator: [
      { name: 'YouTube', icon: '🎥', description: 'Connect YouTube Analytics' },
      { name: 'Twitch', icon: '🎮', description: 'Import Twitch revenue' },
      { name: 'Patreon', icon: '🎨', description: 'Connect Patreon subscriptions' },
    ],
    rental: [
      { name: 'Property Manager', icon: '🏢', description: 'Connect property management system' },
      { name: 'Rental Platform', icon: '🏠', description: 'Import from rental platform' },
      { name: 'Manual Documents', icon: '📄', description: 'Upload lease agreements' },
    ],
    luxury: [
      { name: 'Asset Registry', icon: '💎', description: 'Connect to luxury asset registry' },
      { name: 'Lease Platform', icon: '🚗', description: 'Import from lease platform' },
      { name: 'Manual Entry', icon: '✍️', description: 'Enter asset details manually' },
    ],
  };
  
  const handleConnect = async (source) => {
    setConnecting(true);
    try {
      const connection = await receivablesService.connectDataSource(currentFlow.type, { source: source.name });
      setCurrentFlow({ connection });
      setTimeout(() => {
        setConnecting(false);
        nextStep();
      }, 2000);
    } catch (error) {
      setConnecting(false);
      console.error('Connection failed:', error);
    }
  };
  
  return (
    <NBCard>
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="font-bold text-xl mb-2">Connect Your Data Source</h3>
          <p className="text-nb-ink/70">Choose how you'd like to connect your {currentFlow.type} data</p>
        </div>
        
        <div className="space-y-4">
          {connections[currentFlow.type]?.map((source, index) => (
            <motion.div
              key={source.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div 
                className="flex items-center p-4 nb-border rounded-nb cursor-pointer hover:bg-nb-accent/10 transition-colors"
                onClick={() => handleConnect(source)}
              >
                <div className="text-2xl mr-4">{source.icon}</div>
                <div className="flex-1">
                  <h4 className="font-semibold">{source.name}</h4>
                  <p className="text-sm text-nb-ink/70">{source.description}</p>
                </div>
                {connecting ? (
                  <Loader className="animate-spin" size={20} />
                ) : (
                  <ChevronRight size={20} className="text-nb-ink/40" />
                )}
              </div>
            </motion.div>
          ))}
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

const AnalysisStep = ({ nextStep, prevStep, currentFlow, setCurrentFlow }) => {
  const [analyzing, setAnalyzing] = useState(true);
  const [analysis, setAnalysis] = useState(null);
  
  useEffect(() => {
    const runAnalysis = async () => {
      try {
        // Mock receivable for analysis
        const mockReceivable = { id: 'temp_123', type: currentFlow.type, amount: 50000 };
        const result = await aiOracleService.calculateRiskScore(mockReceivable);
        setAnalysis(result);
        setCurrentFlow({ analysis: result });
        setAnalyzing(false);
      } catch (error) {
        console.error('Analysis failed:', error);
        setAnalyzing(false);
      }
    };
    
    runAnalysis();
  }, []);
  
  if (analyzing) {
    return (
      <NBCard>
        <div className="text-center py-12">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-nb-accent border-t-transparent rounded-full mx-auto mb-4"
          />
          <h3 className="font-bold text-xl mb-2">AI Analysis in Progress</h3>
          <p className="text-nb-ink/70">Our AI is analyzing your cash flow patterns...</p>
        </div>
      </NBCard>
    );
  }
  
  return (
    <NBCard>
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="font-bold text-xl mb-2">Analysis Complete</h3>
          <p className="text-nb-ink/70">Here's what our AI discovered about your cash flow</p>
        </div>
        
        {analysis && (
          <div className="space-y-6">
            <div className="flex justify-center">
              <RiskScoreBadge 
                score={analysis.score}
                factors={analysis.factors}
                size="lg"
              />
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-semibold">Key Insights</h4>
                {analysis.factors.slice(0, 4).map((factor, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Check size={16} className="text-nb-ok" />
                    <span className="text-sm">{factor}</span>
                  </div>
                ))}
              </div>
              
              <div className="space-y-4">
                <h4 className="font-semibold">Projected Metrics</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-nb-ink/70">Confidence:</span>
                    <span className="font-semibold">{analysis.confidence}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-nb-ink/70">Risk Level:</span>
                    <span className="font-semibold">
                      {analysis.score >= 80 ? 'Low' : analysis.score >= 65 ? 'Medium' : 'High'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-nb-ink/70">Est. APY:</span>
                    <span className="font-semibold text-nb-accent">
                      {((100 - analysis.score) * 0.3 + 8).toFixed(1)}%
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
  const [customAmount, setCustomAmount] = useState('');
  
  const analysis = currentFlow.analysis;
  const maxAmount = 85000; // Mock max unlock amount
  const suggestedAmount = Math.round(maxAmount * 0.8);
  
  const calculateAPY = (amount) => {
    const baseAPY = ((100 - analysis?.score || 75) * 0.3 + 8);
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
      }
    });
    nextStep();
  };
  
  return (
    <NBCard>
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="font-bold text-xl mb-2">Your Personalized Offer</h3>
          <p className="text-nb-ink/70">Choose how much capital you'd like to unlock</p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* Suggested Amount */}
          <motion.div
            className="p-6 nb-border rounded-nb bg-nb-accent/10 cursor-pointer hover:bg-nb-accent/20 transition-colors"
            whileHover={{ scale: 1.02 }}
            onClick={() => selectAmount(suggestedAmount)}
          >
            <div className="text-center">
              <div className="text-sm text-nb-ink/70 mb-2">Recommended</div>
              <div className="text-3xl font-bold text-nb-ink mb-2">
                ${suggestedAmount.toLocaleString()}
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
            onClick={() => selectAmount(maxAmount)}
          >
            <div className="text-center">
              <div className="text-sm text-nb-ink/70 mb-2">Maximum</div>
              <div className="text-3xl font-bold text-nb-ink mb-2">
                ${maxAmount.toLocaleString()}
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
              max={maxAmount}
            />
            <NBButton 
              disabled={!customAmount || customAmount > maxAmount}
              onClick={() => selectAmount(parseInt(customAmount))}
            >
              Select
            </NBButton>
          </div>
          <div className="text-xs text-nb-ink/60 mt-2">
            Maximum available: ${maxAmount.toLocaleString()}
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

const KYCStep = ({ nextStep, prevStep, currentFlow }) => {
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  
  const handleKYC = async () => {
    setVerifying(true);
    try {
      await didService.verifyKYC(currentFlow.user?.address);
      setVerified(true);
      setTimeout(() => {
        setVerifying(false);
        nextStep();
      }, 2000);
    } catch (error) {
      setVerifying(false);
      console.error('KYC failed:', error);
    }
  };
  
  return (
    <NBCard>
      <div className="text-center space-y-6">
        <div>
          <h3 className="font-bold text-xl mb-2">Identity Verification</h3>
          <p className="text-nb-ink/70">Quick verification with Self.xyz for compliance</p>
        </div>
        
        {!verified ? (
          <div className="space-y-6">
            <div className="w-24 h-24 bg-nb-accent/20 rounded-nb mx-auto flex items-center justify-center">
              <div className="text-4xl">🛡️</div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold">Required Documents</h4>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <Check size={16} className="text-nb-ok" />
                  <span>Government ID</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check size={16} className="text-nb-ok" />
                  <span>Address Proof</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check size={16} className="text-nb-ok" />
                  <span>Income Verification</span>
                </div>
              </div>
            </div>
            
            <NBButton 
              size="lg" 
              onClick={handleKYC} 
              loading={verifying}
              className="w-full md:w-auto"
            >
              {verifying ? 'Verifying...' : 'Start Verification'}
            </NBButton>
          </div>
        ) : (
          <div className="space-y-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-24 h-24 bg-nb-ok rounded-nb mx-auto flex items-center justify-center"
            >
              <Check size={32} className="text-nb-ink" />
            </motion.div>
            <div>
              <h4 className="font-bold text-lg text-nb-ok">Verification Complete!</h4>
              <p className="text-nb-ink/70">Your identity has been successfully verified</p>
            </div>
          </div>
        )}
        
        <div className="flex justify-between pt-6">
          <NBButton variant="outline" onClick={prevStep}>
            <ChevronLeft size={16} className="mr-1" /> Back
          </NBButton>
          {verified && (
            <NBButton onClick={nextStep}>
              Continue <ChevronRight size={16} className="ml-1" />
            </NBButton>
          )}
        </div>
      </div>
    </NBCard>
  );
};

const ConfirmStep = ({ nextStep, prevStep, currentFlow, setCurrentFlow }) => {
  const [tokenizing, setTokenizing] = useState(false);
  const [completed, setCompleted] = useState(false);
  
  const handleTokenize = async () => {
    setTokenizing(true);
    try {
      const result = await receivablesService.tokenizeReceivable('temp_123', currentFlow.offer.amount);
      setCurrentFlow({ result });
      setCompleted(true);
      setTimeout(() => {
        setTokenizing(false);
        nextStep();
      }, 3000);
    } catch (error) {
      setTokenizing(false);
      console.error('Tokenization failed:', error);
    }
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
            <h3 className="font-bold text-xl mb-2">Cash Flow Tokenized!</h3>
            <p className="text-nb-ink/70">Your receivable has been successfully tokenized and is now live for investors</p>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-nb-accent/10 rounded-lg">
              <span>Token ID:</span>
              <span className="font-mono text-sm">{currentFlow.result?.tokenId}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-nb-accent/10 rounded-lg">
              <span>Basket:</span>
              <span className="font-mono text-sm">{currentFlow.result?.basketId}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-nb-accent/10 rounded-lg">
              <span>Amount:</span>
              <span className="font-bold">${currentFlow.offer?.amount.toLocaleString()}</span>
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
          <h3 className="font-bold text-xl mb-2">Confirm Tokenization</h3>
          <p className="text-nb-ink/70">Review your details before finalizing</p>
        </div>
        
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3">Offer Summary</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-nb-ink/70">Amount:</span>
                  <span className="font-bold">${currentFlow.offer?.amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-nb-ink/70">APY:</span>
                  <span className="font-bold text-nb-accent">{currentFlow.offer?.apy}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-nb-ink/70">Duration:</span>
                  <span className="font-bold">{currentFlow.offer?.duration} months</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-nb-ink/70">Fees:</span>
                  <span className="font-bold">${currentFlow.offer?.fees.toLocaleString()}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3">Risk Assessment</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-nb-ink/70">Risk Score:</span>
                  <RiskScoreBadge score={currentFlow.analysis?.score || 75} size="sm" />
                </div>
                <div className="flex justify-between">
                  <span className="text-nb-ink/70">Confidence:</span>
                  <span className="font-bold">{currentFlow.analysis?.confidence}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-nb-ink/70">KYC Status:</span>
                  <span className="font-bold text-nb-ok">✅ Verified</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-4 bg-nb-warn/10 rounded-nb nb-border">
            <div className="flex items-start space-x-2">
              <AlertCircle size={16} className="text-nb-warn mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold mb-1">Important Notice</p>
                <p className="text-nb-ink/70">
                  By proceeding, you agree to tokenize your cash flow according to the terms above. 
                  This process cannot be reversed once completed.
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
          >
            {tokenizing ? 'Tokenizing...' : 'Confirm & Tokenize'}
          </NBButton>
        </div>
      </div>
    </NBCard>
  );
};

export default TokenizationWizard;