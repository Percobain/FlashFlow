// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/**
 * @title FlashFlowToken (fUSD)
 * @dev Minimal ERC20 for demo - anyone can mint!
 */
contract FlashFlowToken {
    string public name = "tFlash USD";
    string public symbol = "tFUSD";
    uint8 public decimals = 18;
    uint256 public totalSupply;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 amount);
    event Approval(address indexed owner, address indexed spender, uint256 amount);

    constructor(uint256 initialMint) {
        if (initialMint > 0) {
            _mint(msg.sender, initialMint);
        }
    }

    function _mint(address to, uint256 amt) internal {
        totalSupply += amt;
        balanceOf[to] += amt;
        emit Transfer(address(0), to, amt);
    }

    // PUBLIC MINT - ANYONE CAN MINT (INSECURE BY DESIGN FOR DEMO)
    function mint(address to, uint256 amt) external {
        _mint(to, amt);
    }

    function transfer(address to, uint256 amt) external returns (bool) {
        require(balanceOf[msg.sender] >= amt, "Insufficient balance");
        balanceOf[msg.sender] -= amt;
        balanceOf[to] += amt;
        emit Transfer(msg.sender, to, amt);
        return true;
    }

    function approve(address spender, uint256 amt) external returns (bool) {
        allowance[msg.sender][spender] = amt;
        emit Approval(msg.sender, spender, amt);
        return true;
    }

    function transferFrom(address from, address to, uint256 amt) external returns (bool) {
        require(balanceOf[from] >= amt, "Insufficient balance");
        require(allowance[from][msg.sender] >= amt, "Insufficient allowance");
        allowance[from][msg.sender] -= amt;
        balanceOf[from] -= amt;
        balanceOf[to] += amt;
        emit Transfer(from, to, amt);
        return true;
    }

    // Helper function for demo UI
    function decimalsMultiplier() external pure returns (uint256) {
        return 10**18;
    }
}