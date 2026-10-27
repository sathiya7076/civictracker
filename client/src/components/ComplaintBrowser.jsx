import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listUsersRequest } from '../api/admin.js';
import EmptyState from './EmptyState.jsx';
import ErrorMessage from './ErrorMessage.jsx';
import FormField from './FormField.jsx';
import Pagination from './Pagination.jsx';
import Spinner from './Spinner.jsx';
import StatusBadge from './StatusBadge.jsx';
import { CATEGORIES, PRIORITIES, STATUSES } from '../utils/constants.js';
import { formatDate } from '../utils/formatDate.js';
import { getErrorMessage } from '../utils/getErrorMessage.js';

// Searchable, filterable, paginated complaint list for staff and admin.
// `fetcher(params)` is the API call; `basePath` is where each row links to.
export default function ComplaintBrowser({ title, fetcher, basePath, isAdmin = false }) {
  const [filters, setFilters] = useState({ search: '', status: '', category: '', priority: '', staff: '', sort: 'newest' });
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(filters.search.trim()), 400);
    return () => clearTimeout(t);
  }, [filters.search]);

  useEffect(() => {
    if (!isAdmin) return;
    listUsersRequest({ role: 'staff', status: 'active', limit: 50 })
      .then((res) => setStaffList(res.data.data.items))
      .catch(() => setStaffList([]));
  }, [isAdmin]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    const params = { page, limit: 10, sort: filters.sort };
    if (debouncedSearch) params.search = debouncedSearch;
    ['status', 'category', 'priority', 'staff'].forEach((k) => {
      if (filters[k] && (isAdmin || (k !== 'priority' && k !== 'staff'))) params[k] = filters[k];
    });
    fetcher(params)
      .then((res) => active && setData(res.data.data))
      .catch((err) => active && setError(getErrorMessage(err)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, debouncedSearch, filters.status, filters.category, filters.priority, filters.staff, filters.sort]);

  const handleFilter = (e) => {
    setPage(1);
    setFilters((f) => ({ ...f, [e.target.name]: e.target.value }));
  };
  const hasFilters = debouncedSearch || filters.status || filters.category || filters.priority || filters.staff;

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy-900">{title}</h1>

      <form role="search" onSubmit={(e) => e.preventDefault()} className="mt-4 grid gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-3">
        <FormField label="Search" name="search" type="search" value={filters.search} onChange={handleFilter} placeholder="Title, description or reference" />
        <FormField label="Status" name="status" as="select" value={filters.status} onChange={handleFilter}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </FormField>
        <FormField label="Category" name="category" as="select" value={filters.category} onChange={handleFilter}>
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </FormField>
        {isAdmin && (
          <>
            <FormField label="Priority" name="priority" as="select" value={filters.priority} onChange={handleFilter}>
              <option value="">All priorities</option>
              {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
            </FormField>
            <FormField label="Assigned staff" name="staff" as="select" value={filters.staff} onChange={handleFilter}>
              <option value="">Anyone</option>
              <option value="unassigned">Unassigned</option>
              {staffList.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
            </FormField>
          </>
        )}
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
            title={hasFilters ? 'No complaints match your filters' : 'No complaints here yet'}
            description={hasFilters ? 'Try clearing the search or filters.' : isAdmin ? 'Complaints reported by citizens will appear here.' : 'Complaints assigned to you will appear here.'}
          />
        )}
        {!loading && data && data.items.length > 0 && (
          <>
            <ul className="space-y-3">
              {data.items.map((c) => (
                <li key={c._id} className="card flex flex-wrap items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <Link to={`${basePath}/${c._id}`} className="font-medium text-navy-800 underline-offset-2 hover:underline">{c.title}</Link>
                    <p className="mt-1 text-xs text-slate-500">
                      {c.complaintId} · {c.category} · {c.priority} priority · {formatDate(c.createdAt)}
                    </p>
                    {isAdmin && (
                      <p className="text-xs text-slate-500">
                        Reported by {c.citizenId?.name || '-'} · Assigned to {c.assignedStaffId?.name || 'nobody'}
                      </p>
                    )}
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
