import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  FaSearch,
  FaUserShield,
  FaCrown,
  FaUserTie,
  FaUser,
  FaBan,
  FaUserSlash,
  FaUserCheck
} from "react-icons/fa";
import {
  getAllUsers,
  getAllSuperAdmins,
  changeUserRole,
  promoteToSuperAdmin,
  demoteFromSuperAdmin,
  suspendAdmin,
  suspendModerator,
  suspendUser,
  unsuspendAdmin,
  unsuspendModerator,
  unsuspendUser,
  bulkSuspendSuperAdminUsers,
  bulkDemoteSuperAdminUsers
} from "../api";
import ConfirmDialog from "./ConfirmDialog";

const ROLE_FILTERS = [
  { value: "", label: "All roles" },
  { value: "member", label: "Members" },
  { value: "moderator", label: "Moderators" },
  { value: "admin", label: "Admins" },
  { value: "super_admin", label: "Super admins" }
];

const ROLE_BADGE = {
  member: { label: "member", Icon: FaUser, className: "role-member" },
  moderator: { label: "moderator", Icon: FaUserTie, className: "role-moderator" },
  admin: { label: "admin", Icon: FaUserShield, className: "role-admin" },
  super_admin: { label: "super admin", Icon: FaCrown, className: "role-super_admin" }
};

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

