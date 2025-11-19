// frontend/src/pages/Browse.jsx
import React, { useEffect, useState } from "react";
import { api } from "../lib/api";
import RequestDetailsModal from "../components/RequestDetailsModal";
import "./Browse.css";
import "bootstrap/dist/css/bootstrap.min.css";

// helper: miles -> meters (Mongo $near expects meters)
const milesToMeters = (miles) => miles * 1609.34;

// Distance options for the dropdown
const DISTANCE_OPTIONS = [
  { label: "Any Distance", value: "" },
  { label: "Within 5 mi", value: "5" },
  { label: "Within 10 mi", value: "10" },
  { label: "Within 25 mi", value: "25" },
  { label: "Within 50 mi", value: "50" },
];

// Simple list of states for the filter (you can tweak order if you want)
const STATES = [
  "",
  "California",
  "Virginia",
  "Maryland",
  "District of Columbia",
  "Ohio",
  "Pennsylvania",
  "West Virginia",
  "Kentucky",
  "Indiana",
  "Michigan",
  "New York",
  "Texas",
  "Florida",
  "Illinois",
  "Arizona",
  "Colorado",
  "Washington",
  "Oregon",
  "Nevada",
];

// Bootstrap badge version
const StatusBadge = ({ status }) => {
  const s = String(status || "open").toLowerCase();
  const colorMap = {
    open: "primary",
    in_progress: "success",
    pending_confirmation: "warning",
    closed: "danger",
  };
  return (
    <span className={`badge bg-${colorMap[s] || "secondary"} text-capitalize`}>
      {s.replace("_", " ")}
    </span>
  );
};

