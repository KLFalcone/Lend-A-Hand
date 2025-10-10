import './reset.css';
import './App.css';
import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Navigation from './components/Navigation';
import MobileNavigation from './components/MobileNavigation';
// import Footer from './components/Footer';

function App() {
  const [matches, setMatches] = useState(
    window.matchMedia("(min-width: 768px)").matches
  )

  useEffect(() => {
    window
    .matchMedia("(min-width: 768px)")
    .addEventListener('change', e => setMatches(e.matches));
  }, []);

  return (
    <>
      {matches && (<Navigation />)}
      {!matches && (<MobileNavigation />)}
      <Outlet />
      {/* <Footer /> */}
    </>
  );
}

export default App
