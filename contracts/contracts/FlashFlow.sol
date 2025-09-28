// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

/**
 * @title FlashFlow - All-in-One Protocol
 * @dev Single contract handling all FlashFlow operations
 */
contract FlashFlow {
    // Asset structure
    struct Asset {
        address originator;
        uint256 amount;         // Invoice/contract amount
        uint256 unlockable;     // Amount to pay originator (85%)
        uint8 riskScore;        // 0-100 from AI
        string basketId;        // Which basket (based on risk)
        bool funded;            // Has originator received funds?
        bool repaid;            // Has buyer paid back?
        uint256 repaidAmount;   // Amount repaid so far
        string assetType;       // invoice/saas/creator/rental/luxury
        uint256 timestamp;
    }

    // Investment tracking
    struct Investment {
        address investor;
        string basketId;
        uint256 amount;
        uint256 timestamp;
    }

    // State variables
    IERC20 public fUSD;
    address public poolAddress;
    uint256 public poolBalance;
    
    mapping(string => Asset) public assets;
    mapping(string => Investment[]) public basketInvestments;
    mapping(string => uint256) public basketTotalInvested;
    mapping(string => uint256) public basketTotalValue;
    mapping(address => mapping(string => uint256)) public investorBasketShares;
    
    // Events - critical for frontend updates
    event AssetCreated(string indexed assetId, address indexed originator, uint256 amount, string basketId);
    event AssetFunded(string indexed assetId, address indexed originator, uint256 amount);
    event InvestmentMade(string indexed basketId, address indexed investor, uint256 amount);
    event RepaymentReceived(string indexed assetId, uint256 amount);
    event ReturnsDistributed(string indexed basketId, uint256 amount);
    event TransactionProcessed(address sender, string action, bool success);
    
    constructor(address _fUSD) {
        fUSD = IERC20(_fUSD);
        poolAddress = address(this);
    }
    
    // Create asset and assign to basket based on risk score
    function createAsset(
        string memory assetId,
        uint256 amount,
        uint8 riskScore,
        string memory assetType
    ) external {
        try this._createAssetInternal(assetId, amount, riskScore, assetType, msg.sender) {
            emit TransactionProcessed(msg.sender, "createAsset", true);
        } catch {
            emit TransactionProcessed(msg.sender, "createAsset", false);
        }
    }
    
    function _createAssetInternal(
        string memory assetId,
        uint256 amount,
        uint8 riskScore,
        string memory assetType,
        address originator
    ) external {
        require(msg.sender == address(this), "Internal only");
        
        // Determine basket based on risk score
        string memory basketId = getBasketId(riskScore);
        uint256 unlockable = (amount * 85) / 100; // 85% unlockable
        
        assets[assetId] = Asset({
            originator: originator,
            amount: amount,
            unlockable: unlockable,
            riskScore: riskScore,
            basketId: basketId,
            funded: false,
            repaid: false,
            repaidAmount: 0,
            assetType: assetType,
            timestamp: block.timestamp
        });
        
        basketTotalValue[basketId] += amount;
        
        emit AssetCreated(assetId, originator, amount, basketId);
    }
    
    // Fund asset - transfers fUSD from pool to originator
    function fundAsset(string memory assetId) external {
        Asset storage asset = assets[assetId];
        
        // Skip if already funded or no asset exists
        if (asset.funded || asset.originator == address(0)) {
            emit TransactionProcessed(msg.sender, "fundAsset", false);
            return;
        }
        
        uint256 actualBalance = fUSD.balanceOf(address(this));
        uint256 amountToTransfer = asset.unlockable;
        
        // Adjust amount if pool doesn't have enough
        if (actualBalance < amountToTransfer) {
            amountToTransfer = actualBalance;
        }
        
        if (amountToTransfer > 0) {
            // Try to transfer, but don't revert
            try fUSD.transfer(asset.originator, amountToTransfer) returns (bool success) {
                if (success) {
                    asset.funded = true;
                    poolBalance = actualBalance - amountToTransfer;
                    emit AssetFunded(assetId, asset.originator, amountToTransfer);
                    emit TransactionProcessed(msg.sender, "fundAsset", true);
                } else {
                    emit TransactionProcessed(msg.sender, "fundAsset", false);
                }
            } catch {
                emit TransactionProcessed(msg.sender, "fundAsset", false);
            }
        }
    }
    
    // Invest in a basket
    function investInBasket(string memory basketId, uint256 amount) external {
        // Try to transfer from investor
        try fUSD.transferFrom(msg.sender, address(this), amount) returns (bool success) {
            if (success) {
                basketInvestments[basketId].push(Investment({
                    investor: msg.sender,
                    basketId: basketId,
                    amount: amount,
                    timestamp: block.timestamp
                }));
                
                basketTotalInvested[basketId] += amount;
                investorBasketShares[msg.sender][basketId] += amount;
                poolBalance += amount;
                
                emit InvestmentMade(basketId, msg.sender, amount);
                emit TransactionProcessed(msg.sender, "investInBasket", true);
            } else {
                emit TransactionProcessed(msg.sender, "investInBasket", false);
            }
        } catch {
            emit TransactionProcessed(msg.sender, "investInBasket", false);
        }
    }
    
    // Simulate repayment from buyer
    function simulateRepayment(string memory assetId, uint256 amount) external {
        Asset storage asset = assets[assetId];
        
        // Try to transfer to pool
        try fUSD.transferFrom(msg.sender, address(this), amount) returns (bool success) {
            if (success) {
                asset.repaidAmount += amount;
                if (asset.repaidAmount >= asset.amount) {
                    asset.repaid = true;
                }
                
                poolBalance += amount;
                
                emit RepaymentReceived(assetId, amount);
                
                // Try to distribute returns
                _tryDistributeReturns(asset.basketId, amount);
                emit TransactionProcessed(msg.sender, "simulateRepayment", true);
            } else {
                emit TransactionProcessed(msg.sender, "simulateRepayment", false);
            }
        } catch {
            emit TransactionProcessed(msg.sender, "simulateRepayment", false);
        }
    }
    
    // Safe distribution of returns
    function _tryDistributeReturns(string memory basketId, uint256 amount) internal {
        uint256 totalInvested = basketTotalInvested[basketId];
        if (totalInvested == 0) return;
        
        Investment[] memory investments = basketInvestments[basketId];
        uint256 distributed = 0;
        
        for (uint i = 0; i < investments.length; i++) {
            uint256 share = (amount * investments[i].amount) / totalInvested;
            if (share > 0 && poolBalance >= share) {
                try fUSD.transfer(investments[i].investor, share) returns (bool success) {
                    if (success) {
                        poolBalance -= share;
                        distributed += share;
                    }
                } catch {
                    // Continue to next investor
                }
            }
        }
        
        if (distributed > 0) {
            emit ReturnsDistributed(basketId, distributed);
        }
    }
    
    // Get basket ID based on risk score
    function getBasketId(uint8 riskScore) public pure returns (string memory) {
        if (riskScore >= 80) return "low-risk";
        if (riskScore >= 60) return "medium-low-risk";
        if (riskScore >= 40) return "medium-risk";
        if (riskScore >= 20) return "medium-high-risk";
        return "high-risk";
    }
    
    // View functions (these can't fail)
    function getAsset(string memory assetId) external view returns (
        address originator,
        uint256 amount,
        uint256 unlockable,
        uint8 riskScore,
        string memory basketId,
        bool funded,
        bool repaid,
        uint256 repaidAmount
    ) {
        Asset memory asset = assets[assetId];
        return (
            asset.originator,
            asset.amount,
            asset.unlockable,
            asset.riskScore,
            asset.basketId,
            asset.funded,
            asset.repaid,
            asset.repaidAmount
        );
    }
    
    function getBasketStats(string memory basketId) external view returns (
        uint256 totalValue,
        uint256 totalInvested,
        uint256 investorCount
    ) {
        return (
            basketTotalValue[basketId],
            basketTotalInvested[basketId],
            basketInvestments[basketId].length
        );
    }
    
    function getPoolBalance() external view returns (uint256) {
        return fUSD.balanceOf(address(this));
    }
    
    // Emergency: Update pool balance if needed (for testing)
    function syncPoolBalance() external {
        poolBalance = fUSD.balanceOf(address(this));
        emit TransactionProcessed(msg.sender, "syncPoolBalance", true);
    }

    receive() external payable {
        emit TransactionProcessed(msg.sender, "receive", true);
    }
    
    fallback() external payable {
        emit TransactionProcessed(msg.sender, "fallback", true);
    }
}