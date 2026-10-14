import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FaSearch,
  FaUserShield,
  FaCrown,
  FaUserTie,
  FaBan
} from "react-icons/fa";
import {
  getAllAdmins,
  promoteToSuperAdmin,
  changeUserRole
} from "../api";
import ConfirmDialog from "./ConfirmDialog";

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

function AdminManagementTab() {
  const [admins, setAdmins] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionId, setActionId] = useState("");
  const [confirmDialog, setConfirmDialog] = useState(null);
  const token = localStorage.getItem("token");
  const myId = localStorage.getItem("userId");

  const loadAdmins = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await getAllAdmins(token);
      setAdmins(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load admins.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdmins();
  }, []);

  const handlePromoteToSuper = (user) => {
    setConfirmDialog({
      title: "Promote to Super Admin",
      message: `Promote ${user.name} to Super Admin? They will gain full system access including the ability to manage other admins.`,
      confirmLabel: "Promote",
      tone: "info",
      onConfirm: async () => {
        setActionId(user._id);
        try {
          await promoteToSuperAdmin(user._id, token);
          await loadAdmins();
        } catch (err) {
          setError(err.response?.data?.message || "Could not promote user.");
        } finally {
          setActionId("");
          setConfirmDialog(null);
        }
      }
    });
  };

  const handleDemoteToModerator = (user) => {
    setConfirmDialog({
      title: "Demote to Moderator",
      message: `Demote ${user.name} to Moderator? They will lose user management privileges but retain content moderation access.`,
      confirmLabel: "Demote",
      tone: "danger",
      onConfirm: async () => {
        setActionId(user._id);
        try {
          await changeUserRole(user._id, { role: "moderator" }, token);
          await loadAdmins();
        } catch (err) {
          setError(err.response?.data?.message || "Could not demote user.");
        } finally {
          setActionId("");
          setConfirmDialog(null);
        }
      }
    });
  };

  const filteredAdmins = admins.filter((u) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      (u.name || "").toLowerCase().includes(q) ||
      (u.email || "").toLowerCase().includes(q)
    );
  });

  return (
    <section className="superadmin-section">
      {error && <p className="alert" style={{ marginBottom: 16 }}>{error}</p>}

      <div className="admin-search-bar">
        <FaSearch className="admin-search-icon" aria-hidden="true" />
        <input
          type="text"
          placeholder="Search admins by name or email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="admin-section-title">
        <h2>Admin management</h2>
        <span>{filteredAdmins.length} admins</span>
      </div>

      {loading ? (
        <div className="empty-state"><p>Loading admins...</p></div>
      ) : filteredAdmins.length === 0 ? (
        <div className="empty-state"><p>No admins found.</p></div>
      ) : (
        <div className="admin-post-list">
          {filteredAdmins.map((user) => {
            const isSelf = user._id === myId;
            const canAct = !isSelf;

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
                      <span className="role-badge role-admin">
                        <FaUserShield />
                        <span>admin</span>
                      </span>
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
                      className="button-secondary"
                      type="button"
                      onClick={() => handlePromoteToSuper(user)}
                      disabled={actionId === user._id}
                    >
                      <FaCrown aria-hidden="true" />
                      <span>Promote to Super</span>
                    </button>

                    <button
                      className="button-danger"
                      type="button"
                      onClick={() => handleDemoteToModerator(user)}
                      disabled={actionId === user._id}
                    >
                      <FaUserTie aria-hidden="true" />
                      <span>Demote to Moderator</span>
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        isOpen={Boolean(confirmDialog)}
        title={confirmDialog?.title || ""}
        message={confirmDialog?.message || ""}
        confirmLabel={confirmDialog?.confirmLabel || "Confirm"}
        cancelLabel={confirmDialog?.cancelLabel || "Cancel"}
        tone={confirmDialog?.tone || "danger"}
        onConfirm={confirmDialog?.onConfirm || (() => {})}
        onCancel={() => setConfirmDialog(null)}
      />
    </section>
  );
}

export default AdminManagementTab;