import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const linksByRole = {
  citizen: [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/complaints/new', label: 'New complaint' },
    { to: '/complaints', label: 'My complaints', end: true },
  ],
  staff: [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/staff/complaints', label: 'Assigned complaints' },
  ],
  admin: [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/admin/complaints', label: 'All complaints' },
    { to: '/admin/staff', label: 'Staff' },
    { to: '/admin/users', label: 'Users' },
  ],
};

const linkClass = ({ isActive }) =>
  `whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium ${isActive ? 'bg-navy-700 text-white' : 'text-navy-800 hover:bg-navy-100'}`;

// Sidebar on desktop, horizontally scrollable tab bar on mobile.
export default function DashboardLayout() {
  const { user } = useAuth();
  const links = linksByRole[user.role] || [];
  return (
    <div className="grid gap-6 md:grid-cols-[13rem_1fr]">
      <nav aria-label="Dashboard" className="flex gap-2 overflow-x-auto md:flex-col md:self-start md:rounded-lg md:border md:border-slate-200 md:bg-white md:p-3">
        {links.map((l) => (
          <NavLink key={l.to} to={l.to} end={l.end ?? l.to === '/dashboard'} className={linkClass}>
            {l.label}
          </NavLink>
        ))}
      </nav>
      <div className="min-w-0">
        <Outlet />
      </div>
    </div>
  );
}
