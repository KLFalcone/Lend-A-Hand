import React, { useEffect, useRef, useState } from "react";
import { api } from "../lib/api";

export default function RequestDetailsModal({ requestId, onClose, onStatusChange }) {
  const [req, setReq] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false); // used for Accept / Cancel / Delete etc.
  const [currentUser, setCurrentUser] = useState(null);
  const dialogRef = useRef(null);

  console.log("onStatusChange prop:", onStatusChange);

  // load request details
  useEffect(() => {
    if (!requestId) return;
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        const data = await api.getRequest(requestId);
        if (mounted) setReq(data);
      } catch {
        if (mounted) setErr("Failed to load request details.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [requestId]);

  // load current user (for permissions like delete / report)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const me = await api.me();
        // handle both shapes: { user: {...} } or plain user
        const user = me?.user || me;
        if (mounted) {
          setCurrentUser(user || null);
          console.log("RequestDetailsModal currentUser:", user);
        }
      } catch (e) {
        console.error("api.me() failed in RequestDetailsModal:", e);
        if (mounted) setCurrentUser(null);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // ESC to close
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
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

  // handle Accept button click
  async function handleAccept() {
    if (!requestId) return;
    try {
      setBusy("accept");
      await api.acceptRequest(requestId);
      alert("Request accepted!");
      // update local state so it shows new status
      setReq((prev) => ({ ...prev, status: "in_progress" })); // set to in progress as stated in Issue #30
      onStatusChange("in_progress");
    } catch (e) {
      console.error(e);
      alert("Failed to accept request. You may need to log in.");
    } finally {
      setBusy(false);
    }
  }

  async function handleCancel() {
    if (!requestId) return;
    if (!window.confirm("Cancel your acceptance of this request?")) return;
    try {
      setBusy("cancel");
      await api.cancelAcceptance(requestId);
      alert("Request cancelled.");
      setReq((prev) => ({ ...prev, status: "open" }));
      console.log("setReq complete");
      onStatusChange("open");
    } catch (e) {
      console.error(e);
      alert("Failed to cancel request.");
    } finally {
      setBusy(false);
    }
  }

  async function handleMarkComplete() {
    if (!requestId) return;
    try {
      setBusy(true);
      await api.markComplete(requestId);
      alert("Marked as complete! Awaiting requester confirmation.");
      setReq((prev) => ({ ...prev, status: "pending_confirmation" }));
      onStatusChange("pending_confirmation");
    } catch (e) {
      console.error(e);
      alert("Failed to mark complete. You may not be authorized.");
    } finally {
      setBusy(false);
    }
  }

  async function handleConfirmCompletion() {
    if (!requestId) return;
    try {
      setBusy(true);
      await api.confirmCompletion(requestId);
      alert("Request confirmed and closed!");
      setReq((prev) => ({ ...prev, status: "closed" }));
      onStatusChange("closed");
    } catch (e) {
      console.error(e);
      alert("Failed to confirm completion.");
    } finally {
      setBusy(false);
    }
  }

  // delete / cancel request entirely
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
      onStatusChange?.("deleted"); // parent can refresh list
      onClose?.();
    } catch (e) {
      console.error(e);
      alert("Failed to delete request.");
    } finally {
      setBusy(false);
    }
  }

  // report / flag the request for admins
  async function handleReport() {
    if (!requestId) return;
    const confirmed = window.confirm(
      "Report this request to the admins as inappropriate or concerning?"
    );
    if (!confirmed) return;

    try {
      setBusy("report");
      await api.reportRequest(requestId); // new helper in api.js
      alert("Thanks, your report has been sent to the admins.");
      setReq((prev) => ({ ...prev, flagged: true }));
    } catch (e) {
      console.error(e);
      alert("Failed to report request. You may need to log in.");
    } finally {
      setBusy(false);
    }
  }

  if (!requestId) return null;

  const status = req?.status || "open";

  // dynamic button visibility
  const showAccept = status === "open";
  const showCancel = status === "in_progress";
  const showMarkComplete = status === "in_progress";
  const showConfirm = status === "pending_confirmation";
  const showDeleteWhileOpen = status === "open"; // only deletable while open

  // permission check for delete: admin OR owner
  const isOwner =
    currentUser &&
    req &&
    currentUser._id === (req.createdBy?._id || req.createdBy);
  const isAdmin = currentUser && currentUser.role === "admin";
  const canDelete = showDeleteWhileOpen && (isOwner || isAdmin);

  // permission for report: must be logged in and NOT the owner
  const canReport = !!currentUser && !isOwner;

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
                {req?.createdBy?.displayName || req?.createdBy?.email || "—"}
              </div>
              <div>
                <b>Status:</b> {req?.status || "open"}
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
              <button
                onClick={handleAccept}
                disabled={busy || !showAccept}
                style={{
                  background: "#007bff",
                  color: "#fff",
                  border: "none",
                  padding: "8px 14px",
                  borderRadius: 6,
                  cursor: busy ? "wait" : "pointer",
                }}
              >
                {busy === "accept"
                  ? "Accepting..."
                  : req?.status === "open"
                  ? "Accept"
                  : "Accepted"}
              </button>

              {showCancel && (
                <button
                  onClick={handleCancel}
                  disabled={busy}
                  style={{
                    background: "#dc3545",
                    color: "#fff",
                    border: "none",
                    padding: "8px 14px",
                    borderRadius: 6,
                    cursor: busy ? "wait" : "pointer",
                  }}
                >
                  {busy === "cancel" ? "Cancelling..." : "Cancel"}
                </button>
              )}

              {showMarkComplete && (
                <button
                  onClick={handleMarkComplete}
                  disabled={busy}
                  style={{
                    background: "#28a745",
                    color: "#fff",
                    border: "none",
                    padding: "8px 14px",
                    borderRadius: 6,
                    cursor: busy ? "wait" : "pointer",
                  }}
                >
                  Mark Complete
                </button>
              )}

              {showConfirm && (
                <button
                  onClick={handleConfirmCompletion}
                  disabled={busy}
                  style={{
                    background: "#17a2b8",
                    color: "#fff",
                    border: "none",
                    padding: "8px 14px",
                    borderRadius: 6,
                    cursor: busy ? "wait" : "pointer",
                  }}
                >
                  Confirm Completion
                </button>
              )}

              {canDelete && (
                <button
                  onClick={handleDeleteRequest}
                  disabled={busy}
                  style={{
                    background: "#b00020",
                    color: "#fff",
                    border: "none",
                    padding: "8px 14px",
                    borderRadius: 6,
                    cursor: busy ? "wait" : "pointer",
                    marginLeft: "auto",
                  }}
                >
                  {busy === "delete" ? "Deleting..." : "Delete Request"}
                </button>
              )}

              {/* Message still a placeholder */}
              <button disabled title="Coming soon">
                Message
              </button>

              {/* Report: only for non-owners */}
              {canReport && (
                <button
                  onClick={handleReport}
                  disabled={busy}
                  style={{
                    background: "#6c757d",
                    color: "#fff",
                    border: "none",
                    padding: "8px 14px",
                    borderRadius: 6,
                    cursor: busy ? "wait" : "pointer",
                  }}
                >
                  {busy === "report" ? "Reporting..." : "Report"}
                </button>
              )}

              <button onClick={onClose}>Close</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
