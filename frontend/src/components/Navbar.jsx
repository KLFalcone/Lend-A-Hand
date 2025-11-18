// frontend/src/components/Navbar.jsx
import { Link } from "react-router-dom";
import "./Navigation.css";

export default function Navbar({ links = [], right = null }) {
  return (
    <div className="nav-wrapper">
      <nav id="nav">
        <div id="nav-left">
          <Link to="/" id="nav-header" aria-label="Neighborhood Help home">
            <div id="nav-name">Lend A Hand</div>
          </Link>
        </div>

        <div id="nav-center">
          <div id="nav-pages">
            {links.map((link) => link)}
          </div>
        </div>

        <div id="nav-right">
          {right}
        </div>
      </nav>
    </div>
  );
}
