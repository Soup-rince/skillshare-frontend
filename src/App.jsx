import { useState } from "react";
import { login, sendMessage, getConversation } from "./api";
import "./App.css";

function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState(null);
  const [userId, setUserId] = useState(null);

  const [receiverId, setReceiverId] = useState("");
  const [content, setContent] = useState("");
  const [messages, setMessages] = useState([]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await login({ email, password });
      setToken(res.data.token);
      setUserId(res.data._id);
    } catch (err) {
      alert("Login failed: " + err.response?.data?.message);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!content.trim()) return; // huwag magpatuloy kung walang laman o puro space lang
    try {
      await sendMessage({ receiver: receiverId, content }, token);
      setContent("");
      handleLoadConversation();
    } catch (err) {
      alert("Send failed: " + err.response?.data?.message);
    }
  };

  const handleLoadConversation = async () => {
    try {
      const res = await getConversation(receiverId, token);
      setMessages(res.data);
    } catch (err) {
      alert("Load failed: " + err.response?.data?.message);
    }
  };

  if (!token) {
    return (
      <div style={{ maxWidth: 400, margin: "50px auto" }}>
        <h2>Login</h2>
        <form onSubmit={handleLogin}>
          <input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ display: "block", width: "100%", marginBottom: 10, padding: 8 }}
          />
          <input
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ display: "block", width: "100%", marginBottom: 10, padding: 8 }}
          />
          <button type="submit">Login</button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 500, margin: "50px auto" }}>
      <h2>Logged in as: {userId}</h2>

      <div style={{ marginBottom: 20 }}>
        <input
          placeholder="Receiver User ID"
          value={receiverId}
          onChange={(e) => setReceiverId(e.target.value)}
          style={{ display: "block", width: "100%", marginBottom: 10, padding: 8 }}
        />
        <button onClick={handleLoadConversation}>Load Conversation</button>
      </div>

      <form onSubmit={handleSend} style={{ marginBottom: 20 }}>
        <input
          placeholder="Type a message..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          style={{ display: "block", width: "100%", marginBottom: 10, padding: 8 }}
        />
        <button type="submit" disabled={!content.trim()}>Send</button>
      </form>

      <div>
        <h3>Messages</h3>
        {messages.map((msg) => (
          <div
            key={msg._id}
            style={{
              textAlign: msg.sender === userId ? "right" : "left",
              marginBottom: 8
            }}
          >
            <span style={{ background: "#eee", padding: "6px 10px", borderRadius: 8, display: "inline-block" }}>
              {msg.content}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;