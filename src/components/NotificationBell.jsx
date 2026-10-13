import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaBell,
  FaEnvelope,
  FaStar,
  FaBan,
  FaTrash,
  FaFlag,
  FaCheck,
  FaShieldAlt,
  FaUser,
  FaTimes
} from "react-icons/fa";
import {
  getMyNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification
} from "../api";
import NotificationDetailModal from "./NotificationDetailModal";

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

function NotificationBell() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await getMyNotifications(token);
      setNotifications(res.data);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const fetchUnread = async () => {
    try {
      const res = await getUnreadNotificationCount(token);
      setUnreadCount(res.data.count || 0);
    } catch {
    }
  };

  useEffect(() => {
    if (!token) return;
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [token]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) fetchNotifications();
  }, [isOpen]);

  const handleBellClick = () => {
    setIsOpen((prev) => !prev);
  };

  const handleNotificationClick = async (notification) => {
    try {
      if (!notification.read) {
        await markNotificationAsRead(notification._id, token);
        setNotifications((current) =>
          current.map((n) => n._id === notification._id ? { ...n, read: true } : n)
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      }

      if (notification.type === 'new_message') {
        setIsOpen(false);
        if (notification.link) navigate(notification.link);
      } else {
        setIsOpen(false);
        setSelectedNotification({ ...notification, read: true });
      }
    } catch {
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead(token);
      setNotifications((current) => current.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    try {
      await deleteNotification(id, token);
      const removed = notifications.find((n) => n._id === id);
      setNotifications((current) => current.filter((n) => n._id !== id));
      if (removed && !removed.read) {
        setUnreadCount((c) => Math.max(0, c - 1));
      }
    } catch {
    }
  };

  return (
    <>
      <div className="notification-wrapper" ref={dropdownRef}>
        <button
          type="button"
          className="notification-bell"
          onClick={handleBellClick}
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
        >
          <FaBell />
          {unreadCount > 0 && (
            <span className="notification-badge">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>

        {isOpen && (
          <div className="notification-dropdown">
            <header className="notification-header">
              <h3>Notifications</h3>
              {unreadCount > 0 && (
                <button
                  type="button"
                  className="notification-mark-all"
                  onClick={handleMarkAllRead}
                >
                  Mark all as read
                </button>
              )}
            </header>

            <div className="notification-list">
              {loading ? (
                <div className="notification-empty">Loading...</div>
              ) : notifications.length === 0 ? (
                <div className="notification-empty">
                  <FaBell />
                  <p>No notifications yet</p>
                </div>
              ) : (
                notifications.map((notif) => {
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
                })
              )}
            </div>
          </div>
        )}
      </div>

      <NotificationDetailModal
        notification={selectedNotification}
        onClose={() => setSelectedNotification(null)}
        onNavigate={(link) => navigate(link)}
      />
    </>
  );
}

export default NotificationBell;