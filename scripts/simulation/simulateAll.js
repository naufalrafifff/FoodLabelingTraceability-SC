const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

function toUnix(dateString) {
  return Math.floor(new Date(`${dateString}T00:00:00Z`).getTime() / 1000);
}

async function main() {
  console.log("🚀 Running full food labeling traceability simulation...");
  console.time("⏳ Total Simulation Time");

  const [deployer] = await hre.ethers.getSigners();
  console.log(`💡 Simulation account: ${deployer.address}`);

  const dataPath = path.join(__dirname, "..", "..", "verificationData.json");
  const data = JSON.parse(fs.readFileSync(dataPath, "utf8"));

  const CppobFactory = await hre.ethers.getContractFactory("CppobValidationContract");
  const cppob = await CppobFactory.deploy();
  await cppob.waitForDeployment();
  console.log(`✅ CppobValidationContract deployed at: ${cppob.target}`);

  const PermitFactory = await hre.ethers.getContractFactory("PermitValidationContract");
  const permit = await PermitFactory.deploy(cppob.target);
  await permit.waitForDeployment();
  console.log(`✅ PermitValidationContract deployed at: ${permit.target}`);

  const CoAFactory = await hre.ethers.getContractFactory("CoAValidationContract");
  const coa = await CoAFactory.deploy(permit.target);
  await coa.waitForDeployment();
  console.log(`✅ CoAValidationContract deployed at: ${coa.target}`);

  const TrackingFactory = await hre.ethers.getContractFactory("SupplyChainTrackingContract");
  const tracking = await TrackingFactory.deploy(permit.target, coa.target);
  await tracking.waitForDeployment();
  console.log(`✅ SupplyChainTrackingContract deployed at: ${tracking.target}`);

  const cppobId = Number(data.cppob.cppobId);
  const permitId = Number(data.permit.permitId);
  const batchId = Number(data.coa.batchId);
  const shipmentId = 3001;

  console.log("\n1️⃣ Issuing CPPOB license...");
  await (await cppob.issueCppob(
    cppobId,
    data.cppob.facilityName,
    data.cppob.facilityAddress,
    data.cppob.documentLink.replace("https://ipfs.io/ipfs/", ""),
    toUnix(data.cppob.issueDate)
  )).wait();
  console.log(`✅ CPPOB #${cppobId} issued`);

  console.log("\n2️⃣ Issuing Permit/NIE...");
  await (await permit.issuePermit(
    permitId,
    cppobId,
    data.permit.productName,
    data.permit.industry,
    data.permit.productType,
    data.permit.documentLink.replace("https://ipfs.io/ipfs/", ""),
    toUnix(data.permit.approvalDate)
  )).wait();
  console.log(`✅ Permit/NIE #${permitId} issued`);

  console.log("\n3️⃣ Issuing Certificate of Analysis and nutrition facts...");
  await (await coa.issueCoA(
    batchId,
    data.coa.productName,
    data.coa.industry,
    toUnix(data.coa.productionDate),
    data.coa.documentLink.replace("https://ipfs.io/ipfs/", ""),
    permitId,
    data.nutritionFacts.map((x) => x.name),
    data.nutritionFacts.map((x) => x.unit),
    data.nutritionFacts.map((x) => BigInt(x.specMin)),
    data.nutritionFacts.map((x) => BigInt(x.specMax)),
    data.nutritionFacts.map((x) => BigInt(x.actualValue))
  )).wait();
  console.log(`✅ CoA #${batchId} issued`);

  console.log("\n4️⃣ Creating shipment...");
  await (await tracking.createShipment(
    shipmentId,
    batchId,
    permitId,
    "PT. Fast Logistics",
    "SuperMart ID"
  )).wait();
  console.log(`✅ Shipment #${shipmentId} created`);

  console.log("\n5️⃣ Updating shipment status...");
  await (await tracking.receiveByDistributor(shipmentId)).wait();
  await (await tracking.receiveByRetailer(shipmentId)).wait();
  console.log(`✅ Shipment #${shipmentId} received by distributor and retailer`);

  const cppobDetails = await cppob.getCppobDetails(cppobId);
  const permitDetails = await permit.getPermitDetails(permitId);
  const coaDetails = await coa.getCoADetails(batchId);
  const nutrients = await coa.getNutrientFacts(batchId);
  const shipmentDetails = await tracking.getShipmentDetails(shipmentId);

  console.log("\n📌 Verification output:");
  console.log({
    cppobId: cppobDetails[0].toString(),
    permitId: permitDetails[0].toString(),
    batchId: coaDetails[0].toString(),
    productName: coaDetails[1],
    nutritionFacts: nutrients.map((n) => ({
      nutrientName: n.nutrientName,
      unit: n.unit,
      specMin: n.specMin.toString(),
      specMax: n.specMax.toString(),
      actualValue: n.actualValue.toString()
    })),
    shipmentId: shipmentDetails[0].toString(),
    distributor: shipmentDetails[4],
    retailer: shipmentDetails[5]
  });

  console.timeEnd("⏳ Total Simulation Time");
  console.log("\n🎉 Simulation completed successfully.");
}

main().catch((error) => {
  console.error("❌ Simulation failed:", error);
  process.exitCode = 1;
});
