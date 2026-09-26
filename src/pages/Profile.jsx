import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { FaMapMarkerAlt, FaCalendarAlt, FaEdit, FaEnvelope, FaBullseye, FaPalette } from "react-icons/fa";
import { getUserProfile } from "../api";

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

function Profile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("posts");
  const token = localStorage.getItem("token");
  const myId = localStorage.getItem("userId");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await getUserProfile(id, token);
        setData(res.data);
      } catch {
        setError("User not found.");
      }
    };
    fetchProfile();
  }, [id, token]);

  if (error) return <main className="page-container"><div className="empty-state"><h2>{error}</h2></div></main>;
  if (!data) return <main className="page-container"><div className="empty-state"><p>Loading profile...</p></div></main>;

  const { user, posts, totalPosts } = data;
  const isOwnProfile = id === myId;
  const offerCount = posts.filter((p) => p.postType === "offer").length;
  const requestCount = posts.filter((p) => p.postType === "request").length;
  const memberSince = formatMemberSince(user.createdAt);
  const hasInterests = user.interests && user.interests.length > 0;
  const hasHobbies = user.hobbies && user.hobbies.length > 0;

  return (
    <main className="page-container profile-page">
      <section className="profile-header-card">
        <div className="profile-header-top">
          <div className="profile-avatar" style={{ background: getAvatarColor(user.name) }}>
            {getInitials(user.name)}
          </div>
          <div className="profile-header-info">
            <h1>{user.name}</h1>
            <div className="profile-meta">
              {user.location && (
                <span className="profile-meta-item">
                  <FaMapMarkerAlt aria-hidden="true" />
                  <span>{user.location}</span>
                </span>
              )}
              {memberSince && (
                <span className="profile-meta-item">
                  <FaCalendarAlt aria-hidden="true" />
                  <span>Member since {memberSince}</span>
                </span>
              )}
            </div>
          </div>
          <div className="profile-header-actions">
            {isOwnProfile ? (
              <Link className="button-secondary" to="/profile/edit">
                <FaEdit aria-hidden="true" />
                <span>Edit profile</span>
              </Link>
            ) : (
              <button className="button" onClick={() => navigate(`/messages?to=${id}`)}>
                <FaEnvelope aria-hidden="true" />
                <span>Message</span>
              </button>
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
    </main>
  );
}

export default Profile;