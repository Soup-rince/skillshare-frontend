import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getDashboard } from "../api";

function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchDashboard = async () => {
      try { const res = await getDashboard(token); setData(res.data); }
      catch { setError("We could not load your dashboard."); }
    };
    fetchDashboard();
  }, [token]);

  if (error) return <main className="page-container"><p className="alert">{error}</p></main>;
  if (!data) return <main className="page-container"><div className="empty-state"><p>Loading your dashboard...</p></div></main>;

  return (
    <main className="page-container">
      <header className="page-heading">
        <div><p className="eyebrow">Your space</p><h1>Dashboard</h1><p>Keep track of your skill posts and conversations.</p></div>
        <Link className="button" to="/create-post">+ New post</Link>
      </header>
      <section className="dashboard-stats">
        <div className="stat-card"><span className="stat-label">Your posts</span><strong className="stat-value">{data.totalPosts}</strong></div>
        <div className="stat-card"><span className="stat-label">Unread messages</span><strong className="stat-value">{data.unreadMessages}</strong></div>
        <div className="stat-card"><span className="stat-label">Recent activity</span><strong className="stat-value">{data.recentMessages.length}</strong></div>
      </section>

      <h2 className="section-title">Your skill posts</h2>
      {data.myPosts.length === 0 ? <div className="empty-state"><h2>You have not shared a skill yet</h2><p>Create your first post to start connecting with the community.</p></div> : <div className="list-card">
        {data.myPosts.map((post) => <div className="list-item" key={post._id}><div><strong>{post.title}</strong><small>{post.postType} · {post.category} · {post.proficiencyLevel}</small></div><div className="list-actions"><Link to={`/posts/${post._id}`}>View</Link><Link to={`/posts/${post._id}/edit`}>Edit</Link></div></div>)}
      </div>}

      <h2 className="section-title">Recent messages</h2>
      {data.recentMessages.length === 0 ? <div className="empty-state"><p>No messages yet. Browse skill posts to start a conversation.</p></div> : <div className="list-card">
        {data.recentMessages.map((msg) => <Link className="list-item" key={msg._id} to={`/messages?to=${msg.partnerId}`}><div><strong>{msg.isMine ? `You → ${msg.partnerName}` : msg.partnerName}</strong><small>{msg.content}</small></div><span className="post-card-link">Open →</span></Link>)}
      </div>}
    </main>
  );
}

export default Dashboard;
