import { useEffect, useState } from "react";
import { FaUsers, FaHistory, FaClipboardList, FaShieldAlt } from "react-icons/fa";
import { checkAdmin, getEscalatedReports } from "../api";
import UserManagementTab from "../components/UserManagementTab";
import MyActivityTab from "../components/MyActivityTab";
import AdminAuditLogTab from "../components/AdminAuditLogTab";
import EscalatedReportsTab from "../components/EscalatedReportsTab";

function AdminDashboard() {
  const [accessGranted, setAccessGranted] = useState(null);
  const [activeTab, setActiveTab] = useState("users");
  const [error, setError] = useState("");
  const [escalatedCount, setEscalatedCount] = useState(0);

  const token = localStorage.getItem("token");

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
          <span>Escalated</span>
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