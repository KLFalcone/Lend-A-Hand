import React, { useEffect, useRef, useState } from "react";
import { api } from "../lib/api";

export default function RequestDetailsModal({ requestId, onClose }) {
  const [req, setReq] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [accepting, setAccepting] = useState(false); // new state
  const dialogRef = useRef(null);

  useEffect(() => {
    if (!requestId) return;
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const data = await api.getRequest(requestId);
        if (mounted) setReq(data);
      } catch (e) {
        if (mounted) setErr("Failed to load request details.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [requestId]);

  // ESC to close
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // focus the modal when it opens
  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    const prev = document.activeElement;
    el.focus();
    return () => prev && prev.focus && prev.focus();
  }, []);

  // ✅ handle Accept button click
  async function handleAccept() {
    if (!requestId) return;
    try {
      setAccepting(true);
      await api.acceptRequest(requestId);
      alert("✅ Request accepted!");
      // update local state so it shows new status
      setReq((prev) => ({ ...prev, status: "accepted" }));
    } catch (e) {
      console.error(e);
      alert("❌ Failed to accept request. You may need to log in.");
    } finally {
      setAccepting(false);
    }
  }

  if (!requestId) return null;

  return (
    <div
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Request details"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        paddingTop: "6vh",
        zIndex: 1000
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        ref={dialogRef}
        tabIndex={-1}
        style={{
          background: "#fff",
          color: "#111",
          width: "min(680px, 92vw)",
          maxHeight: "82vh",
          overflow: "auto",
          padding: 16,
          borderRadius: 10,
          boxShadow: "0 10px 30px rgba(0,0,0,.20)"
        }}
      >
        {loading ? (
          <p>Loading…</p>
        ) : err ? (
          <p>{err}</p>
        ) : (
          <>
            <h2 style={{ marginTop: 0 }}>{req?.title || "Request"}</h2>

            <div style={{ fontSize: 14, opacity: 0.8, marginBottom: 8 }}>
              Category: <b>{req?.category || "—"}</b> •{" "}
              Urgency: <b>{req?.urgency || "—"}</b>
            </div>

            <p style={{ whiteSpace: "pre-wrap" }}>
              {req?.description || "No description provided."}
            </p>

            <div style={{ marginTop: 8, lineHeight: 1.5 }}>
              <div><b>Location:</b> {req?.location?.address || "—"}</div>
              <div>
                <b>Posted by:</b>{" "}
                {req?.createdBy?.displayName || req?.createdBy?.email || "—"}
              </div>
              <div><b>Status:</b> {req?.status || "open"}</div>
            </div>

            <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
              {/* Accept now works */}
              <button
                onClick={handleAccept}
                disabled={accepting || req?.status !== "open"}
                style={{
                  background: "#007bff",
                  color: "#fff",
                  border: "none",
                  padding: "8px 14px",
                  borderRadius: 6,
                  cursor: accepting ? "wait" : "pointer",
                }}
              >
                {accepting
                  ? "Accepting..."
                  : req?.status === "open"
                  ? "Accept"
                  : "Accepted"}
              </button>

              {/* other actions still disabled for now */}
              <button disabled title="Coming soon">Message</button>
              <button disabled title="Coming soon">Report</button>
              <button onClick={onClose}>Close</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
