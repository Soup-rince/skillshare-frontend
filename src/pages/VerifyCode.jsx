import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { verifyCode, resendVerification } from "../api";

function VerifyCode() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = (location.state?.email || "").trim().toLowerCase();
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (!email) {
      navigate("/register", { replace: true });
    }
  }, [email, navigate]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((c) => (c <= 1 ? 0 : c - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  const handleDigitChange = (index, value) => {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length > 1) {
      const pasted = cleaned.slice(0, 6).split("");
      const newDigits = ["", "", "", "", "", ""];
      pasted.forEach((d, i) => (newDigits[i] = d));
      setDigits(newDigits);
      const lastIndex = Math.min(pasted.length, 5);
      inputRefs.current[lastIndex]?.focus();
      return;
    }
    const newDigits = [...digits];
    newDigits[index] = cleaned;
    setDigits(newDigits);
    if (cleaned && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const newDigits = ["", "", "", "", "", ""];
    pasted.split("").forEach((d, i) => (newDigits[i] = d));
    setDigits(newDigits);
    const lastIndex = Math.min(pasted.length, 5);
    inputRefs.current[lastIndex]?.focus();
  };

  const code = digits.join("");

  useEffect(() => {
    if (code.length !== 6 || verifying) return;

    const doVerify = async () => {
      try {
        setVerifying(true);
        setError("");
        await verifyCode(email, code);
        navigate("/login", {
          state: { message: "Email verified! You can now log in." }
        });
      } catch (err) {
        setError(err.response?.data?.message || "Verification failed.");
        setDigits(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      } finally {
        setVerifying(false);
      }
    };

    doVerify();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  const handleResend = async () => {
    if (cooldown > 0) return;
    try {
      setResendLoading(true);
      setResendMessage("");
      setError("");
      const res = await resendVerification(email);
      setResendMessage(res.data.message || "Verification code sent!");
      setCooldown(60);
      setDigits(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (err) {
      const data = err.response?.data;
      if (data?.cooldown) {
        setCooldown(data.cooldown);
      }
      setResendMessage(data?.message || "Could not resend. Try again later.");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <section className="auth-brand-panel">
        <div className="auth-brand-content">
          <div className="brand"><span className="brand-mark">S</span>SkillShare</div>
          <h1 className="auth-title">Almost there.<br />Just one code.</h1>
          <p className="auth-copy">We sent a 6-digit code to your email. Enter it to verify your account.</p>
        </div>
      </section>
      <main className="auth-form-panel">
        <div className="auth-card">
          <div className="auth-success-state">
            <div className="auth-success-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <h1>Enter verification code</h1>
            <p>
              We sent a 6-digit code to <strong>{email}</strong>.
            </p>

            {error && <p className="alert" style={{ marginTop: 16 }}>{error}</p>}

            <div className="code-input-group">
              {digits.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => (inputRefs.current[i] = el)}
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigitChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  onPaste={handlePaste}
                  disabled={verifying}
                  className="code-input-box"
                  aria-label={`Digit ${i + 1}`}
                  autoFocus={i === 0}
                />
              ))}
            </div>

            {verifying && (
              <p className="auth-success-note" style={{ marginTop: 12 }}>
                Verifying...
              </p>
            )}

            {resendMessage && (
              <p
                className="alert"
                style={{
                  marginTop: 16,
                  background: resendMessage.toLowerCase().includes("could not") ? undefined : "#eaf3de",
                  color: resendMessage.toLowerCase().includes("could not") ? undefined : "#3b6d11"
                }}
              >
                {resendMessage}
              </p>
            )}

            <button
              type="button"
              className="button-secondary"
              onClick={handleResend}
              disabled={resendLoading || cooldown > 0}
              style={{ marginTop: 20 }}
            >
              {cooldown > 0
                ? `Resend code in ${cooldown}s`
                : resendLoading
                ? "Sending..."
                : "Didn't receive it? Resend code"}
            </button>

            <Link className="button" to="/login" style={{ marginTop: 12 }}>
              Back to login
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export default VerifyCode;