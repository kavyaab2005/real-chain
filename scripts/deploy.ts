import fs from "fs";
import path from "path";

async function main() {
  const { ethers } = await import("hardhat");

  const signers = await ethers.getSigners();
  const deployer = signers[0];
  console.log("Deploying with account:", deployer.address);

  // 1. Deploy PropertyRegistry
  const Registry = await ethers.getContractFactory("PropertyRegistry");
  const registry = await Registry.deploy();
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();
  console.log("PropertyRegistry:", registryAddress);

  // 2. Deploy PropertyNFT
  const NFT = await ethers.getContractFactory("PropertyNFT");
  const nft = await NFT.deploy();
  await nft.waitForDeployment();
  const nftAddress = await nft.getAddress();
  console.log("PropertyNFT:", nftAddress);

  // 3. Deploy Marketplace
  const Marketplace = await ethers.getContractFactory("Marketplace");
  const marketplace = await Marketplace.deploy(registryAddress, nftAddress);
  await marketplace.waitForDeployment();
  const marketplaceAddress = await marketplace.getAddress();
  console.log("Marketplace:", marketplaceAddress);

  // 4. Transfer NFT ownership to Marketplace
  await nft.transferOwnership(marketplaceAddress);
  console.log("NFT ownership transferred!");

  // 5. Save addresses
  const addresses = {
    registry: registryAddress,
    nft: nftAddress,
    marketplace: marketplaceAddress,
  };

  fs.mkdirSync(path.join("frontend", "src", "contracts"), { recursive: true });
  fs.writeFileSync(
    path.join("frontend", "src", "contracts", "addresses.json"),
    JSON.stringify(addresses, null, 2)
  );

  console.log("\n✅ All contracts deployed!");
  console.log(JSON.stringify(addresses, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});