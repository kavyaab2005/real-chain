import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div style={{ textAlign: "center", padding: "4rem 2rem" }}>
      <h1 style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>
        🏠 Real Estate on Blockchain
      </h1>
      <p style={{ fontSize: "1.2rem", color: "#666", marginBottom: "2rem" }}>
        Buy, sell and tokenize real estate properties using smart contracts
      </p>

      <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
        <Link to="/properties">
          <button style={{
            padding: "12px 28px", background: "#7c3aed",
            color: "#fff", border: "none", borderRadius: "8px",
            fontSize: "1rem", cursor: "pointer"
          }}>
            View Properties
          </button>
        </Link>
        <Link to="/list">
          <button style={{
            padding: "12px 28px", background: "#059669",
            color: "#fff", border: "none", borderRadius: "8px",
            fontSize: "1rem", cursor: "pointer"
          }}>
            List Property
          </button>
        </Link>
        <Link to="/dashboard">
          <button style={{
            padding: "12px 28px", background: "#2563eb",
            color: "#fff", border: "none", borderRadius: "8px",
            fontSize: "1rem", cursor: "pointer"
          }}>
            Analytics Dashboard
          </button>
        </Link>
      </div>

      <div style={{
        display: "flex", gap: "2rem", justifyContent: "center",
        marginTop: "4rem", flexWrap: "wrap"
      }}>
        <div style={{ padding: "1.5rem", background: "#f3f4f6", borderRadius: "12px", width: "200px" }}>
          <div style={{ fontSize: "2rem" }}>🔒</div>
          <h3>Secure Ownership</h3>
          <p style={{ color: "#666", fontSize: "0.9rem" }}>Properties stored on blockchain as NFTs</p>
        </div>
        <div style={{ padding: "1.5rem", background: "#f3f4f6", borderRadius: "12px", width: "200px" }}>
          <div style={{ fontSize: "2rem" }}>💸</div>
          <h3>Smart Escrow</h3>
          <p style={{ color: "#666", fontSize: "0.9rem" }}>Funds held safely until sale completes</p>
        </div>
        <div style={{ padding: "1.5rem", background: "#f3f4f6", borderRadius: "12px", width: "200px" }}>
          <div style={{ fontSize: "2rem" }}>📊</div>
          <h3>Price Analytics</h3>
          <p style={{ color: "#666", fontSize: "0.9rem" }}>Track property price trends on-chain</p>
        </div>
      </div>
    </div>
  );
}