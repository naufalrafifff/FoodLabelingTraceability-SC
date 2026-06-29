# Food Labeling Traceability Smart Contract

A blockchain-based food labeling traceability system for nutrition facts verification, certification validation, and supply chain transparency.

This repository contains the smart contracts, deployment scripts, testing framework, and reproducibility materials developed for the paper:

> **"Verifiable Nutrition Labeling for Food Security: A Traceability-Based Information Infrastructure"**

---

# 📂 Repository Structure

```text
FoodLabelingTraceability-SC/
│
├── contracts/
│   ├── CPPOBValidationContract.sol
│   ├── PermitValidationContract.sol
│   ├── CoAValidationContract.sol
│   └── SupplyChainTrackingContract.sol
│
├── scripts/
│   ├── deploy.js
│   ├── stresTest.js
│   └── simulation/
│       └── simulateAll.js
│
├── test/
│   └── GasReport.test.js
│
├── verificationData.json
├── account.txt
├── gas-report.txt
├── hardhat.config.js
├── package.json
├── LICENSE
├── CITATION.cff
└── README.md
```

---

# 📘 Project Overview

Food labeling plays an important role in ensuring food safety, consumer trust, and regulatory compliance. However, conventional food labeling systems often rely on centralized databases that may be vulnerable to data manipulation, limited transparency, and inefficient verification processes.

This project introduces a blockchain-based traceability framework that enables immutable recording and verification of food-related certifications and nutrition information across the supply chain using Ethereum-compatible smart contracts.

The system validates:

* CPPOB (Good Processed Food Manufacturing Practices) certification
* Product permit validation
* Certificate of Analysis (CoA)
* Supply chain tracking records
* Nutrition facts verification

---

# 🏗 Smart Contract Architecture

The system consists of four interconnected smart contracts:

```text
CPPOB Validation
        │
        ▼
Permit Validation
        │
        ▼
CoA Validation
        │
        ▼
Supply Chain Tracking
```

### CPPOBValidationContract

Responsible for registering and validating CPPOB certifications issued to food manufacturers.

### PermitValidationContract

Responsible for managing product permit and regulatory approval information.

### CoAValidationContract

Responsible for storing and validating Certificate of Analysis (CoA) records.

### SupplyChainTrackingContract

Responsible for recording supply chain activities and traceability information throughout the product lifecycle.

---

# 📁 Example Dataset

Sample verification data used during testing and simulation is provided in:

```text
verificationData.json
```

The dataset includes:

* CPPOB certification records
* Product permit information
* Certificate of Analysis data
* Supply chain traceability information
* Nutrition facts metadata

These data are provided solely for reproducibility and testing purposes.

---

# ⚙ Software Requirements

The experiments reported in the paper were conducted using the following environment:

| Component                       | Version  |
| ------------------------------- | -------- |
| Node.js                         | v22.14.0 |
| npm                             | v10.9.2  |
| Solidity Compiler (solc)        | v0.8.28  |
| Hardhat                         | v2.22.19 |
| Ethers.js                       | v6.13.5  |
| @nomicfoundation/hardhat-ethers | v3.0.8   |
| hardhat-gas-reporter            | v2.2.3   |

---

# 🚀 Installation

Clone the repository:

```bash
git clone https://github.com/naufalrafifff/FoodLabelingTraceability-SC.git
cd FoodLabelingTraceability-SC
```

Install dependencies:

```bash
npm install
```

Compile contracts:

```bash
npm run compile
```

Expected output:

```text
Compiled successfully
```

---

# 🔐 Environment Variables

The experimental environment described in the manuscript requires several environment variables to configure the Polygon Mainnet fork and optional deployment.

Create a `.env` file in the project root directory:

```env
POLYGON_RPC_URL=https://polygon-mainnet.infura.io/v3/<your-infura-project-id>
PRIVATE_KEY=<your-wallet-private-key>
CMC_KEY=<your-coinmarketcap-api-key>
```

Where:

* **POLYGON_RPC_URL**: Required for creating a local Hardhat network forked from the Polygon Mainnet.
* **PRIVATE_KEY**: Required only when deploying to an external Polygon network.
* **CMC_KEY**: Optional. Used by `hardhat-gas-reporter` to retrieve real-time MATIC-to-USD conversion rates.

For security reasons, sensitive credentials should never be committed to the repository and must be stored locally in the `.env` file.

---

# 🔨 Deployment

### Local Deployment

Start the Hardhat node:

```bash
npx hardhat node
```

Open a second terminal and deploy the contracts:

```bash
npm run deploy:local
```

Expected output:

