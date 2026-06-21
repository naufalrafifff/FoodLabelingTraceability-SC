// scripts/stressTest.js
const { ethers } = require("hardhat");

// helper untuk delay (ms)
function sleep(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

// helper untuk menghitung statistik (min, max, avg)
function summarizeTimings(arr) {
  if (arr.length === 0) return { min: 0, max: 0, avg: 0 };
  let sum = 0;
  let min = arr[0];
  let max = arr[0];
  for (const x of arr) {
    sum += x;
    if (x < min) min = x;
    if (x > max) max = x;
  }
  return {
    min,
    max,
    avg: Math.round(sum / arr.length),
  };
}

async function main() {
  console.log("🚀 Starting Stress Test with Timing...");
  const [deployer, industry] = await ethers.getSigners();

  // ── CONFIG: Sesuaikan load untuk 1 UMKM ──────────────────────────────────
  const ISSUE_CPPB_LOAD    = 1;    // hanya 1 CPPOB untuk satu UMKM
  const ISSUE_PERMIT_LOAD  = 10;   // misalnya maksimal 10 Permit
  const ISSUE_COA_LOAD     = 100;  // stress‐test CoA (100)
  const CREATE_SHIP_LOAD   = 100;  // stress‐test createShipment (100)
  const READ_LOAD          = 500;  // read calls (500)
  // ────────────────────────────────────────────────────────────────────────

  // 1️⃣ Deploy semua kontrak
  console.log("\n1️⃣ Deploying Contracts for Stress Test");
  console.log(`   • Deployer address: ${deployer.address}`);
  console.log(`   • Industry address: ${industry.address}`);

  const CppobFactory  = await ethers.getContractFactory("CppobValidationContract");
  const PermitFactory = await ethers.getContractFactory("PermitValidationContract");
  const CoAFactory    = await ethers.getContractFactory("CoAValidationContract");
  const TrackFactory  = await ethers.getContractFactory("SupplyChainTrackingContract");

  // Deploy Cppob
  const cppob   = await CppobFactory.deploy();
  await cppob.waitForDeployment();
  console.log(`   • CppobValidationContract at: ${cppob.target}`);

  // Deploy Permit (butuh alamat cppob)
  const permit = await PermitFactory.deploy(cppob.target);
  await permit.waitForDeployment();
  console.log(`   • PermitValidationContract at: ${permit.target}`);

  // Deploy CoA (butuh alamat permit)
  const coa = await CoAFactory.deploy(permit.target);
  await coa.waitForDeployment();
  console.log(`   • CoAValidationContract at: ${coa.target}`);

  // Deploy Tracking (butuh alamat permit + coa)
  const tracking = await TrackFactory.deploy(permit.target, coa.target);
  await tracking.waitForDeployment();
  console.log(`   • SupplyChainTrackingContract at: ${tracking.target}`);

  // 2️⃣ Seed CPPOB & Permits (untuk CoA nanti)
  console.log("\n2️⃣ Seeding CPPOB & Permits for CoA issuance");
  const nowBlock      = await ethers.provider.getBlock("latest");
  const nowTs         = nowBlock.timestamp;
  const issueDateCppob = nowTs - 100; // timestamp di masa lalu

  // 2.a) Issue 1 CPPOB
  console.log(`   • Issue ${ISSUE_CPPB_LOAD} CPPOB license(s)`);
  for (let i = 0; i < ISSUE_CPPB_LOAD; i++) {
    const id = 3000 + i + 1; // misal: 3001
    const tx = await cppob.issueCppob(
      id,
      `UMKM Plant ${i + 1}`,
      `Address UMKM ${i + 1}`,
      `HashCppob${i + 1}`,
      issueDateCppob
    );
    await tx.wait();
    await sleep(50);
  }
  console.log(`   • Completed ${ISSUE_CPPB_LOAD} CPPOB issuance`);

  // 2.b) Issue beberapa Permit (10)
  console.log(`   • Issue ${ISSUE_PERMIT_LOAD} Permit(s)`);
  for (let i = 0; i < ISSUE_PERMIT_LOAD; i++) {
    const permitId     = 4000 + i + 1;   // 4001, 4002, ...
    const cppobIdRef   = 3001;           // merujuk ke CPPOB #3001
    const approvalDate = nowTs - 50;     // di masa lalu
    const tx = await permit.issuePermit(
      permitId,
      cppobIdRef,
      `Product ${i + 1}`,
      `Industry UMKM`,
      `Type`,
      `HashPermit${i + 1}`,
      approvalDate
    );
    await tx.wait();
    await sleep(50);
  }
  console.log(`   • Completed ${ISSUE_PERMIT_LOAD} Permit issuance`);

  // Sekarang siapkan array untuk mencatat waktu (ms)
  const timesIssueCoA    = [];
  const timesCreateShip  = [];
  const timesReads       = [];

  // 3️⃣ Stress Test: issueCoA (catat timing)
  console.log(`\n3️⃣ Stress Test: Running ${ISSUE_COA_LOAD} issueCoA calls (sequential)`);
  for (let i = 0; i < ISSUE_COA_LOAD; i++) {
    const batchId        = 2000 + i + 1;                  // 2001, 2002, …
    const linkedPermitId = 4000 + ((i % ISSUE_PERMIT_LOAD) + 1); // siklik ke 10 Permit
    const productionDate = nowTs - 20;                    // di masa lalu

    const t0 = Date.now();
    const tx = await coa.issueCoA(
      batchId,
      `CashewMilk Batch ${i + 1}`,
      `Industry UMKM`,
      productionDate,
      `HashCoA${i + 1}`,
      linkedPermitId,
      ["Protein","Lemak","Karbohidrat"],
      ["g","g","g"],
      [5,2,10].map(BigInt),
      [10,5,15].map(BigInt),
      [8,3,12].map(BigInt)
    );
    await tx.wait();
    const dt = Date.now() - t0;
    timesIssueCoA.push(dt);

    await sleep(50);
  }
  console.log(`   • Completed ${ISSUE_COA_LOAD} issueCoA calls`);

  // 4️⃣ Stress Test: createShipment (catat timing)
  console.log(`\n4️⃣ Stress Test: Running ${CREATE_SHIP_LOAD} createShipment calls (sequential)`);
  for (let i = 0; i < CREATE_SHIP_LOAD; i++) {
    const shipmentId  = 3000 + i + 1;
    const batchIdRef  = 2000 + ((i % ISSUE_COA_LOAD) + 1);
    const permitIdRef = 4000 + ((i % ISSUE_PERMIT_LOAD) + 1);

    const t0 = Date.now();
    const tx = await tracking.createShipment(
      shipmentId,
      batchIdRef,
      permitIdRef,
      `Distributor ${i + 1}`,
      `Retailer ${i + 1}`
    );
    await tx.wait();
    const dt = Date.now() - t0;
    timesCreateShip.push(dt);

    await sleep(50);
  }
  console.log(`   • Completed ${CREATE_SHIP_LOAD} createShipment calls`);

  // 5️⃣ Stress Test: read calls (catat timing)
  console.log(`\n5️⃣ Stress Test: Running ${READ_LOAD} read calls (sequential)`);
  for (let i = 0; i < READ_LOAD; i++) {
    const batchReadId    = 2000 + ((i % ISSUE_COA_LOAD) + 1);
    const shipmentReadId = 3000 + ((i % CREATE_SHIP_LOAD) + 1);

    const t0a = Date.now();
    await coa.getCoADetails(batchReadId);
    const dtA = Date.now() - t0a;

    const t0b = Date.now();
    await tracking.getShipmentDetails(shipmentReadId);
    const dtB = Date.now() - t0b;

    timesReads.push(dtA);
    timesReads.push(dtB);

    await sleep(10);
  }
  console.log(`   • Completed ${READ_LOAD} getCoADetails & getShipmentDetails calls`);

  // 6️⃣ Ringkasan timing
  console.log("\n📊 Summary of Transaction Times (ms):\n");

  const sumIssueCoA   = summarizeTimings(timesIssueCoA);
  const sumCreateShip = summarizeTimings(timesCreateShip);
  const sumReads      = summarizeTimings(timesReads);

  console.log(`• issueCoA (n=${timesIssueCoA.length}):   min ${sumIssueCoA.min} ms · max ${sumIssueCoA.max} ms · avg ${sumIssueCoA.avg} ms`);
  console.log(`• createShipment (n=${timesCreateShip.length}):   min ${sumCreateShip.min} ms · max ${sumCreateShip.max} ms · avg ${sumCreateShip.avg} ms`);
  console.log(`• getCoADetails/getShipmentDetails (n=${timesReads.length}):   min ${sumReads.min} ms · max ${sumReads.max} ms · avg ${sumReads.avg} ms`);

  console.log("\n✅ Stress Test Completed!");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Stress Test Failed:", err);
    process.exit(1);
  });