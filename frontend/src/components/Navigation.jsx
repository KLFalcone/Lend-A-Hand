import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { api } from "../lib/api";        
import Navbar from "./UI/Navbar";    
import "./Navigation.css";

export default function Navigation() {
  const location = useLocation();
  const pathname = location.pathname;
  const navigate = useNavigate();

  const [user, setUser] = useState(null);

  // Load current user on mount
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

  // Logout handler
  async function handleLogout() {
    try {
      await api.logout();                    // POST /api/v1/auth/logout
      setUser(null);
      navigate("/login");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  }

  // welcome text
  const displayName =
    user?.displayName?.trim() ||
    user?.email?.split("@")[0] || // fallback to email username
    "User";

  return (
    <Navbar
      links={[
        <Link key={1} to="/" className={pathname === "/" ? "selected-nav" : ""}>
          Home
        </Link>,

        <Link
          key={2}
          to="/browse"
          className={pathname === "/browse" ? "selected-nav" : ""}
        >
          Browse
        </Link>,

        <Link
          key={3}
          to="/post"
          className={pathname === "/post" ? "selected-nav" : ""}
        >
          Post
        </Link>,

        <Link
          key={4}
          to="/register"
          className={pathname === "/register" ? "selected-nav" : ""}
        >
          Register
        </Link>,

        user ? (
          <span key={6} className="nav-user">
            <span className="welcome-text">Welcome, {displayName}!</span>
            <button className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </span>
        ) : (
          <Link
            key={5}
            to="/login"
            className={pathname === "/login" ? "selected-nav" : ""}
          >
            Login
          </Link>
        ),
      ]}
    />
  );
}
