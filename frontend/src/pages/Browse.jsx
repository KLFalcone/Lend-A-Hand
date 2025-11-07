import React from "react";
import { api } from "../lib/api";
import RequestDetailsModal from "../components/RequestDetailsModal";
import './Browse.css';

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

  // Pagination state
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 10;

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
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
  // local attribute filters
  const applyLocalFilters = (baseList) => {
    let result = baseList;

    if (category) {
      result = result.filter(
        (r) => r.category?.toLowerCase() === category.toLowerCase()
      );
    }
    if (urgency) {
      result = result.filter(
        (r) => r.urgency?.toLowerCase() === urgency.toLowerCase()
      );
    }
    if (status) {
      result = result.filter(
        (r) => r.status?.toLowerCase() === status.toLowerCase()
      );
    }

    return result;
  };

  // when distance is selected, fetch from backend using current location
  const fetchWithDistance = () => {
    const miles = Number(distance);
    if (!miles || Number.isNaN(miles)) {
      setFilteredItems(applyLocalFilters(items));
      setCurrentPage(1);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const maxDistanceMeters = Math.round(miles * 1609.34);

          // prefer a nearby endpoint if it exists, otherwise use list with params
          let nearby = null;
          if (typeof api.getNearbyRequests === "function") {
            nearby = await api.getNearbyRequests(latitude, longitude, maxDistanceMeters);
          } else if (typeof api.listRequests === "function") {
            nearby = await api.listRequests({
              lat: latitude,
              lng: longitude,
              maxDistance: maxDistanceMeters,
              status: "open",
            });
          }

          const list = Array.isArray(nearby?.results)
            ? nearby.results
            : Array.isArray(nearby)
            ? nearby
            : [];

          setFilteredItems(applyLocalFilters(list));
          setCurrentPage(1);
        } catch (err) {
          console.error("Nearby search failed:", err);
          setFilteredItems(applyLocalFilters(items));
          setCurrentPage(1);
        }
      },
      (err) => {
        console.warn("Geolocation failed/denied:", err);
        setFilteredItems(applyLocalFilters(items));
        setCurrentPage(1);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  if (distance) {
    fetchWithDistance();
  } else {
    setFilteredItems(applyLocalFilters(items));
    setCurrentPage(1);
  }
}, [category, urgency, status, distance, items]);


  const clearFilters = () => {
    setCategory("");
    setUrgency("");
    setDistance("");
    setStatus("");
  };

  const StatusBadge = ({ status }) => {
    const s = String(status || "open").toLowerCase();
    return <span className={`status-badge status-${s}`}>{s.replace("_", " ")}</span>;
  };

  const updateStatus = (newStatus, requestId) => {
    setItems(prev => prev.map(item =>
      item._id === requestId || item.id === requestId ? { ...item, status: newStatus } : item
    ));
    setFilteredItems(prev => prev.map(item =>
      item._id === requestId || item.id === requestId ? { ...item, status: newStatus } : item
    ));
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = filteredItems.slice(startIndex, startIndex + itemsPerPage);

  if (loading) return <main className="browse-container">Loading…</main>;
  if (error) return <main className="browse-container">{error}</main>;
  if (!items.length) return <main className="browse-container">No requests yet.</main>;

  return (
    <main className="browse-container">
      <h2 className="browse-title">Browse Requests</h2>

      {/* Filters */}
      <div className="filter-bar">
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
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>

        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="pending_confirmation">Pending Confirmation</option>
          <option value="closed">Closed</option>
        </select>

        <select value={distance} onChange={(e) => setDistance(e.target.value)}>
          <option value="">Any Distance</option>
          <option value="5">Within 5 mi</option>
          <option value="10">Within 10 mi</option>
          <option value="25">Within 25 mi</option>
        </select>

        <button onClick={clearFilters}>Clear All</button>
      </div>

      {/* Requests */}
      <ul className="request-list">
        {currentItems.length === 0 ? (
          <div>No requests match your filters.</div>
        ) : (
          currentItems.map(r => {
            const author = r?.createdBy?.displayName?.trim() || r?.createdBy?.email ||
              r?.author?.displayName?.trim() || r?.author?.email || r?.email || "No user info";
            const id = r._id || r.id;

            return (
              <li
                key={id}
                onClick={() => setSelectedId(id)}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setSelectedId(id)}
                role="button"
                tabIndex={0}
                className="request-item"
              >
                <strong>{r.title || "Untitled Request"}</strong>
                <StatusBadge status={r.status} />
                <div className="request-desc">{r.description || "No description provided."}</div>
                <div className="request-author">posted by {author}</div>
              </li>
            );
          })
        )}
      </ul>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => prev - 1)}
          >
            Previous
          </button>
          <span>Page {currentPage} of {totalPages}</span>
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(prev => prev + 1)}
          >
            Next
          </button>
        </div>
      )}

      {selectedId && (
        <RequestDetailsModal
          requestId={selectedId}
          onClose={() => setSelectedId(null)}
          onStatusChange={(newStatus) => updateStatus(newStatus, selectedId)}
        />
      )}
    </main>
  );
}
