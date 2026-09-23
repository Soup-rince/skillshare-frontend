import { Link, NavLink, useNavigate } from "react-router-dom";

function NavBar() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    navigate("/login");
  };

  if (!token) return null; // walang navbar kung hindi naka-login

  return (
    <nav className="site-nav">
      <Link className="brand" to="/browse"><span className="brand-mark">S</span>SkillShare</Link>
      <div className="nav-links">
        <NavLink className="nav-link" to="/browse">Browse</NavLink>
        <NavLink className="nav-link" to="/dashboard">Dashboard</NavLink>
        <NavLink className="nav-link" to="/messages">Messages</NavLink>
        <NavLink className="nav-link" to={`/profile/${localStorage.getItem("userId")}`}>Profile</NavLink>
      </div>
      <div className="nav-actions">
        <button className="button-ghost button-small" onClick={handleLogout}>Log out</button>
        <Link className="button button-small" to="/create-post">+ New post</Link>
      </div>
    </nav>
  );
}

export default NavBar;
