import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FaSearch,
  FaUserSlash,
  FaUserCheck,
  FaUserShield,
  FaUser,
  FaBan,
  FaUserTie,
  FaTrash
} from "react-icons/fa";
import {
  getAllUsers,
  suspendUser,
  unsuspendUser,
  changeUserRole,
  bulkSuspendUsers
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

function getRoleIcon(role) {
  if (role === "moderator") return <FaUserTie />;
  if (role === "admin") return <FaUserShield />;
  return <FaUser />;
}

function UserManagementTab() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [suspendedFilter, setSuspendedFilter] = useState("");
  const [verifiedFilter, setVerifiedFilter] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionId, setActionId] = useState("");
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
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

  // Reset selections on filter change
  useEffect(() => {
    setSelectedUserIds([]);
  }, [search, roleFilter, suspendedFilter, verifiedFilter, sortBy]);

  const handleSuspend = (user) => {
    setConfirmDialog({
      title: "Suspend user",
      message: `Suspend ${user.name}? They will not be able to log in.`,
      confirmLabel: "Suspend",
      tone: "danger",
      inputLabel: "Reason for suspension",
      inputPlaceholder: "e.g. Violation of community guidelines",
      inputRequired: true,
      inputMinLength: 5,
      onConfirm: async (reason) => {
        setActionId(user._id);
        try {
          await suspendUser(user._id, { reason }, token);
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
      message: `Restore access for ${user.name}? They will be notified with the reason below.`,
      confirmLabel: "Unsuspend",
      tone: "info",
      inputLabel: "Reason for unsuspension (optional)",
      inputPlaceholder: "e.g. Appeal accepted, warning issued",
      inputRequired: false,
      inputMinLength: 0,
      onConfirm: async (reason) => {
        setActionId(user._id);
        try {
          await unsuspendUser(user._id, { reason }, token);
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

  const handleChangeRole = (user, newRole, actionLabel) => {
    const isPromote = actionLabel === "Promote";
    setConfirmDialog({
      title: `${actionLabel} user`,
      message: isPromote
        ? `${actionLabel} ${user.name} to ${newRole.replace("_", " ")}?`
        : `${actionLabel} ${user.name} to ${newRole.replace("_", " ")}?`,
      confirmLabel: actionLabel,
      tone: isPromote ? "info" : "danger",
      inputLabel: `Reason for ${actionLabel.toLowerCase()}`,
      inputPlaceholder: isPromote
        ? `e.g. Consistently helpful and active in community`
        : `e.g. Inactive for 60+ days`,
      inputRequired: true,
      inputMinLength: 5,
      onConfirm: async (reason) => {
        setActionId(user._id);
        try {
          await changeUserRole(user._id, { role: newRole, reason }, token);
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

  const handleBulkSuspend = async () => {
    if (selectedUserIds.length === 0) return;
    setConfirmDialog({
      title: `Suspend ${selectedUserIds.length} users?`,
      message: `You are about to suspend ${selectedUserIds.length} users. They will not be able to log in.`,
      confirmLabel: "Suspend all",
      tone: "danger",
      inputLabel: "Reason for suspension (applies to all)",
      inputPlaceholder: "e.g. Violation of community guidelines",
      inputRequired: true,
      inputMinLength: 5,
      onConfirm: async (reason) => {
        try {
          await bulkSuspendUsers({ userIds: selectedUserIds, reason }, token);
          setSelectedUserIds([]);
          await loadUsers();
        } catch (err) {
          setError(err.response?.data?.message || "Could not suspend users.");
        } finally {
          setConfirmDialog(null);
        }
      }
    });
  };

  const toggleUserSelection = (id) => {
    setSelectedUserIds((current) =>
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id]
    );
  };

  // Filter + sort + search (client-side for verified + sort)
  const filteredUsers = (() => {
    let list = users;

    if (verifiedFilter === "true") {
      list = list.filter((u) => u.isVerified);
    } else if (verifiedFilter === "false") {
      list = list.filter((u) => !u.isVerified);
    }

    if (sortBy === "newest") {
      list = [...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortBy === "oldest") {
      list = [...list].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else if (sortBy === "name") {
      list = [...list].sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    }

    return list;
  })();

  const selectableUsers = filteredUsers.filter(
    (u) => u._id !== myId && u.role !== "super_admin" && u.role !== "admin" && !u.isSuspended
  );

  const toggleAllSelectable = () => {
    if (selectedUserIds.length === selectableUsers.length && selectableUsers.length > 0) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(selectableUsers.map((u) => u._id));
    }
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
          <option value="moderator">Moderators</option>
          <option value="admin">Admins</option>
          <option value="super_admin">Super admins</option>
        </select>

        <select value={suspendedFilter} onChange={(e) => setSuspendedFilter(e.target.value)}>
          <option value="">All status</option>
          <option value="false">Active</option>
          <option value="true">Suspended</option>
        </select>

        <select value={verifiedFilter} onChange={(e) => setVerifiedFilter(e.target.value)}>
          <option value="">All verification</option>
          <option value="true">Verified</option>
          <option value="false">Unverified</option>
        </select>

        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="name">Name (A–Z)</option>
        </select>
      </div>

      <div className="admin-section-title">
        <h2>User management</h2>
        <span>{filteredUsers.length} users</span>
      </div>

      {selectableUsers.length > 0 && (
        <div className="bulk-actions-bar">
          <label className="bulk-checkbox-label">
            <input
              type="checkbox"
              checked={selectedUserIds.length === selectableUsers.length && selectableUsers.length > 0}
              onChange={toggleAllSelectable}
            />
            <span>Select all suspendable</span>
          </label>
          {selectedUserIds.length > 0 && (
            <>
              <span className="bulk-selected-count">{selectedUserIds.length} selected</span>
              <button
                className="button-danger"
                type="button"
                onClick={handleBulkSuspend}
              >
                <FaUserSlash /> Suspend selected
              </button>
            </>
          )}
        </div>
      )}

      {loading ? (
        <div className="empty-state"><p>Loading users...</p></div>
      ) : filteredUsers.length === 0 ? (
        <div className="empty-state"><p>No users found.</p></div>
      ) : (
        <div className="admin-post-list">
          {filteredUsers.map((user) => {
            const isSelf = user._id === myId;
            const isSuperAdminUser = user.role === "super_admin";
            const isAdminUser = user.role === "admin";
            const isModeratorUser = user.role === "moderator";
            const isMemberUser = user.role === "member";

            const canAct = !isSelf && !isSuperAdminUser && !isAdminUser;
            const canBeSuspended = canAct && !user.isSuspended;

            return (
              <article className="admin-user-row" key={user._id}>
                {canBeSuspended && (
                  <input
                    type="checkbox"
                    checked={selectedUserIds.includes(user._id)}
                    onChange={() => toggleUserSelection(user._id)}
                    className="bulk-checkbox"
                  />
                )}
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
                        {getRoleIcon(user.role)}
                        <span>{user.role.replace("_", " ")}</span>
                      </span>
                      {user.isVerified && (
                        <span className="role-badge role-verified">
                          ✓ Verified
                        </span>
                      )}
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

                    {isMemberUser && (
                      <button
                        className="button-secondary"
                        type="button"
                        onClick={() => handleChangeRole(user, "moderator", "Promote")}
                        disabled={actionId === user._id}
                      >
                        <FaUserTie aria-hidden="true" />
                        <span>Promote to Moderator</span>
                      </button>
                    )}

                    {isModeratorUser && (
                      <button
                        className="button-secondary"
                        type="button"
                        onClick={() => handleChangeRole(user, "member", "Demote")}
                        disabled={actionId === user._id}
                      >
                        <FaUser aria-hidden="true" />
                        <span>Demote to Member</span>
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
        inputLabel={confirmDialog?.inputLabel}
        inputPlaceholder={confirmDialog?.inputPlaceholder}
        inputRequired={confirmDialog?.inputRequired}
        inputMinLength={confirmDialog?.inputMinLength}
        onConfirm={confirmDialog?.onConfirm || (() => {})}
        onCancel={() => setConfirmDialog(null)}
      />
    </section>
  );
}

export default UserManagementTab;