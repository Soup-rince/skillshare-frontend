import { useState, useEffect, useCallback } from "react";
import {
  FaDatabase,
  FaRobot,
  FaEnvelope,
  FaCloud,
  FaArchive,
  FaSyncAlt,
  FaCheckCircle,
  FaExclamationTriangle,
  FaTimesCircle,
  FaQuestionCircle,
  FaClock
} from "react-icons/fa";
import { getSystemHealth } from "../api";

const SERVICE_ICONS = {
  database: FaDatabase,
  aiService: FaRobot,
  email: FaEnvelope,
  cloudinary: FaCloud,
  backups: FaArchive
};

const STATUS_META = {
  ok: { label: "Operational", color: "#168565", Icon: FaCheckCircle },
  warning: { label: "Warning", color: "#d97706", Icon: FaExclamationTriangle },
  error: { label: "Down", color: "#dc2626", Icon: FaTimesCircle },
  timeout: { label: "Timeout", color: "#dc2626", Icon: FaTimesCircle },
  not_configured: { label: "Not configured", color: "#6b7280", Icon: FaQuestionCircle }
};

function formatUptime(seconds) {
  if (!seconds && seconds !== 0) return "—";
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function formatCheckedAt(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit" });
}

function SystemHealthTab() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [warming, setWarming] = useState(false);
  const [error, setError] = useState("");
  const token = localStorage.getItem("token");

  const load = useCallback(async (isRefresh) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError("");
      setWarming(false);

      const slowTimer = setTimeout(() => setWarming(true), 8000);

      try {
        const res = await getSystemHealth(token);
        setHealth(res.data);
      } finally {
        clearTimeout(slowTimer);
        setWarming(false);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Could not load system health.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    load(false);
  }, [load]);

  useEffect(() => {
    const interval = setInterval(() => load(true), 30000);
    return () => clearInterval(interval);
  }, [load]);

  const overallMeta = health
    ? (health.overall === "healthy"
        ? { label: "All systems operational", color: "#168565", Icon: FaCheckCircle }
        : health.overall === "warning"
          ? { label: "Degraded performance", color: "#d97706", Icon: FaExclamationTriangle }
          : { label: "System issues detected", color: "#dc2626", Icon: FaTimesCircle })
    : null;

  return (
    <section className="superadmin-section">
      {error && <p className="alert" style={{ marginBottom: 16 }}>{error}</p>}

      <div
        className="admin-section-title"
        style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}
      >
        <h2 style={{ margin: 0 }}>System health</h2>
        <span style={{ marginLeft: "auto", fontSize: 13, color: "#66708a" }}>
          {health ? `Checked ${formatCheckedAt(health.checkedAt)}` : ""}
        </span>
        <button
          type="button"
          className="button-secondary"
          onClick={() => load(true)}
          disabled={refreshing || loading}
        >
          <FaSyncAlt className={refreshing ? "spin" : ""} aria-hidden="true" />
          <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
        </button>
      </div>

      {loading ? (
        <div className="empty-state">
          {warming ? (
            <>
              <p>
                <FaClock aria-hidden="true" style={{ marginRight: 6 }} />
                Waking up server… this can take up to 60s on cold start.
              </p>
            </>
          ) : (
            <p>Running health checks...</p>
          )}
        </div>
      ) : !health ? (
        <div className="empty-state"><p>No health data available.</p></div>
      ) : (
        <>
          {overallMeta && (
            <div
              className="system-health-banner"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "12px 16px",
                borderRadius: 10,
                marginBottom: 16,
                background: `${overallMeta.color}15`,
                color: overallMeta.color,
                fontWeight: 600,
                fontSize: 14
              }}
            >
              <overallMeta.Icon />
              <span>{overallMeta.label}</span>
            </div>
          )}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 12
            }}
          >
            {health.services.map((svc) => {
              const Icon = SERVICE_ICONS[svc.key] || FaQuestionCircle;
              const meta = STATUS_META[svc.status] || STATUS_META.error;
              return (
                <div
                  key={svc.key}
                  className="system-health-card"
                  style={{
                    background: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: 10,
                    padding: "14px 16px",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 12
                  }}
                >
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      background: `${meta.color}15`,
                      color: meta.color,
                      flexShrink: 0
                    }}
                  >
                    <Icon />
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <strong>{svc.name}</strong>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          fontSize: 12,
                          color: meta.color,
                          fontWeight: 600
                        }}
                      >
                        <meta.Icon /> {meta.label}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, color: "#66708a", marginTop: 4 }}>
                      {typeof svc.latencyMs === "number" ? `${svc.latencyMs}ms` : null}
                      {svc.detail
                        ? (typeof svc.latencyMs === "number" ? " · " : "") + svc.detail
                        : null}
                    </div>
                  </div>
                </div>
              );
            })}
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
            <span><strong>Uptime:</strong> {formatUptime(health.runtime.uptimeSeconds)}</span>
            <span><strong>Node:</strong> {health.runtime.nodeVersion}</span>
            <span><strong>Memory:</strong> {health.runtime.memoryUsedMb} / {health.runtime.memoryTotalMb} MB</span>
          </div>
        </>
      )}
    </section>
  );
}

export default SystemHealthTab;