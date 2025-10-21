// frontend/src/components/Navigation.jsx
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

  // optimistic local fallback for instant UI
  const localName = (localStorage.getItem("displayName") || "").trim();
  const optimisticUser = localName ? { displayName: localName } : null;

  // ✅ fetch actual user data on route change
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { user } = await api.me(); // /api/v1/auth/me
        if (alive) setUser(user || null);
      } catch {
        if (alive) setUser(null);
      }
    })();
    return () => { alive = false; };
  }, [pathname]);

  // ✅ listen for global auth changes (Login/Register triggers this)
  useEffect(() => {
    const onAuthChanged = async () => {
      try {
        const { user } = await api.me();
        setUser(user || null);
      } catch {
        setUser(null);
      }
    };
    window.addEventListener("auth-changed", onAuthChanged);
    return () => window.removeEventListener("auth-changed", onAuthChanged);
  }, []);

  async function handleLogout() {
    try {
      await api.logout();
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      localStorage.removeItem("displayName");
      window.dispatchEvent(new Event("auth-changed")); // make navbar reset instantly
      setUser(null);
      navigate("/login");
    }
  }

  const effectiveUser = user || optimisticUser;
  const isActive = (path) =>
    pathname === path || pathname.startsWith(path + "/") ? "selected-nav" : "";

  const displayName =
    effectiveUser?.displayName?.trim() ||
    effectiveUser?.email?.split("@")[0] ||
    "User";

  const links = [
    <Link key="home" to="/" className={isActive("/")}>Home</Link>,
    <Link key="browse" to="/browse" className={isActive("/browse")}>Browse</Link>,
    <Link key="post" to="/post" className={isActive("/post")}>Post</Link>,
    effectiveUser && (
      <Link key="profile" to="/profile" className={isActive("/profile")}>
        My Profile
      </Link>
    ),
    !effectiveUser && (
      <Link key="register" to="/register" className={isActive("/register")}>
        Register
      </Link>
    ),
    !effectiveUser && (
      <Link key="login" to="/login" className={isActive("/login")}>
        Login
      </Link>
    ),
  ].filter(Boolean);

  const rightSide = effectiveUser ? (
    <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <NotificationBell />
      <span className="welcome-text">Welcome, {displayName}!</span>
      <button className="logout-btn" onClick={handleLogout}>Logout</button>
    </span>
  ) : null;

  return <Navbar links={links} right={rightSide} />;
}
