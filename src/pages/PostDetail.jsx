import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { FaFlag, FaTrash, FaTimes, FaDownload } from "react-icons/fa";
import { getPostById, deletePost, createReport } from "../api";
import ReportForm from "../components/ReportForm";
import { useConfirm } from "../contexts/ConfirmContext";

function getInitials(name) {
  if (!name) return "?";
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function getAvatarColor(name) {
  const palette = ["#2639ba", "#087b75", "#7c3aed", "#c2410c", "#be123c", "#0369a1"];
  if (!name) return palette[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return palette[Math.abs(hash) % palette.length];
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const [post, setPost] = useState(null);
  const [error, setError] = useState("");
  const myId = localStorage.getItem("userId");
  const token = localStorage.getItem("token");
  const [actionError, setActionError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [showReportForm, setShowReportForm] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState(null);
  const [lightboxName, setLightboxName] = useState("");

  const userRole = localStorage.getItem("role");
  const isModerator = userRole === "moderator";
  const isSuperAdmin = userRole === "super_admin";
  const canModerate = isModerator || isSuperAdmin;

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
    const shouldDelete = await confirm({
      title: "Delete this post?",
      message: `Your post "${post?.title || "Untitled"}" will be permanently deleted. This action cannot be undone.`,
      confirmLabel: "Delete post",
      cancelLabel: "Cancel",
      tone: "danger",
    });
    if (!shouldDelete) return;
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

  const handleModeratorDelete = async () => {
    const shouldDelete = await confirm({
      title: "Delete this post?",
      message: `The post "${post?.title || "Untitled"}" will be permanently deleted. This action cannot be undone. The post owner will be notified.`,
      confirmLabel: "Delete post",
      cancelLabel: "Cancel",
      tone: "danger",
    });
    if (!shouldDelete) return;
    try {
      setDeleting(true);
      setActionError("");
      await deletePost(id, token);
      navigate("/browse");
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
  const canModerateDelete = canModerate && !isOwner;
  const ownerName = post.owner?.name || "SkillShare member";
  const hasImages = post.images && post.images.length > 0;

  return (
    <main className="page-container detail2-page">
      <Link className="detail2-back" to="/browse">
        ← Back to browse
      </Link>

      <div className="detail2-grid">
        <article className="detail2-main">
          {hasImages && (
            <div className="detail2-hero">
              <img
                src={post.images[0]}
                alt={post.title}
                onClick={() => {
                  setLightboxUrl(post.images[0]);
                  setLightboxName("Post image 1");
                }}
              />
            </div>
          )}

          <div className="detail2-content">
            <div className="detail2-tags">
              <span className={`detail2-pill ${post.postType === "offer" ? "detail2-pill-offer" : "detail2-pill-request"}`}>
                {post.postType}
              </span>
              <span className="detail2-pill detail2-pill-neutral">
                {post.category}
              </span>
              <span className="detail2-pill detail2-pill-neutral">
                {post.proficiencyLevel}
              </span>
            </div>

            <h1 className="detail2-title">{post.title}</h1>
            <p className="detail2-description">{post.description}</p>

            {post.aiTags && post.aiTags.length > 0 && (
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '16px' }}>
                {post.aiTags.map((tag, idx) => (
                  <span key={idx} style={{ background: '#f0f2ff', color: '#2639ba', fontSize: '12px', padding: '4px 10px', borderRadius: '99px', fontWeight: '600' }}>
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {hasImages && post.images.length > 1 && (
              <div className="detail2-gallery">
                {post.images.slice(1).map((url, i) => (
                  <img
                    key={i + 1}
                    src={url}
                    alt={`Post image ${i + 2}`}
                    className="detail2-gallery-thumb"
                    onClick={() => {
                      setLightboxUrl(url);
                      setLightboxName(`Post image ${i + 2}`);
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
          </div>
        </article>

        <aside className="detail2-sidebar">
          <div className="detail2-owner-card">
            <div className="detail2-owner-header">
              <Link
                className="detail2-avatar"
                to={`/profile/${post.owner?._id}`}
                style={{ background: getAvatarColor(ownerName) }}
                aria-label={`View ${ownerName}'s profile`}
              >
                {getInitials(ownerName)}
              </Link>
              <div className="detail2-owner-info">
                <Link
                  className="detail2-owner-name"
                  to={`/profile/${post.owner?._id}`}
                >
                  {ownerName}
                </Link>
                <span className="detail2-owner-meta">
                  Posted {formatDate(post.createdAt)}
                </span>
              </div>
            </div>

            <div className="detail2-owner-actions">
              {isOwner ? (
                <>
                  <Link
                    className="detail2-btn detail2-btn-secondary"
                    to={`/posts/${post._id}/edit`}
                  >
                    Edit post
                  </Link>
                  <button
                    className="detail2-btn detail2-btn-danger"
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting}
                  >
                    {deleting ? "Deleting..." : "Delete post"}
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="detail2-btn detail2-btn-primary"
                    onClick={() => navigate(`/messages?to=${post.owner._id}`)}
                  >
                    Message {ownerName}
                  </button>
                  {canModerateDelete && (
                    <button
                      className="detail2-btn detail2-btn-danger"
                      type="button"
                      onClick={handleModeratorDelete}
                      disabled={deleting}
                    >
                      <FaTrash aria-hidden="true" />
                      <span>{deleting ? "Deleting..." : "Delete post (moderator)"}</span>
                    </button>
                  )}
                  {!canModerate && (
                    <button
                      className="detail2-btn detail2-btn-ghost"
                      type="button"
                      onClick={() => setShowReportForm(true)}
                    >
                      <FaFlag aria-hidden="true" />
                      <span>Report</span>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </aside>
      </div>

      <ReportForm
        isOpen={showReportForm}
        targetType="post"
        targetId={id}
        targetName={post.title}
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