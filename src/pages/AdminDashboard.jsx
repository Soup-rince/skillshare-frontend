import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { FaTrash, FaCheck, FaSearch } from "react-icons/fa";
import {
  checkAdmin,
  getSkillPosts,
  deletePost,
  getReports,
  updateReportStatus,
} from "../api";
import UserManagementTab from "../components/UserManagementTab";

function AdminDashboard() {
  const [accessGranted, setAccessGranted] = useState(null);
  const [posts, setPosts] = useState([]);
  const [reports, setReports] = useState([]);
  const [activeTab, setActiveTab] = useState("posts");
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState("");
  const [reportActionId, setReportActionId] = useState("");
  const [postSearch, setPostSearch] = useState("");
  const [reportSearch, setReportSearch] = useState("");

  const token = localStorage.getItem("token");
  const isSuperAdmin = localStorage.getItem("role") === "super_admin";

  const loadAdminData = async () => {
    await checkAdmin(token);
    const [postsResponse, reportsResponse] = await Promise.all([
      getSkillPosts(),
      getReports({}, token),
    ]);
    setPosts(postsResponse.data);
    setReports(reportsResponse.data);
  };

  useEffect(() => {
    const init = async () => {
      try {
        await loadAdminData();
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

  const handleDelete = async (postId, postTitle) => {
    const confirmed = window.confirm(
      `Delete "${postTitle}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setDeletingId(postId);
      setError("");

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
    }
  };

  const handleReportAction = async (reportId, action) => {
    try {
      setReportActionId(reportId);
      setError("");

      if (action === "dismiss") {
        const res = await updateReportStatus(
          reportId,
          { status: "dismissed", adminNote: "Dismissed by admin" },
          token
        );
        setReports((current) =>
          current.map((r) => (r._id === reportId ? { ...r, ...res.data } : r))
        );
      } else if (action === "resolve") {
        const res = await updateReportStatus(
          reportId,
          { status: "resolved", adminNote: "Reviewed by admin" },
          token
        );
        setReports((current) =>
          current.map((r) => (r._id === reportId ? { ...r, ...res.data } : r))
        );
      } else if (action === "delete") {
        const report = reports.find((r) => r._id === reportId);
        if (!report?.post?._id) return;
        const confirmed = window.confirm(
          `Delete "${report.post.title}"? This will also resolve the report.`
        );
        if (!confirmed) {
          setReportActionId("");
          return;
        }
        await deletePost(report.post._id, token);
        await updateReportStatus(
          reportId,
          { status: "resolved", adminNote: "Post deleted by admin" },
          token
        );
        setPosts((current) =>
          current.filter((p) => p._id !== report.post._id)
        );
        setReports((current) =>
          current.map((r) =>
            r._id === reportId
              ? { ...r, status: "resolved", adminNote: "Post deleted by admin" }
              : r
          )
        );
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to update this report."
      );
    } finally {
      setReportActionId("");
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
          <p>Checking administrator access...</p>
        </div>
      </main>
    );
  }

  if (!accessGranted) {
    return (
      <main className="page-container">
        <div className="admin-denied">
          <p className="eyebrow">Restricted area</p>
          <h1>Admin access required</h1>
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
          <p className="eyebrow admin-eyebrow">Moderation console</p>
          <h1>Admin Dashboard</h1>
          <p>Review community posts and manage inappropriate content.</p>
        </div>

        <span className="admin-badge">
          ● {isSuperAdmin ? "Super admin access" : "Admin access verified"}
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
        {isSuperAdmin && (
          <button
            type="button"
            className={`admin-tab ${activeTab === "users" ? "active" : ""}`}
            onClick={() => setActiveTab("users")}
          >
            User management
          </button>
        )}
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
                          Admin note: {report.adminNote}
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

      {activeTab === "users" && isSuperAdmin && (
        <UserManagementTab />
      )}
    </main>
  );
}

export default AdminDashboard;