```text
CPPOBValidationContract deployed at:
0x...

PermitValidationContract deployed at:
0x...

CoAValidationContract deployed at:
0x...

SupplyChainTrackingContract deployed at:
0x...
```

## Polygon Network (Optional)

After configuring the `.env` file:

```bash
npx hardhat run scripts/deploy.js --network polygon
```

The repository also supports deployment to the Polygon network through the polygon network configuration defined in hardhat.config.js.

---

# 👤 Test Accounts

Sample test accounts used during local testing are provided in:

```text
account.txt
```

These accounts are intended for local development and reproducibility only.

---

# 📊 Reproducing Table C2 (Gas Consumption Evaluation)

Table C2 reports gas consumption measurements for core smart contract operations.

Run:

```bash
npm run gas
```

This command executes:

```bash
REPORT_GAS=true hardhat test
```

Generated output:

```text
gas-report.txt
```

The resulting report contains gas consumption measurements for:

* issueCppob()
* issuePermit()
* issueCoA()
* createShipment()

The values generated correspond to Table C2 reported in the paper.

---

# ⏱ Reproducing Table D2 (Latency Evaluation)

Table D2 reports execution latency measurements for smart contract operations.

Run:

```bash
npm run stress
```

This command executes:

```bash
hardhat run scripts/stresTest.js
```

Generated metrics include:

* Minimum latency
* Maximum latency
* Average latency
* Execution throughput

The resulting measurements correspond to Table D2 reported in the paper.

---

# 🌐 Polygon Mainnet Fork (Paper Configuration)

The experiments reported in the manuscript were conducted using a Hardhat local network configured as a fork of the Polygon Mainnet. This approach enables smart contracts to be executed in a local development environment while preserving the blockchain state, gas pricing, and token information from the Polygon Mainnet at a fixed block height.

The original experimental configuration is equivalent to the following Hardhat setup:

```javascript
hardhat: {
  chainId: 137,
  forking: {
    url: process.env.POLYGON_RPC_URL,
    blockNumber: 55555555
  },
  mining: {
    auto: false,
    interval: 2000
  }
}
```

To reproduce the experimental environment:

1. Configure the required environment variables in the `.env` file.
2. Start the local Hardhat node using the fork configuration.
3. Deploy the smart contracts to the local fork.
4. Execute the gas evaluation and latency testing scripts.

Start the local node:

```bash
npx hardhat node
```

Deploy the contracts:

```bash
npx hardhat run scripts/deploy.js --network localhost
```

Generate gas measurements (Table C2):

```bash
npm run gas
```

Generate latency measurements (Table D2):

```bash
npm run stress
```

The Polygon Mainnet fork is provided to reproduce the experimental environment described in the manuscript. Minor latency variations may occur depending on hardware specifications, RPC providers, and local execution environments.

---

# 🔁 Reproducibility Notes

The experiments presented in the manuscript were performed using a Hardhat local network forked from the Polygon Mainnet at block **55,555,555**.

To reproduce the reported results:

1. Install the project dependencies using `npm install`.
2. Configure the required environment variables (`POLYGON_RPC_URL`, `PRIVATE_KEY`, and optionally `CMC_KEY`).
3. Start the local Hardhat node configured as a Polygon Mainnet fork.
4. Deploy the smart contracts to the forked local environment.
5. Execute `npm run gas` to reproduce the gas consumption measurements reported in Table C2.
6. Execute `npm run stress` to reproduce the latency evaluation reported in Table D2.

Gas consumption values should remain reproducible under the same compiler configuration, while latency measurements may vary depending on hardware, operating system, and RPC performance.

---

# 📌 Repository Version

This repository contains the implementation used for the experiments reported in the paper.

**Release Tag**

```text
v1.0-paper
```

This tagged release represents the exact implementation used in the manuscript submission.

**Commit Hash**

```text
096d6abe0f53a3ada30339bc15db1077190c2ebd
```

This release corresponds to the version used in the manuscript submission.

---

# 🔗 Links

- 📄 Paper: Under Review
- 📁 [GitHub Repository](https://github.com/naufalrafifff/FoodLabelingTraceability-SC)

---

# ⚖ License

This repository is released under the MIT License.

See the `LICENSE` file for details.

---

# 📬 Contact

For questions regarding the implementation, reproducibility package, or research paper, please contact the corresponding author listed in the manuscript.

---

# 🙏 Acknowledgements

This project was developed using:

* Solidity
* Hardhat
* Ethers.js
* OpenZeppelin

We acknowledge the open-source blockchain community for providing the tools and libraries used in this research.