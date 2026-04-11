import { ethers } from "ethers";
import addresses from "../contracts/addresses.json";
import RegistryABI from "../contracts/PropertyRegistry.json";
import MarketplaceABI from "../contracts/Marketplace.json";
import NFTABI from "../contracts/PropertyNFT.json";

// Connect MetaMask wallet
export const connectWallet = async () => {
  if (!window.ethereum) throw new Error("MetaMask not found. Please install it.");
  const provider = new ethers.BrowserProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  const signer  = await provider.getSigner();
  const address = await signer.getAddress();
  return { provider, signer, address };
};

// Get all 3 contracts
export const getContracts = async (signer) => ({
  registry:    new ethers.Contract(addresses.registry,    RegistryABI.abi,    signer),
  marketplace: new ethers.Contract(addresses.marketplace, MarketplaceABI.abi, signer),
  nft:         new ethers.Contract(addresses.nft,         NFTABI.abi,         signer),
});

// List a new property
export const listProperty = async (signer, { location, area, priceEther, ipfsHash }) => {
  const { registry } = await getContracts(signer);
  const tx = await registry.listProperty(
    location,
    area,
    ethers.parseEther(priceEther.toString()),
    ipfsHash
  );
  return tx.wait();
};

// Buy a property
export const buyProperty = async (signer, propertyId, priceEther) => {
  const { marketplace } = await getContracts(signer);
  const tx = await marketplace.initiatePurchase(propertyId, {
    value: ethers.parseEther(priceEther.toString()),
  });
  return tx.wait();
};

// Get all properties
export const getAllProperties = async () => {
  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
  const registry = new ethers.Contract(
    addresses.registry,
    RegistryABI.abi,
    provider
  );
  const props = await registry.getAllProperties();
  return props.map((p) => ({
    id:        Number(p.id),
    location:  p.location,
    areaSqFt:  Number(p.areaSqFt),
    price:     ethers.formatEther(p.price),
    owner:     p.owner,
    isForSale: p.isForSale,
    ipfsHash:  p.ipfsHash,
    listedAt:  new Date(Number(p.listedAt) * 1000).toLocaleDateString(),
  }));
};

// Get properties by owner
export const getMyProperties = async (signer) => {
  const address = await signer.getAddress();
  const { registry } = await getContracts(signer);
  const ids = await registry.getOwnerProperties(address);
  const props = await Promise.all(
    ids.map((id) => registry.getProperty(id))
  );
  return props.map((p) => ({
    id:        Number(p.id),
    location:  p.location,
    areaSqFt:  Number(p.areaSqFt),
    price:     ethers.formatEther(p.price),
    owner:     p.owner,
    isForSale: p.isForSale,
    ipfsHash:  p.ipfsHash,
    listedAt:  new Date(Number(p.listedAt) * 1000).toLocaleDateString(),
  }));
};