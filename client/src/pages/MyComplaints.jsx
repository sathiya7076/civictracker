import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listMyComplaintsRequest } from '../api/complaints.js';
import EmptyState from '../components/EmptyState.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import FormField from '../components/FormField.jsx';
import Pagination from '../components/Pagination.jsx';
import Spinner from '../components/Spinner.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { CATEGORIES, STATUSES } from '../utils/constants.js';
import { formatDate } from '../utils/formatDate.js';
import { getErrorMessage } from '../utils/getErrorMessage.js';

export default function MyComplaints() {
  const [filters, setFilters] = useState({ search: '', status: '', category: '', sort: 'newest' });
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(filters.search.trim()), 400);
    return () => clearTimeout(t);
  }, [filters.search]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    const params = { page, limit: 10, sort: filters.sort };
    if (debouncedSearch) params.search = debouncedSearch;
    if (filters.status) params.status = filters.status;
    if (filters.category) params.category = filters.category;

    listMyComplaintsRequest(params)
      .then((res) => active && setData(res.data.data))
      .catch((err) => active && setError(getErrorMessage(err)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [page, debouncedSearch, filters.status, filters.category, filters.sort]);

  const handleFilter = (e) => {
    setPage(1);
    setFilters((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const hasFilters = debouncedSearch || filters.status || filters.category;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-navy-900">My complaints</h1>
        <Link to="/complaints/new" className="btn-primary">New complaint</Link>
      </div>

      <form role="search" onSubmit={(e) => e.preventDefault()} className="mt-4 grid gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
        <FormField label="Search" name="search" type="search" value={filters.search} onChange={handleFilter} placeholder="Title, description or reference" />
        <FormField label="Status" name="status" as="select" value={filters.status} onChange={handleFilter}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </FormField>
        <FormField label="Category" name="category" as="select" value={filters.category} onChange={handleFilter}>
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </FormField>
        <FormField label="Sort" name="sort" as="select" value={filters.sort} onChange={handleFilter}>
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
        </FormField>
      </form>

      <div className="mt-6">
        <ErrorMessage message={error} />
        {loading && <Spinner />}
        {!loading && !error && data && data.items.length === 0 && (
          <EmptyState
            title={hasFilters ? 'No complaints match your filters' : 'You have not reported anything yet'}
            description={hasFilters ? 'Try clearing the search or filters.' : 'Report a problem and you can follow its progress here.'}
          >
            {!hasFilters && <Link to="/complaints/new" className="btn-primary">Report an issue</Link>}
          </EmptyState>
        )}
        {!loading && data && data.items.length > 0 && (
          <>
            <ul className="space-y-3">
              {data.items.map((c) => (
                <li key={c._id} className="card flex flex-wrap items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <Link to={`/complaints/${c._id}`} className="font-medium text-navy-800 underline-offset-2 hover:underline">{c.title}</Link>
                    <p className="mt-1 text-xs text-slate-500">{c.complaintId} · {c.category} · {formatDate(c.createdAt)}</p>
                  </div>
                  <StatusBadge status={c.status} />
                </li>
              ))}
            </ul>
            <Pagination page={data.pagination.page} totalPages={data.pagination.totalPages} onPageChange={setPage} />
          </>
        )}
      </div>
    </div>
  );
}
