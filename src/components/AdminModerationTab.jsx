import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FaTrash, FaCheck, FaSearch, FaShieldAlt, FaExclamationTriangle } from "react-icons/fa";
import { getReports, updateReportStatus, deletePost } from "../api";
import ConfirmDialog from "./ConfirmDialog";

function AdminModerationTab() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [actionId, setActionId] = useState("");
  const [confirmDialog, setConfirmDialog] = useState(null);
  const token = localStorage.getItem("token");

  const loadReports = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await getReports({ status: "escalated" }, token);
      setReports(res.data);
    } catch {
      setError("Could not load escalated reports.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleResolve = (report) => {
    setConfirmDialog({
      title: "Resolve report",
      message: `Mark the report on "${report.post?.title || "this item"}" as resolved?`,
      confirmLabel: "Resolve",
      tone: "info",
      inputLabel: "Admin note (optional)",
      inputPlaceholder: "Reason for resolution",
      inputRequired: false,
      onConfirm: async (reason) => {
        setActionId(report._id);
        try {
          await updateReportStatus(report._id, { status: "resolved", adminNote: reason }, token);
          await loadReports();
        } catch (err) {
          setError("Could not resolve report.");
        } finally {
          setActionId("");
          setConfirmDialog(null);
        }
      },
    });
  };

  const handleDeletePost = (report) => {
    setConfirmDialog({
      title: "Delete post",
      message: `Permanently delete the post "${report.post?.title || "this item"}" and resolve the report?`,
      confirmLabel: "Delete post",
      tone: "danger",
      inputLabel: "Reason for deletion",
      inputPlaceholder: "Violation of guidelines",
      inputRequired: true,
      inputMinLength: 5,
      onConfirm: async (reason) => {
        setActionId(report._id);
        try {
          await deletePost(report.post._id, { reason }, token);
          await updateReportStatus(report._id, { status: "resolved", adminNote: reason }, token);
          await loadReports();
        } catch (err) {
          setError("Could not delete post.");
        } finally {
          setActionId("");
          setConfirmDialog(null);
        }
      },
    });
  };

  const filteredReports = reports.filter((r) => {
    const q = search.toLowerCase();
    return (
      (r.post?.title || "").toLowerCase().includes(q) ||
      (r.reason || "").toLowerCase().includes(q)
    );
  });

  return (
    <section className="superadmin-section">
      {error && <p className="alert" style={{ marginBottom: 16 }}>{error}</p>}

      <div className="admin-search-bar">
        <FaSearch className="admin-search-icon" aria-hidden="true" />
        <input
          type="text"
          placeholder="Search escalated reports..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="admin-section-title">
        <h2>Escalated Reports (Admin Moderation)</h2>
        <span>{filteredReports.length} reports</span>
      </div>

      {loading ? (
        <div className="empty-state"><p>Loading reports...</p></div>
      ) : filteredReports.length === 0 ? (
        <div className="empty-state">
          <FaShieldAlt size={40} style={{ color: "#9ca3af", marginBottom: 16 }} />
          <h2>No escalated reports</h2>
          <p>Everything is clear. Moderators have handled the reports.</p>
        </div>
      ) : (
        <div className="admin-post-list">
          {filteredReports.map((report) => (
            <article className="admin-report-row" key={report._id}>
              <div className="admin-report-info">
                <div className="tag-row">
                  <span className="report-status report-status-escalated">
                    <FaExclamationTriangle /> Escalated
                  </span>
                  <span className="tag tag-danger">{report.reason}</span>
                </div>
                <h3>{report.post?.title || "Deleted post"}</h3>
                <p>
                  By {report.post?.owner?.name || "Unknown"} · reported by {report.reporter?.name || "Unknown"}
                </p>
                {report.details && <p className="admin-report-details">"{report.details}"</p>}
              </div>

              <div className="admin-report-actions">
                <Link className="button-secondary" to={`/posts/${report.post?._id}`}>
                  View Post
                </Link>
                <button
                  className="button-secondary"
                  onClick={() => handleResolve(report)}
                  disabled={actionId === report._id}
                >
                  <FaCheck /> Resolve
                </button>
                <button
                  className="button-danger"
                  onClick={() => handleDeletePost(report)}
                  disabled={actionId === report._id}
                >
                  <FaTrash /> Delete Post
                </button>
              </div>
            </article>
          ))}
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

export default AdminModerationTab;