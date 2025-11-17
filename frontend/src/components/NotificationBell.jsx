import React, { useEffect, useState, useRef } from "react";
import { api } from "../lib/api";

// By default it hides when there are 0 unread.
export default function NotificationBell({ showWhenEmpty = false }) {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const unreadCount = items.filter((n) => !n.isRead).length;

  async function load() {
    try {
      const data = await api.listNotifications();
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Notifications load failed:", e);
    }
  }

  async function markOne(id) {
    try {
      await api.markNotificationRead(id);
      setItems((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
    } catch (e) {
      console.error("Mark read failed:", e);
    }
  }

  async function markAll() {
    try {
      await api.markAllNotificationsRead();
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (e) {
      console.error("Mark all read failed:", e);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    function onDocClick(e) {
      if (open && ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  // Hide completely if there are no unread and we don't want empty state
  if (unreadCount === 0 && !showWhenEmpty) return null;

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        aria-label="Notifications"
        onClick={() => setOpen((v) => !v)}
        style={{ position: "relative" }}
      >
        {/* bell icon */}
        <span role="img" aria-hidden>
          🔔
        </span>
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: -6,
              right: -6,
              background: "crimson",
              color: "white",
              borderRadius: "999px",
              fontSize: 11,
              padding: "0 6px",
              lineHeight: "16px",
              minWidth: 16,
              textAlign: "center",
            }}
          >
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "120%",
            width: 320,
            maxHeight: 360,
            overflow: "auto",
            background: "#ffffff",          // light background
            color: "#111111",
            border: "1px solid #dddddd",
            borderRadius: 8,
            padding: 8,
            boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 6,
              padding: "4px 4px 6px",
              borderBottom: "1px solid #e0e0e0",
            }}
          >
            <strong style={{ fontSize: 14 }}>Notifications</strong>
            {unreadCount > 0 && (
              <button onClick={markAll} style={{ fontSize: 12 }}>
                Mark all read
              </button>
            )}
          </div>

          {items.length === 0 ? (
            <div style={{ opacity: 0.7, fontSize: 13 }}>
              You’re all caught up.
            </div>
          ) : (
            <ul style={{ margin: 0, padding: 0 }}>
              {items.map((n) => (
                <li
                  key={n._id}
                  style={{
                    listStyle: "none",
                    padding: "8px 8px",
                    borderRadius: 6,
                    background: n.isRead ? "#fafafa" : "#f1f7ff",
                    border: "1px solid #e2e6f0",
                    marginBottom: 6,
                    display: "grid",
                    gap: 4,
                  }}
                >
                  <div style={{ fontSize: 14 }}>{n.message}</div>
                  <div style={{ fontSize: 11, opacity: 0.7 }}>
                    {new Date(n.createdAt).toLocaleString()}
                  </div>
                  {!n.isRead && (
                    <div>
                      <button
                        onClick={() => markOne(n._id)}
                        style={{ fontSize: 12 }}
                      >
                        Mark read
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
