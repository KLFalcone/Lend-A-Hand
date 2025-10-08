import { Link } from 'react-router-dom';
import hamburgerHandler from '../../lib/hamburger.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { library } from '@fortawesome/fontawesome-svg-core'
import { fas } from '@fortawesome/free-solid-svg-icons'
import { far } from '@fortawesome/free-regular-svg-icons'
import { fab } from '@fortawesome/free-brands-svg-icons'

library.add(fas, far, fab)

export default function Nav({ links }) {
  return (
    <nav id="m-nav">
      <div className="slide-out" id="m-nav-opened">
        <div id="m-nav-opened-header">
          <header id="m-header" onClick={hamburgerHandler}>
            <Link to='./' className="m-nav-header">
              <div id="m-nav-name-closed">
                Neighborhood Help
              </div>
            </Link>
          </header>
          <div>
            <FontAwesomeIcon icon="fa-solid fa-xmark" onClick={hamburgerHandler} alt="exit menu" id="exit-icon"/>
          </div>
        </div>
        <div id="m-nav-pages" onClick={hamburgerHandler}>
          {links.map((link) => link)}
        </div>
      </div>
      <div id="m-nav-closed">
        <header id="m-header" onClick={hamburgerHandler}>
          <Link to='./' className="m-nav-header">
            <div id="m-nav-name-open">
              Neighborhood Help
            </div>
          </Link>
        </header>
        <div>
          <FontAwesomeIcon icon="fa-solid fa-bars" onClick={hamburgerHandler} alt="hamburger menu" id="hamburger-icon"/>
        </div>
      </div>
    </nav>
  );
}