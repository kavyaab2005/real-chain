import { ethers } from "ethers";

const properties = [
  { location: "Koramangala, Bangalore",      area: 1200, price: "15",  ipfsHash: "QmHash001" },
  { location: "Bandra West, Mumbai",         area: 2500, price: "85",  ipfsHash: "QmHash002" },
  { location: "Jubilee Hills, Hyderabad",    area: 3200, price: "45",  ipfsHash: "QmHash003" },
  { location: "Anna Nagar, Chennai",         area: 1800, price: "25",  ipfsHash: "QmHash004" },
  { location: "Connaught Place, Delhi",      area: 950,  price: "120", ipfsHash: "QmHash005" },
  { location: "Aundh, Pune",                 area: 1500, price: "18",  ipfsHash: "QmHash006" },
  { location: "Salt Lake, Kolkata",          area: 2100, price: "22",  ipfsHash: "QmHash007" },
  { location: "Navrangpura, Ahmedabad",      area: 1650, price: "12",  ipfsHash: "QmHash008" },
  { location: "Indiranagar, Bangalore",      area: 1400, price: "20",  ipfsHash: "QmHash009" },
  { location: "Powai, Mumbai",               area: 1900, price: "65",  ipfsHash: "QmHash010" },
  { location: "Gachibowli, Hyderabad",       area: 2800, price: "38",  ipfsHash: "QmHash011" },
  { location: "Adyar, Chennai",              area: 2200, price: "32",  ipfsHash: "QmHash012" },
  { location: "Vasant Kunj, Delhi",          area: 1750, price: "95",  ipfsHash: "QmHash013" },
  { location: "Kothrud, Pune",               area: 1300, price: "14",  ipfsHash: "QmHash014" },
  { location: "New Town, Kolkata",           area: 2400, price: "28",  ipfsHash: "QmHash015" },
  { location: "Satellite, Ahmedabad",        area: 1550, price: "16",  ipfsHash: "QmHash016" },
  { location: "Whitefield, Bangalore",       area: 3000, price: "35",  ipfsHash: "QmHash017" },
  { location: "Andheri West, Mumbai",        area: 1100, price: "72",  ipfsHash: "QmHash018" },
  { location: "HITEC City, Hyderabad",       area: 2600, price: "42",  ipfsHash: "QmHash019" },
  { location: "Velachery, Chennai",          area: 1350, price: "19",  ipfsHash: "QmHash020" },
  { location: "Dwarka, Delhi",               area: 1600, price: "55",  ipfsHash: "QmHash021" },
  { location: "Hadapsar, Pune",              area: 1250, price: "13",  ipfsHash: "QmHash022" },
  { location: "Rajarhat, Kolkata",           area: 1950, price: "24",  ipfsHash: "QmHash023" },
  { location: "Prahlad Nagar, Ahmedabad",    area: 1700, price: "17",  ipfsHash: "QmHash024" },
  { location: "Electronic City, Bangalore",  area: 2300, price: "28",  ipfsHash: "QmHash025" },
  { location: "Juhu, Mumbai",                area: 3500, price: "150", ipfsHash: "QmHash026" },
  { location: "Banjara Hills, Hyderabad",    area: 4000, price: "75",  ipfsHash: "QmHash027" },
  { location: "Nungambakkam, Chennai",       area: 2000, price: "40",  ipfsHash: "QmHash028" },
  { location: "Greater Kailash, Delhi",      area: 2800, price: "110", ipfsHash: "QmHash029" },
  { location: "Wakad, Pune",                 area: 1450, price: "15",  ipfsHash: "QmHash030" },
  { location: "Alipore, Kolkata",            area: 3200, price: "45",  ipfsHash: "QmHash031" },
  { location: "Bodakdev, Ahmedabad",         area: 2100, price: "22",  ipfsHash: "QmHash032" },
  { location: "HSR Layout, Bangalore",       area: 1600, price: "22",  ipfsHash: "QmHash033" },
  { location: "Goregaon, Mumbai",            area: 1200, price: "58",  ipfsHash: "QmHash034" },
  { location: "Kondapur, Hyderabad",         area: 1850, price: "30",  ipfsHash: "QmHash035" },
  { location: "Porur, Chennai",              area: 1500, price: "21",  ipfsHash: "QmHash036" },
  { location: "Rohini, Delhi",               area: 1400, price: "48",  ipfsHash: "QmHash037" },
  { location: "Baner, Pune",                 area: 1700, price: "19",  ipfsHash: "QmHash038" },
  { location: "Behala, Kolkata",             area: 1300, price: "15",  ipfsHash: "QmHash039" },
  { location: "Thaltej, Ahmedabad",          area: 1900, price: "20",  ipfsHash: "QmHash040" },
  { location: "Sarjapur Road, Bangalore",    area: 2200, price: "26",  ipfsHash: "QmHash041" },
  { location: "Chembur, Mumbai",             area: 1050, price: "62",  ipfsHash: "QmHash042" },
  { location: "Kukatpally, Hyderabad",       area: 1750, price: "27",  ipfsHash: "QmHash043" },
  { location: "Chromepet, Chennai",          area: 1200, price: "16",  ipfsHash: "QmHash044" },
  { location: "Janakpuri, Delhi",            area: 1550, price: "52",  ipfsHash: "QmHash045" },
  { location: "Pimple Saudagar, Pune",       area: 1400, price: "16",  ipfsHash: "QmHash046" },
  { location: "Ballygunge, Kolkata",         area: 2500, price: "38",  ipfsHash: "QmHash047" },
  { location: "Vastrapur, Ahmedabad",        area: 1800, price: "19",  ipfsHash: "QmHash048" },
  { location: "Marathahalli, Bangalore",     area: 1350, price: "18",  ipfsHash: "QmHash049" },
  { location: "Malad West, Mumbai",          area: 1150, price: "55",  ipfsHash: "QmHash050" },
];

