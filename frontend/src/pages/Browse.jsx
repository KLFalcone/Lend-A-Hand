import React from "react";
import { api } from "../lib/api";
import RequestDetailsModal from "../components/RequestDetailsModal";

export default function Browse() {
  const [items, setItems] = React.useState([]);
  const [filteredItems, setFilteredItems] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [selectedId, setSelectedId] = React.useState(null);
  const [, setCurrentUser] = React.useState(null);

  const [category, setCategory] = React.useState("");
  const [urgency, setUrgency] = React.useState("");
  const [distance, setDistance] = React.useState("");
  const [status, setStatus] = React.useState("");

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        // Fetch both requests and current user info
        const [reqs, user] = await Promise.all([
          api.listRequests?.(),
          api.getCurrentUser?.().catch(() => null),
        ]);
        if (mounted) {
          const valid = Array.isArray(reqs) ? reqs : [];
          setItems(valid);
          setFilteredItems(valid);
          setCurrentUser(user || null);
        }
      } catch (e) {
        console.error("Browse fetch failed:", e);
        if (mounted) setError("Couldn’t load requests.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  React.useEffect(() => {
    let result = items;

    if (category) {
      result = result.filter((r) => r.category?.toLowerCase() === category.toLowerCase());
    }

    if (urgency) {
      result = result.filter((r) => r.urgency?.toLowerCase() === urgency.toLowerCase());
    }

      if (status) {
          result = result.filter((r) => r.status?.toLowerCase() === status.toLowerCase());
      }

    // TODO: implement the API for the distance filter to work
    if (distance) {
      const d = Number(distance);
      result = result.filter((r) => r.distance <= d);
    }

    setFilteredItems(result);
  }, [category, urgency, status, distance, items]);

  const clearFilters = () => {
    setCategory("");
    setUrgency("");
    setDistance("");
    setStatus("");
  };

    const StatusBadge = ({ status }) => {
        const s = String(status || "open").toLowerCase();
        const styles = {
            base: {
                fontSize: 12,
                borderRadius: 999,
                padding: "4px 10px",
                fontWeight: 500,
                display: "inline-block",
                textTransform: "capitalize",
            },
            open: {
                background: "#dbeafe",
                color: "#1e40af"
            },
            in_progress: {
                background: "#d1fae5",
                color: "#065f46"
            },
            pending_confirmation: {
                background: "#fef3c7",
                color: "#92400e"
            },
            closed: {
                background: "#fee2e2",
                color: "#991b1b"
            },
        };
        const style = { ...styles.base, ...(styles[s] || styles.open) };
        return <span style={style}>{s.replace("_", " ")}</span>;
    };

  if (loading) return <main style={{ padding: 16 }}>Loading…</main>;
  if (error)   return <main style={{ padding: 16 }}>{error}</main>;
  if (!items.length) return <main style={{ padding: 16 }}>No requests yet.</main>;

  const updateStatus = (newStatus, requestId) => {
  setItems((prevItems) =>
    prevItems.map((item) =>
      item._id === requestId || item.id === requestId
        ? { ...item, status: newStatus }
        : item
    )
  );

  setFilteredItems((prevItems) =>
    prevItems.map((item) =>
      item._id === requestId || item.id === requestId
        ? { ...item, status: newStatus }
        : item
    )
  );
};

  return (
    <main style={{ padding: 16 }}>
      <h2>Browse Requests</h2>

      {/* Filter Controls */}
      <div
        style={{
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          marginBottom: 16,
          alignItems: "center",
        }}
      >
        {/* Category Filter */}
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={{ padding: "6px 8px" }}
        >
          <option value="">All Categories</option>
          <option value="Errand">Errand</option>
          <option value="Yardwork">Yardwork</option>
          <option value="Pet Care">Pet Care</option>
          <option value="Tutoring">Tutoring</option>
          <option value="Household">Household</option>
          <option value="Other">Other</option>
        </select>

        {/* Urgency Filter */}
        <select
          value={urgency}
          onChange={(e) => setUrgency(e.target.value)}
          style={{ padding: "6px 8px" }}
        >
          <option value="">All Urgencies</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>

          {/* Status Filter */}
          <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              style={{ padding: "6px 8px" }}
          >
              <option value="">All Statuses</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="pending_confirmation">Pending Confirmation</option>
              <option value="closed">Closed</option>
          </select>

        {/* Distance Filter */}
        <select
          value={distance}
          onChange={(e) => setDistance(e.target.value)}
          style={{ padding: "6px 8px" }}
        >
          <option value="">Any Distance</option>
          <option value="5">Within 5 mi</option>
          <option value="10">Within 10 mi</option>
          <option value="25">Within 25 mi</option>
        </select>

        <button onClick={clearFilters} style={{ padding: "6px 12px" }}>
          Clear All
        </button>
      </div>

      {/* Request List */}
      <ul style={{ display: "grid", gap: 12, padding: 0 }}>
        {filteredItems.length === 0 ? (
          <div>No requests match your filters.</div>
        ) : (
          filteredItems.map((r) => {
            const author =
              r?.createdBy?.displayName?.trim() ||
              r?.createdBy?.email ||
              r?.author?.displayName?.trim() ||
              r?.author?.email ||
              r?.email ||
              "No user info";

            const id = r._id || r.id;

            return (
              <li
                key={id}
                onClick={() => setSelectedId(id)}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setSelectedId(id)}
                role="button"
                tabIndex={0}
                style={{
                  listStyle: "none",
                  border: "1px solid #333",
                  borderRadius: 8,
                  padding: 12,
                  cursor: "pointer",
                }}
              >
                <strong>{r.title || "Untitled Request"}</strong>
                  <StatusBadge status={r.status} />
                <div style={{ opacity: 0.8 }}>
                  {r.description || "No description provided."}
                </div>
                <div style={{ fontSize: 12, opacity: 0.6 }}>posted by {author}</div>
              </li>
            );
          })
        )}
      </ul>

      {selectedId && (
        <RequestDetailsModal 
        requestId={selectedId} 
        onClose={() => setSelectedId(null)} 
        onStatusChange={(newStatus) => updateStatus(newStatus, selectedId)}/>
      )}
    </main>
  );
}