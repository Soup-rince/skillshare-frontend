import { Link, NavLink, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import {
  FaCompass,
  FaChartLine,
  FaEnvelope,
  FaUser,
  FaSignOutAlt,
  FaCrown,
  FaShieldAlt,
  FaUserCog,
  FaChevronDown
} from "react-icons/fa";
import NotificationBell from "./NotificationBell";

function SuperAdminNavBar() {
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");
  const userName = localStorage.getItem("userName") || "Super Admin";
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

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

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("role");
    localStorage.removeItem("userName");
    navigate("/login");
  };

  return (
    <nav className="superadmin-nav">
      <Link className="superadmin-brand" to="/superadmin">
        <span className="superadmin-brand-mark">S</span>
        SkillShare <span>Super Admin</span>
      </Link>

      <div className="superadmin-nav-status">
        <span className="superadmin-nav-dot" /> Full system access
      </div>

      <div className="superadmin-nav-links">
        <NavLink className="superadmin-nav-link" to="/browse">
          <FaCompass className="superadmin-nav-icon" aria-hidden="true" />
          <span>Browse</span>
        </NavLink>
        <NavLink className="superadmin-nav-link" to="/dashboard">
          <FaChartLine className="superadmin-nav-icon" aria-hidden="true" />
          <span>Dashboard</span>
        </NavLink>
        <NavLink className="superadmin-nav-link" to="/messages">
          <FaEnvelope className="superadmin-nav-icon" aria-hidden="true" />
          <span>Messages</span>
        </NavLink>
        <NavLink className="superadmin-nav-link superadmin-panel-link" to="/superadmin">
          <FaCrown className="superadmin-nav-icon" aria-hidden="true" />
          <span>Super Admin</span>
        </NavLink>
      </div>

      <div className="superadmin-nav-actions">
        <NotificationBell />
        <div className="superadmin-user-menu-wrapper" ref={menuRef}>
          <button
            type="button"
            className="superadmin-user-menu-button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label="User menu"
          >
            <span className="superadmin-user-menu-icon">
              {userName.charAt(0).toUpperCase()}
            </span>
            <span className="superadmin-user-menu-name">{userName}</span>
            <FaChevronDown className="superadmin-user-menu-chevron" aria-hidden="true" />
          </button>

          {menuOpen && (
            <div className="superadmin-user-menu-dropdown" role="menu">
              <NavLink
                className="superadmin-user-menu-item"
                to={`/profile/${userId}`}
                onClick={() => setMenuOpen(false)}
                role="menuitem"
              >
                <FaUser className="superadmin-user-menu-item-icon" aria-hidden="true" />
                <span>View profile</span>
              </NavLink>

              <NavLink
                className="superadmin-user-menu-item"
                to="/profile/edit"
                onClick={() => setMenuOpen(false)}
                role="menuitem"
              >
                <FaUserCog className="superadmin-user-menu-item-icon" aria-hidden="true" />
                <span>Edit profile</span>
              </NavLink>

              <div className="superadmin-user-menu-divider" />

              <NavLink
                className="superadmin-user-menu-item superadmin-user-menu-item-warning"
                to="/admin/emergency"
                onClick={() => setMenuOpen(false)}
                role="menuitem"
              >
                <FaShieldAlt className="superadmin-user-menu-item-icon" aria-hidden="true" />
                <span>Emergency Admin Access</span>
              </NavLink>

              <div className="superadmin-user-menu-divider" />

              <button
                type="button"
                className="superadmin-user-menu-item superadmin-user-menu-item-logout"
                onClick={handleLogout}
                role="menuitem"
              >
                <FaSignOutAlt className="superadmin-user-menu-item-icon" aria-hidden="true" />
                <span>Log out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default SuperAdminNavBar;