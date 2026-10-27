import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const linkClass = ({ isActive }) =>
  `rounded-md px-3 py-2 text-sm font-medium ${isActive ? 'bg-navy-700 text-white' : 'text-navy-100 hover:bg-navy-800'}`;

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    setOpen(false);
    await logout();
    navigate('/login');
  };

  const close = () => setOpen(false);

  return (
    <header className="bg-navy-900">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3" aria-label="Main navigation">
        <Link to="/" className="text-lg font-bold text-white">
          CivicTrack
        </Link>

        <button
          type="button"
          className="rounded-md p-2 text-white md:hidden"
          aria-expanded={open}
          aria-controls="main-menu"
          onClick={() => setOpen((o) => !o)}
        >
          <span className="sr-only">{open ? 'Close menu' : 'Open menu'}</span>
          <span aria-hidden="true">{open ? '✕' : '☰'}</span>
        </button>

        <ul
          id="main-menu"
          className={`${open ? 'flex' : 'hidden'} absolute left-0 right-0 top-14 z-10 flex-col gap-1 bg-navy-900 p-4 md:static md:flex md:flex-row md:items-center md:p-0`}
        >
          <li><NavLink to="/" end className={linkClass} onClick={close}>Home</NavLink></li>
          <li><NavLink to="/about" className={linkClass} onClick={close}>About</NavLink></li>
          {user ? (
            <>
              <li><NavLink to="/dashboard" className={linkClass} onClick={close}>Dashboard</NavLink></li>
              <li>
                <button type="button" onClick={handleLogout} className="rounded-md px-3 py-2 text-sm font-medium text-navy-100 hover:bg-navy-800">
                  Log out
                </button>
              </li>
            </>
          ) : (
            <>
              <li><NavLink to="/login" className={linkClass} onClick={close}>Log in</NavLink></li>
              <li><NavLink to="/register" className={linkClass} onClick={close}>Register</NavLink></li>
            </>
          )}
        </ul>
      </nav>
    </header>
  );
}
