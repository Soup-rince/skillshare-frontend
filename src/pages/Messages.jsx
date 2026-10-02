import { useState, useEffect, useRef, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { FaSearch, FaPaperPlane, FaImage, FaVideo, FaMicrophone, FaPaperclip, FaTimes, FaStop, FaDownload, FaCheck, FaStar } from "react-icons/fa";
import { getInbox, getConversation, sendMessage, getUserProfile, uploadMedia, getExchangeWith, createExchange, confirmExchange, getMyReviewForUser, createReview } from "../api";
import ReviewForm from "../components/ReviewForm";

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

function formatTime(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function formatRelative(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now - d;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "now";
  if (diffMin < 60) return `${diffMin}m`;
  if (diffHour < 24) return `${diffHour}h`;
  if (diffDay < 7) return `${diffDay}d`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatDateLabel(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const msgDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());

  if (msgDate.getTime() === today.getTime()) return "Today";
  if (msgDate.getTime() === yesterday.getTime()) return "Yesterday";
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function groupMessagesByDate(messages) {
  const groups = [];
  let currentLabel = null;
  let currentGroup = null;

  messages.forEach((msg) => {
    const label = formatDateLabel(msg.createdAt);
    if (label !== currentLabel) {
      currentLabel = label;
      currentGroup = { label, messages: [] };
      groups.push(currentGroup);
    }
    currentGroup.messages.push(msg);
  });

  return groups;
}

function formatFileSize(bytes) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function Messages() {
  const [searchParams] = useSearchParams();
  const preselectedId = searchParams.get("to");
  const [inbox, setInbox] = useState([]);
  const [activePartner, setActivePartner] = useState(null);
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [pendingFile, setPendingFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState(null);
  const [lightboxName, setLightboxName] = useState("");
  const [lightboxType, setLightboxType] = useState("image");
  const [exchange, setExchange] = useState(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [myReview, setMyReview] = useState(null);
  const token = localStorage.getItem("token");
  const myId = localStorage.getItem("userId");
  const streamRef = useRef(null);
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);

  const loadInbox = async () => {
    const res = await getInbox(token);
    setInbox(res.data);
  };

  const openConversation = async (partnerId, partnerName) => {
    setActivePartner({ id: partnerId, name: partnerName });
    const res = await getConversation(partnerId, token);
    setMessages(res.data);
  };

  const closeLightbox = () => {
    setLightboxUrl(null);
    setLightboxType("image");
  };

  useEffect(() => {
    const initialLoad = window.setTimeout(() => {
      loadInbox().catch(() => setError("We could not load your conversations."));
    }, 0);
    return () => window.clearTimeout(initialLoad);
  }, []);

  useEffect(() => {
    const openPreselected = async () => {
      if (preselectedId && !activePartner) {
        const res = await getUserProfile(preselectedId, token);
        openConversation(preselectedId, res.data.user.name);
      }
    };
    openPreselected().catch(() => setError("We could not open this conversation."));
  }, [preselectedId]);

  useEffect(() => {
    if (streamRef.current) {
      streamRef.current.scrollTop = streamRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        setLightboxUrl(null);
        setLightboxType("image");
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  useEffect(() => {
    if (!activePartner) {
      setExchange(null);
      setMyReview(null);
      return;
    }
    const fetchExchangeAndReview = async () => {
      try {
        const [exRes, revRes] = await Promise.all([
          getExchangeWith(activePartner.id, token),
          getMyReviewForUser(activePartner.id, token)
        ]);
        setExchange(exRes.data);
        setMyReview(revRes.data);
      } catch {
        // silent
      }
    };
    fetchExchangeAndReview();
  }, [activePartner, token]);

  const handleMarkCompleted = async () => {
    if (!activePartner) return;
    try {
      let exchangeId = exchange?._id;
      if (!exchangeId) {
        const res = await createExchange({ partner: activePartner.id }, token);
        exchangeId = res.data._id;
        setExchange(res.data);
      }
      const confirmRes = await confirmExchange(exchangeId, token);
      setExchange(confirmRes.data);
    } catch {
      setError("Could not mark exchange as completed.");
    }
  };

  const handleSubmitReview = async (payload) => {
    const res = await createReview(payload, token);
    setMyReview(res.data);
    setShowReviewForm(false);
  };

  const handleFileSelect = (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFile({ file, previewType: type });
    setShowAttachMenu(false);
    e.target.value = "";
  };

  const handleRemovePending = () => {
    setPendingFile(null);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const file = new File([blob], `voice-${Date.now()}.webm`, { type: "audio/webm" });
        setPendingFile({ file, previewType: "audio" });
        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorder.start();
      setRecording(true);
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch {
      setError("Microphone access was denied.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
      setRecording(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      setRecordingTime(0);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!activePartner) return;
    if (!content.trim() && !pendingFile) return;

    try {
      setUploading(true);
      setError("");

      let mediaData = {};

      if (pendingFile) {
        const formData = new FormData();
        formData.append("file", pendingFile.file);
        const uploadRes = await uploadMedia(formData, token);
        mediaData = uploadRes.data;
      }

      await sendMessage(
        {
          receiver: activePartner.id,
          content: content.trim() || "",
          ...mediaData,
        },
        token
      );

      setContent("");
      setPendingFile(null);
      await openConversation(activePartner.id, activePartner.name);
      await loadInbox();
    } catch (err) {
      setError("Message could not be sent. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const filteredInbox = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return inbox;
    return inbox.filter((conv) =>
      conv.partnerName.toLowerCase().includes(q) ||
      (conv.lastMessage || "").toLowerCase().includes(q)
    );
  }, [inbox, searchQuery]);

  const messageGroups = useMemo(() => groupMessagesByDate(messages), [messages]);

  const canSend = (content.trim() || pendingFile) && !uploading && !recording;

  const renderExchangeHeader = () => {
    if (!exchange) {
      return (
        <button
          type="button"
          className="button-small button-secondary"
          onClick={handleMarkCompleted}
        >
          <FaCheck aria-hidden="true" />
          <span>Mark as completed</span>
        </button>
      );
    }

    if (exchange.status === "pending") {
      const iConfirmed =
        (exchange.initiator?._id === myId && exchange.initiatorConfirmed) ||
        (exchange.partner?._id === myId && exchange.partnerConfirmed);
      const theyConfirmed =
        (exchange.initiator?._id === myId && exchange.partnerConfirmed) ||
        (exchange.partner?._id === myId && exchange.initiatorConfirmed);

      if (iConfirmed && !theyConfirmed) {
        return (
          <span className="exchange-status exchange-status-pending">
            Waiting for {activePartner.name} to confirm...
          </span>
        );
      }

      return (
        <button
          type="button"
          className="button-small button-secondary"
          onClick={handleMarkCompleted}
        >
          <FaCheck aria-hidden="true" />
          <span>Confirm exchange</span>
        </button>
      );
    }

    if (exchange.status === "completed") {
      return (
        <div className="exchange-completed-actions">
          <span className="exchange-completed-badge">
            <FaCheck aria-hidden="true" />
            <span>Exchange completed</span>
          </span>
          <button
            type="button"
            className="button-small"
            onClick={() => setShowReviewForm(true)}
          >
            <FaStar aria-hidden="true" />
            <span>{myReview ? "Update review" : "Leave a review"}</span>
          </button>
        </div>
      );
    }

    return null;
  };

  return (
    <main className="page-container">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Connect</p>
          <h1>Messages</h1>
          <p>Start a conversation about a skill exchange.</p>
        </div>
      </header>
      {error && <p className="alert" style={{ marginBottom: 16 }}>{error}</p>}
      <section className="messages-layout">
        <aside className="conversation-list">
          <div className="conversation-list-header">
            <div className="conversation-search">
              <FaSearch className="conversation-search-icon" aria-hidden="true" />
              <input
                type="text"
                placeholder="Search chats"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search conversations"
              />
            </div>
          </div>
          {inbox.length === 0 && (
            <p className="message-placeholder">No conversations yet.</p>
          )}
          {inbox.length > 0 && filteredInbox.length === 0 && (
            <p className="message-placeholder">No chats match your search.</p>
          )}
          {filteredInbox.map((conv) => (
            <button
              className={`conversation-item ${activePartner?.id === conv.partnerId ? "active" : ""}`}
              key={conv.partnerId}
              onClick={() => openConversation(conv.partnerId, conv.partnerName)}
            >
              <span
                className="conversation-avatar"
                style={{ background: getAvatarColor(conv.partnerName) }}
                aria-hidden="true"
              >
                {getInitials(conv.partnerName)}
              </span>
              <span className="conversation-body">
                <span className="conversation-top">
                  <strong>{conv.partnerName}</strong>
                  {conv.unreadCount > 0 && (
                    <span className="conversation-badge">
                      {conv.unreadCount > 99 ? "99+" : conv.unreadCount}
                    </span>
                  )}
                </span>
                <span className="conversation-bottom">
                  <span className="conversation-preview">{conv.lastMessage}</span>
                  <span className="conversation-time">{formatRelative(conv.lastMessageAt)}</span>
                </span>
              </span>
            </button>
          ))}
        </aside>
        <section className="message-panel">
          {!activePartner ? (
            <div className="message-placeholder">
              Select a conversation or open a post to message its owner.
            </div>
          ) : (
            <>
              <header className="message-header">
                <span
                  className="message-header-avatar"
                  style={{ background: getAvatarColor(activePartner.name) }}
                  aria-hidden="true"
                >
                  {getInitials(activePartner.name)}
                </span>
                <span className="message-header-name">{activePartner.name}</span>
                <div className="message-header-exchange">
                  {renderExchangeHeader()}
                </div>
              </header>
              <div className="message-stream" ref={streamRef}>
                {messageGroups.map((group) => (
                  <div key={group.label} className="message-group">
                    <div className="message-date-divider">
                      <span>{group.label}</span>
                    </div>
                    {group.messages.map((msg) => {
                      const mine = msg.sender._id === myId;
                      return (
                        <div
                          className={`message-row ${mine ? "mine" : "theirs"}`}
                          key={msg._id}
                        >
                          {!mine && (
                            <span
                              className="message-bubble-avatar"
                              style={{ background: getAvatarColor(msg.sender.name) }}
                              aria-hidden="true"
                            >
                              {getInitials(msg.sender.name)}
                            </span>
                          )}
                          <div className={`message-bubble ${mine ? "mine" : "theirs"}`}>
                            {msg.mediaUrl && msg.mediaType === "image" && (
                              <img
                                src={msg.mediaUrl}
                                alt={msg.mediaName || "image"}
                                className="message-media-image"
                                onClick={() => {
                                  setLightboxUrl(msg.mediaUrl);
                                  setLightboxName(msg.mediaName);
                                  setLightboxType("image");
                                }}
                              />
                            )}
                            {msg.mediaUrl && msg.mediaType === "video" && (
                              <video
                                src={msg.mediaUrl}
                                className="message-media-video"
                                onClick={() => {
                                  setLightboxUrl(msg.mediaUrl);
                                  setLightboxName(msg.mediaName);
                                  setLightboxType("video");
                                }}
                              />
                            )}
                            {msg.mediaUrl && msg.mediaType === "audio" && (
                              <audio src={msg.mediaUrl} controls className="message-media-audio" />
                            )}
                            {msg.mediaUrl && msg.mediaType === "file" && (
                              <a
                                href={`${msg.mediaUrl.replace("/upload/", "/upload/fl_attachment/")}?filename=${encodeURIComponent(msg.mediaName || "file")}`}
                                className="message-media-file"
                              >
                                <FaPaperclip aria-hidden="true" />
                                <span className="message-media-file-name">{msg.mediaName || "File"}</span>
                                {msg.mediaSize > 0 && (
                                  <span className="message-media-file-size">{formatFileSize(msg.mediaSize)}</span>
                                )}
                              </a>
                            )}
                            {msg.content && (
                              <span className="message-bubble-content">{msg.content}</span>
                            )}
                            <span className="message-bubble-time">{formatTime(msg.createdAt)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
              <form className="message-compose" onSubmit={handleSend}>
                {pendingFile && (
                  <div className="pending-file-preview">
                    {pendingFile.previewType === "image" && (
                      <img src={URL.createObjectURL(pendingFile.file)} alt="preview" />
                    )}
                    {pendingFile.previewType === "video" && (
                      <video src={URL.createObjectURL(pendingFile.file)} />
                    )}
                    {pendingFile.previewType === "audio" && (
                      <audio src={URL.createObjectURL(pendingFile.file)} controls />
                    )}
                    {pendingFile.previewType === "file" && (
                      <div className="pending-file-icon">
                        <FaPaperclip aria-hidden="true" />
                        <span>{pendingFile.file.name}</span>
                      </div>
                    )}
                    <button
                      type="button"
                      className="pending-file-remove"
                      onClick={handleRemovePending}
                      aria-label="Remove attachment"
                    >
                      <FaTimes />
                    </button>
                  </div>
                )}

                {recording ? (
                  <div className="recording-bar">
                    <span className="recording-dot" aria-hidden="true" />
                    <span className="recording-time">
                      {String(Math.floor(recordingTime / 60)).padStart(2, "0")}:
                      {String(recordingTime % 60).padStart(2, "0")}
                    </span>
                    <button type="button" className="recording-cancel" onClick={cancelRecording}>
                      Cancel
                    </button>
                    <button type="button" className="recording-stop" onClick={stopRecording}>
                      <FaStop aria-hidden="true" />
                      <span>Stop</span>
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="attach-wrapper">
                      <button
                        type="button"
                        className="attach-button"
                        onClick={() => setShowAttachMenu((s) => !s)}
                        aria-label="Attach media"
                      >
                        <FaPaperclip />
                      </button>
                      {showAttachMenu && (
                        <div className="attach-menu">
                          <button type="button" onClick={() => imageInputRef.current?.click()}>
                            <FaImage /> <span>Photo</span>
                          </button>
                          <button type="button" onClick={() => videoInputRef.current?.click()}>
                            <FaVideo /> <span>Video</span>
                          </button>
                          <button type="button" onClick={startRecording}>
                            <FaMicrophone /> <span>Voice</span>
                          </button>
                          <button type="button" onClick={() => fileInputRef.current?.click()}>
                            <FaPaperclip /> <span>File</span>
                          </button>
                        </div>
                      )}
                    </div>
                    <input
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Write a message..."
                      aria-label="Message"
                      disabled={uploading}
                    />
                    <button className="button" type="submit" disabled={!canSend}>
                      <FaPaperPlane aria-hidden="true" />
                      <span>{uploading ? "Sending..." : "Send"}</span>
                    </button>
                  </>
                )}

                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => handleFileSelect(e, "image")}
                />
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  hidden
                  onChange={(e) => handleFileSelect(e, "video")}
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  hidden
                  onChange={(e) => handleFileSelect(e, "file")}
                />
              </form>
            </>
          )}
        </section>
      </section>

      {lightboxUrl && (
        <div className="lightbox-overlay" onClick={closeLightbox}>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="lightbox-close"
              onClick={closeLightbox}
              aria-label="Close"
            >
              <FaTimes />
            </button>
            {lightboxType === "video" ? (
              <video src={lightboxUrl} controls autoPlay className="lightbox-video" />
            ) : (
              <img src={lightboxUrl} alt={lightboxName || "image"} className="lightbox-image" />
            )}
            <a
              className="lightbox-download"
              href={`${lightboxUrl.replace("/upload/", "/upload/fl_attachment/")}?filename=${encodeURIComponent(lightboxName || (lightboxType === "video" ? "video" : "image"))}`}
            >
              <FaDownload aria-hidden="true" />
              <span>Download</span>
            </a>
          </div>
        </div>
      )}

      {activePartner && (
        <ReviewForm
          isOpen={showReviewForm}
          revieweeId={activePartner.id}
          revieweeName={activePartner.name}
          existingReview={myReview}
          onClose={() => setShowReviewForm(false)}
          onSubmit={handleSubmitReview}
        />
      )}
    </main>
  );
}

export default Messages;