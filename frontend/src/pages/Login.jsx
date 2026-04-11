import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      localStorage.setItem("token", data.token);
      localStorage.setItem("user",  JSON.stringify(data.user));
      toast.success(`Welcome back, ${data.user.name}!`);
      setTimeout(() => navigate("/profile"), 1500);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight:"80vh", display:"flex", alignItems:"center",
                  justifyContent:"center", padding:"2rem",
                  background:"#f9fafb" }}>
      <ToastContainer />
      <div style={{ background:"#fff", borderRadius:"16px", padding:"2.5rem",
                    width:"100%", maxWidth:"420px",
                    boxShadow:"0 4px 24px rgba(0,0,0,0.08)" }}>

        {/* Header */}
        <div style={{ textAlign:"center", marginBottom:"2rem" }}>
          <div style={{ fontSize:"3rem", marginBottom:"0.5rem" }}>🏠</div>
          <h2 style={{ margin:0, color:"#7c3aed" }}>Welcome to RealChain</h2>
          <p style={{ color:"#666", margin:"0.5rem 0 0" }}>Sign in to your account</p>
        </div>

        {/* Form */}
        <div>
          <div style={{ marginBottom:"1rem" }}>
            <label style={{ display:"block", marginBottom:"6px",
                            fontWeight:"500", color:"#374151" }}>
              Email address
            </label>
            <input
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={e => setForm({...form, email: e.target.value})}
              style={{ width:"100%", padding:"12px", borderRadius:"8px",
                       border:"1px solid #ddd", fontSize:"1rem",
                       boxSizing:"border-box" }}
            />
          </div>

          <div style={{ marginBottom:"1.5rem" }}>
            <label style={{ display:"block", marginBottom:"6px",
                            fontWeight:"500", color:"#374151" }}>
              Password
            </label>
            <div style={{ position:"relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={form.password}
                onChange={e => setForm({...form, password: e.target.value})}
                style={{ width:"100%", padding:"12px", paddingRight:"48px",
                         borderRadius:"8px", border:"1px solid #ddd",
                         fontSize:"1rem", boxSizing:"border-box" }}
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                style={{ position:"absolute", right:"12px", top:"50%",
                         transform:"translateY(-50%)", background:"none",
                         border:"none", cursor:"pointer", color:"#666" }}>
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <button
            onClick={handleLogin}
            disabled={loading}
            style={{ width:"100%", padding:"14px", background: loading ? "#999" : "#7c3aed",
                     color:"#fff", border:"none", borderRadius:"8px",
                     fontSize:"1rem", cursor:"pointer", fontWeight:"bold",
                     marginBottom:"1rem" }}>
            {loading ? "Signing in..." : "Sign In"}
          </button>

          <p style={{ textAlign:"center", color:"#666", margin:0 }}>
            Don't have an account?{" "}
            <Link to="/register"
              style={{ color:"#7c3aed", fontWeight:"bold", textDecoration:"none" }}>
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}