import { Link, useNavigate } from "react-router-dom";

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
    <nav style={{
      display: "flex",
      gap: 16,
      padding: "12px 20px",
      background: "#333",
      alignItems: "center"
    }}>
      <Link to="/browse" style={{ color: "white" }}>Browse</Link>
      <Link to="/dashboard" style={{ color: "white" }}>Dashboard</Link>
      <Link to="/messages" style={{ color: "white" }}>Messages</Link>
      <Link to={`/profile/${localStorage.getItem("userId")}`} style={{ color: "white" }}>Profile</Link>
      <button onClick={handleLogout} style={{ marginLeft: "auto" }}>Logout</button>
      <Link to="/create-post" style={{ color: "white" }}>+ New Post</Link>
    </nav>
  );
}

export default NavBar;