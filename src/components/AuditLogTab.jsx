import { useState, useEffect } from "react";
import {
  FaSearch,
  FaDownload,
  FaUserShield,
  FaUser,
  FaBan,
  FaTrash,
  FaCheck,
  FaFlag,
  FaSignInAlt,
  FaUserPlus,
  FaEnvelopeOpenText,
  FaKey,
  FaCrown,
  FaTimesCircle
} from "react-icons/fa";
import { getAuditLogs, exportAuditLogs } from "../api";

const ACTION_ICONS = {
  suspend_user: FaBan,
  unsuspend_user: FaCheck,
  promote_admin: FaUserShield,
  demote_admin: FaUser,
  promote_super_admin: FaCrown,
  demote_super_admin: FaUserShield,
  delete_post: FaTrash,
  resolve_report: FaCheck,
  dismiss_report: FaTimesCircle,
  login_success: FaSignInAlt,
  login_failed: FaTimesCircle,
  password_reset: FaKey,
  email_verified: FaEnvelopeOpenText,
  register: FaUserPlus
};

const ACTION_COLORS = {
  suspend_user: "#dc2626",
  unsuspend_user: "#168565",
  promote_admin: "#168565",
  demote_admin: "#a16207",
  promote_super_admin: "#7c3aed",
  demote_super_admin: "#a16207",
  delete_post: "#dc2626",
  resolve_report: "#166534",
  dismiss_report: "#6b7280",
  login_success: "#2639ba",
  login_failed: "#dc2626",
  password_reset: "#f59e0b",
  email_verified: "#168565",
  register: "#2639ba"
};

const ACTION_LABELS = {
  suspend_user: "Suspended user",
  unsuspend_user: "Unsuspended user",
  promote_admin: "Promoted to admin",
  demote_admin: "Demoted to member",
  promote_super_admin: "Promoted to super admin",
  demote_super_admin: "Demoted to admin",
  delete_post: "Deleted post",
  resolve_report: "Resolved report",
  dismiss_report: "Dismissed report",
  login_success: "Logged in",
  login_failed: "Failed login attempt",
  password_reset: "Reset password",
  email_verified: "Verified email",
  register: "Registered account"
};

