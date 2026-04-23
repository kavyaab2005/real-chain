
const express    = require("express");
const cors       = require("cors");
const http       = require("http");
const { Server } = require("socket.io");
const { ethers } = require("ethers");
require("dotenv").config();
const mongoose = require("mongoose");
const { router: authRouter } = require("./auth");
require("./models");
// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected!"))
  .catch(err => console.log("MongoDB error:", err));
const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

app.use(cors());
app.use(express.json());
app.use("/api/auth", authRouter);
app.use("/uploads", express.static("uploads"));

// Load ABIs
const RegistryABI    = require("./abis/PropertyRegistry.json");
const MarketplaceABI = require("./abis/Marketplace.json");
const NFTABI         = require("./abis/PropertyNFT.json");
const FractionalABI  = require("./abis/FractionalOwnership.json");

// Connect to blockchain
const provider    = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC);
const registry    = new ethers.Contract(process.env.REGISTRY_ADDRESS,    RegistryABI.abi,    provider);
const marketplace = new ethers.Contract(process.env.MARKETPLACE_ADDRESS, MarketplaceABI.abi, provider);
const nft         = new ethers.Contract(process.env.NFT_ADDRESS,         NFTABI.abi,         provider);
const fractional  = new ethers.Contract(process.env.FRACTIONAL_ADDRESS,  FractionalABI.abi,  provider);

// In-memory store for transactions
let transactions = [];
let notifications = [];

// ── Real-time Blockchain Event Listeners ──────────────────────

// Listen for new property listings
registry.on("PropertyListed", (id, owner, price, location, event) => {
  const notification = {
    id:        Date.now(),
    type:      "NEW_LISTING",
    message:   `New property listed at ${location}`,
    price:     ethers.formatEther(price),
    owner:     owner,
    propertyId: Number(id),
    timestamp: new Date().toISOString(),
  };
  notifications.push(notification);
  transactions.push({
    type:      "Property Listed",
    propertyId: Number(id),
    location,
    price:     ethers.formatEther(price),
    from:      owner,
    timestamp: new Date().toISOString(),
  });
  // Emit to all connected clients in real-time
  io.emit("newListing", notification);
  console.log("New listing:", location);
});

// Listen for sales
marketplace.on("SaleCompleted", (propertyId, buyer, price, event) => {
  const notification = {
    id:        Date.now(),
    type:      "SALE_COMPLETED",
    message:   `Property #${Number(propertyId)} sold for ${ethers.formatEther(price)} MATIC`,
    price:     ethers.formatEther(price),
    buyer:     buyer,
    propertyId: Number(propertyId),
    timestamp: new Date().toISOString(),
  };
  notifications.push(notification);
  transactions.push({
    type:      "Property Sold",
    propertyId: Number(propertyId),
    price:     ethers.formatEther(price),
    to:        buyer,
    timestamp: new Date().toISOString(),
  });
  io.emit("saleMade", notification);
  console.log("Sale completed:", Number(propertyId));
});

// Listen for sale initiated (escrow)
marketplace.on("SaleInitiated", (propertyId, buyer, amount, event) => {
  const notification = {
    id:        Date.now(),
    type:      "SALE_INITIATED",
    message:   `Purchase initiated for Property #${Number(propertyId)}`,
    amount:    ethers.formatEther(amount),
    buyer:     buyer,
    propertyId: Number(propertyId),
    timestamp: new Date().toISOString(),
  };
  notifications.push(notification);
  io.emit("saleInitiated", notification);
});

// Listen for fractional share purchases
fractional.on("SharesPurchased", (propertyId, buyer, shares, totalPaid, event) => {
  const notification = {
    id:        Date.now(),
    type:      "SHARES_PURCHASED",
    message:   `${Number(shares)} shares of Property #${Number(propertyId)} purchased`,
    shares:    Number(shares),
    totalPaid: ethers.formatEther(totalPaid),
    buyer:     buyer,
    propertyId: Number(propertyId),
    timestamp: new Date().toISOString(),
  };
  notifications.push(notification);
  io.emit("sharesPurchased", notification);
});

// ── REST API Routes ────────────────────────────────────────────

