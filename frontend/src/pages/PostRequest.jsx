import React from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";

export default function PostRequest() {
  const navigate = useNavigate();
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [message, setMessage] = React.useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      // TODO: implement on backend -> POST /api/requests
      await api.createRequest?.({ title, description });
      setMessage("Request posted!");
      setTimeout(() => navigate("/browse"), 800);
    } catch (err) {
      setMessage("Couldn’t post request (API not ready yet).");
    }
  };

  return (
    <main style={{ padding: 16 }}>
      <h2>Post Request</h2>
      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12, maxWidth: 520 }}>
        <input
          type="text"
          placeholder="Short title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <textarea
          placeholder="Describe what you need help with"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={5}
          required
        />
        <button type="submit">Post</button>
      </form>
      {message && <p style={{ marginTop: 8 }}>{message}</p>}
    </main>
  );
}
