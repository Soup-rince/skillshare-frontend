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
  FaUser,
  FaHandshake,
  FaChartBar,
  FaEdit,
  FaEnvelopeOpen,
  FaEnvelopeSquare,
  FaRobot,
  FaArrowRight,
  FaComments
} from "react-icons/fa";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from "recharts";
import {
  getDashboard,
  getMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead
} from "../api";
import NotificationDetailModal from "../components/NotificationDetailModal";
import SkeletonDashboard from "../components/SkeletonDashboard";
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
  user: FaUser,
  file: FaFileAlt
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
  post_reported: "#ad2438",
  report: "#ad2438",
  exchange: "#168565",
  post: "#2639ba",
  review: "#f59e0b"
};

const BAR_COLORS = ["#2639ba", "#7c3aed", "#168565", "#f59e0b", "#ad2438", "#0369a1", "#be123c", "#6d28d9"];

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
  const [error, setError] = useState("");
  const [pushStatus, setPushStatus] = useState("default");
  const [pushLoading, setPushLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  const [selectedNotification, setSelectedNotification] = useState(null);

  const token = localStorage.getItem("token");
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
    const init = async () => {
      await registerServiceWorker();
      const status = await getPushPermissionStatus();
      setPushStatus(status);
    };
    init();
  }, []);

  useEffect(() => {
    if (!token) return;
    const fetchNotifications = async () => {
      try {
        setNotificationsLoading(true);
        const res = await getMyNotifications(token);
        const list = Array.isArray(res.data) ? res.data : res.data?.data || [];
        setNotifications(list.slice(0, 3));
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
  if (!data) return <SkeletonDashboard />;

  const { userInfo, profileCompleteness, missingFields, aiRecommendations = [] } = data;

  return (
    <main className="page-container">
      {userInfo && (
        <section className="dashboard-profile-card">
          <div
            className="dashboard-profile-avatar"
            style={{ background: "#2639ba" }}
            aria-hidden="true"
          >
            {userInfo.name ? userInfo.name.charAt(0).toUpperCase() : "?"}
          </div>
          <div className="dashboard-profile-info">
            <h2>{userInfo.name}</h2>
            <p className="dashboard-profile-meta">
              <span className="dashboard-profile-role">
                {userInfo.role.replace("_", " ")}
              </span>
              {" · Member since "}
              {new Date(userInfo.memberSince).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
            </p>
            <p className="dashboard-profile-email">{userInfo.email}</p>

            <div className="dashboard-account-status">
              {userInfo.isVerified ? (
                <span className="dashboard-status-badge dashboard-status-verified">
                  <FaCheck /> Email verified
                </span>
              ) : (
                <span className="dashboard-status-badge dashboard-status-warning">
                  <FaEnvelopeOpen /> Email not verified
                </span>
              )}
              {pushStatus === "granted" ? (
                <span className="dashboard-status-badge dashboard-status-verified">
                  <FaBell /> Push enabled
                </span>
              ) : pushStatus === "unsupported" ? null : (
                <span className="dashboard-status-badge dashboard-status-warning">
                  <FaEnvelopeSquare /> Push disabled
                </span>
              )}
            </div>
          </div>
          <div className="dashboard-profile-right">
            <Link className="button-secondary" to="/profile/edit">
              <FaEdit /> <span>Edit profile</span>
            </Link>
            <div className="dashboard-completeness">
              <span>Profile completeness</span>
              <strong>{profileCompleteness}%</strong>
              <div className="profile-completeness-bar">
                <div style={{ width: `${profileCompleteness}%` }}></div>
              </div>
              {missingFields && missingFields.length > 0 && (
                <small>Missing: {missingFields.join(", ")}</small>
              )}
            </div>
          </div>
        </section>
      )}

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

      <section className="dashboard-stats dashboard-stats-extended">
        <div className="stat-card">
          <span className="stat-icon" aria-hidden="true"><FaFileAlt /></span>
          <span className="stat-label">Total posts</span>
          <strong className="stat-value">{data.totalPosts}</strong>
          <small className="stat-hint">
            {data.totalOffers} offer{data.totalOffers !== 1 ? "s" : ""} · {data.totalRequests} request{data.totalRequests !== 1 ? "s" : ""}
          </small>
        </div>
        <div className="stat-card">
          <span className="stat-icon" aria-hidden="true"><FaEnvelope /></span>
          <span className="stat-label">Unread messages</span>
          <strong className={`stat-value ${data.unreadMessages > 0 ? "stat-value-alert" : ""}`}>
            {data.unreadMessages}
          </strong>
        </div>
        <div className="stat-card">
          <span className="stat-icon" aria-hidden="true"><FaStar /></span>
          <span className="stat-label">Average rating</span>
          <strong className="stat-value">
            {data.totalReviews > 0 ? data.avgRating : "—"}
          </strong>
          {data.totalReviews > 0 && (
            <small className="stat-hint">
              {data.totalReviews} review{data.totalReviews !== 1 ? "s" : ""}
            </small>
          )}
        </div>
        <div className="stat-card">
          <span className="stat-icon" aria-hidden="true"><FaHandshake /></span>
          <span className="stat-label">Exchanges completed</span>
          <strong className="stat-value">{data.totalExchanges || 0}</strong>
        </div>
      </section>

      <section className="dashboard-charts">
        <div className="dashboard-chart-card">
          <h3 className="dashboard-chart-title">
            <FaChartBar aria-hidden="true" /> Posts by category
          </h3>
          {data.postsByCategory && data.postsByCategory.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.postsByCategory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4f5fc4" stopOpacity={1} />
                    <stop offset="100%" stopColor="#2639ba" stopOpacity={0.75} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f2f8" vertical={false} />
                <XAxis dataKey="category" tick={{ fontSize: 11, fill: "#66708a" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#66708a" }} allowDecimals={false} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 10, border: "1px solid #e5e7eb", fontSize: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                  cursor={{ fill: "rgba(38, 57, 186, 0.05)" }}
                />
                <Bar dataKey="count" fill="url(#barGradient)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="dashboard-chart-empty">
              <FaChartBar size={28} style={{ color: "#c7cce0", marginBottom: 10 }} />
              <p>No posts yet.</p>
              <Link to="/create-post" className="button-secondary" style={{ marginTop: 10 }}>
                Create your first post
              </Link>
            </div>
          )}
        </div>

        <div className="dashboard-chart-card">
          <h3 className="dashboard-chart-title">
            <FaBolt aria-hidden="true" /> Activity (last 6 months)
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={data.monthlyActivity || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="linePostsGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#2639ba" />
                  <stop offset="100%" stopColor="#4f5fc4" />
                </linearGradient>
                <linearGradient id="lineMessagesGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#168565" />
                  <stop offset="100%" stopColor="#22a87c" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f2f8" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#66708a" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#66708a" }} allowDecimals={false} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: 10, border: "1px solid #e5e7eb", fontSize: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
              />
              <Line type="monotone" dataKey="posts" name="Posts" stroke="url(#linePostsGradient)" strokeWidth={2.5} dot={{ r: 4, strokeWidth: 2, fill: "#fff" }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="messages" name="Messages" stroke="url(#lineMessagesGradient)" strokeWidth={2.5} dot={{ r: 4, strokeWidth: 2, fill: "#fff" }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
          <div className="chart-legend">
            <span><span className="chart-legend-dot" style={{ background: "#2639ba" }} /> Posts</span>
            <span><span className="chart-legend-dot" style={{ background: "#168565" }} /> Messages</span>
          </div>
        </div>
      </section>

      {aiRecommendations.length > 0 && (
        <section className="dashboard-ai-section">
          <h2 className="section-title">
            <FaRobot aria-hidden="true" />
            <span>AI recommendations</span>
          </h2>
          <div className="dashboard-ai-list">
            {aiRecommendations.map((rec, idx) => (
              <div className="dashboard-ai-card" key={idx}>
                <div className="dashboard-ai-score">
                  {Math.round((rec.matchScore || 0) * 100)}%
                </div>
                <div className="dashboard-ai-info">
                  <strong>{rec.ownerName}</strong>
                  <p>"{rec.postTitle}" — {rec.postCategory}</p>
                  <span className="dashboard-ai-type">
                    {rec.postType === "offer" ? "Offering" : "Requesting"}
                  </span>
                </div>
                <div className="dashboard-ai-actions">
                  <Link className="button-secondary" to={`/profile/${rec.ownerId}`}>
                    View profile
                  </Link>
                  <Link className="button" to={`/messages?to=${rec.ownerId}`}>
                    <FaComments /> Message
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {data.recentActivity && data.recentActivity.length > 0 && (
        <section className="dashboard-activity-feed">
          <h2 className="section-title">
            <FaBolt aria-hidden="true" />
            <span>Recent activity</span>
          </h2>
          <div className="dashboard-activity-list">
            {data.recentActivity.map((activity, idx) => {
              const IconComponent = ICON_MAP[activity.icon] || FaBolt;
              const color = TYPE_COLORS[activity.type] || "#66708a";
              return (
                <div className="dashboard-activity-item" key={idx}>
                  <span
                    className="dashboard-activity-icon"
                    style={{ background: `${color}15`, color }}
                  >
                    <IconComponent />
                  </span>
                  <div className="dashboard-activity-body">
                    <strong>{activity.title}</strong>
                    <small>{formatRelativeTime(activity.date)}</small>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

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
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            {unreadCount > 0 && (
              <button
                type="button"
                className="notification-mark-all"
                onClick={handleMarkAllRead}
              >
                Mark all as read
              </button>
            )}
            <Link to="/notifications" className="view-all-link">
              View all →
            </Link>
          </div>
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

      <div className="dashboard-section-header">
        <h2 className="section-title">
          <FaFileAlt aria-hidden="true" />
          <span>Your skill posts ({data.totalPosts})</span>
        </h2>
        {data.totalPosts > 3 && (
          <Link to="/my-posts" className="view-all-link">
            View all →
          </Link>
        )}
      </div>
      {data.myPosts.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-icon" aria-hidden="true"><FaFileAlt /></span>
          <h2>You have not shared a skill yet</h2>
          <p>Create your first post to start connecting with the community.</p>
          <Link className="button" to="/create-post" style={{ marginTop: 12 }}>
            <FaPlusCircle /> Create your first post
          </Link>
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

      <div className="dashboard-section-header">
        <h2 className="section-title">
          <FaEnvelope aria-hidden="true" />
          <span>Recent messages</span>
        </h2>
        <Link to="/messages" className="view-all-link">
          View all →
        </Link>
      </div>
      {data.recentMessages.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-icon" aria-hidden="true"><FaEnvelope /></span>
          <h2>No messages yet</h2>
          <p>Browse skill posts to start a conversation.</p>
          <Link className="button" to="/browse" style={{ marginTop: 12 }}>
            <FaArrowRight /> Browse skills
          </Link>
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