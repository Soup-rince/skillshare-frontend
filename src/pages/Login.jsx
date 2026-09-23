import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_URL ||
  (window.location.hostname === "localhost"
    ? "http://localhost:5000/api"
    : "https://skillshare-backend-1qq5.onrender.com/api");

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { email, password });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("userId", res.data._id);
      localStorage.setItem("role", res.data.role);
      navigate("/browse");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
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
            {error && <p className="alert">{error}</p>}
            <div className="field">
              <label htmlFor="login-email">Email address</label>
              <input id="login-email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="field">
              <label htmlFor="login-password">Password</label>
              <input id="login-password" type="password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <button className="button" type="submit">Log in</button>
          </form>
          <p className="form-note">New to SkillShare? <Link to="/register">Create an account</Link></p>
        </div>
      </main>
    </div>
  );
}

export default Login;
