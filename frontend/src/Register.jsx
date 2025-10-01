import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      const res = await fetch(`${apiBase}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Registration failed");

      setMessage("✅ Registration successful! Redirecting to login...");
      
      // Wait 1 second so the user sees the message, then go to login page
      setTimeout(() => navigate("/login"), 1000);
    } catch (err) {
      setMessage(`❌ ${err.message}`);
    }
  };

  return (
    <main style={{ padding: 16 }}>
      <h2>Register</h2>
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
        <button type="submit">Register</button>
      </form>
      {message && <p>{message}</p>}
    </main>
  );
}
