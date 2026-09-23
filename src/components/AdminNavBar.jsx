import { Link, NavLink, useNavigate } from "react-router-dom";

function AdminNavBar() {
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("role");
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
        <NavLink className="admin-nav-link" to="/browse">Browse</NavLink>
        <NavLink className="admin-nav-link" to="/dashboard">Dashboard</NavLink>
        <NavLink className="admin-nav-link" to="/messages">Messages</NavLink>
        <NavLink className="admin-nav-link" to={`/profile/${userId}`}>Profile</NavLink>
        <NavLink className="admin-nav-link admin-panel-link" to="/admin">Admin panel</NavLink>
      </div>

      <div className="admin-nav-actions">
        <Link className="admin-new-post" to="/create-post">+ New post</Link>
        <button className="admin-logout" type="button" onClick={handleLogout}>Log out</button>
      </div>
    </nav>
  );
}

export default AdminNavBar;
