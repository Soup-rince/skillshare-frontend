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
import AdminEmergencyDashboard from "./pages/AdminEmergencyDashboard";
import AdminNavBar from "./components/AdminNavBar";
import ModeratorDashboard from "./pages/ModeratorDashboard";
import ModeratorNavBar from "./components/ModeratorNavBar";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import SuperAdminNavBar from "./components/SuperAdminNavBar";
import GettingStarted from "./pages/GettingStarted";
import OfflineBanner from "./components/OfflineBanner";
import AnnouncementBanner from "./components/AnnouncementBanner";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VerifyCode from "./pages/VerifyCode";
import { ConfirmProvider } from "./contexts/ConfirmContext";
import MyPosts from "./pages/MyPosts";
import Notifications from "./pages/Notifications";

function AppContent() {
  const token = localStorage.getItem("token");
  const userRole = localStorage.getItem("role");
  const isSuperAdmin = userRole === "super_admin";
  const isAdmin = userRole === "admin";
  const isModerator = userRole === "moderator";
  const isAdminOrMod = isAdmin || isSuperAdmin || isModerator;
  const location = useLocation();
  const isAuthPage =
    ["/login", "/register", "/getting-started", "/forgot-password", "/verify-code"].includes(location.pathname) ||
    location.pathname.startsWith("/reset-password/");

  const renderNavBar = () => {
    if (isSuperAdmin) return <SuperAdminNavBar />;
    if (isAdmin) return <AdminNavBar />;
    if (isModerator) return <ModeratorNavBar />;
    return <NavBar />;
  };

  return (
    <div className="app-shell">
      <OfflineBanner />
      {!isAuthPage && <AnnouncementBanner />}
      {!isAuthPage && token && renderNavBar()}
      <Routes>
        <Route path="/login" element={token ? <Navigate to="/browse" replace /> : <Login />} />
        <Route path="/register" element={token ? <Navigate to="/browse" replace /> : <Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/verify-code" element={<VerifyCode />} />
        <Route path="/getting-started" element={token ? <GettingStarted /> : <Navigate to="/login" />} />
        <Route path="/browse" element={token ? <Browse /> : <Navigate to="/login" />} />
        <Route path="/messages" element={token ? <Messages /> : <Navigate to="/login" />} />
        <Route path="/" element={<Navigate to={token ? "/browse" : "/login"} />} />
        <Route path="/posts/:id" element={token ? <PostDetail /> : <Navigate to="/login" />} />
        <Route path="/profile/edit" element={token ? <EditProfile /> : <Navigate to="/login" />} />
        <Route path="/profile/:id" element={token ? <Profile /> : <Navigate to="/login" />} />
        <Route path="/dashboard" element={token ? <Dashboard /> : <Navigate to="/login" />} />
        <Route path="/my-posts" element={token ? <MyPosts /> : <Navigate to="/login" />} />
        <Route path="/notifications" element={token ? <Notifications /> : <Navigate to="/login" />} />
        <Route
          path="/moderator"
          element={
            token
              ? isModerator
                ? <ModeratorDashboard />
                : <Navigate to="/browse" replace />
              : <Navigate to="/login" />
          }
        />

        <Route
          path="/admin"
          element={
            token
              ? isAdmin
                ? <AdminDashboard />
                : isSuperAdmin
                  ? <Navigate to="/superadmin" replace />
                  : <Navigate to="/browse" replace />
              : <Navigate to="/login" />
          }
        />

        <Route
          path="/admin/emergency"
          element={
            token
              ? isSuperAdmin
                ? <AdminEmergencyDashboard />
                : <Navigate to="/browse" replace />
              : <Navigate to="/login" />
          }
        />

        <Route
          path="/superadmin"
          element={
            token
              ? isSuperAdmin
                ? <SuperAdminDashboard />
                : <Navigate to="/browse" replace />
              : <Navigate to="/login" />
          }
        />

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