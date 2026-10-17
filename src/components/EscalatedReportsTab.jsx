import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FaSearch,
  FaShieldAlt,
  FaUser,
  FaCheck,
  FaBan,
  FaExclamationTriangle
} from "react-icons/fa";
import { getEscalatedReports, updateModeratorReportStatus } from "../api";
import ConfirmDialog from "./ConfirmDialog";

function getInitials(name) {
  if (!name) return "?";
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function getAvatarColor(name) {
  const palette = ["#2639ba", "#087b75", "#7c3aed", "#c2410c", "#be123c", "#0369a1"];
  if (!name) return palette[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return palette[Math.abs(hash) % palette.length];
}

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

function EscalatedReportsTab() {
  const [reports, setReports] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionId, setActionId] = useState("");
  const [confirmDialog, setConfirmDialog] = useState(null);
  const token = localStorage.getItem("token");

  const loadReports = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await getEscalatedReports(token);
      setReports(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load escalated reports.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleDismiss = (report) => {
    setConfirmDialog({
      title: "Dismiss this escalation?",
      message: `The escalation on "${report.targetUser?.name || "this user"}" will be marked as dismissed. No action will be taken.`,
      confirmLabel: "Dismiss",
      cancelLabel: "Cancel",
      tone: "info",
      inputLabel: "Note (optional)",
      inputPlaceholder: "Why is this escalation being dismissed?",
      inputRequired: false,
      inputMinLength: 0,
      onConfirm: async (reason) => {
        setActionId(report._id);
        try {
          await updateModeratorReportStatus(
            report._id,
            { status: "dismissed", reason: reason || "" },
            token
          );
          setReports((current) => current.filter((r) => r._id !== report._id));
        } catch (err) {
          setError(err.response?.data?.message || "Could not dismiss this report.");
        } finally {
          setActionId("");
          setConfirmDialog(null);
        }
      }
    });
  };

  const filteredReports = reports.filter((r) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      (r.targetUser?.name || "").toLowerCase().includes(q) ||
      (r.targetUser?.email || "").toLowerCase().includes(q) ||
      (r.reporter?.name || "").toLowerCase().includes(q) ||
      (r.reason || "").toLowerCase().includes(q) ||
      (r.resolvedBy?.name || "").toLowerCase().includes(q)
    );
  });

  return (
    <section className="admin-users">
      {error && <p className="alert" style={{ marginBottom: 16 }}>{error}</p>}

      <div className="admin-search-bar">
        <FaSearch className="admin-search-icon" aria-hidden="true" />
        <input
          type="text"
          placeholder="Search escalated reports by user, reporter, reason, or moderator"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="admin-section-title">
        <h2>
          <FaShieldAlt aria-hidden="true" style={{ marginRight: 8 }} />
          Escalated users
        </h2>
        <span>{filteredReports.length} escalated</span>
      </div>

      {loading ? (
        <div className="empty-state"><p>Loading escalated reports...</p></div>
      ) : filteredReports.length === 0 ? (
        <div className="empty-state">
          <FaExclamationTriangle style={{ fontSize: "2rem", color: "#d97706", marginBottom: 12 }} />
          <h2>No escalated reports</h2>
          <p>Moderators have not escalated any user reports to you yet.</p>
        </div>
      ) : (
        <div className="admin-post-list">
          {filteredReports.map((report) => {
            const isSuspended = report.targetUser?.isSuspended;
            return (
              <article className="admin-user-row" key={report._id}>
                <div className="admin-user-info">
                  <span
                    className="admin-user-avatar"
                    style={{ background: getAvatarColor(report.targetUser?.name) }}
                    aria-hidden="true"
                  >
                    {getInitials(report.targetUser?.name)}
                  </span>

                  <div className="admin-user-details">
                    <div className="admin-user-name-row">
                      <h3>{report.targetUser?.name || "Deleted user"}</h3>
                      <span className="tag tag-danger">
                        <FaShieldAlt /> Escalated
                      </span>
                      {isSuspended && (
                        <span className="suspended-badge">
                          <FaBan /> Suspended
                        </span>
                      )}
                    </div>

                    <p className="admin-user-email">
                      {report.targetUser?.email || "No email"}
                    </p>

                    <p className="admin-user-meta">
                      Reason: <strong>{REASON_LABELS[report.reason] || report.reason}</strong>
                    </p>

                    {report.details && (
                      <p className="admin-report-details" style={{ marginTop: 6 }}>
                        "{report.details}"
                      </p>
                    )}

                    {report.adminNote && (
                      <p className="admin-report-note" style={{ marginTop: 6 }}>
                        Moderator note: {report.adminNote}
                      </p>
                    )}

                    <p className="admin-user-meta" style={{ marginTop: 6 }}>
                      Reported by {report.reporter?.name || "Unknown"} · Escalated by{" "}
                      {report.resolvedBy?.name || "Moderator"} ·{" "}
                      {formatDate(report.resolvedAt || report.updatedAt)}
                    </p>
                  </div>
                </div>

                <div className="admin-user-actions">
                  <Link
                    className="button-secondary"
                    to={`/profile/${report.targetUser?._id}`}
                  >
                    <FaUser aria-hidden="true" />
                    <span>View profile</span>
                  </Link>
                  <button
                    className="button-secondary"
                    type="button"
                    onClick={() => handleDismiss(report)}
                    disabled={actionId === report._id}
                  >
                    <FaCheck aria-hidden="true" />
                    <span>Dismiss</span>
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
        inputLabel={confirmDialog?.inputLabel}
        inputPlaceholder={confirmDialog?.inputPlaceholder}
        inputRequired={confirmDialog?.inputRequired}
        inputMinLength={confirmDialog?.inputMinLength}
        onConfirm={confirmDialog?.onConfirm || (() => {})}
        onCancel={() => setConfirmDialog(null)}
      />
    </section>
  );
}

export default EscalatedReportsTab;