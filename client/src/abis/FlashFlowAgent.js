export const FlashFlowAgent = [
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "bytes32",
          "name": "assetId",
          "type": "bytes32"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "originator",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "faceAmount",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "unlockable",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint8",
          "name": "riskScore",
          "type": "uint8"
        },
        {
          "indexed": false,
          "internalType": "bytes32",
          "name": "basketId",
          "type": "bytes32"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "assetType",
          "type": "string"
        },
        {
          "indexed": false,
          "internalType": "bytes32",
          "name": "documentHash",
          "type": "bytes32"
        }
      ],
      "name": "AssetCreated",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "bytes32",
          "name": "assetId",
          "type": "bytes32"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "unlockAmount",
          "type": "uint256"
        }
      ],
      "name": "AssetFunded",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "bytes32",
          "name": "basketId",
          "type": "bytes32"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "newTotalValue",
          "type": "uint256"
        }
      ],
      "name": "BasketUpdated",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "bytes32",
          "name": "assetId",
          "type": "bytes32"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "investor",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        }
      ],
      "name": "InvestmentRecorded",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "bytes32",
          "name": "assetId",
          "type": "bytes32"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        }
      ],
      "name": "PaymentConfirmed",
      "type": "event"
    },
    {
      "inputs": [
        {
          "internalType": "bytes32",
          "name": "",
          "type": "bytes32"
        }
      ],
      "name": "assets",
      "outputs": [
        {
          "internalType": "bytes32",
          "name": "assetId",
          "type": "bytes32"
        },
        {
          "internalType": "address",
          "name": "originator",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "faceAmount",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "unlockable",
          "type": "uint256"
        },
        {
          "internalType": "uint8",
          "name": "riskScore",
          "type": "uint8"
        },
        {
          "internalType": "bytes32",
          "name": "basketId",
          "type": "bytes32"
        },
        {
          "internalType": "bool",
          "name": "funded",
          "type": "bool"
        },
        {
          "internalType": "bool",
          "name": "paid",
          "type": "bool"
        },
        {
          "internalType": "uint256",
          "name": "paidAmount",
          "type": "uint256"
        },
        {
          "internalType": "bytes32",
          "name": "documentHash",
          "type": "bytes32"
        },
        {
          "internalType": "string",
          "name": "assetType",
          "type": "string"
        },
        {
          "internalType": "uint256",
          "name": "createdAt",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "bytes32",
          "name": "",
          "type": "bytes32"
        },
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "basketAssets",
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
          "internalType": "bytes32",
          "name": "",
          "type": "bytes32"
        }
      ],
      "name": "basketInvestedAmount",
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
          "internalType": "bytes32",
          "name": "",
          "type": "bytes32"
        }
      ],
      "name": "basketTotalValue",
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
          "internalType": "bytes32",
          "name": "assetId",
          "type": "bytes32"
        },
        {
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        }
      ],
      "name": "confirmPayment",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "bytes32",
          "name": "assetId",
          "type": "bytes32"
        },
        {
          "internalType": "address",
          "name": "originator",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "faceAmount",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "unlockable",
          "type": "uint256"
        },
        {
          "internalType": "uint8",
          "name": "riskScore",
          "type": "uint8"
        },
        {
          "internalType": "bytes32",
          "name": "basketId",
          "type": "bytes32"
        },
        {
          "internalType": "string",
          "name": "assetType",
          "type": "string"
        },
        {
          "internalType": "bytes32",
          "name": "documentHash",
          "type": "bytes32"
        }
      ],
      "name": "createAsset",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "bytes32",
          "name": "assetId",
          "type": "bytes32"
        }
      ],
      "name": "getAssetInfo",
      "outputs": [
        {
          "internalType": "address",
          "name": "originator",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "faceAmount",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "unlockable",
          "type": "uint256"
        },
        {
          "internalType": "uint8",
          "name": "riskScore",
          "type": "uint8"
        },
        {
          "internalType": "bytes32",
          "name": "basketId",
          "type": "bytes32"
        },
        {
          "internalType": "bool",
          "name": "funded",
          "type": "bool"
        },
        {
          "internalType": "bool",
          "name": "paid",
          "type": "bool"
        },
        {
          "internalType": "uint256",
          "name": "paidAmount",
          "type": "uint256"
        },
        {
          "internalType": "string",
          "name": "assetType",
          "type": "string"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "bytes32",
          "name": "basketId",
          "type": "bytes32"
        }
      ],
      "name": "getBasketAssets",
      "outputs": [
        {
          "internalType": "bytes32[]",
          "name": "",
          "type": "bytes32[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "bytes32",
          "name": "basketId",
          "type": "bytes32"
        }
      ],
      "name": "getBasketStats",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "totalValue",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "investedAmount",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "assetCount",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getProtocolStats",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "_totalAssets",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "_totalFunded",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "_totalPaid",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "bytes32",
          "name": "",
          "type": "bytes32"
        },
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "name": "investorAllocations",
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
          "internalType": "bytes32",
          "name": "assetId",
          "type": "bytes32"
        },
        {
          "internalType": "uint256",
          "name": "unlockAmount",
          "type": "uint256"
        }
      ],
      "name": "markFunded",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "bytes32",
          "name": "assetId",
          "type": "bytes32"
        },
        {
          "internalType": "bytes32",
          "name": "newBasketId",
          "type": "bytes32"
        }
      ],
      "name": "reassignBasket",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "bytes32",
          "name": "assetId",
          "type": "bytes32"
        },
        {
          "internalType": "address",
          "name": "investor",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        }
      ],
      "name": "recordInvestment",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "totalAssets",
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
      "inputs": [],
      "name": "totalFunded",
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
      "inputs": [],
      "name": "totalPaid",
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
          "internalType": "bytes32",
          "name": "assetId",
          "type": "bytes32"
        },
        {
          "internalType": "uint8",
          "name": "newScore",
          "type": "uint8"
        }
      ],
      "name": "updateRiskScore",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
]