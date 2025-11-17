// frontend/src/components/FeedbackModal.jsx
import React, { useState } from "react";

export default function FeedbackModal({ show, onClose, onSubmit }) {
  const [rating, setRating] = useState(null); // "helpful" | "not_helpful"
  const [comment, setComment] = useState("");

  if (!show) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating) {
      alert("Please pick Helpful or Not really before submitting.");
      return;
    }

    await onSubmit({
      rating,
      comment: comment.trim(),
    });
    // parent (RequestDetailsModal) will close this via setShowFeedback(false)
  };

  const baseChoiceStyle = {
    flex: 1,
    borderRadius: 6,
    padding: "10px 12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    cursor: "pointer",
    border: "2px solid #d1d5db",
    background: "#f9fafb",
    fontSize: 14,
    fontWeight: 500,
  };

  const selectedHelpfulStyle = {
    ...baseChoiceStyle,
    borderColor: "#16a34a",
    background: "#dcfce7",
    color: "#166534",
  };

  const selectedNotHelpfulStyle = {
    ...baseChoiceStyle,
    borderColor: "#f97316",
    background: "#ffedd5",
    color: "#9a3412",
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Feedback"
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
          width: "min(520px, 92vw)",
          borderRadius: 12,
          padding: 24,
          boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
        }}
      >
        <h3 style={{ margin: "0 0 4px", fontSize: 20 }}>Was this helpful?</h3>
        <p
          style={{
            margin: "0 0 16px",
            fontSize: 14,
            color: "#6b7280",
            lineHeight: 1.4,
          }}
        >
          Let your neighbor know how it went. This helps improve future
          requests.
        </p>

        {/* rating choices */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <button
            type="button"
            onClick={() => setRating("helpful")}
            style={
              rating === "helpful" ? selectedHelpfulStyle : baseChoiceStyle
            }
          >
            <span role="img" aria-label="Helpful">
              👍
            </span>
            <span>Helpful</span>
          </button>

          <button
            type="button"
            onClick={() => setRating("not_helpful")}
            style={
              rating === "not_helpful"
                ? selectedNotHelpfulStyle
                : baseChoiceStyle
            }
          >
            <span role="img" aria-label="Not really">
              👎
            </span>
            <span>Not really</span>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <label
            style={{
              display: "block",
              fontSize: 13,
              fontWeight: 500,
              color: "#4b5563",
              marginBottom: 4,
            }}
          >
            Optional comments
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Anything you'd like to share?"
            rows={3}
            style={{
              width: "100%",
              resize: "vertical",
              borderRadius: 6,
              border: "1px solid #d1d5db",
              padding: 8,
              fontSize: 14,
              marginBottom: 16,
            }}
          />

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 8,
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "8px 14px",
                borderRadius: 6,
                border: "1px solid #d1d5db",
                background: "#fff",
                cursor: "pointer",
              }}
            >
              Skip
            </button>
            <button
              type="submit"
              style={{
                padding: "8px 14px",
                borderRadius: 6,
                border: "none",
                background: "#2563eb",
                color: "#fff",
                cursor: "pointer",
                fontWeight: 600,
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
