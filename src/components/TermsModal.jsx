import { useState, useRef, useEffect } from "react";
import { FaTimes, FaFileAlt, FaShieldAlt, FaCheck } from "react-icons/fa";
import { TERMS_SECTIONS, PRIVACY_SECTIONS } from "../constants/termsContent";

function TermsModal({ isOpen, onAccept, onClose, loading }) {
  const [step, setStep] = useState("terms");
  const [hasScrolled, setHasScrolled] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const contentRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setStep("terms");
      setHasScrolled(false);
      setAgreed(false);
    }
  }, [isOpen]);

  useEffect(() => {
    setHasScrolled(false);
    setAgreed(false);
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, [step]);

  if (!isOpen) return null;

  const handleScroll = () => {
    const el = contentRef.current;
    if (!el) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 10) {
      setHasScrolled(true);
    }
  };

  const handleContinue = () => {
    if (step === "terms") {
      setStep("privacy");
    } else {
      onAccept();
    }
  };

  const handleBack = () => {
    setStep("terms");
  };

  const sections = step === "terms" ? TERMS_SECTIONS : PRIVACY_SECTIONS;

  return (
    <div className="terms-overlay" onClick={onClose}>
      <div className="terms-modal" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="terms-close"
          onClick={onClose}
          aria-label="Close"
        >
          <FaTimes />
        </button>

        <header className="terms-header">
          <div className="terms-header-icon">
            {step === "terms" ? <FaFileAlt /> : <FaShieldAlt />}
          </div>
          <div className="terms-header-text">
            <h2>
              {step === "terms" ? "Terms and Conditions" : "Privacy Policy"}
            </h2>
            <p>
              {step === "terms"
                ? "Please read carefully before using SkillShare."
                : "How we collect, use, and protect your data."}
            </p>
          </div>
          <div className="terms-step-indicator">
            <span className={`terms-step ${step === "terms" ? "active" : "done"}`}>
              1
            </span>
            <span className="terms-step-divider" />
            <span className={`terms-step ${step === "privacy" ? "active" : ""}`}>
              2
            </span>
          </div>
        </header>

        <div className="terms-content" ref={contentRef} onScroll={handleScroll}>
          {sections.map((section, idx) => (
            <div key={idx} className="terms-section">
              <h3>{section.heading}</h3>
              {section.body && <p>{section.body}</p>}
              {section.bullets && (
                <ul>
                  {section.bullets.map((bullet, i) => (
                    <li key={i}>{bullet}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
          <div className="terms-end-marker">
            — End of {step === "terms" ? "Terms and Conditions" : "Privacy Policy"} —
          </div>
        </div>

        <footer className="terms-footer">
          <label className={`terms-checkbox ${!hasScrolled ? "disabled" : ""}`}>
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              disabled={!hasScrolled}
            />
            <span>
              {step === "terms"
                ? "I have read and agree to the Terms and Conditions."
                : "I have read and agree to the Privacy Policy."}
            </span>
          </label>

          {!hasScrolled && (
            <p className="terms-scroll-hint">
              Scroll to the bottom to enable the checkbox.
            </p>
          )}

          <div className="terms-actions">
            <button
              type="button"
              className="button-secondary"
              onClick={step === "terms" ? onClose : handleBack}
              disabled={loading}
            >
              {step === "terms" ? "Decline" : "Back"}
            </button>
            <button
              type="button"
              className="button"
              onClick={handleContinue}
              disabled={!agreed || loading}
            >
              {loading
                ? "Processing..."
                : step === "terms"
                  ? "Continue to Privacy Policy"
                  : "Accept and Log In"}
              {!loading && step === "privacy" && <FaCheck style={{ marginLeft: 6 }} />}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default TermsModal;