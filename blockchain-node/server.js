const { spawn } = require("child_process");
const express   = require("express");
const cors      = require("cors");
const http      = require("http");

const app = express();
app.use(cors());
app.use(express.json());

let hardhatReady = false;

// Wait for hardhat to be ready
function waitForHardhat(retries = 30) {
  return new Promise((resolve) => {
    const check = () => {
      const req = http.request({
        hostname: "127.0.0.1",
        port: 8545,
        path: "/",
        method: "POST",
        headers: { "Content-Type": "application/json" }
      }, (res) => {
        hardhatReady = true;
        console.log("Hardhat node is ready!");
        resolve(true);
      });
      req.on("error", () => {
        if (retries > 0) {
          retries--;
          console.log(`Waiting for Hardhat... (${retries} retries left)`);
          setTimeout(check, 3000);
        } else {
          resolve(false);
        }
      });
      req.write(JSON.stringify({ jsonrpc: "2.0", method: "eth_chainId", params: [], id: 1 }));
      req.end();
    };
    setTimeout(check, 5000);
  });
}

// Health check
app.get("/", (req, res) => {
  res.json({
    status: "RealChain Blockchain Node",
    hardhatReady,
    chainId: 31337
  });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", hardhatReady });
});

// Proxy RPC requests to Hardhat
app.post("/", (req, res) => {
  if (!hardhatReady) {
    return res.status(503).json({
      jsonrpc: "2.0",
      error: { code: -32000, message: "Blockchain node starting up, please wait..." },
      id: req.body?.id || null
    });
  }

  const options = {
    hostname: "127.0.0.1",
    port: 8545,
    path: "/",
    method: "POST",
    headers: { "Content-Type": "application/json" },
  };

  const proxyReq = http.request(options, (proxyRes) => {
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Access-Control-Allow-Origin", "*");
    proxyRes.pipe(res);
  });

  proxyReq.on("error", (err) => {
    console.error("Proxy error:", err);
    res.status(500).json({ error: "Proxy error" });
  });

  req.pipe(proxyReq);
});

// Start Hardhat node
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
  console.log(`Server running on port ${PORT}`);
  waitForHardhat().then((ready) => {
    console.log(`Hardhat ready: ${ready}`);
  });
});