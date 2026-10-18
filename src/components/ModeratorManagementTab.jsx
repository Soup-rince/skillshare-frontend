import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  FaSearch,
  FaUserShield,
  FaUser,
  FaBan,
  FaUserTie,
  FaUserSlash,
  FaUserCheck
} from "react-icons/fa";
import {
  getAllModerators,
  changeUserRole,
  suspendModerator,
  unsuspendModerator,
  bulkSuspendSuperAdminUsers,
  bulkDemoteSuperAdminUsers
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

function ModeratorManagementTab() {
  const [moderators, setModerators] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionId, setActionId] = useState("");
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkBusy, setBulkBusy] = useState(false);
  const token = localStorage.getItem("token");
  const myId = localStorage.getItem("userId");

  const loadModerators = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await getAllModerators(token);
      setModerators(res.data);
      setSelectedIds((prev) =>
        prev.filter((id) => res.data.some((u) => u._id === id))
      );
    } catch (err) {
      setError(err.response?.data?.message || "Could not load moderators.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadModerators();
  }, []);

  const handlePromoteToAdmin = (user) => {
    setConfirmDialog({
      title: "Promote to Admin",
      message: `Promote ${user.name} to Admin? They will gain access to user management and moderation controls.`,
      confirmLabel: "Promote",
      tone: "info",
      inputLabel: "Reason for promotion",
      inputPlaceholder: "e.g. Excellent moderation work, ready for more responsibility",
      inputRequired: true,
      inputMinLength: 5,
      onConfirm: async (reason) => {
        setActionId(user._id);
        try {
          await changeUserRole(user._id, { role: "admin", reason }, token);
          await loadModerators();
        } catch (err) {
          setError(err.response?.data?.message || "Could not promote user.");
        } finally {
          setActionId("");
          setConfirmDialog(null);
        }
      }
    });
  };

  const handleDemoteToMember = (user) => {
    setConfirmDialog({
      title: "Demote to Member",
      message: `Demote ${user.name} to Member? They will lose all moderator privileges.`,
      confirmLabel: "Demote",
      tone: "danger",
      inputLabel: "Reason for demotion",
      inputPlaceholder: "e.g. Inactive for 60+ days",
      inputRequired: true,
      inputMinLength: 5,
      onConfirm: async (reason) => {
        setActionId(user._id);
        try {
          await changeUserRole(user._id, { role: "member", reason }, token);
          await loadModerators();
        } catch (err) {
          setError(err.response?.data?.message || "Could not demote user.");
        } finally {
          setActionId("");
          setConfirmDialog(null);
        }
      }
    });
  };

  const handleSuspend = (user) => {
    setConfirmDialog({
      title: "Suspend moderator",
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
          await suspendModerator(user._id, { reason }, token);
          await loadModerators();
        } catch (err) {
          setError(err.response?.data?.message || "Could not suspend moderator.");
        } finally {
          setActionId("");
          setConfirmDialog(null);
        }
      }
    });
  };

  const handleUnsuspend = (user) => {
    setConfirmDialog({
      title: "Unsuspend moderator",
      message: `Restore access for ${user.name}? They will be notified with the reason below.`,
      confirmLabel: "Unsuspend",
      tone: "info",
      inputLabel: "Reason for unsuspension (optional)",
      inputPlaceholder: "e.g. Appeal accepted, investigation cleared",
      inputRequired: false,
      inputMinLength: 0,
      onConfirm: async (reason) => {
        setActionId(user._id);
        try {
          await unsuspendModerator(user._id, { reason }, token);
          await loadModerators();
        } catch (err) {
          setError(err.response?.data?.message || "Could not unsuspend moderator.");
        } finally {
          setActionId("");
          setConfirmDialog(null);
        }
      }
    });
  };

  const filteredModerators = moderators.filter((u) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      (u.name || "").toLowerCase().includes(q) ||
      (u.email || "").toLowerCase().includes(q)
    );
  });

  const selectableIds = useMemo(
    () => filteredModerators.filter((u) => u._id !== myId).map((u) => u._id),
    [filteredModerators, myId]
  );
  const allSelected =
    selectableIds.length > 0 && selectableIds.every((id) => selectedIds.includes(id));
  const someSelected = selectedIds.length > 0 && !allSelected;

  const toggleOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(selectableIds);
    }
  };

  const handleBulkDemote = () => {
    if (selectedIds.length === 0) return;
    setConfirmDialog({
      title: `Demote ${selectedIds.length} moderator(s) to Member`,
      message: `Demote ${selectedIds.length} selected moderator(s) to Member? They will lose all moderator privileges.`,
      confirmLabel: "Demote all",
      tone: "danger",
      inputLabel: "Reason for demotion",
      inputPlaceholder: "e.g. Inactive, restructuring moderator team",
      inputRequired: true,
      inputMinLength: 5,
      onConfirm: async (reason) => {
        setBulkBusy(true);
        try {
          await bulkDemoteSuperAdminUsers(
            { userIds: selectedIds, targetRole: "member", reason },
            token
          );
          setSelectedIds([]);
          await loadModerators();
        } catch (err) {
          setError(err.response?.data?.message || "Could not bulk demote moderators.");
        } finally {
          setBulkBusy(false);
          setConfirmDialog(null);
        }
      }
    });
  };

  const handleBulkSuspend = () => {
    if (selectedIds.length === 0) return;
    setConfirmDialog({
      title: `Suspend ${selectedIds.length} moderator(s)`,
      message: `Suspend ${selectedIds.length} selected moderator(s)? They will not be able to log in.`,
      confirmLabel: "Suspend all",
      tone: "danger",
      inputLabel: "Reason for suspension",
      inputPlaceholder: "e.g. Policy violation",
      inputRequired: true,
      inputMinLength: 5,
      onConfirm: async (reason) => {
        setBulkBusy(true);
        try {
          await bulkSuspendSuperAdminUsers({ userIds: selectedIds, reason }, token);
          setSelectedIds([]);
          await loadModerators();
        } catch (err) {
          setError(err.response?.data?.message || "Could not bulk suspend moderators.");
        } finally {
          setBulkBusy(false);
          setConfirmDialog(null);
        }
      }
    });
  };

  return (
    <section className="superadmin-section">
      {error && <p className="alert" style={{ marginBottom: 16 }}>{error}</p>}

      <div className="admin-search-bar">
        <FaSearch className="admin-search-icon" aria-hidden="true" />
        <input
          type="text"
          placeholder="Search moderators by name or email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="admin-section-title">
        <h2>Moderator management</h2>
        <span>{filteredModerators.length} moderators</span>
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
            <FaUser aria-hidden="true" /> Demote to Member
          </button>
          <button
            type="button"
            className="button-danger"
            onClick={handleBulkSuspend}
            disabled={bulkBusy}
          >
            <FaUserSlash aria-hidden="true" /> Suspend
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
        <div className="empty-state"><p>Loading moderators...</p></div>
      ) : filteredModerators.length === 0 ? (
        <div className="empty-state"><p>No moderators found.</p></div>
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
              aria-label="Select all moderators"
            />
            <span>Select all ({selectableIds.length} selectable)</span>
          </div>

          <div className="admin-post-list">
            {filteredModerators.map((user) => {
              const isSelf = user._id === myId;
              const canAct = !isSelf;
              const canSelect = !isSelf;

              return (
                <article className="admin-user-row" key={user._id}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 8, flex: 1 }}>
                    {canSelect && (
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
                          <span className="role-badge role-moderator">
                            <FaUserTie />
                            <span>moderator</span>
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

                  {canAct && (
                    <div className="admin-user-actions">
                      <Link className="button-secondary" to={`/profile/${user._id}`}>
                        View profile
                      </Link>

                      <button
                        className="button-secondary"
                        type="button"
                        onClick={() => handlePromoteToAdmin(user)}
                        disabled={actionId === user._id}
                      >
                        <FaUserShield aria-hidden="true" />
                        <span>Promote to Admin</span>
                      </button>

                      <button
                        className="button-danger"
                        type="button"
                        onClick={() => handleDemoteToMember(user)}
                        disabled={actionId === user._id}
                      >
                        <FaUser aria-hidden="true" />
                        <span>Demote to Member</span>
                      </button>

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
                    </div>
                  )}
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
        onCancel={() => setConfirmDialog(null)}
      />
    </section>
  );
}

export default ModeratorManagementTab;