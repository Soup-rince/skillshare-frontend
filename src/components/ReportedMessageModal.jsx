import { createPortal } from "react-dom";
import {
  FaTimes,
  FaFlag,
  FaUser,
  FaArrowRight,
  FaImage,
  FaVideo,
  FaMicrophone,
  FaFileAlt,
  FaLink
} from "react-icons/fa";

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

const REASON_LABELS = {
  spam: "Spam or repetitive content",
  inappropriate: "Inappropriate or offensive content",
  harassment: "Harassment or hate speech",
  misinformation: "Misinformation or misleading content",
  other: "Other"
};

function extractUrls(text) {
  if (!text) return [];
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.match(urlRegex) || [];
}

function ReportedMessageModal({ report, onClose }) {
  if (!report) return null;

  const message = report.message;
  const sender = message?.sender?.name || report.targetUser?.name || "Unknown sender";
  const receiver = message?.receiver?.name || "Unknown receiver";
  const reporter = report.reporter?.name || "Unknown reporter";

  const isDeleted = message?.deleted;
  const hasMedia = Boolean(message?.mediaUrl && message?.mediaType);
  const hasContent = Boolean(message?.content && message.content.trim());
  const urls = extractUrls(message?.content);

  const renderMedia = () => {
    if (!hasMedia) return null;

    switch (message.mediaType) {
      case "image":
        return (
          <div className="reported-media-block">
            <span className="reported-media-label">
              <FaImage /> Image
            </span>
            <img
              src={message.mediaUrl}
              alt="Reported image"
              className="reported-media-image"
              onClick={() => window.open(message.mediaUrl, "_blank", "noopener,noreferrer")}
            />
          </div>
        );
      case "video":
        return (
          <div className="reported-media-block">
            <span className="reported-media-label">
              <FaVideo /> Video
            </span>
            <video src={message.mediaUrl} controls className="reported-media-video" />
          </div>
        );
      case "audio":
        return (
          <div className="reported-media-block">
            <span className="reported-media-label">
              <FaMicrophone /> Voice message
            </span>
            <audio src={message.mediaUrl} controls className="reported-media-audio" />
          </div>
        );
      case "file":
        return (
          <div className="reported-media-block">
            <span className="reported-media-label">
              <FaFileAlt /> File
            </span>
            <a
              href={message.mediaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="button-secondary"
              style={{ marginTop: 8, display: "inline-block" }}
            >
              Download {message.mediaName || "file"}
              {message.mediaSize > 0 && ` (${(message.mediaSize / 1024).toFixed(1)} KB)`}
            </a>
          </div>
        );
      default:
        return null;
    }
  };

  return createPortal(
    <div className="reported-message-overlay" onClick={onClose}>
      <div className="reported-message-modal" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="reported-message-close"
          onClick={onClose}
          aria-label="Close"
        >
          <FaTimes />
        </button>

        <header className="reported-message-header">
          <div className="reported-message-icon">
            <FaFlag />
          </div>
          <div>
            <h2>Reported Message</h2>
            <p>Preview of the reported content only. Full conversation is private.</p>
          </div>
        </header>

        <div className="reported-message-body">
          <div className="reported-message-row">
            <span className="reported-message-label">Sender</span>
            <span className="reported-message-value">
              <FaUser /> {sender}
            </span>
          </div>

          <div className="reported-message-row">
            <span className="reported-message-label">Receiver</span>
            <span className="reported-message-value">
              <FaArrowRight /> {receiver}
            </span>
          </div>

          <div className="reported-message-row">
            <span className="reported-message-label">Reporter</span>
            <span className="reported-message-value">
              <FaUser /> {reporter}
            </span>
          </div>

          <div className="reported-message-row">
            <span className="reported-message-label">Reason</span>
            <span className="reported-message-value">
              {REASON_LABELS[report.reason] || report.reason || "Not specified"}
            </span>
          </div>

          <div className="reported-message-row">
            <span className="reported-message-label">Date</span>
            <span className="reported-message-value">
              {formatDate(message?.createdAt || report.createdAt)}
            </span>
          </div>

          <div className="reported-message-section">
            <h3>Reported content</h3>

            {isDeleted && (
              <p className="reported-message-deleted">
                <em>This message was deleted</em>
              </p>
            )}

            {!isDeleted && hasContent && (
              <div className="reported-message-content">
                "{message.content}"
              </div>
            )}

            {!isDeleted && urls.length > 0 && (
              <div className="reported-message-links">
                <span className="reported-media-label">
                  <FaLink /> Links detected
                </span>
                {urls.map((url, i) => (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="reported-message-link"
                  >
                    {url}
                  </a>
                ))}
              </div>
            )}

            {!isDeleted && renderMedia()}

            {!isDeleted && !hasContent && !hasMedia && (
              <p className="reported-message-deleted">
                <em>No content available</em>
              </p>
            )}
          </div>

          {report.details && (
            <div className="reported-message-section">
              <h3>Reporter's note</h3>
              <p className="reported-message-note">"{report.details}"</p>
            </div>
          )}
        </div>

        <footer className="reported-message-footer">
          <button type="button" className="button" onClick={onClose}>
            Close
          </button>
        </footer>
      </div>
    </div>,
    document.body
  );
}

export default ReportedMessageModal;