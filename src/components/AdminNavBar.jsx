import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  FaCompass,
  FaChartLine,
  FaEnvelope,
  FaUser,
  FaSignOutAlt,
  FaShieldAlt
} from "react-icons/fa";

function AdminNavBar() {
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");

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
        </NavLink>
        <NavLink className="admin-nav-link" to={`/profile/${userId}`}>
          <FaUser className="admin-nav-icon" aria-hidden="true" />
          <span>Profile</span>
        </NavLink>
        <NavLink className="admin-nav-link admin-panel-link" to="/admin">
          <FaShieldAlt className="admin-nav-icon" aria-hidden="true" />
          <span>Admin panel</span>
        </NavLink>
      </div>

      <div className="admin-nav-actions">
        <button className="admin-logout" type="button" onClick={handleLogout}>
          <FaSignOutAlt className="admin-nav-icon" aria-hidden="true" />
          <span>Log out</span>
        </button>
      </div>
    </nav>
  );
}

export default AdminNavBar;