import React from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";

export default function Home() {
  const [status, setStatus] = React.useState("");

  const checkApi = async () => {
    try {
      const data = await api.health();
      setStatus(JSON.stringify(data, null, 2));
    } catch {
      setStatus("API not reachable");
    }
  };

  return (
    <main style={{ padding: 16 }}>
      <h1>Neighborhood Help</h1>
      <p>Neighbors helping neighbors with everyday tasks.</p>
      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <Link to="/browse">Browse Requests</Link>
        <Link to="/post">Post Request</Link>
        <Link to="/login">Login</Link>
        <Link to="/register">Register</Link> 
      </div>
      <button onClick={checkApi}>Check API</button>
      {status && <pre>{status}</pre>}
    </main>
  );
}