export default function Browse() {
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedId, setSelectedId] = useState(null);
  const [, setCurrentUser] = useState(null);

  // filters
  const [category, setCategory] = useState("");
  const [urgency, setUrgency] = useState("");
  const [distance, setDistance] = useState("");
  const [status, setStatus] = useState("");
  const [stateFilter, setStateFilter] = useState("");

  // pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  // user location for distance filter
  const [coords, setCoords] = useState(null);
  const [locationError, setLocationError] = useState("");

  // grab browser location once (best-effort)
  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setLocationError("Location not available in this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setLocationError("");
      },
      (err) => {
        console.warn("Geolocation error:", err?.message);
        setLocationError(
          "Allow location in your browser to filter by distance (optional)."
        );
      }
    );
  }, []);

  // fetch requests whenever filters or coords change
  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      setError("");

      try {
        const params = {};

        if (status) params.status = status;
        if (category) params.category = category;
        if (urgency) params.urgency = urgency;
        if (stateFilter) params.state = stateFilter;

        // only attach geo filters if user picked a distance AND we have coords
        if (distance && coords) {
          params.lat = coords.lat;
          params.lng = coords.lng;
          params.maxDistance = milesToMeters(Number(distance));
        }

        const [reqs, user] = await Promise.all([
          api.listRequests ? api.listRequests(params) : [],
          api.getCurrentUser?.().catch(() => null),
        ]);

        if (!mounted) return;

        const valid = Array.isArray(reqs) ? reqs : [];
        setItems(valid);
        setFilteredItems(valid);
        setCurrentUser(user || null);
        setCurrentPage(1);
      } catch (e) {
        console.error("Browse fetch failed:", e);
        if (mounted) setError(e.message || "Couldn’t load requests.");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [category, urgency, status, distance, coords, stateFilter]);

  const clearFilters = () => {
    setCategory("");
    setUrgency("");
    setDistance("");
    setStatus("");
    setStateFilter("");
  };

  // distance change handler: if user picks a distance but we have no coords,
  // show a friendly message and keep distance as "Any"
  const handleDistanceChange = (e) => {
    const value = e.target.value;

    if (value && !coords) {
      alert(
        "To filter by distance, please allow location access in your browser (look for the location icon near the URL bar) and then try again."
      );
      setDistance("");
      return;
    }

    setDistance(value);
  };

  const updateStatus = (newStatus, requestId) => {
    setItems((prev) =>
      prev.map((item) =>
        item._id === requestId || item.id === requestId
          ? { ...item, status: newStatus }
          : item
      )
    );
    setFilteredItems((prev) =>
      prev.map((item) =>
        item._id === requestId || item.id === requestId
          ? { ...item, status: newStatus }
          : item
      )
    );
  };

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = filteredItems.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  if (loading)
    return <main className="browse-container">Loading…</main>;
  if (error)
    return <main className="browse-container">{error}</main>;
  if (!items.length)
    return <main className="browse-container">No requests yet.</main>;

  return (
    <main className="browse-container">
      <h2 className="browse-title text-center mb-4">Browse Requests</h2>

      {/* Filters */}
      <div className="filter-bar mb-2 d-flex flex-wrap justify-content-center gap-2">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="form-select w-auto"
        >
          <option value="">All Categories</option>
          <option value="Errand">Errand</option>
          <option value="Yardwork">Yardwork</option>
          <option value="Pet Care">Pet Care</option>
          <option value="Tutoring">Tutoring</option>
          <option value="Household">Household</option>
          <option value="Other">Other</option>
        </select>

        <select
          value={urgency}
          onChange={(e) => setUrgency(e.target.value)}
          className="form-select w-auto"
        >
          <option value="">All Urgencies</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="form-select w-auto"
        >
          <option value="">All Statuses</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="pending_confirmation">
            Pending Confirmation
          </option>
          <option value="closed">Closed</option>
        </select>

        {/* State filter */}
        <select
          value={stateFilter}
          onChange={(e) => setStateFilter(e.target.value)}
          className="form-select w-auto"
        >
          {STATES.map((s) => (
            <option key={s || "ALL"} value={s}>
              {s || "All States"}
            </option>
          ))}
        </select>

        <select
          value={distance}
          onChange={handleDistanceChange}
          className="form-select w-auto"
        >
          {DISTANCE_OPTIONS.map((opt) => (
            <option key={opt.label} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <button
          className="btn btn-outline-secondary clear-bttn"
          onClick={clearFilters}
          type="button"
        >
          Clear All
        </button>
      </div>

      {locationError && (
        <p
          style={{
            textAlign: "center",
            fontSize: 12,
            color: "#6b7280",
            marginBottom: 8,
          }}
        >
          {locationError}
        </p>
      )}

      {/* Requests */}
      <div className="row g-3">
        {currentItems.length === 0 ? (
          <div>No requests match your filters.</div>
        ) : (
          currentItems.map((r) => {
            // 1) Figure out the "neighbor" name, even for seed data
            let author =
              r?.createdBy?.displayName?.trim() ||
              r?.createdBy?.email ||
              r?.author?.displayName?.trim() ||
              r?.author?.email ||
              r?.email ||
              "";

            if (!author || author === "Unknown user") {
              const addr = r?.location?.address || "";
              if (addr) {
                const parts = addr.split(",").map((p) => p.trim());
                const city = parts[0] || "";
                const state = parts[1] || "";
                if (city && state) {
                  author = `Neighbor in ${city}, ${state}`;
                } else if (state) {
                  author = `Neighbor in ${state}`;
                } else if (city) {
                  author = `Neighbor in ${city}`;
                } else {
                  author = "Local neighbor";
                }
              } else {
                author = "Local neighbor";
              }
            }

            // 2) Dates
            const createdDate = r?.createdAt
              ? new Date(r.createdAt).toLocaleDateString()
              : null;

            const completedDate =
              r?.status === "closed" && r?.completedAt
                ? new Date(r.completedAt).toLocaleDateString()
                : null;

            const id = r._id || r.id;

            return (
              <div className="col-md-6 col-lg-4" key={id}>
                <div
                  className="card shadow-sm h-100 hover-card"
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedId(id)}
                  onKeyDown={(e) =>
                    (e.key === "Enter" || e.key === " ") &&
                    setSelectedId(id)
                  }
                >
                  <div className="card-body">
                    <h5 className="card-title d-flex justify-content-between align-items-center">
                      {r.title || "Untitled Request"}
                      <StatusBadge status={r.status} />
                    </h5>
                    <p className="card-text text-muted mb-2">
                      {r.description || "No description provided."}
                    </p>
                    <p className="card-text small text-secondary mb-0">
                      <i>
                        Posted by {author}
                        {createdDate && ` on ${createdDate}`}
                        {completedDate && ` • Completed ${completedDate}`}
                      </i>
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination d-flex justify-content-center align-items-center gap-3 mt-4">
          <button
            className="btn-outline-primary"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((prev) => prev - 1)}
          >
            Previous
          </button>
          <span className="fw-semibold">
            Page {currentPage} of {totalPages}
          </span>
          <button
            className="btn-outline-primary"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((prev) => prev + 1)}
          >
            Next
          </button>
        </div>
      )}

      {selectedId && (
        <RequestDetailsModal
          requestId={selectedId}
          onClose={() => setSelectedId(null)}
          onStatusChange={(newStatus) =>
            updateStatus(newStatus, selectedId)
          }
        />
      )}
    </main>
  );
}
