import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaUsers,
  FaUserShield,
  FaCrown,
  FaFileAlt,
  FaFlag,
  FaBan,
  FaSearch,
  FaHistory,
  FaBullhorn,
  FaUserTie
} from "react-icons/fa";
import {
  checkAdmin,
  getSuperAdminStats,
  getAllSuperAdmins,
  demoteFromSuperAdmin
} from "../api";
import AdminManagementTab from "../components/AdminManagementTab";
import ModeratorManagementTab from "../components/ModeratorManagementTab";
import UserManagementTab from "../components/UserManagementTab";
import AuditLogTab from "../components/AuditLogTab";
import AnnouncementsTab from "../components/AnnouncementsTab";
import ConfirmDialog from "../components/ConfirmDialog";

function getInitials(name) {
  if (!name) return "?";
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function getAvatarColor(name) {
  const palette = ["#6d28d9", "#7c3aed", "#a855f7", "#9333ea", "#5b21b6", "#4c1d95"];
  if (!name) return palette[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return palette[Math.abs(hash) % palette.length];
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function SuperAdminDashboard() {
  const [accessGranted, setAccessGranted] = useState(null);
  const [stats, setStats] = useState(null);
  const [superAdmins, setSuperAdmins] = useState([]);
  const [activeTab, setActiveTab] = useState("users");
  const [error, setError] = useState("");
  const [actionId, setActionId] = useState("");
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [search, setSearch] = useState("");

  const token = localStorage.getItem("token");
  const myId = localStorage.getItem("userId");

  const loadData = async () => {
    await checkAdmin(token);
    const [statsRes, superRes] = await Promise.all([
      getSuperAdminStats(token),
      getAllSuperAdmins(token)
    ]);
    setStats(statsRes.data);
    setSuperAdmins(superRes.data);
  };

  useEffect(() => {
    const init = async () => {
      try {
        await loadData();
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

  const handleDemote = (user) => {
    setConfirmDialog({
      title: "Demote from Super Admin",
      message: `Demote ${user.name} from Super Admin to Admin? They will lose full system access.`,
      confirmLabel: "Demote",
      tone: "danger",
      inputLabel: "Reason for demotion",
      inputPlaceholder: "e.g. Stepping down, role restructuring",
      inputRequired: true,
      inputMinLength: 5,
      onConfirm: async (reason) => {
        setActionId(user._id);
        try {
          await demoteFromSuperAdmin(user._id, { reason }, token);
          const superRes = await getAllSuperAdmins(token);
          setSuperAdmins(superRes.data);
        } catch (err) {
          setError(err.response?.data?.message || "Could not demote user.");
        } finally {
          setActionId("");
          setConfirmDialog(null);
        }
      }
    });
  };

  const filteredSuperAdmins = superAdmins.filter((u) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      (u.name || "").toLowerCase().includes(q) ||
      (u.email || "").toLowerCase().includes(q)
    );
  });

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

  return (
    <main className="page-container">
      <header className="superadmin-heading">
        <div>
          <p className="eyebrow superadmin-eyebrow">System control</p>
          <h1>Super Admin Dashboard</h1>
          <p>Full system privileges — manage users, moderators, admins, super admins, audit logs, and announcements.</p>
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

      <div className="superadmin-tabs">
        <button
          type="button"
          className={`superadmin-tab ${activeTab === "users" ? "active" : ""}`}
          onClick={() => setActiveTab("users")}
        >
          Users
        </button>
        <button
          type="button"
          className={`superadmin-tab ${activeTab === "moderators" ? "active" : ""}`}
          onClick={() => setActiveTab("moderators")}
        >
          <FaUserTie aria-hidden="true" />
          <span>Moderators</span>
        </button>
        <button
          type="button"
          className={`superadmin-tab ${activeTab === "admins" ? "active" : ""}`}
          onClick={() => setActiveTab("admins")}
        >
          Admins
        </button>
        <button
          type="button"
          className={`superadmin-tab ${activeTab === "superadmins" ? "active" : ""}`}
          onClick={() => setActiveTab("superadmins")}
        >
          Super Admins
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

      {activeTab === "users" && <UserManagementTab />}

      {activeTab === "moderators" && <ModeratorManagementTab />}

      {activeTab === "admins" && <AdminManagementTab />}

      {activeTab === "superadmins" && (
        <section className="superadmin-section">
          <div className="admin-search-bar">
            <FaSearch className="admin-search-icon" aria-hidden="true" />
            <input
              type="text"
              placeholder="Search super admins by name or email"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="admin-section-title">
            <h2>Super admins</h2>
            <span>{filteredSuperAdmins.length} super admins</span>
          </div>

          {filteredSuperAdmins.length === 0 ? (
            <div className="empty-state"><p>No super admins found.</p></div>
          ) : (
            <div className="admin-post-list">
              {filteredSuperAdmins.map((user) => {
                const isSelf = user._id === myId;
                const canAct = !isSelf && superAdmins.length > 1;

                return (
                  <article className="admin-user-row" key={user._id}>
                    <div className="admin-user-info">
                      <span
                        className="admin-user-avatar"
                        style={{ background: getAvatarColor(user.name) }}
                        aria-hidden="true"
                      >
                        {getInitials(user.name)}
                      </span>

                      <div className="admin-user-details">
                        <div className="admin-user-name-row">
                          <h3>{user.name}</h3>
                          <span className="role-badge role-super_admin">
                            <FaCrown />
                            <span>super admin</span>
                          </span>
                          {isSelf && <span className="superadmin-you-badge">You</span>}
                          {user.isSuspended && (
                            <span className="suspended-badge">
                              <FaBan /> Suspended
                            </span>
                          )}
                        </div>

                        <p className="admin-user-email">{user.email}</p>
                        <p className="admin-user-meta">
                          Joined {formatDate(user.createdAt)}
                        </p>
                      </div>
                    </div>

                    {canAct && (
                      <div className="admin-user-actions">
                        <Link className="button-secondary" to={`/profile/${user._id}`}>
                          View profile
                        </Link>

                        <button
                          className="button-danger"
                          type="button"
                          onClick={() => handleDemote(user)}
                          disabled={actionId === user._id}
                        >
                          <FaUserShield aria-hidden="true" />
                          <span>Demote to Admin</span>
                        </button>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      {activeTab === "audit" && <AuditLogTab />}

      {activeTab === "announcements" && <AnnouncementsTab />}

      <ConfirmDialog
        isOpen={Boolean(confirmDialog)}
        title={confirmDialog?.title || ""}
        message={confirmDialog?.message || ""}
        confirmLabel={confirmDialog?.confirmLabel || "Confirm"}
        cancelLabel={confirmDialog?.cancelLabel || "Cancel"}
        tone={confirmDialog?.tone || "danger"}
        inputLabel={confirmDialog?.inputLabel}
        inputPlaceholder={confirmDialog?.inputPlaceholder}
        inputRequired={confirmDialog?.inputRequired}
        inputMinLength={confirmDialog?.inputMinLength}
        onConfirm={confirmDialog?.onConfirm || (() => {})}
        onCancel={() => setConfirmDialog(null)}
      />
    </main>
  );
}

export default SuperAdminDashboard;