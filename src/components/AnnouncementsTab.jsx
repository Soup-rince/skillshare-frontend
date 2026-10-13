import { useState, useEffect } from "react";
import {
  FaPlus,
  FaInfoCircle,
  FaExclamationTriangle,
  FaExclamationCircle,
  FaEdit,
  FaTrash,
  FaPowerOff,
  FaToggleOn,
  FaToggleOff,
  FaTimes,
  FaCheck
} from "react-icons/fa";
import {
  getAllAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  toggleAnnouncement,
  deleteAnnouncement
} from "../api";
import ConfirmDialog from "./ConfirmDialog";

const TYPE_CONFIG = {
  info: { label: "Info", icon: FaInfoCircle, className: "audit-log-role-member" },
  warning: { label: "Warning", icon: FaExclamationTriangle, className: "audit-log-role-admin" },
  critical: { label: "Critical", icon: FaExclamationCircle, className: "audit-log-role-super_admin" }
};

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatDateTime(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function toDateInputValue(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function AnnouncementsTab() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState("");
  const [confirmDialog, setConfirmDialog] = useState(null);
  const token = localStorage.getItem("token");

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState("info");
  const [isDismissible, setIsDismissible] = useState(true);
  const [expiresAt, setExpiresAt] = useState("");

  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await getAllAnnouncements(token);
      setAnnouncements(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load announcements.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const resetForm = () => {
    setTitle("");
    setMessage("");
    setType("info");
    setIsDismissible(true);
    setExpiresAt("");
    setEditingId(null);
    setShowForm(false);
  };

  const handleNewClick = () => {
    resetForm();
    setShowForm(true);
  };

  const handleEditClick = (a) => {
    setTitle(a.title);
    setMessage(a.message);
    setType(a.type);
    setIsDismissible(a.isDismissible);
    setExpiresAt(a.expiresAt ? toDateInputValue(a.expiresAt) : "");
    setEditingId(a._id);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      setError("Title and message are required.");
      return;
    }
    try {
      setSaving(true);
      setError("");
      const payload = {
        title: title.trim(),
        message: message.trim(),
        type,
        isDismissible,
        expiresAt: expiresAt || null
      };
      if (editingId) {
        await updateAnnouncement(editingId, payload, token);
      } else {
        await createAnnouncement(payload, token);
      }
      await loadAnnouncements();
      resetForm();
    } catch (err) {
      setError(err.response?.data?.message || "Could not save announcement.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (a) => {
    setConfirmDialog({
      title: a.isActive ? "Deactivate announcement?" : "Activate announcement?",
      message: a.isActive
        ? `Deactivating "${a.title}" will hide it from all users.`
        : `Activating "${a.title}" will show it to all users who haven't dismissed it.`,
      confirmLabel: a.isActive ? "Deactivate" : "Activate",
      tone: a.isActive ? "danger" : "info",
      onConfirm: async () => {
        setActionId(a._id);
        try {
          await toggleAnnouncement(a._id, token);
          await loadAnnouncements();
        } catch (err) {
          setError(err.response?.data?.message || "Could not toggle announcement.");
        } finally {
          setActionId("");
          setConfirmDialog(null);
        }
      }
    });
  };

  const handleDelete = (a) => {
    setConfirmDialog({
      title: "Delete announcement?",
      message: `Permanently delete "${a.title}"? This cannot be undone.`,
      confirmLabel: "Delete",
      tone: "danger",
      onConfirm: async () => {
        setActionId(a._id);
        try {
          await deleteAnnouncement(a._id, token);
          await loadAnnouncements();
        } catch (err) {
          setError(err.response?.data?.message || "Could not delete announcement.");
        } finally {
          setActionId("");
          setConfirmDialog(null);
        }
      }
    });
  };

  return (
    <section className="superadmin-section">
      {error && <p className="alert" style={{ marginBottom: 16 }}>{error}</p>}

      <div className="admin-section-title">
        <h2>Announcements</h2>
        <button
          type="button"
          className="button"
          onClick={handleNewClick}
        >
          <FaPlus aria-hidden="true" />
          <span>New announcement</span>
        </button>
      </div>

      {showForm && (
        <form className="announcement-form" onSubmit={handleSubmit}>
          <div className="announcement-form-header">
            <h3>{editingId ? "Edit announcement" : "Create announcement"}</h3>
            <button
              type="button"
              className="announcement-form-close"
              onClick={resetForm}
              aria-label="Close"
            >
              <FaTimes />
            </button>
          </div>

          <div className="form-stack">
            <div className="field">
              <label htmlFor="ann-title">Title</label>
              <input
                id="ann-title"
                type="text"
                placeholder="e.g. Scheduled maintenance tonight"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={120}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="ann-message">Message</label>
              <textarea
                id="ann-message"
                placeholder="Write your announcement here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={500}
                required
              />
            </div>

            <div className="form-grid">
              <div className="field">
                <label htmlFor="ann-type">Type</label>
                <select
                  id="ann-type"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                >
                  <option value="info">Info (blue)</option>
                  <option value="warning">Warning (yellow)</option>
                  <option value="critical">Critical (red)</option>
                </select>
              </div>

              <div className="field">
                <label htmlFor="ann-expires">Expires at (optional)</label>
                <input
                  id="ann-expires"
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                />
                <small className="field-hint">Leave blank for no expiry</small>
              </div>
            </div>

            <div className="field field-checkbox">
              <label>
                <input
                  type="checkbox"
                  checked={isDismissible}
                  onChange={(e) => setIsDismissible(e.target.checked)}
                />
                <span>Users can dismiss this announcement</span>
              </label>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="button-secondary"
                onClick={resetForm}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="button"
                disabled={saving}
              >
                <FaCheck aria-hidden="true" />
                <span>{saving ? "Saving..." : editingId ? "Update" : "Publish"}</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {loading ? (
        <div className="empty-state"><p>Loading announcements...</p></div>
      ) : announcements.length === 0 ? (
        <div className="empty-state">
          <p>No announcements yet.</p>
        </div>
      ) : (
        <div className="admin-post-list">
          {announcements.map((a) => {
            const config = TYPE_CONFIG[a.type] || TYPE_CONFIG.info;
            const IconComponent = config.icon;
            const isExpired = a.expiresAt && new Date(a.expiresAt) < new Date();
            return (
              <article className="announcement-row" key={a._id}>
                <span className={`announcement-row-icon announcement-row-icon-${a.type}`}>
                  <IconComponent />
                </span>
                <div className="announcement-row-body">
                  <div className="announcement-row-headline">
                    <h3>{a.title}</h3>
                    <span className={`announcement-type-badge announcement-type-${a.type}`}>
                      {config.label}
                    </span>
                    {!a.isActive && (
                      <span className="announcement-status-badge announcement-status-inactive">
                        Inactive
                      </span>
                    )}
                    {isExpired && (
                      <span className="announcement-status-badge announcement-status-expired">
                        Expired
                      </span>
                    )}
                    {!a.isDismissible && (
                      <span className="announcement-status-badge announcement-status-pinned">
                        Pinned
                      </span>
                    )}
                  </div>
                  <p className="announcement-row-message">{a.message}</p>
                  <div className="announcement-row-meta">
                    <span>By {a.createdByName || "Unknown"}</span>
                    <span>·</span>
                    <span>{formatDateTime(a.createdAt)}</span>
                    {a.expiresAt && (
                      <>
                        <span>·</span>
                        <span>Expires {formatDate(a.expiresAt)}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="announcement-row-actions">
                  <button
                    type="button"
                    className="button-secondary button-small"
                    onClick={() => handleEditClick(a)}
                    disabled={actionId === a._id}
                  >
                    <FaEdit aria-hidden="true" />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    className="button-secondary button-small"
                    onClick={() => handleToggle(a)}
                    disabled={actionId === a._id}
                  >
                    {a.isActive ? (
                      <>
                        <FaToggleOff aria-hidden="true" />
                        <span>Deactivate</span>
                      </>
                    ) : (
                      <>
                        <FaToggleOn aria-hidden="true" />
                        <span>Activate</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    className="button-danger button-small"
                    onClick={() => handleDelete(a)}
                    disabled={actionId === a._id}
                  >
                    <FaTrash aria-hidden="true" />
                    <span>Delete</span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        isOpen={Boolean(confirmDialog)}
        title={confirmDialog?.title || ""}
        message={confirmDialog?.message || ""}
        confirmLabel={confirmDialog?.confirmLabel || "Confirm"}
        cancelLabel={confirmDialog?.cancelLabel || "Cancel"}
        tone={confirmDialog?.tone || "danger"}
        onConfirm={confirmDialog?.onConfirm || (() => {})}
        onCancel={() => setConfirmDialog(null)}
      />
    </section>
  );
}

export default AnnouncementsTab;