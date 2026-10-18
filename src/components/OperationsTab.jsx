import { useState, useEffect, useCallback } from "react";
import {
  FaArchive,
  FaPlay,
  FaCheckCircle,
  FaExclamationTriangle,
  FaSyncAlt,
  FaBell,
  FaEnvelope
} from "react-icons/fa";
import { runBackupNow, getSystemHealth, clearOldNotifications, sendTestEmail } from "../api";
import ConfirmDialog from "./ConfirmDialog";

function OperationsTab() {
  const [backup, setBackup] = useState(null);
  const [healthLoading, setHealthLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [confirmDialog, setConfirmDialog] = useState(null);
  const token = localStorage.getItem("token");

  const loadBackupStatus = useCallback(async () => {
    try {
      setHealthLoading(true);
      const res = await getSystemHealth(token);
      const backupsSvc = (res.data.services || []).find((s) => s.key === "backups");
      setBackup(backupsSvc || null);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load backup status.");
    } finally {
      setHealthLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadBackupStatus();
  }, [loadBackupStatus]);

  const handleRunBackup = () => {
    setConfirmDialog({
      title: "Run backup now",
      message:
        "This will export users, skillposts, and messages to a JSON file in the backend backups folder. The server will stay online.",
      confirmLabel: "Run backup",
      tone: "info",
      inputLabel: "Reason for running this backup",
      inputPlaceholder: "e.g. Pre-deployment snapshot, manual safety backup",
      inputRequired: true,
      inputMinLength: 5,
      onConfirm: async (reason) => {
        setRunning(true);
        setError("");
        setSuccess("");
        try {
          const res = await runBackupNow({ reason }, token);
          const counts = res.data.counts || {};
          const total = Object.values(counts).reduce((a, b) => a + b, 0);
          setSuccess(
            `Backup complete — ${res.data.file} · ${total} docs · ${Math.round(
              (res.data.sizeBytes || 0) / 1024
            )} KB`
          );
          await loadBackupStatus();
        } catch (err) {
          setError(err.response?.data?.message || "Could not run backup.");
        } finally {
          setRunning(false);
          setConfirmDialog(null);
        }
      }
    });
  };

  const handleClearNotifications = () => {
    setConfirmDialog({
      title: "Clear old notifications",
      message:
        "This deletes notifications that are already marked as read and older than 60 days. Unread notifications are always preserved, regardless of age.",
      confirmLabel: "Clear old notifications",
      tone: "danger",
      inputLabel: "Reason for cleanup",
      inputPlaceholder: "e.g. Routine housekeeping, reduce DB size",
      inputRequired: true,
      inputMinLength: 5,
      onConfirm: async (reason) => {
        setCleaning(true);
        setError("");
        setSuccess("");
        try {
          const res = await clearOldNotifications(
            { reason, days: 60 },
            token
          );
          setSuccess(
            `Cleanup complete — ${res.data.deletedCount} notifications removed (older than 60 days, read-only).`
          );
        } catch (err) {
          setError(err.response?.data?.message || "Could not clear notifications.");
        } finally {
          setCleaning(false);
          setConfirmDialog(null);
        }
      }
    });
  };

  const handleSendTestEmail = () => {
    setConfirmDialog({
      title: "Send test email",
      message:
        "This will send a test email to your own super admin account email to verify the email service works end-to-end.",
      confirmLabel: "Send test email",
      tone: "info",
      inputLabel: "Reason for sending this test email",
      inputPlaceholder: "e.g. Verify email delivery after SMTP change",
      inputRequired: true,
      inputMinLength: 5,
      onConfirm: async (reason) => {
        setSendingEmail(true);
        setError("");
        setSuccess("");
        try {
          const res = await sendTestEmail({ reason }, token);
          setSuccess(`Test email sent to ${res.data.to} — check your inbox.`);
        } catch (err) {
          setError(err.response?.data?.message || "Could not send test email.");
        } finally {
          setSendingEmail(false);
          setConfirmDialog(null);
        }
      }
    });
  };

  return (
    <section className="superadmin-section">
      {error && <p className="alert" style={{ marginBottom: 16 }}>{error}</p>}
      {success && (
        <p
          className="alert"
          style={{
            marginBottom: 16,
            background: "#ecfdf5",
            color: "#065f46",
            borderColor: "#a7f3d0"
          }}
        >
          <FaCheckCircle aria-hidden="true" /> {success}
        </p>
      )}

      <div className="admin-section-title">
        <h2 style={{ margin: 0 }}>Operations</h2>
        <span style={{ marginLeft: "auto", fontSize: 13, color: "#66708a" }}>
          These actions run immediately and are logged to the audit trail.
        </span>
      </div>

      <div
        className="system-health-card"
        style={{
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 10,
          padding: "18px 20px",
          marginTop: 12,
          display: "flex",
          alignItems: "center",
          gap: 16,
          flexWrap: "wrap"
        }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 44,
            height: 44,
            borderRadius: 10,
            background: "#7c3aed15",
            color: "#7c3aed",
            flexShrink: 0
          }}
        >
          <FaArchive />
        </span>

        <div style={{ flex: 1, minWidth: 220 }}>
          <strong style={{ display: "block", marginBottom: 4 }}>Manual backup</strong>
          <div style={{ fontSize: 13, color: "#66708a" }}>
            {healthLoading ? (
              <>Loading last backup status…</>
            ) : backup && backup.status ? (
              <>
                Last: <strong>{backup.detail || "—"}</strong>
                {backup.ageHours !== undefined && <> · {backup.ageHours}h ago</>}
              </>
            ) : (
              <>No backup status available.</>
            )}
          </div>
          <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 6 }}>
            Backups on this host are <strong>ephemeral</strong> — they survive until
            the next deploy. For permanent archives, configure <code>BACKUP_DIR</code>{" "}
            to a persistent disk on Render, or rely on the GitHub Actions cron.
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            type="button"
            className="button-secondary"
            onClick={loadBackupStatus}
            disabled={running || healthLoading}
          >
            <FaSyncAlt className={healthLoading ? "spin" : ""} aria-hidden="true" />
            <span>Refresh status</span>
          </button>
          <button
            type="button"
            className="button"
            onClick={handleRunBackup}
            disabled={running}
          >
            <FaPlay aria-hidden="true" />
            <span>{running ? "Running…" : "Run backup now"}</span>
          </button>
        </div>
      </div>

      <div
        className="system-health-card"
        style={{
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 10,
          padding: "18px 20px",
          marginTop: 12,
          display: "flex",
          alignItems: "center",
          gap: 16,
          flexWrap: "wrap"
        }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 44,
            height: 44,
            borderRadius: 10,
            background: "#d9770615",
            color: "#d97706",
            flexShrink: 0
          }}
        >
          <FaBell />
        </span>

        <div style={{ flex: 1, minWidth: 220 }}>
          <strong style={{ display: "block", marginBottom: 4 }}>Clear old notifications</strong>
          <div style={{ fontSize: 13, color: "#66708a" }}>
            Deletes notifications that are <strong>read</strong> AND older than{" "}
            <strong>60 days</strong>. Unread notifications are never deleted.
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            type="button"
            className="button-danger"
            onClick={handleClearNotifications}
            disabled={cleaning}
          >
            <FaBell aria-hidden="true" />
            <span>{cleaning ? "Clearing…" : "Clear old notifications"}</span>
          </button>
        </div>
      </div>

      <div
        className="system-health-card"
        style={{
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 10,
          padding: "18px 20px",
          marginTop: 12,
          display: "flex",
          alignItems: "center",
          gap: 16,
          flexWrap: "wrap"
        }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 44,
            height: 44,
            borderRadius: 10,
            background: "#2639ba15",
            color: "#2639ba",
            flexShrink: 0
          }}
        >
          <FaEnvelope />
        </span>

        <div style={{ flex: 1, minWidth: 220 }}>
          <strong style={{ display: "block", marginBottom: 4 }}>Send test email</strong>
          <div style={{ fontSize: 13, color: "#66708a" }}>
            Sends a test email to your own super admin account to verify the
            email service works end-to-end. The health check only verifies SMTP
            connect — this actually delivers.
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            type="button"
            className="button"
            onClick={handleSendTestEmail}
            disabled={sendingEmail}
          >
            <FaEnvelope aria-hidden="true" />
            <span>{sendingEmail ? "Sending…" : "Send test email"}</span>
          </button>
        </div>
      </div>

      <div
        className="system-health-runtime"
        style={{
          marginTop: 16,
          padding: "12px 16px",
          background: "#f6f7ff",
          borderRadius: 10,
          fontSize: 13,
          color: "#374151",
          display: "flex",
          flexWrap: "wrap",
          gap: 20
        }}
      >
        <span>
          <FaExclamationTriangle aria-hidden="true" style={{ color: "#d97706", marginRight: 6 }} />
          Operations run <strong>synchronously</strong> on the server. Every action is logged with actor and reason.
        </span>
      </div>

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

export default OperationsTab;