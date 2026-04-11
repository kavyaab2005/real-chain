import { useState, useEffect } from "react";
import { connectWallet } from "../utils/contracts";
import { fetchUserProperties, fetchTransactions, socket } from "../utils/api";
import { toast, ToastContainer } from "react-toastify";
import { useNavigate } from "react-router-dom";
import "react-toastify/dist/ReactToastify.css";

export default function MyProfile() {
  const navigate   = useNavigate();
  const [user,         setUser]         = useState(null);
  const [account,      setAccount]      = useState(null);
  const [properties,   setProperties]   = useState([]);
  const [transactions, setTx]           = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [activeTab,    setActiveTab]    = useState("properties");
  const [editMode,     setEditMode]     = useState(false);
  const [photoFile,    setPhotoFile]    = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [editForm,     setEditForm]     = useState({
    name:"", bio:"", phone:"", city:"", role:"both"
  });
  const [pwForm, setPwForm] = useState({
    currentPassword:"", newPassword:"", confirmPassword:""
  });

  useEffect(() => {
    const stored = localStorage.getItem("user");
    const token  = localStorage.getItem("token");
    if (stored && token) {
      const u = JSON.parse(stored);
      setUser(u);
      setEditForm({ name:u.name||"", bio:u.bio||"",
                    phone:u.phone||"", city:u.city||"", role:u.role||"both" });
      if (u.walletAddress) {
        setAccount(u.walletAddress);
        loadBlockchainData(u.walletAddress);
      }
    }

    socket.on("newListing",  d => toast.info(`🏠 ${d.message}`));
    socket.on("saleMade",    d => toast.success(`✅ ${d.message}`));
    return () => { socket.off("newListing"); socket.off("saleMade"); };
  }, []);

  const loadBlockchainData = async (address) => {
    try {
      const [props, txs] = await Promise.all([
        fetchUserProperties(address),
        fetchTransactions(),
      ]);
      setProperties(props);
      const myTxs = txs.filter(tx =>
        tx.from?.toLowerCase() === address.toLowerCase() ||
        tx.to?.toLowerCase()   === address.toLowerCase()
      );
      setTx(myTxs);
    } catch (err) {
      console.error(err);
    }
  };

  const handleConnectWallet = async () => {
    try {
      const { address } = await connectWallet();
      setAccount(address);
      loadBlockchainData(address);

      // Link wallet to account
      const token = localStorage.getItem("token");
      if (token) {
        await fetch("http://localhost:5000/api/auth/link-wallet", {
          method:  "PUT",
          headers: { "Content-Type":"application/json",
                     "Authorization":`Bearer ${token}` },
          body: JSON.stringify({ walletAddress: address }),
        });
      }
      toast.success("Wallet connected!");
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleUpdateProfile = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const form  = new FormData();
      form.append("name",  editForm.name);
      form.append("bio",   editForm.bio);
      form.append("phone", editForm.phone);
      form.append("city",  editForm.city);
      form.append("role",  editForm.role);
      if (photoFile) form.append("profilePhoto", photoFile);

      const res  = await fetch("http://localhost:5000/api/auth/update-profile", {
        method:  "PUT",
        headers: { "Authorization":`Bearer ${token}` },
        body:    form,
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setUser(data.user);
      localStorage.setItem("user", JSON.stringify(data.user));
      setEditMode(false);
      toast.success("Profile updated successfully!");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      return toast.error("Passwords do not match!");
    }
    try {
      const token = localStorage.getItem("token");
      const res   = await fetch("http://localhost:5000/api/auth/change-password", {
        method:  "PUT",
        headers: { "Content-Type":"application/json",
                   "Authorization":`Bearer ${token}` },
        body: JSON.stringify({
          currentPassword: pwForm.currentPassword,
          newPassword:     pwForm.newPassword,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast.success("Password changed!");
      setPwForm({ currentPassword:"", newPassword:"", confirmPassword:"" });
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    toast.success("Logged out!");
    setTimeout(() => navigate("/login"), 1000);
  };

  if (!user) return (
    <div style={{ maxWidth:"500px", margin:"4rem auto", padding:"2rem",
                  textAlign:"center" }}>
      <ToastContainer />
      <div style={{ fontSize:"4rem" }}>👤</div>
      <h2>Please login to view your profile</h2>
      <div style={{ display:"flex", gap:"1rem", justifyContent:"center" }}>
        <button onClick={() => navigate("/login")}
          style={{ padding:"12px 32px", background:"#7c3aed", color:"#fff",
                   border:"none", borderRadius:"8px", cursor:"pointer",
                   fontWeight:"bold", fontSize:"1rem" }}>
          Login
        </button>
        <button onClick={() => navigate("/register")}
          style={{ padding:"12px 32px", background:"#059669", color:"#fff",
                   border:"none", borderRadius:"8px", cursor:"pointer",
                   fontWeight:"bold", fontSize:"1rem" }}>
          Register
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth:"900px", margin:"2rem auto", padding:"0 1rem" }}>
      <ToastContainer />

      {/* Profile Header */}
      <div style={{ background:"linear-gradient(135deg, #7c3aed, #4f46e5)",
                    borderRadius:"16px", padding:"2rem", color:"#fff",
                    marginBottom:"2rem" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"1.5rem",
                      flexWrap:"wrap" }}>
          {/* Profile Photo */}
          <div style={{ position:"relative" }}>
            <div style={{ width:"80px", height:"80px", borderRadius:"50%",
                          background:"rgba(255,255,255,0.2)",
                          display:"flex", alignItems:"center",
                          justifyContent:"center", fontSize:"2.5rem",
                          overflow:"hidden" }}>
              {photoPreview || user.profilePhoto ? (
                <img src={photoPreview || `http://localhost:5000${user.profilePhoto}`}
                  alt="profile"
                  style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
              ) : "👤"}
            </div>
            {editMode && (
              <label style={{ position:"absolute", bottom:0, right:0,
                              background:"#fff", borderRadius:"50%",
                              width:"24px", height:"24px", display:"flex",
                              alignItems:"center", justifyContent:"center",
                              cursor:"pointer", fontSize:"12px" }}>
                📷
                <input type="file" accept="image/*" onChange={handlePhotoChange}
                  style={{ display:"none" }}/>
              </label>
            )}
          </div>

          <div style={{ flex:1 }}>
            <h2 style={{ margin:"0 0 0.25rem", fontSize:"1.5rem" }}>{user.name}</h2>
            <p style={{ margin:"0 0 0.25rem", opacity:0.9 }}>{user.email}</p>
            {user.city && <p style={{ margin:"0 0 0.25rem", opacity:0.8 }}>📍 {user.city}</p>}
            {user.bio  && <p style={{ margin:0, opacity:0.8, fontSize:"0.9rem" }}>{user.bio}</p>}
          </div>

          <div style={{ display:"flex", gap:"0.5rem", flexWrap:"wrap" }}>
            <button onClick={() => setEditMode(!editMode)}
              style={{ padding:"8px 16px", background:"rgba(255,255,255,0.2)",
                       color:"#fff", border:"1px solid rgba(255,255,255,0.4)",
                       borderRadius:"8px", cursor:"pointer" }}>
              {editMode ? "Cancel" : "Edit Profile"}
            </button>
            <button onClick={handleLogout}
              style={{ padding:"8px 16px", background:"#ef4444",
                       color:"#fff", border:"none", borderRadius:"8px",
                       cursor:"pointer" }}>
              Logout
            </button>
          </div>
        </div>

        {/* Wallet */}
        <div style={{ marginTop:"1rem", padding:"0.75rem",
                      background:"rgba(255,255,255,0.1)", borderRadius:"8px" }}>
          {account ? (
            <p style={{ margin:0, fontSize:"0.85rem", fontFamily:"monospace" }}>
              Wallet: {account}
            </p>
          ) : (
            <button onClick={handleConnectWallet}
              style={{ padding:"8px 20px", background:"#f59e0b",
                       color:"#fff", border:"none", borderRadius:"8px",
                       cursor:"pointer", fontWeight:"bold" }}>
              Connect MetaMask Wallet
            </button>
          )}
        </div>
      </div>

      {/* Edit Profile Form */}
      {editMode && (
        <div style={{ background:"#fff", borderRadius:"12px", padding:"1.5rem",
                      boxShadow:"0 2px 8px rgba(0,0,0,0.08)",
                      marginBottom:"1.5rem", border:"1px solid #e5e7eb" }}>
          <h3 style={{ marginTop:0 }}>Edit Profile</h3>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1rem" }}>
            <div>
              <label style={{ display:"block", marginBottom:"4px",
                              fontWeight:"500", fontSize:"0.9rem" }}>Name</label>
              <input value={editForm.name}
                onChange={e => setEditForm({...editForm, name: e.target.value})}
                style={{ width:"100%", padding:"10px", borderRadius:"8px",
                         border:"1px solid #ddd", boxSizing:"border-box" }}/>
            </div>
            <div>
              <label style={{ display:"block", marginBottom:"4px",
                              fontWeight:"500", fontSize:"0.9rem" }}>Phone</label>
              <input value={editForm.phone}
                onChange={e => setEditForm({...editForm, phone: e.target.value})}
                style={{ width:"100%", padding:"10px", borderRadius:"8px",
                         border:"1px solid #ddd", boxSizing:"border-box" }}/>
            </div>
            <div>
              <label style={{ display:"block", marginBottom:"4px",
                              fontWeight:"500", fontSize:"0.9rem" }}>City</label>
              <input value={editForm.city}
                onChange={e => setEditForm({...editForm, city: e.target.value})}
                style={{ width:"100%", padding:"10px", borderRadius:"8px",
                         border:"1px solid #ddd", boxSizing:"border-box" }}/>
            </div>
            <div>
              <label style={{ display:"block", marginBottom:"4px",
                              fontWeight:"500", fontSize:"0.9rem" }}>Role</label>
              <select value={editForm.role}
                onChange={e => setEditForm({...editForm, role: e.target.value})}
                style={{ width:"100%", padding:"10px", borderRadius:"8px",
                         border:"1px solid #ddd", boxSizing:"border-box" }}>
                <option value="buyer">Buyer</option>
                <option value="seller">Seller</option>
                <option value="both">Both</option>
              </select>
            </div>
          </div>
          <div style={{ marginTop:"1rem" }}>
            <label style={{ display:"block", marginBottom:"4px",
                            fontWeight:"500", fontSize:"0.9rem" }}>Bio</label>
            <textarea value={editForm.bio}
              onChange={e => setEditForm({...editForm, bio: e.target.value})}
              style={{ width:"100%", padding:"10px", borderRadius:"8px",
                       border:"1px solid #ddd", height:"80px",
                       boxSizing:"border-box", resize:"vertical" }}/>
          </div>
          <button onClick={handleUpdateProfile} disabled={loading}
            style={{ marginTop:"1rem", padding:"12px 24px",
                     background: loading ? "#999" : "#7c3aed",
                     color:"#fff", border:"none", borderRadius:"8px",
                     cursor:"pointer", fontWeight:"bold" }}>
            {loading ? "Saving..." : "Save Changes"}
          </button>

          {/* Change Password */}
          <div style={{ marginTop:"1.5rem", paddingTop:"1.5rem",
                        borderTop:"1px solid #e5e7eb" }}>
            <h4 style={{ marginTop:0 }}>Change Password</h4>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"1rem" }}>
              <input type="password" placeholder="Current password"
                value={pwForm.currentPassword}
                onChange={e => setPwForm({...pwForm, currentPassword: e.target.value})}
                style={{ padding:"10px", borderRadius:"8px",
                         border:"1px solid #ddd", boxSizing:"border-box" }}/>
              <input type="password" placeholder="New password"
                value={pwForm.newPassword}
                onChange={e => setPwForm({...pwForm, newPassword: e.target.value})}
                style={{ padding:"10px", borderRadius:"8px",
                         border:"1px solid #ddd", boxSizing:"border-box" }}/>
              <input type="password" placeholder="Confirm new password"
                value={pwForm.confirmPassword}
                onChange={e => setPwForm({...pwForm, confirmPassword: e.target.value})}
                style={{ padding:"10px", borderRadius:"8px",
                         border:"1px solid #ddd", boxSizing:"border-box" }}/>
            </div>
            <button onClick={handleChangePassword}
              style={{ marginTop:"1rem", padding:"10px 20px",
                       background:"#059669", color:"#fff", border:"none",
                       borderRadius:"8px", cursor:"pointer" }}>
              Change Password
            </button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div style={{ display:"flex", gap:"1rem", marginBottom:"2rem", flexWrap:"wrap" }}>
        {[
          { label:"My Properties",   value:properties.length, color:"#7c3aed" },
          { label:"For Sale",        value:properties.filter(p=>p.isForSale).length, color:"#059669" },
          { label:"Transactions",    value:transactions.length, color:"#2563eb" },
          { label:"Total Value",     value:`${properties.reduce((s,p)=>s+parseFloat(p.price),0).toFixed(1)} ETH`, color:"#d97706" },
        ].map(stat => (
          <div key={stat.label} style={{ flex:1, minWidth:"150px",
                        background:"#fff", padding:"1.5rem", borderRadius:"12px",
                        boxShadow:"0 2px 8px rgba(0,0,0,0.08)",
                        borderLeft:`4px solid ${stat.color}` }}>
            <p style={{ margin:0, color:"#666", fontSize:"0.85rem" }}>{stat.label}</p>
            <h3 style={{ margin:"0.5rem 0 0", color:stat.color, fontSize:"1.6rem" }}>
              {stat.value}
            </h3>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:"0.5rem", marginBottom:"1.5rem" }}>
        {["properties", "transactions"].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            style={{ padding:"10px 24px", borderRadius:"8px", border:"none",
                     cursor:"pointer", fontWeight:"bold",
                     background: activeTab === tab ? "#7c3aed" : "#f3f4f6",
                     color:      activeTab === tab ? "#fff"    : "#374151" }}>
            {tab === "properties" ? "🏠 My Properties" : "📋 Transactions"}
          </button>
        ))}
      </div>

      {/* My Properties */}
      {activeTab === "properties" && (
        properties.length === 0 ? (
          <div style={{ textAlign:"center", padding:"3rem", background:"#f9fafb",
                        borderRadius:"12px", border:"1px solid #e5e7eb" }}>
            <p style={{ fontSize:"3rem" }}>🏘️</p>
            <p style={{ color:"#666" }}>
              {account ? "You don't own any properties yet." : "Connect your wallet to see your properties."}
            </p>
            {!account && (
              <button onClick={handleConnectWallet}
                style={{ padding:"10px 24px", background:"#7c3aed", color:"#fff",
                         border:"none", borderRadius:"8px", cursor:"pointer" }}>
                Connect Wallet
              </button>
            )}
          </div>
        ) : (
          <div style={{ display:"grid",
                        gridTemplateColumns:"repeat(auto-fill, minmax(260px,1fr))",
                        gap:"1rem" }}>
            {properties.map(prop => (
              <div key={prop.id} style={{ background:"#fff", borderRadius:"12px",
                            boxShadow:"0 2px 8px rgba(0,0,0,0.08)",
                            border:"1px solid #e5e7eb", overflow:"hidden" }}>
                <div style={{ background:"#7c3aed", padding:"1rem" }}>
                  <h3 style={{ color:"#fff", margin:0 }}>Property #{prop.id}</h3>
                </div>
                <div style={{ padding:"1rem" }}>
                  <p><strong>📍</strong> {prop.location}</p>
                  <p><strong>📐</strong> {prop.areaSqFt} sq ft</p>
                  <p><strong>💰</strong> {prop.price} MATIC</p>
                  <span style={{ padding:"4px 12px", borderRadius:"20px",
                                 fontSize:"0.8rem",
                                 background: prop.isForSale ? "#d1fae5" : "#f3f4f6",
                                 color:      prop.isForSale ? "#059669" : "#6b7280" }}>
                    {prop.isForSale ? "For Sale" : "Not Listed"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Transactions */}
      {activeTab === "transactions" && (
        transactions.length === 0 ? (
          <div style={{ textAlign:"center", padding:"3rem", background:"#f9fafb",
                        borderRadius:"12px" }}>
            <p style={{ fontSize:"3rem" }}>📋</p>
            <p style={{ color:"#666" }}>No transactions yet.</p>
          </div>
        ) : (
          <div>
            {transactions.map((tx, i) => (
              <div key={i} style={{ background:"#fff", padding:"1rem",
                            borderRadius:"12px", marginBottom:"0.75rem",
                            boxShadow:"0 2px 8px rgba(0,0,0,0.05)",
                            border:"1px solid #e5e7eb",
                            display:"flex", justifyContent:"space-between",
                            alignItems:"center", flexWrap:"wrap", gap:"0.5rem" }}>
                <div>
                  <span style={{ fontWeight:"bold", color:"#7c3aed" }}>{tx.type}</span>
                  <p style={{ margin:"4px 0 0", color:"#666", fontSize:"0.85rem" }}>
                    Property #{tx.propertyId}{tx.location ? ` — ${tx.location}` : ""}
                  </p>
                </div>
                <div style={{ textAlign:"right" }}>
                  <p style={{ margin:0, fontWeight:"bold" }}>{tx.price || tx.amount} MATIC</p>
                  <p style={{ margin:"4px 0 0", color:"#999", fontSize:"0.8rem" }}>
                    {new Date(tx.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}