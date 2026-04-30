const { execSync, spawn } = require("child_process");
const express = require("express");
const cors    = require("cors");
const path    = require("path");
const fs      = require("fs");

const app = express();
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get("/", (req, res) => {
  res.json({ status: "RealChain Blockchain Node Running!", chainId: 31337 });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Start Hardhat node
console.log("Starting Hardhat node...");
const hardhatNode = spawn("npx", ["hardhat", "node", "--hostname", "0.0.0.0"], {
  stdio: "inherit",
  shell: true
});

hardhatNode.on("error", (err) => {
  console.error("Hardhat node error:", err);
});

// Start Express server for health checks
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Health check server running on port ${PORT}`);
  console.log(`Hardhat node running on port 8545`);
});