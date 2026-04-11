import Login    from "./pages/Login";
import Register from "./pages/Register";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import Home                from "./pages/Home";
import PropertyList        from "./pages/PropertyList";
import ListProperty        from "./pages/ListProperty";
import Dashboard           from "./pages/Dashboard";
import PropertyDetail      from "./pages/PropertyDetail";
import FractionalOwnership from "./pages/FractionalOwnership";
import MyProfile           from "./pages/MyProfile";
import { connectWallet }   from "./utils/contracts";
import { socket }          from "./utils/api";
import "react-toastify/dist/ReactToastify.css";

export default function App() {
  const [account,       setAccount]       = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showNotifs,    setShowNotifs]    = useState(false);

  useEffect(() => {
    socket.on("newListing", (data) => {
      toast.info(`🏠 ${data.message}`, { autoClose: 5000 });
      setNotifications(prev => [data, ...prev].slice(0, 20));
    });
    socket.on("saleMade", (data) => {
      toast.success(`✅ ${data.message}`, { autoClose: 5000 });
      setNotifications(prev => [data, ...prev].slice(0, 20));
    });
    socket.on("saleInitiated", (data) => {
      toast.warning(`⏳ ${data.message}`, { autoClose: 5000 });
      setNotifications(prev => [data, ...prev].slice(0, 20));
    });
    socket.on("sharesPurchased", (data) => {
      toast.info(`🔢 ${data.message}`, { autoClose: 5000 });
      setNotifications(prev => [data, ...prev].slice(0, 20));
    });
    socket.on("recentNotifications", (data) => {
      setNotifications(data);
    });
    return () => {
      socket.off("newListing");
      socket.off("saleMade");
      socket.off("saleInitiated");
      socket.off("sharesPurchased");
      socket.off("recentNotifications");
    };
  }, []);

  const handleConnect = async () => {
    try {
      const { address } = await connectWallet();
      setAccount(address);
      toast.success("Wallet connected!");
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <BrowserRouter>
      <ToastContainer position="top-right" />

      {/* Navbar */}
      <nav style={{
        display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"1rem 2rem", background:"#7c3aed", color:"#fff",
        boxShadow:"0 2px 8px rgba(0,0,0,0.2)", flexWrap:"wrap", gap:"1rem",
        position:"sticky", top:0, zIndex:100
      }}>
        <Link to="/" style={{ color:"#fff", textDecoration:"none",
                               fontSize:"1.3rem", fontWeight:"bold" }}>
          🏠 RealChain
        </Link>

        <div style={{ display:"flex", gap:"1.2rem", alignItems:"center", flexWrap:"wrap" }}>
          <Link to="/properties" style={{ color:"#fff", textDecoration:"none" }}>
            Properties
          </Link>
          <Link to="/fractional" style={{ color:"#fff", textDecoration:"none" }}>
            Fractional
          </Link>
          <Link to="/list" style={{ color:"#fff", textDecoration:"none" }}>
            List Property
          </Link>
          <Link to="/dashboard" style={{ color:"#fff", textDecoration:"none" }}>
            Dashboard
          </Link>
          <Link to="/profile" style={{ color:"#fff", textDecoration:"none" }}>
            My Profile
          </Link>
          <Link to="/login"    style={{ color:"#fff", textDecoration:"none" }}>
            Login
          </Link>
          <Link to="/register" style={{ color:"#fff", textDecoration:"none" }}>
            Register
          </Link>

          {/* Notifications Bell */}
          <div style={{ position:"relative" }}>
            <button
              onClick={() => setShowNotifs(!showNotifs)}
              style={{ background:"rgba(255,255,255,0.2)", border:"none",
                       color:"#fff", padding:"6px 12px", borderRadius:"8px",
                       cursor:"pointer", fontSize:"1rem" }}>
              🔔
              {notifications.length > 0 && (
                <span style={{ background:"#ef4444", borderRadius:"50%",
                               padding:"2px 6px", fontSize:"0.7rem", marginLeft:"4px" }}>
                  {notifications.length}
                </span>
              )}
            </button>

            {/* Dropdown */}
            {showNotifs && (
              <div style={{ position:"absolute", right:0, top:"110%",
                            background:"#fff", borderRadius:"12px", width:"300px",
                            boxShadow:"0 8px 24px rgba(0,0,0,0.15)", zIndex:200,
                            maxHeight:"400px", overflowY:"auto" }}>
                <div style={{ padding:"1rem", borderBottom:"1px solid #e5e7eb",
                              display:"flex", justifyContent:"space-between" }}>
                  <h4 style={{ margin:0, color:"#374151" }}>🔴 Live Notifications</h4>
                  <button onClick={() => setNotifications([])}
                    style={{ background:"none", border:"none", color:"#999",
                             cursor:"pointer", fontSize:"0.8rem" }}>
                    Clear
                  </button>
                </div>
                {notifications.length === 0 ? (
                  <p style={{ padding:"1rem", color:"#666", textAlign:"center" }}>
                    No notifications yet
                  </p>
                ) : (
                  notifications.map((n, i) => (
                    <div key={i} style={{ padding:"0.75rem 1rem",
                                          borderBottom:"1px solid #f3f4f6" }}>
                      <p style={{ margin:0, fontSize:"0.85rem", color:"#374151" }}>
                        {n.message}
                      </p>
                      <p style={{ margin:"4px 0 0", fontSize:"0.75rem", color:"#999" }}>
                        {new Date(n.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Connect Wallet */}
          <button onClick={handleConnect}
            style={{ padding:"8px 16px", background:"#fff", color:"#7c3aed",
                     border:"none", borderRadius:"8px", cursor:"pointer",
                     fontWeight:"bold" }}>
            {account
              ? `${account.slice(0,6)}...${account.slice(-4)}`
              : "Connect Wallet"}
          </button>
        </div>
      </nav>

      {/* Pages */}
      <Routes>
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/"             element={<Home />} />
        <Route path="/properties"   element={<PropertyList />} />
        <Route path="/property/:id" element={<PropertyDetail />} />
        <Route path="/fractional"   element={<FractionalOwnership />} />
        <Route path="/list"         element={<ListProperty />} />
        <Route path="/dashboard"    element={<Dashboard />} />
        <Route path="/profile"      element={<MyProfile />} />
      </Routes>
    </BrowserRouter>
  );
}