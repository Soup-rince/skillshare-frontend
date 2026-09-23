import { useEffect, useState } from "react";
import { checkAdmin, getSkillPosts, deletePost } from "../api";

function AdminDashboard() {
  const [accessGranted, setAccessGranted] = useState(null);
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    const loadAdminDashboard = async () => {
      try {
        await checkAdmin(token);

        const postsResponse = await getSkillPosts();
        setPosts(postsResponse.data);
        setAccessGranted(true);
      } catch (err) {
        setAccessGranted(false);
        setError(
          err.response?.data?.message ||
            "You do not have permission to access this page."
        );
      }
    };

    loadAdminDashboard();
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
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to delete this post."
      );
    } finally {
      setDeletingId("");
    }
  };

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

  return (
    <main className="page-container">
      <header className="admin-heading">
        <div>
          <p className="eyebrow admin-eyebrow">Moderation console</p>
          <h1>Admin Dashboard</h1>
          <p>Review community posts and manage inappropriate content.</p>
        </div>

        <span className="admin-badge">● Admin access verified</span>
      </header>

      {error && <p className="alert" style={{ marginBottom: 16 }}>{error}</p>}

      <section className="admin-summary">
        <div>
          <span>Total community posts</span>
          <strong>{posts.length}</strong>
        </div>

        <div>
          <span>Your permission</span>
          <strong>Moderator</strong>
        </div>
      </section>

      <section className="admin-posts">
        <div className="admin-section-title">
          <h2>Post moderation</h2>
          <span>{posts.length} posts</span>
        </div>

        {posts.length === 0 ? (
          <div className="empty-state">
            <p>No posts are available for moderation.</p>
          </div>
        ) : (
          <div className="admin-post-list">
            {posts.map((post) => (
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

                <button
                  className="button-danger"
                  type="button"
                  onClick={() => handleDelete(post._id, post.title)}
                  disabled={deletingId === post._id}
                >
                  {deletingId === post._id ? "Deleting..." : "Delete"}
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default AdminDashboard;