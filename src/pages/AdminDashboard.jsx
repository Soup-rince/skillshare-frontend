import { useEffect, useState } from "react";
import { FaUsers, FaHistory, FaClipboardList, FaShieldAlt, FaUserSlash, FaUserTie, FaBan } from "react-icons/fa";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { checkAdmin, getEscalatedReports, getAdminStats } from "../api";
import UserManagementTab from "../components/UserManagementTab";
import MyActivityTab from "../components/MyActivityTab";
import AdminAuditLogTab from "../components/AdminAuditLogTab";
import EscalatedReportsTab from "../components/EscalatedReportsTab";

function AdminDashboard() {
  const [accessGranted, setAccessGranted] = useState(null);
  const [activeTab, setActiveTab] = useState("users");
  const [error, setError] = useState("");
  const [escalatedCount, setEscalatedCount] = useState(0);
  const [stats, setStats] = useState(null);

  const token = localStorage.getItem("token");

  const loadStats = async () => {
    try {
      const res = await getAdminStats(token);
      setStats(res.data);
    } catch {
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        await checkAdmin(token);
        setAccessGranted(true);
        try {
          const escRes = await getEscalatedReports(token);
          setEscalatedCount(escRes.data.length || 0);
        } catch {
        }
        await loadStats();
      } catch (err) {
        setAccessGranted(false);
        setError(
          err.response?.data?.message ||
            "You do not have permission to access this page."
        );
      }
    };
    init();
  }, [token]);

  if (accessGranted === null) {
    return (
      <main className="page-container">
        <div className="empty-state">
          <p>Checking administrator access...</p>
        </div>
      </main>
    );
  }

  if (!accessGranted) {
    return (
      <main className="page-container">
        <div className="admin-denied">
          <p className="eyebrow">Restricted area</p>
          <h1>Admin access required</h1>
          <p>{error}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="page-container">
      <header className="admin-heading">
        <div>
          <p className="eyebrow admin-eyebrow">User management console</p>
          <h1>Admin Dashboard</h1>
          <p>Manage community members, moderators, and monitor activity.</p>
        </div>

        <span className="admin-badge">
          ● Admin access verified
        </span>
      </header>

      {error && <p className="alert" style={{ marginBottom: 16 }}>{error}</p>}

      {stats && (
        <section className="dashboard-stats dashboard-stats-extended">
          <div className="stat-card">
            <span className="stat-icon" aria-hidden="true"><FaUsers /></span>
            <span className="stat-label">Members</span>
            <strong className="stat-value">{stats.totalUsers}</strong>
          </div>
          <div className="stat-card">
            <span className="stat-icon" aria-hidden="true"><FaUserTie /></span>
            <span className="stat-label">Moderators</span>
            <strong className="stat-value">{stats.totalModerators}</strong>
          </div>
          <div className="stat-card">
            <span className="stat-icon" aria-hidden="true"><FaBan /></span>
            <span className="stat-label">Suspended</span>
            <strong className={`stat-value ${stats.suspendedUsers > 0 ? "stat-value-alert" : ""}`}>
              {stats.suspendedUsers}
            </strong>
          </div>
          <div className="stat-card">
            <span className="stat-icon" aria-hidden="true"><FaShieldAlt /></span>
            <span className="stat-label">Escalated</span>
            <strong className={`stat-value ${stats.pendingEscalated > 0 ? "stat-value-alert" : ""}`}>
              {stats.pendingEscalated}
            </strong>
          </div>
        </section>
      )}

      {stats && stats.roleChart && stats.roleChart.length > 0 && (
        <section className="dashboard-chart-card" style={{ marginBottom: 24 }}>
          <h3 className="dashboard-chart-title">
            <FaUsers aria-hidden="true" /> Users by role
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stats.roleChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="adminBarGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4f5fc4" stopOpacity={1} />
                  <stop offset="100%" stopColor="#2639ba" stopOpacity={0.75} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f2f8" vertical={false} />
              <XAxis dataKey="role" tick={{ fontSize: 11, fill: "#66708a" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#66708a" }} allowDecimals={false} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #e5e7eb", fontSize: 12 }} />
              <Bar dataKey="count" fill="url(#adminBarGradient)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </section>
      )}

      <div className="admin-tabs">
        <button
          type="button"
          className={`admin-tab ${activeTab === "users" ? "active" : ""}`}
          onClick={() => setActiveTab("users")}
        >
          <FaUsers aria-hidden="true" />
          <span>User Management</span>
        </button>
        <button
          type="button"
          className={`admin-tab ${activeTab === "escalated" ? "active" : ""}`}
          onClick={() => setActiveTab("escalated")}
        >
          <FaShieldAlt aria-hidden="true" />
          <span>Moderation</span>
          {escalatedCount > 0 && (
            <span className="admin-tab-badge">{escalatedCount}</span>
          )}
        </button>
        <button
          type="button"
          className={`admin-tab ${activeTab === "audit" ? "active" : ""}`}
          onClick={() => setActiveTab("audit")}
        >
          <FaClipboardList aria-hidden="true" />
          <span>Activity Log</span>
        </button>
        <button
          type="button"
          className={`admin-tab ${activeTab === "activity" ? "active" : ""}`}
          onClick={() => setActiveTab("activity")}
        >
          <FaHistory aria-hidden="true" />
          <span>My Activity</span>
        </button>
      </div>

      {activeTab === "users" && <UserManagementTab />}

      {activeTab === "escalated" && <EscalatedReportsTab />}

      {activeTab === "audit" && <AdminAuditLogTab />}

      {activeTab === "activity" && <MyActivityTab />}
    </main>
  );
}

export default AdminDashboard;