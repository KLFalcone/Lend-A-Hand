import React, { useState, useEffect } from "react";
import { api } from "../lib/api";
import { useNavigate } from "react-router-dom";

export default function Profile() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load full profile from backend
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { user } = await api.getProfile(); // GET /api/v1/users/me
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
    return () => { mounted = false; };
  }, [navigate]);

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
      // optional: keep navbar welcome in sync
      localStorage.setItem("displayName", user.displayName || "");
    } catch (err) {
      setMessage(`❌ ${err.message || "Update failed."}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p>Loading profile...</p>;
  if (!profile) return <p>No profile data found.</p>;

  return (
    <main style={{ padding: 16 }}>
      <h2>My Profile</h2>

      {!editing ? (
        <div style={{ maxWidth: 480 }}>
          <p><strong>Name:</strong> {profile.displayName || profile.email}</p>
          <p><strong>Email:</strong> {profile.email}</p>
          <p><strong>Address:</strong> {profile.address || "—"}</p>
          <p><strong>Phone:</strong> {profile.phone || "—"}</p>
          <p><strong>Availability:</strong> {profile.availability || "—"}</p>
          {profile.profilePic && (
            <p>
              <img
                src={profile.profilePic}
                alt="Profile"
                style={{ width: 100, height: 100, borderRadius: "50%" }}
              />
            </p>
          )}
          <button onClick={() => setEditing(true)}>Edit Profile</button>
          {message && <p style={{ marginTop: 8 }}>{message}</p>}
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ maxWidth: 480, display: "grid", gap: 10 }}>
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
            <input
              name="phone"
              value={profile.phone}
              onChange={handleChange}
            />
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
    </main>
  );
}
