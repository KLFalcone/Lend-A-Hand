import './Footer.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { library } from '@fortawesome/fontawesome-svg-core'
import { fas } from '@fortawesome/free-solid-svg-icons'
import { far } from '@fortawesome/free-regular-svg-icons'
import { fab } from '@fortawesome/free-brands-svg-icons'

library.add(fas, far, fab)

export default function Footer() {
  return (
    <footer>
      <div className="footer-wrapper">
        <div className="footer-line"></div>
        <div className="link-wrapper">
          <div className='footer-link'>
            <a href="/privacy" className='footer-icon' ><FontAwesomeIcon icon="fa-solid fa-shield-halved" />Privacy</a>
          </div>
          <div className='footer-link'>
            <a href="/terms" className='footer-icon' ><FontAwesomeIcon icon="fa-solid fa-circle-info" />Terms</a>
          </div>
          <div className='footer-link'>
            <a href="/support" className='footer-icon' ><FontAwesomeIcon icon="fa-solid fa-message" />Contact/Support</a>
          </div>
        </div>
        <div className="footer-line"></div>
      </div>
      <small className='copyright'>&copy; Copyright 2025, Neighborhood Help</small>
    </footer>
  );
}