import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaSearch,
  FaBell,
  FaEnvelope,
  FaStar,
  FaBan,
  FaTrash,
  FaFlag,
  FaCheck,
  FaShieldAlt,
  FaUser,
  FaFileAlt,
  FaTimes,
  FaChevronLeft,
  FaChevronRight
} from "react-icons/fa";
import {
  getMyNotificationsPaginated,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification
} from "../api";
import NotificationDetailModal from "../components/NotificationDetailModal";

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
  unsuspended: "#168565",
  report_resolved: "#166534",
  exchange_completed: "#168565",
  promoted: "#168565",
  demoted: "#a16207",
  post_reported: "#ad2438",
  message_reported: "#ad2438",
  message_deleted: "#dc2626",
  warning: "#d97706",
  user_flagged: "#dc2626"
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

function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedNotification, setSelectedNotification] = useState(null);

  const token = localStorage.getItem("token");

  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError("");
      const params = {
        search: search.trim(),
        filter,
        page,
        limit: 20
      };
      const res = await getMyNotificationsPaginated(params, token);
      const data = res.data;
      if (Array.isArray(data)) {
        setNotifications(data);
        setTotal(data.length);
        setTotalPages(1);
      } else {
        setNotifications(data.data || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Could not load notifications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [search, filter, page]);

  useEffect(() => {
    setPage(1);
  }, [search, filter]);

  const handleNotificationClick = async (notif) => {
    try {
      if (!notif.read) {
        await markNotificationAsRead(notif._id, token);
        setNotifications((current) =>
          current.map((n) => (n._id === notif._id ? { ...n, read: true } : n))
        );
      }
      if (notif.type === "new_message") {
        if (notif.link) navigate(notif.link);
      } else {
        setSelectedNotification({ ...notif, read: true });
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

  const handleDelete = async (e, notifId) => {
    e.stopPropagation();
    try {
      await deleteNotification(notifId, token);
      setNotifications((current) => current.filter((n) => n._id !== notifId));
      setTotal((t) => Math.max(0, t - 1));
    } catch {
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <main className="page-container">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Updates</p>
          <h1>Notifications</h1>
          <p>All your alerts, updates, and moderation actions.</p>
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            className="button"
            onClick={handleMarkAllRead}
          >
            <FaCheck aria-hidden="true" />
            <span>Mark all as read</span>
          </button>
        )}
      </header>

      {error && <p className="alert">{error}</p>}

      <section className="my-posts-filters">
        <div className="conversation-search" style={{ flex: 1, minWidth: 200 }}>
          <FaSearch className="conversation-search-icon" aria-hidden="true" />
          <input
            type="text"
            placeholder="Search notifications"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search notifications"
          />
        </div>

        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          aria-label="Filter notifications"
        >
          <option value="all">All notifications</option>
          <option value="unread">Unread only</option>
          <option value="read">Read only</option>
        </select>
      </section>

      <div className="admin-section-title">
        <h2>Your notifications</h2>
        <span>
          {loading ? "Loading..." : `${total} notification${total !== 1 ? "s" : ""}`}
        </span>
      </div>

      {loading ? (
        <div className="empty-state">
          <p>Loading notifications...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-icon" aria-hidden="true"><FaBell /></span>
          <h2>No notifications found</h2>
          <p>
            {search || filter !== "all"
              ? "Try changing your filters."
              : "You will see updates about your posts, messages, and exchanges here."}
          </p>
        </div>
      ) : (
        <>
          <div className="notifications-page-list">
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
                  <button
                    type="button"
                    className="notification-item-delete"
                    onClick={(e) => handleDelete(e, notif._id)}
                    aria-label="Delete notification"
                  >
                    <FaTimes />
                  </button>
                  {!notif.read && <span className="notification-unread-dot" />}
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                type="button"
                className="button"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <FaChevronLeft /> Prev
              </button>
              <span className="pagination-info">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                className="button"
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next <FaChevronRight />
              </button>
            </div>
          )}
        </>
      )}

      <NotificationDetailModal
        notification={selectedNotification}
        onClose={() => setSelectedNotification(null)}
        onNavigate={(link) => navigate(link)}
      />
    </main>
  );
}

export default Notifications;