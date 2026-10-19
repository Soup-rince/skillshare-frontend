import { useState, useEffect, useRef } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  FaCompass,
  FaChartLine,
  FaEnvelope,
  FaUser,
  FaSignOutAlt,
  FaUserCog,
  FaChevronDown
} from "react-icons/fa";
import { getDashboard, getUnreadNotificationCount } from "../api";
import { useNotificationBadge } from "../hooks/useNotificationBadge";
import NotificationBell from "./NotificationBell";

function NavBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");
  const userName = localStorage.getItem("userName") || "User";
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
  useNotificationBadge(totalBadge, "SkillShare");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("role");
    localStorage.removeItem("userName");
    navigate("/login");
  };

  const handleBrandClick = (e) => {
    if (location.pathname === "/browse") {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
      window.dispatchEvent(new Event("refresh-browse"));
    }
  };

  const handleBrowseClick = (e) => {
    if (location.pathname === "/browse") {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
      window.dispatchEvent(new Event("refresh-browse"));
    }
  };

  if (!token) return null;

  return (
    <nav className="site-nav">
      <Link className="brand" to="/browse" onClick={handleBrandClick}>
        <span className="brand-mark">S</span>SkillShare
      </Link>
      <div className="nav-links">
        <NavLink className="nav-link" to="/browse" onClick={handleBrowseClick}>
          <FaCompass className="nav-icon" aria-hidden="true" />
          <span>Browse</span>
        </NavLink>
        <NavLink className="nav-link" to="/dashboard">
          <FaChartLine className="nav-icon" aria-hidden="true" />
          <span>Dashboard</span>
        </NavLink>
        <NavLink className="nav-link nav-link-with-badge" to="/messages">
          <FaEnvelope className="nav-icon" aria-hidden="true" />
          <span>Messages</span>
          {unreadMessages > 0 && (
            <span className="nav-badge" aria-label={`${unreadMessages} unread messages`}>
              {unreadMessages > 99 ? "99+" : unreadMessages}
            </span>
          )}
        </NavLink>
      </div>
      <div className="nav-actions">
        <NotificationBell />
        <div className="user-menu-wrapper" ref={menuRef}>
          <button
            type="button"
            className="user-menu-button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label="User menu"
          >
            <span className="user-menu-icon">
              {userName.charAt(0).toUpperCase()}
            </span>
            <span className="user-menu-name">{userName}</span>
            <FaChevronDown className="user-menu-chevron" aria-hidden="true" />
          </button>

          {menuOpen && (
            <div className="user-menu-dropdown" role="menu">
              <NavLink
                className="user-menu-item"
                to={`/profile/${userId}`}
                onClick={() => setMenuOpen(false)}
                role="menuitem"
              >
                <FaUser className="user-menu-item-icon" aria-hidden="true" />
                <span>View profile</span>
              </NavLink>

              <NavLink
                className="user-menu-item"
                to="/profile/edit"
                onClick={() => setMenuOpen(false)}
                role="menuitem"
              >
                <FaUserCog className="user-menu-item-icon" aria-hidden="true" />
                <span>Edit profile</span>
              </NavLink>

              <div className="user-menu-divider" />

              <button
                type="button"
                className="user-menu-item user-menu-item-logout"
                onClick={handleLogout}
                role="menuitem"
              >
                <FaSignOutAlt className="user-menu-item-icon" aria-hidden="true" />
                <span>Log out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default NavBar;