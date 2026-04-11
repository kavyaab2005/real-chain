import { useState, useEffect } from "react";
import { Line, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, Title, Tooltip, Legend,
} from "chart.js";
import { fetchAnalytics, fetchAllProperties, socket } from "../utils/api";

ChartJS.register(
  CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, Title, Tooltip, Legend
);

export default function Dashboard() {
  const [analytics,  setAnalytics]  = useState(null);
  const [properties, setProperties] = useState([]);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    loadData();

    // Real-time updates when new listings come in
    socket.on("newListing", () => loadData());
    socket.on("saleMade",   () => loadData());

    return () => {
      socket.off("newListing");
      socket.off("saleMade");
    };
  }, []);

  const loadData = async () => {
    try {
      const [analyticsData, propsData] = await Promise.all([
        fetchAnalytics(),
        fetchAllProperties(),
      ]);
      setAnalytics(analyticsData);
      setProperties(propsData);
    } catch (err) {
      console.error("Error loading dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div style={{ textAlign:"center", padding:"4rem" }}>
      <p>Loading analytics from blockchain...</p>
    </div>
  );

  const lineData = {
    labels: properties.slice(0, 20).map(p => `#${p.id}`),
    datasets: [{
      label:           "Listed Price (MATIC)",
      data:            properties.slice(0, 20).map(p => parseFloat(p.price)),
      borderColor:     "#7c3aed",
      backgroundColor: "rgba(124,58,237,0.1)",
      tension:         0.4,
    }],
  };

  const cityData = analytics?.cityAvgPrices?.slice(0, 8) || [];
  const barData = {
    labels:   cityData.map(c => c.city),
    datasets: [{
      label:           "Avg Price (MATIC)",
      data:            cityData.map(c => parseFloat(c.avgPrice)),
      backgroundColor: "rgba(124,58,237,0.7)",
    }],
  };

  return (
    <div style={{ padding:"2rem", maxWidth:"1000px", margin:"0 auto" }}>
      <h2 style={{ marginBottom:"1.5rem" }}>📊 Analytics Dashboard</h2>

      {/* Stats */}
      <div style={{ display:"flex", gap:"1rem", marginBottom:"2rem", flexWrap:"wrap" }}>
        {[
          { label:"Total Properties",    value: analytics?.totalProperties || 0, color:"#7c3aed" },
          { label:"For Sale",            value: analytics?.forSale          || 0, color:"#059669" },
          { label:"Total Sales",         value: analytics?.totalSales        || 0, color:"#2563eb" },
          { label:"Total Value (MATIC)", value: analytics?.totalValue        || "0.00", color:"#d97706" },
        ].map(stat => (
          <div key={stat.label} style={{
            flex:1, minWidth:"150px", padding:"1.5rem",
            background:"#f9fafb", borderRadius:"12px",
            borderLeft:`4px solid ${stat.color}`
          }}>
            <p style={{ color:"#666", margin:0, fontSize:"0.9rem" }}>{stat.label}</p>
            <h3 style={{ color:stat.color, margin:"0.5rem 0 0", fontSize:"1.8rem" }}>
              {stat.value}
            </h3>
          </div>
        ))}
      </div>

      {/* Line Chart */}
      <div style={{ background:"#fff", padding:"1.5rem", borderRadius:"12px",
                    marginBottom:"2rem", boxShadow:"0 2px 8px rgba(0,0,0,0.05)" }}>
        <h3 style={{ marginBottom:"1rem" }}>Price Trend (First 20 Properties)</h3>
        {properties.length > 0
          ? <Line data={lineData} />
          : <p style={{ color:"#999", textAlign:"center", padding:"2rem" }}>
              No data yet.
            </p>
        }
      </div>

      {/* Bar Chart - City Average */}
      <div style={{ background:"#fff", padding:"1.5rem", borderRadius:"12px",
                    marginBottom:"2rem", boxShadow:"0 2px 8px rgba(0,0,0,0.05)" }}>
        <h3 style={{ marginBottom:"1rem" }}>Average Price by City</h3>
        {cityData.length > 0
          ? <Bar data={barData} />
          : <p style={{ color:"#999", textAlign:"center", padding:"2rem" }}>
              No data yet.
            </p>
        }
      </div>

      {/* City Table */}
      {cityData.length > 0 && (
        <div style={{ background:"#fff", padding:"1.5rem", borderRadius:"12px",
                      boxShadow:"0 2px 8px rgba(0,0,0,0.05)" }}>
          <h3 style={{ marginBottom:"1rem" }}>City-wise Analysis</h3>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead>
              <tr style={{ background:"#f3f4f6" }}>
                <th style={{ padding:"10px", textAlign:"left" }}>City</th>
                <th style={{ padding:"10px", textAlign:"left" }}>Properties</th>
                <th style={{ padding:"10px", textAlign:"left" }}>Avg Price (MATIC)</th>
              </tr>
            </thead>
            <tbody>
              {cityData.map((city, i) => (
                <tr key={i} style={{ borderBottom:"1px solid #e5e7eb" }}>
                  <td style={{ padding:"10px" }}>{city.city}</td>
                  <td style={{ padding:"10px" }}>{city.count}</td>
                  <td style={{ padding:"10px", color:"#7c3aed", fontWeight:"bold" }}>
                    {city.avgPrice}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}