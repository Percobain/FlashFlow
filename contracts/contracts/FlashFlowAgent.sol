// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/**
 * @title FlashFlowAgent
 * @dev Tracks assets and investments
 */
contract FlashFlowAgent {
    struct Asset {
        bytes32 assetId;
        address originator;
        uint256 faceAmount;      // Original invoice/contract amount
        uint256 unlockable;      // Amount to give originator (85% typically)
        uint8 riskScore;         // 0-100 from AI
        bytes32 basketId;        // Which basket it belongs to
        bool funded;             // Has originator received funds?
        bool paid;               // Has payer paid back?
        uint256 paidAmount;      // How much payer has paid
        bytes32 documentHash;    // Hash of uploaded JSON
        string assetType;        // "invoice", "saas", "creator", "rental", "luxury"
        uint256 createdAt;       // Timestamp
    }

    // Core storage
    mapping(bytes32 => Asset) public assets;
    mapping(bytes32 => mapping(address => uint256)) public investorAllocations;
    
    // Basket tracking
    mapping(bytes32 => uint256) public basketTotalValue;
    mapping(bytes32 => uint256) public basketInvestedAmount;
    mapping(bytes32 => bytes32[]) public basketAssets;

    uint256 public totalAssets;
    uint256 public totalFunded;
    uint256 public totalPaid;

    // Events for backend indexing
    event AssetCreated(
        bytes32 indexed assetId, 
        address indexed originator, 
        uint256 faceAmount, 
        uint256 unlockable, 
        uint8 riskScore, 
        bytes32 basketId, 
        string assetType,
        bytes32 documentHash
    );
    event AssetFunded(bytes32 indexed assetId, uint256 unlockAmount);
    event InvestmentRecorded(bytes32 indexed assetId, address indexed investor, uint256 amount);
    event PaymentConfirmed(bytes32 indexed assetId, uint256 amount);
    event BasketUpdated(bytes32 indexed basketId, uint256 newTotalValue);

    function createAsset(
        bytes32 assetId,
        address originator,
        uint256 faceAmount,
        uint256 unlockable,
        uint8 riskScore,
        bytes32 basketId,
        string memory assetType,
        bytes32 documentHash
    ) external {
        Asset storage a = assets[assetId];
        
        // Update basket tracking if new asset
        if (a.assetId == bytes32(0)) {
            totalAssets++;
            basketAssets[basketId].push(assetId);
        }
        
        a.assetId = assetId;
        a.originator = originator;
        a.faceAmount = faceAmount;
        a.unlockable = unlockable;
        a.riskScore = riskScore;
        a.basketId = basketId;
        a.assetType = assetType;
        a.funded = false;
        a.paid = false;
        a.paidAmount = 0;
        a.documentHash = documentHash;
        a.createdAt = block.timestamp;

        // Update basket value
        basketTotalValue[basketId] += faceAmount;

        emit AssetCreated(assetId, originator, faceAmount, unlockable, riskScore, basketId, assetType, documentHash);
        emit BasketUpdated(basketId, basketTotalValue[basketId]);
    }

    function markFunded(bytes32 assetId, uint256 unlockAmount) external {
        Asset storage a = assets[assetId];
        require(!a.funded, "Already funded");
        
        a.funded = true;
        a.unlockable = unlockAmount;
        totalFunded++;
        
        emit AssetFunded(assetId, unlockAmount);
    }

    function recordInvestment(bytes32 assetId, address investor, uint256 amount) external {
        investorAllocations[assetId][investor] += amount;
        
        // Update basket invested amount
        bytes32 basketId = assets[assetId].basketId;
        basketInvestedAmount[basketId] += amount;
        
        emit InvestmentRecorded(assetId, investor, amount);
    }

    function confirmPayment(bytes32 assetId, uint256 amount) external {
        Asset storage a = assets[assetId];
        a.paidAmount += amount;
        
        if (a.paidAmount >= a.faceAmount && !a.paid) {
            a.paid = true;
            totalPaid++;
        }
        
        emit PaymentConfirmed(assetId, amount);
    }

    // Update risk score (AI agent calls this)
    function updateRiskScore(bytes32 assetId, uint8 newScore) external {
        assets[assetId].riskScore = newScore;
    }

    // Assign to different basket
    function reassignBasket(bytes32 assetId, bytes32 newBasketId) external {
        bytes32 oldBasketId = assets[assetId].basketId;
        uint256 faceAmount = assets[assetId].faceAmount;
        
        // Update basket values
        basketTotalValue[oldBasketId] -= faceAmount;
        basketTotalValue[newBasketId] += faceAmount;
        
        assets[assetId].basketId = newBasketId;
        
        emit BasketUpdated(oldBasketId, basketTotalValue[oldBasketId]);
        emit BasketUpdated(newBasketId, basketTotalValue[newBasketId]);
    }

    function getAssetInfo(bytes32 assetId) external view returns (
        address originator,
        uint256 faceAmount,
        uint256 unlockable,
        uint8 riskScore,
        bytes32 basketId,
        bool funded,
        bool paid,
        uint256 paidAmount,
        string memory assetType
    ) {
        Asset storage a = assets[assetId];
        return (
            a.originator, 
            a.faceAmount, 
            a.unlockable, 
            a.riskScore, 
            a.basketId, 
            a.funded,
            a.paid, 
            a.paidAmount, 
            a.assetType
        );
    }

    function getBasketStats(bytes32 basketId) external view returns (
        uint256 totalValue,
        uint256 investedAmount,
        uint256 assetCount
    ) {
        return (
            basketTotalValue[basketId],
            basketInvestedAmount[basketId],
            basketAssets[basketId].length
        );
    }

    function getBasketAssets(bytes32 basketId) external view returns (bytes32[] memory) {
        return basketAssets[basketId];
    }

    function getProtocolStats() external view returns (
        uint256 _totalAssets,
        uint256 _totalFunded,
        uint256 _totalPaid
    ) {
        return (totalAssets, totalFunded, totalPaid);
    }
}