import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getSkillPosts } from "../api";


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
  const [posts, setPosts] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState("");
  const [postType, setPostType] = useState("");
  const [error, setError] = useState("");

  const fetchPosts = async () => {
    const params = {};
    if (keyword) params.keyword = keyword;
    if (category) params.category = category;
    if (postType) params.postType = postType;

    // May filter ba? Kung oo, latest-first. Kung wala, random.
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

  useEffect(() => {
    const initialLoad = window.setTimeout(fetchPosts, 0);
    return () => window.clearTimeout(initialLoad);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchPosts();
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
          <option value="">All categories</option><option value="music">Music</option><option value="programming">Programming</option><option value="language">Language</option><option value="art">Art</option>
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
              <h2>{post.title}</h2>
              <p className="post-description">{post.description}</p>
              <p className="post-meta">{post.category} · {post.proficiencyLevel} · by {ownerName}</p>
              <span className="post-card-link">View details →</span>
            </Link>
          );
        })}
      </section>
    </main>
  );
}

export default Browse;