import React from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import "./Home.css";

export default function Home() {
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function fetchUser() {
      try {
        const data = await api.me();
        setUser(data);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, []);

  if (loading) {
    return (
      <div className="home-loading">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="home">
      <div className="home-hero">
        <div className="overlay"></div>
        <header className="home-header">
          <h1 className="home-title">Lend A Hand</h1>
          <p className="home-slogan">
            Neighbors helping neighbors with everyday tasks.
          </p>
        </header>

        <main className="home-content">
          {user ? (
            <div className="home-actions">
              <p className="welcome-text">
                Welcome back, {user.displayName || "neighbor"}!
              </p>
              <div className="home-buttons">
                <Link to="/browse" className="home-button browse-button">
                  Browse Requests
                </Link>
                <Link to="/post" className="home-button post-button">
                  Create a New Post
                </Link>
              </div>
            </div>
          ) : (
            <div className="home-actions">
              <p className="welcome-text">
                Join the community to start helping or getting help today!
              </p>
              <div className="home-buttons">
                <Link to="/login" className="home-button login-button">
                  Login
                </Link>
                <Link to="/register" className="home-button register-button">
                  Register
                </Link>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
