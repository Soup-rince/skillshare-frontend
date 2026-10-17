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

  // Posts state
  const [posts, setPosts] = useState([]);
  const [matches, setMatches] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState("");
  const [postType, setPostType] = useState("");
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState("");

  // Members state
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
    <main className="page-container">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Community skills</p>
          <h1>Explore skill exchanges</h1>
          <p>Discover what people can teach and what they want to learn.</p>
        </div>
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
            <section className="matches-section" aria-label="Recommended for you">
              <div className="matches-header">
                <h2>
                  <FaStar aria-hidden="true" />
                  <span>Recommended for you</span>
                </h2>
                <p>Based on your skills, interests, and availability</p>
              </div>
              <div className="matches-scroll">
                {matches.map((match) => {
                  const post = match.post;
                  const ownerName = post?.owner?.name || "SkillShare member";
                  const scorePercent = Math.round((match.matchScore || 0) * 100);
                  return (
                    <Link
                      className="match-card"
                      key={match.postId}
                      to={`/posts/${match.postId}`}
                    >
                      <div className="match-score-badge">
                        {scorePercent}% match
                      </div>
                      <div className="match-card-body">
                        <span
                          className="match-avatar"
                          style={{ background: getAvatarColor(ownerName) }}
                          aria-hidden="true"
                        >
                          {getInitials(ownerName)}
                        </span>
                        <div className="match-info">
                          <strong>{post?.title || "Untitled post"}</strong>
                          <span className="match-owner">by {ownerName}</span>
                        </div>
                      </div>
                      <div className="match-card-footer">
                        <span className={`tag ${post?.postType === "offer" ? "tag-offer" : "tag-request"}`}>
                          {post?.postType}
                        </span>
                        <span className="match-category">{post?.category}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          <section className="share-banner" aria-label="Share a skill">
            <div className="share-banner-text">
              <h2>Have a skill to share?</h2>
              <p>Post what you can teach or what you want to learn,  someone out there is looking for exactly that.</p>
            </div>
            <Link className="button share-banner-cta" to="/create-post">+ Share a skill</Link>
          </section>

          <form className="toolbar" onSubmit={handleSearch}>
            <input aria-label="Search skill posts" placeholder="Search a skill, topic, or keyword" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
            <select aria-label="Filter by category" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">All categories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
            <select aria-label="Filter by post type" value={postType} onChange={(e) => setPostType(e.target.value)}>
              <option value="">Offers and requests</option><option value="offer">Offers</option><option value="request">Requests</option>
            </select>
            <button className="button" type="submit">Search</button>
          </form>

          {error && <p className="alert" style={{ marginTop: 18 }}>{error}</p>}
          {!error && posts.length === 0 && <div className="empty-state"><h2>No skill posts found</h2><p>Try changing your filters or be the first to share a skill.</p></div>}

          <section className="post-grid" aria-label="Skill posts">
            {posts.map((post) => {
              const ownerName = post.owner?.name || "SkillShare member";
              return (
                <Link className="post-card" key={post._id} to={`/posts/${post._id}`}>
                  <div className="post-card-header">
                    <span
                      className="post-avatar"
                      style={{ background: getAvatarColor(ownerName) }}
                      aria-hidden="true"
                    >
                      {getInitials(ownerName)}
                    </span>
                    <span className={`tag ${post.postType === "offer" ? "tag-offer" : "tag-request"}`}>{post.postType}</span>
                  </div>
                  {post.images && post.images.length > 0 && (
                    <div className="post-card-image">
                      <img
                        src={post.images[0]}
                        alt={post.title}
                        className="post-card-image-thumb"
                      />
                      {post.images.length > 1 && (
                        <span className="post-card-image-count">
                          +{post.images.length - 1}
                        </span>
                      )}
                    </div>
                  )}
                  <h2>{post.title}</h2>
                  <p className="post-description">{post.description}</p>
                  <p className="post-meta">{post.category} · {post.proficiencyLevel} · by {ownerName}</p>
                  <span className="post-card-link">View details →</span>

                  {canDeleteAny && (
                    <button
                      type="button"
                      className="post-card-admin-delete"
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
          <form className="toolbar" onSubmit={(e) => e.preventDefault()}>
            <input
              aria-label="Search members"
              placeholder="Search members by name, bio, interests, or hobbies"
              value={memberQuery}
              onChange={(e) => setMemberQuery(e.target.value)}
            />
          </form>

          {membersError && <p className="alert" style={{ marginTop: 18 }}>{membersError}</p>}

          {membersLoading && (
            <div className="empty-state"><p>Searching members…</p></div>
          )}

          {!membersLoading && !membersError && members.length === 0 && (
            <div className="empty-state">
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
              <section className="user-grid" aria-label="Members">
                {members.map((user) => {
                  const displayName = user.name || "SkillShare member";
                  const tags = [
                    ...(user.interests || []).slice(0, 2),
                    ...(user.hobbies || []).slice(0, 1),
                  ];
                  return (
                    <Link
                      className="user-card"
                      key={user._id}
                      to={`/profile/${user._id}`}
                    >
                      <span
                        className="user-avatar"
                        style={{ background: getAvatarColor(displayName) }}
                        aria-hidden="true"
                      >
                        {getInitials(displayName)}
                      </span>
                      <h2 className="user-name">{displayName}</h2>
                      {user.bio && <p className="user-bio">{user.bio}</p>}
                      {tags.length > 0 && (
                        <div className="user-tags">
                          {tags.map((tag, i) => (
                            <span key={i} className="user-tag">{tag}</span>
                          ))}
                        </div>
                      )}
                    </Link>
                  );
                })}
              </section>

              {membersTotalPages > 1 && (
                <div className="pagination">
                  <button
                    type="button"
                    className="button"
                    disabled={membersPage === 1}
                    onClick={() => setMembersPage((p) => Math.max(1, p - 1))}
                  >
                    ← Prev
                  </button>
                  <span className="pagination-info">
                    Page {membersPage} of {membersTotalPages}
                  </span>
                  <button
                    type="button"
                    className="button"
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