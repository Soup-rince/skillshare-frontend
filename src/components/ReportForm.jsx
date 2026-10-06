import { useState } from "react";
import { FaTimes, FaFlag } from "react-icons/fa";

const REASONS = [
  { value: "spam", label: "Spam or repetitive content" },
  { value: "inappropriate", label: "Inappropriate or offensive content" },
  { value: "harassment", label: "Harassment or hate speech" },
  { value: "misinformation", label: "Misinformation or misleading content" },
  { value: "other", label: "Other (please specify)" },
];

function ReportForm({ isOpen, postId, onClose, onSubmit }) {
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!reason) {
      setError("Please select a reason.");
      return;
    }

    if (reason === "other" && !details.trim()) {
      setError("Please provide details for 'Other'.");
      return;
    }

    try {
      setSubmitting(true);
      await onSubmit({ post: postId, reason, details: details.trim() });
      setSuccess(true);
      setTimeout(() => {
        onClose();
        setReason("");
        setDetails("");
        setSuccess(false);
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Could not submit report.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="report-overlay" onClick={onClose}>
      <div className="report-modal" onClick={(e) => e.stopPropagation()}>
        <button className="report-close" onClick={onClose} aria-label="Close">
          <FaTimes />
        </button>

        {success ? (
          <div className="report-success">
            <div className="report-success-icon">
              <FaFlag />
            </div>
            <h2>Report submitted</h2>
            <p>Thank you. Our admin team will review this report shortly.</p>
          </div>
        ) : (
          <>
            <header className="report-header">
              <div className="report-header-icon">
                <FaFlag />
              </div>
              <h2>Report this post</h2>
              <p>Help us keep SkillShare safe. Your report is anonymous to the post owner.</p>
            </header>

            <form className="report-form" onSubmit={handleSubmit}>
              {error && <p className="alert">{error}</p>}

              <div className="report-reasons">
                {REASONS.map((r) => (
                  <label
                    key={r.value}
                    className={`report-reason ${reason === r.value ? "selected" : ""}`}
                  >
                    <input
                      type="radio"
                      name="reason"
                      value={r.value}
                      checked={reason === r.value}
                      onChange={(e) => setReason(e.target.value)}
                    />
                    <span>{r.label}</span>
                  </label>
                ))}
              </div>

              {reason === "other" && (
                <div className="field">
                  <label htmlFor="report-details">Details</label>
                  <textarea
                    id="report-details"
                    placeholder="Please describe the issue..."
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    maxLength={500}
                  />
                  <small className="field-hint">{details.length}/500 characters</small>
                </div>
              )}

              <div className="report-actions">
                <button type="button" className="button-secondary" onClick={onClose}>
                  Cancel
                </button>
                <button type="submit" className="button" disabled={submitting}>
                  {submitting ? "Submitting..." : "Submit report"}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default ReportForm;