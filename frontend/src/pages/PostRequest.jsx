import React from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";

export default function PostRequest() {
  const navigate = useNavigate();

  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [urgency, setUrgency] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [coords, setCoords] = React.useState(null); // { lat, lon }
  const [message, setMessage] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  // Load profile + prefill address; redirect if not logged in
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { user } = await api.getProfile(); // /api/v1/users/me
        if (!mounted) return;
        if (!user) {
          navigate("/login");
          return;
        }
        if (user.address) setAddress(user.address);
      } catch (e) {
        // unauthenticated → to login
        navigate("/login");
      }
    })();
    return () => {
      mounted = false;
    };
  }, [navigate]);

  async function useProfileAddress() {
    setMessage("");
    try {
      const { user } = await api.getProfile();
      if (user?.address) {
        setAddress(user.address);
        setCoords(null);
        setMessage("Using your saved home address.");
      } else {
        setMessage("No saved address on your profile yet.");
      }
    } catch (e) {
      setMessage(e.message || "Could not load profile.");
    }
  }

  // Get browser location and reverse-geocode to a human address
  async function useCurrentLocation() {
    setMessage("");
    setBusy(true);
    try {
      const pos = await new Promise((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
        })
      );

      const { latitude, longitude } = pos.coords;
      setCoords({ lat: latitude, lon: longitude });

      // Reverse geocode via OpenStreetMap Nominatim
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`;
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      const data = await res.json();
      setAddress(data?.display_name || "");
      setMessage("Using your current location.");
    } catch (err) {
      setMessage(err.message || "Could not get current location.");
    } finally {
      setBusy(false);
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setSubmitting(true);

    // Client-side validation
    if (!title || !description || !category || !urgency || !address) {
      setMessage("Please fill in all required fields.");
      setSubmitting(false);
      return;
    }

    try {
      const payload = {
        title,
        description,
        category,
        urgency,
        location: {
          address,
          coordinates: coords ? [coords.lon, coords.lat] : undefined, // [lng, lat]
        },
      };

      await api.createRequest(payload);

      setMessage("Request posted!");
      setTimeout(() => navigate("/browse"), 800);
    } catch (err) {
      console.error(err);
      if (err.message?.includes("401")) {
        navigate("/login");
      } else {
        setMessage("Could not post request. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main style={{ padding: 16 }}>
      <h2>Create a New Request</h2>

      <form
        onSubmit={handleSubmit}
        style={{ display: "grid", gap: 12, maxWidth: 520 }}
      >
        <input
          type="text"
          placeholder="Short title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <textarea
          placeholder="Describe what you need help with"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={5}
          required
        />

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          required
        >
          <option value="">Select category</option>
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
          required
        >
          <option value="">Select urgency</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>

        <div style={{ display: "grid", gap: 8 }}>
          <input
            type="text"
            placeholder="Location (address)"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
          />
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" onClick={useProfileAddress}>
              Use my profile address
            </button>
            <button type="button" onClick={useCurrentLocation} disabled={busy}>
              {busy ? "Locating…" : "Use my current location"}
            </button>
          </div>
          {coords && (
            <div style={{ fontSize: 12, opacity: 0.7 }}>
              coords: {coords.lat.toFixed(5)}, {coords.lon.toFixed(5)}
            </div>
          )}
        </div>

        <button type="submit" disabled={submitting}>
          {submitting ? "Posting..." : "Post Request"}
        </button>
      </form>

      {message && (
        <p style={{ marginTop: 8, fontWeight: "bold" }}>{message}</p>
      )}
    </main>
  );
}
