import { useState } from "react";
import { Link } from "react-router-dom";
import { FaArrowLeft, FaEnvelope } from "react-icons/fa";
import { forgotPassword } from "../api";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await forgotPassword({ email });
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.message || "Could not send reset email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <section className="auth-brand-panel">
        <div className="auth-brand-content">
          <div className="brand"><span className="brand-mark">S</span>SkillShare</div>
          <h1 className="auth-title">Forgot your<br />password?</h1>
          <p className="auth-copy">No worries. Enter your email and we'll send you a link to reset it.</p>
        </div>
      </section>
      <main className="auth-form-panel">
        <div className="auth-card">
          <Link className="auth-back-link" to="/login">
            <FaArrowLeft aria-hidden="true" />
            <span>Back to login</span>
          </Link>

          {submitted ? (
            <div className="auth-success-state">
              <div className="auth-success-icon"><FaEnvelope /></div>
              <h1>Check your email</h1>
              <p>If an account exists for <strong>{email}</strong>, you'll receive a password reset link shortly.</p>
              <p className="auth-success-note">The link expires in 1 hour. Check your spam folder if you don't see it.</p>
              <Link className="button" to="/login">Back to login</Link>
            </div>
          ) : (
            <>
              <p className="eyebrow">Password reset</p>
              <h1>Forgot password?</h1>
              <p>Enter the email associated with your account.</p>
              <form className="form-stack" onSubmit={handleSubmit}>
                {error && <p className="alert">{error}</p>}
                <div className="field">
                  <label htmlFor="forgot-email">Email address</label>
                  <input
                    id="forgot-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <button className="button" type="submit" disabled={loading}>
                  {loading ? "Sending..." : "Send reset link"}
                </button>
              </form>
              <p className="form-note">Remember your password? <Link to="/login">Log in</Link></p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default ForgotPassword;