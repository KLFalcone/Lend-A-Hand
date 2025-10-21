import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../lib/api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      // --- login request ---
      const { user } = await api.login(email, password);

      // store basics for navbar/local UI
      localStorage.setItem("userEmail", user.email);
      localStorage.setItem("displayName", user.displayName || "");
      localStorage.setItem("role", user.role || "user");
      localStorage.setItem("displayName", user.displayName || "");
      window.dispatchEvent(new Event("auth-changed")); // ping header

      // check if user needs onboarding
      const { user: fullUser } = await api.me(); // ensures latest data
      const needsOnboarding = !fullUser.address?.trim();

      setMessage(
        `✅ Login successful! Welcome ${
          fullUser.displayName || fullUser.email.split("@")[0]
        }`
      );

      // redirect based on profile completeness
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
    <main style={{ padding: 16 }}>
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
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
        <button type="submit">Login</button>
      </form>

      {message && <p style={{ marginTop: 10 }}>{message}</p>}

      <p style={{ marginTop: 16 }}>
        Don’t have an account? <Link to="/register">Register</Link>
      </p>
    </main>
  );
}
