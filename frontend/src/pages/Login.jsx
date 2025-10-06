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
      const data = await api.login(email, password);

      // Save both token and role
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.role);

      setMessage(`✅ Login successful! You are logged in as ${data.role}.`);

      // Redirect to profile after short delay
      setTimeout(() => navigate("/profile"), 800);
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
      <p>
        Don't have an account? <Link to="/register">Register</Link>
      </p>
    </main>
  );
}
