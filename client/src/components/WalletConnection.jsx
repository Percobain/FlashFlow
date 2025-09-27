import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { toast } from 'sonner';

const WalletConnection = ({ onWalletConnected }) => {
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(false);
  const [chainId, setChainId] = useState(null);

  useEffect(() => {
    checkWalletConnection();
    
    // Listen for account changes
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, []);

  const checkWalletConnection = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          onWalletConnected && onWalletConnected(accounts[0]);
          
          const provider = new ethers.BrowserProvider(window.ethereum);
          const network = await provider.getNetwork();
          setChainId(network.chainId.toString());
        }
      } catch (error) {
        console.error('Error checking wallet connection:', error);
      }
    }
  };

  const handleAccountsChanged = (accounts) => {
    if (accounts.length > 0) {
      setAccount(accounts[0]);
      onWalletConnected && onWalletConnected(accounts[0]);
      toast.success('Wallet account changed');
    } else {
      setAccount(null);
      onWalletConnected && onWalletConnected(null);
      toast.info('Wallet disconnected');
    }
  };

  const handleChainChanged = (chainId) => {
    setChainId(parseInt(chainId, 16).toString());
    toast.info('Network changed');
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      toast.error('MetaMask not found! Please install MetaMask.');
      return;
    }

    try {
      setLoading(true);
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        onWalletConnected && onWalletConnected(accounts[0]);
        
        const provider = new ethers.BrowserProvider(window.ethereum);
        const network = await provider.getNetwork();
        setChainId(network.chainId.toString());
        
        toast.success('Wallet connected successfully! 🎉');
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      toast.error('Failed to connect wallet: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const switchToKadenaEVM = async () => {
    try {
      // Kadena EVM Testnet
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0xAA1E40' }], // 11142220 in hex
      });
      toast.success('Switched to Kadena EVM Testnet');
    } catch (switchError) {
      if (switchError.code === 4902) {
        try {
          // Add Kadena EVM Testnet
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0xAA1E40',
              chainName: 'Kadena EVM Testnet',
              nativeCurrency: {
                name: 'TKDA',
                symbol: 'TKDA',
                decimals: 18
              },
              rpcUrls: ['https://evm.testevm.kuro.io'],
              blockExplorerUrls: ['https://explorer.evm.testevm.kuro.io']
            }]
          });
          toast.success('Kadena EVM Testnet added and switched');
        } catch (addError) {
          toast.error('Failed to add Kadena EVM Testnet');
        }
      } else {
        toast.error('Failed to switch network');
      }
    }
  };

  const getNetworkName = (chainId) => {
    const networks = {
      '1': 'Ethereum Mainnet',
      '11155111': 'Sepolia Testnet',
      '5920': 'Kadena EVM Testnet',
      '11142220': 'Celo Sepolia Testnet',
    };
    return networks[chainId] || `Chain ID: ${chainId}`;
  };

  if (!account) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Connect Your Wallet</h2>
        <p className="text-gray-600 mb-6">
          Connect your wallet to start using FlashFlow. You don't need any funds for testing.
        </p>
        
        {!window.ethereum ? (
          <div className="space-y-4">
            <p className="text-red-600">MetaMask not detected</p>
            <a 
              href="https://metamask.io/download/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-block bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors"
            >
              Install MetaMask
            </a>
          </div>
        ) : (
          <button 
            onClick={connectWallet}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Connecting...' : 'Connect Wallet'}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-green-800">✅ Wallet Connected</h3>
          <p className="text-green-600 text-sm font-mono">
            {account.slice(0, 6)}...{account.slice(-4)}
          </p>
          <p className="text-green-600 text-xs">
            Network: {getNetworkName(chainId)}
          </p>
        </div>
        
        {chainId !== '11142220' && (
          <button
            onClick={switchToKadenaEVM}
            className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
          >
            Switch to Kadena EVM
          </button>
        )}
      </div>
    </div>
  );
};

export default WalletConnection;
