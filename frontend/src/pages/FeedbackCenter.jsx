// frontend/src/pages/FeedbackCenter.jsx
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
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setErr("");

        // 1) Get current user so we know whose feedback to show
        const me = await api.me();
        const user = me?.user || me || null;
        if (!user?._id) {
          throw new Error("Could not determine current user.");
        }

        // 2) Use the populated feedback endpoint
        const data = await api.getUserFeedback(user._id);

        if (!alive) return;
        setItems(Array.isArray(data?.items) ? data.items : []);
        setSummary(data?.summary || null);
      } catch (e) {
        console.error("Failed to load feedback center:", e);
        if (alive) {
          setErr(e.message || "Failed to load feedback.");
          setItems([]);
          setSummary(null);
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const avgText =
    summary && typeof summary.avgRating === "number"
      ? `${summary.avgRating.toFixed(1)} / 5`
      : "No ratings yet";

  return (
    <main style={{ padding: 16, maxWidth: 960, margin: "0 auto" }}>
      <h2 style={{ margin: "6px 0 12px" }}>Reputation &amp; Feedback</h2>
      <p style={{ color: "#667085", maxWidth: 700 }}>
        This page shows reviews you&apos;ve received as a helper. Neighbors see
        your average rating on your profile and when they view your completed
        requests.
      </p>

      {/* Summary / header card */}
      <div
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          background: "#fff",
          padding: 16,
          marginBottom: 16,
        }}
      >
        {loading ? (
          <p>Loading…</p>
        ) : err ? (
          <p style={{ color: "#b42318" }}>{err}</p>
        ) : (
          <>
            <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>
              {avgText}
            </div>
            <div style={{ fontSize: 14, color: "#667085" }}>
              {summary && summary.reviewCount > 0 ? (
                <>
                  Based on {summary.reviewCount}{" "}
                  {summary.reviewCount === 1 ? "review" : "reviews"} from
                  neighbors you&apos;ve helped.
                </>
              ) : (
                <>No feedback has been left yet.</>
              )}
            </div>
          </>
        )}
      </div>

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
          {items.map((f) => {
            const title = f.requestTitle || "Request";
            const status = f.requestStatus || "—";
            const statusLabel = status === "closed" ? "Completed" : "Status";
            const fromName =
              f.reviewer?.displayName || f.reviewer?.email || "Neighbor";

            return (
              <article
                key={`${f.requestId}-${f.createdAt}-${fromName}`}
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 12,
                  padding: 16,
                  background: "#fff",
                  display: "grid",
                  gap: 6,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600 }}>{title}</div>
                    <div style={{ fontSize: 12, color: "#667085" }}>
                      {statusLabel} • {status}
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
                  <strong>From:</strong> {fromName}
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
            );
          })}
        </div>
      )}
    </main>
  );
}
