import { useCallback, useEffect, useState } from 'react';
import { createStaffRequest, listUsersRequest, setUserStatusRequest } from '../api/admin.js';
import { useAuth } from '../context/AuthContext.jsx';
import ConfirmDialog from './ConfirmDialog.jsx';
import EmptyState from './EmptyState.jsx';
import ErrorMessage from './ErrorMessage.jsx';
import FormField from './FormField.jsx';
import Pagination from './Pagination.jsx';
import Spinner from './Spinner.jsx';
import { formatDate } from '../utils/formatDate.js';
import { getErrorMessage } from '../utils/getErrorMessage.js';

const emptyForm = { name: '', email: '', phone: '', password: '' };

// Admin screen for listing accounts. fixedRole='staff' + allowCreate gives the staff management page.
export default function UserManager({ title, fixedRole, allowCreate = false }) {
  const { user: me } = useAuth();
  const [filters, setFilters] = useState({ search: '', role: '', status: '' });
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [target, setTarget] = useState(null); // user awaiting suspend confirmation
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState({});
  const [formApiError, setFormApiError] = useState('');
  const [created, setCreated] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(filters.search.trim()), 400);
    return () => clearTimeout(t);
  }, [filters.search]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    const params = { page, limit: 10 };
    const role = fixedRole || filters.role;
    if (role) params.role = role;
    if (filters.status) params.status = filters.status;
    if (debouncedSearch) params.search = debouncedSearch;
    listUsersRequest(params)
      .then((res) => active && setData(res.data.data))
      .catch((err) => active && setError(getErrorMessage(err)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [page, debouncedSearch, filters.role, filters.status, fixedRole, reloadKey]);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  const handleFilter = (e) => {
    setPage(1);
    setFilters((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const changeStatus = async (user, status) => {
    setBusy(true);
    try {
      await setUserStatusRequest(user._id, { status });
      setTarget(null);
      reload();
    } catch (err) {
      setTarget(null);
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const validateForm = () => {
    const next = {};
    if (form.name.trim().length < 2) next.name = 'Name must be at least 2 characters';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = 'Enter a valid email address';
    if (form.phone && !/^[0-9+\-\s()]{7,20}$/.test(form.phone)) next.phone = 'Enter a valid phone number';
    if (form.password.length < 8 || !/[A-Za-z]/.test(form.password) || !/[0-9]/.test(form.password)) {
      next.password = 'At least 8 characters with a letter and a number';
    }
    return next;
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormApiError('');
    setCreated('');
    const found = validateForm();
    setFormErrors(found);
    if (Object.keys(found).length) return;
    setBusy(true);
    try {
      await createStaffRequest({ name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim(), password: form.password });
      setCreated(`Staff account created for ${form.email.trim()}. Share the password with them securely.`);
      setForm(emptyForm);
      setPage(1);
      reload();
    } catch (err) {
      setFormApiError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const onForm = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-navy-900">{title}</h1>

      {allowCreate && (
        <section className="card" aria-labelledby="create-staff">
          <h2 id="create-staff" className="text-lg font-semibold text-navy-900">Create staff account</h2>
          <form onSubmit={handleCreate} noValidate className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2"><ErrorMessage message={formApiError} /></div>
            {created && <p role="status" className="text-sm text-green-700 sm:col-span-2">{created}</p>}
            <FormField label="Full name" name="name" value={form.name} onChange={onForm} error={formErrors.name} />
            <FormField label="Email" name="email" type="email" value={form.email} onChange={onForm} error={formErrors.email} />
            <FormField label="Phone (optional)" name="phone" type="tel" value={form.phone} onChange={onForm} error={formErrors.phone} />
            <FormField label="Temporary password" name="password" type="password" autoComplete="new-password" value={form.password} onChange={onForm} error={formErrors.password} />
            <div className="sm:col-span-2"><button type="submit" className="btn-primary" disabled={busy}>Create staff account</button></div>
          </form>
        </section>
      )}

      <form role="search" onSubmit={(e) => e.preventDefault()} className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-3">
        <FormField label="Search" name="search" type="search" value={filters.search} onChange={handleFilter} placeholder="Name or email" />
        {!fixedRole && (
          <FormField label="Role" name="role" as="select" value={filters.role} onChange={handleFilter}>
            <option value="">All roles</option>
            <option value="citizen">Citizen</option>
            <option value="staff">Staff</option>
            <option value="admin">Admin</option>
          </FormField>
        )}
        <FormField label="Account status" name="status" as="select" value={filters.status} onChange={handleFilter}>
          <option value="">Any</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </FormField>
      </form>

      <div>
        <ErrorMessage message={error} />
        {loading && <Spinner />}
        {!loading && data && data.items.length === 0 && <EmptyState title="No users found" description="Try changing the filters." />}
        {!loading && data && data.items.length > 0 && (
          <>
            <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
              <table className="min-w-full text-left text-sm">
                <caption className="sr-only">{title}</caption>
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th scope="col" className="px-4 py-3">Name</th>
                    <th scope="col" className="px-4 py-3">Email</th>
                    <th scope="col" className="px-4 py-3">Role</th>
                    <th scope="col" className="px-4 py-3">Status</th>
                    <th scope="col" className="px-4 py-3">Joined</th>
                    <th scope="col" className="px-4 py-3"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.items.map((u) => (
                    <tr key={u._id}>
                      <td className="px-4 py-3 font-medium">{u.name}</td>
                      <td className="px-4 py-3">{u.email}</td>
                      <td className="px-4 py-3 capitalize">{u.role}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${u.accountStatus === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{u.accountStatus}</span>
                      </td>
                      <td className="px-4 py-3">{formatDate(u.createdAt)}</td>
                      <td className="px-4 py-3 text-right">
                        {u.role !== 'admin' && u._id !== me._id && (
                          u.accountStatus === 'active' ? (
                            <button type="button" className="btn-secondary text-red-700" onClick={() => setTarget(u)}>Suspend</button>
                          ) : (
                            <button type="button" className="btn-secondary" disabled={busy} onClick={() => changeStatus(u, 'active')}>Reactivate</button>
                          )
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={data.pagination.page} totalPages={data.pagination.totalPages} onPageChange={setPage} />
          </>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(target)}
        title={`Suspend ${target?.name || 'this user'}?`}
        message="They will be signed out immediately and cannot log in until you reactivate the account."
        confirmLabel="Suspend"
        busy={busy}
        onConfirm={() => changeStatus(target, 'suspended')}
        onCancel={() => setTarget(null)}
      />
    </div>
  );
}
