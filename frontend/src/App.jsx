// frontend/src/App.jsx
import "./reset.css";
import "./App.css";
import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Navigation from "./components/Navigation";
import MobileNavigation from "./components/MobileNavigation";
import Footer from "./components/Footer.jsx";

function App() {
  const [matches, setMatches] = useState(
    window.matchMedia("(min-width: 768px)").matches
  );

  useEffect(() => {
    const mql = window.matchMedia("(min-width: 768px)");
    const handler = (e) => setMatches(e.matches);

    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  return (
    <>
      {matches && <Navigation />}
      {!matches && <MobileNavigation />}
      <Outlet />
      <Footer />
    </>
  );
}

export default App;
