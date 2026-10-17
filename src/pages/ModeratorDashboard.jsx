import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { FaTrash, FaCheck, FaSearch, FaHistory, FaFlag, FaUser, FaFileAlt, FaShieldAlt } from "react-icons/fa";
import {
  checkModerator,
  getSkillPosts,
  deletePost,
  getModeratorReports,
  updateModeratorReportStatus,
} from "../api";
import ModeratorActivityTab from "../components/ModeratorActivityTab";
import ConfirmDialog from "../components/ConfirmDialog";

function ModeratorDashboard() {
  const [accessGranted, setAccessGranted] = useState(null);
  const [posts, setPosts] = useState([]);
  const [reports, setReports] = useState([]);
  const [activeTab, setActiveTab] = useState("posts");
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState("");
  const [reportActionId, setReportActionId] = useState("");
  const [postSearch, setPostSearch] = useState("");
  const [reportSearch, setReportSearch] = useState("");
  const [reportTypeFilter, setReportTypeFilter] = useState("all");
  const [confirmDialog, setConfirmDialog] = useState(null);

  const token = localStorage.getItem("token");

  const loadModeratorData = async () => {
    await checkModerator(token);
    const [postsResponse, reportsResponse] = await Promise.all([
      getSkillPosts(),
      getModeratorReports({}, token),
    ]);
    setPosts(postsResponse.data);
    setReports(reportsResponse.data);
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

  const handleReportAction = (reportId, action) => {
    const report = reports.find((r) => r._id === reportId);
    const isUserReport = report?.targetType === "user";
    const targetLabel = isUserReport
      ? report?.targetUser?.name || "the reported user"
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
          } catch (err) {
            setError(err.response?.data?.message || "Unable to update this report.");
          } finally {
            setReportActionId("");
            setConfirmDialog(null);
          }
        }
      });
    } else if (action === "delete" && !isUserReport) {
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
          } catch (err) {
            setError(err.response?.data?.message || "Unable to update this report.");
          } finally {
            setReportActionId("");
            setConfirmDialog(null);
          }
        }
      });
    } else if (action === "resolve_user") {
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
          } catch (err) {
            setError(err.response?.data?.message || "Unable to escalate this report.");
          } finally {
            setReportActionId("");
            setConfirmDialog(null);
          }
        }
      });
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
      list = list.filter((r) => r.targetType !== "user");
    } else if (reportTypeFilter === "users") {
      list = list.filter((r) => r.targetType === "user");
    }

    const q = reportSearch.trim().toLowerCase();
    if (!q) return list;

    return list.filter((report) => {
      const isUser = report.targetType === "user";
      const targetLabel = isUser
        ? (report.targetUser?.name || "").toLowerCase()
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
  }, [reports, reportSearch, reportTypeFilter]);

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

  const pendingCount = reports.filter((r) => r.status === "pending").length;
  const userReportCount = reports.filter((r) => r.targetType === "user").length;
  const postReportCount = reports.filter((r) => r.targetType !== "user").length;

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

      <section className="admin-summary">
        <div>
          <span>Total community posts</span>
          <strong>{posts.length}</strong>
        </div>

        <div>
          <span>Pending reports</span>
          <strong>{pendingCount}</strong>
        </div>
      </section>

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
          Reports {pendingCount > 0 && <span className="admin-tab-badge">{pendingCount}</span>}
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
                  <div>
                    <div className="tag-row">
                      <span
                        className={`tag ${post.postType === "offer" ? "tag-offer" : "tag-request"}`}
                      >
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
              <FaFileAlt /> Posts ({postReportCount})
            </button>
            <button
              type="button"
              className={`report-type-tab ${reportTypeFilter === "users" ? "active" : ""}`}
              onClick={() => setReportTypeFilter("users")}
            >
              <FaUser /> Users ({userReportCount})
            </button>
          </div>

          <div className="admin-section-title">
            <h2>Reported content</h2>
            <span>
              {reportSearch.trim()
                ? `${filteredReports.length} of ${reports.length}`
                : `${reports.length} reports`}
            </span>
          </div>

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

                return (
                  <article className="admin-report-row" key={report._id}>
                    <div className="admin-report-info">
                      <div className="tag-row">
                        <span className={`report-status report-status-${report.status}`}>
                          {report.status}
                        </span>
                        <span className="tag tag-danger">{report.reason}</span>
                        <span className={`tag ${isUserReport ? "tag-user-report" : "tag-post-report"}`}>
                          {isUserReport ? <><FaUser /> User</> : <><FaFileAlt /> Post</>}
                        </span>
                        {report.status === "escalated" && (
                          <span className="tag tag-escalated">
                            <FaShieldAlt /> Escalated
                          </span>
                        )}
                      </div>

                      {isUserReport ? (
                        <>
                          <h3>{report.targetUser?.name || "Deleted user"}</h3>
                          <p>
                            {report.targetUser?.email || "No email"} · reported by{" "}
                            {report.reporter?.name || "Unknown"}
                          </p>
                        </>
                      ) : (
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
                      {isUserReport ? (
                        <Link className="button-secondary" to={`/profile/${report.targetUser?._id}`}>
                          View profile
                        </Link>
                      ) : (
                        report.post?._id && (
                          <Link className="button-secondary" to={`/posts/${report.post._id}`}>
                            View details
                          </Link>
                        )
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
                          {isUserReport ? (
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
                          ) : (
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
    </main>
  );
}

export default ModeratorDashboard;