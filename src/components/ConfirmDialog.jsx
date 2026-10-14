import { useState, useEffect } from "react";

function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  tone = "danger",
  inputLabel,
  inputPlaceholder,
  inputRequired = false,
  inputMinLength = 0,
}) {
  const [inputValue, setInputValue] = useState("");
  const [inputError, setInputError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setInputValue("");
      setInputError("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const hasInput = Boolean(inputLabel);

  const handleConfirm = () => {
    if (hasInput) {
      const trimmed = inputValue.trim();
      if (inputRequired && !trimmed) {
        setInputError("This field is required.");
        return;
      }
      if (inputMinLength > 0 && trimmed.length < inputMinLength) {
        setInputError(`Minimum ${inputMinLength} characters.`);
        return;
      }
      onConfirm(trimmed);
    } else {
      onConfirm();
    }
  };

  const canSubmit = !hasInput || !inputRequired || (
    inputValue.trim().length >= inputMinLength && inputValue.trim().length > 0
  );

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
      <div className="modal-card">
        <header className={`modal-header modal-header-${tone}`}>
          <span className="modal-header-icon" aria-hidden="true">
            {tone === "danger" ? "⚠" : "ℹ"}
          </span>
          <h2 id="confirm-title" className="modal-title">{title}</h2>
        </header>
        <div className="modal-body">
          <p>{message}</p>

          {hasInput && (
            <div className="field" style={{ marginTop: 16 }}>
              <label htmlFor="confirm-input">
                {inputLabel}
                {inputRequired && <span style={{ color: "#dc2626" }}> *</span>}
              </label>
              <textarea
                id="confirm-input"
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  if (inputError) setInputError("");
                }}
                placeholder={inputPlaceholder || ""}
                rows={3}
                autoFocus
                style={{ width: "100%", minHeight: 80, padding: "10px 12px", border: "1px solid #dce1ed", borderRadius: 8, fontSize: "0.88rem", fontFamily: "inherit", resize: "vertical", outline: "none" }}
              />
              {inputError && (
                <small style={{ color: "#dc2626", marginTop: 4, display: "block", fontSize: "0.78rem" }}>
                  {inputError}
                </small>
              )}
              {!inputError && inputMinLength > 0 && (
                <small style={{ color: "#8992a8", marginTop: 4, display: "block", fontSize: "0.78rem" }}>
                  Minimum {inputMinLength} characters
                </small>
              )}
            </div>
          )}
        </div>
        <footer className="modal-actions">
          <button type="button" className="button-secondary" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={tone === "danger" ? "button-danger" : "button"}
            onClick={handleConfirm}
            disabled={!canSubmit}
          >
            {confirmLabel}
          </button>
        </footer>
      </div>
    </div>
  );
}

export default ConfirmDialog;