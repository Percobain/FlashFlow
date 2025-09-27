import apiService from './apiService.js';
import { toast } from 'sonner';

class BackendService {
  constructor() {
    this.apiService = apiService;
  }

  // ===== USER MANAGEMENT =====

  // Get or create user profile (now handled automatically in Web3Context)
  async getUserProfile(address) {
    try {
      return await this.apiService.getUserProfile(address);
    } catch (error) {
      console.error('Failed to get user profile:', error);
      throw error;
    }
  }

  // Update user profile
  async updateUserProfile(address, updateData) {
    try {
      const response = await this.apiService.updateUserProfile(address, updateData);
      toast.success('Profile updated successfully!');
      return response;
    } catch (error) {
      console.error('❌ Failed to update user profile:', error);
      toast.error('Failed to update profile');
      throw error;
    }
  }

  // ===== KYC MANAGEMENT =====

  // Submit KYC data
  async submitKYC(address, kycData) {
    try {
      const response = await this.apiService.submitKYC({
        address,
        ...kycData,
        submittedAt: new Date().toISOString()
      });
      
      toast.success('KYC submitted successfully! Review in progress.');
      return response;
    } catch (error) {
      console.error('❌ Failed to submit KYC:', error);
      toast.error('Failed to submit KYC');
      throw error;
    }
  }

  // Get KYC status
  async getKYCStatus(address) {
    try {
      return await this.apiService.getKYCStatus(address);
    } catch (error) {
      console.error('❌ Failed to get KYC status:', error);
      throw error;
    }
  }

  // ===== ASSET MANAGEMENT =====

  // Analyze asset data
  async analyzeAssetData(assetData) {
    try {
      const response = await fetch('http://localhost:3000/api/analyze-asset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(assetData),
      });

      if (!response.ok) {
        throw new Error('Asset analysis failed');
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Failed to analyze asset data:', error);
      throw error;
    }
  }

  // Create asset in backend
  async createAsset(assetData) {
    try {
      const response = await this.apiService.createAsset({
        ...assetData,
        createdAt: new Date().toISOString(),
        status: 'pending'
      });
      
      toast.success('Asset created in backend!');
      return response;
    } catch (error) {
      console.error('❌ Failed to create asset in backend:', error);
      toast.error('Failed to create asset');
      throw error;
    }
  }

  // Get assets with filters
  async getAssets(filters = {}) {
    try {
      return await this.apiService.getAssets(filters);
    } catch (error) {
      console.error('❌ Failed to get assets:', error);
      throw error;
    }
  }

  // Update asset status
  async updateAssetStatus(assetId, status, updateData = {}) {
    try {
      const response = await this.apiService.updateAsset(assetId, {
        status,
        ...updateData,
        updatedAt: new Date().toISOString()
      });
      
      return response;
    } catch (error) {
      console.error('❌ Failed to update asset status:', error);
      throw error;
    }
  }

  // ===== INVESTMENT MANAGEMENT =====

  // Create investment record
  async createInvestment(investmentData) {
    try {
      const response = await this.apiService.createInvestment({
        ...investmentData,
        createdAt: new Date().toISOString(),
        status: 'active'
      });
      
      toast.success('Investment recorded!');
      return response;
    } catch (error) {
      console.error('❌ Failed to create investment:', error);
      toast.error('Failed to record investment');
      throw error;
    }
  }

  // Get user investments
  async getUserInvestments(address, filters = {}) {
    try {
      return await this.apiService.getInvestments({
        investorAddress: address,
        ...filters
      });
    } catch (error) {
      console.error('❌ Failed to get user investments:', error);
      throw error;
    }
  }

  // ===== COMPLETE WORKFLOW FUNCTIONS =====

  // Complete asset tokenization workflow (with automatic seller type addition)
  async completeAssetTokenization(assetData, web3Service) {
    try {
      const steps = [];
      
      // Step 1: Create asset in backend
      steps.push('Creating asset record...');
      toast.loading(steps[0], { id: 'tokenization' });
      
      const backendAsset = await this.createAsset(assetData);
      
      // Step 2: Generate IDs for blockchain
      const assetId = web3Service.generateAssetId(assetData.originator, Date.now());
      const basketId = web3Service.generateBasketId(assetData.assetType, Date.now());
      const documentHash = web3Service.generateDocumentHash(assetData.documentData || {});
      
      // Step 3: Create asset on blockchain
      steps.push('Creating asset on blockchain...');
      toast.loading(steps[1], { id: 'tokenization' });
      
      const blockchainResult = await web3Service.createAsset({
        ...assetData,
        basketId,
        documentHash
      });
      
      // Step 4: Update backend with blockchain data
      steps.push('Updating backend records...');
      toast.loading(steps[2], { id: 'tokenization' });
      
      await this.updateAssetStatus(backendAsset.id, 'created', {
        assetId: blockchainResult.assetId,
        basketId,
        transactionHash: blockchainResult.receipt.hash,
        blockNumber: blockchainResult.receipt.blockNumber
      });
      
      toast.success('Asset tokenization completed!', { id: 'tokenization' });
      
      return {
        backendAsset,
        blockchainResult,
        assetId: blockchainResult.assetId,
        basketId
      };
    } catch (error) {
      toast.error('Asset tokenization failed', { id: 'tokenization' });
      console.error('❌ Asset tokenization workflow failed:', error);
      throw error;
    }
  }

