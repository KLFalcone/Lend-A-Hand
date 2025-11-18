import React, { useState, useEffect } from "react";

export default function FeedbackModal({ show, onClose, onSubmit }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");

  useEffect(() => {
    if (show) {
      setRating(0);
      setHover(0);
      setComment("");
    }
  }, [show]);

  if (!show) return null;

  const activeRating = hover || rating;

  function handleSubmit(e) {
    e.preventDefault();
    if (!rating || rating < 1 || rating > 5) {
      alert("Please choose a rating from 1 to 5 stars.");
      return;
    }
    onSubmit?.({ rating, comment: comment.trim() });
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Leave feedback"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1100,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          color: "#111",
          width: "min(520px, 94vw)",
          borderRadius: 12,
          padding: 20,
          boxShadow: "0 10px 30px rgba(0,0,0,.25)",
        }}
      >
        <h3 style={{ marginTop: 0 }}>Was this helpful?</h3>
        <p style={{ marginTop: 4, marginBottom: 16, fontSize: 14 }}>
          Let your neighbor know how it went. This helps improve future
          requests.
        </p>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 16 }}>
          <div>
            <div style={{ marginBottom: 4, fontSize: 14 }}>Your rating</div>
            <div style={{ display: "flex", gap: 4 }}>
              {[1, 2, 3, 4, 5].map((value) => {
                const filled = value <= activeRating;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRating(value)}
                    onMouseEnter={() => setHover(value)}
                    onMouseLeave={() => setHover(0)}
                    aria-label={`${value} star${value === 1 ? "" : "s"}`}
                    style={{
                      fontSize: 26,
                      lineHeight: 1,
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    <span
                      style={{
                        color: filled ? "#f59e0b" : "#d1d5db",
                        textShadow: filled ? "0 0 2px rgba(0,0,0,0.2)" : "none",
                      }}
                    >
                      ★
                    </span>
                  </button>
                );
              })}
            </div>
            {rating > 0 && (
              <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
                You chose {rating} star{rating === 1 ? "" : "s"}.
              </div>
            )}
          </div>

          <div>
            <label
              style={{ display: "block", marginBottom: 4, fontSize: 14 }}
            >
              Optional comments
            </label>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Anything you’d like to share?"
              style={{
                width: "100%",
                borderRadius: 8,
                border: "1px solid #d1d5db",
                padding: 8,
                fontFamily: "inherit",
                fontSize: 14,
              }}
            />
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 8,
              marginTop: 4,
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                background: "#fff",
                border: "1px solid #d1d5db",
                borderRadius: 6,
                padding: "6px 12px",
              }}
            >
              Skip
            </button>
            <button
              type="submit"
              style={{
                background: "#2563eb",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                padding: "6px 14px",
                cursor: "pointer",
              }}
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
