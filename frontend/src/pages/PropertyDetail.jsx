import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ethers } from "ethers";
import { connectWallet, buyProperty } from "../utils/contracts";
import { toast, ToastContainer } from "react-toastify";
import addresses      from "../contracts/addresses.json";
import RegistryABI    from "../contracts/PropertyRegistry.json";
import MarketplaceABI from "../contracts/Marketplace.json";
import "react-toastify/dist/ReactToastify.css";

export default function PropertyDetail() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const [property, setProperty]   = useState(null);
  const [history,  setHistory]    = useState([]);
  const [loading,  setLoading]    = useState(true);
  const [buying,   setBuying]     = useState(false);

  useEffect(() => { loadProperty(); }, [id]);

  const loadProperty = async () => {
    try {
      const provider = new ethers.JsonRpcProvider("https://ethereum-sepolia-rpc.publicnode.com");
      const registry = new ethers.Contract(addresses.registry, RegistryABI.abi, provider);
      const marketplace = new ethers.Contract(addresses.marketplace, MarketplaceABI.abi, provider);

      // Get property details
      const prop = await registry.getProperty(id);
      setProperty({
        id:        Number(prop.id),
        location:  prop.location,
        areaSqFt:  Number(prop.areaSqFt),
        price:     ethers.formatEther(prop.price),
        owner:     prop.owner,
        isForSale: prop.isForSale,
        ipfsHash:  prop.ipfsHash,
        listedAt:  new Date(Number(prop.listedAt) * 1000).toLocaleDateString(),
      });

      // Get ownership history from events
      const listFilter = registry.filters.PropertyListed(id);
      const listEvents = await registry.queryFilter(listFilter, 0, "latest");

      const saleFilter = marketplace.filters.SaleCompleted(id);
      const saleEvents = await marketplace.queryFilter(saleFilter, 0, "latest");

      const priceFilter = registry.filters.PriceUpdated(id);
      const priceEvents = await registry.queryFilter(priceFilter, 0, "latest");

      // Combine all events into history
      const allEvents = [
        ...listEvents.map(e => ({
          type:   "Listed",
          block:  e.blockNumber,
          detail: `Listed at ${ethers.formatEther(e.args.price)} MATIC by ${e.args.owner.slice(0,6)}...${e.args.owner.slice(-4)}`,
          color:  "#7c3aed",
          icon:   "🏠",
        })),
        ...saleEvents.map(e => ({
          type:   "Sold",
          block:  e.blockNumber,
          detail: `Sold to ${e.args.buyer.slice(0,6)}...${e.args.buyer.slice(-4)} for ${ethers.formatEther(e.args.price)} MATIC`,
          color:  "#059669",
          icon:   "✅",
        })),
        ...priceEvents.map(e => ({
          type:   "Price Updated",
          block:  e.blockNumber,
          detail: `Price changed from ${ethers.formatEther(e.args.oldPrice)} to ${ethers.formatEther(e.args.newPrice)} MATIC`,
          color:  "#d97706",
          icon:   "💰",
        })),
      ].sort((a, b) => a.block - b.block);

      setHistory(allEvents);
    } catch (err) {
      toast.error("Error loading property: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBuy = async () => {
    setBuying(true);
    try {
      const { signer } = await connectWallet();
      await buyProperty(signer, property.id, property.price);
      toast.success("Purchase initiated! Property is in escrow.");
      loadProperty();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBuying(false);
    }
  };

  if (loading) return (
    <div style={{ textAlign:"center", padding:"4rem" }}>
      <p>Loading property details from blockchain...</p>
    </div>
  );

  if (!property) return (
    <div style={{ textAlign:"center", padding:"4rem" }}>
      <p>Property not found!</p>
      <button onClick={() => navigate("/properties")}
        style={{ padding:"10px 20px", background:"#7c3aed", color:"#fff",
                 border:"none", borderRadius:"8px", cursor:"pointer" }}>
        Back to Properties
      </button>
    </div>
  );

  return (
    <div style={{ maxWidth:"900px", margin:"2rem auto", padding:"0 1rem" }}>
      <ToastContainer />

      {/* Back button */}
      <button onClick={() => navigate("/properties")}
        style={{ marginBottom:"1.5rem", padding:"8px 16px", background:"#f3f4f6",
                 border:"none", borderRadius:"8px", cursor:"pointer", fontSize:"0.9rem" }}>
        ← Back to Properties
      </button>

      {/* Property Header */}
      <div style={{ background:"linear-gradient(135deg, #7c3aed, #4f46e5)",
                    borderRadius:"16px", padding:"2rem", color:"#fff", marginBottom:"1.5rem" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
          <div>
            <h1 style={{ margin:"0 0 0.5rem", fontSize:"1.8rem" }}>
              Property #{property.id}
            </h1>
            <p style={{ margin:0, fontSize:"1.2rem", opacity:0.9 }}>
              📍 {property.location}
            </p>
          </div>
          <span style={{
            background: property.isForSale ? "#10b981" : "#6b7280",
            padding:"8px 16px", borderRadius:"20px", fontWeight:"bold"
          }}>
            {property.isForSale ? "For Sale" : "Sold"}
          </span>
        </div>
      </div>

      {/* Property Details Grid */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1.5rem",
                    marginBottom:"1.5rem" }}>

        {/* Details Card */}
        <div style={{ background:"#fff", borderRadius:"12px", padding:"1.5rem",
                      boxShadow:"0 2px 8px rgba(0,0,0,0.08)", border:"1px solid #e5e7eb" }}>
          <h3 style={{ marginTop:0, color:"#374151" }}>Property Details</h3>
          {[
            { label:"📐 Area",          value:`${property.areaSqFt} sq ft` },
            { label:"💰 Price",         value:`${property.price} MATIC` },
            { label:"📅 Listed On",     value:property.listedAt },
            { label:"📊 Price per sqft",value:`${(parseFloat(property.price)/property.areaSqFt*1000).toFixed(4)} MATIC` },
          ].map(item => (
            <div key={item.label} style={{ display:"flex", justifyContent:"space-between",
                          padding:"10px 0", borderBottom:"1px solid #f3f4f6" }}>
              <span style={{ color:"#666" }}>{item.label}</span>
              <span style={{ fontWeight:"bold" }}>{item.value}</span>
            </div>
          ))}
        </div>

        {/* Ownership Card */}
        <div style={{ background:"#fff", borderRadius:"12px", padding:"1.5rem",
                      boxShadow:"0 2px 8px rgba(0,0,0,0.08)", border:"1px solid #e5e7eb" }}>
          <h3 style={{ marginTop:0, color:"#374151" }}>Ownership Info</h3>
          <div style={{ marginBottom:"1rem" }}>
            <p style={{ color:"#666", margin:"0 0 4px" }}>Current Owner</p>
            <p style={{ fontWeight:"bold", wordBreak:"break-all", margin:0,
                        background:"#f3f4f6", padding:"8px", borderRadius:"8px",
                        fontSize:"0.85rem" }}>
              {property.owner}
            </p>
          </div>
          <div style={{ marginBottom:"1rem" }}>
            <p style={{ color:"#666", margin:"0 0 4px" }}>IPFS Document Hash</p>
            <p style={{ fontWeight:"bold", wordBreak:"break-all", margin:0,
                        background:"#f3f4f6", padding:"8px", borderRadius:"8px",
                        fontSize:"0.85rem" }}>
              {property.ipfsHash}
            </p>
          </div>
          <div style={{ background:"#ede9fe", padding:"10px", borderRadius:"8px" }}>
            <p style={{ margin:0, fontSize:"0.85rem", color:"#7c3aed" }}>
              🔒 Ownership verified on blockchain. Tamper-proof and immutable.
            </p>
          </div>
        </div>
      </div>

      {/* Buy Button */}
      {property.isForSale && (
        <div style={{ background:"#fff", borderRadius:"12px", padding:"1.5rem",
                      boxShadow:"0 2px 8px rgba(0,0,0,0.08)", border:"1px solid #e5e7eb",
                      marginBottom:"1.5rem", textAlign:"center" }}>
          <h3 style={{ marginTop:0 }}>Purchase This Property</h3>
          <p style={{ color:"#666" }}>
            Price: <strong style={{ color:"#7c3aed", fontSize:"1.3rem" }}>
              {property.price} MATIC
            </strong>
          </p>
          <p style={{ color:"#666", fontSize:"0.9rem" }}>
            Funds are held in smart contract escrow until sale is complete. 2% platform fee applies.
          </p>
          <button
            onClick={handleBuy}
            disabled={buying}
            style={{ padding:"14px 40px", background: buying ? "#999" : "#059669",
                     color:"#fff", border:"none", borderRadius:"10px",
                     fontSize:"1.1rem", cursor:"pointer", fontWeight:"bold" }}>
            {buying ? "Processing..." : `Buy for ${property.price} MATIC`}
          </button>
        </div>
      )}

      {/* Ownership History / Ledger */}
      <div style={{ background:"#fff", borderRadius:"12px", padding:"1.5rem",
                    boxShadow:"0 2px 8px rgba(0,0,0,0.08)", border:"1px solid #e5e7eb" }}>
        <h3 style={{ marginTop:0, color:"#374151" }}>
          📜 Property History & Ownership Ledger
        </h3>
        <p style={{ color:"#666", fontSize:"0.9rem", marginBottom:"1.5rem" }}>
          All events are recorded on blockchain — immutable and tamper-proof.
        </p>

        {history.length === 0 ? (
          <p style={{ color:"#999", textAlign:"center", padding:"2rem" }}>
            No history events found for this property.
          </p>
        ) : (
          <div style={{ position:"relative" }}>
            {history.map((event, i) => (
              <div key={i} style={{ display:"flex", gap:"1rem", marginBottom:"1.5rem" }}>
                {/* Icon */}
                <div style={{ width:"40px", height:"40px", borderRadius:"50%",
                              background:event.color, display:"flex", alignItems:"center",
                              justifyContent:"center", fontSize:"1.2rem", flexShrink:0 }}>
                  {event.icon}
                </div>
                {/* Content */}
                <div style={{ flex:1, background:"#f9fafb", padding:"12px",
                              borderRadius:"8px", borderLeft:`3px solid ${event.color}` }}>
                  <div style={{ display:"flex", justifyContent:"space-between",
                                marginBottom:"4px" }}>
                    <span style={{ fontWeight:"bold", color:event.color }}>
                      {event.type}
                    </span>
                    <span style={{ fontSize:"0.8rem", color:"#999" }}>
                      Block #{event.block}
                    </span>
                  </div>
                  <p style={{ margin:0, color:"#374151", fontSize:"0.9rem" }}>
                    {event.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}