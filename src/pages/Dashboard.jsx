import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getDashboard } from "../api";

function Dashboard() {
  const [data, setData] = useState(null);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchDashboard = async () => {
      const res = await getDashboard(token);
      setData(res.data);
    };
    fetchDashboard();
  }, []);

  if (!data) return <p style={{ textAlign: "center", marginTop: 40 }}>Loading...</p>;

  return (
    <div style={{ maxWidth: 700, margin: "30px auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
  <     h2>Your Dashboard</h2>
        {data.unreadMessages > 0 && (
        <span style={{ background: "#e6f1fb", color: "#185fa5", padding: "4px 12px", borderRadius: 20, fontSize: 13, fontWeight: 600 }}>
          {data.unreadMessages} unread message{data.unreadMessages > 1 ? "s" : ""}
        </span>
  )}
</div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 30 }}>
        <div style={{ background: "#f6f5f2", borderRadius: 10, padding: "14px 16px" }}>
          <div style={{ fontSize: 12, color: "#666" }}>Your Posts</div>
          <div style={{ fontSize: 22, fontWeight: 600 }}>{data.totalPosts}</div>
        </div>
        <div style={{ background: "#f6f5f2", borderRadius: 10, padding: "14px 16px" }}>
          <div style={{ fontSize: 12, color: "#666" }}>Unread Messages</div>
          <div style={{ fontSize: 22, fontWeight: 600 }}>{data.unreadMessages}</div>
        </div>
      </div>

      <h3>Your Posts</h3>
      {data.myPosts.length === 0 && <p style={{ color: "#888" }}>No posts yet.</p>}
      {data.myPosts.map((post) => (
        <div key={post._id} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #eee" }}>
          <div>
            <strong>{post.title}</strong>
            <div style={{ fontSize: 12, color: "#666" }}>{post.postType} · {post.category}</div>
          </div>
          <div>
            <Link to={`/posts/${post._id}`}>View</Link>{" · "}
            <Link to={`/posts/${post._id}/edit`}>Edit</Link>
        </div>
        </div>
      ))}

      <h3 style={{ marginTop: 30 }}>Recent Messages</h3>
      {data.recentMessages.length === 0 && <p style={{ color: "#888" }}>No messages yet.</p>}
      {data.recentMessages.map((msg) => (
        <Link key={msg._id} to={`/messages?to=${msg.partnerId}`} style={{ textDecoration: "none", color: "inherit" }}>
          <div style={{ padding: "8px 0", borderBottom: "1px solid #eee", fontSize: 13 }}>
            <strong>{msg.isMine ? `You → ${msg.partnerName}` : msg.partnerName}:</strong> {msg.content}
          </div>
      </Link>
    ))}
    </div>
  );
}

export default Dashboard;