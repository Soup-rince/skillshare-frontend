import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FaFileAlt, FaEnvelope, FaBolt, FaPlusCircle, FaBell, FaStar } from "react-icons/fa";
import { getDashboard, getUserReviews } from "../api";
import {
  registerServiceWorker,
  requestPushPermission,
  getPushPermissionStatus
} from "../utils/pushNotifications";

function Dashboard() {
  const [data, setData] = useState(null);
  const [reviewsData, setReviewsData] = useState({ total: 0, average: 0 });
  const [error, setError] = useState("");
  const [pushStatus, setPushStatus] = useState("default");
  const [pushLoading, setPushLoading] = useState(false);
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");
  const userName = localStorage.getItem("userName") || "there";

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await getDashboard(token);
        setData(res.data);
      } catch {
        setError("We could not load your dashboard.");
      }
    };
    fetchDashboard();
  }, [token]);

  useEffect(() => {
    if (!userId || !token) return;
    const fetchReviews = async () => {
      try {
        const res = await getUserReviews(userId, token);
        setReviewsData({
          total: res.data.total || 0,
          average: res.data.average || 0
        });
      } catch {
      }
    };
    fetchReviews();
  }, [userId, token]);

  useEffect(() => {
    const init = async () => {
      await registerServiceWorker();
      const status = await getPushPermissionStatus();
      setPushStatus(status);
    };
    init();
  }, []);

  const handleEnablePush = async () => {
    try {
      setPushLoading(true);
      await requestPushPermission(token);
      setPushStatus("granted");
    } catch (err) {
      alert(err.message);
    } finally {
      setPushLoading(false);
    }
  };

  if (error) return <main className="page-container"><p className="alert">{error}</p></main>;
  if (!data) return <main className="page-container"><div className="empty-state"><p>Loading your dashboard...</p></div></main>;

  return (
    <main className="page-container">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Your space</p>
          <h1>Welcome back, {userName}!</h1>
          <p>Here is what is happening with your skill exchanges.</p>
        </div>
        <Link className="button" to="/create-post">
          <FaPlusCircle aria-hidden="true" />
          <span>New post</span>
        </Link>
      </header>

      {pushStatus !== "granted" && pushStatus !== "unsupported" && (
        <section className="push-prompt">
          <div className="push-prompt-icon"><FaBell /></div>
          <div className="push-prompt-text">
            <strong>Enable notifications</strong>
            <p>Get notified about new messages and important updates.</p>
          </div>
          <button
            className="button"
            onClick={handleEnablePush}
            disabled={pushLoading}
          >
            {pushLoading ? "Enabling..." : "Enable"}
          </button>
        </section>
      )}

      <section className="dashboard-stats">
        <div className="stat-card">
          <span className="stat-icon" aria-hidden="true"><FaFileAlt /></span>
          <span className="stat-label">Your posts</span>
          <strong className="stat-value">{data.totalPosts}</strong>
        </div>
        <div className="stat-card">
          <span className="stat-icon" aria-hidden="true"><FaEnvelope /></span>
          <span className="stat-label">Unread messages</span>
          <strong className={`stat-value ${data.unreadMessages > 0 ? "stat-value-alert" : ""}`}>
            {data.unreadMessages}
          </strong>
        </div>
        <div className="stat-card">
          <span className="stat-icon" aria-hidden="true"><FaBolt /></span>
          <span className="stat-label">Recent activity</span>
          <strong className="stat-value">{data.recentMessages.length}</strong>
        </div>
        <div className="stat-card">
          <span className="stat-icon" aria-hidden="true"><FaStar /></span>
          <span className="stat-label">Average rating</span>
          <strong className="stat-value">
            {reviewsData.total > 0 ? reviewsData.average : "—"}
          </strong>
          {reviewsData.total > 0 && (
            <small className="stat-hint">
              {reviewsData.total} review{reviewsData.total > 1 ? "s" : ""}
            </small>
          )}
        </div>
      </section>

      <h2 className="section-title">Your skill posts</h2>
      {data.myPosts.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-icon" aria-hidden="true"><FaFileAlt /></span>
          <h2>You have not shared a skill yet</h2>
          <p>Create your first post to start connecting with the community.</p>
        </div>
      ) : (
        <div className="list-card">
          {data.myPosts.map((post) => (
            <div className="list-item" key={post._id}>
              <div>
                <strong>{post.title}</strong>
                <small>{post.postType} · {post.category} · {post.proficiencyLevel}</small>
              </div>
              <div className="list-actions">
                <Link to={`/posts/${post._id}`}>View</Link>
                <Link to={`/posts/${post._id}/edit`}>Edit</Link>
              </div>
            </div>
          ))}
        </div>
      )}

      <h2 className="section-title">Recent messages</h2>
      {data.recentMessages.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-icon" aria-hidden="true"><FaEnvelope /></span>
          <h2>No messages yet</h2>
          <p>Browse skill posts to start a conversation.</p>
        </div>
      ) : (
        <div className="list-card">
          {data.recentMessages.map((msg) => (
            <Link className="list-item" key={msg._id} to={`/messages?to=${msg.partnerId}`}>
              <div>
                <strong>{msg.isMine ? `You → ${msg.partnerName}` : msg.partnerName}</strong>
                <small>{msg.content}</small>
              </div>
              <span className="post-card-link">Open →</span>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}

export default Dashboard;