import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { toast } from 'sonner';
import { Loader2, Wallet, TrendingUp, DollarSign } from 'lucide-react';
import { formatBalance, formatCurrency, formatNumber } from '../lib/utils';

const Web3Integration = () => {
  const {
    isConnected,
    account,
    balances,
    connectWallet,
    depositToPool,
    createAsset,
    investInAsset,
    getPoolStats,
    getProtocolStats,
    refreshBalances
  } = useWeb3();

  const [poolStats, setPoolStats] = useState(null);
  const [protocolStats, setProtocolStats] = useState(null);
  const [loading, setLoading] = useState(false);

  // Load stats when connected
  useEffect(() => {
    if (isConnected) {
      loadStats();
    }
  }, [isConnected]);

  const loadStats = async () => {
    try {
      const [pool, protocol] = await Promise.all([
        getPoolStats(),
        getProtocolStats()
      ]);
      setPoolStats(pool);
      setProtocolStats(protocol);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleDepositToPool = async () => {
    try {
      setLoading(true);
      await depositToPool(100); // Deposit 100 fUSD
      await loadStats();
      await refreshBalances();
      toast.success('Deposited to pool successfully!');
    } catch (error) {
      toast.error('Failed to deposit to pool');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTestAsset = async () => {
    try {
      setLoading(true);
      
      const assetData = {
        originator: account,
        faceAmount: 1000,
        unlockable: 800,
        riskScore: 75,
        assetType: 'invoice',
        documentData: {
          invoiceNumber: 'INV-001',
          amount: 1000,
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        }
      };

      await createAsset(assetData);
      await loadStats();
      toast.success('Test asset created successfully!');
    } catch (error) {
      toast.error('Failed to create test asset');
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Connect Your Wallet</h2>
        <p className="text-gray-600 mb-6">
          Connect your wallet to interact with FlashFlow smart contracts
        </p>
        <button 
          onClick={connectWallet}
          className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors mx-auto"
        >
          <Wallet size={16} />
          <span>Connect Wallet</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Account Info */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Account Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-600">Address</p>
            <p className="font-mono text-sm">{account}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">fUSD Balance</p>
            <p className="font-semibold">{formatBalance(balances.token)} fUSD</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">KDA Balance</p>
            <p className="font-semibold">{formatBalance(balances.native, 4)} KDA</p>
          </div>
        </div>
      </div>

      {/* Pool Stats */}
      {poolStats && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Pool Statistics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Pool Balance</p>
              <p className="font-semibold">{formatCurrency(poolStats.balance)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Deposited</p>
              <p className="font-semibold">{formatCurrency(poolStats.deposited)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Released</p>
              <p className="font-semibold">{formatCurrency(poolStats.released)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Protocol Stats */}
      {protocolStats?.blockchain && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Protocol Statistics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Total Assets</p>
              <p className="font-semibold">{formatNumber(protocolStats.blockchain.totalAssets)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Funded</p>
              <p className="font-semibold">{formatCurrency(protocolStats.blockchain.totalFunded)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Paid</p>
              <p className="font-semibold">{formatCurrency(protocolStats.blockchain.totalPaid)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={handleDepositToPool}
            disabled={loading}
            className="flex items-center justify-center space-x-2 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <DollarSign size={16} />
            )}
            <span>Deposit 100 fUSD to Pool</span>
          </button>

          <button
            onClick={handleCreateTestAsset}
            disabled={loading}
            className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <TrendingUp size={16} />
            )}
            <span>Create Test Asset</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Web3Integration;
