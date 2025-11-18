import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import AvatarPicker from "../components/AvatarPicker";
import RequestDetailsModal from "../components/RequestDetailsModal";

export default function Profile() {
  const navigate = useNavigate();

  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // one–time address/onboarding prompt (per session)
  const [addressPromptActive, setAddressPromptActive] = useState(false);

  // geolocation for address
  const [locating, setLocating] = useState(false);

  const [profile, setProfile] = useState({
    email: "",
    displayName: "",
    address: "",
    profilePic: "",
  });

  // overview of created / accepted requests
  const [overview, setOverview] = useState(null);
  const [overviewErr, setOverviewErr] = useState("");

  // request details modal
  const [selectedId, setSelectedId] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);

  // refs
  const addressInputRef = useRef(null);
  const displayNameInputRef = useRef(null);

  // load profile
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const { user } = await api.getProfile();
        if (!mounted) return;

        if (!user) {
          navigate("/login");
          return;
        }

        const cleanProfile = {
          email: user.email || "",
          displayName: user.displayName || "",
          address: user.address || "",
          profilePic: user.profilePic || "",
        };

        setProfile(cleanProfile);

        const noAddress =
          !cleanProfile.address || !cleanProfile.address.trim();

        // reset old dismissed flag; we always want to prompt if they have no address
        localStorage.removeItem("nh_address_prompt_dismissed");

        if (noAddress) {
          setEditing(true);
          setAddressPromptActive(true);
          setMessage(
            "Please add your full address so we can show nearby requests."
          );
        }
      } catch (err) {
        setMessage(`${err.message || "Could not load profile."}`);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  // helper to load activity overview (so we can reuse it after modal changes)
  const fetchOverview = async () => {
    try {
      const json = await api.meOverview();
      setOverview(json);
      setOverviewErr("");
    } catch (e) {
      setOverviewErr(e.message || "Failed to load your requests.");
    }
  };

  // initial overview load
  useEffect(() => {
    fetchOverview();
  }, []);

  // keep cursor at the end of the address when editing
  useEffect(() => {
    if (editing && addressInputRef.current) {
      const el = addressInputRef.current;
      el.focus();
      const len = el.value.length;
      el.setSelectionRange(len, len);
    }
  }, [editing, profile.address]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // displayName is unmanaged (uncontrolled), handled via ref
    if (name === "displayName") return;

    setProfile((p) => ({ ...p, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    const addr = profile.address.trim();
    const displayName = (
      displayNameInputRef.current?.value || profile.displayName || ""
    ).trim();

    if (!addr) {
      setMessage(
        "Please enter your full address (street, city, state, and ZIP) so neighbors can find you by distance."
      );
      return;
    }

    setSaving(true);
    try {
      const payload = {
        displayName,
        address: addr,
        profilePic: profile.profilePic,
      };

      const { user } = await api.updateMe(payload);

      const updatedDisplayName =
        user.displayName || displayName || profile.displayName;

      setProfile((p) => ({
        ...p,
        email: user.email || p.email,
        displayName: updatedDisplayName,
        address: user.address || p.address,
        profilePic: user.profilePic || p.profilePic,
      }));

      if (user.address && user.address.trim() !== "") {
        localStorage.setItem("nh_address_prompt_dismissed", "1");
        setAddressPromptActive(false);
      }

      setMessage("Profile updated successfully!");
      setEditing(false);
      localStorage.setItem("displayName", updatedDisplayName || "");
    } catch (err) {
      console.error("Profile update error:", err);
      setMessage(`${err.message || "Update failed."}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await api.deleteMe();
      localStorage.removeItem("token");
      localStorage.removeItem("displayName");
      navigate("/", { state: { message: "Account deleted successfully" } });
    } catch (err) {
      setMessage(`${err.message || "Failed to delete account."}`);
      setShowDeleteModal(false);
    } finally {
      setDeleting(false);
    }
  };

  // geolocation helper – fills address field with coordinates for now
  const handleUseCurrentLocation = () => {
    setMessage("");
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setMessage("Your browser does not support geolocation.");
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const coordString = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;

        setProfile((p) => ({
          ...p,
          address: coordString,
        }));

        setLocating(false);
        setMessage(
          "Filled with your current coordinates. You can edit this to a full mailing address if you like."
        );
      },
      (err) => {
        console.error("geolocation error:", err);
        setLocating(false);
        setMessage(
          `Could not get your location: ${
            err.message || "Permission denied."
          }`
        );
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // open a request in Nick's RequestDetailsModal
  const handleRequestClick = (e, id) => {
    e.preventDefault();
    setSelectedId(id);
    setShowRequestModal(true);
  };

  // when modal closes or status changes, refresh overview
  const handleRequestClose = async () => {
    setShowRequestModal(false);
    await fetchOverview();
  };

  const handleStatusChange = async () => {
    await fetchOverview();
  };

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  if (loading) return <p style={{ padding: 16 }}>Loading profile...</p>;

  const Card = ({ children, id }) => (
    <section
      id={id}
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        background: "#fff",
        padding: 16,
      }}
    >
      {children}
    </section>
  );

  const Stat = ({ num, label }) => (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        background: "#fff",
        padding: 16,
      }}
    >
      <div style={{ fontSize: 20, fontWeight: 700 }}>{num}</div>
      <div style={{ color: "#667085", fontSize: 14 }}>{label}</div>
    </div>
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

  const DeleteConfirmModal = () => {
    if (!showDeleteModal) return null;

    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
        }}
        onClick={() => setShowDeleteModal(false)}
      >
        <div
          style={{
            background: "#fff",
            borderRadius: 12,
            padding: 24,
            maxWidth: 400,
            width: "90%",
            boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <h3 style={{ margin: "0 0 12px", color: "#dc2626" }}>
            Delete Account?
          </h3>
          <p style={{ margin: "0 0 20px", color: "#667085" }}>
            This action cannot be undone. This will permanently delete your
            account and remove all your requests from our servers.
          </p>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={() => setShowDeleteModal(false)}
              disabled={deleting}
              style={{
                background: "#fff",
                color: "#344054",
                border: "1px solid #d0d5dd",
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDeleteAccount}
              disabled={deleting}
              style={{
                background: "#dc2626",
                color: "#fff",
                border: "none",
              }}
            >
              {deleting ? "Deleting…" : "Delete Account"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const avatarUrl =
    profile.profilePic && profile.profilePic.trim() !== ""
      ? profile.profilePic
      : `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(
          profile.displayName || profile.email || "User"
        )}`;

  // --- derived lists for activity ---
  const createdRequests = overview?.created || [];
  const acceptedRequests = overview?.accepted || [];

  const createdOpen = createdRequests.filter(
    (r) => r && r.status && String(r.status).toLowerCase() !== "closed"
  );
  const createdClosed = createdRequests.filter(
    (r) => r && String(r.status).toLowerCase() === "closed"
  );

  const helpingActive = acceptedRequests.filter(
    (r) =>
      r &&
      r.status &&
      !["closed", "completed"].includes(String(r.status).toLowerCase())
  );

  const helpingCompleted = acceptedRequests.filter(
    (r) =>
      r &&
      r.status &&
      ["closed", "completed"].includes(String(r.status).toLowerCase())
  );

  // reputation summary
  const feedbackSummary = overview?.feedbackSummary || null;
  const avgRating = feedbackSummary?.avgRating ?? null;
  const reviewCount = feedbackSummary?.reviewCount ?? 0;

  return (
    <main style={{ padding: 16, maxWidth: 960, margin: "0 auto" }}>
      <h2 style={{ margin: "6px 0 8px" }}>My Profile</h2>

      {/* small in-page nav for sections */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          marginBottom: 16,
          fontSize: 13,
        }}
      >
        <button type="button" onClick={() => scrollToSection("section-profile")}>
          Profile
        </button>
        <button
          type="button"
          onClick={() => scrollToSection("section-my-requests")}
        >
          My requests
        </button>
        <button
          type="button"
          onClick={() => scrollToSection("section-helping")}
        >
          Requests I&apos;m helping with
        </button>
        <button
          type="button"
          onClick={() => scrollToSection("section-feedback")}
        >
          Reputation &amp; feedback
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1.2fr",
          gap: 16,
        }}
      >
        {/* left column: profile + reputation */}
        <div style={{ display: "grid", gap: 16 }}>
          {/* profile editor */}
          <Card id="section-profile">
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
                  <img src={avatarUrl} alt="Profile avatar" />
                </p>

                <button
                  onClick={() => {
                    setEditing(true);
                    setMessage("");
                  }}
                >
                  Edit Profile
                </button>

                <div
                  style={{
                    marginTop: 24,
                    paddingTop: 24,
                    borderTop: "1px solid #e5e7eb",
                  }}
                >
                  <p
                    style={{
                      fontSize: 14,
                      color: "#667085",
                      marginBottom: 8,
                    }}
                  >
                    Danger Zone
                  </p>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    style={{
                      background: "#fff",
                      color: "#dc2626",
                      border: "1px solid #dc2626",
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
                {addressPromptActive && (
                  <p style={{ color: "#b45309", fontSize: 14 }}>
                    To use distance-based filters and nearby matching, please
                    add your home area address. Include street, city, state, and
                    ZIP. It is only used to find neighbors close to you.
                  </p>
                )}

                <div>
                  <label>Name (display name):</label>
                  <input
                    name="displayName"
                    ref={displayNameInputRef}
                    defaultValue={profile.displayName}
                    onChange={handleChange}
                    placeholder="Your name as shown to others"
                    autoComplete="name"
                  />
                </div>

                <div>
                  <label>Address:</label>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      ref={addressInputRef}
                      name="address"
                      value={profile.address}
                      onChange={handleChange}
                      autoComplete="street-address"
                      placeholder="123 Main St, City, ST 12345"
                      style={{ flex: 1 }}
                    />
                    <button
                      type="button"
                      onClick={handleUseCurrentLocation}
                      disabled={locating}
                    >
                      {locating ? "Locating…" : "Use my location"}
                    </button>
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label>Profile Picture / Avatar:</label>
                  <AvatarPicker
                    user={{
                      name: profile.displayName || profile.email,
                      avatarUrl,
                    }}
                    onUpdate={(url) =>
                      setProfile((p) => ({ ...p, profilePic: url }))
                    }
                  />
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  <button type="submit" disabled={saving}>
                    {saving ? "Saving…" : "Save Changes"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(false);
                      setAddressPromptActive(false);
                      setMessage("");
                    }}
                  >
                    Cancel
                  </button>
                </div>

                {message && <p style={{ marginTop: 8 }}>{message}</p>}
              </form>
            )}
          </Card>

          {/* reputation / feedback summary */}
          <Card id="section-feedback">
            <h3 style={{ margin: "0 0 10px" }}>Reputation &amp; Feedback</h3>
            {!overview ? (
              <p>Loading…</p>
            ) : reviewCount === 0 || !avgRating ? (
              <p style={{ color: "#667085", fontSize: 14 }}>
                You don&apos;t have any feedback yet. Complete a few requests to
                start building your reputation.
              </p>
            ) : (
              <div style={{ display: "grid", gap: 8 }}>
                <p style={{ margin: 0 }}>
                  <strong>Average rating:</strong>{" "}
                  <span style={{ fontSize: 18 }}>
                    {avgRating.toFixed(1)} / 5{" "}
                    <span aria-hidden="true">★</span>
                  </span>
                </p>
                <p style={{ margin: 0, color: "#667085", fontSize: 14 }}>
                  Based on {reviewCount} review
                  {reviewCount === 1 ? "" : "s"} from neighbors you&apos;ve
                  helped.
                </p>
                <button
                  type="button"
                  style={{
                    marginTop: 8,
                    fontSize: 13,
                    padding: "6px 10px",
                  }}
                  onClick={() => navigate("/feedback")}
                >
                  View detailed feedback
                </button>
              </div>
            )}
          </Card>
        </div>

        {/* right: activity */}
        <div style={{ display: "grid", gap: 16 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 12,
            }}
          >
            <Stat num={createdRequests.length} label="Requests I created" />
            <Stat
              num={overview?.counts?.createdOpen ?? 0}
              label="Open / active"
            />
            <Stat num={acceptedRequests.length} label="I'm helping with" />
          </div>

          <Card id="section-my-requests">
            <h3 style={{ margin: "0 0 10px" }}>My requests</h3>
            {overviewErr && (
              <p style={{ color: "#b42318" }}>{overviewErr}</p>
            )}
            {!overview ? (
              <p>Loading…</p>
            ) : createdOpen.length === 0 ? (
              <p style={{ color: "#667085" }}>
                You haven&apos;t posted any open requests yet.
              </p>
            ) : (
              <ul
                style={{
                  display: "grid",
                  gap: 8,
                  paddingLeft: 16,
                }}
              >
                {createdOpen.map((r) => (
                  <li key={r._id} style={{ display: "grid", gap: 4 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <a
                        href="#"
                        onClick={(e) => handleRequestClick(e, r._id)}
                        style={{ fontWeight: 600 }}
                      >
                        {r.title || "Untitled Request"}
                      </a>
                      <Badge status={r.status} />
                    </div>
                    <span
                      style={{
                        color: "#667085",
                        fontSize: 12,
                      }}
                    >
                      Created{" "}
                      {new Date(r.createdAt).toLocaleDateString()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <h3 style={{ margin: "0 0 10px" }}>Requests I'm helping with</h3>
            {!overview ? (
              <p>Loading…</p>
            ) : helpingActive.length === 0 ? (
              <p style={{ color: "#667085" }}>
                You haven&apos;t accepted any active requests yet.
              </p>
            ) : (
              <ul
                style={{
                  display: "grid",
                  gap: 8,
                  paddingLeft: 16,
                }}
              >
                {helpingActive.map((r) => (
                  <li key={r._id} style={{ display: "grid", gap: 4 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <a
                        href="#"
                        onClick={(e) => handleRequestClick(e, r._id)}
                        style={{ fontWeight: 600 }}
                      >
                        {r.title || "Untitled Request"}
                      </a>
                      <Badge status={r.status} />
                    </div>
                    <span
                      style={{
                        color: "#667085",
                        fontSize: 12,
                      }}
                    >
                      Joined{" "}
                      {new Date(r.createdAt).toLocaleDateString()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <h3 style={{ margin: "0 0 10px" }}>
              Completed requests I helped with
            </h3>
            {!overview ? (
              <p>Loading…</p>
            ) : helpingCompleted.length === 0 ? (
              <p style={{ color: "#667085" }}>
                You don&apos;t have any completed helper requests yet.
              </p>
            ) : (
              <ul
                style={{
                  display: "grid",
                  gap: 8,
                  paddingLeft: 16,
                }}
              >
                {helpingCompleted.map((r) => (
                  <li key={r._id} style={{ display: "grid", gap: 4 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <a
                        href="#"
                        onClick={(e) => handleRequestClick(e, r._id)}
                        style={{ fontWeight: 600 }}
                      >
                        {r.title || "Untitled Request"}
                      </a>
                      <Badge status={r.status} />
                    </div>
                    <span
                      style={{
                        color: "#667085",
                        fontSize: 12,
                      }}
                    >
                      Completed{" "}
                      {new Date(
                        r.completedAt || r.createdAt
                      ).toLocaleDateString()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <h3 style={{ margin: "0 0 10px" }}>
              Completed requests I created
            </h3>
            {!overview ? (
              <p>Loading…</p>
            ) : createdClosed.length === 0 ? (
              <p style={{ color: "#667085" }}>
                You don&apos;t have any completed requests yet.
              </p>
            ) : (
              <ul
                style={{
                  display: "grid",
                  gap: 8,
                  paddingLeft: 16,
                }}
              >
                {createdClosed.map((r) => (
                  <li key={r._id} style={{ display: "grid", gap: 4 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <a
                        href="#"
                        onClick={(e) => handleRequestClick(e, r._id)}
                        style={{ fontWeight: 600 }}
                      >
                        {r.title || "Untitled Request"}
                      </a>
                      <Badge status={r.status} />
                    </div>
                    <span
                      style={{
                        color: "#667085",
                        fontSize: 12,
                      }}
                    >
                      Completed{" "}
                      {new Date(
                        r.completedAt || r.createdAt
                      ).toLocaleDateString()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      <DeleteConfirmModal />

      {showRequestModal && selectedId && (
        <RequestDetailsModal
          onClose={handleRequestClose}
          requestId={selectedId}
          onStatusChange={handleStatusChange}
        />
      )}
    </main>
  );
}
