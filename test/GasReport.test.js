const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("📊 Gas Consumption & Tx Time Report", function() {
  let cppob, permit, coa, tracking;
  let CppobFactory, PermitFactory, CoAFactory, TrackingFactory;
  let deployer, industry;
  let now;

  before(async function() {
    [deployer, industry] = await ethers.getSigners();

    // Ambil timestamp block terbaru untuk referensi “now”
    const block = await ethers.provider.getBlock("latest");
    now = block.timestamp;

    // 1) Deploy CppobValidationContract
    CppobFactory = await ethers.getContractFactory("CppobValidationContract");
    cppob = await CppobFactory.deploy();
    await cppob.waitForDeployment();

    // 2) Deploy PermitValidationContract (butuh alamat cppob)
    PermitFactory = await ethers.getContractFactory("PermitValidationContract");
    permit = await PermitFactory.deploy(cppob.target);
    await permit.waitForDeployment();

    // 3) Deploy CoAValidationContract (butuh alamat permit)
    CoAFactory = await ethers.getContractFactory("CoAValidationContract");
    coa = await CoAFactory.deploy(permit.target);
    await coa.waitForDeployment();

    // 4) Deploy SupplyChainTrackingContract (butuh alamat permit + coa)
    TrackingFactory = await ethers.getContractFactory("SupplyChainTrackingContract");
    tracking = await TrackingFactory.deploy(permit.target, coa.target);
    await tracking.waitForDeployment();
  });

  it("✔ Gas: Deploy semua kontrak (tercatat otomatis oleh gas-reporter)", async function() {
    // gas-reporter akan otomatis mengukur deployment di hook `before`
  });

  it("Gas & Time: issueCppob", async function() {
    const issueDate = now - 100;

    // Catat waktu sebelum kirim tx
    const t0 = Date.now();
    const tx = await cppob.issueCppob(
      3001,
      "Axxx Foods Processing Plant",
      "Jl. Industri No.123, Bandung, Indonesia",
      "QmCppobDummyHash1234567890abcdef",
      issueDate
    );
    await tx.wait();
    const t1 = Date.now();

    console.log(`→ issueCppob execution time: ${t1 - t0} ms`);
  });

  it("Gas & Time: issuePermit", async function() {
    // Pertama-tama buat Cppob baru agar permit bisa dipanggil
    const issueDateCppob = now - 200;
    await cppob.issueCppob(
      3002,
      "Plant2",
      "Address2",
      "Hash2",
      issueDateCppob
    );

    const approvalDate = now - 10;

    const t0 = Date.now();
    const tx = await permit.issuePermit(
      4211,
      3002,
      "Cashew Milk",
      "Axxx Foods",
      "Beverage",
      "QmPermitDummyHash1234567890",
      approvalDate
    );
    await tx.wait();
    const t1 = Date.now();

    console.log(`→ issuePermit execution time: ${t1 - t0} ms`);
  });

  it("Gas & Time: issueCoA", async function() {
    // Buat Cppob + Permit baru untuk CoA
    const issueDateCppob = now - 300;
    await cppob.issueCppob(
      3003,
      "Plant3",
      "Address3",
      "Hash3",
      issueDateCppob
    );
    const approvalDate = now - 50;
    await permit.issuePermit(
      4212,
      3003,
      "Cashew Milk",
      "Axxx Foods",
      "Beverage",
      "QmPermitHashElse",
      approvalDate
    );

    const productionDate = now - 100;

    const t0 = Date.now();
    const tx = await coa.issueCoA(
      2001,
      "Cashew Milk",
      "Axxx Foods",
      productionDate,
      "QmCoADummyHash1234567890abcdef",
      4212,
      ["Protein", "Lemak", "Karbohidrat"],
      ["g", "g", "g"],
      [5, 2, 10].map(BigInt),
      [10, 5, 15].map(BigInt),
      [8, 3, 12].map(BigInt)
    );
    await tx.wait();
    const t1 = Date.now();

    console.log(`→ issueCoA execution time: ${t1 - t0} ms`);
  });

  it("Gas & Time: createShipment", async function() {
    // Buat Cppob + Permit + CoA baru agar createShipment valid
    const issueDateCppob = now - 400;
    await cppob.issueCppob(
      3004,
      "Plant4",
      "Address4",
      "Hash4",
      issueDateCppob
    );
    const approvalDate = now - 20;
    await permit.issuePermit(
      4213,
      3004,
      "Cashew Milk",
      "Axxx Foods",
      "Beverage",
      "QmPermitHashElse2",
      approvalDate
    );
    const productionDate = now - 150;
    await coa.issueCoA(
      2002,
      "Cashew Milk",
      "Axxx Foods",
      productionDate,
      "QmCoADummyHash2",
      4213,
      ["Protein", "Lemak", "Karbohidrat"],
      ["g", "g", "g"],
      [5, 2, 10].map(BigInt),
      [10, 5, 15].map(BigInt),
      [8, 3, 12].map(BigInt)
    );

    const t0 = Date.now();
    const tx = await tracking.createShipment(
      3001,
      2002,
      4213,
      "PT. Fast Logistics",
      "SuperMart ID"
    );
    await tx.wait();
    const t1 = Date.now();

    console.log(`→ createShipment execution time: ${t1 - t0} ms`);
  });
});