import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getSkillPosts } from "../api";

function Browse() {
  const [posts, setPosts] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState("");
  const [postType, setPostType] = useState("");

  const fetchPosts = async () => {
    const params = {};
    if (keyword) params.keyword = keyword;
    if (category) params.category = category;
    if (postType) params.postType = postType;

    const res = await getSkillPosts(params);
    setPosts(res.data);
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchPosts();
  };

  return (
    <div style={{ maxWidth: 700, margin: "30px auto" }}>
      <h2>Browse Skill Posts</h2>

      <form onSubmit={handleSearch} style={{ marginBottom: 20, display: "flex", gap: 8 }}>
        <input
          placeholder="Search keyword..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          style={{ flex: 1, padding: 8 }}
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ padding: 8 }}>
          <option value="">All Categories</option>
          <option value="music">Music</option>
          <option value="programming">Programming</option>
          <option value="language">Language</option>
          <option value="art">Art</option>
        </select>
        <select value={postType} onChange={(e) => setPostType(e.target.value)} style={{ padding: 8 }}>
          <option value="">All Types</option>
          <option value="offer">Offer</option>
          <option value="request">Request</option>
        </select>
        <button type="submit">Search</button>
      </form>

      {posts.length === 0 && <p>No posts found.</p>}

      {posts.map((post) => (
        <div key={post._id} style={{ border: "1px solid #ddd", borderRadius: 8, padding: 15, marginBottom: 10 }}>
          <h3>{post.title}</h3>
          <p>{post.description}</p>
          <small>
            {post.category} · {post.proficiencyLevel} · {post.postType} · by {post.owner?.name}
          </small>
          <br />
          <Link to={`/posts/${post._id}`}>View Details</Link>
        </div>
      ))}
    </div>
  );
}

export default Browse;