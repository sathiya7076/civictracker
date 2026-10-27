import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const categories = [
  'Road damage and potholes',
  'Garbage collection',
  'Broken streetlights',
  'Water leakage',
  'Drainage and sewage',
  'Other public infrastructure',
];

export default function Home() {
  const { user } = useAuth();
  return (
    <div className="space-y-10">
      <section className="rounded-lg bg-white p-8 shadow-sm sm:p-12">
        <h1 className="text-3xl font-bold text-navy-900 sm:text-4xl">Report civic issues. Track every step.</h1>
        <p className="mt-4 max-w-2xl text-slate-600">
          CivicTrack lets citizens log public infrastructure problems, follow repair progress and give feedback once the work is done.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          {user ? (
            <Link to="/dashboard" className="btn-primary">Go to dashboard</Link>
          ) : (
            <>
              <Link to="/register" className="btn-primary">Create an account</Link>
              <Link to="/login" className="btn-secondary">Log in</Link>
            </>
          )}
        </div>
      </section>

      <section aria-labelledby="cats">
        <h2 id="cats" className="text-xl font-semibold text-navy-900">What can you report?</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c) => (
            <li key={c} className="card py-4 text-sm font-medium text-slate-700">{c}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
