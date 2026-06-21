// scripts/simulation/simulatePermit.js
const hre = require("hardhat");

async function main() {
  console.log("🚀 Simulasi Penerbitan Permit to Circulate License (NIE) oleh BPOM");
  console.time("⏳ Total Execution Time");

  // 1) Setup account & contract address
  const bpomWalletAddress       = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
  const permitValidationAddress = "0xAC199d7CFf037468FCCBf17BbD3bb2dddFD92590";

  const provider = new hre.ethers.JsonRpcProvider("http://127.0.0.1:8545");
  const signer   = await provider.getSigner(bpomWalletAddress);
  console.log(`🏛 BPOM Authority: ${await signer.getAddress()}`);

  // 2) Connect to PermitValidationContract
  const permitContract = await hre.ethers.getContractAt(
    "PermitValidationContract",
    permitValidationAddress,
    signer
  );
  console.log("🔗 Terhubung ke PermitValidationContract");

  // 3) Ambil block.timestamp saat ini agar tidak “future date”
  const latestBlock   = await provider.getBlock("latest");
  const nowTs         = latestBlock.timestamp;
  const approvalDate  = nowTs; // gunakan timestamp blok sebagai approvalDate

  console.log(`\n🔍 Current block timestamp: ${new Date(Number(nowTs) * 1000).toLocaleString()}`);
  console.log(`   • Menggunakan approvalDate = ${nowTs} (${new Date(Number(approvalDate) * 1000).toLocaleString()})\n`);

  // 4) Simulation data lainnya
  const permitId    = 4211;
  const cppobId     = 3001;  // harus sudah diterbitkan di CppobValidationContract
  const productName = "Cashew Milk";
  const industry    = "Axxx Foods";
  const productType = "Beverage";
  const permitHash  = "QmPermitDummyHashABC1234567890";

  // 5) Issue Permit
  console.log("📤 Menerbitkan Permit to Circulate License (NIE)...");
  try {
    const tx = await permitContract.issuePermit(
      permitId,
      cppobId,
      productName,
      industry,
      productType,
      permitHash,
      approvalDate
    );
    await tx.wait();
    console.log(`✅ Permit #${permitId} berhasil diterbitkan!`);
  } catch (err) {
    console.error("❌ ERROR: Gagal menerbitkan Permit.");
    console.error(err);
    process.exit(1);
  }

  // 6) Verify on-chain via getter
  console.log("\n🔍 Verifikasi Permit di blockchain:");
  try {
    const [
      pid,
      cid,
      pname,
      ind,
      ptype,
      appDate,
      expDate
    ] = await permitContract.getPermitDetails(permitId);

    console.log(`   • Permit ID     : ${pid.toString()}`);
    console.log(`   • CPPOB ID      : ${cid.toString()}`);
    console.log(`   • Product Name  : ${pname}`);
    console.log(`   • Industry      : ${ind}`);
    console.log(`   • Product Type  : ${ptype}`);
    console.log(
      `   • Approval Date : ${new Date(Number(appDate) * 1000).toLocaleString()}`
    );
    console.log(
      `   • Expiry Date   : ${new Date(Number(expDate) * 1000).toLocaleString()}`
    );

    const docUrl = await permitContract.getPermitDocument(permitId);
    console.log(`   • Document URL  : ${docUrl}`);
  } catch (err) {
    console.error("❌ ERROR: Gagal mengambil data Permit.");
    console.error(err);
    process.exit(1);
  }

  console.timeEnd("⏳ Total Execution Time");
  console.log("\n🎉 Simulasi penerbitan Permit selesai!");
}

main().catch(error => {
  console.error("❌ ERROR unexpected:", error);
  process.exitCode = 1;
});