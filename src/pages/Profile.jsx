import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { getUserProfile } from "../api";

function Profile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const token = localStorage.getItem("token");
  const myId = localStorage.getItem("userId");

  useEffect(() => {
    const fetchProfile = async () => {
      try { const res = await getUserProfile(id, token); setData(res.data); }
      catch { setError("User not found."); }
    };
    fetchProfile();
  }, [id, token]);

  if (error) return <main className="page-container"><div className="empty-state"><h2>{error}</h2></div></main>;
  if (!data) return <main className="page-container"><div className="empty-state"><p>Loading profile...</p></div></main>;

  const { user, posts, totalPosts } = data;
  const isOwnProfile = id === myId;
  return (
    <main className="page-container" style={{ maxWidth: 860 }}>
      <section className="content-card">
        <div className="profile-hero">
          <div className="avatar">{user.name.slice(0, 2).toUpperCase()}</div>
          <div><h1>{user.name}</h1><p>{user.location || "SkillShare community member"} · {totalPosts} {totalPosts === 1 ? "post" : "posts"}</p></div>
        </div>
        {user.bio && <p className="detail-copy">{user.bio}</p>}
        {!isOwnProfile && <button className="button" style={{ marginTop: 22 }} onClick={() => navigate(`/messages?to=${id}`)}>Message {user.name}</button>}
      </section>
      <h2 className="section-title">Skill posts</h2>
      {posts.length === 0 && <div className="empty-state"><p>No posts yet.</p></div>}
      <section className="post-grid">
        {posts.map((post) => <article className="post-card" key={post._id}><span className={`tag ${post.postType === "offer" ? "tag-offer" : "tag-request"}`}>{post.postType}</span><h2>{post.title}</h2><p className="post-description">{post.description}</p><p className="post-meta">{post.category} · {post.proficiencyLevel}</p><Link className="post-card-link" to={`/posts/${post._id}`}>View details →</Link></article>)}
      </section>
    </main>
  );
}

export default Profile;
