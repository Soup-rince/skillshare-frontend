import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaFileAlt,
  FaEnvelope,
  FaBolt,
  FaPlusCircle,
  FaBell,
  FaStar,
  FaBan,
  FaTrash,
  FaFlag,
  FaCheck,
  FaShieldAlt,
  FaUser
} from "react-icons/fa";
import {
  getDashboard,
  getUserReviews,
  getMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead
} from "../api";
import NotificationDetailModal from "../components/NotificationDetailModal";
import {
  registerServiceWorker,
  requestPushPermission,
  getPushPermissionStatus
} from "../utils/pushNotifications";

const ICON_MAP = {
  bell: FaBell,
  envelope: FaEnvelope,
  star: FaStar,
  ban: FaBan,
  trash: FaTrash,
  flag: FaFlag,
  check: FaCheck,
  shield: FaShieldAlt,
  user: FaUser
};

const TYPE_COLORS = {
  post_deleted: "#dc2626",
  new_message: "#2639ba",
  new_review: "#f59e0b",
  suspended: "#dc2626",
  report_resolved: "#166534",
  exchange_completed: "#168565",
  promoted: "#168565",
  demoted: "#a16207",
  post_reported: "#ad2438"
};

function formatRelativeTime(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now - d;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [reviewsData, setReviewsData] = useState({ total: 0, average: 0 });
  const [error, setError] = useState("");
  const [pushStatus, setPushStatus] = useState("default");
  const [pushLoading, setPushLoading] = useState(false);

  // Notifications state
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  const [selectedNotification, setSelectedNotification] = useState(null);

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

  // Fetch recent notifications (5 lang)
  useEffect(() => {
    if (!token) return;
    const fetchNotifications = async () => {
      try {
        setNotificationsLoading(true);
        const res = await getMyNotifications(token);
        setNotifications((res.data || []).slice(0, 5));
      } catch {
        setNotifications([]);
      } finally {
        setNotificationsLoading(false);
      }
    };
    fetchNotifications();
  }, [token]);

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

  const handleNotificationClick = async (notification) => {
    try {
      if (!notification.read) {
        await markNotificationAsRead(notification._id, token);
        setNotifications((current) =>
          current.map((n) => (n._id === notification._id ? { ...n, read: true } : n))
        );
      }

      if (notification.type === "new_message") {
        if (notification.link) navigate(notification.link);
      } else {
        setSelectedNotification({ ...notification, read: true });
      }
    } catch {
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead(token);
      setNotifications((current) => current.map((n) => ({ ...n, read: true })));
    } catch {
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

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

      {/* ===== RECENT NOTIFICATIONS ===== */}
      <section className="dashboard-notifications">
        <div className="dashboard-notifications-header">
          <h2 className="section-title" style={{ margin: 0 }}>
            <FaBell aria-hidden="true" />
            <span>Recent notifications</span>
            {unreadCount > 0 && (
              <span className="dashboard-notifications-badge">
                {unreadCount}
              </span>
            )}
          </h2>
          {unreadCount > 0 && (
            <button
              type="button"
              className="notification-mark-all"
              onClick={handleMarkAllRead}
            >
              Mark all as read
            </button>
          )}
        </div>

        {notificationsLoading ? (
          <div className="empty-state">
            <p>Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-icon" aria-hidden="true"><FaBell /></span>
            <h2>No notifications yet</h2>
            <p>You will see updates about your posts, messages, and exchanges here.</p>
          </div>
        ) : (
          <div className="dashboard-notifications-list">
            {notifications.map((notif) => {
              const IconComponent = ICON_MAP[notif.icon] || FaBell;
              const color = TYPE_COLORS[notif.type] || "#66708a";
              return (
                <div
                  role="button"
                  tabIndex={0}
                  key={notif._id}
                  className={`notification-item ${notif.read ? "read" : "unread"}`}
                  onClick={() => handleNotificationClick(notif)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleNotificationClick(notif);
                    }
                  }}
                >
                  <span
                    className="notification-item-icon"
                    style={{ background: `${color}15`, color }}
                  >
                    <IconComponent />
                  </span>
                  <div className="notification-item-body">
                    <strong>{notif.title}</strong>
                    {notif.message && <p>{notif.message}</p>}
                    <span className="notification-item-time">
                      {formatRelativeTime(notif.createdAt)}
                    </span>
                  </div>
                  {!notif.read && <span className="notification-unread-dot" />}
                </div>
              );
            })}
          </div>
        )}
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

      <NotificationDetailModal
        notification={selectedNotification}
        onClose={() => setSelectedNotification(null)}
        onNavigate={(link) => navigate(link)}
      />
    </main>
  );
}

export default Dashboard;