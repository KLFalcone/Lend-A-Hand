import React, { useState, useEffect } from "react";
import { api } from "../lib/api";

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  // Fetch logged-in user's profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await api.getProfile();
        setProfile(data);
      } catch (err) {
        setMessage(`❌ ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      const updated = await api.updateProfile(profile);
      setProfile(updated.user || updated);
      setMessage("✅ Profile updated successfully!");
      setEditing(false);
    } catch (err) {
      setMessage(`❌ ${err.message}`);
    }
  };

  if (loading) return <p>Loading profile...</p>;
  if (!profile) return <p>No profile data found.</p>;

  return (
    <main style={{ padding: 16 }}>
      <h2>My Profile</h2>

      {!editing ? (
        <div style={{ maxWidth: 400 }}>
          <p><strong>Name:</strong> {profile.name || "—"}</p>
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
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ maxWidth: 400 }}>
          <div>
            <label>Name:</label>
            <input
              type="text"
              name="name"
              value={profile.name || ""}
              onChange={handleChange}
            />
          </div>
          <div>
            <label>Address:</label>
            <input
              type="text"
              name="address"
              value={profile.address || ""}
              onChange={handleChange}
            />
          </div>
          <div>
            <label>Phone:</label>
            <input
              type="text"
              name="phone"
              value={profile.phone || ""}
              onChange={handleChange}
            />
          </div>
          <div>
            <label>Availability:</label>
            <input
              type="text"
              name="availability"
              value={profile.availability || ""}
              onChange={handleChange}
            />
          </div>
          <div>
            <label>Profile Picture URL:</label>
            <input
              type="text"
              name="profilePic"
              value={profile.profilePic || ""}
              onChange={handleChange}
            />
          </div>
          <button type="submit">Save Changes</button>
          <button type="button" onClick={() => setEditing(false)} style={{ marginLeft: 8 }}>
            Cancel
          </button>
        </form>
      )}

      {message && <p>{message}</p>}
    </main>
  );
}
