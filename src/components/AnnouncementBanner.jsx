import { useState, useEffect } from "react";
import { FaTimes, FaInfoCircle, FaExclamationTriangle, FaExclamationCircle } from "react-icons/fa";
import { getActiveAnnouncement, dismissAnnouncement } from "../api";

const TYPE_CONFIG = {
  info: {
    icon: FaInfoCircle,
    className: "announcement-banner-info"
  },
  warning: {
    icon: FaExclamationTriangle,
    className: "announcement-banner-warning"
  },
  critical: {
    icon: FaExclamationCircle,
    className: "announcement-banner-critical"
  }
};

function AnnouncementBanner() {
  const [announcement, setAnnouncement] = useState(null);
  const [dismissing, setDismissing] = useState(false);
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) return;
    const fetchActive = async () => {
      try {
        const res = await getActiveAnnouncement(token);
        setAnnouncement(res.data || null);
      } catch {
        setAnnouncement(null);
      }
    };
    fetchActive();
  }, [token]);

  const handleDismiss = async () => {
    if (!announcement || dismissing) return;
    try {
      setDismissing(true);
      await dismissAnnouncement(announcement._id, token);
      setAnnouncement(null);
    } catch {
      setAnnouncement(null);
    } finally {
      setDismissing(false);
    }
  };

  if (!announcement) return null;

  const config = TYPE_CONFIG[announcement.type] || TYPE_CONFIG.info;
  const IconComponent = config.icon;

  return (
    <div className={`announcement-banner ${config.className}`}>
      <span className="announcement-banner-icon" aria-hidden="true">
        <IconComponent />
      </span>
      <div className="announcement-banner-body">
        <strong className="announcement-banner-title">{announcement.title}</strong>
        <p className="announcement-banner-message">{announcement.message}</p>
      </div>
      {announcement.isDismissible && (
        <button
          type="button"
          className="announcement-banner-close"
          onClick={handleDismiss}
          disabled={dismissing}
          aria-label="Dismiss announcement"
        >
          <FaTimes />
        </button>
      )}
    </div>
  );
}

export default AnnouncementBanner;