import React, { useState } from "react";

export default function Login() {
  const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      const res = await fetch(`${apiBase}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Login failed");

      // Save both token and role
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.role);

      setMessage(`✅ Login successful! You are logged in as ${data.role}.`);
    } catch (err) {
      setMessage(`❌ ${err.message}`);
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
      {message && <p>{message}</p>}
    </main>
  );
}
