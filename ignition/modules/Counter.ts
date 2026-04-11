import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const RealEstateModule = buildModule("RealEstateModule", (m) => {
  const registry    = m.contract("PropertyRegistry");
  const nft         = m.contract("PropertyNFT");
  const marketplace = m.contract("Marketplace", [registry, nft]);
  const fractional  = m.contract("FractionalOwnership");

  m.call(nft, "transferOwnership", [marketplace]);

  return { registry, nft, marketplace, fractional };
});

export default RealEstateModule;