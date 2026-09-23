import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_URL ||
  (window.location.hostname === "localhost"
    ? "http://localhost:5000/api"
    : "https://skillshare-backend-1qq5.onrender.com/api");

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await axios.post(`${API_URL}/auth/register`, { name, email, password });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("userId", res.data._id);
      localStorage.setItem("role", res.data.role);
      navigate("/browse");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="auth-page">
      <section className="auth-brand-panel">
        <div className="auth-brand-content">
          <div className="brand"><span className="brand-mark">S</span>SkillShare</div>
          <h1 className="auth-title">Share a skill.<br />Find your next one.</h1>
          <p className="auth-copy">Join a community where skills are exchanged through conversation and collaboration.</p>
        </div>
      </section>
      <main className="auth-form-panel">
        <div className="auth-card">
          <p className="eyebrow">Join the community</p>
          <h1>Create your account</h1>
          <p>It only takes a moment to start sharing and learning.</p>
          <form className="form-stack" onSubmit={handleSubmit}>
            {error && <p className="alert">{error}</p>}
            <div className="field">
              <label htmlFor="register-name">Name</label>
              <input id="register-name" placeholder="Your full name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="field">
              <label htmlFor="register-email">Email address</label>
              <input id="register-email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="field">
              <label htmlFor="register-password">Password</label>
              <input id="register-password" type="password" placeholder="Create a password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <button className="button" type="submit">Create account</button>
          </form>
          <p className="form-note">Already have an account? <Link to="/login">Log in</Link></p>
        </div>
      </main>
    </div>
  );
}

export default Register;
