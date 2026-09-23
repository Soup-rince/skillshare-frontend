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
      try { const res = await getPostById(id); setPost(res.data); }
      catch { setError("Post not found."); }
    };
    fetchPost();
  }, [id]);

  if (error) return <main className="page-container"><div className="empty-state"><h2>{error}</h2><Link className="button-secondary" to="/browse">Back to Browse</Link></div></main>;
  if (!post) return <main className="page-container"><div className="empty-state"><p>Loading skill post...</p></div></main>;

  return (
    <main className="page-container detail-layout">
      <article className="content-card">
        <div className="detail-meta">Posted by <Link to={`/profile/${post.owner?._id}`}>{post.owner?.name || "SkillShare member"}</Link><span>·</span><span>{new Date(post.createdAt).toLocaleDateString()}</span></div>
        <div className="tag-row"><span className={`tag ${post.postType === "offer" ? "tag-offer" : "tag-request"}`}>{post.postType}</span><span className="tag tag-neutral">{post.category}</span><span className="tag tag-neutral">{post.proficiencyLevel}</span></div>
        <h1 className="detail-title">{post.title}</h1>
        <p className="detail-copy">{post.description}</p>
        {post.owner?._id !== myId && <button className="button" style={{ marginTop: 28 }} onClick={() => navigate(`/messages?to=${post.owner._id}`)}>Message {post.owner?.name}</button>}
      </article>
    </main>
  );
}

export default PostDetail;
