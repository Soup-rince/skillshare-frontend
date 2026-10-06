import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FaSearch,
  FaUserSlash,
  FaUserCheck,
  FaUserShield,
  FaUser,
  FaBan
} from "react-icons/fa";
import {
  getAllUsers,
  suspendUser,
  unsuspendUser,
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
  const palette = ["#2639ba", "#087b75", "#7c3aed", "#c2410c", "#be123c", "#0369a1"];
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

function UserManagementTab() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [suspendedFilter, setSuspendedFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionId, setActionId] = useState("");
  const [confirmDialog, setConfirmDialog] = useState(null);
  const token = localStorage.getItem("token");
  const myId = localStorage.getItem("userId");

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError("");
      const params = {};
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;
      if (suspendedFilter) params.suspended = suspendedFilter;
      const res = await getAllUsers(params, token);
      setUsers(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [search, roleFilter, suspendedFilter]);

  const handleSuspend = (user) => {
    setConfirmDialog({
      title: "Suspend user",
      message: `Suspend ${user.name}? They will not be able to log in.`,
      confirmLabel: "Suspend",
      tone: "danger",
      onConfirm: async () => {
        setActionId(user._id);
        try {
          await suspendUser(user._id, { reason: "Violation of community guidelines" }, token);
          await loadUsers();
        } catch (err) {
          setError(err.response?.data?.message || "Could not suspend user.");
        } finally {
          setActionId("");
          setConfirmDialog(null);
        }
      }
    });
  };

  const handleUnsuspend = (user) => {
    setConfirmDialog({
      title: "Unsuspend user",
      message: `Restore access for ${user.name}?`,
      confirmLabel: "Unsuspend",
      tone: "info",
      onConfirm: async () => {
        setActionId(user._id);
        try {
          await unsuspendUser(user._id, token);
          await loadUsers();
        } catch (err) {
          setError(err.response?.data?.message || "Could not unsuspend user.");
        } finally {
          setActionId("");
          setConfirmDialog(null);
        }
      }
    });
  };

  const handleChangeRole = (user, newRole) => {
    const action = newRole === "admin" ? "Promote" : "Demote";
    setConfirmDialog({
      title: `${action} user`,
      message: `${action} ${user.name} to ${newRole.replace("_", " ")}?`,
      confirmLabel: action,
      tone: newRole === "admin" ? "info" : "danger",
      onConfirm: async () => {
        setActionId(user._id);
        try {
          await changeUserRole(user._id, { role: newRole }, token);
          await loadUsers();
        } catch (err) {
          setError(err.response?.data?.message || "Could not change role.");
        } finally {
          setActionId("");
          setConfirmDialog(null);
        }
      }
    });
  };

  return (
    <section className="admin-users">
      {error && <p className="alert" style={{ marginBottom: 16 }}>{error}</p>}

      <div className="admin-users-filters">
        <div className="conversation-search">
          <FaSearch className="conversation-search-icon" aria-hidden="true" />
          <input
            type="text"
            placeholder="Search by name or email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="">All roles</option>
          <option value="member">Members</option>
          <option value="admin">Admins</option>
          <option value="super_admin">Super admins</option>
        </select>

        <select value={suspendedFilter} onChange={(e) => setSuspendedFilter(e.target.value)}>
          <option value="">All status</option>
          <option value="false">Active</option>
          <option value="true">Suspended</option>
        </select>
      </div>

      <div className="admin-section-title">
        <h2>User management</h2>
        <span>{users.length} users</span>
      </div>

      {loading ? (
        <div className="empty-state"><p>Loading users...</p></div>
      ) : users.length === 0 ? (
        <div className="empty-state"><p>No users found.</p></div>
      ) : (
        <div className="admin-post-list">
          {users.map((user) => {
            const isSelf = user._id === myId;
            const isSuperAdminUser = user.role === "super_admin";
            const canAct = !isSelf && !isSuperAdminUser;

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
                      <span className={`role-badge role-${user.role}`}>
                        {user.role === "member" ? <FaUser /> : <FaUserShield />}
                        <span>{user.role.replace("_", " ")}</span>
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
                      {user.isSuspended && user.suspendedReason && (
                        <> · Reason: {user.suspendedReason}</>
                      )}
                    </p>
                  </div>
                </div>

                {canAct && (
                  <div className="admin-user-actions">
                    <Link className="button-secondary" to={`/profile/${user._id}`}>
                      View profile
                    </Link>

                    {user.isSuspended ? (
                      <button
                        className="button-secondary"
                        type="button"
                        onClick={() => handleUnsuspend(user)}
                        disabled={actionId === user._id}
                      >
                        <FaUserCheck aria-hidden="true" />
                        <span>Unsuspend</span>
                      </button>
                    ) : (
                      <button
                        className="button-danger"
                        type="button"
                        onClick={() => handleSuspend(user)}
                        disabled={actionId === user._id}
                      >
                        <FaUserSlash aria-hidden="true" />
                        <span>Suspend</span>
                      </button>
                    )}

                    {user.role === "member" && (
                      <button
                        className="button-secondary"
                        type="button"
                        onClick={() => handleChangeRole(user, "admin")}
                        disabled={actionId === user._id}
                      >
                        <FaUserShield aria-hidden="true" />
                        <span>Promote</span>
                      </button>
                    )}

                    {user.role === "admin" && (
                      <button
                        className="button-secondary"
                        type="button"
                        onClick={() => handleChangeRole(user, "member")}
                        disabled={actionId === user._id}
                      >
                        <FaUser aria-hidden="true" />
                        <span>Demote</span>
                      </button>
                    )}
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

export default UserManagementTab;