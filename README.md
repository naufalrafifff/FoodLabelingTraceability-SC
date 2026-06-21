# Food Labeling Traceability Smart Contract

A blockchain-based food labeling traceability system for nutrition facts verification, certification validation, and supply chain transparency.

This repository contains the smart contracts, deployment scripts, testing framework, and reproducibility materials developed for the paper:

> **"Blockchain-Based Food Labeling Traceability for Nutrition Facts Verification"**

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
git clone https://github.com/<repository-url>.git
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

# 🔐 Environment Variables (Optional)

Polygon deployment requires environment variables stored in a `.env` file:

```env
POLYGON_RPC_URL=<your_rpc_url>
PRIVATE_KEY=<your_wallet_private_key>
```

These variables are **not required** to reproduce the experiments reported in the paper.

---

# 🔨 Deployment

## Local Hardhat Network

Deploy contracts locally:

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

This deployment mode is intended for external validation and development purposes and is not required to reproduce the experimental results reported in the paper.

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

# 🌐 Running Against a Polygon Environment (Optional)

Although all experiments reported in the paper were performed using the local Hardhat network, the repository also supports deployment to a Polygon-compatible environment.

Configure:

```env
POLYGON_RPC_URL=<your_rpc_url>
PRIVATE_KEY=<your_private_key>
```

Then deploy:

```bash
npx hardhat run scripts/deploy.js --network polygon
```

This capability is provided for validation, demonstration, and future deployment scenarios. It is not required to reproduce the results reported in the paper.

---

# 🔁 Reproducibility Notes

To reproduce the results reported in the paper:

1. Install all dependencies using `npm install`
2. Compile contracts using `npm run compile`
3. Deploy contracts locally using `npm run deploy:local`
4. Generate gas measurements using `npm run gas`
5. Generate latency measurements using `npm run stress`

Minor timing variations may occur across hardware configurations. However, the functional behavior and gas consumption results should remain consistent.

---

# 📌 Repository Version

This repository contains the implementation used for the experiments reported in the paper.

**Release Tag**

```text
v1.0-paper
```

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