// scripts/simulation/simulateCoA.js
const hre = require("hardhat");

async function main() {
  console.log("🚀 Simulasi Penerbitan Certificate of Analysis (CoA) untuk Cashew Milk");
  console.time("⏳ Total Execution Time");

  // 1) Setup industry account & contract addresses
  const industryWalletAddress   = "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266";
  const permitValidationAddress = "0xAC199d7CFf037468FCCBf17BbD3bb2dddFD92590"; // PermitValidationContract
  const coaContractAddress      = "0xAB386e04A54AF65993e1cD00977E122eF9F332E2";    // CoAValidationContract

  const provider       = new hre.ethers.JsonRpcProvider("http://127.0.0.1:8545");
  const industrySigner = await provider.getSigner(industryWalletAddress);
  console.log(`🏭 Industri Wallet: ${await industrySigner.getAddress()}`);

  // 2) Connect to PermitValidationContract & CoAValidationContract
  const permitContract = await hre.ethers.getContractAt(
    "PermitValidationContract",
    permitValidationAddress,
    industrySigner
  );
  const coaContract = await hre.ethers.getContractAt(
    "CoAValidationContract",
    coaContractAddress,
    industrySigner
  );
  console.log("🔗 Terhubung ke PermitValidationContract dan CoAValidationContract");

  // 3) Ambil timestamp blok terkini agar tidak “future date”
  const latestBlock   = await provider.getBlock("latest");
  const nowTs         = latestBlock.timestamp;
  // Gunakan nowTs sebagai productionDate supaya ≤ block.timestamp
  const productionDate = nowTs;

  console.log(`\n🔍 Current block timestamp: ${new Date(Number(nowTs) * 1000).toLocaleString()}`);
  console.log(`   • Menggunakan productionDate = ${nowTs} (${new Date(Number(productionDate) * 1000).toLocaleString()})\n`);

  // 4) Simulation parameters
  const permitId = 4211;  // sudah diterbitkan di simulatePermit.js
  const batchId  = 2001;  // CoA batch
  const coaHash  = "QmCoADummyHash1234567890abcdef";

  // 5) Verify Permit via getPermitDetails()
  console.log("🔍 Verifikasi Permit (NIE) sebelum issue CoA...");
  try {
    const [
      pid,
      cppobId,
      productName,
      industryName,
      productType,
      approvalDate,
      expiryDate
    ] = await permitContract.getPermitDetails(permitId);

    console.log(`   • Permit ID     : ${pid.toString()}`);
    console.log(`   • Produk        : ${productName}`);
    console.log(`   • Industri      : ${industryName}`);
    console.log(`   • Tgl Approval  : ${new Date(Number(approvalDate) * 1000).toLocaleString()}`);
    console.log(`   • Masa Berlaku  : ${new Date(Number(expiryDate) * 1000).toLocaleString()}`);

    if (Number(expiryDate) < Math.floor(Date.now() / 1000)) {
      console.error("❌ ERROR: Permit sudah kedaluwarsa!");
      return;
    }
    console.log("✅ Permit valid\n");
  } catch (err) {
    console.error("❌ ERROR: Permit tidak valid atau tidak ditemukan.");
    console.error(err);
    return;
  }

  // 6) Check if CoA batch already exists
  console.log("🔍 Mengecek ketersediaan Batch ID untuk CoA...");
  try {
    await coaContract.getCoADetails(batchId);
    console.error(`❌ ERROR: CoA untuk Batch ID ${batchId} sudah ada!`);
    return;
  } catch {
    console.log(`✅ Batch ID ${batchId} tersedia, melanjutkan issuance...\n`);
  }

  // 7) Prepare nutrition facts
  const nutrientNames = ["Protein", "Lemak", "Karbohidrat"];
  const units         = ["g", "g", "g"];
  const specMin       = [5, 2, 10];
  const specMax       = [10, 5, 15];
  const actualValues  = [8, 3, 12];

  // 8) Issue CoA
  console.log("📤 Menerbitkan CoA...");
  try {
    const tx = await coaContract.issueCoA(
      batchId,
      "Cashew Milk",
      "Axxx Foods",
      productionDate,
      coaHash,
      permitId,
      nutrientNames,
      units,
      specMin.map(BigInt),
      specMax.map(BigInt),
      actualValues.map(BigInt)
    );
    await tx.wait();
    console.log(`✅ CoA berhasil diterbitkan untuk Batch #${batchId}!\n`);
  } catch (err) {
    console.error("❌ ERROR: Gagal menerbitkan CoA.");
    console.error(err);
    return;
  }

  // 9) Verify CoA on-chain
  console.log("🔍 Verifikasi CoA di blockchain:");
  try {
    const details = await coaContract.getCoADetails(batchId);
    console.log(`   • Batch ID        : ${details[0].toString()}`);
    console.log(`   • Nama Produk     : ${details[1]}`);
    console.log(`   • Industri        : ${details[2]}`);
    console.log(`   • Dokumen CoA     : ${details[3]}`);
    console.log(`   • Tgl Produksi    : ${new Date(Number(details[4]) * 1000).toLocaleString()}`);
    console.log(`   • Masa Berlaku    : ${new Date(Number(details[5]) * 1000).toLocaleString()}`);
    console.log(`   • Permit ID       : ${details[6].toString()}`);

    console.log("\n🍎 Nutrisi:");
    const facts = await coaContract.getNutrientFacts(batchId);
    facts.forEach(f => {
      console.log(
        `   - ${f.nutrientName}: ${f.actualValue.toString()} ${f.unit}` +
        ` (range ${f.specMin.toString()}–${f.specMax.toString()})`
      );
    });
  } catch (err) {
    console.error("❌ ERROR: Gagal verifikasi CoA.");
    console.error(err);
    return;
  }

  console.timeEnd("⏳ Total Execution Time");
  console.log("\n🎉 Simulasi penerbitan CoA selesai!");
}

main().catch(err => {
  console.error("❌ ERROR unexpected:", err);
  process.exitCode = 1;
});