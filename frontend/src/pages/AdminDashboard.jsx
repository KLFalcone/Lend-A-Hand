import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import RequestDetailsModal from "../components/RequestDetailsModal.jsx";

function ConfirmModal({ show, title, message, onConfirm, onCancel }) {
  if (!show) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onCancel}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          padding: 24,
          maxWidth: 500,
          width: "90%",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ margin: "0 0 12px" }}>{title}</h3>
        <p style={{ margin: "0 0 20px", color: "#667085" }}>{message}</p>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={onCancel}>Cancel</button>
          <button
            onClick={onConfirm}
            style={{ background: "#dc2626", color: "#fff" }}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [userRoleFilter, setUserRoleFilter] = useState("");

  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [requestStatusFilter, setRequestStatusFilter] = useState("");
  const [flaggedOnly, setFlaggedOnly] = useState(false);

  const [confirmModal, setConfirmModal] = useState({ show: false });

  // default tab -> Requests (instead of Users)
  const [activeTab, setActiveTab] = useState("requests");

  // which request is open in the details modal
  const [selectedRequestId, setSelectedRequestId] = useState(null);

  // ✅ Check auth / role and only allow admins in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await api.me();
        const user = res?.user || res; // support { user } or plain user

        if (!user || user.role !== "admin") {
          navigate("/");
          return;
        }
        setCurrentUser(user);
      } catch {
        navigate("/login");
      }
    };
    checkAuth();
  }, [navigate]);

  // Load users + requests once we know we have an admin
  useEffect(() => {
    if (!currentUser) return;

    const loadData = async () => {
      setLoading(true);
      try {
        const [usersData, requestsData] = await Promise.all([
          api.admin.getAllUsers(),
          api.admin.getAllRequests(),
        ]);

        const allUsers = usersData.users || [];
        const allRequests = requestsData.requests || [];

        setUsers(allUsers);
        setFilteredUsers(allUsers);
        setRequests(allRequests);
        setFilteredRequests(allRequests);
      } catch (err) {
        setError(err.message || "Failed to load admin data.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentUser]);

  // User filter
  useEffect(() => {
    let filtered = [...users];
    if (userRoleFilter) {
      filtered = filtered.filter((u) => u.role === userRoleFilter);
    }
    setFilteredUsers(filtered);
  }, [userRoleFilter, users]);

  // Request filter
  useEffect(() => {
    let filtered = [...requests];
    if (requestStatusFilter) {
      filtered = filtered.filter((r) => r.status === requestStatusFilter);
    }
    if (flaggedOnly) {
      filtered = filtered.filter((r) => r.flagged);
    }
    setFilteredRequests(filtered);
  }, [requestStatusFilter, flaggedOnly, requests]);

  const handleToggleRole = (userId, currentRole) => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    setConfirmModal({
      show: true,
      title: "Change User Role",
      message: `Change this user's role to ${newRole}?`,
      onConfirm: async () => {
        try {
          await api.admin.updateUser(userId, { role: newRole });
          setUsers((prev) =>
            prev.map((u) =>
              u._id === userId ? { ...u, role: newRole } : u
            )
          );
          setConfirmModal({ show: false });
        } catch (err) {
          alert(err.message);
          setConfirmModal({ show: false });
        }
      },
    });
  };

  const handleDeleteUser = (userId, email) => {
    setConfirmModal({
      show: true,
      title: "Delete User",
      message: `Delete ${email}? This will also delete all their requests.`,
      onConfirm: async () => {
        try {
          await api.admin.deleteUser(userId);
          setUsers((prev) => prev.filter((u) => u._id !== userId));
          setConfirmModal({ show: false });
        } catch (err) {
          alert(err.message);
          setConfirmModal({ show: false });
        }
      },
    });
  };

  const handleToggleFlag = async (requestId, currentFlagged) => {
    try {
      await api.admin.updateRequest(requestId, { flagged: !currentFlagged });
      setRequests((prev) =>
        prev.map((r) =>
          r._id === requestId ? { ...r, flagged: !currentFlagged } : r
        )
      );
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteRequest = (requestId, title) => {
    setConfirmModal({
      show: true,
      title: "Delete Request",
      message: `Delete "${title}"?`,
      onConfirm: async () => {
        try {
          await api.admin.deleteRequest(requestId);
          setRequests((prev) => prev.filter((r) => r._id !== requestId));
          setConfirmModal({ show: false });
        } catch (err) {
          alert(err.message);
          setConfirmModal({ show: false });
        }
      },
    });
  };

  // open details modal when admin clicks a title
  const handleOpenRequestDetails = (id) => {
    setSelectedRequestId(id);
  };

  // keep admin data in sync with actions taken in the modal
  const handleRequestStatusChange = (status) => {
    if (!selectedRequestId) return;

    if (status === "deleted") {
      setRequests((prev) => prev.filter((r) => r._id !== selectedRequestId));
      setSelectedRequestId(null);
      return;
    }

    setRequests((prev) =>
      prev.map((r) =>
        r._id === selectedRequestId ? { ...r, status } : r
      )
    );
  };

  if (loading) return <main style={{ padding: 16 }}>Loading...</main>;
  if (error) {
    return (
      <main style={{ padding: 16, color: "#dc2626" }}>
        {error}
      </main>
    );
  }

  const tableStyle = {
    width: "100%",
    borderCollapse: "collapse",
    background: "#fff",
    borderRadius: 8,
    overflow: "hidden",
  };

  const thStyle = {
    background: "#f9fafb",
    padding: "12px 16px",
    textAlign: "left",
    fontWeight: 600,
    borderBottom: "2px solid #e5e7eb",
  };

  const tdStyle = {
    padding: "12px 16px",
    borderBottom: "1px solid #e5e7eb",
  };

  const badge = (text, color) => (
    <span
      style={{
        background: color,
        color: "#fff",
        padding: "4px 8px",
        borderRadius: 4,
        fontSize: 12,
        fontWeight: 600,
      }}
    >
      {text}
    </span>
  );

  return (
    <main style={{ padding: 16, maxWidth: 1200, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 24 }}>Admin Dashboard</h1>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: 16,
          marginBottom: 24,
          borderBottom: "2px solid #e5e7eb",
        }}
      >
        <button
          onClick={() => setActiveTab("users")}
          style={{
            background: "transparent",
            border: "none",
            borderBottom:
              activeTab === "users" ? "2px solid #2563eb" : "none",
            color: activeTab === "users" ? "#2563eb" : "#667085",
            padding: "12px 16px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Users ({users.length})
        </button>
        <button
          onClick={() => setActiveTab("requests")}
          style={{
            background: "transparent",
            border: "none",
            borderBottom:
              activeTab === "requests" ? "2px solid #2563eb" : "none",
            color: activeTab === "requests" ? "#2563eb" : "#667085",
            padding: "12px 16px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Requests ({requests.length})
        </button>
      </div>

      {/* Users tab */}
      {activeTab === "users" && (
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 16,
            }}
          >
            <h2>User Management</h2>
            <select
              value={userRoleFilter}
              onChange={(e) => setUserRoleFilter(e.target.value)}
            >
              <option value="">All Roles</option>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>Email</th>
                <th style={thStyle}>Role</th>
                <th style={thStyle}>Joined</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user._id}>
                  <td style={tdStyle}>{user.displayName || "N/A"}</td>
                  <td style={tdStyle}>{user.email}</td>
                  <td style={tdStyle}>
                    {badge(
                      user.role,
                      user.role === "admin" ? "#dc2626" : "#3b82f6"
                    )}
                  </td>
                  <td style={tdStyle}>
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td style={tdStyle}>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={() =>
                          handleToggleRole(user._id, user.role)
                        }
                        disabled={user._id === currentUser?._id}
                        style={{ fontSize: 14, padding: "4px 12px" }}
                      >
                        {user.role === "admin" ? "Demote" : "Promote"}
                      </button>
                      <button
                        onClick={() =>
                          handleDeleteUser(user._id, user.email)
                        }
                        disabled={user._id === currentUser?._id}
                        style={{
                          fontSize: 14,
                          padding: "4px 12px",
                          background: "#dc2626",
                          color: "#fff",
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Requests tab */}
      {activeTab === "requests" && (
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 16,
              gap: 16,
            }}
          >
            <h2>Request Management</h2>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <select
                value={requestStatusFilter}
                onChange={(e) =>
                  setRequestStatusFilter(e.target.value)
                }
              >
                <option value="">All Statuses</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="pending_confirmation">Pending</option>
                <option value="closed">Closed</option>
              </select>
              <label
                style={{
                  display: "flex",
                  gap: 4,
                  alignItems: "center",
                }}
              >
                <input
                  type="checkbox"
                  checked={flaggedOnly}
                  onChange={(e) => setFlaggedOnly(e.target.checked)}
                />
                Flagged Only
              </label>
            </div>
          </div>

          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Title</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Created By</th>
                <th style={thStyle}>Date</th>
                <th style={thStyle}>Flagged</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map((req) => (
                <tr key={req._id}>
                  <td style={tdStyle}>
                    <button
                      type="button"
                      onClick={() => handleOpenRequestDetails(req._id)}
                      style={{
                        border: "none",
                        background: "none",
                        padding: 0,
                        margin: 0,
                        color: "#2563eb",
                        textDecoration: "underline",
                        cursor: "pointer",
                        font: "inherit",
                      }}
                    >
                      {req.title}
                    </button>
                  </td>
                  <td style={tdStyle}>
                    {badge(req.status.replace("_", " "), "#3b82f6")}
                  </td>
                  <td style={tdStyle}>
                    {req.createdBy?.displayName ||
                      req.createdBy?.email ||
                      "Unknown"}
                  </td>
                  <td style={tdStyle}>
                    {new Date(req.createdAt).toLocaleDateString()}
                  </td>
                  <td style={tdStyle}>
                    {req.flagged
                      ? badge("⚠️ Flagged", "#f59e0b")
                      : "—"}
                  </td>
                  <td style={tdStyle}>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={() =>
                          handleToggleFlag(req._id, req.flagged)
                        }
                        style={{
                          fontSize: 14,
                          padding: "4px 12px",
                          background: req.flagged
                            ? "#4caf50"
                            : "#f59e0b",
                          color: "#fff",
                        }}
                      >
                        {req.flagged ? "Unflag" : "Flag"}
                      </button>
                      <button
                        onClick={() =>
                          handleDeleteRequest(req._id, req.title)
                        }
                        style={{
                          fontSize: 14,
                          padding: "4px 12px",
                          background: "#dc2626",
                          color: "#fff",
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmModal
        show={confirmModal.show}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal({ show: false })}
      />

      {selectedRequestId && (
        <RequestDetailsModal
          requestId={selectedRequestId}
          onClose={() => setSelectedRequestId(null)}
          onStatusChange={handleRequestStatusChange}
        />
      )}
    </main>
  );
}
