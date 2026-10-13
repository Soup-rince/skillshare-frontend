import { useState, useEffect } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { FaCompass, FaChartLine, FaEnvelope, FaUser, FaSignOutAlt } from "react-icons/fa";
import { getDashboard, getUnreadNotificationCount } from "../api";
import { useNotificationBadge } from "../hooks/useNotificationBadge";
import NotificationBell from "./NotificationBell";

function NavBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem("token");
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

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

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [token, location.pathname]);

  const totalBadge = unreadMessages + unreadNotifications;
  useNotificationBadge(totalBadge, "SkillShare");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("role");
    localStorage.removeItem("userName");
    navigate("/login");
  };

  if (!token) return null;

  return (
    <nav className="site-nav">
      <Link className="brand" to="/browse"><span className="brand-mark">S</span>SkillShare</Link>
      <div className="nav-links">
        <NavLink className="nav-link" to="/browse">
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
        <NavLink className="nav-link" to={`/profile/${localStorage.getItem("userId")}`}>
          <FaUser className="nav-icon" aria-hidden="true" />
          <span>Profile</span>
        </NavLink>
      </div>
      <div className="nav-actions">
        <NotificationBell />
        <button className="button-ghost button-small" onClick={handleLogout}>
          <FaSignOutAlt className="nav-icon" aria-hidden="true" />
          <span>Log out</span>
        </button>
      </div>
    </nav>
  );
}

export default NavBar;