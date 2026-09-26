function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  tone = "danger",
}) {
  if (!isOpen) return null;

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
        </div>
        <footer className="modal-actions">
          <button type="button" className="button-secondary" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={tone === "danger" ? "button-danger" : "button"}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </footer>
      </div>
    </div>
  );
}

export default ConfirmDialog;