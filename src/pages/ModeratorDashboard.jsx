import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  FaTrash, FaCheck, FaSearch, FaHistory, FaFlag, FaUser, FaFileAlt,
  FaShieldAlt, FaChartBar, FaTimes, FaAngleLeft, FaAngleRight
} from "react-icons/fa";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import {
  checkModerator,
  getSkillPosts,
  deletePost,
  getModeratorReports,
  updateModeratorReportStatus,
  deleteMessageByModerator,
  getModeratorStats,
  bulkUpdateReportStatus,
} from "../api";
import ModeratorActivityTab from "../components/ModeratorActivityTab";
import ConfirmDialog from "../components/ConfirmDialog";
import ReportedMessageModal from "../components/ReportedMessageModal";

function ModeratorDashboard() {
  const [accessGranted, setAccessGranted] = useState(null);
  const [posts, setPosts] = useState([]);
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState("posts");
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState("");
  const [reportActionId, setReportActionId] = useState("");
  const [postSearch, setPostSearch] = useState("");
  const [reportSearch, setReportSearch] = useState("");
  const [reportTypeFilter, setReportTypeFilter] = useState("all");
  const [reportStatusFilter, setReportStatusFilter] = useState("all");
  const [reportReasonFilter, setReportReasonFilter] = useState("all");
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [previewReport, setPreviewReport] = useState(null);

  // Bulk selection state
  const [selectedPostIds, setSelectedPostIds] = useState([]);
  const [selectedReportIds, setSelectedReportIds] = useState([]);

  const token = localStorage.getItem("token");

  const loadModeratorData = async () => {
    await checkModerator(token);
    const [postsResponse, reportsResponse, statsResponse] = await Promise.all([
      getSkillPosts(),
      getModeratorReports({}, token),
      getModeratorStats(token).catch(() => ({ data: null })),
    ]);
    setPosts(postsResponse.data);
    setReports(reportsResponse.data);
    if (statsResponse?.data) setStats(statsResponse.data);
  };

  useEffect(() => {
    const init = async () => {
      try {
        await loadModeratorData();
        setAccessGranted(true);
      } catch (err) {
        setAccessGranted(false);
        setError(
          err.response?.data?.message ||
            "You do not have permission to access this page."
        );
      }
    };
    init();
  }, [token]);

  // Reset selections on tab change
  useEffect(() => {
    setSelectedPostIds([]);
    setSelectedReportIds([]);
  }, [activeTab]);

  const handleDelete = (postId, postTitle) => {
    setConfirmDialog({
      title: "Delete this post?",
      message: `The post "${postTitle}" will be permanently deleted. This action cannot be undone. The post owner will be notified.`,
      confirmLabel: "Delete post",
      cancelLabel: "Cancel",
      tone: "danger",
      inputLabel: "Reason for deletion",
      inputPlaceholder: "Why is this post being deleted?",
      inputRequired: true,
      inputMinLength: 5,
      onConfirm: async (reason) => {
        setDeletingId(postId);
        setError("");
        try {
          await deletePost(postId, { reason }, token);
          setPosts((currentPosts) =>
            currentPosts.filter((post) => post._id !== postId)
          );
          setReports((currentReports) =>
            currentReports.filter((r) => r.post?._id !== postId)
          );
        } catch (err) {
          setError(
            err.response?.data?.message || "Unable to delete this post."
          );
        } finally {
          setDeletingId("");
          setConfirmDialog(null);
        }
      }
    });
  };

  const handleBulkDeletePosts = async () => {
    if (selectedPostIds.length === 0) return;
    setConfirmDialog({
      title: `Delete ${selectedPostIds.length} posts?`,
      message: `You are about to permanently delete ${selectedPostIds.length} posts. This action cannot be undone.`,
      confirmLabel: "Delete all",
      cancelLabel: "Cancel",
      tone: "danger",
      inputLabel: "Reason for deletion (applies to all)",
      inputPlaceholder: "Why are these posts being deleted?",
      inputRequired: true,
      inputMinLength: 5,
      onConfirm: async (reason) => {
        setError("");
        try {
          await Promise.all(
            selectedPostIds.map((id) => deletePost(id, { reason }, token))
          );
          setPosts((current) => current.filter((p) => !selectedPostIds.includes(p._id)));
          setReports((current) => current.filter((r) => !selectedPostIds.includes(r.post?._id)));
          setSelectedPostIds([]);
        } catch (err) {
          setError(err.response?.data?.message || "Unable to bulk delete posts.");
        } finally {
          setConfirmDialog(null);
        }
      }
    });
  };

  const handleReportAction = (reportId, action) => {
    const report = reports.find((r) => r._id === reportId);
    const isUserReport = report?.targetType === "user";
    const isMessageReport = report?.targetType === "message";
    const targetLabel = isUserReport
      ? report?.targetUser?.name || "the reported user"
      : isMessageReport
        ? `message from ${report?.targetUser?.name || "a user"}`
        : report?.post?.title || "the reported post";

    if (action === "dismiss") {
      setConfirmDialog({
        title: "Dismiss this report?",
        message: `The report on "${targetLabel}" will be marked as dismissed. No action will be taken.`,
        confirmLabel: "Dismiss report",
        cancelLabel: "Cancel",
        tone: "info",
        inputLabel: "Note to reporter (optional)",
        inputPlaceholder: "Leave blank for default message",
        inputRequired: false,
        inputMinLength: 0,
        onConfirm: async (reason) => {
          setReportActionId(reportId);
          setError("");
          try {
            const res = await updateModeratorReportStatus(
              reportId,
              { status: "dismissed", reason: reason || "" },
              token
            );
            setReports((current) =>
              current.map((r) => (r._id === reportId ? { ...r, ...res.data } : r))
            );
            await loadStats();
          } catch (err) {
            setError(err.response?.data?.message || "Unable to update this report.");
          } finally {
            setReportActionId("");
            setConfirmDialog(null);
          }
        }
      });
    } else if (action === "delete" && !isUserReport && !isMessageReport) {
      setConfirmDialog({
        title: "Delete this post?",
        message: `The post "${targetLabel}" will be permanently deleted and the report will be resolved. This action cannot be undone.`,
        confirmLabel: "Delete post",
        cancelLabel: "Cancel",
        tone: "danger",
        inputLabel: "Reason for deletion",
        inputPlaceholder: "Why is this post being deleted?",
        inputRequired: true,
        inputMinLength: 5,
        onConfirm: async (reason) => {
          setReportActionId(reportId);
          setError("");
          try {
            if (!report?.post?._id) return;
            await deletePost(report.post._id, { reason }, token);
            await updateModeratorReportStatus(
              reportId,
              { status: "resolved", reason: reason },
              token
            );
            setPosts((current) =>
              current.filter((p) => p._id !== report.post._id)
            );
            setReports((current) =>
              current.map((r) =>
                r._id === reportId
                  ? { ...r, status: "resolved", adminNote: reason }
                  : r
              )
            );
            await loadStats();
          } catch (err) {
            setError(err.response?.data?.message || "Unable to update this report.");
          } finally {
            setReportActionId("");
            setConfirmDialog(null);
          }
        }
      });
    } else if (action === "resolve_user" && !isMessageReport) {
      setConfirmDialog({
        title: "Warn this user?",
        message: `The report on "${targetLabel}" will be marked as resolved. The user will receive a warning notification.`,
        confirmLabel: "Send warning",
        cancelLabel: "Cancel",
        tone: "info",
        inputLabel: "Message to user (optional)",
        inputPlaceholder: "e.g. Please review our community guidelines",
        inputRequired: false,
        inputMinLength: 0,
        onConfirm: async (reason) => {
          setReportActionId(reportId);
          setError("");
          try {
            const res = await updateModeratorReportStatus(
              reportId,
              { status: "resolved", reason: reason || "" },
              token
            );
            setReports((current) =>
              current.map((r) => (r._id === reportId ? { ...r, ...res.data } : r))
            );
            await loadStats();
          } catch (err) {
            setError(err.response?.data?.message || "Unable to update this report.");
          } finally {
            setReportActionId("");
            setConfirmDialog(null);
          }
        }
      });
    } else if (action === "escalate") {
      setConfirmDialog({
        title: "Escalate this report to admin?",
        message: `The report on "${targetLabel}" will be flagged for admin review. The admin team will decide whether to suspend the user. The reported user will NOT receive a warning.`,
        confirmLabel: "Escalate",
        cancelLabel: "Cancel",
        tone: "danger",
        inputLabel: "Note for admin (optional)",
        inputPlaceholder: "e.g. Multiple reports, repeated violations",
        inputRequired: false,
        inputMinLength: 0,
        onConfirm: async (reason) => {
          setReportActionId(reportId);
          setError("");
          try {
            const res = await updateModeratorReportStatus(
              reportId,
              { status: "escalated", reason: reason || "" },
              token
            );
            setReports((current) =>
              current.map((r) => (r._id === reportId ? { ...r, ...res.data } : r))
            );
            await loadStats();
          } catch (err) {
            setError(err.response?.data?.message || "Unable to escalate this report.");
          } finally {
            setReportActionId("");
            setConfirmDialog(null);
          }
        }
      });
    } else if (action === "delete_message") {
      setConfirmDialog({
        title: "Delete this message?",
        message: `The message from ${report?.targetUser?.name || "this user"} will be removed from the conversation. The sender will be notified with the reason you provide.`,
        confirmLabel: "Delete message",
        cancelLabel: "Cancel",
        tone: "danger",
        inputLabel: "Reason for deletion",
        inputPlaceholder: "e.g. Harassment, offensive language",
        inputRequired: true,
        inputMinLength: 5,
        onConfirm: async (reason) => {
          setReportActionId(reportId);
          setError("");
          try {
            await deleteMessageByModerator(report.message._id, { reason }, token);
            setReports((current) =>
              current.map((r) =>
                r._id === reportId
                  ? { ...r, status: "resolved", adminNote: reason }
                  : r
              )
            );
            await loadStats();
          } catch (err) {
            setError(err.response?.data?.message || "Unable to delete this message.");
          } finally {
            setReportActionId("");
            setConfirmDialog(null);
          }
        }
      });
    }
  };

  const handleBulkDismissReports = async () => {
    if (selectedReportIds.length === 0) return;
    setConfirmDialog({
      title: `Dismiss ${selectedReportIds.length} reports?`,
      message: `All selected reports will be marked as dismissed. No action will be taken.`,
      confirmLabel: "Dismiss all",
      cancelLabel: "Cancel",
      tone: "info",
      inputLabel: "Note to reporters (optional)",
      inputPlaceholder: "Leave blank for default message",
      inputRequired: false,
      inputMinLength: 0,
      onConfirm: async (reason) => {
        setError("");
        try {
          await bulkUpdateReportStatus(
            { reportIds: selectedReportIds, status: "dismissed", reason: reason || "" },
            token
          );
          setReports((current) =>
            current.map((r) =>
              selectedReportIds.includes(r._id)
                ? { ...r, status: "dismissed", adminNote: reason || "" }
                : r
            )
          );
          setSelectedReportIds([]);
          await loadStats();
        } catch (err) {
          setError(err.response?.data?.message || "Unable to bulk dismiss reports.");
        } finally {
          setConfirmDialog(null);
        }
      }
    });
  };

  const handleBulkEscalateReports = async () => {
    if (selectedReportIds.length === 0) return;
    setConfirmDialog({
      title: `Escalate ${selectedReportIds.length} reports?`,
      message: `All selected reports will be flagged for admin review.`,
      confirmLabel: "Escalate all",
      cancelLabel: "Cancel",
      tone: "danger",
      inputLabel: "Note for admin (optional)",
      inputPlaceholder: "e.g. Multiple reports, repeated violations",
      inputRequired: false,
      inputMinLength: 0,
      onConfirm: async (reason) => {
        setError("");
        try {
          await bulkUpdateReportStatus(
            { reportIds: selectedReportIds, status: "escalated", reason: reason || "" },
            token
          );
          setReports((current) =>
            current.map((r) =>
              selectedReportIds.includes(r._id)
                ? { ...r, status: "escalated", adminNote: reason || "" }
                : r
            )
          );
          setSelectedReportIds([]);
          await loadStats();
        } catch (err) {
          setError(err.response?.data?.message || "Unable to bulk escalate reports.");
        } finally {
          setConfirmDialog(null);
        }
      }
    });
  };

  const loadStats = async () => {
    try {
      const res = await getModeratorStats(token);
      setStats(res.data);
    } catch {
      // silent
    }
  };

  const togglePostSelection = (id) => {
    setSelectedPostIds((current) =>
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id]
    );
  };

  const toggleAllPosts = () => {
    if (selectedPostIds.length === filteredPosts.length) {
      setSelectedPostIds([]);
    } else {
      setSelectedPostIds(filteredPosts.map((p) => p._id));
    }
  };

  const toggleReportSelection = (id) => {
    setSelectedReportIds((current) =>
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id]
    );
  };

  const toggleAllReports = () => {
    const pendingReports = filteredReports.filter((r) => r.status === "pending");
    if (selectedReportIds.length === pendingReports.length && pendingReports.length > 0) {
      setSelectedReportIds([]);
    } else {
      setSelectedReportIds(pendingReports.map((r) => r._id));
    }
  };

  const filteredPosts = useMemo(() => {
    const q = postSearch.trim().toLowerCase();
    if (!q) return posts;
    return posts.filter((post) => {
      const titleMatch = (post.title || "").toLowerCase().includes(q);
      const ownerMatch = (post.owner?.name || "").toLowerCase().includes(q);
      return titleMatch || ownerMatch;
    });
  }, [posts, postSearch]);

  const filteredReports = useMemo(() => {
    let list = reports;

    if (reportTypeFilter === "posts") {
      list = list.filter((r) => r.targetType === "post" || !r.targetType);
    } else if (reportTypeFilter === "users") {
      list = list.filter((r) => r.targetType === "user");
    } else if (reportTypeFilter === "messages") {
      list = list.filter((r) => r.targetType === "message");
    }

    if (reportStatusFilter !== "all") {
      list = list.filter((r) => r.status === reportStatusFilter);
    }

    if (reportReasonFilter !== "all") {
      list = list.filter((r) => r.reason === reportReasonFilter);
    }

    const q = reportSearch.trim().toLowerCase();
    if (!q) return list;

    return list.filter((report) => {
      const isUser = report.targetType === "user";
      const isMessage = report.targetType === "message";
      const targetLabel = isUser
        ? (report.targetUser?.name || "").toLowerCase()
        : isMessage
          ? (report.message?.content || "").toLowerCase()
          : (report.post?.title || "").toLowerCase();
      const owner = isUser
        ? (report.targetUser?.email || "").toLowerCase()
        : (report.post?.owner?.name || "").toLowerCase();
      const reporter = (report.reporter?.name || "").toLowerCase();
      const reason = (report.reason || "").toLowerCase();
      return (
        targetLabel.includes(q) ||
        owner.includes(q) ||
        reporter.includes(q) ||
        reason.includes(q)
      );
    });
  }, [reports, reportSearch, reportTypeFilter, reportStatusFilter, reportReasonFilter]);

  const pendingReports = filteredReports.filter((r) => r.status === "pending");

  if (accessGranted === null) {
    return (
      <main className="page-container">
        <div className="empty-state">
          <p>Checking moderator access...</p>
        </div>
      </main>
    );
  }

  if (!accessGranted) {
    return (
      <main className="page-container">
        <div className="admin-denied">
          <p className="eyebrow">Restricted area</p>
          <h1>Moderator access required</h1>
          <p>{error}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="page-container">
      <header className="admin-heading">
        <div>
          <p className="eyebrow admin-eyebrow">Content moderation</p>
          <h1>Moderator Dashboard</h1>
          <p>Review community posts and manage inappropriate content.</p>
        </div>

        <span className="admin-badge">
          ● Moderator access verified
        </span>
      </header>

      {error && <p className="alert" style={{ marginBottom: 16 }}>{error}</p>}

      {/* ===== KPI CARDS ===== */}
      {stats && (
        <section className="dashboard-stats dashboard-stats-extended">
          <div className="stat-card">
            <span className="stat-icon" aria-hidden="true"><FaFlag /></span>
            <span className="stat-label">Total reports</span>
            <strong className="stat-value">{stats.totalReports}</strong>
          </div>
          <div className="stat-card">
            <span className="stat-icon" aria-hidden="true"><FaShieldAlt /></span>
            <span className="stat-label">Pending</span>
            <strong className={`stat-value ${stats.pendingReports > 0 ? "stat-value-alert" : ""}`}>
              {stats.pendingReports}
            </strong>
          </div>
          <div className="stat-card">
            <span className="stat-icon" aria-hidden="true"><FaCheck /></span>
            <span className="stat-label">Resolved (7d)</span>
            <strong className="stat-value">{stats.resolvedThisWeek}</strong>
          </div>
          <div className="stat-card">
            <span className="stat-icon" aria-hidden="true"><FaTrash /></span>
            <span className="stat-label">Deleted posts (7d)</span>
            <strong className="stat-value">{stats.deletedPostsThisWeek}</strong>
          </div>
        </section>
      )}

      {/* ===== CHART ===== */}
      {stats && stats.reportsByReason && stats.reportsByReason.length > 0 && (
        <section className="dashboard-chart-card" style={{ marginBottom: 24 }}>
          <h3 className="dashboard-chart-title">
            <FaChartBar aria-hidden="true" /> Reports by reason
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stats.reportsByReason} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="modBarGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4f5fc4" stopOpacity={1} />
                  <stop offset="100%" stopColor="#2639ba" stopOpacity={0.75} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f2f8" vertical={false} />
              <XAxis dataKey="reason" tick={{ fontSize: 11, fill: "#66708a" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#66708a" }} allowDecimals={false} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #e5e7eb", fontSize: 12 }} />
              <Bar dataKey="count" fill="url(#modBarGradient)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </section>
      )}

      <div className="admin-tabs">
        <button
          type="button"
          className={`admin-tab ${activeTab === "posts" ? "active" : ""}`}
          onClick={() => setActiveTab("posts")}
        >
          Post moderation
        </button>
        <button
          type="button"
          className={`admin-tab ${activeTab === "reports" ? "active" : ""}`}
          onClick={() => setActiveTab("reports")}
        >
          Reports {stats?.pendingReports > 0 && <span className="admin-tab-badge">{stats.pendingReports}</span>}
        </button>
        <button
          type="button"
          className={`admin-tab ${activeTab === "activity" ? "active" : ""}`}
          onClick={() => setActiveTab("activity")}
        >
          <FaHistory aria-hidden="true" />
          <span>My Activity</span>
        </button>
      </div>

      {activeTab === "posts" && (
        <section className="admin-posts">
          <div className="admin-search-bar">
            <FaSearch className="admin-search-icon" aria-hidden="true" />
            <input
              type="text"
              placeholder="Search posts by title or owner"
              value={postSearch}
              onChange={(e) => setPostSearch(e.target.value)}
            />
          </div>

          <div className="admin-section-title">
            <h2>Post moderation</h2>
            <span>
              {postSearch.trim()
                ? `${filteredPosts.length} of ${posts.length}`
                : `${posts.length} posts`}
            </span>
          </div>

          {filteredPosts.length > 0 && (
            <div className="bulk-actions-bar">
              <label className="bulk-checkbox-label">
                <input
                  type="checkbox"
                  checked={selectedPostIds.length === filteredPosts.length && filteredPosts.length > 0}
                  onChange={toggleAllPosts}
                />
                <span>Select all</span>
              </label>
              {selectedPostIds.length > 0 && (
                <>
                  <span className="bulk-selected-count">{selectedPostIds.length} selected</span>
                  <button
                    className="button-danger"
                    type="button"
                    onClick={handleBulkDeletePosts}
                  >
                    <FaTrash /> Delete selected
                  </button>
                </>
              )}
            </div>
          )}

          {posts.length === 0 ? (
            <div className="empty-state">
              <p>No posts are available for moderation.</p>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="empty-state">
              <p>No posts match your search.</p>
            </div>
          ) : (
            <div className="admin-post-list">
              {filteredPosts.map((post) => (
                <article className="admin-post-row" key={post._id}>
                  <input
                    type="checkbox"
                    checked={selectedPostIds.includes(post._id)}
                    onChange={() => togglePostSelection(post._id)}
                    className="bulk-checkbox"
                  />
                  <div>
                    <div className="tag-row">
                      <span className={`tag ${post.postType === "offer" ? "tag-offer" : "tag-request"}`}>
                        {post.postType}
                      </span>
                      <span className="tag tag-neutral">{post.category}</span>
                    </div>
                    <h3>{post.title}</h3>
                    <p>
                      By {post.owner?.name || "Unknown member"} · {post.proficiencyLevel}
                    </p>
                  </div>
                  <div className="admin-post-actions">
                    <Link className="button-secondary" to={`/posts/${post._id}`}>
                      View details
                    </Link>
                    <button
                      className="button-danger"
                      type="button"
                      onClick={() => handleDelete(post._id, post.title)}
                      disabled={deletingId === post._id}
                    >
                      {deletingId === post._id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {activeTab === "reports" && (
        <section className="admin-posts">
          <div className="admin-search-bar">
            <FaSearch className="admin-search-icon" aria-hidden="true" />
            <input
              type="text"
              placeholder="Search reports by target, reporter, or reason"
              value={reportSearch}
              onChange={(e) => setReportSearch(e.target.value)}
            />
          </div>

          <div className="report-type-tabs">
            <button
              type="button"
              className={`report-type-tab ${reportTypeFilter === "all" ? "active" : ""}`}
              onClick={() => setReportTypeFilter("all")}
            >
              All ({reports.length})
            </button>
            <button
              type="button"
              className={`report-type-tab ${reportTypeFilter === "posts" ? "active" : ""}`}
              onClick={() => setReportTypeFilter("posts")}
            >
              <FaFileAlt /> Posts
            </button>
            <button
              type="button"
              className={`report-type-tab ${reportTypeFilter === "users" ? "active" : ""}`}
              onClick={() => setReportTypeFilter("users")}
            >
              <FaUser /> Users
            </button>
            <button
              type="button"
              className={`report-type-tab ${reportTypeFilter === "messages" ? "active" : ""}`}
              onClick={() => setReportTypeFilter("messages")}
            >
              <FaFlag /> Messages
            </button>
          </div>

          <div className="admin-filters-row">
            <select
              className="admin-select"
              value={reportStatusFilter}
              onChange={(e) => setReportStatusFilter(e.target.value)}
            >
              <option value="all">All status</option>
              <option value="pending">Pending</option>
              <option value="resolved">Resolved</option>
              <option value="dismissed">Dismissed</option>
              <option value="escalated">Escalated</option>
            </select>
            <select
              className="admin-select"
              value={reportReasonFilter}
              onChange={(e) => setReportReasonFilter(e.target.value)}
            >
              <option value="all">All reasons</option>
              <option value="spam">Spam</option>
              <option value="inappropriate">Inappropriate</option>
              <option value="harassment">Harassment</option>
              <option value="misinformation">Misinformation</option>
              <option value="fake_account">Fake account</option>
              <option value="underage">Underage</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="admin-section-title">
            <h2>Reported content</h2>
            <span>
              {reportSearch.trim() || reportTypeFilter !== "all" || reportStatusFilter !== "all" || reportReasonFilter !== "all"
                ? `${filteredReports.length} of ${reports.length}`
                : `${reports.length} reports`}
            </span>
          </div>

          {pendingReports.length > 0 && (
            <div className="bulk-actions-bar">
              <label className="bulk-checkbox-label">
                <input
                  type="checkbox"
                  checked={selectedReportIds.length === pendingReports.length && pendingReports.length > 0}
                  onChange={toggleAllReports}
                />
                <span>Select all pending ({pendingReports.length})</span>
              </label>
              {selectedReportIds.length > 0 && (
                <>
                  <span className="bulk-selected-count">{selectedReportIds.length} selected</span>
                  <button
                    className="button-secondary"
                    type="button"
                    onClick={handleBulkDismissReports}
                  >
                    <FaCheck /> Dismiss all
                  </button>
                  <button
                    className="button-danger"
                    type="button"
                    onClick={handleBulkEscalateReports}
                  >
                    <FaShieldAlt /> Escalate all
                  </button>
                </>
              )}
            </div>
          )}

          {reports.length === 0 ? (
            <div className="empty-state">
              <p>No reports have been submitted yet.</p>
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="empty-state">
              <p>No reports match your filter.</p>
            </div>
          ) : (
            <div className="admin-post-list">
              {filteredReports.map((report) => {
                const isPending = report.status === "pending";
                const isUserReport = report.targetType === "user";
                const isMessageReport = report.targetType === "message";

                return (
                  <article className="admin-report-row" key={report._id}>
                    {isPending && (
                      <input
                        type="checkbox"
                        checked={selectedReportIds.includes(report._id)}
                        onChange={() => toggleReportSelection(report._id)}
                        className="bulk-checkbox"
                      />
                    )}
                    <div className="admin-report-info">
                      <div className="tag-row">
                        <span className={`report-status report-status-${report.status}`}>
                          {report.status}
                        </span>
                        <span className="tag tag-danger">{report.reason}</span>
                        {isUserReport && (
                          <span className="tag tag-user-report">
                            <FaUser /> User
                          </span>
                        )}
                        {isMessageReport && (
                          <span className="tag tag-message-report">
                            <FaFlag /> Message
                          </span>
                        )}
                        {!isUserReport && !isMessageReport && (
                          <span className="tag tag-post-report">
                            <FaFileAlt /> Post
                          </span>
                        )}
                        {report.status === "escalated" && (
                          <span className="tag tag-escalated">
                            <FaShieldAlt /> Escalated
                          </span>
                        )}
                      </div>

                      {isUserReport && (
                        <>
                          <h3>{report.targetUser?.name || "Deleted user"}</h3>
                          <p>
                            {report.targetUser?.email || "No email"} · reported by{" "}
                            {report.reporter?.name || "Unknown"}
                          </p>
                        </>
                      )}

                      {isMessageReport && (
                        <>
                          <h3>
                            Message from {report.targetUser?.name || "a user"}
                          </h3>
                          <p>
                            Reported by {report.reporter?.name || "Unknown"}
                          </p>
                          {report.message?.content && (
                            <p className="admin-report-details">
                              "{report.message.content}"
                            </p>
                          )}
                        </>
                      )}

                      {!isUserReport && !isMessageReport && (
                        <>
                          <h3>{report.post?.title || "Deleted post"}</h3>
                          <p>
                            By {report.post?.owner?.name || "Unknown member"} · reported by{" "}
                            {report.reporter?.name || "Unknown"}
                          </p>
                        </>
                      )}

                      {report.details && (
                        <p className="admin-report-details">"{report.details}"</p>
                      )}

                      {report.adminNote && (
                        <p className="admin-report-note">
                          Moderator note: {report.adminNote}
                        </p>
                      )}
                    </div>

                    <div className="admin-report-actions">
                      {isUserReport && (
                        <Link className="button-secondary" to={`/profile/${report.targetUser?._id}`}>
                          View profile
                        </Link>
                      )}

                      {isMessageReport && (
                        <button
                          className="button-secondary"
                          type="button"
                          onClick={() => setPreviewReport(report)}
                        >
                          <FaFlag aria-hidden="true" />
                          <span>View reported content</span>
                        </button>
                      )}

                      {!isUserReport && !isMessageReport && report.post?._id && (
                        <Link className="button-secondary" to={`/posts/${report.post._id}`}>
                          View details
                        </Link>
                      )}

                      {isPending && (
                        <>
                          <button
                            className="button-secondary"
                            type="button"
                            onClick={() => handleReportAction(report._id, "dismiss")}
                            disabled={reportActionId === report._id}
                          >
                            <FaCheck aria-hidden="true" />
                            <span>Dismiss</span>
                          </button>
                          {isUserReport && (
                            <>
                              <button
                                className="button"
                                type="button"
                                onClick={() => handleReportAction(report._id, "resolve_user")}
                                disabled={reportActionId === report._id}
                              >
                                <FaFlag aria-hidden="true" />
                                <span>Warn</span>
                              </button>
                              <button
                                className="button-danger"
                                type="button"
                                onClick={() => handleReportAction(report._id, "escalate")}
                                disabled={reportActionId === report._id}
                              >
                                <FaShieldAlt aria-hidden="true" />
                                <span>Escalate</span>
                              </button>
                            </>
                          )}
                          {isMessageReport && (
                            <>
                              <button
                                className="button-danger"
                                type="button"
                                onClick={() => handleReportAction(report._id, "delete_message")}
                                disabled={reportActionId === report._id}
                              >
                                <FaTrash aria-hidden="true" />
                                <span>Delete message</span>
                              </button>
                              <button
                                className="button"
                                type="button"
                                onClick={() => handleReportAction(report._id, "escalate")}
                                disabled={reportActionId === report._id}
                              >
                                <FaShieldAlt aria-hidden="true" />
                                <span>Escalate</span>
                              </button>
                            </>
                          )}
                          {!isUserReport && !isMessageReport && (
                            <button
                              className="button-danger"
                              type="button"
                              onClick={() => handleReportAction(report._id, "delete")}
                              disabled={reportActionId === report._id}
                            >
                              <FaTrash aria-hidden="true" />
                              <span>Delete post</span>
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      {activeTab === "activity" && <ModeratorActivityTab />}

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

      <ReportedMessageModal
        report={previewReport}
        onClose={() => setPreviewReport(null)}
      />
    </main>
  );
}

export default ModeratorDashboard;