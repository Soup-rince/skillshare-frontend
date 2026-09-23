import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getSkillPosts } from "../api";

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

    try {
      setError("");
      const res = await getSkillPosts(params);
      setPosts(res.data);
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
        <Link className="button" to="/create-post">+ Share a skill</Link>
      </header>

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
        {posts.map((post) => (
          <article className="post-card" key={post._id}>
            <span className={`tag ${post.postType === "offer" ? "tag-offer" : "tag-request"}`}>{post.postType}</span>
            <h2>{post.title}</h2>
            <p className="post-description">{post.description}</p>
            <p className="post-meta">{post.category} · {post.proficiencyLevel} · by {post.owner?.name || "SkillShare member"}</p>
            <Link className="post-card-link" to={`/posts/${post._id}`}>View details →</Link>
          </article>
        ))}
      </section>
    </main>
  );
}

export default Browse;
