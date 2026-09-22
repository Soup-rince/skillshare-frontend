import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Browse from "./pages/Browse";
import NavBar from "./components/NavBar";
import PostDetail from "./pages/PostDetail";
import Profile from "./pages/Profile";
import Dashboard from "./pages/Dashboard";
import Messages from "./pages/Messages";
import CreatePost from "./pages/CreatePost";

function App() {
  const token = localStorage.getItem("token");

  return (
    <BrowserRouter>
      <NavBar />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/browse" element={token ? <Browse /> : <Navigate to="/login" />} />
        <Route path="/messages" element={token ? <Messages /> : <Navigate to="/login" />} />
        <Route path="/" element={<Navigate to={token ? "/browse" : "/login"} />} />
        <Route path="/posts/:id" element={token ? <PostDetail /> : <Navigate to="/login" />} />
        <Route path="/profile/:id" element={token ? <Profile /> : <Navigate to="/login" />} />
        <Route path="/dashboard" element={token ? <Dashboard /> : <Navigate to="/login" />} />
        <Route path="/create-post" element={token ? <CreatePost /> : <Navigate to="/login" />} />
        <Route path="/posts/:id/edit" element={token ? <CreatePost /> : <Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
