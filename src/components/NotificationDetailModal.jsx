import { createPortal } from "react-dom";
import {
  FaTimes,
  FaStar,
  FaFlag,
  FaBan,
  FaTrash,
  FaShieldAlt,
  FaUser,
  FaUserTie,
  FaCrown,
  FaCheck
} from "react-icons/fa";

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

const REASON_LABELS = {
  spam: "Spam or repetitive content",
  inappropriate: "Inappropriate or offensive content",
  harassment: "Harassment or hate speech",
  misinformation: "Misinformation or misleading content",
  fake_account: "Fake or impersonating account",
  underage: "Suspected underage user",
  other: "Other"
};

function getRoleIcon(role) {
  if (role === "moderator") return <FaUserTie />;
  if (role === "admin") return <FaShieldAlt />;
  if (role === "super_admin") return <FaCrown />;
  return <FaUser />;
}

function getRoleLabel(role) {
  if (!role) return "Member";
  return role.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function NotificationDetailModal({ notification, onClose, onNavigate }) {
  if (!notification) return null;

  const { type, metadata = {}, title, message, createdAt } = notification;

  const renderContent = () => {
    switch (type) {
      case 'post_reported':
        return (
          <>
            <div className="ndm-header">
              <div className="ndm-header-icon" style={{ color: "#ad2438", background: "#fff2f4" }}>
                <FaFlag />
              </div>
              <h2>{metadata.targetType === 'user' ? 'User Reported' : 'Post Reported'}</h2>
            </div>
            <div className="ndm-body">
              <div className="ndm-row">
                <span className="ndm-label">Reason</span>
                <span className="ndm-value">{REASON_LABELS[metadata.reason] || metadata.reason || "Not specified"}</span>
              </div>
              {metadata.targetType === 'user' ? (
                <div className="ndm-row">
                  <span className="ndm-label">User</span>
                  <span className="ndm-value">{metadata.targetUserName || "Unknown"}</span>
                </div>
              ) : (
                <>
                  <div className="ndm-row">
                    <span className="ndm-label">Post</span>
                    <span className="ndm-value">"{metadata.postTitle || "Untitled"}"</span>
                  </div>
                  {metadata.postDescription && (
                    <div className="ndm-block">
                      <span className="ndm-label">Post description</span>
                      <p className="ndm-details">{metadata.postDescription}</p>
                    </div>
                  )}
                </>
              )}
              {metadata.details && (
                <div className="ndm-block">
                  <span className="ndm-label">Reporter's note</span>
                  <p className="ndm-details">{metadata.details}</p>
                </div>
              )}
            </div>
          </>
        );

      case 'report_resolved':
        return (
          <>
            <div className="ndm-header">
              <div className="ndm-header-icon" style={{ color: "#166534", background: "#dcfce7" }}>
                <FaCheck />
              </div>
              <h2>Report {metadata.status === 'resolved' ? 'Resolved' : metadata.status === 'escalated' ? 'Escalated' : 'Reviewed'}</h2>
            </div>
            <div className="ndm-body">
              <div className="ndm-row">
                <span className="ndm-label">Status</span>
                <span className={`report-status report-status-${metadata.status}`}>
                  {metadata.status || "resolved"}
                </span>
              </div>
              <div className="ndm-row">
                <span className="ndm-label">Target</span>
                <span className="ndm-value">
                  {metadata.targetType === 'user'
                    ? metadata.targetUserName || "User"
                    : `"${metadata.postTitle || "Untitled"}"`}
                </span>
              </div>
              {metadata.adminNote && (
                <div className="ndm-block">
                  <span className="ndm-label">Note</span>
                  <p className="ndm-details">{metadata.adminNote}</p>
                </div>
              )}
            </div>
          </>
        );

      case 'new_review':
        return (
          <>
            <div className="ndm-header">
              <div className="ndm-header-icon" style={{ color: "#f59e0b", background: "#fef3c7" }}>
                <FaStar />
              </div>
              <h2>New Review</h2>
            </div>
            <div className="ndm-body">
              <div className="ndm-row">
                <span className="ndm-label">Rating</span>
                <span className="ndm-value ndm-stars">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <FaStar key={i} style={{ color: i < (metadata.rating || 0) ? "#f59e0b" : "#d1d5e0" }} />
                  ))}
                  <span className="ndm-rating-num">{metadata.rating || 0}/5</span>
                </span>
              </div>
              <div className="ndm-row">
                <span className="ndm-label">Reviewer</span>
                <span className="ndm-value">{metadata.reviewerName || "Unknown"}</span>
              </div>
              {metadata.comment && (
                <div className="ndm-block">
                  <span className="ndm-label">Comment</span>
                  <p className="ndm-details">"{metadata.comment}"</p>
                </div>
              )}
            </div>
          </>
        );

      case 'suspended':
        return (
          <>
            <div className="ndm-header">
              <div className="ndm-header-icon" style={{ color: "#dc2626", background: "#fee2e2" }}>
                <FaBan />
              </div>
              <h2>Account Suspended</h2>
            </div>
            <div className="ndm-body">
              <div className="ndm-row">
                <span className="ndm-label">Account</span>
                <span className="ndm-value">{metadata.userName || "Your account"}</span>
              </div>
              <div className="ndm-row">
                <span className="ndm-label">Reason</span>
                <span className="ndm-value">{metadata.reason || "Not specified"}</span>
              </div>
              <div className="ndm-row">
                <span className="ndm-label">Date</span>
                <span className="ndm-value">{formatDate(metadata.suspendedAt)}</span>
              </div>
            </div>
          </>
        );

      case 'warning':
        return (
          <>
            <div className="ndm-header">
              <div className="ndm-header-icon" style={{ color: "#d97706", background: "#fef3c7" }}>
                <FaFlag />
              </div>
              <h2>Warning</h2>
            </div>
            <div className="ndm-body">
              <div className="ndm-row">
                <span className="ndm-label">Reason</span>
                <span className="ndm-value">{REASON_LABELS[metadata.reason] || metadata.reason || "Not specified"}</span>
              </div>
              {metadata.details && (
                <div className="ndm-block">
                  <span className="ndm-label">Additional details</span>
                  <p className="ndm-details">{metadata.details}</p>
                </div>
              )}
              <div className="ndm-block">
                <span className="ndm-label">Message</span>
                <p className="ndm-details">{message || "Please follow our community guidelines."}</p>
              </div>
              {metadata.warnedBy && (
                <div className="ndm-row">
                  <span className="ndm-label">Issued by</span>
                  <span className="ndm-value">{metadata.warnedBy}</span>
                </div>
              )}
              <div className="ndm-row">
                <span className="ndm-label">Date</span>
                <span className="ndm-value">{formatDate(metadata.warnedAt)}</span>
              </div>
            </div>
          </>
        );

      case 'user_flagged':
        return (
          <>
            <div className="ndm-header">
              <div className="ndm-header-icon" style={{ color: "#dc2626", background: "#fee2e2" }}>
                <FaShieldAlt />
              </div>
              <h2>User Escalated for Review</h2>
            </div>
            <div className="ndm-body">
              <div className="ndm-row">
                <span className="ndm-label">User</span>
                <span className="ndm-value">{metadata.targetUserName || "Unknown"}</span>
              </div>
              {metadata.targetUserEmail && (
                <div className="ndm-row">
                  <span className="ndm-label">Email</span>
                  <span className="ndm-value">{metadata.targetUserEmail}</span>
                </div>
              )}
              <div className="ndm-row">
                <span className="ndm-label">Report reason</span>
                <span className="ndm-value">{REASON_LABELS[metadata.reason] || metadata.reason || "Not specified"}</span>
              </div>
              {metadata.details && (
                <div className="ndm-block">
                  <span className="ndm-label">Reporter's note</span>
                  <p className="ndm-details">{metadata.details}</p>
                </div>
              )}
              <div className="ndm-row">
                <span className="ndm-label">Escalated by</span>
                <span className="ndm-value">{metadata.escalatedBy || "Moderator"}</span>
              </div>
              <div className="ndm-row">
                <span className="ndm-label">Date</span>
                <span className="ndm-value">{formatDate(metadata.escalatedAt)}</span>
              </div>
            </div>
          </>
        );

      case 'post_deleted':
        return (
          <>
            <div className="ndm-header">
              <div className="ndm-header-icon" style={{ color: "#dc2626", background: "#fee2e2" }}>
                <FaTrash />
              </div>
              <h2>Post Removed</h2>
            </div>
            <div className="ndm-body">
              <div className="ndm-row">
                <span className="ndm-label">Post</span>
                <span className="ndm-value">"{metadata.postTitle || "Untitled"}"</span>
              </div>
              {metadata.postCategory && (
                <div className="ndm-row">
                  <span className="ndm-label">Category</span>
                  <span className="ndm-value" style={{ textTransform: "capitalize" }}>{metadata.postCategory}</span>
                </div>
              )}
              <div className="ndm-row">
                <span className="ndm-label">Date</span>
                <span className="ndm-value">{formatDate(metadata.deletedAt)}</span>
              </div>
              {metadata.postDescription && (
                <div className="ndm-block">
                  <span className="ndm-label">Post description</span>
                  <p className="ndm-details">{metadata.postDescription}</p>
                </div>
              )}
              {metadata.reason && (
                <div className="ndm-block">
                  <span className="ndm-label">Reason for removal</span>
                  <p className="ndm-details">{metadata.reason}</p>
                </div>
              )}
            </div>
          </>
        );

      case 'promoted':
      case 'demoted':
        const newRole = metadata.newRole || "member";
        const oldRole = metadata.oldRole || "member";
        const isPromoted = type === "promoted";
        const headerColor = isPromoted ? "#168565" : "#a16207";
        const headerBg = isPromoted ? "#d8f3e9" : "#fef9c3";

        return (
          <>
            <div className="ndm-header">
              <div className="ndm-header-icon" style={{ color: headerColor, background: headerBg }}>
                {getRoleIcon(newRole)}
              </div>
              <h2>
                {isPromoted
                  ? `Promoted to ${getRoleLabel(newRole)}`
                  : `Role Changed to ${getRoleLabel(newRole)}`}
              </h2>
            </div>
            <div className="ndm-body">
              <div className="ndm-row">
                <span className="ndm-label">Old role</span>
                <span className="ndm-value" style={{ display: "inline-flex", alignItems: "center", gap: 6, textTransform: "capitalize" }}>
                  {getRoleIcon(oldRole)} {getRoleLabel(oldRole)}
                </span>
              </div>
              <div className="ndm-row">
                <span className="ndm-label">New role</span>
                <span className="ndm-value" style={{ display: "inline-flex", alignItems: "center", gap: 6, textTransform: "capitalize" }}>
                  {getRoleIcon(newRole)} {getRoleLabel(newRole)}
                </span>
              </div>
              <div className="ndm-row">
                <span className="ndm-label">Date</span>
                <span className="ndm-value">{formatDate(metadata.changedAt)}</span>
              </div>
              {metadata.reason && (
                <div className="ndm-block" style={{ borderLeft: `3px solid ${headerColor}`, background: headerBg }}>
                  <span className="ndm-label">
                    {isPromoted ? "Reason for promotion" : "Reason for demotion"}
                  </span>
                  <p className="ndm-details">{metadata.reason}</p>
                </div>
              )}
            </div>
          </>
        );

      default:
        return (
          <>
            <div className="ndm-header">
              <div className="ndm-header-icon" style={{ color: "#2639ba", background: "#eef0ff" }}>
                <FaFlag />
              </div>
              <h2>{title}</h2>
            </div>
            <div className="ndm-body">
              <div className="ndm-block">
                <span className="ndm-label">Message</span>
                <p className="ndm-details">{message}</p>
              </div>
            </div>
          </>
        );
    }
  };

  return createPortal(
    <div className="ndm-overlay" onClick={onClose}>
      <div className="ndm-card" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="ndm-close"
          onClick={onClose}
          aria-label="Close"
        >
          <FaTimes />
        </button>

        {renderContent()}

        <div className="ndm-footer">
          <span className="ndm-timestamp">{formatDate(createdAt)}</span>
          <div className="ndm-actions">
            <button type="button" className="button" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default NotificationDetailModal;