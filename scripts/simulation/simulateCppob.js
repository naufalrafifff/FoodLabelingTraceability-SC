// scripts/simulation/simulateCppob.js
const hre = require("hardhat");

async function main() {
  console.log("🚀 Simulasi Penerbitan CPPOB License (GMP) oleh BPOM");
  console.time("⏳ Total Execution Time");

  // 1. Setup account & contract address
  const bpomWalletAddress    = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
  const cppobContractAddress = "0x6f0c3A9ebCA54E78731255637Cc2656b2033d4d0";

  const provider   = new hre.ethers.JsonRpcProvider("http://127.0.0.1:8545");
  const bpomSigner = await provider.getSigner(bpomWalletAddress);
  console.log(`🏛  BPOM Authority: ${await bpomSigner.getAddress()}`);

  // 2. Get contract instance
  const cppob = await hre.ethers.getContractAt(
    "CppobValidationContract",
    cppobContractAddress,
    bpomSigner
  );
  console.log("🔗 Terhubung ke CppobValidationContract");

  // 3. Ambil timestamp blok terakhir (agar tidak melebihi block.timestamp)
  const latestBlock = await provider.getBlock("latest");
  const nowTs       = latestBlock.timestamp;         // block.timestamp saat ini
  const issueDate   = nowTs;                         // kita gunakan langsung

  // 4. Simulation data lain (ID, nama, alamat, hash)
  const cppobId         = 3001;
  const facilityName    = "Axxx Foods Processing Plant";
  const facilityAddress = "Jl. Industri No.123, Bandung, Indonesia";
  const licenseHash     = "QmCppobDummyHash1234567890abcdef";

  console.log(`\n🔍 Current block timestamp: ${new Date(Number(nowTs)*1000).toLocaleString()}`);
  console.log(`   • Menggunakan issueDate = ${nowTs} (${new Date(Number(issueDate)*1000).toLocaleString()})\n`);

  // 5. Check availability
  console.log("🔍 Mengecek apakah CPPOB ID sudah ada...");
  try {
    await cppob.getCppobDetails(cppobId);
    console.error(`❌ ERROR: CPPOB ID ${cppobId} sudah pernah diterbitkan`);
    process.exit(1);
  } catch {
    console.log(`✅ CPPOB ID ${cppobId} tersedia, lanjut issuance`);
  }

  // 6. Issue CPPOB license
  console.log("\n📤 Menerbitkan CPPOB license...");
  try {
    const tx = await cppob.issueCppob(
      cppobId,
      facilityName,
      facilityAddress,
      licenseHash,
      issueDate
    );
    await tx.wait();
    console.log(`✅ CPPOB license #${cppobId} berhasil diterbitkan`);
  } catch (err) {
    console.error("❌ ERROR: Gagal menerbitkan CPPOB license");
    console.error(err);
    process.exit(1);
  }

  // 7. Verify on-chain
  console.log("\n🔍 Verifikasi CPPOB License di blockchain:");
  try {
    const details = await cppob.getCppobDetails(cppobId);
    // details indices: 
    // 0: cppobId (BigInt), 
    // 1: facilityName (string), 
    // 2: facilityAddress (string), 
    // 3: licenseHash (string), 
    // 4: issueDate (BigInt), 
    // 5: expiryDate (BigInt)

    console.log(`   • ID               : ${details[0].toString()}`);
    console.log(`   • Facility Name    : ${details[1]}`);
    console.log(`   • Facility Address : ${details[2]}`);
    console.log(`   • License Hash     : ${details[3]}`);
    console.log(
      `   • Issue Date       : ${new Date(Number(details[4]) * 1000).toLocaleString()}`
    );
    console.log(
      `   • Expiry Date      : ${new Date(Number(details[5]) * 1000).toLocaleString()}`
    );

    const docUrl = await cppob.getCppobDocument(cppobId);
    console.log(`   • Document URL     : ${docUrl}`);
  } catch (err) {
    console.error("❌ ERROR: Gagal mengambil data CPPOB");
    console.error(err);
    process.exit(1);
  }

  console.timeEnd("⏳ Total Execution Time");
  console.log("\n🎉 Simulasi Penerbitan CPPOB selesai!");
}

main().catch(err => {
  console.error("❌ ERROR unexpected:", err);
  process.exitCode = 1;
});