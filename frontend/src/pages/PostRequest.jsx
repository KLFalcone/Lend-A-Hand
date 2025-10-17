import React from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";

export default function PostRequest() {
  const navigate = useNavigate();

  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [urgency, setUrgency] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  // Redirect if not logged in
  React.useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setSubmitting(true);

    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    // Client-side validation
    if (!title || !description || !category || !urgency || !address) {
      setMessage("Please fill in all required fields.");
      setSubmitting(false);
      return;
    }

    try {
      const payload = {
        title,
        description,
        category,
        urgency,
        location: { address },
      };

      await api.createRequest(payload);

      setMessage("Request posted!");
      // Redirect after short delay to show feedback
      setTimeout(() => navigate("/browse"), 800);
    } catch (err) {
      console.error(err);
      if (err.message?.includes("401")) {
        // unauthorized → redirect
        navigate("/login");
      } else {
        setMessage("Could not post request. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main style={{ padding: 16 }}>
      <h2>Create a New Request</h2>
      <form
        onSubmit={handleSubmit}
        style={{ display: "grid", gap: 12, maxWidth: 520 }}
      >
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

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          required
        >
          <option value="">Select category</option>
          <option value="Errand">Errand</option>
          <option value="Yardwork">Yardwork</option>
          <option value="Pet Care">Pet Care</option>
          <option value="Tutoring">Tutoring</option>
          <option value="Household">Household</option>
          <option value="Other">Other</option>
        </select>

        <select
          value={urgency}
          onChange={(e) => setUrgency(e.target.value)}
          required
        >
          <option value="">Select urgency</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>

        <input
          type="text"
          placeholder="Location (address)"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          required
        />

        <button type="submit" disabled={submitting}>
          {submitting ? "Posting..." : "Post Request"}
        </button>
      </form>

      {message && (
        <p style={{ marginTop: 8, fontWeight: "bold" }}>{message}</p>
      )}
    </main>
  );
}
