export const SelfVerifier = [
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "identityVerificationHubV2Address",
          "type": "address"
        },
        {
          "internalType": "string",
          "name": "scopeString",
          "type": "string"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "inputs": [],
      "name": "AlreadyVerified",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "InvalidDataFormat",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "UnauthorizedCaller",
      "type": "error"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "userIdentifier",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "nationality",
          "type": "string"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "issuingState",
          "type": "string"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "timestamp",
          "type": "uint256"
        }
      ],
      "name": "VerificationCompleted",
      "type": "event"
    },
    {
      "inputs": [
        {
          "internalType": "bytes32",
          "name": "",
          "type": "bytes32"
        },
        {
          "internalType": "bytes32",
          "name": "",
          "type": "bytes32"
        },
        {
          "internalType": "bytes",
          "name": "",
          "type": "bytes"
        }
      ],
      "name": "getConfigId",
      "outputs": [
        {
          "internalType": "bytes32",
          "name": "",
          "type": "bytes32"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getContractInfo",
      "outputs": [
        {
          "internalType": "address",
          "name": "hub",
          "type": "address"
        },
        {
          "internalType": "bytes32",
          "name": "configId",
          "type": "bytes32"
        },
        {
          "internalType": "string",
          "name": "scopeString",
          "type": "string"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getHubAddress",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getScope",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "user",
          "type": "address"
        }
      ],
      "name": "getUserVerification",
      "outputs": [
        {
          "components": [
            {
              "internalType": "bool",
              "name": "isVerified",
              "type": "bool"
            },
            {
              "internalType": "string",
              "name": "nationality",
              "type": "string"
            },
            {
              "internalType": "string",
              "name": "issuingState",
              "type": "string"
            },
            {
              "internalType": "uint256",
              "name": "verificationTimestamp",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "nullifier",
              "type": "uint256"
            },
            {
              "internalType": "bytes32",
              "name": "attestationId",
              "type": "bytes32"
            }
          ],
          "internalType": "struct SelfVerifier.VerificationData",
          "name": "",
          "type": "tuple"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getVerificationConfig",
      "outputs": [
        {
          "components": [
            {
              "internalType": "bool",
              "name": "olderThanEnabled",
              "type": "bool"
            },
            {
              "internalType": "uint256",
              "name": "olderThan",
              "type": "uint256"
            },
            {
              "internalType": "bool",
              "name": "forbiddenCountriesEnabled",
              "type": "bool"
            },
            {
              "internalType": "uint256[4]",
              "name": "forbiddenCountriesListPacked",
              "type": "uint256[4]"
            },
            {
              "internalType": "bool[3]",
              "name": "ofacEnabled",
              "type": "bool[3]"
            }
          ],
          "internalType": "struct SelfStructs.VerificationConfigV2",
          "name": "",
          "type": "tuple"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getVerifiedUsersCount",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "name": "hasVerified",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "user",
          "type": "address"
        }
      ],
      "name": "isUserVerified",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "bytes",
          "name": "output",
          "type": "bytes"
        },
        {
          "internalType": "bytes",
          "name": "userData",
          "type": "bytes"
        }
      ],
      "name": "onVerificationSuccess",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "scope",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "name": "userVerifications",
      "outputs": [
        {
          "internalType": "bool",
          "name": "isVerified",
          "type": "bool"
        },
        {
          "internalType": "string",
          "name": "nationality",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "issuingState",
          "type": "string"
        },
        {
          "internalType": "uint256",
          "name": "verificationTimestamp",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "nullifier",
          "type": "uint256"
        },
        {
          "internalType": "bytes32",
          "name": "attestationId",
          "type": "bytes32"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "verificationConfig",
      "outputs": [
        {
          "internalType": "bool",
          "name": "olderThanEnabled",
          "type": "bool"
        },
        {
          "internalType": "uint256",
          "name": "olderThan",
          "type": "uint256"
        },
        {
          "internalType": "bool",
          "name": "forbiddenCountriesEnabled",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "verificationConfigId",
      "outputs": [
        {
          "internalType": "bytes32",
          "name": "",
          "type": "bytes32"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "bytes",
          "name": "proofPayload",
          "type": "bytes"
        },
        {
          "internalType": "bytes",
          "name": "userContextData",
          "type": "bytes"
        }
      ],
      "name": "verifySelfProof",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
]