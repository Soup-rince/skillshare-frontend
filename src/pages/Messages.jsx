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
  const [error, setError] = useState("");
  const token = localStorage.getItem("token");
  const myId = localStorage.getItem("userId");

  const loadInbox = async () => { const res = await getInbox(token); setInbox(res.data); };
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
      if (preselectedId && !activePartner) { const res = await getUserProfile(preselectedId, token); openConversation(preselectedId, res.data.user.name); }
    };
    openPreselected().catch(() => setError("We could not open this conversation."));
  }, [preselectedId]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!content.trim() || !activePartner) return;
    try { await sendMessage({ receiver: activePartner.id, content }, token); setContent(""); await openConversation(activePartner.id, activePartner.name); await loadInbox(); }
    catch { setError("Message could not be sent. Please try again."); }
  };

  return (
    <main className="page-container">
      <header className="page-heading"><div><p className="eyebrow">Connect</p><h1>Messages</h1><p>Start a conversation about a skill exchange.</p></div></header>
      {error && <p className="alert" style={{ marginBottom: 16 }}>{error}</p>}
      <section className="messages-layout">
        <aside className="conversation-list">
          <div className="conversation-list-title">Conversations</div>
          {inbox.length === 0 && <p className="message-placeholder">No conversations yet.</p>}
          {inbox.map((conv) => <button className={`conversation-item ${activePartner?.id === conv.partnerId ? "active" : ""}`} key={conv.partnerId} onClick={() => openConversation(conv.partnerId, conv.partnerName)}><strong>{conv.partnerName}</strong><span>{conv.lastMessage}</span></button>)}
        </aside>
        <section className="message-panel">
          {!activePartner ? <div className="message-placeholder">Select a conversation or open a post to message its owner.</div> : <>
            <header className="message-header">{activePartner.name}</header>
            <div className="message-stream">{messages.map((msg) => <div className={`message-bubble ${msg.sender._id === myId ? "mine" : "theirs"}`} key={msg._id}>{msg.content}</div>)}</div>
            <form className="message-compose" onSubmit={handleSend}><input value={content} onChange={(e) => setContent(e.target.value)} placeholder="Write a message..." aria-label="Message" /><button className="button" type="submit" disabled={!content.trim()}>Send</button></form>
          </>}
        </section>
      </section>
    </main>
  );
}

export default Messages;
