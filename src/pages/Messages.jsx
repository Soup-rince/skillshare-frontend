import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { getInbox, getConversation, sendMessage, getUserProfile } from "../api";

function Messages() {
  const [searchParams] = useSearchParams();
  const preselectedId = searchParams.get("to");

  const [inbox, setInbox] = useState([]);
  const [activePartner, setActivePartner] = useState(null);
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState("");

  const token = localStorage.getItem("token");
  const myId = localStorage.getItem("userId");

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
    loadInbox();
  }, []);

  useEffect(() => {
    const openPreselected = async () => {
      if (preselectedId && !activePartner) {
        const res = await getUserProfile(preselectedId, token);
        openConversation(preselectedId, res.data.user.name);
      }
    };
    openPreselected();
  }, [preselectedId]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!content.trim() || !activePartner) return;
    await sendMessage({ receiver: activePartner.id, content }, token);
    setContent("");
    openConversation(activePartner.id, activePartner.name);
    loadInbox();
  };

  return (
    <div style={{ maxWidth: 700, margin: "20px auto", display: "flex", height: 480, border: "1px solid #ddd", borderRadius: 10, overflow: "hidden" }}>
      <div style={{ width: 220, borderRight: "1px solid #ddd", overflowY: "auto" }}>
        {inbox.length === 0 && <p style={{ padding: 14, fontSize: 13, color: "#888" }}>No conversations yet.</p>}
        {inbox.map((conv) => (
          <div
            key={conv.partnerId}
            onClick={() => openConversation(conv.partnerId, conv.partnerName)}
            style={{
              padding: 12,
              borderBottom: "1px solid #eee",
              cursor: "pointer",
              background: activePartner?.id === conv.partnerId ? "#f6f5f2" : "transparent"
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600 }}>{conv.partnerName}</div>
            <div style={{ fontSize: 12, color: "#999", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {conv.lastMessage}
            </div>
          </div>
        ))}
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {!activePartner && (
          <p style={{ margin: "auto", color: "#888" }}>Select a conversation</p>
        )}

        {activePartner && (
          <>
            <div style={{ padding: 12, borderBottom: "1px solid #ddd", fontWeight: 600, fontSize: 13 }}>
              {activePartner.name}
            </div>
            <div style={{ flex: 1, padding: 16, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
              {messages.map((msg) => (
                <div
                  key={msg._id}
                  style={{
                    alignSelf: msg.sender._id === myId ? "flex-end" : "flex-start",
                    background: msg.sender._id === myId ? "#0f6e56" : "#f6f5f2",
                    color: msg.sender._id === myId ? "white" : "black",
                    padding: "8px 12px",
                    borderRadius: 14,
                    maxWidth: "65%",
                    fontSize: 13.5
                  }}
                >
                  {msg.content}
                </div>
              ))}
            </div>
            <form onSubmit={handleSend} style={{ display: "flex", gap: 8, padding: 12, borderTop: "1px solid #ddd" }}>
              <input
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Type a message..."
                style={{ flex: 1, padding: 8 }}
              />
              <button type="submit" disabled={!content.trim()}>Send</button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default Messages;