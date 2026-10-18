import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  FaSearch,
  FaPlusCircle,
  FaFileAlt,
  FaEdit,
  FaEye,
  FaChevronLeft,
  FaChevronRight
} from "react-icons/fa";
import { getMyPosts } from "../api";
import { CATEGORIES } from "../constants/categories";

function MyPosts() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [postType, setPostType] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const token = localStorage.getItem("token");

  const loadPosts = async () => {
    try {
      setLoading(true);
      setError("");
      const params = {
        search: search.trim(),
        postType,
        category,
        page,
        limit: 12
      };
      const res = await getMyPosts(params, token);
      setPosts(res.data.data || []);
      setTotal(res.data.total || 0);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load your posts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, [search, postType, category, page]);

  useEffect(() => {
    setPage(1);
  }, [search, postType, category]);

  return (
    <main className="page-container">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Your content</p>
          <h1>My skill posts</h1>
          <p>Manage all your skill offers and requests.</p>
        </div>
        <Link className="button" to="/create-post">
          <FaPlusCircle aria-hidden="true" />
          <span>New post</span>
        </Link>
      </header>

      {error && <p className="alert">{error}</p>}

      <section className="my-posts-filters">
        <div className="conversation-search" style={{ flex: 1, minWidth: 200 }}>
          <FaSearch className="conversation-search-icon" aria-hidden="true" />
          <input
            type="text"
            placeholder="Search by title or description"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search posts"
          />
        </div>

        <select
          value={postType}
          onChange={(e) => setPostType(e.target.value)}
          aria-label="Filter by type"
        >
          <option value="">All types</option>
          <option value="offer">Offers</option>
          <option value="request">Requests</option>
        </select>

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          aria-label="Filter by category"
        >
          <option value="">All categories</option>
          {CATEGORIES.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>
      </section>

      <div className="admin-section-title">
        <h2>Your posts</h2>
        <span>
          {loading ? "Loading..." : `${total} post${total !== 1 ? "s" : ""}`}
        </span>
      </div>

      {loading ? (
        <div className="empty-state">
          <p>Loading your posts...</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-icon" aria-hidden="true"><FaFileAlt /></span>
          <h2>No posts found</h2>
          <p>
            {search || postType || category
              ? "Try changing your filters."
              : "Create your first skill post to get started."}
          </p>
        </div>
      ) : (
        <>
          <div className="my-posts-grid">
            {posts.map((post) => (
              <article className="my-post-card" key={post._id}>
                <div className="my-post-card-header">
                  <span className={`tag ${post.postType === "offer" ? "tag-offer" : "tag-request"}`}>
                    {post.postType}
                  </span>
                  <span className="tag tag-neutral">{post.category}</span>
                  <span className="tag tag-neutral">{post.proficiencyLevel}</span>
                </div>
                <h3>{post.title}</h3>
                <p className="my-post-card-description">{post.description}</p>
                <div className="my-post-card-actions">
                  <Link className="button-secondary" to={`/posts/${post._id}`}>
                    <FaEye aria-hidden="true" />
                    <span>View</span>
                  </Link>
                  <Link className="button" to={`/posts/${post._id}/edit`}>
                    <FaEdit aria-hidden="true" />
                    <span>Edit</span>
                  </Link>
                </div>
              </article>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                type="button"
                className="button"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <FaChevronLeft /> Prev
              </button>
              <span className="pagination-info">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                className="button"
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next <FaChevronRight />
              </button>
            </div>
          )}
        </>
      )}
    </main>
  );
}

export default MyPosts;