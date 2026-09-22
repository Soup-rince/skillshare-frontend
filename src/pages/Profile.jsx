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
      try {
        const res = await getUserProfile(id, token);
        setData(res.data);
      } catch (err) {
        setError("User not found");
      }
    };
    fetchProfile();
  }, [id]);

  const handleMessage = () => {
    navigate(`/messages?to=${id}`);
  };

  if (error) return <p style={{ textAlign: "center", marginTop: 40 }}>{error}</p>;
  if (!data) return <p style={{ textAlign: "center", marginTop: 40 }}>Loading...</p>;

  const { user, posts, totalPosts } = data;
  const isOwnProfile = id === myId;

  return (
    <div style={{ maxWidth: 600, margin: "30px auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
        <div style={{
          width: 64, height: 64, borderRadius: "50%",
          background: "#e1f5ee", display: "flex", alignItems: "center",
          justifyContent: "center", fontSize: 22, fontWeight: 600, color: "#085041"
        }}>
          {user.name.slice(0, 2).toUpperCase()}
        </div>
        <div>
          <h2 style={{ margin: 0 }}>{user.name}</h2>
          <p style={{ margin: "4px 0", color: "#666", fontSize: 13 }}>
            {user.location || "No location set"} · {totalPosts} posts
          </p>
        </div>
      </div>

      {!isOwnProfile && (
        <button onClick={handleMessage} style={{ padding: "10px 20px", marginBottom: 24 }}>
          Message
        </button>
      )}

      {user.bio && <p style={{ color: "#444", marginBottom: 24 }}>{user.bio}</p>}

      <h3>Skill Posts</h3>
      {posts.length === 0 && <p style={{ color: "#888" }}>No posts yet.</p>}
      {posts.map((post) => (
        <div key={post._id} style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12, marginBottom: 10 }}>
          <strong>{post.title}</strong>
          <p style={{ margin: "4px 0", fontSize: 13, color: "#666" }}>
            {post.postType === "offer" ? "Offer" : "Request"} · {post.category}
          </p>
          <Link to={`/posts/${post._id}`}>View Details</Link>
        </div>
      ))}
    </div>
  );
}

export default Profile;