import { Link, useLocation } from 'react-router-dom';
import MobileNavbar from './UI/MobileNavbar';
import './MobileNavigation.css'

export default function MobileNavigation() {
  const location = useLocation();
  const { pathname } = location;

  return (
    <MobileNavbar
      links={[
        <Link key={1} to='./' className={pathname == '/' ? 'selected-nav' : ''}>
          Home
        </Link>,
        <Link key={2} to='./browse' className={pathname == '/browse' ? 'selected-nav' : ''}>
          Browse
        </Link>,
        <Link key={3} to='./post' className={pathname == '/post' ? 'selected-nav' : ''}>
          Post request
        </Link>,
        <Link key={4} to='./register' className={pathname == '/register' ? 'selected-nav' : ''}>
          Register
        </Link>,
        <Link key={5} to='./login' className={pathname == '/login' ? 'selected-nav' : ''}>
          Login
        </Link>
      ]}
    />
  );
}