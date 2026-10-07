import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { FaCheckCircle } from "react-icons/fa";
import { resetPassword } from "../api";

function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    if (!strongPasswordRegex.test(password)) {
      setError("Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await resetPassword(token, { password });
      setSuccess(true);
      setTimeout(() => navigate("/login", { state: { message: "Password reset successful. Please log in." } }), 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Could not reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <section className="auth-brand-panel">
        <div className="auth-brand-content">
          <div className="brand"><span className="brand-mark">S</span>SkillShare</div>
          <h1 className="auth-title">Create a<br />new password.</h1>
          <p className="auth-copy">Choose a strong password to keep your account secure.</p>
        </div>
      </section>
      <main className="auth-form-panel">
        <div className="auth-card">
          {success ? (
            <div className="auth-success-state">
              <div className="auth-success-icon auth-success-icon-green"><FaCheckCircle /></div>
              <h1>Password reset!</h1>
              <p>Your password has been updated. Redirecting to login...</p>
            </div>
          ) : (
            <>
              <p className="eyebrow">Password reset</p>
              <h1>Set new password</h1>
              <p>Enter and confirm your new password.</p>
              <form className="form-stack" onSubmit={handleSubmit}>
                {error && <p className="alert">{error}</p>}
                <div className="field">
                  <label htmlFor="reset-password">New password</label>
                  <div style={{ position: "relative" }}>
                    <input
                      id="reset-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter new password"
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
                </div>
                <div className="field">
                  <label htmlFor="reset-confirm">Confirm new password</label>
                  <input
                    id="reset-confirm"
                    type={showPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
                <button className="button" type="submit" disabled={loading}>
                  {loading ? "Resetting..." : "Reset password"}
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

export default ResetPassword;