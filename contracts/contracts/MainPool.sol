// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

interface IERC20Simple {
    function transferFrom(address from, address to, uint256 amt) external returns(bool);
    function transfer(address to, uint256 amt) external returns(bool);
    function balanceOf(address owner) external view returns (uint256);
}

/**
 * @title MainPool
 * @dev Holds fUSD and releases funds
 */
contract MainPool {
    address public token;
    uint256 public totalReleased;
    uint256 public totalDeposited;

    mapping(bytes32 => uint256) public releasedPerAsset;
    mapping(bytes32 => bool) public assetFunded;

    event FundsDeposited(address indexed who, uint256 amount);
    event FundsReleased(bytes32 indexed assetId, address indexed originator, uint256 amount);

    constructor(address tokenAddr) {
        token = tokenAddr;
    }

    function deposit(uint256 amount) external {
        require(IERC20Simple(token).transferFrom(msg.sender, address(this), amount), "Transfer failed");
        totalDeposited += amount;
        emit FundsDeposited(msg.sender, amount);
    }

    function releaseFunds(bytes32 assetId, address originator, uint256 amount) external {
        require(getPoolBalance() >= amount, "Insufficient pool balance");
        require(IERC20Simple(token).transfer(originator, amount), "Transfer failed");
        
        releasedPerAsset[assetId] += amount;
        assetFunded[assetId] = true;
        totalReleased += amount;
        
        emit FundsReleased(assetId, originator, amount);
    }

    function getPoolBalance() public view returns (uint256) {
        return IERC20Simple(token).balanceOf(address(this));
    }

    function getPoolStats() external view returns (
        uint256 balance,
        uint256 released,
        uint256 deposited
    ) {
        return (getPoolBalance(), totalReleased, totalDeposited);
    }

    function emergencyWithdraw(address to) external {
        uint256 balance = getPoolBalance();
        if (balance > 0) {
            IERC20Simple(token).transfer(to, balance);
        }
    }
}