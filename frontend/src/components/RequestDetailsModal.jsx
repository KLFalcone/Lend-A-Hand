// frontend/src/components/RequestDetailsModal.jsx
import React, { useEffect, useRef, useState } from "react";
import { api } from "../lib/api";
import FeedbackModal from "./FeedbackModal.jsx";

export default function RequestDetailsModal({
  requestId,
  onClose,
  onStatusChange,
}) {
  const [req, setReq] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(null); // "accept" | "cancel" | "complete" | "confirm" | "delete" | "report" | null
  const [currentUser, setCurrentUser] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);

  const dialogRef = useRef(null);

  // ----- Load request details -----
  useEffect(() => {
    if (!requestId) return;
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        setErr("");
        const data = await api.getRequest(requestId);
        if (mounted) setReq(data);
      } catch (e) {
        console.error("Failed to load request details:", e);
        if (mounted) setErr("Failed to load request details.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [requestId]);

  // ----- Load current user (for permissions + messaging) -----
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const me = await api.me();
        const user = me?.user || me;
        if (mounted) setCurrentUser(user || null);
      } catch (e) {
        console.error("api.me() failed in RequestDetailsModal:", e);
        if (mounted) setCurrentUser(null);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // ----- ESC to close -----
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // ----- Focus the modal when it opens -----
  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    const prev = document.activeElement;
    el.focus();
    return () => prev && prev.focus && prev.focus();
  }, []);

  const userId = currentUser?._id ? String(currentUser._id) : null;
  const ownerId =
    req && (req.createdBy?._id || (typeof req.createdBy === "string" && req.createdBy));
  const helperId =
    req && (req.acceptedBy?._id || (typeof req.acceptedBy === "string" && req.acceptedBy));

  const isOwner = !!userId && !!ownerId && String(ownerId) === userId;
  const isHelper = !!userId && !!helperId && String(helperId) === userId;
  const isAdmin = currentUser && currentUser.role === "admin";

  // ----- Actions -----
  async function handleAccept() {
    if (!requestId) return;
    try {
      setBusy("accept");
      const updated = await api.acceptRequest(requestId);
      setReq(updated);
      alert("Request accepted!");
      onStatusChange?.(updated.status || "in_progress");
    } catch (e) {
      console.error(e);
      alert("Failed to accept request. You may need to log in or you might be the owner.");
    } finally {
      setBusy(null);
    }
  }

  async function handleCancel() {
    if (!requestId) return;
    if (!window.confirm("Cancel your acceptance of this request?")) return;
    try {
      setBusy("cancel");
      const updated = await api.cancelAcceptance(requestId);
      setReq(updated);
      alert("Request cancelled.");
      onStatusChange?.(updated.status || "open");
    } catch (e) {
      console.error(e);
      alert("Failed to cancel request.");
    } finally {
      setBusy(null);
    }
  }

  async function handleMarkComplete() {
    if (!requestId) return;
    try {
      setBusy("complete");
      const updated = await api.markComplete(requestId);
      setReq(updated);
      alert("Marked as complete! Awaiting requester confirmation.");
      onStatusChange?.(updated.status || "pending_confirmation");
    } catch (e) {
      console.error(e);
      alert("Failed to mark complete. You may not be authorized.");
    } finally {
      setBusy(null);
    }
  }

  async function handleConfirmCompletion() {
    if (!requestId) return;
    try {
      setBusy("confirm");
      const updated = await api.confirmCompletion(requestId);
      setReq(updated);
      alert("Request confirmed and closed!");
      onStatusChange?.(updated.status || "closed");

      // After confirmation, prompt for feedback
      setShowFeedback(true);
    } catch (e) {
      console.error(e);
      alert("Failed to confirm completion.");
    } finally {
      setBusy(null);
    }
  }

  async function handleFeedbackSubmit({ rating, comment }) {
    if (!requestId) return;
    try {
      await api.submitFeedback(requestId, rating, comment);
      alert("Thanks for your feedback!");
    } catch (e) {
      console.error(e);
      alert("Sorry, we couldn't save your feedback.");
    } finally {
      setShowFeedback(false);
    }
  }

  async function handleDeleteRequest() {
    if (!requestId) return;
    const confirmed = window.confirm(
      "Are you sure you want to delete this request?"
    );
    if (!confirmed) return;

    try {
      setBusy("delete");
      await api.deleteRequest(requestId);
      alert("Request deleted.");
      onStatusChange?.("deleted");
      onClose?.();
    } catch (e) {
      console.error(e);
      alert("Failed to delete request.");
    } finally {
      setBusy(null);
    }
  }

  async function handleReport() {
    if (!requestId) return;
    const confirmed = window.confirm(
      "Report this request to the admins as inappropriate or concerning?"
    );
    if (!confirmed) return;

    try {
      setBusy("report");
      await api.reportRequest(requestId);
      alert("Thanks, your report has been sent to the admins.");
      setReq((prev) => (prev ? { ...prev, flagged: true } : prev));
    } catch (e) {
      console.error(e);
      alert("Failed to report request. You may need to log in.");
    } finally {
      setBusy(null);
    }
  }

  // ----- Figure out who the "other person" is for messaging -----
  function getConversationPartner() {
    if (!req) return null;

    const normalize = (u) =>
      !u
        ? null
        : {
            id: String(u._id || u),
            name: u.displayName || u.email || "",
            email: u.email || "",
          };

    const requester = normalize(req.createdBy);
    const helper = normalize(req.acceptedBy);

    if (userId) {
      if (requester && requester.id !== userId) {
        return { role: "requester", ...requester };
      }
      if (helper && helper.id !== userId) {
        return { role: "helper", ...helper };
      }
    }

    if (helper && helper.email) return { role: "helper", ...helper };
    if (requester && requester.email) return { role: "requester", ...requester };

    return null;
  }

  function handleMessage() {
    const partner = getConversationPartner();
    if (!partner || !partner.email) {
      alert("We couldn't find who to message for this request yet.");
      return;
    }

    const subject = encodeURIComponent(
      `Lend A Hand: "${req?.title || "your request"}"`
    );

    const myName =
      currentUser?.displayName || currentUser?.email || "your neighbor";

    const bodyLines = [
      `Hi ${partner.name || ""},`,
      "",
      `I'm reaching out about "${req?.title || "the request"}" on Lend A Hand.`,
      "",
      "Thanks!",
      myName,
    ];

    const body = encodeURIComponent(bodyLines.join("\n"));

    window.location.href = `mailto:${partner.email}?subject=${subject}&body=${body}`;
  }

  // ----- Derived values for rendering -----
  if (!requestId) return null;

  const status = req?.status || "open";
  const prettyStatus = status.replace("_", " ");
  const helperName =
    req?.acceptedBy?.displayName || req?.acceptedBy?.email || null;

  const showAccept = status === "open" && !isOwner; // backend still enforces but this avoids weird UX
  const showCancel = status === "in_progress" && isHelper;
  const showMarkComplete = status === "in_progress" && isHelper;
  const showConfirm = status === "pending_confirmation" && isOwner;
  const showDeleteWhileOpen = status === "open";

  const canDelete = showDeleteWhileOpen && (isOwner || isAdmin);
  const canReport = !!currentUser && !isOwner;

  const partner = getConversationPartner();
  const canMessage = !!partner && !!partner.email;

  const isBusy = !!busy;

  // ----- Render -----
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
        zIndex: 1000,
      }}
    >
      {/* main dialog card */}
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
          boxShadow: "0 10px 30px rgba(0,0,0,.20)",
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
              <div>
                <b>Location:</b> {req?.location?.address || "—"}
              </div>
              <div>
                <b>Posted by:</b>{" "}
                {req?.createdBy?.displayName ||
                  req?.createdBy?.email ||
                  "—"}
              </div>
              <div>
                <b>Status:</b> {prettyStatus}
                {helperName && (
                  <>
                    {" • "}
                    <span>
                      Helper: <b>{helperName}</b>
                    </span>
                  </>
                )}
              </div>
              {req?.flagged && (
                <div>
                  <b>Flagged:</b>{" "}
                  <span style={{ color: "#b45309", fontWeight: 600 }}>
                    This request has been reported.
                  </span>
                </div>
              )}
            </div>

            <div
              style={{
                marginTop: 16,
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              {/* Accept */}
              {showAccept && (
                <button
                  onClick={handleAccept}
                  disabled={isBusy}
                  style={{
                    background: "#007bff",
                    color: "#fff",
                    border: "none",
                    padding: "8px 14px",
                    borderRadius: 6,
                    cursor: isBusy ? "not-allowed" : "pointer",
                  }}
                >
                  {busy === "accept" ? "Accepting..." : "Accept"}
                </button>
              )}

              {showCancel && (
                <button
                  onClick={handleCancel}
                  disabled={isBusy}
                  style={{
                    background: "#dc3545",
                    color: "#fff",
                    border: "none",
                    padding: "8px 14px",
                    borderRadius: 6,
                    cursor: isBusy ? "wait" : "pointer",
                  }}
                >
                  {busy === "cancel" ? "Cancelling..." : "Cancel"}
                </button>
              )}

              {showMarkComplete && (
                <button
                  onClick={handleMarkComplete}
                  disabled={isBusy}
                  style={{
                    background: "#28a745",
                    color: "#fff",
                    border: "none",
                    padding: "8px 14px",
                    borderRadius: 6,
                    cursor: isBusy ? "wait" : "pointer",
                  }}
                >
                  {busy === "complete" ? "Saving..." : "Mark Complete"}
                </button>
              )}

              {showConfirm && (
                <button
                  onClick={handleConfirmCompletion}
                  disabled={isBusy}
                  style={{
                    background: "#17a2b8",
                    color: "#fff",
                    border: "none",
                    padding: "8px 14px",
                    borderRadius: 6,
                    cursor: isBusy ? "wait" : "pointer",
                  }}
                >
                  {busy === "confirm" ? "Confirming..." : "Confirm Completion"}
                </button>
              )}

              {/* Message: email the other person in this request */}
              <button
                onClick={handleMessage}
                disabled={!canMessage}
                title={
                  canMessage
                    ? `Email your ${
                        partner?.role === "helper" ? "helper" : "neighbor"
                      }`
                    : "Messaging is available once we know who to contact."
                }
                style={{
                  background: "#ffffff",
                  color: canMessage ? "#111" : "#888",
                  border: "1px solid #d0d5dd",
                  padding: "8px 14px",
                  borderRadius: 6,
                  cursor: canMessage ? "pointer" : "not-allowed",
                }}
              >
                Message
              </button>

              {/* Report: only for non-owners */}
              {canReport && (
                <button
                  onClick={handleReport}
                  disabled={isBusy}
                  style={{
                    background: "#6c757d",
                    color: "#fff",
                    border: "none",
                    padding: "8px 14px",
                    borderRadius: 6,
                    cursor: isBusy ? "wait" : "pointer",
                  }}
                >
                  {busy === "report" ? "Reporting..." : "Report"}
                </button>
              )}

              {canDelete && (
                <button
                  onClick={handleDeleteRequest}
                  disabled={isBusy}
                  style={{
                    background: "#b00020",
                    color: "#fff",
                    border: "none",
                    padding: "8px 14px",
                    borderRadius: 6,
                    cursor: isBusy ? "wait" : "pointer",
                    marginLeft: "auto",
                  }}
                >
                  {busy === "delete" ? "Deleting..." : "Delete Request"}
                </button>
              )}

              <button onClick={onClose}>Close</button>
            </div>
          </>
        )}
      </div>

      {/* Feedback popup after completion confirmation */}
      <FeedbackModal
        show={showFeedback}
        onClose={() => setShowFeedback(false)}
        onSubmit={handleFeedbackSubmit}
      />
    </div>
  );
}
