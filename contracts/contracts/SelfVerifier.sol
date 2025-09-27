// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {SelfVerificationRoot} from "@selfxyz/contracts/contracts/abstract/SelfVerificationRoot.sol";
import {ISelfVerificationRoot} from "@selfxyz/contracts/contracts/interfaces/ISelfVerificationRoot.sol";
import {SelfStructs} from "@selfxyz/contracts/contracts/libraries/SelfStructs.sol";
import {SelfUtils} from "@selfxyz/contracts/contracts/libraries/SelfUtils.sol";
import {IIdentityVerificationHubV2} from "@selfxyz/contracts/contracts/interfaces/IIdentityVerificationHubV2.sol";

/**
 * @title SelfVerifier
 * @notice FlashFlow KYC verification using Self Protocol
 * @dev This contract verifies users are 18+ humans for FlashFlow platform
 */
contract SelfVerifier is SelfVerificationRoot {
    // Storage
    SelfStructs.VerificationConfigV2 public verificationConfig;
    bytes32 public verificationConfigId;

    // Events
    event VerificationCompleted(
        address indexed userIdentifier,
        string nationality,
        string issuingState,
        uint256 timestamp
    );
    
    // Mapping to track verified users
    mapping(address => bool) public hasVerified;
    mapping(address => VerificationData) public userVerifications;

    struct VerificationData {
        bool isVerified;
        string nationality;
        string issuingState;
        uint256 verificationTimestamp;
        uint256 nullifier;
        bytes32 attestationId;
    }

    error AlreadyVerified();

    /**
     * @notice Constructor for FlashFlow Self verifier
     * @param identityVerificationHubV2Address The address of the Identity Verification Hub V2
     * @param scopeString String scope for FlashFlow
     */
    constructor(
        address identityVerificationHubV2Address,
        string memory scopeString
    ) SelfVerificationRoot(identityVerificationHubV2Address, scopeString) {
        
        // Create simple verification config for FlashFlow KYC
        SelfUtils.UnformattedVerificationConfigV2 memory unformattedConfig = SelfUtils.UnformattedVerificationConfigV2({
            olderThan: 18,                   
            forbiddenCountries: new string[](0), 
            ofacEnabled: false             
        });

        verificationConfig = SelfUtils.formatVerificationConfigV2(unformattedConfig);
        verificationConfigId = IIdentityVerificationHubV2(identityVerificationHubV2Address)
            .setVerificationConfigV2(verificationConfig);
    }
    
    /**
     * @notice Implementation of customVerificationHook for FlashFlow
     * @dev Called when Self verification is successful
     * @param output The verification output from Self hub
     * @param userData Additional user data (unused)
     */
    function customVerificationHook(
        ISelfVerificationRoot.GenericDiscloseOutputV2 memory output,
        bytes memory userData
    ) internal override {
        // Convert uint256 userIdentifier to address
        address userAddress = address(uint160(output.userIdentifier));
        
        if (hasVerified[userAddress]) {
            revert AlreadyVerified();
        }

        // Mark user as verified
        hasVerified[userAddress] = true;
        
        // Store verification data
        userVerifications[userAddress] = VerificationData({
            isVerified: true,
            nationality: output.nationality,
            issuingState: output.issuingState,
            verificationTimestamp: block.timestamp,
            nullifier: output.nullifier,
            attestationId: output.attestationId
        });

        emit VerificationCompleted(
            userAddress,
            output.nationality,
            output.issuingState,
            block.timestamp
        );
    }

    /**
     * @notice Get the config ID for verification
     * @return The verification config ID
     */
    function getConfigId(
        bytes32 /* destinationChainId */,
        bytes32 /* userIdentifier */,
        bytes memory /* userDefinedData */
    ) public view override returns (bytes32) {
        return verificationConfigId;
    }

    /**
     * @notice Check if a user is verified
     * @param user The user address to check
     * @return Whether the user is verified
     */
    function isUserVerified(address user) external view returns (bool) {
        return hasVerified[user];
    }

    /**
     * @notice Get user verification data
     * @param user The user address
     * @return The verification data struct
     */
    function getUserVerification(address user) external view returns (VerificationData memory) {
        return userVerifications[user];
    }

    /**
     * @notice Get verification config for reference
     * @return The verification config
     */
    function getVerificationConfig() external view returns (SelfStructs.VerificationConfigV2 memory) {
        return verificationConfig;
    }

    /**
     * @notice Get total verified users count
     * @return count of verified users
     */
    function getVerifiedUsersCount() external view returns (uint256) {
        return 0;
    }

    /**
     * @notice Emergency function to check contract state
     * @param hub The identity verification hub address
     * @param configId The verification config ID
     * @param scopeString The scope string used
     * @return hub The hub address
     * @return configId The config ID
     * @return scopeString The scope string
     */
    function getContractInfo() external view returns (
        address hub,
        bytes32 configId,
        string memory scopeString
    ) {
        return (
            address(_identityVerificationHubV2),
            verificationConfigId,
            "flashflow-protocol"
        );
    }

    /**
     * @notice Get the hub address
     * @return The identity verification hub V2 address
     */
    function getHubAddress() external view returns (address) {
        return address(_identityVerificationHubV2);
    }

    /**
     * @notice Get the current scope
     * @return The scope value
     */
    function getScope() external view returns (uint256) {
        return scope();
    }
}