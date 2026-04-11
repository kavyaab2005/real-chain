import { useState, useEffect } from "react";
import { fetchAllProperties } from "../utils/api";
import { connectWallet, buyProperty } from "../utils/contracts";
import { toast, ToastContainer } from "react-toastify";
import { useNavigate } from "react-router-dom";
import "react-toastify/dist/ReactToastify.css";

export default function PropertyList() {
  const [properties,  setProperties]  = useState([]);
  const [filtered,    setFiltered]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [buying,      setBuying]      = useState(null);
  const [search,      setSearch]      = useState("");
  const [minPrice,    setMinPrice]    = useState("");
  const [maxPrice,    setMaxPrice]    = useState("");
  const [minArea,     setMinArea]     = useState("");
  const [sortBy,      setSortBy]      = useState("newest");
  const navigate = useNavigate();

  useEffect(() => { loadProperties(); }, []);

  useEffect(() => { applyFilters(); }, [properties, search, minPrice, maxPrice, minArea, sortBy]);

  const loadProperties = async () => {
    try {
      const props = await fetchAllProperties();
      setProperties(props);
    } catch (err) {
      toast.error("Error loading properties: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let result = [...properties];

    // Search by location
    if (search) {
      result = result.filter(p =>
        p.location.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Price filter
    if (minPrice) result = result.filter(p => parseFloat(p.price) >= parseFloat(minPrice));
    if (maxPrice) result = result.filter(p => parseFloat(p.price) <= parseFloat(maxPrice));

    // Area filter
    if (minArea) result = result.filter(p => p.areaSqFt >= parseInt(minArea));

    // Sort
    if (sortBy === "price-low")  result.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
    if (sortBy === "price-high") result.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
    if (sortBy === "area-high")  result.sort((a, b) => b.areaSqFt - a.areaSqFt);
    if (sortBy === "newest")     result.sort((a, b) => b.id - a.id);

    setFiltered(result);
  };

  const clearFilters = () => {
    setSearch("");
    setMinPrice("");
    setMaxPrice("");
    setMinArea("");
    setSortBy("newest");
  };

  const handleBuy = async (property) => {
    setBuying(property.id);
    try {
      const { signer } = await connectWallet();
      await buyProperty(signer, property.id, property.price);
      toast.success("Purchase initiated! Property is in escrow.");
      loadProperties();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBuying(null);
    }
  };

  if (loading) return (
    <div style={{ textAlign:"center", padding:"4rem" }}>
      <p style={{ fontSize:"1.2rem" }}>Loading properties from blockchain...</p>
    </div>
  );

  return (
    <div style={{ padding:"2rem", maxWidth:"1200px", margin:"0 auto" }}>
      <ToastContainer />
      <h2 style={{ marginBottom:"1.5rem" }}>🏠 Properties For Sale</h2>

      {/* Search & Filter Bar */}
      <div style={{
        background:"#f9fafb", padding:"1.5rem", borderRadius:"12px",
        marginBottom:"2rem", border:"1px solid #e5e7eb"
      }}>
        <div style={{ display:"flex", gap:"1rem", flexWrap:"wrap", marginBottom:"1rem" }}>
          {/* Search */}
          <input
            placeholder="🔍 Search by location..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ flex:2, minWidth:"200px", padding:"10px 14px",
                     borderRadius:"8px", border:"1px solid #ddd", fontSize:"1rem" }}
          />
          {/* Sort */}
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            style={{ flex:1, minWidth:"150px", padding:"10px 14px",
                     borderRadius:"8px", border:"1px solid #ddd", fontSize:"1rem" }}
          >
            <option value="newest">Newest First</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="area-high">Area: Largest First</option>
          </select>
        </div>

        <div style={{ display:"flex", gap:"1rem", flexWrap:"wrap", alignItems:"center" }}>
          <input
            placeholder="Min Price (MATIC)"
            type="number"
            value={minPrice}
            onChange={e => setMinPrice(e.target.value)}
            style={{ flex:1, minWidth:"140px", padding:"10px",
                     borderRadius:"8px", border:"1px solid #ddd" }}
          />
          <input
            placeholder="Max Price (MATIC)"
            type="number"
            value={maxPrice}
            onChange={e => setMaxPrice(e.target.value)}
            style={{ flex:1, minWidth:"140px", padding:"10px",
                     borderRadius:"8px", border:"1px solid #ddd" }}
          />
          <input
            placeholder="Min Area (sq ft)"
            type="number"
            value={minArea}
            onChange={e => setMinArea(e.target.value)}
            style={{ flex:1, minWidth:"140px", padding:"10px",
                     borderRadius:"8px", border:"1px solid #ddd" }}
          />
          <button
            onClick={clearFilters}
            style={{ padding:"10px 20px", background:"#ef4444", color:"#fff",
                     border:"none", borderRadius:"8px", cursor:"pointer" }}
          >
            Clear Filters
          </button>
        </div>

        {/* Results count */}
        <p style={{ marginTop:"1rem", color:"#666", fontSize:"0.9rem" }}>
          Showing <strong>{filtered.length}</strong> of <strong>{properties.length}</strong> properties
        </p>
      </div>

      {/* Property Cards */}
      {filtered.length === 0 ? (
        <div style={{ textAlign:"center", padding:"4rem",
                      background:"#f3f4f6", borderRadius:"12px" }}>
          <p style={{ fontSize:"1.2rem", color:"#666" }}>No properties match your filters.</p>
          <button onClick={clearFilters}
            style={{ marginTop:"1rem", padding:"10px 20px", background:"#7c3aed",
                     color:"#fff", border:"none", borderRadius:"8px", cursor:"pointer" }}>
            Clear Filters
          </button>
        </div>
      ) : (
        <div style={{
          display:"grid",
          gridTemplateColumns:"repeat(auto-fill, minmax(300px, 1fr))",
          gap:"1.5rem"
        }}>
          {filtered.map((prop) => (
            <div key={prop.id} style={{
              background:"#fff", borderRadius:"12px",
              boxShadow:"0 2px 8px rgba(0,0,0,0.1)",
              border:"1px solid #e5e7eb", overflow:"hidden",
              transition:"transform 0.2s",
            }}>
              {/* Card Header */}
              <div style={{ background:"#7c3aed", padding:"1rem",
                            display:"flex", justifyContent:"space-between",
                            alignItems:"center" }}>
                <h3 style={{ color:"#fff", margin:0, fontSize:"1rem" }}>
                  Property #{prop.id}
                </h3>
                <span style={{
                  background: prop.isForSale ? "#10b981" : "#6b7280",
                  color:"#fff", padding:"4px 10px", borderRadius:"20px", fontSize:"0.8rem"
                }}>
                  {prop.isForSale ? "For Sale" : "Sold"}
                </span>
              </div>

              {/* Card Body */}
              <div style={{ padding:"1.5rem" }}>
                <p style={{ fontWeight:"bold", fontSize:"1.1rem", marginBottom:"0.5rem" }}>
                  📍 {prop.location}
                </p>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.5rem",
                              marginBottom:"1rem" }}>
                  <div style={{ background:"#f3f4f6", padding:"8px", borderRadius:"8px" }}>
                    <p style={{ margin:0, fontSize:"0.75rem", color:"#666" }}>Area</p>
                    <p style={{ margin:0, fontWeight:"bold" }}>{prop.areaSqFt} sq ft</p>
                  </div>
                  <div style={{ background:"#f3f4f6", padding:"8px", borderRadius:"8px" }}>
                    <p style={{ margin:0, fontSize:"0.75rem", color:"#666" }}>Price</p>
                    <p style={{ margin:0, fontWeight:"bold", color:"#7c3aed" }}>
                      {prop.price} MATIC
                    </p>
                  </div>
                  <div style={{ background:"#f3f4f6", padding:"8px", borderRadius:"8px" }}>
                    <p style={{ margin:0, fontSize:"0.75rem", color:"#666" }}>Listed</p>
                    <p style={{ margin:0, fontWeight:"bold" }}>{prop.listedAt}</p>
                  </div>
                  <div style={{ background:"#f3f4f6", padding:"8px", borderRadius:"8px" }}>
                    <p style={{ margin:0, fontSize:"0.75rem", color:"#666" }}>Price/sqft</p>
                    <p style={{ margin:0, fontWeight:"bold" }}>
                      {(parseFloat(prop.price) / prop.areaSqFt * 1000).toFixed(4)} MATIC
                    </p>
                  </div>
                </div>

                <p style={{ fontSize:"0.8rem", color:"#999", marginBottom:"1rem",
                            wordBreak:"break-all" }}>
                  Owner: {prop.owner.slice(0,6)}...{prop.owner.slice(-4)}
                </p>

                <div style={{ display:"flex", gap:"0.5rem" }}>
                  <button
                    onClick={() => navigate(`/property/${prop.id}`)}
                    style={{ flex:1, padding:"10px", background:"#f3f4f6",
                             color:"#374151", border:"none", borderRadius:"8px",
                             cursor:"pointer", fontWeight:"bold" }}>
                    View Details
                  </button>
                  {prop.isForSale && (
                    <button
                      onClick={() => handleBuy(prop)}
                      disabled={buying === prop.id}
                      style={{ flex:1, padding:"10px",
                               background: buying === prop.id ? "#999" : "#059669",
                               color:"#fff", border:"none", borderRadius:"8px",
                               cursor:"pointer", fontWeight:"bold" }}>
                      {buying === prop.id ? "Processing..." : "Buy"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}