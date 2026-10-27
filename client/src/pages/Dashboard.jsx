import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminDashboardRequest } from '../api/admin.js';
import { staffStatsRequest } from '../api/staff.js';
import ErrorMessage from '../components/ErrorMessage.jsx';
import Spinner from '../components/Spinner.jsx';
import StatCard from '../components/StatCard.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { formatDate } from '../utils/formatDate.js';
import { getErrorMessage } from '../utils/getErrorMessage.js';

function Header({ user }) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-navy-900">Welcome, {user.name}</h1>
      <p className="mt-1 text-sm text-slate-500">
        Signed in as <span className="rounded bg-navy-50 px-2 py-0.5 font-medium capitalize text-navy-800">{user.role}</span>
      </p>
    </div>
  );
}

function CitizenDashboard({ user }) {
  return (
    <section className="card">
      <Header user={user} />
      <div className="mt-6 flex flex-wrap gap-3">
        <Link to="/complaints/new" className="btn-primary">Report an issue</Link>
        <Link to="/complaints" className="btn-secondary">View my complaints</Link>
      </div>
    </section>
  );
}

function StaffDashboard({ user }) {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    staffStatsRequest().then((r) => setStats(r.data.data.stats)).catch((e) => setError(getErrorMessage(e)));
  }, []);
  return (
    <div className="space-y-6">
      <section className="card"><Header user={user} /></section>
      <ErrorMessage message={error} />
      {!stats && !error && <Spinner />}
      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total assigned" value={stats.total} />
          <StatCard label="Waiting to start" value={stats.assigned} />
          <StatCard label="In progress" value={stats.inProgress} />
          <StatCard label="Completed" value={stats.completed} />
        </div>
      )}
      <Link to="/staff/complaints" className="btn-primary">View assigned complaints</Link>
    </div>
  );
}

function AdminDashboard({ user }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    adminDashboardRequest().then((r) => setData(r.data.data)).catch((e) => setError(getErrorMessage(e)));
  }, []);

  const maxCategory = data ? Math.max(1, ...Object.values(data.byCategory)) : 1;
  return (
    <div className="space-y-6">
      <section className="card"><Header user={user} /></section>
      <ErrorMessage message={error} />
      {!data && !error && <Spinner />}
      {data && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total complaints" value={data.totals.total} />
            <StatCard label="Pending" value={data.totals.pending} />
            <StatCard label="In progress" value={data.totals.inProgress} />
            <StatCard label="Resolved (awaiting closure)" value={data.totals.resolved} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="card" aria-labelledby="by-category">
              <h2 id="by-category" className="text-lg font-semibold text-navy-900">Complaints by category</h2>
              <ul className="mt-4 space-y-3">
                {Object.entries(data.byCategory).map(([name, count]) => (
                  <li key={name}>
                    <div className="flex justify-between text-sm"><span>{name}</span><span className="font-medium">{count}</span></div>
                    <div className="mt-1 h-2 rounded bg-slate-100"><div className="h-2 rounded bg-navy-600" style={{ width: `${(count / maxCategory) * 100}%` }} /></div>
                  </li>
                ))}
              </ul>
            </section>

            <section className="card" aria-labelledby="recent">
              <h2 id="recent" className="text-lg font-semibold text-navy-900">Recent activity</h2>
              {data.recentActivity.length === 0 ? (
                <p className="mt-2 text-sm text-slate-600">No activity yet.</p>
              ) : (
                <ul className="mt-4 space-y-3 text-sm">
                  {data.recentActivity.map((a) => (
                    <li key={a._id}>
                      <Link to={`/admin/complaints/${a.complaint?._id}`} className="font-medium text-navy-800 hover:underline">{a.complaint?.complaintId || 'Deleted complaint'}</Link>
                      <span className="text-slate-600"> {a.newStatus} by {a.actor?.name || 'unknown'}</span>
                      <p className="text-xs text-slate-500">{formatDate(a.createdAt)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  if (user.role === 'admin') return <AdminDashboard user={user} />;
  if (user.role === 'staff') return <StaffDashboard user={user} />;
  return <CitizenDashboard user={user} />;
}
