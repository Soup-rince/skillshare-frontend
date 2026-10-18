import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  FaCalendarAlt,
  FaEdit,
  FaEnvelope,
  FaBullseye,
  FaPalette,
  FaClock,
  FaGraduationCap,
  FaStar,
  FaUser,
  FaUserShield,
  FaUserSlash,
  FaUserCheck,
  FaBan,
  FaFlag
} from "react-icons/fa";
import {
  getUserProfile,
  getUserReviews,
  getMyReviewForUser,
  createReview,
  suspendUser,
  unsuspendUser,
  createUserReport
} from "../api";
import { useConfirm } from "../contexts/ConfirmContext";
import StarRating from "../components/StarRating";
import ReviewForm from "../components/ReviewForm";
import ReportForm from "../components/ReportForm";

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

function formatMemberSince(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function Profile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("posts");
  const [reviewsData, setReviewsData] = useState({ reviews: [], total: 0, average: 0 });
  const [myReview, setMyReview] = useState(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showReportForm, setShowReportForm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const token = localStorage.getItem("token");
  const myId = localStorage.getItem("userId");
  const isSuperAdmin = localStorage.getItem("role") === "super_admin";
  const myRole = localStorage.getItem("role");

  const validId = id && id !== "undefined" && id !== "null";

  const fetchProfile = async () => {
    if (!validId) {
      setError("User not found.");
      setData(null);
      return;
    }
    try {
      setError("");
      const res = await getUserProfile(id, token);
      setData(res.data);
    } catch (err) {
      const msg = err.response?.data?.message || "User not found.";
      setError(msg);
      setData(null);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [id, token]);

  useEffect(() => {
    if (!validId) return;
    const fetchReviews = async () => {
      try {
        const res = await getUserReviews(id, token);
        setReviewsData(res.data);
      } catch {
      }
    };
    fetchReviews();
  }, [id, token]);

  useEffect(() => {
    if (!validId || id === myId) return;
    const fetchMyReview = async () => {
      try {
        const res = await getMyReviewForUser(id, token);
        setMyReview(res.data);
      } catch {
      }
    };
    fetchMyReview();
  }, [id, myId, token]);

  const handleSubmitReview = async (payload) => {
    const res = await createReview(payload, token);
    setMyReview(res.data);
    const reviewsRes = await getUserReviews(id, token);
    setReviewsData(reviewsRes.data);
    setShowReviewForm(false);
  };

  const handleSubmitUserReport = async (payload) => {
    await createUserReport(payload, token);
  };

  const handleSuspendToggle = async () => {
    if (!data || !data.user) return;
    const user = data.user;

    const action = user.isSuspended ? "Unsuspend" : "Suspend";
    const shouldProceed = await confirm({
      title: `${action} user`,
      message: user.isSuspended
        ? `Restore access for ${user.name}?`
        : `Suspend ${user.name}? They will not be able to log in.`,
      confirmLabel: action,
      cancelLabel: "Cancel",
      tone: user.isSuspended ? "info" : "danger",
    });

    if (!shouldProceed) return;

    try {
      setActionLoading(true);
      setError("");
      if (user.isSuspended) {
        await unsuspendUser(user._id, {}, token);
      } else {
        await suspendUser(
          user._id,
          { reason: "Violation of community guidelines" },
          token
        );
      }
      await fetchProfile();
    } catch (err) {
      setError(err.response?.data?.message || "Action failed.");
    } finally {
      setActionLoading(false);
    }
  };

  if (error) return <main className="page-container"><div className="empty-state"><h2>{error}</h2></div></main>;
  if (!data) return <main className="page-container"><div className="empty-state"><p>Loading profile...</p></div></main>;

  const { user, posts = [], totalPosts = 0 } = data;
  if (!user) return <main className="page-container"><div className="empty-state"><h2>User not found.</h2></div></main>;

  const isOwnProfile = id === myId;
  const safePosts = Array.isArray(posts) ? posts : [];
  const offerCount = safePosts.filter((p) => p.postType === "offer").length;
  const requestCount = safePosts.filter((p) => p.postType === "request").length;
  const memberSince = formatMemberSince(user.createdAt);
  const hasInterests = user.interests && user.interests.length > 0;
  const hasHobbies = user.hobbies && user.hobbies.length > 0;
  const canSuspend = isSuperAdmin && !isOwnProfile && user.role !== "super_admin";
  const canReport = !isOwnProfile && user.role !== "super_admin" && myRole === "member";

  return (
    <main className="page-container profile2-page">
      <section className="profile2-hero">
        <div className="profile2-hero-banner" />
        <div className="profile2-hero-content">
          <div
            className="profile2-hero-avatar"
            style={{ background: getAvatarColor(user.name) }}
          >
            {getInitials(user.name)}
          </div>
          <div className="profile2-hero-info">
            <div className="profile2-name-row">
              <h1>{user.name}</h1>
              <span className={`role-badge role-${user.role}`}>
                {user.role === "member" ? <FaUser /> : <FaUserShield />}
                <span>{user.role.replace("_", " ")}</span>
              </span>
              {user.isSuspended && (
                <span className="suspended-badge">
                  <FaBan /> Suspended
                </span>
              )}
            </div>
            <div className="profile2-meta">
              {memberSince && (
                <span className="profile2-meta-item">
                  <FaCalendarAlt aria-hidden="true" />
                  <span>Member since {memberSince}</span>
                </span>
              )}
              {reviewsData.total > 0 && (
                <span className="profile2-meta-item">
                  <FaStar style={{ color: "#f59e0b" }} aria-hidden="true" />
                  <span>{reviewsData.average} ({reviewsData.total} review{reviewsData.total > 1 ? "s" : ""})</span>
                </span>
              )}
            </div>
            {user.isSuspended && user.suspendedReason && (
              <p className="profile2-suspended-note">
                Reason: {user.suspendedReason}
              </p>
            )}
          </div>
          <div className="profile2-hero-actions">
            {isOwnProfile ? (
              <Link className="button-secondary" to="/profile/edit">
                <FaEdit aria-hidden="true" />
                <span>Edit profile</span>
              </Link>
            ) : (
              <>
                <button className="button" onClick={() => navigate(`/messages?to=${id}`)}>
                  <FaEnvelope aria-hidden="true" />
                  <span>Message</span>
                </button>
                {canReport && (
                  <button
                    className="button-secondary"
                    type="button"
                    onClick={() => setShowReportForm(true)}
                  >
                    <FaFlag aria-hidden="true" />
                    <span>Report</span>
                  </button>
                )}
                {canSuspend && (
                  <button
                    className={user.isSuspended ? "button-secondary" : "button-danger"}
                    type="button"
                    onClick={handleSuspendToggle}
                    disabled={actionLoading}
                  >
                    {user.isSuspended ? (
                      <>
                        <FaUserCheck aria-hidden="true" />
                        <span>{actionLoading ? "Loading..." : "Unsuspend"}</span>
                      </>
                    ) : (
                      <>
                        <FaUserSlash aria-hidden="true" />
                        <span>{actionLoading ? "Loading..." : "Suspend"}</span>
                      </>
                    )}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      <div className="profile2-tabs">
        <button
          type="button"
          className={`profile2-tab ${activeTab === "posts" ? "active" : ""}`}
          onClick={() => setActiveTab("posts")}
        >
          Posts <span className="profile2-tab-count">{totalPosts}</span>
        </button>
        <button
          type="button"
          className={`profile2-tab ${activeTab === "reviews" ? "active" : ""}`}
          onClick={() => setActiveTab("reviews")}
        >
          Reviews <span className="profile2-tab-count">{reviewsData.total}</span>
        </button>
        <button
          type="button"
          className={`profile2-tab ${activeTab === "about" ? "active" : ""}`}
          onClick={() => setActiveTab("about")}
        >
          About
        </button>
      </div>

      {activeTab === "posts" && (
        <section aria-label="Skill posts">
          {safePosts.length === 0 ? (
            <div className="empty-state">
              <h2>No posts yet</h2>
              <p>{isOwnProfile ? "Share your first skill to get started." : "This member has not shared any skills yet."}</p>
            </div>
          ) : (
            <div className="profile2-post-feed">
              {safePosts.map((post) => {
                const ownerName = user.name;
                const hasImage = post.images && post.images.length > 0;
                return (
                  <Link className="profile2-feed-card" key={post._id} to={`/posts/${post._id}`}>
                    <div className="profile2-feed-header">
                      <span
                        className="profile2-avatar"
                        style={{ background: getAvatarColor(ownerName) }}
                        aria-hidden="true"
                      >
                        {getInitials(ownerName)}
                      </span>
                      <div className="profile2-feed-header-info">
                        <span className="profile2-feed-owner">{ownerName}</span>
                        <span className="profile2-feed-meta">
                          {post.category} · {post.proficiencyLevel}
                        </span>
                      </div>
                      <span className={`profile2-pill ${post.postType === "offer" ? "profile2-pill-offer" : "profile2-pill-request"}`}>
                        {post.postType}
                      </span>
                    </div>

                    <div className="profile2-feed-body">
                      <h2 className="profile2-feed-title">{post.title}</h2>
                      {post.description && (
                        <p className="profile2-feed-desc">{post.description}</p>
                      )}
                    </div>

                    {hasImage && (
                      <div className="profile2-feed-image">
                        <img src={post.images[0]} alt={post.title} />
                        {post.images.length > 1 && (
                          <span className="profile2-feed-image-count">
                            +{post.images.length - 1} more
                          </span>
                        )}
                      </div>
                    )}

                    <div className="profile2-feed-footer">
                      <span className="profile2-feed-view">View details →</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      )}

      {activeTab === "reviews" && (
        <section className="profile2-reviews" aria-label="Reviews">
          {!isOwnProfile && (
            <div className="profile2-reviews-action">
              <button
                type="button"
                className={myReview ? "button-secondary" : "button"}
                onClick={() => setShowReviewForm(true)}
              >
                <FaStar aria-hidden="true" />
                <span>{myReview ? "Update your review" : "Leave a review"}</span>
              </button>
            </div>
          )}

          {reviewsData.total === 0 ? (
            <div className="empty-state">
              <span className="empty-state-icon"><FaStar /></span>
              <h2>No reviews yet</h2>
              <p>
                {isOwnProfile
                  ? "Complete skill exchanges to receive reviews from other members."
                  : "Be the first to leave a review for this member."}
              </p>
            </div>
          ) : (
            <>
              <div className="profile2-reviews-summary">
                <div className="profile2-reviews-score">
                  <strong>{reviewsData.average}</strong>
                  <StarRating value={Math.round(reviewsData.average)} size="md" readOnly />
                </div>
                <div className="profile2-reviews-summary-meta">
                  <span className="profile2-reviews-total">
                    Based on {reviewsData.total} review{reviewsData.total > 1 ? "s" : ""}
                  </span>
                  <span className="profile2-reviews-hint">Community feedback from skill exchanges</span>
                </div>
              </div>

              <div className="profile2-review-list">
                {reviewsData.reviews.map((review) => (
                  <article className="profile2-review-item" key={review._id}>
                    <div className="profile2-review-header">
                      <span
                        className="profile2-review-avatar"
                        style={{ background: getAvatarColor(review.reviewer?.name || "?") }}
                        aria-hidden="true"
                      >
                        {getInitials(review.reviewer?.name || "?")}
                      </span>
                      <div className="profile2-review-info">
                        <strong>{review.reviewer?.name || "Anonymous"}</strong>
                        <span className="profile2-review-date">{formatDate(review.createdAt)}</span>
                      </div>
                      <StarRating value={review.rating} size="sm" readOnly />
                    </div>

                    {review.nlpSentiment && (
                      <div style={{ marginBottom: '10px' }}>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: '700',
                          padding: '3px 9px',
                          borderRadius: '99px',
                          background: 
                            review.nlpSentiment === 'positive' ? '#dcfce7' : 
                            review.nlpSentiment === 'negative' ? '#fee2e2' : '#f3f4f6',
                          color: 
                            review.nlpSentiment === 'positive' ? '#166534' : 
                            review.nlpSentiment === 'negative' ? '#991b1b' : '#4b5563',
                        }}>
                          {review.nlpSentiment === 'positive' ? '😊 Positive' : 
                           review.nlpSentiment === 'negative' ? '😠 Negative' : '😐 Neutral'}
                        </span>
                      </div>
                    )}

                    {review.comment && (
                      <p className="profile2-review-comment">{review.comment}</p>
                    )}
                  </article>
                ))}
              </div>
            </>
          )}
        </section>
      )}

      {activeTab === "about" && (
        <section className="profile2-about" aria-label="About">
          <div className="profile2-about-section">
            <h3 className="profile2-about-title">Bio</h3>
            {user.bio ? (
              <p className="profile2-about-bio">{user.bio}</p>
            ) : (
              <p className="profile2-about-empty">This member has not added a bio yet.</p>
            )}
          </div>

          <div className="profile2-about-section">
            <h3 className="profile2-about-title">
              <FaBullseye aria-hidden="true" /> Interests
            </h3>
            {hasInterests ? (
              <div className="profile2-about-tags">
                {user.interests.map((item, i) => (
                  <span className="profile2-about-tag" key={i}>{item}</span>
                ))}
              </div>
            ) : (
              <p className="profile2-about-empty">No interests listed.</p>
            )}
          </div>

          <div className="profile2-about-section">
            <h3 className="profile2-about-title">
              <FaPalette aria-hidden="true" /> Hobbies
            </h3>
            {hasHobbies ? (
              <div className="profile2-about-tags">
                {user.hobbies.map((item, i) => (
                  <span className="profile2-about-tag" key={i}>{item}</span>
                ))}
              </div>
            ) : (
              <p className="profile2-about-empty">No hobbies listed.</p>
            )}
          </div>

          <div className="profile2-about-section">
            <h3 className="profile2-about-title">
              <FaClock aria-hidden="true" /> Availability
            </h3>
            {user.availability ? (
              <p className="profile2-about-bio">{user.availability}</p>
            ) : (
              <p className="profile2-about-empty">Not specified.</p>
            )}
          </div>

          <div className="profile2-about-section">
            <h3 className="profile2-about-title">
              <FaGraduationCap aria-hidden="true" /> Preferred learning style
            </h3>
            {user.preferredLearningStyle ? (
              <p className="profile2-about-bio" style={{ textTransform: "capitalize" }}>
                {user.preferredLearningStyle}
              </p>
            ) : (
              <p className="profile2-about-empty">Not specified.</p>
            )}
          </div>

          <div className="profile2-about-section">
            <h3 className="profile2-about-title">Activity</h3>
            <div className="profile2-about-stats">
              <div className="profile2-about-stat">
                <span className="profile2-about-stat-value">{totalPosts}</span>
                <span className="profile2-about-stat-label">Total posts</span>
              </div>
              <div className="profile2-about-stat">
                <span className="profile2-about-stat-value">{offerCount}</span>
                <span className="profile2-about-stat-label">Offers</span>
              </div>
              <div className="profile2-about-stat">
                <span className="profile2-about-stat-value">{requestCount}</span>
                <span className="profile2-about-stat-label">Requests</span>
              </div>
            </div>
          </div>
        </section>
      )}

      <ReviewForm
        isOpen={showReviewForm}
        revieweeId={id}
        revieweeName={user.name}
        existingReview={myReview}
        onClose={() => setShowReviewForm(false)}
        onSubmit={handleSubmitReview}
      />

      <ReportForm
        isOpen={showReportForm}
        targetType="user"
        targetId={id}
        targetName={user.name}
        onClose={() => setShowReportForm(false)}
        onSubmit={handleSubmitUserReport}
      />
    </main>
  );
}

export default Profile;