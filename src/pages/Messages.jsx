import { useState, useEffect, useRef, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { FaSearch, FaPaperPlane } from "react-icons/fa";
import { getInbox, getConversation, sendMessage, getUserProfile } from "../api";

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

function Messages() {
  const [searchParams] = useSearchParams();
  const preselectedId = searchParams.get("to");
  const [inbox, setInbox] = useState([]);
  const [activePartner, setActivePartner] = useState(null);
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const token = localStorage.getItem("token");
  const myId = localStorage.getItem("userId");
  const streamRef = useRef(null);

  const loadInbox = async () => {
    const res = await getInbox(token);
    setInbox(res.data);
  };

  const openConversation = async (partnerId, partnerName) => {
    setActivePartner({ id: partnerId, name: partnerName });
    const res = await getConversation(partnerId, token);
    setMessages(res.data);
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

  const handleSend = async (e) => {
    e.preventDefault();
    if (!content.trim() || !activePartner) return;
    try {
      await sendMessage({ receiver: activePartner.id, content }, token);
      setContent("");
      await openConversation(activePartner.id, activePartner.name);
      await loadInbox();
    } catch {
      setError("Message could not be sent. Please try again.");
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
                            <span className="message-bubble-content">{msg.content}</span>
                            <span className="message-bubble-time">{formatTime(msg.createdAt)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
              <form className="message-compose" onSubmit={handleSend}>
                <input
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write a message..."
                  aria-label="Message"
                />
                <button className="button" type="submit" disabled={!content.trim()}>
                  <FaPaperPlane aria-hidden="true" />
                  <span>Send</span>
                </button>
              </form>
            </>
          )}
        </section>
      </section>
    </main>
  );
}

export default Messages;