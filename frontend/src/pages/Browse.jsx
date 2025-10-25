import React from "react";
import { api } from "../lib/api";
import RequestDetailsModal from "../components/RequestDetailsModal";

export default function Browse() {
  const [items, setItems] = React.useState([]);
  const [filteredItems, setFilteredItems] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [selectedId, setSelectedId] = React.useState(null);
  const [currentUser, setCurrentUser] = React.useState(null);

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
    return () => {
      mounted = false;
    };
  }, []);

  React.useEffect(() => {
    let filtered = [...items];
    if (category) filtered = filtered.filter((r) => r.category === category);
    if (urgency) filtered = filtered.filter((r) => r.urgency === urgency);
    if (distance) filtered = filtered.filter((r) => r.distance <= Number(distance));
    if (status) filtered = filtered.filter((r) => r.status === status);
    setFilteredItems(filtered);
  }, [category, urgency, distance, status, items]);

  const openDetails = (id) => setSelectedId(id);
  const closeDetails = () => setSelectedId(null);

  if (loading) return <p>Loading requests...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div className="browse">
      <h1>Browse Requests</h1>

      <div className="filters">
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All Categories</option>
          <option value="Errand">Errand</option>
          <option value="Yardwork">Yardwork</option>
          <option value="Pet Care">Pet Care</option>
          <option value="Tutoring">Tutoring</option>
          <option value="Household">Household</option>
          <option value="Other">Other</option>
        </select>

        <select value={urgency} onChange={(e) => setUrgency(e.target.value)}>
          <option value="">All Urgencies</option>
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
        </select>

        <select value={distance} onChange={(e) => setDistance(e.target.value)}>
          <option value="">Any Distance</option>
          <option value="1">≤ 1 mile</option>
          <option value="5">≤ 5 miles</option>
          <option value="10">≤ 10 miles</option>
        </select>

        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="Open">Open</option>
          <option value="Accepted">Accepted</option>
          <option value="Pending Confirmation">Pending Confirmation</option>
          <option value="Closed">Closed</option>
        </select>
      </div>

      <div className="request-list">
        {filteredItems.length === 0 ? (
          <p>No requests found.</p>
        ) : (
          <ul>
            {filteredItems.map((r) => (
              <li key={r._id} onClick={() => openDetails(r._id)}>
                <h3>{r.title}</h3>
                <p>{r.category}</p>
                <p>Urgency: {r.urgency}</p>
                <p>Status: {r.status}</p>
              </li>
            ))}
          </ul>
        )}
      </div>

      {selectedId && (
        <RequestDetailsModal
          requestId={selectedId}
          onClose={closeDetails}
          currentUser={currentUser}
        />
      )}
    </div>
  );
}
