import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaStar, FaTrash } from "react-icons/fa";
import { getSkillPosts, getMatches, searchUsers, deletePost } from "../api";
import { CATEGORIES } from "../constants/categories";
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

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function Browse() {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const [activeTab, setActiveTab] = useState("posts");

  const [posts, setPosts] = useState([]);
  const [matches, setMatches] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState("");
  const [postType, setPostType] = useState("");
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState("");

  const [memberQuery, setMemberQuery] = useState("");
  const [members, setMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersError, setMembersError] = useState("");
  const [membersPage, setMembersPage] = useState(1);
  const [membersTotalPages, setMembersTotalPages] = useState(1);

  const token = localStorage.getItem("token");
  const userRole = localStorage.getItem("role");
  const isModerator = userRole === "moderator";
  const isSuperAdmin = userRole === "super_admin";
  const canDeleteAny = isModerator || isSuperAdmin;

  const fetchPosts = async () => {
    const params = {};
    if (keyword) params.keyword = keyword;
    if (category) params.category = category;
    if (postType) params.postType = postType;

    const hasFilter = Boolean(keyword || category || postType);

    try {
      setError("");
      const res = await getSkillPosts(params);
      const data = res.data;
      setPosts(hasFilter ? data : shuffleArray(data));
    } catch {
      setError("We could not load skill posts. Please try again.");
    }
  };

  const fetchMatches = async () => {
    try {
      const res = await getMatches(token);
      setMatches(res.data.matches || []);
    } catch {
      setMatches([]);
    }
  };

  useEffect(() => {
    const initialLoad = window.setTimeout(() => {
      fetchPosts();
      fetchMatches();
    }, 0);
    return () => window.clearTimeout(initialLoad);
  }, []);

  useEffect(() => {
    if (activeTab !== "members") return;

    const timer = window.setTimeout(async () => {
      try {
        setMembersLoading(true);
        setMembersError("");
        const res = await searchUsers(memberQuery, membersPage, 12, token);
        setMembers(res.data.data || []);
        setMembersTotalPages(res.data.totalPages || 1);
      } catch {
        setMembersError("We could not load members. Please try again.");
        setMembers([]);
      } finally {
        setMembersLoading(false);
      }
    }, 300);

    return () => window.clearTimeout(timer);
  }, [activeTab, memberQuery, membersPage]);

  useEffect(() => {
    setMembersPage(1);
  }, [memberQuery]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchPosts();
  };

  const handleDeletePost = async (e, post) => {
    e.preventDefault();
    e.stopPropagation();

    const ok = await confirm({
      title: "Delete this post?",
      message: `The post "${post.title || "Untitled"}" will be permanently deleted. The post owner will be notified.`,
      confirmLabel: "Delete post",
      cancelLabel: "Cancel",
      tone: "danger",
    });
    if (!ok) return;

    try {
      setDeletingId(post._id);
      await deletePost(post._id, token);
      setPosts((current) => current.filter((p) => p._id !== post._id));
    } catch (err) {
      setError(err.response?.data?.message || "Unable to delete this post.");
    } finally {
      setDeletingId("");
    }
  };

  return (
    <main className="page-container browse-page">
      <header className="browse-hero">
        <div className="browse-hero-text">
          <p className="eyebrow">Community skills</p>
          <h1>Explore skill exchanges</h1>
          <p className="browse-hero-sub">
            Discover what people can teach and what they want to learn.
          </p>
        </div>
        <Link className="browse-hero-cta" to="/create-post">
          + Share a skill
        </Link>
      </header>

      <div className="browse-tabs" role="tablist" aria-label="Browse mode">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "posts"}
          className={`browse-tab ${activeTab === "posts" ? "active" : ""}`}
          onClick={() => setActiveTab("posts")}
        >
          Skill posts
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "members"}
          className={`browse-tab ${activeTab === "members" ? "active" : ""}`}
          onClick={() => setActiveTab("members")}
        >
          Members
        </button>
      </div>

      {activeTab === "posts" && (
        <>
          {matches.length > 0 && (
            <section className="browse-section" aria-label="Recommended for you">
              <div className="browse-section-header">
                <h2 className="browse-section-title">
                  <FaStar aria-hidden="true" />
                  <span>Recommended for you</span>
                </h2>
                <p className="browse-section-sub">
                  Based on your skills, interests, and availability
                </p>
              </div>
              <div className="browse-scroll-row">
                {matches.map((match) => {
                  const post = match.post;
                  const ownerName = post?.owner?.name || "SkillShare member";
                  const scorePercent = Math.round((match.matchScore || 0) * 100);
                  return (
                    <Link
                      className="browse-match-card"
                      key={match.postId}
                      to={`/posts/${match.postId}`}
                    >
                      <div className="browse-match-score">
                        {scorePercent}% match
                      </div>
                      <div className="browse-match-body">
                        <span
                          className="browse-avatar browse-avatar-sm"
                          style={{ background: getAvatarColor(ownerName) }}
                          aria-hidden="true"
                        >
                          {getInitials(ownerName)}
                        </span>
                        <div className="browse-match-info">
                          <strong>{post?.title || "Untitled post"}</strong>
                          <span className="browse-match-owner">by {ownerName}</span>
                        </div>
                      </div>
                      <div className="browse-match-footer">
                        <span className={`browse-pill ${post?.postType === "offer" ? "browse-pill-offer" : "browse-pill-request"}`}>
                          {post?.postType}
                        </span>
                        <span className="browse-match-category">{post?.category}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          <form className="browse-toolbar" onSubmit={handleSearch}>
            <input
              className="browse-input"
              aria-label="Search skill posts"
              placeholder="Search a skill, topic, or keyword"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
            <select
              className="browse-select"
              aria-label="Filter by category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">All categories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
            <select
              className="browse-select"
              aria-label="Filter by post type"
              value={postType}
              onChange={(e) => setPostType(e.target.value)}
            >
              <option value="">Offers and requests</option>
              <option value="offer">Offers</option>
              <option value="request">Requests</option>
            </select>
            <button className="browse-btn-primary" type="submit">
              Search
            </button>
          </form>

          {error && <p className="alert" style={{ marginTop: 18 }}>{error}</p>}

          {!error && posts.length === 0 && (
            <div className="browse-empty">
              <div className="browse-empty-icon">🔍</div>
              <h2>No skill posts found</h2>
              <p>Try changing your filters or be the first to share a skill.</p>
              <Link className="browse-btn-primary" to="/create-post">
                + Share a skill
              </Link>
            </div>
          )}

          <section className="browse-feed" aria-label="Skill posts">
            {posts.map((post) => {
              const ownerName = post.owner?.name || "SkillShare member";
              const hasImage = post.images && post.images.length > 0;
              return (
                <Link className="browse-feed-card" key={post._id} to={`/posts/${post._id}`}>
                  <div className="browse-feed-header">
                    <span
                      className="browse-avatar browse-avatar-md"
                      style={{ background: getAvatarColor(ownerName) }}
                      aria-hidden="true"
                    >
                      {getInitials(ownerName)}
                    </span>
                    <div className="browse-feed-header-info">
                      <span className="browse-feed-owner">{ownerName}</span>
                      <span className="browse-feed-meta">
                        {post.category} · {post.proficiencyLevel}
                      </span>
                    </div>
                    <span className={`browse-pill ${post.postType === "offer" ? "browse-pill-offer" : "browse-pill-request"}`}>
                      {post.postType}
                    </span>
                  </div>

                  <div className="browse-feed-body">
                    <h2 className="browse-feed-title">{post.title}</h2>
                    {post.description && (
                      <p className="browse-feed-desc">{post.description}</p>
                    )}
                    {post.aiTags && post.aiTags.length > 0 && (
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '12px' }}>
                        {post.aiTags.map((tag, idx) => (
                          <span key={idx} style={{ background: '#f0f2ff', color: '#2639ba', fontSize: '11px', padding: '3px 8px', borderRadius: '99px', fontWeight: '600' }}>
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {hasImage && (
                    <div className="browse-feed-image">
                      <img src={post.images[0]} alt={post.title} />
                      {post.images.length > 1 && (
                        <span className="browse-feed-image-count">
                          +{post.images.length - 1} more
                        </span>
                      )}
                    </div>
                  )}

                  <div className="browse-feed-footer">
                    <span className="browse-feed-view">
                      View details →
                    </span>
                  </div>

                  {canDeleteAny && (
                    <button
                      type="button"
                      className="browse-feed-delete"
                      onClick={(e) => handleDeletePost(e, post)}
                      disabled={deletingId === post._id}
                      aria-label="Delete post"
                    >
                      <FaTrash />
                    </button>
                  )}
                </Link>
              );
            })}
          </section>
        </>
      )}

      {activeTab === "members" && (
        <section aria-label="Members">
          <form className="browse-toolbar" onSubmit={(e) => e.preventDefault()}>
            <input
              className="browse-input"
              aria-label="Search members"
              placeholder="Search members by name, bio, interests, or hobbies"
              value={memberQuery}
              onChange={(e) => setMemberQuery(e.target.value)}
            />
          </form>

          {membersError && <p className="alert" style={{ marginTop: 18 }}>{membersError}</p>}

          {membersLoading && (
            <div className="browse-empty">
              <p>Searching members…</p>
            </div>
          )}

          {!membersLoading && !membersError && members.length === 0 && (
            <div className="browse-empty">
              <div className="browse-empty-icon">👥</div>
              <h2>No members found</h2>
              <p>
                {memberQuery
                  ? `No members matched "${memberQuery}". Try a different keyword.`
                  : "No members to show right now."}
              </p>
            </div>
          )}

          {!membersLoading && members.length > 0 && (
            <>
              <section className="browse-member-grid" aria-label="Members">
                {members.map((user) => {
                  const displayName = user.name || "SkillShare member";
                  const tags = [
                    ...(user.interests || []).slice(0, 2),
                    ...(user.hobbies || []).slice(0, 1),
                  ];
                  return (
                    <Link
                      className="browse-member-card"
                      key={user._id}
                      to={`/profile/${user._id}`}
                    >
                      <span
                        className="browse-avatar browse-avatar-md"
                        style={{ background: getAvatarColor(displayName) }}
                        aria-hidden="true"
                      >
                        {getInitials(displayName)}
                      </span>
                      <h2 className="browse-member-name">{displayName}</h2>
                      {user.bio && <p className="browse-member-bio">{user.bio}</p>}
                      {tags.length > 0 && (
                        <div className="browse-member-tags">
                          {tags.map((tag, i) => (
                            <span key={i} className="browse-member-tag">{tag}</span>
                          ))}
                        </div>
                      )}
                    </Link>
                  );
                })}
              </section>

              {membersTotalPages > 1 && (
                <div className="browse-pagination">
                  <button
                    type="button"
                    className="browse-btn-secondary"
                    disabled={membersPage === 1}
                    onClick={() => setMembersPage((p) => Math.max(1, p - 1))}
                  >
                    ← Prev
                  </button>
                  <span className="browse-pagination-info">
                    Page {membersPage} of {membersTotalPages}
                  </span>
                  <button
                    type="button"
                    className="browse-btn-secondary"
                    disabled={membersPage === membersTotalPages}
                    onClick={() => setMembersPage((p) => Math.min(membersTotalPages, p + 1))}
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      )}
    </main>
  );
}

export default Browse;