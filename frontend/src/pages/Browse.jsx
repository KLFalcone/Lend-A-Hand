import React from "react";
import { api } from "../lib/api";
import RequestDetailsModal from "../components/RequestDetailsModal";

export default function Browse() {
  const [items, setItems] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [selectedId, setSelectedId] = React.useState(null);

  React.useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        const data = await api.listRequests?.(); // GET /api/v1/requests
        if (mounted) setItems(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("Browse fetch failed:", e);
        if (mounted) setError("Couldn’t load requests (API not ready yet).");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) return <main style={{ padding: 16 }}>Loading…</main>;
  if (error) return <main style={{ padding: 16 }}>{error}</main>;
  if (!items.length) return <main style={{ padding: 16 }}>No requests yet.</main>;

  return (
    <main style={{ padding: 16 }}>
      <h2>Browse Requests</h2>

      <ul style={{ display: "grid", gap: 12, padding: 0 }}>
        {items.map((r) => (
          <li key={r.id || r._id} style={{ listStyle: "none", border: "1px solid #333", borderRadius: 8, padding: 12 }}>
            <strong>{r.title || "Untitled Request"}</strong>
            <div style={{ opacity: 0.8 }}>{r.description || "No description provided."}</div>
            <div style={{ fontSize: 12, opacity: 0.6 }}>
              posted by {r.author || "anonymous"}
            </div>
          </li>
        ))}
      </ul>

      {selectedId && (
        <RequestDetailsModal
          requestId={selectedId}
          onClose={() => setSelectedId(null)}
        />
      )}
    </main>
  );
}
