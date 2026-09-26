import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Browse from "./pages/Browse";
import NavBar from "./components/NavBar";
import PostDetail from "./pages/PostDetail";
import Profile from "./pages/Profile";
import EditProfile from "./pages/EditProfile";
import Dashboard from "./pages/Dashboard";
import Messages from "./pages/Messages";
import CreatePost from "./pages/CreatePost";
import AdminDashboard from "./pages/AdminDashboard";
import AdminNavBar from "./components/AdminNavBar";
import { ConfirmProvider } from "./contexts/ConfirmContext";

function AppContent() {
  const token = localStorage.getItem("token");
  const isAdmin = localStorage.getItem("role") === "admin";
  const location = useLocation();
  const isAuthPage = ["/login", "/register"].includes(location.pathname);

  return (
    <div className="app-shell">
      {!isAuthPage && (token && isAdmin ? <AdminNavBar /> : <NavBar />)}
      <Routes>
        <Route path="/login" element={token ? <Navigate to="/browse" replace /> : <Login />} />
        <Route path="/register" element={token ? <Navigate to="/browse" replace /> : <Register />} />
        <Route path="/browse" element={token ? <Browse /> : <Navigate to="/login" />} />
        <Route path="/messages" element={token ? <Messages /> : <Navigate to="/login" />} />
        <Route path="/" element={<Navigate to={token ? "/browse" : "/login"} />} />
        <Route path="/posts/:id" element={token ? <PostDetail /> : <Navigate to="/login" />} />
        <Route path="/profile/edit" element={token ? <EditProfile /> : <Navigate to="/login" />} />
        <Route path="/profile/:id" element={token ? <Profile /> : <Navigate to="/login" />} />
        <Route path="/dashboard" element={token ? <Dashboard /> : <Navigate to="/login" />} />
        <Route path="/admin" element={token ? <AdminDashboard /> : <Navigate to="/login" />} />
        <Route path="/create-post" element={token ? <CreatePost /> : <Navigate to="/login" />} />
        <Route path="/posts/:id/edit" element={token ? <CreatePost /> : <Navigate to="/login" />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ConfirmProvider>
        <AppContent />
      </ConfirmProvider>
    </BrowserRouter>
  );
}

export default App;