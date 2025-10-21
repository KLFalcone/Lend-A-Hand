import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";

export default function Register() {
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      // --- register new user ---
      const { user } = await api.register(
        email.trim(),
        password,
        displayName.trim()
      );

      // immediately log them in after registering
      const { user: loggedInUser } = await api.login(email, password);

      // save basics for navbar/local UI
      localStorage.setItem("userEmail", loggedInUser.email);
      localStorage.setItem("displayName", loggedInUser.displayName || "");
      localStorage.setItem("role", loggedInUser.role || "user");
      localStorage.setItem("displayName", user.displayName || "");
      window.dispatchEvent(new Event("auth-changed")); // ping header
      
      // fetch full profile to check if address is missing
      const { user: fullUser } = await api.me();
      const needsOnboarding = !fullUser.address?.trim();

      setMessage(
        `✅ Registration successful! Welcome ${
          fullUser.displayName || fullUser.email.split("@")[0]
        }`
      );

      // redirect accordingly
      setTimeout(() => {
        if (needsOnboarding) {
          navigate("/profile?onboard=1");
        } else {
          navigate("/browse");
        }
      }, 800);
    } catch (err) {
      console.error("Register error:", err);
      setMessage(`❌ ${err.message || "Registration failed."}`);
    }
  };

  return (
    <main style={{ padding: 16 }}>
      <h2>Register</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <input
            type="text"
            placeholder="Display name (optional)"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </div>
        <div>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit">Register</button>
      </form>

      {message && <p style={{ marginTop: 10 }}>{message}</p>}
    </main>
  );
}
