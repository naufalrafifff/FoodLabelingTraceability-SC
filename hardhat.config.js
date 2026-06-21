require("dotenv").config();
require("@nomicfoundation/hardhat-ethers");
require("hardhat-gas-reporter");

const networks = {
  hardhat: {
    chainId: 31337
  },
  localhost: {
    url: "http://127.0.0.1:8545",
    gasPrice: 150_000_000_000
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
  gasReporter: {
    enabled: process.env.REPORT_GAS === "true",
    currency: "USD",
    token: "MATIC",
    price: 0.213735,
    gasPrice: 34,
    offline: true,
    outputFile: process.env.REPORT_GAS === "true" ? "gas-report.txt" : undefined,
    noColors: true
  },
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: false,
        runs: 200
      }
    }
  }
};
