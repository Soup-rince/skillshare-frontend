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
  FaTimesCircle,
  FaShieldAlt,
  FaUserTie,
  FaChevronLeft,
  FaChevronRight
} from "react-icons/fa";
import { getAuditLogs, exportAuditLogs } from "../api";

const ACTION_ICONS = {
  suspend_user: FaBan,
  unsuspend_user: FaCheck,
  promote_admin: FaUserShield,
  demote_admin: FaUser,
  promote_moderator: FaUserTie,
  demote_to_member: FaUser,
  promote_super_admin: FaCrown,
  demote_super_admin: FaUserShield,
  delete_post: FaTrash,
  delete_message: FaTrash,
  resolve_report: FaCheck,
  escalate_report: FaShieldAlt,
  dismiss_report: FaTimesCircle,
  login_success: FaSignInAlt,
  login_failed: FaTimesCircle,
  password_reset: FaKey,
  email_verified: FaEnvelopeOpenText,
  register: FaUserPlus,
  report_post: FaFlag,
  report_user: FaFlag,
  report_message: FaFlag
};

const ACTION_COLORS = {
  suspend_user: "#dc2626",
  unsuspend_user: "#168565",
  promote_admin: "#168565",
  demote_admin: "#a16207",
  promote_moderator: "#168565",
  demote_to_member: "#a16207",
  promote_super_admin: "#7c3aed",
  demote_super_admin: "#a16207",
  delete_post: "#dc2626",
  delete_message: "#dc2626",
  resolve_report: "#166534",
  escalate_report: "#d97706",
  dismiss_report: "#6b7280",
  login_success: "#2639ba",
  login_failed: "#dc2626",
  password_reset: "#f59e0b",
  email_verified: "#168565",
  register: "#2639ba",
  report_post: "#ad2438",
  report_user: "#ad2438",
  report_message: "#ad2438"
};

const ACTION_LABELS = {
  suspend_user: "Suspended user",
  unsuspend_user: "Unsuspended user",
  promote_admin: "Promoted to admin",
  demote_admin: "Demoted to member",
  promote_moderator: "Promoted to moderator",
  demote_to_member: "Demoted to member",
  promote_super_admin: "Promoted to super admin",
  demote_super_admin: "Demoted to admin",
  delete_post: "Deleted post",
  delete_message: "Deleted message",
  resolve_report: "Resolved report",
  escalate_report: "Escalated report",
  dismiss_report: "Dismissed report",
  login_success: "Logged in",
  login_failed: "Failed login attempt",
  password_reset: "Reset password",
  email_verified: "Verified email",
  register: "Registered account",
  report_post: "Reported post",
  report_user: "Reported user",
  report_message: "Reported message"
};

const ACTOR_ROLES = [
  { value: "", label: "All roles" },
  { value: "member", label: "Member" },
  { value: "moderator", label: "Moderator" },
  { value: "admin", label: "Admin" },
  { value: "super_admin", label: "Super admin" }
];

const ACTION_OPTIONS = [
  { value: "", label: "All actions" },
  ...Object.keys(ACTION_LABELS).map((key) => ({ value: key, label: ACTION_LABELS[key] }))
];

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
  const [actorRole, setActorRole] = useState("");
  const [action, setAction] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [exporting, setExporting] = useState(false);
  const token = localStorage.getItem("token");

  const PAGE_SIZE = 50;

  const loadLogs = async (overrides = {}) => {
    try {
      setLoading(true);
      setError("");
      const p = {
        page: overrides.page ?? page,
        limit: PAGE_SIZE
      };
      if (fromDate) p.from = fromDate;
      if (toDate) p.to = toDate;
      if (search.trim()) p.search = search.trim();
      if (actorRole) p.actorRole = actorRole;
      if (action) p.action = action;

      const res = await getAuditLogs(p, token);
      const payload = res.data;
      if (Array.isArray(payload)) {
        setLogs(payload);
        setTotal(payload.length);
        setTotalPages(1);
      } else {
        setLogs(payload.logs || []);
        setTotal(payload.total || 0);
        setTotalPages(payload.totalPages || 1);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Could not load audit logs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      loadLogs({ page: 1 });
    }, 350);
    return () => clearTimeout(t);
  }, [search, actorRole, action]);

  const handleApplyDateFilter = () => {
    setPage(1);
    loadLogs({ page: 1 });
  };

  const handleClearAll = () => {
    setSearch("");
    setActorRole("");
    setAction("");
    setFromDate("");
    setToDate("");
    setPage(1);
    setTimeout(() => loadLogs({ page: 1 }), 0);
  };

  const goToPage = (p) => {
    const next = Math.min(Math.max(1, p), totalPages);
    setPage(next);
    loadLogs({ page: next });
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

  const groupedLogs = groupLogsByDate(logs);
  const hasActiveFilters = search || actorRole || action || fromDate || toDate;

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
          onClick={handleApplyDateFilter}
        >
          Apply
        </button>
        {hasActiveFilters && (
          <button
            type="button"
            className="button-ghost"
            onClick={handleClearAll}
          >
            Clear all
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
          placeholder="Search by actor, action, or target"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div
        className="audit-filter-row"
        style={{
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          marginBottom: 16
        }}
      >
        <div className="audit-date-group">
          <label htmlFor="audit-role">Actor role</label>
          <select
            id="audit-role"
            value={actorRole}
            onChange={(e) => setActorRole(e.target.value)}
          >
            {ACTOR_ROLES.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>
        <div className="audit-date-group">
          <label htmlFor="audit-action">Action type</label>
          <select
            id="audit-action"
            value={action}
            onChange={(e) => setAction(e.target.value)}
          >
            {ACTION_OPTIONS.map((a) => (
              <option key={a.value} value={a.value}>{a.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="admin-section-title">
        <h2>Audit log</h2>
        <span>{total} entries</span>
      </div>

      {loading ? (
        <div className="empty-state"><p>Loading audit logs...</p></div>
      ) : logs.length === 0 ? (
        <div className="empty-state">
          <p>{hasActiveFilters ? "No entries match your filters." : "No audit log entries yet."}</p>
        </div>
      ) : (
        <>
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
                            {log.details.originalContent && (
                              <span className="audit-log-detail-item">
                                <strong>Original message:</strong> "{log.details.originalContent}"
                              </span>
                            )}
                            {log.details.senderName && (
                              <span className="audit-log-detail-item">
                                <strong>Sender:</strong> {log.details.senderName}
                              </span>
                            )}
                            {log.details.bulk && (
                              <span className="audit-log-detail-item">
                                <strong>Bulk action</strong>
                              </span>
                            )}
                          </div>
                        )}
                        <div className="audit-log-meta">
                          <span className="audit-log-time">{formatTime(log.createdAt)}</span>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div
              className="audit-pagination"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
                marginTop: 24
              }}
            >
              <button
                type="button"
                className="button-secondary"
                onClick={() => goToPage(page - 1)}
                disabled={page <= 1 || loading}
              >
                <FaChevronLeft aria-hidden="true" /> Prev
              </button>
              <span>Page {page} of {totalPages}</span>
              <button
                type="button"
                className="button-secondary"
                onClick={() => goToPage(page + 1)}
                disabled={page >= totalPages || loading}
              >
                Next <FaChevronRight aria-hidden="true" />
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}

export default AuditLogTab;