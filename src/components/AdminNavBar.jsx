import { useState, useEffect, useRef } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  FaCompass,
  FaChartLine,
  FaEnvelope,
  FaUser,
  FaSignOutAlt,
  FaShieldAlt,
  FaUserCog,
  FaChevronDown
} from "react-icons/fa";
import { getDashboard, getUnreadNotificationCount } from "../api";
import { useNotificationBadge } from "../hooks/useNotificationBadge";
import NotificationBell from "./NotificationBell";

function AdminNavBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const userId = localStorage.getItem("userId");
  const userName = localStorage.getItem("userName") || "Admin";
  const token = localStorage.getItem("token");
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    const fetchCounts = async () => {
      try {
        const [dashRes, notifRes] = await Promise.all([
          getDashboard(token),
          getUnreadNotificationCount(token)
        ]);
        if (!cancelled) {
          setUnreadMessages(dashRes.data.unreadMessages || 0);
          setUnreadNotifications(notifRes.data.count || 0);
        }
      } catch {
      }
    };

    fetchCounts();

    const interval = setInterval(fetchCounts, 30000);

    const handleFocus = () => {
      fetchCounts();
    };
    window.addEventListener("focus", handleFocus);

    return () => {
      cancelled = true;
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, [token, location.pathname]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  const totalBadge = unreadMessages + unreadNotifications;
  useNotificationBadge(totalBadge, "SkillShare Admin");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("role");
    localStorage.removeItem("userName");
    navigate("/login");
  };

  return (
    <nav className="admin-nav">
      <Link className="admin-brand" to="/admin">
        <span className="admin-brand-mark">S</span>
        SkillShare <span>Admin</span>
      </Link>

      <div className="admin-nav-status">
        <span className="admin-nav-dot" /> Admin mode
      </div>

      <div className="admin-nav-links">
        <NavLink className="admin-nav-link" to="/browse">
          <FaCompass className="admin-nav-icon" aria-hidden="true" />
          <span>Browse</span>
        </NavLink>
        <NavLink className="admin-nav-link" to="/dashboard">
          <FaChartLine className="admin-nav-icon" aria-hidden="true" />
          <span>Dashboard</span>
        </NavLink>
        <NavLink className="admin-nav-link" to="/messages">
          <FaEnvelope className="admin-nav-icon" aria-hidden="true" />
          <span>Messages</span>
          {unreadMessages > 0 && (
            <span className="nav-badge">{unreadMessages > 99 ? "99+" : unreadMessages}</span>
          )}
        </NavLink>
        <NavLink className="admin-nav-link admin-panel-link" to="/admin">
          <FaShieldAlt className="admin-nav-icon" aria-hidden="true" />
          <span>Admin panel</span>
        </NavLink>
      </div>

      <div className="admin-nav-actions">
        <NotificationBell />
        <div className="admin-user-menu-wrapper" ref={menuRef}>
          <button
            type="button"
            className="admin-user-menu-button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label="User menu"
          >
            <span className="admin-user-menu-icon">
              {userName.charAt(0).toUpperCase()}
            </span>
            <span className="admin-user-menu-name">{userName}</span>
            <FaChevronDown className="admin-user-menu-chevron" aria-hidden="true" />
          </button>

          {menuOpen && (
            <div className="admin-user-menu-dropdown" role="menu">
              <NavLink
                className="admin-user-menu-item"
                to={`/profile/${userId}`}
                onClick={() => setMenuOpen(false)}
                role="menuitem"
              >
                <FaUser className="admin-user-menu-item-icon" aria-hidden="true" />
                <span>View profile</span>
              </NavLink>

              <NavLink
                className="admin-user-menu-item"
                to="/profile/edit"
                onClick={() => setMenuOpen(false)}
                role="menuitem"
              >
                <FaUserCog className="admin-user-menu-item-icon" aria-hidden="true" />
                <span>Edit profile</span>
              </NavLink>

              <div className="admin-user-menu-divider" />

              <button
                type="button"
                className="admin-user-menu-item admin-user-menu-item-logout"
                onClick={handleLogout}
                role="menuitem"
              >
                <FaSignOutAlt className="admin-user-menu-item-icon" aria-hidden="true" />
                <span>Log out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default AdminNavBar;