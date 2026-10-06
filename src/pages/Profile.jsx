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
  FaBan
} from "react-icons/fa";
import {
  getUserProfile,
  getUserReviews,
  getMyReviewForUser,
  createReview,
  suspendUser,
  unsuspendUser
} from "../api";
import { useConfirm } from "../contexts/ConfirmContext";
import StarRating from "../components/StarRating";
import ReviewForm from "../components/ReviewForm";

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
  const [actionLoading, setActionLoading] = useState(false);
  const token = localStorage.getItem("token");
  const myId = localStorage.getItem("userId");
  const isSuperAdmin = localStorage.getItem("role") === "super_admin";

  const fetchProfile = async () => {
    try {
      const res = await getUserProfile(id, token);
      setData(res.data);
    } catch {
      setError("User not found.");
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [id, token]);

  useEffect(() => {
    if (!id) return;
    const fetchReviews = async () => {
      try {
        const res = await getUserReviews(id, token);
        setReviewsData(res.data);
      } catch {
        // silent
      }
    };
    fetchReviews();
  }, [id, token]);

  useEffect(() => {
    if (!id || id === myId) return;
    const fetchMyReview = async () => {
      try {
        const res = await getMyReviewForUser(id, token);
        setMyReview(res.data);
      } catch {
        // silent
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

  const handleSuspendToggle = async () => {
    if (!data) return;
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
        await unsuspendUser(user._id, token);
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

  const { user, posts, totalPosts } = data;
  const isOwnProfile = id === myId;
  const offerCount = posts.filter((p) => p.postType === "offer").length;
  const requestCount = posts.filter((p) => p.postType === "request").length;
  const memberSince = formatMemberSince(user.createdAt);
  const hasInterests = user.interests && user.interests.length > 0;
  const hasHobbies = user.hobbies && user.hobbies.length > 0;
  const canSuspend = isSuperAdmin && !isOwnProfile && user.role !== "super_admin";

  return (
    <main className="page-container profile-page">
      <section className="profile-header-card">
        <div className="profile-header-top">
          <div className="profile-avatar" style={{ background: getAvatarColor(user.name) }}>
            {getInitials(user.name)}
          </div>
          <div className="profile-header-info">
            <div className="profile-name-row">
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
            <div className="profile-meta">
              {memberSince && (
                <span className="profile-meta-item">
                  <FaCalendarAlt aria-hidden="true" />
                  <span>Member since {memberSince}</span>
                </span>
              )}
              {reviewsData.total > 0 && (
                <span className="profile-meta-item">
                  <FaStar style={{ color: "#f59e0b" }} aria-hidden="true" />
                  <span>{reviewsData.average} ({reviewsData.total} review{reviewsData.total > 1 ? "s" : ""})</span>
                </span>
              )}
            </div>
            {user.isSuspended && user.suspendedReason && (
              <p className="profile-suspended-note">
                Reason: {user.suspendedReason}
              </p>
            )}
          </div>
          <div className="profile-header-actions">
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

      <div className="profile-tabs">
        <button
          type="button"
          className={`profile-tab ${activeTab === "posts" ? "active" : ""}`}
          onClick={() => setActiveTab("posts")}
        >
          Posts <span className="profile-tab-count">{totalPosts}</span>
        </button>
        <button
          type="button"
          className={`profile-tab ${activeTab === "reviews" ? "active" : ""}`}
          onClick={() => setActiveTab("reviews")}
        >
          Reviews <span className="profile-tab-count">{reviewsData.total}</span>
        </button>
        <button
          type="button"
          className={`profile-tab ${activeTab === "about" ? "active" : ""}`}
          onClick={() => setActiveTab("about")}
        >
          About
        </button>
      </div>

      {activeTab === "posts" && (
        <section aria-label="Skill posts">
          {posts.length === 0 ? (
            <div className="empty-state">
              <h2>No posts yet</h2>
              <p>{isOwnProfile ? "Share your first skill to get started." : "This member has not shared any skills yet."}</p>
            </div>
          ) : (
            <div className="profile-post-feed">
              {posts.map((post) => {
                const ownerName = user.name;
                return (
                  <Link className="post-card" key={post._id} to={`/posts/${post._id}`}>
                    <div className="post-card-header">
                      <span className="post-avatar" style={{ background: getAvatarColor(ownerName) }} aria-hidden="true">
                        {getInitials(ownerName)}
                      </span>
                      <span className={`tag ${post.postType === "offer" ? "tag-offer" : "tag-request"}`}>{post.postType}</span>
                    </div>
                    <h2>{post.title}</h2>
                    <p className="post-description">{post.description}</p>
                    <p className="post-meta">{post.category} · {post.proficiencyLevel}</p>
                    <span className="post-card-link">View details →</span>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      )}

      {activeTab === "reviews" && (
        <section className="profile-reviews" aria-label="Reviews">
          {!isOwnProfile && (
            <div className="reviews-action-bar">
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
              <div className="reviews-summary">
                <div className="reviews-summary-score">
                  <strong>{reviewsData.average}</strong>
                  <StarRating value={Math.round(reviewsData.average)} size="sm" readOnly />
                  <span>{reviewsData.total} review{reviewsData.total > 1 ? "s" : ""}</span>
                </div>
              </div>

              <div className="review-list">
                {reviewsData.reviews.map((review) => (
                  <article className="review-item" key={review._id}>
                    <div className="review-item-header">
                      <span
                        className="review-item-avatar"
                        style={{ background: getAvatarColor(review.reviewer?.name || "?") }}
                        aria-hidden="true"
                      >
                        {getInitials(review.reviewer?.name || "?")}
                      </span>
                      <div className="review-item-info">
                        <strong>{review.reviewer?.name || "Anonymous"}</strong>
                        <span className="review-item-date">{formatDate(review.createdAt)}</span>
                      </div>
                      <StarRating value={review.rating} size="sm" readOnly />
                    </div>
                    {review.comment && (
                      <p className="review-item-comment">{review.comment}</p>
                    )}
                  </article>
                ))}
              </div>
            </>
          )}
        </section>
      )}

      {activeTab === "about" && (
        <section className="profile-about" aria-label="About">
          <div className="about-section">
            <h3 className="about-section-title">Bio</h3>
            {user.bio ? (
              <p className="about-bio">{user.bio}</p>
            ) : (
              <p className="about-empty">This member has not added a bio yet.</p>
            )}
          </div>

          <div className="about-section">
            <h3 className="about-section-title">
              <FaBullseye aria-hidden="true" /> Interests
            </h3>
            {hasInterests ? (
              <div className="about-tags">
                {user.interests.map((item, i) => (
                  <span className="about-tag" key={i}>{item}</span>
                ))}
              </div>
            ) : (
              <p className="about-empty">No interests listed.</p>
            )}
          </div>

          <div className="about-section">
            <h3 className="about-section-title">
              <FaPalette aria-hidden="true" /> Hobbies
            </h3>
            {hasHobbies ? (
              <div className="about-tags">
                {user.hobbies.map((item, i) => (
                  <span className="about-tag" key={i}>{item}</span>
                ))}
              </div>
            ) : (
              <p className="about-empty">No hobbies listed.</p>
            )}
          </div>

          <div className="about-section">
            <h3 className="about-section-title">
              <FaClock aria-hidden="true" /> Availability
            </h3>
            {user.availability ? (
              <p className="about-bio">{user.availability}</p>
            ) : (
              <p className="about-empty">Not specified.</p>
            )}
          </div>

          <div className="about-section">
            <h3 className="about-section-title">
              <FaGraduationCap aria-hidden="true" /> Preferred learning style
            </h3>
            {user.preferredLearningStyle ? (
              <p className="about-bio" style={{ textTransform: "capitalize" }}>
                {user.preferredLearningStyle}
              </p>
            ) : (
              <p className="about-empty">Not specified.</p>
            )}
          </div>

          <div className="about-section">
            <h3 className="about-section-title">Activity</h3>
            <div className="about-stats">
              <div className="about-stat">
                <span className="about-stat-value">{totalPosts}</span>
                <span className="about-stat-label">Total posts</span>
              </div>
              <div className="about-stat">
                <span className="about-stat-value">{offerCount}</span>
                <span className="about-stat-label">Offers</span>
              </div>
              <div className="about-stat">
                <span className="about-stat-value">{requestCount}</span>
                <span className="about-stat-label">Requests</span>
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
    </main>
  );
}

export default Profile;