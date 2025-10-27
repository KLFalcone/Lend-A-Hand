import { useState, useEffect } from "react"; 
import axios from "axios";

function AvatarPicker({ user, onUpdate }) {
  const [inputUrl, setInputUrl] = useState("");
  const [imageUrl, setImageUrl] = useState(user.avatarUrl || ""); 
  const [imgError, setImgError] = useState(false); 
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setImageUrl(user.avatarUrl || "");
    setImgError(false);
  }, [user.avatarUrl]);

  const autoAvatarUrl = `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(user.name)}`;

  const displayUrl = imgError || !imageUrl ? autoAvatarUrl : imageUrl;

  const handleUseAuto = () => {
    setImageUrl("");
    setImgError(false);
    setInputUrl(""); 
    onUpdate(""); 
  };

  const handleUseInput = () => {
    setImgError(false);
      if (!inputUrl.startsWith("http")) {
      setImgError(true);
      return;
    }

    setLoading(true); 
    const img = new Image();
    img.onload = () => {
      setImageUrl(inputUrl);
      onUpdate(inputUrl);
      setLoading(false); 
    };
    img.onerror = () => {
      setImgError(true); 
      setImageUrl("");
      onUpdate("");
      setLoading(false);
    };
    img.src = inputUrl;
  };

  return (
    <div style={{ margin: "20px 0" }}>
      <h3>Avatar Preview</h3>
      <img
        src={displayUrl}
        alt={`${user.name} avatar`}
        style={{ width: 100, height: 100, borderRadius: "50%" }}
      />
      <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
        <button onClick={handleUseAuto} disabled={loading}>
          Use Auto Avatar
        </button>
      </div>
      <div style={{ marginTop: 10, display: "flex", gap: 8, alignItems: "center" }}>
        <input
          type="text"
          placeholder="Paste image URL"
          value={inputUrl}
          onChange={(e) => setInputUrl(e.target.value)}
          style={{ width: 200 }}
        />
        <button onClick={handleUseInput} disabled={loading}>
          {loading ? "Loading…" : "Use this image"}
        </button>
      </div>
      {imgError && (
        <p style={{ color: "#dc2626", marginTop: 8 }}>
          Failed to load image. Using auto avatar instead.
        </p>
      )}
    </div>
  );
}

export default AvatarPicker;