  // Complete investment workflow (with automatic investor type addition)
  async completeInvestmentWorkflow(investmentData, web3Service) {
    try {
      // Step 1: Record investment in backend
      toast.loading('Recording investment...', { id: 'investment' });
      
      const backendInvestment = await this.createInvestment(investmentData);
      
      // Step 2: Execute investment on blockchain
      toast.loading('Processing blockchain transaction...', { id: 'investment' });
      
      const blockchainResult = await web3Service.recordInvestment(
        investmentData.assetId,
        investmentData.investorAddress,
        investmentData.amount
      );
      
      // Step 3: Update backend with transaction details
      await this.apiService.updateInvestment(backendInvestment.id, {
        transactionHash: blockchainResult.hash,
        blockNumber: blockchainResult.blockNumber,
        status: 'confirmed'
      });
      
      toast.success('Investment completed successfully!', { id: 'investment' });
      
      return {
        backendInvestment,
        blockchainResult
      };
    } catch (error) {
      toast.error('Investment workflow failed', { id: 'investment' });
      console.error('❌ Investment workflow failed:', error);
      throw error;
    }
  }

  // Complete funding workflow
  async completeFundingWorkflow(fundingData, web3Service) {
    try {
      // Step 1: Release funds from pool
      toast.loading('Releasing funds from pool...', { id: 'funding' });
      
      const releaseResult = await web3Service.releaseFunds(
        fundingData.assetId,
        fundingData.originator,
        fundingData.amount
      );
      
      // Step 2: Mark asset as funded
      toast.loading('Marking asset as funded...', { id: 'funding' });
      
      const fundedResult = await web3Service.markFunded(
        fundingData.assetId,
        fundingData.unlockAmount
      );
      
      // Step 3: Update backend status
      await this.updateAssetStatus(fundingData.backendAssetId, 'funded', {
        fundedAt: new Date().toISOString(),
        fundingTransactionHash: fundedResult.hash,
        releaseTransactionHash: releaseResult.hash,
        unlockAmount: fundingData.unlockAmount
      });
      
      toast.success('Funding completed successfully!', { id: 'funding' });
      
      return {
        releaseResult,
        fundedResult
      };
    } catch (error) {
      toast.error('Funding workflow failed', { id: 'funding' });
      console.error('❌ Funding workflow failed:', error);
      throw error;
    }
  }

  // ===== ANALYTICS =====

  // Get user analytics
  async getUserAnalytics(address) {
    try {
      const [profile, investments, payments] = await Promise.all([
        this.getUserProfile(address),
        this.getUserInvestments(address),
        this.apiService.getPaymentHistory(address)
      ]);

      return {
        profile,
        investments: {
          total: investments.length,
          totalAmount: investments.reduce((sum, inv) => sum + inv.amount, 0),
          activeInvestments: investments.filter(inv => inv.status === 'active').length
        },
        payments: {
          total: payments.length,
          totalAmount: payments.reduce((sum, pay) => sum + pay.amount, 0),
          successfulPayments: payments.filter(pay => pay.status === 'completed').length
        }
      };
    } catch (error) {
      console.error('❌ Failed to get user analytics:', error);
      throw error;
    }
  }

  // Get protocol analytics
  async getProtocolAnalytics() {
    try {
      const response = await this.apiService.request('/api/analytics/protocol');
      return response;
    } catch (error) {
      console.error('❌ Failed to get protocol analytics:', error);
      return null; // Return null instead of throwing to avoid breaking other calls
    }
  }

  // ===== BLOCKCHAIN INTEGRATION =====

  // Sync blockchain data with backend
  async syncBlockchainData(address, blockchainData) {
    try {
      const response = await this.apiService.request('/api/blockchain/sync', {
        method: 'POST',
        body: {
          address,
          ...blockchainData,
          syncedAt: new Date().toISOString()
        }
      });
      
      return response;
    } catch (error) {
      console.error('❌ Failed to sync blockchain data:', error);
      throw error;
    }
  }
}

// Create and export singleton instance
const backendService = new BackendService();
export default backendService;
