import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import axios from "axios";
import TermsModal from "../components/TermsModal";

const API_URL =
  import.meta.env.VITE_API_URL ||
  (window.location.hostname === "localhost"
    ? "http://localhost:5000/api"
    : "https://skillshare-backend-1qq5.onrender.com/api");

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [suspendedMessage, setSuspendedMessage] = useState("");
  const [showTerms, setShowTerms] = useState(false);
  const [termsLoading, setTermsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const successMessage = location.state?.message;

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("suspended") === "1") {
      const msg = params.get("message");
      if (msg) {
        setSuspendedMessage(msg);
      }
    }
  }, [location.search]);

  const finishLogin = (data) => {
    localStorage.setItem("token", data.token);
    localStorage.setItem("userId", data._id);
    localStorage.setItem("role", data.role);
    localStorage.setItem("userName", data.name);

    if (data.role === "super_admin") {
      navigate("/superadmin");
    } else if (data.role === "admin") {
      navigate("/admin");
    } else if (data.role === "moderator") {
      navigate("/moderator");
    } else if (data.hasSeenWelcome === false) {
      navigate("/getting-started");
    } else {
      navigate("/browse");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuspendedMessage("");
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { email, password });
      finishLogin(res.data);
    } catch (err) {
      const data = err.response?.data;
      if (data?.code === "TERMS_REQUIRED") {
        setShowTerms(true);
      } else if (data?.code === "ACCOUNT_SUSPENDED" || (data?.message || "").toLowerCase().includes("suspended")) {
        const reasonText = data?.reason ? ` Reason: ${data.reason}` : "";
        setSuspendedMessage(`Your account has been suspended.${reasonText}`);
      } else {
        setError(data?.message || "Login failed");
      }
    }
  };

  const handleAcceptTerms = async () => {
    try {
      setTermsLoading(true);
      setError("");
      const res = await axios.post(`${API_URL}/auth/accept-terms`, { email, password });
      setShowTerms(false);
      finishLogin(res.data);
    } catch (err) {
      const data = err.response?.data;
      setError(data?.message || "Could not accept terms. Please try again.");
      setShowTerms(false);
    } finally {
      setTermsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <section className="auth-brand-panel">
        <div className="auth-brand-content">
          <div className="brand"><span className="brand-mark">S</span>SkillShare</div>
          <h1 className="auth-title">Learn together.<br />Grow together.</h1>
          <p className="auth-copy">Find people to exchange skills, share what you know, and build meaningful connections.</p>
        </div>
      </section>
      <main className="auth-form-panel">
        <div className="auth-card">
          <p className="eyebrow">Welcome back</p>
          <h1>Log in to SkillShare</h1>
          <p>Enter your details to continue your learning journey.</p>
          <form className="form-stack" onSubmit={handleSubmit}>
            {successMessage && <p className="alert" style={{ background: "#eaf3de", color: "#3b6d11" }}>{successMessage}</p>}
            {suspendedMessage && (
              <div className="alert" style={{ background: "#fff2f4", borderColor: "#ffd7dc", color: "#ad2438" }}>
                <p style={{ margin: 0, fontWeight: 700 }}>Account Suspended</p>
                <p style={{ margin: "4px 0 0", fontSize: "0.82rem", lineHeight: 1.5 }}>{suspendedMessage}</p>
              </div>
            )}
            {error && <p className="alert">{error}</p>}
            <div className="field">
              <label htmlFor="login-email">Email address</label>
              <input id="login-email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="field">
              <label htmlFor="login-password">Password</label>
              <div style={{ position: "relative" }}>
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{ width: "100%", paddingRight: 60 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: 8,
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontSize: 12,
                    padding: "4px 8px",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#0f6e56"
                  }}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              <Link className="forgot-password-link" to="/forgot-password">
                Forgot password?
              </Link>
            </div>
            <button className="button" type="submit">Log in</button>
          </form>
          <p className="form-note">New to SkillShare? <Link to="/register">Create an account</Link></p>
        </div>
      </main>

      <TermsModal
        isOpen={showTerms}
        onAccept={handleAcceptTerms}
        onClose={() => setShowTerms(false)}
        loading={termsLoading}
      />
    </div>
  );
}

export default Login;