import { useState, useEffect } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  FaCompass,
  FaChartLine,
  FaEnvelope,
  FaUser,
  FaSignOutAlt,
  FaShieldAlt
} from "react-icons/fa";
import { getDashboard, getPendingReportCount, getUnreadNotificationCount } from "../api";
import { useNotificationBadge } from "../hooks/useNotificationBadge";
import NotificationBell from "./NotificationBell";

function AdminNavBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const userId = localStorage.getItem("userId");
  const token = localStorage.getItem("token");
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [pendingReports, setPendingReports] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    const fetchCounts = async () => {
      try {
        const [dashRes, reportsRes, notifRes] = await Promise.all([
          getDashboard(token),
          getPendingReportCount(token),
          getUnreadNotificationCount(token)
        ]);
        if (!cancelled) {
          setUnreadMessages(dashRes.data.unreadMessages || 0);
          setPendingReports(reportsRes.data.count || 0);
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

  const totalBadge = unreadMessages + pendingReports + unreadNotifications;
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
        <span className="admin-nav-dot" /> Moderator mode
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
        <NavLink className="admin-nav-link" to={`/profile/${userId}`}>
          <FaUser className="admin-nav-icon" aria-hidden="true" />
          <span>Profile</span>
        </NavLink>
        <NavLink className="admin-nav-link admin-panel-link" to="/admin">
          <FaShieldAlt className="admin-nav-icon" aria-hidden="true" />
          <span>Admin panel</span>
          {pendingReports > 0 && (
            <span className="nav-badge">{pendingReports > 99 ? "99+" : pendingReports}</span>
          )}
        </NavLink>
      </div>

      <div className="admin-nav-actions">
        <NotificationBell />
        <button className="admin-logout" type="button" onClick={handleLogout}>
          <FaSignOutAlt className="admin-nav-icon" aria-hidden="true" />
          <span>Log out</span>
        </button>
      </div>
    </nav>
  );
}

export default AdminNavBar;