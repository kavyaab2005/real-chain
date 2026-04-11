import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import { connectWallet } from "../utils/contracts";
import "react-toastify/dist/ReactToastify.css";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "", email: "", password: "", confirmPassword: "",
    phone: "", city: "", bio: "", role: "both"
  });
  const [wallet, setWallet]   = useState("");
  const [loading, setLoading] = useState(false);
  const [step,    setStep]    = useState(1);

  const handleConnectWallet = async () => {
    try {
      const { address } = await connectWallet();
      setWallet(address);
      toast.success("Wallet connected!");
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      return toast.error("Passwords do not match!");
    }
    if (form.password.length < 6) {
      return toast.error("Password must be at least 6 characters!");
    }
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/auth/register", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          name:          form.name,
          email:         form.email,
          password:      form.password,
          phone:         form.phone,
          city:          form.city,
          bio:           form.bio,
          role:          form.role,
          walletAddress: wallet,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      localStorage.setItem("token", data.token);
      localStorage.setItem("user",  JSON.stringify(data.user));
      toast.success("Account created successfully!");
      setTimeout(() => navigate("/profile"), 1500);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width:"100%", padding:"12px", borderRadius:"8px",
    border:"1px solid #ddd", fontSize:"1rem",
    boxSizing:"border-box", marginBottom:"1rem"
  };

  return (
    <div style={{ minHeight:"80vh", display:"flex", alignItems:"center",
                  justifyContent:"center", padding:"2rem", background:"#f9fafb" }}>
      <ToastContainer />
      <div style={{ background:"#fff", borderRadius:"16px", padding:"2.5rem",
                    width:"100%", maxWidth:"480px",
                    boxShadow:"0 4px 24px rgba(0,0,0,0.08)" }}>

        {/* Header */}
        <div style={{ textAlign:"center", marginBottom:"2rem" }}>
          <div style={{ fontSize:"3rem" }}>🏠</div>
          <h2 style={{ margin:0, color:"#7c3aed" }}>Create Account</h2>
          <p style={{ color:"#666", margin:"0.5rem 0 0" }}>
            Join RealChain — India's blockchain real estate platform
          </p>
        </div>

        {/* Step indicators */}
        <div style={{ display:"flex", gap:"0.5rem", marginBottom:"2rem" }}>
          {[1, 2].map(s => (
            <div key={s} style={{ flex:1, height:"4px", borderRadius:"99px",
                                  background: step >= s ? "#7c3aed" : "#e5e7eb" }}/>
          ))}
        </div>

        {/* Step 1 — Basic Info */}
        {step === 1 && (
          <div>
            <h3 style={{ marginTop:0, color:"#374151" }}>Basic Information</h3>
            <input
              placeholder="Full name *"
              value={form.name}
              onChange={e => setForm({...form, name: e.target.value})}
              style={inputStyle}
            />
            <input
              type="email"
              placeholder="Email address *"
              value={form.email}
              onChange={e => setForm({...form, email: e.target.value})}
              style={inputStyle}
            />
            <input
              type="password"
              placeholder="Password (min 6 characters) *"
              value={form.password}
              onChange={e => setForm({...form, password: e.target.value})}
              style={inputStyle}
            />
            <input
              type="password"
              placeholder="Confirm password *"
              value={form.confirmPassword}
              onChange={e => setForm({...form, confirmPassword: e.target.value})}
              style={inputStyle}
            />
            <button
              onClick={() => {
                if (!form.name || !form.email || !form.password || !form.confirmPassword) {
                  return toast.error("Please fill all required fields!");
                }
                if (form.password !== form.confirmPassword) {
                  return toast.error("Passwords do not match!");
                }
                setStep(2);
              }}
              style={{ width:"100%", padding:"14px", background:"#7c3aed",
                       color:"#fff", border:"none", borderRadius:"8px",
                       fontSize:"1rem", cursor:"pointer", fontWeight:"bold" }}>
              Next →
            </button>
          </div>
        )}

        {/* Step 2 — Profile + Wallet */}
        {step === 2 && (
          <div>
            <h3 style={{ marginTop:0, color:"#374151" }}>Profile & Wallet</h3>
            <input
              placeholder="Phone number"
              value={form.phone}
              onChange={e => setForm({...form, phone: e.target.value})}
              style={inputStyle}
            />
            <input
              placeholder="City (e.g. Bangalore)"
              value={form.city}
              onChange={e => setForm({...form, city: e.target.value})}
              style={inputStyle}
            />
            <textarea
              placeholder="Bio — tell us about yourself"
              value={form.bio}
              onChange={e => setForm({...form, bio: e.target.value})}
              style={{ ...inputStyle, height:"80px", resize:"vertical" }}
            />

            {/* Role selection */}
            <div style={{ marginBottom:"1rem" }}>
              <label style={{ display:"block", marginBottom:"8px",
                              fontWeight:"500", color:"#374151" }}>
                I want to:
              </label>
              <div style={{ display:"flex", gap:"0.5rem" }}>
                {[
                  { value:"buyer",  label:"Buy properties" },
                  { value:"seller", label:"Sell properties" },
                  { value:"both",   label:"Both" },
                ].map(opt => (
                  <button key={opt.value}
                    onClick={() => setForm({...form, role: opt.value})}
                    style={{ flex:1, padding:"10px", borderRadius:"8px",
                             border:`2px solid ${form.role === opt.value ? "#7c3aed" : "#ddd"}`,
                             background: form.role === opt.value ? "#ede9fe" : "#fff",
                             color: form.role === opt.value ? "#7c3aed" : "#374151",
                             cursor:"pointer", fontWeight:"500", fontSize:"0.85rem" }}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Wallet connection */}
            <div style={{ background:"#f9fafb", padding:"1rem",
                          borderRadius:"8px", marginBottom:"1rem" }}>
              <p style={{ margin:"0 0 0.5rem", fontWeight:"500", color:"#374151" }}>
                Connect MetaMask Wallet (optional)
              </p>
              {wallet ? (
                <p style={{ margin:0, color:"#059669", fontSize:"0.85rem",
                            wordBreak:"break-all" }}>
                  ✅ Connected: {wallet.slice(0,10)}...{wallet.slice(-6)}
                </p>
              ) : (
                <button onClick={handleConnectWallet}
                  style={{ padding:"8px 16px", background:"#f59e0b",
                           color:"#fff", border:"none", borderRadius:"8px",
                           cursor:"pointer", fontWeight:"bold" }}>
                  Connect Wallet
                </button>
              )}
            </div>

            <div style={{ display:"flex", gap:"0.5rem" }}>
              <button onClick={() => setStep(1)}
                style={{ flex:1, padding:"14px", background:"#f3f4f6",
                         color:"#374151", border:"none", borderRadius:"8px",
                         fontSize:"1rem", cursor:"pointer" }}>
                ← Back
              </button>
              <button onClick={handleRegister} disabled={loading}
                style={{ flex:2, padding:"14px",
                         background: loading ? "#999" : "#7c3aed",
                         color:"#fff", border:"none", borderRadius:"8px",
                         fontSize:"1rem", cursor:"pointer", fontWeight:"bold" }}>
                {loading ? "Creating account..." : "Create Account"}
              </button>
            </div>
          </div>
        )}

        <p style={{ textAlign:"center", color:"#666", margin:"1rem 0 0" }}>
          Already have an account?{" "}
          <Link to="/login"
            style={{ color:"#7c3aed", fontWeight:"bold", textDecoration:"none" }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}