// Get all properties
app.get("/api/properties", async (req, res) => {
  try {
    const props = await registry.getAllProperties();
    const mapped = props.map(p => ({
      id:        Number(p.id),
      location:  p.location,
      areaSqFt:  Number(p.areaSqFt),
      price:     ethers.formatEther(p.price),
      owner:     p.owner,
      isForSale: p.isForSale,
      ipfsHash:  p.ipfsHash,
      listedAt:  new Date(Number(p.listedAt) * 1000).toLocaleDateString(),
    }));
    res.json({ success: true, data: mapped });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get single property
app.get("/api/properties/:id", async (req, res) => {
  try {
    const prop = await registry.getProperty(req.params.id);
    res.json({
      success: true,
      data: {
        id:        Number(prop.id),
        location:  prop.location,
        areaSqFt:  Number(prop.areaSqFt),
        price:     ethers.formatEther(prop.price),
        owner:     prop.owner,
        isForSale: prop.isForSale,
        ipfsHash:  prop.ipfsHash,
        listedAt:  new Date(Number(prop.listedAt) * 1000).toLocaleDateString(),
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get property history
app.get("/api/properties/:id/history", async (req, res) => {
  try {
    const id = req.params.id;
    const listFilter  = registry.filters.PropertyListed(id);
    const listEvents  = await registry.queryFilter(listFilter, 0, "latest");
    const saleFilter  = marketplace.filters.SaleCompleted(id);
    const saleEvents  = await marketplace.queryFilter(saleFilter, 0, "latest");
    const priceFilter = registry.filters.PriceUpdated(id);
    const priceEvents = await registry.queryFilter(priceFilter, 0, "latest");

    const history = [
      ...listEvents.map(e => ({
        type:   "Listed",
        block:  e.blockNumber,
        price:  ethers.formatEther(e.args.price),
        owner:  e.args.owner,
      })),
      ...saleEvents.map(e => ({
        type:  "Sold",
        block: e.blockNumber,
        price: ethers.formatEther(e.args.price),
        buyer: e.args.buyer,
      })),
      ...priceEvents.map(e => ({
        type:     "Price Updated",
        block:    e.blockNumber,
        oldPrice: ethers.formatEther(e.args.oldPrice),
        newPrice: ethers.formatEther(e.args.newPrice),
      })),
    ].sort((a, b) => a.block - b.block);

    res.json({ success: true, data: history });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get properties by owner
app.get("/api/user/:address/properties", async (req, res) => {
  try {
    const ids  = await registry.getOwnerProperties(req.params.address);
    const props = await Promise.all(
      ids.map(id => registry.getProperty(id))
    );
    const mapped = props.map(p => ({
      id:        Number(p.id),
      location:  p.location,
      areaSqFt:  Number(p.areaSqFt),
      price:     ethers.formatEther(p.price),
      owner:     p.owner,
      isForSale: p.isForSale,
      ipfsHash:  p.ipfsHash,
    }));
    res.json({ success: true, data: mapped });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get all transactions
app.get("/api/transactions", (req, res) => {
  res.json({ success: true, data: transactions });
});

// Get all notifications
app.get("/api/notifications", (req, res) => {
  res.json({ success: true, data: notifications.slice(-20) });
});

// Get analytics
app.get("/api/analytics", async (req, res) => {
  try {
    const props       = await registry.getAllProperties();
    const saleFilter  = marketplace.filters.SaleCompleted();
    const saleEvents  = await marketplace.queryFilter(saleFilter, 0, "latest");

    const totalProperties = props.length;
    const forSale         = props.filter(p => p.isForSale).length;
    const totalValue      = props.reduce((sum, p) =>
      sum + parseFloat(ethers.formatEther(p.price)), 0
    );
    const totalSales      = saleEvents.length;
    const salesVolume     = saleEvents.reduce((sum, e) =>
      sum + parseFloat(ethers.formatEther(e.args.price)), 0
    );

    // Price by city
    const cityPrices = {};
    props.forEach(p => {
      const city = p.location.split(",").pop().trim();
      if (!cityPrices[city]) cityPrices[city] = [];
      cityPrices[city].push(parseFloat(ethers.formatEther(p.price)));
    });

    const cityAvgPrices = Object.entries(cityPrices).map(([city, prices]) => ({
      city,
      avgPrice: (prices.reduce((a, b) => a + b, 0) / prices.length).toFixed(2),
      count:    prices.length,
    }));

    res.json({
      success: true,
      data: {
        totalProperties,
        forSale,
        totalValue:   totalValue.toFixed(2),
        totalSales,
        salesVolume:  salesVolume.toFixed(2),
        cityAvgPrices,
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Upload to IPFS via Pinata
app.post("/api/upload/image", async (req, res) => {
  try {
    const axios    = require("axios");
    const FormData = require("form-data");
    const { imageBase64, filename } = req.body;

    const buffer = Buffer.from(imageBase64, "base64");
    const form   = new FormData();
    form.append("file", buffer, { filename: filename || "property.jpg" });
    form.append("pinataMetadata", JSON.stringify({ name: filename }));

    const response = await axios.post(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      form,
      {
        headers: {
          ...form.getHeaders(),
          pinata_api_key:        process.env.PINATA_API_KEY,
          pinata_secret_api_key: process.env.PINATA_SECRET,
        }
      }
    );
    res.json({ success: true, ipfsHash: response.data.IpfsHash });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Upload metadata to IPFS
app.post("/api/upload/metadata", async (req, res) => {
  try {
    const axios    = require("axios");
    const response = await axios.post(
      "https://api.pinata.cloud/pinning/pinJSONToIPFS",
      req.body,
      {
        headers: {
          pinata_api_key:        process.env.PINATA_API_KEY,
          pinata_secret_api_key: process.env.PINATA_SECRET,
        }
      }
    );
    res.json({ success: true, ipfsHash: response.data.IpfsHash });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Socket.io Connection ───────────────────────────────────────
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);
  // Send last 5 notifications on connect
  socket.emit("recentNotifications", notifications.slice(-5));
  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// ── Start Server ───────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`\n🚀 RealChain Backend running on http://localhost:${PORT}`);
  console.log(`📡 Listening to blockchain events in real-time...`);
  console.log(`🔌 WebSocket server ready for real-time updates\n`);
});