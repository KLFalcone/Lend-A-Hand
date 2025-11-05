import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../lib/api";
import './Login.css';

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const { user } = await api.login(email, password);

      localStorage.setItem("userEmail", user.email);
      localStorage.setItem("displayName", user.displayName || "");
      localStorage.setItem("role", user.role || "user");
      window.dispatchEvent(new Event("auth-changed")); // update header

      const { user: fullUser } = await api.me();
      const needsOnboarding = !fullUser.address?.trim();

      setMessage(
        `✅ Login successful! Welcome ${
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
      console.error("Login error:", err);
      setMessage(`❌ ${err.message || "Login failed."}`);
    }
  };

  return (
    <main className="login-container">
      <h2>Login</h2>

      {message && <p className="login-message">{message}</p>}

      <form onSubmit={handleSubmit} className="login-form">
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
        <button type="submit">Login</button>
      </form>

      <p className="login-register">
        Don’t have an account? <Link to="/register">Register</Link>
      </p>
    </main>
  );
}
