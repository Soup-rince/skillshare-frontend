import { useEffect, useState } from "react";
import {
  FaUsers,
  FaUserShield,
  FaCrown,
  FaFileAlt,
  FaFlag,
  FaSearch,
  FaHistory,
  FaBullhorn,
  FaUserTie,
  FaHeartbeat,
  FaCog,
  FaUserTag
} from "react-icons/fa";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  Legend
} from "recharts";
import {
  checkAdmin,
  getSuperAdminStats
} from "../api";
import UserManagementTab from "../components/UserManagementTab";
import RolesAndAccessTab from "../components/RolesAndAccessTab";
import AuditLogTab from "../components/AuditLogTab";
import AnnouncementsTab from "../components/AnnouncementsTab";
import SystemHealthTab from "../components/SystemHealthTab";
import OperationsTab from "../components/OperationsTab";

function SuperAdminDashboard() {
  const [accessGranted, setAccessGranted] = useState(null);
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState("health");
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    const init = async () => {
      try {
        await checkAdmin(token);
        const statsRes = await getSuperAdminStats(token);
        setStats(statsRes.data);
        setAccessGranted(true);
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
          <p>Checking super admin access...</p>
        </div>
      </main>
    );
  }

  if (!accessGranted) {
    return (
      <main className="page-container">
        <div className="admin-denied">
          <p className="eyebrow">Restricted area</p>
          <h1>Super admin access required</h1>
          <p>{error}</p>
        </div>
      </main>
    );
  }

  const roleChart = stats?.roleChart || [];
  const growthTrend = stats?.growthTrend || [];

  return (
    <main className="page-container">
      <header className="superadmin-heading">
        <div>
          <p className="eyebrow superadmin-eyebrow">System control</p>
          <h1>Super Admin Dashboard</h1>
          <p>Full system privileges — monitor system health, manage users and roles, review audit logs, and publish announcements.</p>
        </div>

        <span className="superadmin-badge">
          <FaCrown /> Super admin access
        </span>
      </header>

      {error && <p className="alert" style={{ marginBottom: 16 }}>{error}</p>}

      {stats && (
        <section className="superadmin-summary">
          <div>
            <FaUsers className="superadmin-summary-icon" />
            <span>Total users</span>
            <strong>{stats.totalUsers}</strong>
          </div>
          <div>
            <FaUserTie className="superadmin-summary-icon" />
            <span>Moderators</span>
            <strong>{stats.totalModerators || 0}</strong>
          </div>
          <div>
            <FaUserShield className="superadmin-summary-icon" />
            <span>Admins</span>
            <strong>{stats.totalAdmins}</strong>
          </div>
          <div>
            <FaCrown className="superadmin-summary-icon" />
            <span>Super admins</span>
            <strong>{stats.totalSuperAdmins}</strong>
          </div>
          <div>
            <FaFileAlt className="superadmin-summary-icon" />
            <span>Total posts</span>
            <strong>{stats.totalPosts}</strong>
          </div>
          <div>
            <FaFlag className="superadmin-summary-icon" />
            <span>Pending reports</span>
            <strong className={stats.pendingReports > 0 ? "superadmin-summary-alert" : ""}>
              {stats.pendingReports}
            </strong>
          </div>
        </section>
      )}

      {stats && (
        <section
          className="superadmin-charts"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: 16,
            margin: "24px 0"
          }}
        >
          <div className="superadmin-chart-card">
            <h3 style={{ marginBottom: 12 }}>Users by role</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={roleChart}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="role" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#7c3aed" radius={[6, 6, 0, 0]} name="Users" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="superadmin-chart-card">
            <h3 style={{ marginBottom: 12 }}>User growth (last 6 months)</h3>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={growthTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="users"
                  stroke="#7c3aed"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="New users"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      <div className="superadmin-tabs">
        <button
          type="button"
          className={`superadmin-tab ${activeTab === "health" ? "active" : ""}`}
          onClick={() => setActiveTab("health")}
        >
          <FaHeartbeat aria-hidden="true" />
          <span>System Health</span>
        </button>
        <button
          type="button"
          className={`superadmin-tab ${activeTab === "operations" ? "active" : ""}`}
          onClick={() => setActiveTab("operations")}
        >
          <FaCog aria-hidden="true" />
          <span>Operations</span>
        </button>
        <button
          type="button"
          className={`superadmin-tab ${activeTab === "users" ? "active" : ""}`}
          onClick={() => setActiveTab("users")}
        >
          Users
        </button>
        <button
          type="button"
          className={`superadmin-tab ${activeTab === "roles" ? "active" : ""}`}
          onClick={() => setActiveTab("roles")}
        >
          <FaUserTag aria-hidden="true" />
          <span>Roles &amp; Access</span>
        </button>
        <button
          type="button"
          className={`superadmin-tab ${activeTab === "audit" ? "active" : ""}`}
          onClick={() => setActiveTab("audit")}
        >
          <FaHistory aria-hidden="true" />
          <span>Audit Log</span>
        </button>
        <button
          type="button"
          className={`superadmin-tab ${activeTab === "announcements" ? "active" : ""}`}
          onClick={() => setActiveTab("announcements")}
        >
          <FaBullhorn aria-hidden="true" />
          <span>Announcements</span>
        </button>
      </div>

      {activeTab === "health" && <SystemHealthTab />}
      {activeTab === "operations" && <OperationsTab />}
      {activeTab === "users" && <UserManagementTab />}
      {activeTab === "roles" && <RolesAndAccessTab />}
      {activeTab === "audit" && <AuditLogTab />}
      {activeTab === "announcements" && <AnnouncementsTab />}
    </main>
  );
}

export default SuperAdminDashboard;