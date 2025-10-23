import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";

export default function Profile() {
  const navigate = useNavigate();

  // profile editor state
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // activity state
  const [overview, setOverview] = useState(null);
  const [overviewErr, setOverviewErr] = useState("");

  // load profile
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { user } = await api.getProfile(); // /api/v1/users/me
        if (!mounted) return;
        if (!user) {
          navigate("/login");
          return;
        }
        setProfile({
          email: user.email || "",
          displayName: user.displayName || "",
          address: user.address || "",
          phone: user.phone || "",
          availability: user.availability || "",
          profilePic: user.profilePic || "",
        });
      } catch (err) {
        setMessage(`❌ ${err.message || "Could not load profile."}`);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [navigate]);

  // load activity overview
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const json = await api.meOverview(); // /api/v1/me/overview
        if (alive) setOverview(json);
      } catch (e) {
        if (alive) setOverviewErr(e.message || "Failed to load your requests.");
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((p) => ({ ...p, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setSaving(true);
    try {
      const payload = {
        displayName: profile.displayName.trim(),
        address: profile.address.trim(),
        phone: profile.phone.trim(),
        availability: profile.availability.trim(),
        profilePic: profile.profilePic.trim(),
      };
      const { user } = await api.updateMe(payload); // PATCH /api/v1/users/me
      setProfile((p) => ({
        ...p,
        email: user.email || p.email,
        displayName: user.displayName || "",
        address: user.address || "",
        phone: user.phone || "",
        availability: user.availability || "",
        profilePic: user.profilePic || "",
      }));
      setMessage("✅ Profile updated successfully!");
      setEditing(false);
      localStorage.setItem("displayName", user.displayName || "");
    } catch (err) {
      setMessage(`❌ ${err.message || "Update failed."}`);
    } finally {
      setSaving(false);
    }
  };

    const handleDeleteAccount = async () => {
        setDeleting(true);
        try {
            await api.deleteMe(); // DELETE /api/v1/users/me
            // Clear any stored auth data
            localStorage.removeItem('token');
            localStorage.removeItem('displayName');
            // Redirect to homepage with success message
            navigate('/', { state: { message: 'Account deleted successfully' } });
        } catch (err) {
            setMessage(`${err.message || 'Failed to delete account.'}`);
            setShowDeleteModal(false);
        } finally {
            setDeleting(false);
        }
    };


    if (loading) return <p style={{ padding: 16 }}>Loading profile...</p>;
  if (!profile) return <p style={{ padding: 16 }}>No profile data found.</p>;

  // tiny UI helpers
  const Card = ({ children }) => (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        background: "#fff",
        padding: 16,
      }}
    >
      {children}
    </div>
  );

  const Stat = ({ num, label }) => (
    <Card>
      <div style={{ fontSize: 20, fontWeight: 700 }}>{num}</div>
      <div style={{ color: "#667085", fontSize: 14 }}>{label}</div>
    </Card>
  );

  const Badge = ({ status }) => {
    const s = String(status || "open").toLowerCase();
    const styles = {
      base: {
        fontSize: 12,
        borderRadius: 999,
        padding: "4px 8px",
        border: "1px solid #e5e7eb",
        textTransform: "capitalize",
      },
      open: { background: "#f0f9ff", color: "#0369a1", borderColor: "#bae6fd" },
      accepted: {
        background: "#fef9c3",
        color: "#a16207",
        borderColor: "#fde68a",
      },
      in_progress: {
        background: "#ecfccb",
        color: "#3f6212",
        borderColor: "#d9f99d",
      },
      completed: {
        background: "#dcfce7",
        color: "#166534",
        borderColor: "#bbf7d0",
      },
      closed: {
        background: "#fee2e2",
        color: "#991b1b",
        borderColor: "#fecaca",
      },
    };
    const style = { ...styles.base, ...(styles[s] || {}) };
    return <span style={style}>{s.replace("_", " ")}</span>;
  };
    // Delete modal
    const DeleteConfirmModal = () => {
        if (!showDeleteModal) return null;

        return (
            <div
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                }}
                onClick={() => setShowDeleteModal(false)}
            >
                <div
                    style={{
                        background: '#fff',
                        borderRadius: 12,
                        padding: 24,
                        maxWidth: 400,
                        width: '90%',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <h3 style={{ margin: '0 0 12px', color: '#dc2626' }}>
                        Delete Account?
                    </h3>
                    <p style={{ margin: '0 0 20px', color: '#667085' }}>
                        This action cannot be undone. This will permanently delete your account
                        and remove all your requests from our servers.
                    </p>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <button
                            type="button"
                            onClick={() => setShowDeleteModal(false)}
                            disabled={deleting}
                            style={{
                                background: '#fff',
                                color: '#344054',
                                border: '1px solid #d0d5dd',
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleDeleteAccount}
                            disabled={deleting}
                            style={{
                                background: '#dc2626',
                                color: '#fff',
                                border: 'none',
                            }}
                        >
                            {deleting ? 'Deleting…' : 'Delete Account'}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

  return (
    <main style={{ padding: 16, maxWidth: 960, margin: "0 auto" }}>
      <h2 style={{ margin: "6px 0 12px" }}>My Profile</h2>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 16 }}>
        {/* left: profile editor */}
        <Card>
          {!editing ? (
            <div style={{ maxWidth: 520 }}>
              <p>
                <strong>Name:</strong> {profile.displayName || profile.email}
              </p>
              <p>
                <strong>Email:</strong> {profile.email}
              </p>
              <p>
                <strong>Address:</strong> {profile.address || "—"}
              </p>
              <p>
                <strong>Phone:</strong> {profile.phone || "—"}
              </p>
              <p>
                <strong>Availability:</strong> {profile.availability || "—"}
              </p>
              {profile.profilePic && (
                <p>
                  <img
                    src={profile.profilePic}
                    alt="Profile"
                    style={{
                      width: 100,
                      height: 100,
                      borderRadius: "50%",
                      objectFit: "cover",
                    }}
                  />
                </p>
              )}
              <button onClick={() => setEditing(true)}>Edit Profile</button>
                <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid #e5e7eb' }}>
                    <p style={{ fontSize: 14, color: '#667085', marginBottom: 8 }}>
                        Danger Zone
                    </p>
                    <button
                        onClick={() => setShowDeleteModal(true)}
                        style={{
                            background: '#fff',
                            color: '#dc2626',
                            border: '1px solid #dc2626',
                        }}
                    >
                        Delete Account
                    </button>
                </div>
              {message && <p style={{ marginTop: 8 }}>{message}</p>}
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              style={{ maxWidth: 520, display: "grid", gap: 10 }}
            >
              <div>
                <label>Name (display name):</label>
                <input
                  name="displayName"
                  value={profile.displayName}
                  onChange={handleChange}
                  placeholder="Your name as shown to others"
                />
              </div>
              <div>
                <label>Address:</label>
                <input
                  name="address"
                  value={profile.address}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label>Phone:</label>
                <input name="phone" value={profile.phone} onChange={handleChange} />
              </div>
              <div>
                <label>Availability:</label>
                <input
                  name="availability"
                  value={profile.availability}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label>Profile Picture URL:</label>
                <input
                  name="profilePic"
                  value={profile.profilePic}
                  onChange={handleChange}
                />
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <button type="submit" disabled={saving}>
                  {saving ? "Saving…" : "Save Changes"}
                </button>
                <button type="button" onClick={() => setEditing(false)}>
                  Cancel
                </button>
              </div>

              {message && <p style={{ marginTop: 8 }}>{message}</p>}
            </form>
          )}
        </Card>

        {/* right: activity */}
        <div style={{ display: "grid", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            <Stat num={overview?.created?.length ?? 0} label="Requests I created" />
            <Stat num={overview?.counts?.createdOpen ?? 0} label="Open / active" />
            <Stat num={overview?.accepted?.length ?? 0} label="I’m helping with" />
          </div>

          <Card>
            <h3 style={{ margin: "0 0 10px" }}>My requests</h3>
            {overviewErr && <p style={{ color: "#b42318" }}>{overviewErr}</p>}
            {!overview ? (
              <p>Loading…</p>
            ) : overview.created?.length === 0 ? (
              <p style={{ color: "#667085" }}>You haven’t posted anything yet.</p>
            ) : (
              <ul style={{ display: "grid", gap: 8, paddingLeft: 16 }}>
                {overview.created.map((r) => (
                  <li key={r._id} style={{ display: "grid", gap: 4 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Link to={`/browse/posts/${r._id}`} style={{ fontWeight: 600 }}>
                        {r.title || "Untitled Request"}
                      </Link>
                      <Badge status={r.status} />
                    </div>
                    <span style={{ color: "#667085", fontSize: 12 }}>
                      Created {new Date(r.createdAt).toLocaleDateString()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <h3 style={{ margin: "0 0 10px" }}>Requests I’m helping with</h3>
            {!overview ? (
              <p>Loading…</p>
            ) : overview.accepted?.length === 0 ? (
              <p style={{ color: "#667085" }}>You haven’t accepted any requests yet.</p>
            ) : (
              <ul style={{ display: "grid", gap: 8, paddingLeft: 16 }}>
                {overview.accepted.map((r) => (
                  <li key={r._id} style={{ display: "grid", gap: 4 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Link to={`/browse/posts/${r._id}`} style={{ fontWeight: 600 }}>
                        {r.title || "Untitled Request"}
                      </Link>
                      <Badge status={r.status} />
                    </div>
                    <span style={{ color: "#667085", fontSize: 12 }}>
                      Joined {new Date(r.createdAt).toLocaleDateString()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
        <DeleteConfirmModal />
    </main>
  );
}
