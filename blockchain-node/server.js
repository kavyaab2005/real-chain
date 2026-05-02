const { spawn } = require("child_process");
const express   = require("express");
const cors      = require("cors");
const http      = require("http");

const app = express();
app.use(cors());
app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.json({ status: "RealChain Blockchain Node Running!", chainId: 31337 });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Proxy all RPC requests to Hardhat node on port 8545
app.post("/", (req, res) => {
  const options = {
    hostname: "127.0.0.1",
    port: 8545,
    path: "/",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  };

  const proxyReq = http.request(options, (proxyRes) => {
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Access-Control-Allow-Origin", "*");
    proxyRes.pipe(res);
  });

  proxyReq.on("error", (err) => {
    console.error("Proxy error:", err);
    res.status(500).json({ error: "Blockchain node not ready yet" });
  });

  req.pipe(proxyReq);
});

// Start Hardhat node on port 8545
console.log("Starting Hardhat node...");
const hardhatNode = spawn("npx", ["hardhat", "node", "--hostname", "127.0.0.1", "--port", "8545"], {
  stdio: "inherit",
  shell: true,
  cwd: __dirname
});

hardhatNode.on("error", (err) => {
  console.error("Hardhat node error:", err);
});

// Start Express server
const PORT = process.env.PORT || 10000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Health check + RPC proxy running on port ${PORT}`);
  console.log(`Hardhat node starting on port 8545`);
});