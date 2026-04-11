import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { connectWallet } from "../utils/contracts";
import { toast, ToastContainer } from "react-toastify";
import addresses         from "../contracts/addresses.json";
import FractionalABI     from "../contracts/FractionalOwnership.json";
import "react-toastify/dist/ReactToastify.css";

export default function FractionalOwnership() {
  const [properties, setProperties] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [buying,     setBuying]     = useState(null);
  const [showForm,   setShowForm]   = useState(false);
  const [form, setForm] = useState({
    location: "", totalShares: "", pricePerShare: ""
  });

  useEffect(() => { loadProperties(); }, []);

  const loadProperties = async () => {
    try {
      const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
      const contract = new ethers.Contract(
        addresses.fractional, FractionalABI.abi, provider
      );
      const props = await contract.getAllFractionalProperties();
      const mapped = await Promise.all(props.map(async (p) => {
        const available = await contract.getAvailableShares(p.propertyId);
        return {
          id:            Number(p.propertyId),
          location:      p.location,
          totalShares:   Number(p.totalShares),
          pricePerShare: ethers.formatEther(p.pricePerShare),
          creator:       p.creator,
          isActive:      p.isActive,
          availShares:   Number(available),
          soldShares:    Number(p.totalShares) - Number(available),
        };
      }));
      setProperties(mapped);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTokenize = async (e) => {
    e.preventDefault();
    try {
      const { signer } = await connectWallet();
      const contract = new ethers.Contract(
        addresses.fractional, FractionalABI.abi, signer
      );
      const tx = await contract.tokenizeProperty(
        form.location,
        parseInt(form.totalShares),
        parseInt(form.pricePerShare)
      );
      await tx.wait();
      toast.success("Property tokenized successfully!");
      setShowForm(false);
      setForm({ location: "", totalShares: "", pricePerShare: "" });
      loadProperties();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleBuyShares = async (propertyId, pricePerShare) => {
    const shares = prompt("How many shares do you want to buy?");
    if (!shares || isNaN(shares) || parseInt(shares) <= 0) return;

    setBuying(propertyId);
    try {
      const { signer } = await connectWallet();
      const contract = new ethers.Contract(
        addresses.fractional, FractionalABI.abi, signer
      );
      const totalCost = parseFloat(pricePerShare) * parseInt(shares);
      const tx = await contract.buyShares(propertyId, parseInt(shares), {
        value: ethers.parseEther(totalCost.toString()),
      });
      await tx.wait();
      toast.success(`Successfully bought ${shares} shares!`);
      loadProperties();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBuying(null);
    }
  };

  return (
    <div style={{ padding:"2rem", maxWidth:"1100px", margin:"0 auto" }}>
      <ToastContainer />

      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between",
                    alignItems:"center", marginBottom:"2rem", flexWrap:"wrap", gap:"1rem" }}>
        <div>
          <h2 style={{ margin:0 }}>🔢 Fractional Ownership</h2>
          <p style={{ color:"#666", margin:"0.5rem 0 0" }}>
            Buy shares of high-value properties and become a fractional owner
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{ padding:"12px 24px", background:"#7c3aed", color:"#fff",
                   border:"none", borderRadius:"8px", cursor:"pointer",
                   fontWeight:"bold", fontSize:"1rem" }}>
          + Tokenize Property
        </button>
      </div>

      {/* How it works */}
      <div style={{ display:"flex", gap:"1rem", marginBottom:"2rem", flexWrap:"wrap" }}>
        {[
          { icon:"🏠", title:"Property Listed",    desc:"Owner tokenizes property into shares" },
          { icon:"💰", title:"Buy Shares",          desc:"Investors buy fractional shares" },
          { icon:"📈", title:"Earn Returns",        desc:"Get proportional returns on investment" },
          { icon:"🔄", title:"Trade Anytime",       desc:"Transfer shares to other investors" },
        ].map(item => (
          <div key={item.title} style={{ flex:1, minWidth:"180px", background:"#f9fafb",
                        padding:"1rem", borderRadius:"12px", textAlign:"center",
                        border:"1px solid #e5e7eb" }}>
            <div style={{ fontSize:"2rem" }}>{item.icon}</div>
            <h4 style={{ margin:"0.5rem 0 0.25rem" }}>{item.title}</h4>
            <p style={{ color:"#666", fontSize:"0.85rem", margin:0 }}>{item.desc}</p>
          </div>
        ))}
      </div>

      {/* Tokenize Form */}
      {showForm && (
        <div style={{ background:"#fff", padding:"2rem", borderRadius:"12px",
                      boxShadow:"0 2px 8px rgba(0,0,0,0.1)", marginBottom:"2rem",
                      border:"1px solid #e5e7eb" }}>
          <h3 style={{ marginTop:0 }}>Tokenize Your Property</h3>
          <div>
            <input
              placeholder="Property location (e.g. Bandra West, Mumbai)"
              value={form.location}
              onChange={e => setForm({...form, location: e.target.value})}
              style={{ display:"block", width:"100%", padding:"12px",
                       borderRadius:"8px", border:"1px solid #ddd",
                       fontSize:"1rem", marginBottom:"1rem" }}
            />
            <div style={{ display:"flex", gap:"1rem", marginBottom:"1rem" }}>
              <input
                placeholder="Total shares (e.g. 1000)"
                type="number"
                value={form.totalShares}
                onChange={e => setForm({...form, totalShares: e.target.value})}
                style={{ flex:1, padding:"12px", borderRadius:"8px",
                         border:"1px solid #ddd", fontSize:"1rem" }}
              />
              <input
                placeholder="Price per share in MATIC (e.g. 1)"
                type="number"
                value={form.pricePerShare}
                onChange={e => setForm({...form, pricePerShare: e.target.value})}
                style={{ flex:1, padding:"12px", borderRadius:"8px",
                         border:"1px solid #ddd", fontSize:"1rem" }}
              />
            </div>
            {form.totalShares && form.pricePerShare && (
              <div style={{ background:"#ede9fe", padding:"12px",
                            borderRadius:"8px", marginBottom:"1rem" }}>
                <p style={{ margin:0, color:"#7c3aed" }}>
                  Total property value: <strong>
                    {parseInt(form.totalShares) * parseInt(form.pricePerShare)} MATIC
                  </strong>
                </p>
              </div>
            )}
            <div style={{ display:"flex", gap:"1rem" }}>
              <button
                onClick={handleTokenize}
                style={{ flex:1, padding:"12px", background:"#7c3aed",
                         color:"#fff", border:"none", borderRadius:"8px",
                         cursor:"pointer", fontWeight:"bold" }}>
                Tokenize Property
              </button>
              <button
                onClick={() => setShowForm(false)}
                style={{ flex:1, padding:"12px", background:"#f3f4f6",
                         color:"#374151", border:"none", borderRadius:"8px",
                         cursor:"pointer" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Properties List */}
      {loading ? (
        <p style={{ textAlign:"center", padding:"3rem", color:"#666" }}>
          Loading fractional properties...
        </p>
      ) : properties.length === 0 ? (
        <div style={{ textAlign:"center", padding:"4rem", background:"#f9fafb",
                      borderRadius:"12px", border:"1px solid #e5e7eb" }}>
          <p style={{ fontSize:"3rem" }}>🏘️</p>
          <p style={{ fontSize:"1.2rem", color:"#666" }}>
            No fractional properties yet.
          </p>
          <p style={{ color:"#999" }}>
            Be the first to tokenize a property!
          </p>
        </div>
      ) : (
        <div style={{ display:"grid",
                      gridTemplateColumns:"repeat(auto-fill, minmax(320px, 1fr))",
                      gap:"1.5rem" }}>
          {properties.map(prop => (
            <div key={prop.id} style={{ background:"#fff", borderRadius:"12px",
                          boxShadow:"0 2px 8px rgba(0,0,0,0.08)",
                          border:"1px solid #e5e7eb", overflow:"hidden" }}>
              {/* Header */}
              <div style={{ background:"linear-gradient(135deg, #7c3aed, #4f46e5)",
                            padding:"1.25rem", color:"#fff" }}>
                <h3 style={{ margin:"0 0 0.25rem" }}>Property #{prop.id}</h3>
                <p style={{ margin:0, opacity:0.9, fontSize:"0.9rem" }}>
                  📍 {prop.location}
                </p>
              </div>

              <div style={{ padding:"1.5rem" }}>
                {/* Share Progress Bar */}
                <div style={{ marginBottom:"1rem" }}>
                  <div style={{ display:"flex", justifyContent:"space-between",
                                marginBottom:"6px", fontSize:"0.85rem" }}>
                    <span style={{ color:"#666" }}>Shares sold</span>
                    <span style={{ fontWeight:"bold" }}>
                      {prop.soldShares} / {prop.totalShares}
                    </span>
                  </div>
                  <div style={{ background:"#e5e7eb", borderRadius:"99px", height:"8px" }}>
                    <div style={{
                      width:`${(prop.soldShares/prop.totalShares)*100}%`,
                      background:"#7c3aed", borderRadius:"99px", height:"8px",
                      transition:"width 0.3s"
                    }}/>
                  </div>
                  <p style={{ fontSize:"0.8rem", color:"#666", margin:"4px 0 0" }}>
                    {((prop.soldShares/prop.totalShares)*100).toFixed(1)}% sold
                  </p>
                </div>

                {/* Stats */}
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr",
                              gap:"0.75rem", marginBottom:"1rem" }}>
                  {[
                    { label:"Price/share",     value:`${prop.pricePerShare} MATIC` },
                    { label:"Available shares", value:prop.availShares },
                    { label:"Total value",      value:`${(prop.totalShares * parseFloat(prop.pricePerShare)).toFixed(0)} MATIC` },
                    { label:"Min investment",   value:`${prop.pricePerShare} MATIC` },
                  ].map(stat => (
                    <div key={stat.label} style={{ background:"#f9fafb", padding:"8px",
                                  borderRadius:"8px" }}>
                      <p style={{ margin:0, fontSize:"0.75rem", color:"#666" }}>
                        {stat.label}
                      </p>
                      <p style={{ margin:0, fontWeight:"bold", fontSize:"0.9rem" }}>
                        {stat.value}
                      </p>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => handleBuyShares(prop.id, prop.pricePerShare)}
                  disabled={buying === prop.id || prop.availShares === 0}
                  style={{ width:"100%", padding:"12px",
                           background: prop.availShares === 0 ? "#9ca3af" : "#7c3aed",
                           color:"#fff", border:"none", borderRadius:"8px",
                           cursor: prop.availShares === 0 ? "not-allowed" : "pointer",
                           fontWeight:"bold", fontSize:"1rem" }}>
                  {buying === prop.id ? "Processing..." :
                   prop.availShares === 0 ? "Fully Sold" : "Buy Shares"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}