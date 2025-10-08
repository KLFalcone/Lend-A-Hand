import { Link, useLocation } from 'react-router-dom';
import MobileNavbar from './UI/MobileNavbar';
import './MobileNavigation.css'

export default function MobileNavigation() {
  const location = useLocation();
  const { pathname } = location;

  return (
    <MobileNavbar
      links={[
        <Link key={1} to='./' className={pathname == '/' ? 'm-selected-nav' : ''}>
          Home
        </Link>,
        <Link key={2} to='./browse' className={pathname == '/browse' ? 'm-selected-nav' : ''}>
          Browse
        </Link>,
        <Link key={3} to='./post' className={pathname == '/post' ? 'm-selected-nav' : ''}>
          Post
        </Link>,
        <Link key={4} to='./register' className={pathname == '/register' ? 'm-selected-nav' : ''}>
          Register
        </Link>,
        <Link key={5} to='./login' className={pathname == '/login' ? 'm-selected-nav' : ''}>
          Login
        </Link>
      ]}
    />
  );
}