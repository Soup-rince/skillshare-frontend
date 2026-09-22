import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getPostById } from "../api";

function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [error, setError] = useState("");
  const myId = localStorage.getItem("userId");

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await getPostById(id);
        setPost(res.data);
      } catch (err) {
        setError("Post not found");
      }
    };
    fetchPost();
  }, [id]);

  const handleMessage = () => {
    navigate(`/messages?to=${post.owner._id}`);
  };

  if (error) return <p style={{ textAlign: "center", marginTop: 40 }}>{error}</p>;
  if (!post) return <p style={{ textAlign: "center", marginTop: 40 }}>Loading...</p>;

  return (
    <div style={{ maxWidth: 520, margin: "30px auto" }}>
      <p style={{ fontSize: 13, color: "#666" }}>
        Posted by{" "}
        <Link to={`/profile/${post.owner?._id}`} style={{ fontWeight: "bold", color: "#0f6e56" }}>
          {post.owner?.name}
        </Link>{" "}
        · {new Date(post.createdAt).toLocaleDateString()}
      </p>

      <div style={{ margin: "10px 0" }}>
        <span style={{ background: post.postType === "offer" ? "#eaf3de" : "#e6f1fb", padding: "3px 10px", borderRadius: 20, fontSize: 12, marginRight: 6 }}>
          {post.postType === "offer" ? "Offer" : "Request"}
        </span>
        <span style={{ background: "#f1efe8", padding: "3px 10px", borderRadius: 20, fontSize: 12, marginRight: 6 }}>
          {post.category}
        </span>
        <span style={{ background: "#f1efe8", padding: "3px 10px", borderRadius: 20, fontSize: 12 }}>
          {post.proficiencyLevel}
        </span>
      </div>

      <h2>{post.title}</h2>
      <p style={{ color: "#444", lineHeight: 1.6 }}>{post.description}</p>

      {post.owner?._id !== myId && (
        <button onClick={handleMessage} style={{ width: "100%", padding: 12, marginTop: 20 }}>
         Message {post.owner?.name}
        </button>
)}
    </div>
  );
}

export default PostDetail;