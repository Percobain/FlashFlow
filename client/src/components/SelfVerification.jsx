import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';

const SelfVerification = ({ userAddress, onVerificationComplete }) => {
    const [verificationStatus, setVerificationStatus] = useState('idle');
    const [verificationUrl, setVerificationUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [contractInfo, setContractInfo] = useState(null);

    // Check initial verification status
    useEffect(() => {
        if (userAddress) {
            checkVerificationStatus();
        }
    }, [userAddress]);

    const checkVerificationStatus = async () => {
        try {
            const response = await fetch(`/api/self/status/${userAddress}`);
            const data = await response.json();
            
            if (data.success) {
                if (data.data.database.verified || data.data.database.kycStatus === 'verified') {
                    setVerificationStatus('completed');
                    onVerificationComplete?.(data.data);
                }
            }
        } catch (error) {
            console.error('Failed to check verification status:', error);
        }
    };

    const startSelfVerification = async () => {
        try {
            setLoading(true);
            
            const response = await fetch(
                `/api/self/verification-url/${userAddress}?returnUrl=${encodeURIComponent(window.location.origin + '/verification-complete')}`
            );
            
            const data = await response.json();
            
            if (data.success) {
                setVerificationUrl(data.data.verificationUrl);
                setContractInfo(data.data.contractInfo);
                setVerificationStatus('pending');
                
                // Start polling for verification completion
                pollVerificationStatus();
            }
        } catch (error) {
            console.error('Failed to start verification:', error);
        } finally {
            setLoading(false);
        }
    };

    const skipKycForDemo = async () => {
        try {
            setLoading(true);
            
            const response = await fetch('/api/self/demo-skip', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ userAddress })
            });
            
            const data = await response.json();
            
            if (data.success) {
                setVerificationStatus('demo-skipped');
                onVerificationComplete?.(data.data);
            }
        } catch (error) {
            console.error('Demo skip failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const pollVerificationStatus = () => {
        const pollInterval = setInterval(async () => {
            try {
                const response = await fetch(`/api/self/status/${userAddress}`);
                const data = await response.json();
                
                if (data.success && (data.data.database.verified || data.data.onChain.verified)) {
                    setVerificationStatus('completed');
                    clearInterval(pollInterval);
                    onVerificationComplete?.(data.data);
                }
            } catch (error) {
                console.error('Polling error:', error);
            }
        }, 3000); // Poll every 3 seconds

        // Stop polling after 10 minutes
        setTimeout(() => clearInterval(pollInterval), 600000);
    };

    return (
        <div className="bg-white rounded-xl shadow-lg p-6 max-w-md mx-auto">
            <h3 className="text-xl font-bold mb-4 text-center">
                🛡️ Identity Verification
            </h3>
            
            {verificationStatus === 'idle' && (
                <div className="text-center space-y-4">
                    <p className="text-gray-600 mb-6">
                        Verify your identity to start investing in FlashFlow assets.
                    </p>
                    
                    {/* Real Self Protocol Verification */}
                    <button 
                        onClick={startSelfVerification}
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Generating...' : '🔒 Verify with Passport (Real KYC)'}
                    </button>
                    
                    <div className="text-sm text-gray-500 my-3">or</div>
                    
                    {/* Demo Skip Button */}
                    <button 
                        onClick={skipKycForDemo}
                        disabled={loading}
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Processing...' : '🚀 Skip KYC (Demo Only)'}
                    </button>
                    
                    <p className="text-xs text-gray-400 mt-2">
                        Skip option is for demo purposes only
                    </p>
                </div>
            )}

            {verificationStatus === 'pending' && verificationUrl && (
                <div className="text-center space-y-4">
                    <p className="text-gray-600 mb-4">📱 Scan this QR code with your mobile device:</p>
                    
                    <div className="flex justify-center mb-4">
                        <QRCodeSVG value={verificationUrl} size={200} />
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-4 text-left">
                        <h4 className="font-semibold mb-2">Instructions:</h4>
                        <ol className="text-sm space-y-1 list-decimal list-inside">
                            <li>Scan the QR code above</li>
                            <li>Install the Self app if prompted</li>
                            <li>Scan your passport using NFC</li>
                            <li>Generate your zero-knowledge proof</li>
                            <li>Submit verification</li>
                        </ol>
                    </div>
                    
                    <p className="text-sm text-blue-600">⏳ Waiting for verification completion...</p>
                    
                    {contractInfo && (
                        <div className="text-xs text-gray-500">
                            <p>Contract: {contractInfo.address}</p>
                            <p>Chain ID: {contractInfo.chainId}</p>
                        </div>
                    )}
                </div>
            )}

            {verificationStatus === 'completed' && (
                <div className="text-center space-y-4">
                    <div className="text-green-600">
                        <svg className="w-16 h-16 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <h4 className="text-lg font-semibold">✅ Verification Completed!</h4>
                    </div>
                    <p className="text-gray-600">You can now invest in FlashFlow assets.</p>
                </div>
            )}

            {verificationStatus === 'demo-skipped' && (
                <div className="text-center space-y-4">
                    <div className="text-orange-600">
                        <svg className="w-16 h-16 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <h4 className="text-lg font-semibold">🚀 Demo Mode Activated</h4>
                    </div>
                    <p className="text-gray-600">KYC bypassed for demonstration purposes.</p>
                    <p className="text-xs text-orange-500">Note: In production, real verification would be required.</p>
                </div>
            )}
        </div>
    );
};

export default SelfVerification;