// frontend/src/pages/SpecificPost.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../lib/api";

export default function SpecificPost() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await api.getRequest(id); // GET /api/v1/requests/:id
        if (alive) setPost(data);
      } catch (e) {
        if (alive) setErr(e.message || "Failed to load request.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [id]);

  if (loading) return <main style={{ padding: 16 }}>Loading…</main>;
  if (err) return <main style={{ padding: 16 }}>❌ {err}</main>;
  if (!post) return <main style={{ padding: 16 }}>Not found.</main>;

  const createdBy =
    post?.createdBy?.displayName || post?.createdBy?.email || "Unknown";

  const createdStr = post.createdAt
    ? new Date(post.createdAt).toLocaleString()
    : "";
  const completedStr = post.completedAt
    ? new Date(post.completedAt).toLocaleString()
    : null;

  return (
    <main style={{ padding: 16, maxWidth: 800, margin: "0 auto" }}>
      <button onClick={() => navigate(-1)} style={{ marginBottom: 12 }}>
        ← Back
      </button>

      <h2 style={{ margin: "6px 0 8px" }}>{post.title}</h2>
      <p style={{ color: "#667085", margin: 0 }}>
        <strong>Category:</strong> {post.category} &nbsp;•&nbsp;
        <strong>Urgency:</strong> {post.urgency} &nbsp;•&nbsp;
        <strong>Status:</strong> {post.status}
      </p>

      <div style={{ marginTop: 12 }}>
        <p>{post.description}</p>
        {post?.location?.address && (
          <p><strong>Location:</strong> {post.location.address}</p>
        )}
        <p><strong>Posted by:</strong> {createdBy}</p>
        <p style={{ color: "#667085" }}>
          <small>Created {createdStr}</small>
        </p>
        {completedStr && (
          <p style={{ color: "#667085" }}>
            <small>Completed {completedStr}</small>
          </p>
        )}
      </div>
    </main>
  );
}
