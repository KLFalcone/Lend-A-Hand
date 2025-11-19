import React from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import "./PostRequest.css";

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

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { user } = await api.getProfile();
        if (!mounted) return;
        if (!user) {
          navigate("/login");
          return;
        }

        // basic saved address
        if (user.address) {
          setAddress(user.address);
        }

        // if profile has a stored location with coords, hydrate coords too
        const profileCoords = user?.location?.coordinates;
        if (
          Array.isArray(profileCoords) &&
          profileCoords.length >= 2 &&
          typeof profileCoords[0] === "number" &&
          typeof profileCoords[1] === "number"
        ) {
          setCoords({
            lon: profileCoords[0],
            lat: profileCoords[1],
          });
        }
      } catch {
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
      if (user) {
        const profileAddress =
          user.address || user.location?.address || "";

        const profileCoords = user.location?.coordinates;

        if (profileAddress) {
          setAddress(profileAddress);
        }

        if (
          Array.isArray(profileCoords) &&
          profileCoords.length >= 2 &&
          typeof profileCoords[0] === "number" &&
          typeof profileCoords[1] === "number"
        ) {
          setCoords({
            lon: profileCoords[0],
            lat: profileCoords[1],
          });
          setMessage("Using your saved home address and location.");
        } else if (profileAddress) {
          // address only, no geo coords
          setCoords(null);
          setMessage("Using your saved home address.");
        } else {
          setMessage("No saved address on your profile yet.");
        }
      } else {
        setMessage("No saved address on your profile yet.");
      }
    } catch (e) {
      setMessage(e.message || "Could not load profile.");
    }
  }

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

      // reverse geocode for a friendly address label (optional)
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

    if (!title || !description || !category || !urgency || !address) {
      setMessage("Please fill in all required fields.");
      setSubmitting(false);
      return;
    }

    try {
      const location = {
        address,
        type: "Point",
      };

      // only attach coordinates if we actually have them
      if (
        coords &&
        typeof coords.lat === "number" &&
        typeof coords.lon === "number"
      ) {
        location.coordinates = [Number(coords.lon), Number(coords.lat)]; // [lng, lat]
      }

      const payload = {
        title,
        description,
        category,
        urgency,
        location,
      };

      await api.createRequest(payload);
      setMessage("Request posted!");
      setTimeout(() => navigate("/browse"), 800);
    } catch (err) {
      console.error(err);
      if (err.message?.includes("401")) navigate("/login");
      else setMessage("Could not post request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="postrequest-container">
      <h2>Create a New Request</h2>

      {message && <p className="postrequest-message">{message}</p>}

      <form onSubmit={handleSubmit} className="postrequest-form">
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

        <div className="postrequest-location">
          <input
            type="text"
            placeholder="Location (address)"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
          />
          <div className="postrequest-location-buttons">
            <button type="button" onClick={useProfileAddress}>
              Use my profile address
            </button>
            <button type="button" onClick={useCurrentLocation} disabled={busy}>
              {busy ? "Locating…" : "Use my current location"}
            </button>
          </div>
          {coords && (
            <div className="postrequest-coords">
              coords: {coords.lat.toFixed(5)}, {coords.lon.toFixed(5)}
            </div>
          )}
        </div>

        <button type="submit" disabled={submitting}>
          {submitting ? "Posting..." : "Post Request"}
        </button>
      </form>
    </main>
  );
}
