import { useState, useEffect } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { FaCompass, FaChartLine, FaEnvelope, FaUser, FaSignOutAlt } from "react-icons/fa";
import { getDashboard } from "../api";

function NavBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem("token");
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    const fetchUnread = async () => {
      try {
        const res = await getDashboard(token);
        if (!cancelled) setUnreadCount(res.data.unreadMessages || 0);
      } catch {
      }
    };
    fetchUnread();

    return () => {
      cancelled = true;
    };
  }, [token, location.pathname]);

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
          {unreadCount > 0 && (
            <span className="nav-badge" aria-label={`${unreadCount} unread messages`}>
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </NavLink>
        <NavLink className="nav-link" to={`/profile/${localStorage.getItem("userId")}`}>
          <FaUser className="nav-icon" aria-hidden="true" />
          <span>Profile</span>
        </NavLink>
      </div>
      <div className="nav-actions">
        <button className="button-ghost button-small" onClick={handleLogout}>
          <FaSignOutAlt className="nav-icon" aria-hidden="true" />
          <span>Log out</span>
        </button>
      </div>
    </nav>
  );
}

export default NavBar;