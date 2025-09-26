// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Counter {
    uint256 private _value;

    event Increment(address indexed account, uint256 newValue);
    event Decrement(address indexed account, uint256 newValue);
    event Set(address indexed account, uint256 newValue);
    event Reset(address indexed account);

    constructor(uint256 initialValue) {
        _value = initialValue;
        emit Set(msg.sender, initialValue);
    }

    function get() external view returns (uint256) {
        return _value;
    }

    function increment() external {
        unchecked {
            _value += 1;
        }
        emit Increment(msg.sender, _value);
    }

    function decrement() external {
        require(_value > 0, "Counter: underflow");
        unchecked {
            _value -= 1;
        }
        emit Decrement(msg.sender, _value);
    }

    function set(uint256 newValue) external {
        _value = newValue;
        emit Set(msg.sender, newValue);
    }

    function reset() external {
        _value = 0;
        emit Reset(msg.sender);
    }
}