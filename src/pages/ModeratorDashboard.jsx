import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { FaTrash, FaCheck, FaSearch, FaHistory } from "react-icons/fa";
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
      onConfirm: async () => {
        setDeletingId(postId);
        setError("");
        try {
          await deletePost(postId, token);
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
    const postTitle = report?.post?.title || "the reported post";

    if (action === "dismiss") {
      setConfirmDialog({
        title: "Dismiss this report?",
        message: `The report on "${postTitle}" will be marked as dismissed. The post will remain visible.`,
        confirmLabel: "Dismiss report",
        cancelLabel: "Cancel",
        tone: "info",
        onConfirm: async () => {
          setReportActionId(reportId);
          setError("");
          try {
            const res = await updateModeratorReportStatus(
              reportId,
              {
                status: "dismissed",
                adminNote: `After careful review of the report on "${postTitle}", we determined that the content does not violate our community guidelines. No action has been taken. Thank you for your vigilance in helping keep SkillShare safe.`
              },
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
    } else if (action === "delete") {
      setConfirmDialog({
        title: "Delete this post?",
        message: `The post "${postTitle}" will be permanently deleted and the report will be resolved. This action cannot be undone.`,
        confirmLabel: "Delete post",
        cancelLabel: "Cancel",
        tone: "danger",
        onConfirm: async () => {
          setReportActionId(reportId);
          setError("");
          try {
            if (!report?.post?._id) return;
            await deletePost(report.post._id, token);
            await updateModeratorReportStatus(
              reportId,
              {
                status: "resolved",
                adminNote: `After reviewing the report, we determined that the post violated our community guidelines. The post has been removed from SkillShare. Thank you for helping keep our community safe.`
              },
              token
            );
            setPosts((current) =>
              current.filter((p) => p._id !== report.post._id)
            );
            setReports((current) =>
              current.map((r) =>
                r._id === reportId
                  ? {
                      ...r,
                      status: "resolved",
                      adminNote: `After reviewing the report, we determined that the post violated our community guidelines. The post has been removed from SkillShare.`
                    }
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
    const q = reportSearch.trim().toLowerCase();
    if (!q) return reports;
    return reports.filter((report) => {
      const postTitle = (report.post?.title || "").toLowerCase();
      const postOwner = (report.post?.owner?.name || "").toLowerCase();
      const reporter = (report.reporter?.name || "").toLowerCase();
      const reason = (report.reason || "").toLowerCase();
      return (
        postTitle.includes(q) ||
        postOwner.includes(q) ||
        reporter.includes(q) ||
        reason.includes(q)
      );
    });
  }, [reports, reportSearch]);

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
                        className={`tag ${
                          post.postType === "offer"
                            ? "tag-offer"
                            : "tag-request"
                        }`}
                      >
                        {post.postType}
                      </span>

                      <span className="tag tag-neutral">{post.category}</span>
                    </div>

                    <h3>{post.title}</h3>

                    <p>
                      By {post.owner?.name || "Unknown member"} ·{" "}
                      {post.proficiencyLevel}
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
              placeholder="Search reports by post, owner, reporter, or reason"
              value={reportSearch}
              onChange={(e) => setReportSearch(e.target.value)}
            />
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
              <p>No reports match your search.</p>
            </div>
          ) : (
            <div className="admin-post-list">
              {filteredReports.map((report) => {
                const isPending = report.status === "pending";
                return (
                  <article className="admin-report-row" key={report._id}>
                    <div className="admin-report-info">
                      <div className="tag-row">
                        <span className={`report-status report-status-${report.status}`}>
                          {report.status}
                        </span>
                        <span className="tag tag-danger">{report.reason}</span>
                      </div>

                      <h3>{report.post?.title || "Deleted post"}</h3>

                      <p>
                        By {report.post?.owner?.name || "Unknown member"} · reported by{" "}
                        {report.reporter?.name || "Unknown"}
                      </p>

                      {report.details && (
                        <p className="admin-report-details">
                          "{report.details}"
                        </p>
                      )}

                      {report.adminNote && (
                        <p className="admin-report-note">
                          Moderator note: {report.adminNote}
                        </p>
                      )}
                    </div>

                    {report.post?._id && (
                      <div className="admin-report-actions">
                        <Link className="button-secondary" to={`/posts/${report.post._id}`}>
                          View details
                        </Link>
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
                            <button
                              className="button-danger"
                              type="button"
                              onClick={() => handleReportAction(report._id, "delete")}
                              disabled={reportActionId === report._id}
                            >
                              <FaTrash aria-hidden="true" />
                              <span>Delete post</span>
                            </button>
                          </>
                        )}
                      </div>
                    )}
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
        onConfirm={confirmDialog?.onConfirm || (() => {})}
        onCancel={() => setConfirmDialog(null)}
      />
    </main>
  );
}

export default ModeratorDashboard;