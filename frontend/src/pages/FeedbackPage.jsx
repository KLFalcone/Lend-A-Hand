import React, { useEffect, useState } from "react";
import { api } from "../lib/api";

function StarRow({ rating }) {
  const filled = Math.round(Number(rating) || 0);
  return (
    <span aria-label={`${filled} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} style={{ color: i < filled ? "#f59e0b" : "#d4d4d4" }}>
          ★
        </span>
      ))}
    </span>
  );
}

export default function FeedbackCenter() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await api.meFeedback();
        if (!alive) return;
        const list = Array.isArray(data.feedback)
          ? data.feedback
          : Array.isArray(data.items)
          ? data.items
          : [];
        setItems(list);
        setErr("");
      } catch (e) {
        if (!alive) return;
        setErr(e.message || "Failed to load feedback.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <main style={{ padding: 16, maxWidth: 960, margin: "0 auto" }}>
      <h2 style={{ margin: "6px 0 12px" }}>Reputation &amp; Feedback</h2>
      <p style={{ color: "#667085", maxWidth: 700 }}>
        This page shows reviews you&apos;ve received as a helper. Neighbors see
        your average rating on your profile and when they view your completed
        requests.
      </p>

      {loading ? (
        <p>Loading…</p>
      ) : err ? (
        <p style={{ color: "#b42318" }}>{err}</p>
      ) : items.length === 0 ? (
        <p style={{ color: "#667085" }}>
          You don&apos;t have any feedback yet. Complete a few requests to
          start building your reputation.
        </p>
      ) : (
        <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
          {items.map((f) => (
            <article
              key={f._id || `${f.request}-${f.createdAt}`}
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 12,
                padding: 16,
                background: "#fff",
                display: "grid",
                gap: 6,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontWeight: 600 }}>
                    {f.request?.title || "Request"}
                  </div>
                  <div style={{ fontSize: 12, color: "#667085" }}>
                    {f.request?.status === "closed" ? "Completed" : "Status"} •{" "}
                    {f.request?.status || "—"}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <StarRow rating={f.rating} />
                  <div style={{ fontSize: 12, color: "#667085" }}>
                    {f.rating}/5
                  </div>
                </div>
              </div>

              <div style={{ fontSize: 13, color: "#4b5563" }}>
                <strong>From:</strong>{" "}
                {f.from?.displayName || f.from?.email || "Neighbor"}
              </div>

              {f.comment && (
                <p
                  style={{
                    marginTop: 4,
                    marginBottom: 0,
                    fontSize: 14,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {f.comment}
                </p>
              )}

              <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>
                {f.createdAt
                  ? new Date(f.createdAt).toLocaleString()
                  : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