function RolesAndAccessTab() {
  const [users, setUsers] = useState([]);
  const [superAdmins, setSuperAdmins] = useState([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionId, setActionId] = useState("");
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkBusy, setBulkBusy] = useState(false);
  const token = localStorage.getItem("token");
  const myId = localStorage.getItem("userId");

  const loadAll = async () => {
    try {
      setLoading(true);
      setError("");
      const [usersRes, superRes] = await Promise.all([
        getAllUsers({}, token),
        getAllSuperAdmins(token)
      ]);

      const nonSupers = (usersRes.data || []).filter((u) => u.role !== "super_admin");
      const supers = superRes.data || [];

      const all = [...supers, ...nonSupers];
      setUsers(all);
      setSuperAdmins(supers);

      setSelectedIds((prev) => prev.filter((id) => all.some((u) => u._id === id)));
    } catch (err) {
      setError(err.response?.data?.message || "Could not load users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const filteredUsers = useMemo(() => {
    let list = users;

    if (roleFilter) {
      list = list.filter((u) => u.role === roleFilter);
    }

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (u) =>
          (u.name || "").toLowerCase().includes(q) ||
          (u.email || "").toLowerCase().includes(q)
      );
    }

    const order = { super_admin: 0, admin: 1, moderator: 2, member: 3 };
    return [...list].sort((a, b) => {
      const ao = order[a.role] ?? 99;
      const bo = order[b.role] ?? 99;
      if (ao !== bo) return ao - bo;
      return (a.name || "").localeCompare(b.name || "");
    });
  }, [users, roleFilter, search]);

  const isSelectable = (u) => {
    if (!u) return false;
    if (u._id === myId) return false;
    if (u.role === "super_admin") return false;
    return true;
  };

  const selectableUsers = filteredUsers.filter(isSelectable);
  const allSelected =
    selectableUsers.length > 0 &&
    selectableUsers.every((u) => selectedIds.includes(u._id));
  const someSelected = selectedIds.length > 0 && !allSelected;

  const toggleOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (allSelected) setSelectedIds([]);
    else setSelectedIds(selectableUsers.map((u) => u._id));
  };

  const openDialog = (config) => setConfirmDialog(config);

  const closeDialog = () => setConfirmDialog(null);

  const runSingleAction = async (userId, fn, errorMessage) => {
    setActionId(userId);
    try {
      await fn();
      await loadAll();
    } catch (err) {
      setError(err.response?.data?.message || errorMessage);
    } finally {
      setActionId("");
      closeDialog();
    }
  };

  const handlePromoteToModerator = (user) => {
    openDialog({
      title: "Promote to Moderator",
      message: `Promote ${user.name} to Moderator? They will gain content moderation access.`,
      confirmLabel: "Promote",
      tone: "info",
      inputLabel: "Reason for promotion",
      inputPlaceholder: "e.g. Consistent positive contributions",
      inputRequired: true,
      inputMinLength: 5,
      onConfirm: async (reason) =>
        runSingleAction(
          user._id,
          () => changeUserRole(user._id, { role: "moderator", reason }, token),
          "Could not promote user."
        )
    });
  };

  const handlePromoteToAdmin = (user) => {
    openDialog({
      title: "Promote to Admin",
      message: `Promote ${user.name} to Admin? They will gain access to user management.`,
      confirmLabel: "Promote",
      tone: "info",
      inputLabel: "Reason for promotion",
      inputPlaceholder: "e.g. Excellent moderation work",
      inputRequired: true,
      inputMinLength: 5,
      onConfirm: async (reason) =>
        runSingleAction(
          user._id,
          () => changeUserRole(user._id, { role: "admin", reason }, token),
          "Could not promote user."
        )
    });
  };

  const handlePromoteToSuper = (user) => {
    openDialog({
      title: "Promote to Super Admin",
      message: `Promote ${user.name} to Super Admin? They will gain full system access.`,
      confirmLabel: "Promote",
      tone: "info",
      inputLabel: "Reason for promotion",
      inputPlaceholder: "e.g. Trusted with system access",
      inputRequired: true,
      inputMinLength: 5,
      onConfirm: async (reason) =>
        runSingleAction(
          user._id,
          () => promoteToSuperAdmin(user._id, { reason }, token),
          "Could not promote user."
        )
    });
  };

  const handleDemoteToMember = (user) => {
    openDialog({
      title: "Demote to Member",
      message: `Demote ${user.name} to Member? They will lose all elevated privileges.`,
      confirmLabel: "Demote",
      tone: "danger",
      inputLabel: "Reason for demotion",
      inputPlaceholder: "e.g. Stepping down, policy violation",
      inputRequired: true,
      inputMinLength: 5,
      onConfirm: async (reason) =>
        runSingleAction(
          user._id,
          () => changeUserRole(user._id, { role: "member", reason }, token),
          "Could not demote user."
        )
    });
  };

  const handleDemoteToModerator = (user) => {
    openDialog({
      title: "Demote to Moderator",
      message: `Demote ${user.name} to Moderator? They will lose user management privileges.`,
      confirmLabel: "Demote",
      tone: "danger",
      inputLabel: "Reason for demotion",
      inputPlaceholder: "e.g. Role restructuring",
      inputRequired: true,
      inputMinLength: 5,
      onConfirm: async (reason) =>
        runSingleAction(
          user._id,
          () => changeUserRole(user._id, { role: "moderator", reason }, token),
          "Could not demote user."
        )
    });
  };

  const handleDemoteSuperAdmin = (user) => {
    openDialog({
      title: "Demote from Super Admin",
      message: `Demote ${user.name} to Admin? They will lose full system access.`,
      confirmLabel: "Demote",
      tone: "danger",
      inputLabel: "Reason for demotion",
      inputPlaceholder: "e.g. Stepping down",
      inputRequired: true,
      inputMinLength: 5,
      onConfirm: async (reason) =>
        runSingleAction(
          user._id,
          () => demoteFromSuperAdmin(user._id, { reason }, token),
          "Could not demote user."
        )
    });
  };

  const handleSuspend = (user) => {
    openDialog({
      title: "Suspend user",
      message: `Suspend ${user.name}? They will not be able to log in.`,
      confirmLabel: "Suspend",
      tone: "danger",
      inputLabel: "Reason for suspension",
      inputPlaceholder: "e.g. Violation of community guidelines",
      inputRequired: true,
      inputMinLength: 5,
      onConfirm: async (reason) => {
        let fn;
        if (user.role === "admin") fn = () => suspendAdmin(user._id, { reason }, token);
        else if (user.role === "moderator") fn = () => suspendModerator(user._id, { reason }, token);
        else fn = () => suspendUser(user._id, { reason }, token);

        await runSingleAction(user._id, fn, "Could not suspend user.");
      }
    });
  };

  const handleUnsuspend = (user) => {
    openDialog({
      title: "Unsuspend user",
      message: `Restore access for ${user.name}?`,
      confirmLabel: "Unsuspend",
      tone: "info",
      inputLabel: "Reason for unsuspension (optional)",
      inputPlaceholder: "e.g. Appeal accepted",
      inputRequired: false,
      inputMinLength: 0,
      onConfirm: async (reason) => {
        let fn;
        if (user.role === "admin") fn = () => unsuspendAdmin(user._id, { reason }, token);
        else if (user.role === "moderator") fn = () => unsuspendModerator(user._id, { reason }, token);
        else fn = () => unsuspendUser(user._id, { reason }, token);

        await runSingleAction(user._id, fn, "Could not unsuspend user.");
      }
    });
  };

  const handleBulkDemote = () => {
    if (selectedIds.length === 0) return;

    const selectedUsers = users.filter((u) => selectedIds.includes(u._id));
    const hasAdmins = selectedUsers.some((u) => u.role === "admin");
    const hasModerators = selectedUsers.some((u) => u.role === "moderator");
    const hasMembers = selectedUsers.some((u) => u.role === "member");

    if (hasMembers && !hasAdmins && !hasModerators) {
      setError("Selected users are already members — nothing to demote.");
      return;
    }
    if (hasAdmins && hasModerators) {
      setError("Bulk demote only supports one source role at a time. Filter by admins OR moderators first.");
      return;
    }

    const targetRole = hasAdmins ? "moderator" : "member";
    const label = hasAdmins ? "Moderator" : "Member";

    openDialog({
      title: `Demote ${selectedIds.length} user(s) to ${label}`,
      message: `Demote the ${selectedIds.length} selected user(s) to ${label}?`,
      confirmLabel: "Demote all",
      tone: "danger",
      inputLabel: "Reason for demotion",
      inputPlaceholder: "e.g. Team restructuring",
      inputRequired: true,
      inputMinLength: 5,
      onConfirm: async (reason) => {
        setBulkBusy(true);
        setError("");
        try {
          await bulkDemoteSuperAdminUsers(
            { userIds: selectedIds, targetRole, reason },
            token
          );
          setSelectedIds([]);
          await loadAll();
        } catch (err) {
          setError(err.response?.data?.message || "Could not bulk demote users.");
        } finally {
          setBulkBusy(false);
          closeDialog();
        }
      }
    });
  };

  const handleBulkSuspend = () => {
    if (selectedIds.length === 0) return;

    openDialog({
      title: `Suspend ${selectedIds.length} user(s)`,
      message: `Suspend the ${selectedIds.length} selected user(s)? They will not be able to log in.`,
      confirmLabel: "Suspend all",
      tone: "danger",
      inputLabel: "Reason for suspension",
      inputPlaceholder: "e.g. Policy violation",
      inputRequired: true,
      inputMinLength: 5,
      onConfirm: async (reason) => {
        setBulkBusy(true);
        setError("");
        try {
          await bulkSuspendSuperAdminUsers({ userIds: selectedIds, reason }, token);
          setSelectedIds([]);
          await loadAll();
        } catch (err) {
          setError(err.response?.data?.message || "Could not bulk suspend users.");
        } finally {
          setBulkBusy(false);
          closeDialog();
        }
      }
    });
  };

  const renderRowActions = (user) => {
    const isSelf = user._id === myId;
    const isSuspended = Boolean(user.isSuspended);
    const buttons = [];

    buttons.push(
      <Link
        key="view"
        className="button-secondary"
        to={`/profile/${user._id}`}
      >
        View profile
      </Link>
    );

    if (isSelf) return <div className="admin-user-actions">{buttons}</div>;

    if (user.role === "member") {
      buttons.push(
        <button
          key="promote-mod"
          className="button-secondary"
          type="button"
          onClick={() => handlePromoteToModerator(user)}
          disabled={actionId === user._id}
        >
          <FaUserTie aria-hidden="true" /> Promote to Moderator
        </button>
      );
    } else if (user.role === "moderator") {
      buttons.push(
        <button
          key="promote-admin"
          className="button-secondary"
          type="button"
          onClick={() => handlePromoteToAdmin(user)}
          disabled={actionId === user._id}
        >
          <FaUserShield aria-hidden="true" /> Promote to Admin
        </button>
      );
      buttons.push(
        <button
          key="demote-member"
          className="button-danger"
          type="button"
          onClick={() => handleDemoteToMember(user)}
          disabled={actionId === user._id}
        >
          <FaUser aria-hidden="true" /> Demote to Member
        </button>
      );
    } else if (user.role === "admin") {
      buttons.push(
        <button
          key="promote-super"
          className="button-secondary"
          type="button"
          onClick={() => handlePromoteToSuper(user)}
          disabled={actionId === user._id}
        >
          <FaCrown aria-hidden="true" /> Promote to Super
        </button>
      );
      buttons.push(
        <button
          key="demote-mod"
          className="button-danger"
          type="button"
          onClick={() => handleDemoteToModerator(user)}
          disabled={actionId === user._id}
        >
          <FaUserTie aria-hidden="true" /> Demote to Moderator
        </button>
      );
    } else if (user.role === "super_admin") {
      const canDemoteSuper = superAdmins.length > 1;
      if (canDemoteSuper) {
        buttons.push(
          <button
            key="demote-super"
            className="button-danger"
            type="button"
            onClick={() => handleDemoteSuperAdmin(user)}
            disabled={actionId === user._id}
          >
            <FaUserShield aria-hidden="true" /> Demote to Admin
          </button>
        );
      }
    }

    if (user.role !== "super_admin") {
      if (isSuspended) {
        buttons.push(
          <button
            key="unsuspend"
            className="button-secondary"
            type="button"
            onClick={() => handleUnsuspend(user)}
            disabled={actionId === user._id}
          >
            <FaUserCheck aria-hidden="true" /> Unsuspend
          </button>
        );
      } else {
        buttons.push(
          <button
            key="suspend"
            className="button-danger"
            type="button"
            onClick={() => handleSuspend(user)}
            disabled={actionId === user._id}
          >
            <FaUserSlash aria-hidden="true" /> Suspend
          </button>
        );
      }
    }

    return <div className="admin-user-actions">{buttons}</div>;
  };

  return (
    <section className="superadmin-section">
      {error && <p className="alert" style={{ marginBottom: 16 }}>{error}</p>}

      <div className="admin-search-bar">
        <FaSearch className="admin-search-icon" aria-hidden="true" />
        <input
          type="text"
          placeholder="Search by name or email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div
        style={{
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          marginBottom: 16,
          alignItems: "center"
        }}
      >
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          style={{
            padding: "8px 12px",
            borderRadius: 8,
            border: "1px solid #d1d5db",
            fontSize: 14,
            background: "#fff"
          }}
        >
          {ROLE_FILTERS.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
      </div>

      <div className="admin-section-title">
        <h2>Roles &amp; Access</h2>
        <span>{filteredUsers.length} users</span>
      </div>

      {selectedIds.length > 0 && (
        <div
          className="bulk-action-bar"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "10px 14px",
            marginBottom: 12,
            background: "#f3e8ff",
            borderRadius: 8,
            flexWrap: "wrap"
          }}
        >
          <strong>{selectedIds.length} selected</strong>
          <button
            type="button"
            className="button-secondary"
            onClick={handleBulkDemote}
            disabled={bulkBusy}
          >
            <FaUserTie aria-hidden="true" /> Bulk demote
          </button>
          <button
            type="button"
            className="button-danger"
            onClick={handleBulkSuspend}
            disabled={bulkBusy}
          >
            <FaUserSlash aria-hidden="true" /> Bulk suspend
          </button>
          <button
            type="button"
            className="button-ghost"
            onClick={() => setSelectedIds([])}
            disabled={bulkBusy}
          >
            Clear selection
          </button>
        </div>
      )}

      {loading ? (
        <div className="empty-state"><p>Loading users...</p></div>
      ) : filteredUsers.length === 0 ? (
        <div className="empty-state"><p>No users match your filters.</p></div>
      ) : (
        <>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 8,
              fontSize: 13
            }}
          >
            <input
              type="checkbox"
              checked={allSelected}
              ref={(el) => {
                if (el) el.indeterminate = someSelected;
              }}
              onChange={toggleAll}
              aria-label="Select all"
              disabled={selectableUsers.length === 0}
            />
            <span>
              Select all ({selectableUsers.length} selectable)
            </span>
          </div>

          <div className="admin-post-list">
            {filteredUsers.map((user) => {
              const badge = ROLE_BADGE[user.role] || ROLE_BADGE.member;
              const BadgeIcon = badge.Icon;
              const selectable = isSelectable(user);

              return (
                <article className="admin-user-row" key={user._id}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 8,
                      flex: 1
                    }}
                  >
                    {selectable && (
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(user._id)}
                        onChange={() => toggleOne(user._id)}
                        aria-label={`Select ${user.name}`}
                        style={{ marginTop: 14 }}
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
                          <span className={`role-badge ${badge.className}`}>
                            <BadgeIcon />
                            <span>{badge.label}</span>
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
                  </div>

                  {renderRowActions(user)}
                </article>
              );
            })}
          </div>
        </>
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
        onCancel={closeDialog}
      />
    </section>
  );
}

export default RolesAndAccessTab;