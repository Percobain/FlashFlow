import React, { useState } from 'react';
import WalletConnection from '../components/WalletConnection';
import KYCVerification from '../components/KYCVerification';

const KYCTest = () => {
  const [connectedWallet, setConnectedWallet] = useState(null);
  const [isVerified, setIsVerified] = useState(false);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          FlashFlow KYC Testing
        </h1>
        <p className="text-gray-600">
          Test Self Protocol integration with wallet connection and KYC verification
        </p>
      </div>

      {/* Step 1: Wallet Connection */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4">Step 1: Connect Wallet</h2>
        <WalletConnection onWalletConnected={setConnectedWallet} />
      </div>

      {/* Step 2: KYC Verification */}
      {connectedWallet && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Step 2: KYC Verification</h2>
          <KYCVerification 
            userAddress={connectedWallet}
            onVerificationComplete={setIsVerified}
          />
        </div>
      )}

      {/* Step 3: Ready to Use */}
      {isVerified && (
        <div className="bg-gradient-to-r from-green-400 to-blue-500 rounded-lg p-6 text-white text-center">
          <h2 className="text-2xl font-bold mb-2">🎉 Ready to Use FlashFlow!</h2>
          <p className="mb-4">
            Your wallet is connected and KYC verification is complete.
          </p>
          <div className="flex justify-center space-x-4">
            <button className="bg-white text-green-600 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
              Start Investing
            </button>
            <button className="bg-transparent border-2 border-white text-white px-6 py-2 rounded-lg font-semibold hover:bg-white hover:text-green-600 transition-colors">
              Create Asset
            </button>
          </div>
        </div>
      )}

      {/* Testing Info */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="font-semibold text-gray-800 mb-3">Testing Information</h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
          <div>
            <h4 className="font-medium text-gray-800">For Demo Mode:</h4>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Use any Ethereum wallet address</li>
              <li>No funds required</li>
              <li>Click "Skip KYC (Demo)" for instant verification</li>
              <li>Perfect for testing and demonstrations</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-800">For Real Testing:</h4>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Switch to Kadena EVM Testnet</li>
              <li>Use "Start Real KYC" (requires Self Protocol app)</li>
              <li>Real blockchain transactions</li>
              <li>Production-ready verification</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KYCTest;