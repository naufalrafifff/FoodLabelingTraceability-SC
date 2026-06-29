require("dotenv").config();
require("@nomicfoundation/hardhat-ethers");
require("hardhat-gas-reporter");

const networks = {
  localhost: {
    url: "http://127.0.0.1:8545",
    gasPrice: 150_000_000_000
  },

  hardhat: {
    chainId: 137,

    forking:
      process.env.POLYGON_RPC_URL
        ? {
            url: process.env.POLYGON_RPC_URL,
            blockNumber: 55555555
          }
        : undefined,

    mining: {
      auto: false,
      interval: 2000
    }
  }
};

if (process.env.POLYGON_RPC_URL && process.env.PRIVATE_KEY) {
  networks.polygon = {
    url: process.env.POLYGON_RPC_URL,
    accounts: [process.env.PRIVATE_KEY]
  };
}

module.exports = {
  defaultNetwork: "hardhat",

  networks,

  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: false,
        runs: 200
      }
    }
  },

  gasReporter: {
    enabled: process.env.REPORT_GAS === "true",
    currency: "USD",
    token: "MATIC",
    gasPrice: 34,
    price: 0.213735,

    coinmarketcap: process.env.CMC_KEY,

    offline: true,

    outputFile:
      process.env.REPORT_GAS === "true"
        ? "gas-report.txt"
        : undefined,

    noColors: true
  }
};