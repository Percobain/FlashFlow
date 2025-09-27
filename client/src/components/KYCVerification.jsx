import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { toast } from 'sonner';

const KYCVerification = ({ userAddress, onVerificationComplete }) => {
  const [kycStatus, setKycStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (userAddress) {
      checkKYCStatus();
    }
  }, [userAddress]);

  const checkKYCStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3000/api/self-verification/status/${userAddress}`);
      const data = await response.json();
      
      if (data.success) {
        setKycStatus(data.user);
      } else {
        setError('Failed to check KYC status');
      }
    } catch (err) {
      setError('Error checking KYC status: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const skipKYC = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('http://localhost:3000/api/self-verification/skip-kyc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userAddress: userAddress
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setKycStatus({
          ...kycStatus,
          isVerified: true,
          status: 'verified',
          skipEnabled: true
        });
        toast.success('KYC verification skipped successfully! 🎉');
        onVerificationComplete && onVerificationComplete(true);
      } else {
        setError('Failed to skip KYC: ' + data.error);
        toast.error('Failed to skip KYC verification');
      }
    } catch (err) {
      setError('Error skipping KYC: ' + err.message);
      toast.error('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const startRealKYC = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('http://localhost:3000/api/self-verification/generate-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userAddress: userAddress
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setShowDetails(true);
        toast.info('Real KYC verification requires Self Protocol mobile app');
      } else {
        setError('Failed to generate verification info: ' + data.error);
      }
    } catch (err) {
      setError('Error starting KYC: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !kycStatus) {
    return (
      <div className="flex items-center justify-center p-8 bg-gray-50 rounded-lg">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Checking KYC status...</span>
      </div>
    );
  }

  if (!kycStatus) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-red-800 mb-2">❌ KYC Status Unknown</h3>
        <p className="text-red-600 mb-4">Unable to check verification status</p>
        <button 
          onClick={checkKYCStatus}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (kycStatus.isVerified) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-green-800 mb-2">✅ KYC Verified</h3>
        <p className="text-green-600 mb-4">You are verified and can participate in FlashFlow</p>
        <div className="bg-white rounded-lg p-4 space-y-2">
          <div className="flex justify-between">
            <span className="font-medium">Status:</span>
            <span className="capitalize">{kycStatus.status}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Method:</span>
            <span>{kycStatus.verificationMethod || 'Self Protocol'}</span>
          </div>
          {kycStatus.skipEnabled && (
            <div className="bg-orange-100 border border-orange-200 rounded-lg p-3 mt-3">
              <p className="text-orange-800 text-sm">⚠️ Demo mode - verification skipped for testing</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-2">🔐 KYC Verification Required</h3>
      <p className="text-gray-600 mb-6">To participate in FlashFlow, you need to complete identity verification.</p>
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p className="text-red-600 text-sm">❌ {error}</p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {/* Demo Option */}
        <div className="border border-orange-200 rounded-lg p-4 bg-orange-50">
          <h4 className="font-semibold text-orange-800 mb-2">🚀 Demo Mode (Skip KYC)</h4>
          <p className="text-orange-700 text-sm mb-4">
            Skip verification for demo purposes. This allows immediate access to test the platform.
          </p>
          <button 
            onClick={skipKYC} 
            disabled={loading}
            className="w-full bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Processing...' : 'Skip KYC (Demo)'}
          </button>
          <p className="text-orange-600 text-xs mt-2">⚠️ For demo/testing only</p>
        </div>

        {/* Real Verification Option */}
        <div className="border border-green-200 rounded-lg p-4 bg-green-50">
          <h4 className="font-semibold text-green-800 mb-2">🔒 Real Verification (Self Protocol)</h4>
          <p className="text-green-700 text-sm mb-4">
            Complete secure, privacy-preserving identity verification using Self Protocol.
          </p>
          <button 
            onClick={startRealKYC} 
            disabled={loading}
            className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Generating...' : 'Start Real KYC'}
          </button>
          <p className="text-green-600 text-xs mt-2">✅ Production ready</p>
        </div>
      </div>

      {/* Real KYC Instructions */}
      {showDetails && (
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-800 mb-3">📱 Real Verification Instructions</h4>
          <div className="space-y-2 text-sm text-blue-700">
            <p>• Download the Self Protocol mobile app from app store</p>
            <p>• Create a Self ID if you don't have one</p>
            <p>• Go to 'Verify Identity' section in the app</p>
            <p>• Scan your passport using NFC verification</p>
            <p>• Generate your zero-knowledge proof</p>
            <p>• Submit the proof to our contract on Celo Sepolia</p>
            <p>• Return to FlashFlow to complete verification</p>
          </div>
          <div className="mt-3 p-3 bg-white rounded border">
            <p className="text-xs text-gray-600">
              <strong>Contract:</strong> {process.env.REACT_APP_SELF_VERIFIER_ADDRESS || '0xc47bA4fA2B3713Fe1B1d62b5aF18B649aD36329A'}
            </p>
            <p className="text-xs text-gray-600">
              <strong>Network:</strong> Celo Sepolia Testnet
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default KYCVerification;
