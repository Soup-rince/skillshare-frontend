import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { FaFlag, FaTrash, FaTimes, FaDownload } from "react-icons/fa";
import { getPostById, deletePost, createReport } from "../api";
import ReportForm from "../components/ReportForm";

function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [error, setError] = useState("");
  const myId = localStorage.getItem("userId");
  const token = localStorage.getItem("token");
  const [actionError, setActionError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [showReportForm, setShowReportForm] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState(null);
  const [lightboxName, setLightboxName] = useState("");

  const isAdmin = localStorage.getItem("role") === "admin" || localStorage.getItem("role") === "super_admin";

  useEffect(() => {
    const fetchPost = async () => {
      try { const res = await getPostById(id); setPost(res.data); }
      catch { setError("Post not found."); }
    };
    fetchPost();
  }, [id]);

  const closeLightbox = () => {
    setLightboxUrl(null);
  };

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

  const handleAdminDelete = async () => {
    const confirmed = window.confirm(
      "[Admin] Delete this post? This action cannot be undone."
    );
    if (!confirmed) return;
    try {
      setDeleting(true);
      setActionError("");
      await deletePost(id, token);
      navigate("/admin");
    } catch (err) {
      setActionError(
        err.response?.data?.message || "Unable to delete this post."
      );
    } finally {
      setDeleting(false);
    }
  };

  const handleReport = async (payload) => {
    await createReport(payload, token);
  };

  if (error) return <main className="page-container"><div className="empty-state"><h2>{error}</h2><Link className="button-secondary" to="/browse">Back to Browse</Link></div></main>;
  if (!post) return <main className="page-container"><div className="empty-state"><p>Loading skill post...</p></div></main>;

  const isOwner = post.owner?._id === myId;
  const canAdminDelete = isAdmin && !isOwner;

  return (
    <main className="page-container detail-layout">
      <article className="content-card">
        <div className="detail-meta">Posted by <Link to={`/profile/${post.owner?._id}`}>{post.owner?.name || "SkillShare member"}</Link><span>·</span><span>{new Date(post.createdAt).toLocaleDateString()}</span></div>
        <div className="tag-row"><span className={`tag ${post.postType === "offer" ? "tag-offer" : "tag-request"}`}>{post.postType}</span><span className="tag tag-neutral">{post.category}</span><span className="tag tag-neutral">{post.proficiencyLevel}</span></div>
        <h1 className="detail-title">{post.title}</h1>
        <p className="detail-copy">{post.description}</p>

        {post.images && post.images.length > 0 && (
          <div className="detail-images">
            {post.images.map((url, i) => (
              <img
                key={i}
                src={url}
                alt={`Post image ${i + 1}`}
                className="detail-image"
                onClick={() => {
                  setLightboxUrl(url);
                  setLightboxName(`Post image ${i + 1}`);
                }}
              />
            ))}
          </div>
        )}

        {actionError && (
          <p className="alert" style={{ marginTop: 24 }}>
            {actionError}
          </p>
        )}

        {isOwner ? (
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
          <div className="detail-actions">
            <button
              className="button"
              onClick={() => navigate(`/messages?to=${post.owner._id}`)}
            >
              Message {post.owner?.name}
            </button>
            {canAdminDelete && (
              <button
                className="button-danger"
                type="button"
                onClick={handleAdminDelete}
                disabled={deleting}
              >
                <FaTrash aria-hidden="true" />
                <span>{deleting ? "Deleting..." : "Delete post (admin)"}</span>
              </button>
            )}
            <button
              className="report-button"
              type="button"
              onClick={() => setShowReportForm(true)}
            >
              <FaFlag aria-hidden="true" />
              <span>Report</span>
            </button>
          </div>
        )}
      </article>

      <ReportForm
        isOpen={showReportForm}
        postId={id}
        onClose={() => setShowReportForm(false)}
        onSubmit={handleReport}
      />

      {lightboxUrl && (
        <div className="lightbox-overlay" onClick={closeLightbox}>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="lightbox-close"
              onClick={closeLightbox}
              aria-label="Close"
            >
              <FaTimes />
            </button>
            <img src={lightboxUrl} alt={lightboxName || "image"} className="lightbox-image" />
            <a
              className="lightbox-download"
              href={`${lightboxUrl.replace("/upload/", "/upload/fl_attachment/")}?filename=${encodeURIComponent(lightboxName || "image")}`}
            >
              <FaDownload aria-hidden="true" />
              <span>Download</span>
            </a>
          </div>
        </div>
      )}
    </main>
  );
}

export default PostDetail;