import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import Navbar from "./Navbar";
import NotificationBell from "./NotificationBell";
import "./Navigation.css";

export default function Navigation() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);

  // Fetch current user on mount
  useEffect(() => {
    (async () => {
      try {
        const { user } = await api.me();
        setUser(user);
      } catch {
        setUser(null);
      }
    })();
  }, []);

  async function handleLogout() {
    try {
      await api.logout();
      setUser(null);
      navigate("/login");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  }

  const displayName =
    user?.displayName?.trim() || user?.email?.split("@")[0] || "User";

  const links = [
    <Link key="home" to="/" className={pathname === "/" ? "selected-nav" : ""}>
      Home
    </Link>,

    <Link
      key="browse"
      to="/browse"
      className={pathname === "/browse" ? "selected-nav" : ""}
    >
      Browse
    </Link>,

    <Link
      key="post"
      to="/post"
      className={pathname === "/post" ? "selected-nav" : ""}
    >
      Post
    </Link>,

    // Only show Register/Login when logged OUT
    !user && (
      <Link
        key="register"
        to="/register"
        className={pathname === "/register" ? "selected-nav" : ""}
      >
        Register
      </Link>
    ),

    !user && (
      <Link
        key="login"
        to="/login"
        className={pathname === "/login" ? "selected-nav" : ""}
      >
        Login
      </Link>
    ),
  ].filter(Boolean);

  const rightSide = user ? (
    <span className="nav-user" style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <NotificationBell />
      <span className="welcome-text">Welcome, {displayName}!</span>
      <button className="logout-btn" onClick={handleLogout}>
        Logout
      </button>
    </span>
  ) : null;

  return <Navbar links={links} right={rightSide} />;
}