const PRIVATE_KEYS = [
 "c0b13d3563755f05e81604c74df5dd631f379063bb084d185ffba7af03c93ca8",
 "c0b13d3563755f05e81604c74df5dd631f379063bb084d185ffba7af03c93ca8",
 "c0b13d3563755f05e81604c74df5dd631f379063bb084d185ffba7af03c93ca8",
 "c0b13d3563755f05e81604c74df5dd631f379063bb084d185ffba7af03c93ca8",
 "c0b13d3563755f05e81604c74df5dd631f379063bb084d185ffba7af03c93ca8",
];

const REGISTRY_ADDRESS = "0xD4c35c0a10F16ae330CcD2745e1C300ac3F35962";
const REGISTRY_ABI = [
  "function listProperty(string memory _location, uint256 _areaSqFt, uint256 _price, string memory _ipfsHash) external returns (uint256)"
];

async function main() {
  const provider = new ethers.JsonRpcProvider("https://ethereum-sepolia-rpc.publicnode.com");
  console.log("Adding 50 dummy properties to blockchain...\n");

  for (let i = 0; i < properties.length; i++) {
    const prop     = properties[i];
    const wallet   = new ethers.Wallet(PRIVATE_KEYS[i % 5], provider);
    const registry = new ethers.Contract(REGISTRY_ADDRESS, REGISTRY_ABI, wallet);
    const priceWei = ethers.parseEther(prop.price);

    const tx = await registry.listProperty(
      prop.location,
      prop.area,
      priceWei,
      prop.ipfsHash
    );
    await tx.wait();
    console.log(`✅ [${i + 1}/50] ${prop.location} | ${prop.area} sqft | ${prop.price} MATIC`);
  }

  console.log("\n🎉 All 50 dummy properties added successfully!");
}

main().catch((e) => { console.error(e); process.exit(1); });