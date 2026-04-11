import { useState } from "react";
import { connectWallet, listProperty } from "../utils/contracts";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function ListProperty() {
  const [form, setForm] = useState({
    location: "", area: "", price: "", description: ""
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { signer } = await connectWallet();
      await listProperty(signer, {
        location:   form.location,
        area:       parseInt(form.area),
        priceEther: form.price,
        ipfsHash:   "QmTestHash123",
      });
      toast.success("Property listed successfully on blockchain!");
      setForm({ location: "", area: "", price: "", description: "" });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 500, margin: "2rem auto", padding: "1rem" }}>
      <ToastContainer />
      <h2 style={{ marginBottom: "1.5rem" }}>List Your Property</h2>
      <div onSubmit={handleSubmit}>
        <input
          placeholder="Location (e.g. Koramangala, Bangalore)"
          value={form.location}
          onChange={e => setForm({...form, location: e.target.value})}
          style={{ display:"block", width:"100%", margin:"8px 0",
                   padding:"12px", borderRadius:"8px",
                   border:"1px solid #ddd", fontSize:"1rem" }}
        />
        <input
          placeholder="Area in sq ft"
          type="number"
          value={form.area}
          onChange={e => setForm({...form, area: e.target.value})}
          style={{ display:"block", width:"100%", margin:"8px 0",
                   padding:"12px", borderRadius:"8px",
                   border:"1px solid #ddd", fontSize:"1rem" }}
        />
        <input
          placeholder="Price in MATIC (e.g. 10)"
          type="number"
          step="0.01"
          value={form.price}
          onChange={e => setForm({...form, price: e.target.value})}
          style={{ display:"block", width:"100%", margin:"8px 0",
                   padding:"12px", borderRadius:"8px",
                   border:"1px solid #ddd", fontSize:"1rem" }}
        />
        <textarea
          placeholder="Property description"
          value={form.description}
          onChange={e => setForm({...form, description: e.target.value})}
          style={{ display:"block", width:"100%", margin:"8px 0",
                   padding:"12px", borderRadius:"8px",
                   border:"1px solid #ddd", fontSize:"1rem", height:"100px" }}
        />
        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{ width:"100%", padding:"14px",
                   background: loading ? "#999" : "#7c3aed",
                   color:"#fff", border:"none", borderRadius:"8px",
                   fontSize:"1rem", cursor:"pointer", marginTop:"8px" }}>
          {loading ? "Listing on blockchain..." : "List Property"}
        </button>
      </div>
    </div>
  );
}