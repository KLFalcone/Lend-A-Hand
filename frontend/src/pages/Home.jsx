import React from "react";
import { Link } from "react-router-dom";

export default function Home() {
  const [status, setStatus] = React.useState("");
  const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

  const checkApi = async () => {
    try {
      const res = await fetch(`${apiBase}/api/health`);
      const data = await res.json();
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
      </div>
      <button onClick={checkApi}>Check API</button>
      {status && <pre>{status}</pre>}
    </main>
  );
}