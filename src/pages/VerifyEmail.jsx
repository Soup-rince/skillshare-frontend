import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { verifyEmail } from "../api";

function VerifyEmail() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const verify = async () => {
      try {
        const res = await verifyEmail(token);
        setStatus("success");
        setMessage(res.data.message || "Email verified successfully!");
        setTimeout(() => {
          navigate("/login", {
            state: { message: "Email verified! You can now log in." }
          });
        }, 2500);
      } catch (err) {
        setStatus("error");
        setMessage(err.response?.data?.message || "Verification failed.");
      }
    };
    verify();
  }, [token, navigate]);

  return (
    <div className="auth-page">
      <section className="auth-brand-panel">
        <div className="auth-brand-content">
          <div className="brand"><span className="brand-mark">S</span>SkillShare</div>
          <h1 className="auth-title">Almost there.<br />Just one click.</h1>
          <p className="auth-copy">We are confirming your email to keep your account secure.</p>
        </div>
      </section>
      <main className="auth-form-panel">
        <div className="auth-card">
          {status === "loading" && (
            <div className="auth-success-state">
              <div className="auth-success-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10" opacity="0.25" />
                  <path d="M12 2a10 10 0 0 1 10 10">
                    <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite" />
                  </path>
                </svg>
              </div>
              <h1>Verifying your email...</h1>
              <p>Please wait a moment.</p>
            </div>
          )}

          {status === "success" && (
            <div className="auth-success-state">
              <div className="auth-success-icon auth-success-icon-green">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h1>Email verified!</h1>
              <p>{message}</p>
              <p className="auth-success-note">Redirecting to login...</p>
              <Link className="button" to="/login">Go to login now</Link>
            </div>
          )}

          {status === "error" && (
            <div className="auth-success-state">
              <div className="auth-success-icon" style={{ color: "#ad2438", background: "#fff2f4" }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </div>
              <h1>Verification failed</h1>
              <p>{message}</p>
              <p className="auth-success-note">
                The link may have expired. Try registering again or request a new link.
              </p>
              <Link className="button" to="/register">Back to register</Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default VerifyEmail;