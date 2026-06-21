// scripts/deploy.js
const hre = require("hardhat");

async function main() {
  console.log("🚀 Starting deployment of all contracts...");
  console.time("⏳ Total Deployment Time");

  // ✅ Use the deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log(`💡 Deploying with account: ${deployer.address}`);

  let cppobAddress, permitAddress, coaAddress, trackingAddress;

  // 1. Deploy CppobValidationContract
  try {
    const CppobFactory = await hre.ethers.getContractFactory("CppobValidationContract");
    const cppob = await CppobFactory.deploy();
    await cppob.waitForDeployment();
    cppobAddress = await cppob.getAddress();
    console.log(`✅ CppobValidationContract deployed at: ${cppobAddress}`);
  } catch (err) {
    console.error("❌ Failed to deploy CppobValidationContract:", err);
    process.exit(1);
  }

  // 2. Deploy PermitValidationContract (requires Cppob address)
  try {
    const PermitFactory = await hre.ethers.getContractFactory("PermitValidationContract");
    const permit = await PermitFactory.deploy(cppobAddress);
    await permit.waitForDeployment();
    permitAddress = await permit.getAddress();
    console.log(`✅ PermitValidationContract deployed at: ${permitAddress}`);
  } catch (err) {
    console.error("❌ Failed to deploy PermitValidationContract:", err);
    process.exit(1);
  }

  // 3. Deploy CoAValidationContract (requires Permit address)
  try {
    // fully-qualified name disambiguates duplicate artifacts
    const CoAFactory = await hre.ethers.getContractFactory(
      "CoAValidationContract"
    );
    const coa = await CoAFactory.deploy(permitAddress);
    await coa.waitForDeployment();
    coaAddress = await coa.getAddress();
    console.log(`✅ CoAValidationContract deployed at: ${coaAddress}`);
  } catch (err) {
    console.error("❌ Failed to deploy CoAValidationContract:", err);
    process.exit(1);
  }

  // 4. Deploy SupplyChainTrackingContract (requires Permit + CoA addresses)
  try {
    const TrackingFactory = await hre.ethers.getContractFactory("SupplyChainTrackingContract");
    const tracking = await TrackingFactory.deploy(permitAddress, coaAddress);
    await tracking.waitForDeployment();
    trackingAddress = await tracking.getAddress();
    console.log(`✅ SupplyChainTrackingContract deployed at: ${trackingAddress}`);
  } catch (err) {
    console.error("❌ Failed to deploy SupplyChainTrackingContract:", err);
    process.exit(1);
  }

  console.log("\n📌 Deployed contract addresses:");
  console.log(`   • CppobValidationContract     : ${cppobAddress}`);
  console.log(`   • PermitValidationContract    : ${permitAddress}`);
  console.log(`   • CoAValidationContract       : ${coaAddress}`);
  console.log(`   • SupplyChainTrackingContract : ${trackingAddress}`);

  console.timeEnd("⏳ Total Deployment Time");
}

main().catch(error => {
  console.error("❌ Unhandled error in deployment:", error);
  process.exitCode = 1;
});