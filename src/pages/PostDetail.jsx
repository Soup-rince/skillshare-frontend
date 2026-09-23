import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getPostById, deletePost } from "../api";


function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [error, setError] = useState("");
  const myId = localStorage.getItem("userId");
  const token = localStorage.getItem("token");
  const [actionError, setActionError] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchPost = async () => {
      try { const res = await getPostById(id); setPost(res.data); }
      catch { setError("Post not found."); }
    };
    fetchPost();
  }, [id]);
  const handleDelete = async () => {
  const confirmed = window.confirm(
    "Delete this post? This action cannot be undone."
  );

  if (!confirmed) return;

  try {
    setDeleting(true);
    setActionError("");
    await deletePost(id, token);
    navigate("/dashboard");
  } catch (err) {
    setActionError(
      err.response?.data?.message || "Unable to delete this post."
    );
  } finally {
    setDeleting(false);
  }
};

  if (error) return <main className="page-container"><div className="empty-state"><h2>{error}</h2><Link className="button-secondary" to="/browse">Back to Browse</Link></div></main>;
  if (!post) return <main className="page-container"><div className="empty-state"><p>Loading skill post...</p></div></main>;

  return (
    <main className="page-container detail-layout">
      <article className="content-card">
        <div className="detail-meta">Posted by <Link to={`/profile/${post.owner?._id}`}>{post.owner?.name || "SkillShare member"}</Link><span>·</span><span>{new Date(post.createdAt).toLocaleDateString()}</span></div>
        <div className="tag-row"><span className={`tag ${post.postType === "offer" ? "tag-offer" : "tag-request"}`}>{post.postType}</span><span className="tag tag-neutral">{post.category}</span><span className="tag tag-neutral">{post.proficiencyLevel}</span></div>
        <h1 className="detail-title">{post.title}</h1>
        <p className="detail-copy">{post.description}</p>
        {actionError && (
  <p className="alert" style={{ marginTop: 24 }}>
    {actionError}
  </p>
)}

{post.owner?._id === myId ? (
  <div className="form-actions" style={{ justifyContent: "flex-start" }}>
    <Link className="button-secondary" to={`/posts/${post._id}/edit`}>
      Edit post
    </Link>

    <button
      className="button-danger"
      type="button"
      onClick={handleDelete}
      disabled={deleting}
    >
      {deleting ? "Deleting..." : "Delete post"}
    </button>
  </div>
) : (
  <button
    className="button"
    style={{ marginTop: 28 }}
    onClick={() => navigate(`/messages?to=${post.owner._id}`)}
  >
    Message {post.owner?.name}
  </button>
)}
      </article>
    </main>
  );
}

export default PostDetail;
