import React from "react";
import { Link, useLocation } from "react-router-dom";
import { api } from "../lib/api";

export default function Home() {
    const location = useLocation();
    const successMessage = location.state?.message;
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
        <div className="wrapper">
            {successMessage && (
                <div style={{
                    padding: 16,
                    background: '#dcfce7',
                    color: '#166534',
                    borderRadius: 8,
                    margin: '0 auto 16px',
                    maxWidth: 960,
                    border: '1px solid #bbf7d0'
                }}>
                    {successMessage}
                </div>
            )}

            <div className="container-fluid">
                <h1>Neighborhood Help</h1>
                <p>Neighbors helping neighbors with everyday tasks.</p>
                <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
                    <Link to="/browse">Browse Requests</Link>
                    <Link to="/post">Post Request</Link>
                    <Link to="/login">Login</Link>
                    <Link to="/register">Register</Link>
                    <Link to="/profile">
                        <button>Go to My Profile</button>
                    </Link>
                </div>
                <button onClick={checkApi}>Check API</button>
                {status && <pre>{status}</pre>}
            </div>
        </div>
    );

}