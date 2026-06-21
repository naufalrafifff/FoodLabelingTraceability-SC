// scripts/fetchConsumer.js
const hre = require("hardhat");
const fs = require("fs");

async function main() {
  console.log("🚀 Fetching Blockchain Data for Consumer Verification");
  console.time("⏳ Total Execution Time");

  // ── Addresses of deployed contracts ────────────────────────────────────────
  const cppobAddress             = "0x6f0c3A9ebCA54E78731255637Cc2656b2033d4d0"; // CppobValidationContract
  const permitValidationAddress  = "0xAC199d7CFf037468FCCBf17BbD3bb2dddFD92590"; // PermitValidationContract
  const coaValidationAddress     = "0xAB386e04A54AF65993e1cD00977E122eF9F332E2"; // CoAValidationContract

  // ── Setup provider and contract instances ─────────────────────────────────
  const provider = new hre.ethers.JsonRpcProvider("http://127.0.0.1:8545");

  // Kita hanya butuh _provider_ (bukan _signer_) karena ini fetch‐only.
  const cppobContract = await hre.ethers.getContractAt(
    "CppobValidationContract",
    cppobAddress,
    provider
  );
  const permitContract = await hre.ethers.getContractAt(
    "PermitValidationContract",
    permitValidationAddress,
    provider
  );
  const coaContract = await hre.ethers.getContractAt(
    "CoAValidationContract",
    coaValidationAddress,
    provider
  );

  console.log("✅ Connected to blockchain");

  // ── IDs for lookup (adjust to match on-chain data) ─────────────────────────
  const cppobId   = 3001;
  const permitId  = 4211;
  const batchId   = 2001;

  const verificationData = {};

  // ── Fetch CPPOB License (GMP) Details ──────────────────────────────────────
  console.log("\n🔍 Fetching CPPOB (GMP) License Details...");
  try {
    const [
      id,           // 0: cppobId (BigNumber)
      name,         // 1: facilityName (string)
      addressStr,   // 2: facilityAddress (string)
      hash,         // 3: licenseHash (string)
      issueDate,    // 4: issueDate (BigNumber)
      expiryDate    // 5: expiryDate (BigNumber)
    ] = await cppobContract.getCppobDetails(cppobId);

    verificationData.cppob = {
      cppobId:         id.toString(),
      facilityName:    name,
      facilityAddress: addressStr,
      issueDate:       new Date(Number(issueDate) * 1000).toISOString().split("T")[0],
      expiryDate:      new Date(Number(expiryDate) * 1000).toISOString().split("T")[0],
      documentLink:    await cppobContract.getCppobDocument(cppobId)
    };
    console.log(`✅ CPPOB Retrieved: ${verificationData.cppob.facilityName}`);
  } catch (err) {
    console.error("❌ ERROR: Failed to fetch CPPOB details.");
    console.error(err);
    return;
  }

  // ── Fetch Permit (NIE) Details ─────────────────────────────────────────────
  console.log("\n🔍 Fetching Permit to Circulate (NIE) Details...");
  try {
    const [
      pid,        // 0: permitId (BigNumber)
      pCppobId,   // 1: cppobId (BigNumber)
      prodName,   // 2: productName (string)
      industry,   // 3: industry (string)
      pType,      // 4: productType (string)
      appDate,    // 5: approvalDate (BigNumber)
      expDate     // 6: expiryDate (BigNumber)
    ] = await permitContract.getPermitDetails(permitId);

    verificationData.permit = {
      permitId:     pid.toString(),
      cppobId:      pCppobId.toString(),
      productName:  prodName,
      industry:     industry,
      productType:  pType,
      approvalDate: new Date(Number(appDate) * 1000).toISOString().split("T")[0],
      expiryDate:   new Date(Number(expDate) * 1000).toISOString().split("T")[0],
      documentLink: await permitContract.getPermitDocument(permitId)
    };
    console.log(`✅ Permit Retrieved: ${verificationData.permit.productName}`);
  } catch (err) {
    console.error("❌ ERROR: Failed to fetch permit details.");
    console.error(err);
    return;
  }

  // ── Fetch CoA Details ───────────────────────────────────────────────────────
  console.log("\n🔍 Fetching Certificate of Analysis (CoA) Details...");
  try {
    const [
      bId,         // 0: batchId (BigNumber)
      coaProd,     // 1: productName (string)
      coaIndustry, // 2: industry (string)
      coaUrl,      // 3: IPFS URL (string)
      prodDate,    // 4: productionDate (BigNumber)
      coaExpiry,   // 5: expiryDate (BigNumber)
      linkedPid,   // 6: permitId (BigNumber)
      isValid      // 7: bool
    ] = await coaContract.getCoADetails(batchId);

    verificationData.coa = {
      batchId:        bId.toString(),
      productName:    coaProd,
      industry:       coaIndustry,
      productionDate: new Date(Number(prodDate) * 1000).toISOString().split("T")[0],
      expiryDate:     new Date(Number(coaExpiry) * 1000).toISOString().split("T")[0],
      permitId:       linkedPid.toString(),
      isValid:        isValid,
      documentLink:   coaUrl
    };

    console.log(`✅ CoA Retrieved: ${verificationData.coa.productName}`);

    // Fetch nutrition facts
    console.log("\n🍎 Fetching Nutrition Facts...");
    const facts = await coaContract.getNutrientFacts(batchId);
    verificationData.nutritionFacts = facts.map(f => ({
      name:        f.nutrientName,
      unit:        f.unit,
      specMin:     f.specMin.toString(),
      specMax:     f.specMax.toString(),
      actualValue: f.actualValue.toString()
    }));
    console.log(`✅ Retrieved ${verificationData.nutritionFacts.length} nutrition facts`);
  } catch (err) {
    console.error("❌ ERROR: Failed to fetch CoA or nutrition facts.");
    console.error(err);
    return;
  }

  console.log("\n✅ All Verification Data Fetched!");
  console.log(JSON.stringify(verificationData, null, 2));
  console.timeEnd("⏳ Total Execution Time");

  // ── Save to JSON ───────────────────────────────────────────────────────────
  fs.writeFileSync("verificationData.json", JSON.stringify(verificationData, null, 2));
  console.log("\n📁 Data saved to verificationData.json for frontend consumption");
}

main().catch(err => {
  console.error("❌ ERROR Unexpected:", err);
  process.exitCode = 1;
});