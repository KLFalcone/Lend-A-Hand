import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import './Register.css';

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
      // Register new user
      const { user } = await api.register(
        email.trim(),
        password,
        displayName.trim()
      );

      // Immediately log in
      const { user: loggedInUser } = await api.login(email, password);

      localStorage.setItem("userEmail", loggedInUser.email);
      localStorage.setItem("displayName", loggedInUser.displayName || "");
      localStorage.setItem("role", loggedInUser.role || "user");
      localStorage.setItem("displayName", user.displayName || "");
      window.dispatchEvent(new Event("auth-changed")); // update header

      const { user: fullUser } = await api.me();
      const needsOnboarding = !fullUser.address?.trim();

      setMessage(
        `✅ Registration successful! Welcome ${
          fullUser.displayName || fullUser.email.split("@")[0]
        }`
      );

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
    <main className="register-container">
      <h2>Register</h2>

      {message && <p className="register-message">{message}</p>}

      <form onSubmit={handleSubmit} className="register-form">
        <input
          type="text"
          placeholder="Display name (optional)"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Register</button>
      </form>
    </main>
  );
}