function formatDateLabel(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const logDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());

  if (logDate.getTime() === today.getTime()) return "Today";
  if (logDate.getTime() === yesterday.getTime()) return "Yesterday";
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function formatTime(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function groupLogsByDate(logs) {
  const groups = [];
  let currentLabel = null;
  let currentGroup = null;

  logs.forEach((log) => {
    const label = formatDateLabel(log.createdAt);
    if (label !== currentLabel) {
      currentLabel = label;
      currentGroup = { label, logs: [] };
      groups.push(currentGroup);
    }
    currentGroup.logs.push(log);
  });

  return groups;
}

function AuditLogTab() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [exporting, setExporting] = useState(false);
  const token = localStorage.getItem("token");

  const loadLogs = async () => {
    try {
      setLoading(true);
      setError("");
      const params = {};
      if (fromDate) params.from = fromDate;
      if (toDate) params.to = toDate;
      const res = await getAuditLogs(params, token);
      setLogs(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load audit logs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const handleApplyFilter = () => {
    loadLogs();
  };

  const handleClearFilter = () => {
    setFromDate("");
    setToDate("");
    setTimeout(() => {
      loadLogs();
    }, 0);
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      setError("");
      const params = {};
      if (fromDate) params.from = fromDate;
      if (toDate) params.to = toDate;
      const res = await exportAuditLogs(params, token);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `audit-logs-${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError("Could not export audit logs.");
    } finally {
      setExporting(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      (log.actorName || "").toLowerCase().includes(q) ||
      (log.actorRole || "").toLowerCase().includes(q) ||
      (log.action || "").toLowerCase().includes(q) ||
      (log.targetName || "").toLowerCase().includes(q) ||
      (log.ipAddress || "").toLowerCase().includes(q)
    );
  });

  const groupedLogs = groupLogsByDate(filteredLogs);

  return (
    <section className="superadmin-section">
      {error && <p className="alert" style={{ marginBottom: 16 }}>{error}</p>}

      <div className="audit-filters">
        <div className="audit-date-group">
          <label htmlFor="audit-from">From</label>
          <input
            id="audit-from"
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
        </div>
        <div className="audit-date-group">
          <label htmlFor="audit-to">To</label>
          <input
            id="audit-to"
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </div>
        <button
          type="button"
          className="button-secondary"
          onClick={handleApplyFilter}
        >
          Apply
        </button>
        {(fromDate || toDate) && (
          <button
            type="button"
            className="button-ghost"
            onClick={handleClearFilter}
          >
            Clear
          </button>
        )}
        <button
          type="button"
          className="button"
          onClick={handleExport}
          disabled={exporting}
          style={{ marginLeft: "auto" }}
        >
          <FaDownload aria-hidden="true" />
          <span>{exporting ? "Exporting..." : "Export CSV"}</span>
        </button>
      </div>

      <div className="admin-search-bar">
        <FaSearch className="admin-search-icon" aria-hidden="true" />
        <input
          type="text"
          placeholder="Search by actor, action, target, or IP"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="admin-section-title">
        <h2>Audit log</h2>
        <span>{filteredLogs.length} entries</span>
      </div>

      {loading ? (
        <div className="empty-state"><p>Loading audit logs...</p></div>
      ) : filteredLogs.length === 0 ? (
        <div className="empty-state">
          <p>{logs.length === 0 ? "No audit log entries yet." : "No entries match your search."}</p>
        </div>
      ) : (
        <div className="audit-log-list">
          {groupedLogs.map((group) => (
            <div key={group.label} className="audit-log-group">
              <div className="audit-log-date-divider">
                <span>{group.label}</span>
              </div>
              {group.logs.map((log) => {
                const IconComponent = ACTION_ICONS[log.action] || FaUser;
                const color = ACTION_COLORS[log.action] || "#66708a";
                const label = ACTION_LABELS[log.action] || log.action;
                return (
                  <article className="audit-log-item" key={log._id}>
                    <span
                      className="audit-log-icon"
                      style={{ background: `${color}15`, color }}
                    >
                      <IconComponent />
                    </span>
                    <div className="audit-log-body">
                      <div className="audit-log-headline">
                        <strong>{log.actorName || "Unknown"}</strong>
                        <span className={`audit-log-role audit-log-role-${log.actorRole}`}>
                          {log.actorRole || "unknown"}
                        </span>
                        <span className="audit-log-action">{label}</span>
                        {log.targetName && (
                          <span className="audit-log-target">→ {log.targetName}</span>
                        )}
                      </div>
                      {log.details && Object.keys(log.details).length > 0 && (
                        <div className="audit-log-details">
                          {log.details.reason && (
                            <span className="audit-log-detail-item">
                              <strong>Reason:</strong> {log.details.reason}
                            </span>
                          )}
                          {log.details.oldRole && log.details.newRole && (
                            <span className="audit-log-detail-item">
                              <strong>Role:</strong> {log.details.oldRole} → {log.details.newRole}
                            </span>
                          )}
                          {log.details.targetEmail && (
                            <span className="audit-log-detail-item">
                              <strong>Email:</strong> {log.details.targetEmail}
                            </span>
                          )}
                          {log.details.postTitle && (
                            <span className="audit-log-detail-item">
                              <strong>Post:</strong> {log.details.postTitle}
                            </span>
                          )}
                        </div>
                      )}
                      <div className="audit-log-meta">
                        <span className="audit-log-time">{formatTime(log.createdAt)}</span>
                        {log.ipAddress && (
                          <span className="audit-log-ip">IP: {log.ipAddress}</span>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default AuditLogTab;