// scripts/simulation/simulateSupplyChain.js
const hre = require("hardhat");

async function main() {
  console.log("🚀 Simulasi Tracking Shipment untuk Cashew Milk");
  console.time("⏳ Total Execution Time");

  // 1) Setup industry account & contract addresses
  const industryWalletAddress      = "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266";
  const permitValidationAddress    = "0xAC199d7CFf037468FCCBf17BbD3bb2dddFD92590"; // PermitValidationContract
  const coaValidationAddress       = "0xAB386e04A54AF65993e1cD00977E122eF9F332E2"; // CoAValidationContract
  const trackingAddress             = "0xC590836DeFBc8Ed2B0D4481da40D305A5b38de6C"; // SupplyChainTrackingContract

  const provider       = new hre.ethers.JsonRpcProvider("http://127.0.0.1:8545");
  const industrySigner = await provider.getSigner(industryWalletAddress);
  console.log(`🏭 Industri Wallet: ${await industrySigner.getAddress()}`);

  // 2) Connect to contracts
  const permitContract   = await hre.ethers.getContractAt(
    "PermitValidationContract",
    permitValidationAddress,
    industrySigner
  );
  const coaContract      = await hre.ethers.getContractAt(
    "CoAValidationContract",
    coaValidationAddress,
    industrySigner
  );
  const trackingContract = await hre.ethers.getContractAt(
    "SupplyChainTrackingContract",
    trackingAddress,
    industrySigner
  );
  console.log("🔗 Terhubung ke Permit, CoA, dan SupplyChainTracking contracts");

  // 3) Simulation data
  const permitId    = 4211; // sudah diterbitkan via simulatePermit.js
  const batchId     = 2001; // sudah diterbitkan via simulateCoA.js
  const shipmentId  = 3001;
  const distributor = "PT. Fast Logistics";
  const retailer    = "SuperMart ID";

  // 4) Verify Permit (NIE)
  console.log("\n🔍 Verifikasi Permit (NIE) sebelum createShipment...");
  try {
    const [
      pid,          // permitId (BigNumber)
      cppobId,      // cppobId (BigNumber)
      pName,        // productName (string)
      pIndustry,    // industry (string)
      pType,        // productType (string)
      pApproval,    // approvalDate (BigNumber)
      pExpiry       // expiryDate (BigNumber)
    ] = await permitContract.getPermitDetails(permitId);

    console.log(`   • Permit ID     : ${pid.toString()}`);
    console.log(`   • Produk        : ${pName}`);
    console.log(`   • Industri      : ${pIndustry}`);
    console.log(
      `   • Approval Date : ${new Date(Number(pApproval) * 1000).toLocaleString()}`
    );
    console.log(
      `   • Expiry Date   : ${new Date(Number(pExpiry) * 1000).toLocaleString()}`
    );

    if (Number(pExpiry) < Math.floor(Date.now() / 1000)) {
      throw new Error("Permit expired");
    }
    console.log("✅ Permit valid");
  } catch (err) {
    console.error("❌ ERROR: Permit invalid atau tidak ditemukan.");
    console.error(err);
    return;
  }

  // 5) Verify CoA
  console.log("\n🔍 Verifikasi CoA sebelum createShipment...");
  try {
    const [
      bId,          // batchId (BigNumber)
      cName,        // productName (string)
      cIndustry,    // industry (string)
      cDocLink,     // coa document URL (string)
      cProdDate,    // productionDate (BigNumber)
      cExpiryDate,  // expiryDate (BigNumber)
      linkedPermit  // permitId (BigNumber)
    ] = await coaContract.getCoADetails(batchId);

    console.log(`   • Batch ID        : ${bId.toString()}`);
    console.log(`   • Produk          : ${cName}`);
    console.log(`   • Industri        : ${cIndustry}`);
    console.log(`   • CoA Document    : ${cDocLink}`);
    console.log(
      `   • Production Date : ${new Date(Number(cProdDate) * 1000).toLocaleString()}`
    );
    console.log(
      `   • Expiry Date     : ${new Date(Number(cExpiryDate) * 1000).toLocaleString()}`
    );
    console.log(`   • Linked Permit   : ${linkedPermit.toString()}`);

    // Pastikan linkedPermit === permitId
    if (Number(linkedPermit) !== permitId) {
      throw new Error("Permit ID mismatch in CoA");
    }
    console.log("✅ CoA valid");
  } catch (err) {
    console.error("❌ ERROR: CoA invalid atau tidak ditemukan.");
    console.error(err);
    return;
  }

  // 6) Check existing shipment
  console.log("\n🔍 Mengecek ketersediaan Shipment ID...");
  try {
    const existing = await trackingContract.shipments(shipmentId);
    // Di contract, `shipments` adalah mapping => struct Shipment:
    //   struct Shipment { uint256 shipmentId; /* ... */ }
    // Jadi `existing.shipmentId` akan menjadi BigNumber
    if (Number(existing.shipmentId) !== 0) {
      console.error(`❌ ERROR: Shipment ID ${shipmentId} sudah ada!`);
      return;
    }
    console.log("✅ Shipment ID tersedia");
  } catch (err) {
    console.error("❌ ERROR: Gagal cek shipment.");
    console.error(err);
    return;
  }

  // 7) Create shipment
  console.log("\n🚚 Membuat Shipment...");
  try {
    const tx = await trackingContract.createShipment(
      shipmentId,
      batchId,
      permitId,
      distributor,
      retailer
    );
    await tx.wait();
    console.log(`📦 Shipment berhasil dibuat dengan ID ${shipmentId}`);
  } catch (err) {
    console.error("❌ ERROR: Gagal createShipment.");
    console.error(err);
    return;
  }

  // 8) Receive by distributor
  console.log("\n🏬 Distributor menerima shipment...");
  try {
    const tx = await trackingContract.receiveByDistributor(shipmentId);
    await tx.wait();
    console.log(`✅ Shipment #${shipmentId} diterima distributor`);
  } catch (err) {
    console.error("❌ ERROR: Gagal receiveByDistributor.");
    console.error(err);
    return;
  }

  // 9) Receive by retailer
  console.log("\n🛒 Retailer menerima shipment...");
  try {
    const tx = await trackingContract.receiveByRetailer(shipmentId);
    await tx.wait();
    console.log(`✅ Shipment #${shipmentId} diterima retailer`);
  } catch (err) {
    console.error("❌ ERROR: Gagal receiveByRetailer.");
    console.error(err);
    return;
  }

  // 10) Fetch and display shipment details
  console.log("\n📜 Detail Shipment:");
  try {
    const d = await trackingContract.getShipmentDetails(shipmentId);
    console.log({
      shipmentId:            d[0].toString(),
      batchId:               d[1].toString(),
      permitId:              d[2].toString(),
      industry:              d[3],                                  // address
      distributor:           d[4],                                  // string
      retailer:              d[5],                                  // string
      createdAt:             new Date(Number(d[6]) * 1000).toLocaleString(),
      receivedByDistributor: Number(d[7]) > 0
        ? new Date(Number(d[7]) * 1000).toLocaleString()
        : "Belum diterima",
      receivedByRetailer:    Number(d[8]) > 0
        ? new Date(Number(d[8]) * 1000).toLocaleString()
        : "Belum diterima"
    });
  } catch (err) {
    console.error("❌ ERROR: Gagal getShipmentDetails.");
    console.error(err);
    return;
  }

  console.timeEnd("⏳ Total Execution Time");
  console.log("\n🎉 Simulasi shipping tracking selesai!");
}

main().catch(err => {
  console.error("❌ ERROR unexpected:", err);
  process.exitCode = 1;
});