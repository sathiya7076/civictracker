import StatusBadge from './StatusBadge.jsx';
import { formatDate } from '../utils/formatDate.js';

function Photos({ title, urls, label }) {
  if (!urls?.length) return null;
  return (
    <>
      <h2 className="mt-6 text-sm font-medium text-slate-500">{title}</h2>
      <ul className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {urls.map((src, i) => (
          <li key={src}>
            <a href={src} target="_blank" rel="noreferrer noopener">
              <img src={src} alt={`${label} ${i + 1}`} className="h-32 w-full rounded-md border border-slate-200 object-cover" loading="lazy" />
            </a>
          </li>
        ))}
      </ul>
    </>
  );
}

// Read-only details used by citizen, staff and admin pages. `children` renders extra actions.
export default function ComplaintSummary({ complaint, showCitizen = false, children }) {
  const hasCoords = complaint.latitude != null && complaint.longitude != null;
  return (
    <section className="card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-slate-500">{complaint.complaintId}</p>
          <h1 className="text-2xl font-bold text-navy-900">{complaint.title}</h1>
        </div>
        <StatusBadge status={complaint.status} />
      </div>

      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div><dt className="font-medium text-slate-500">Category</dt><dd>{complaint.category}</dd></div>
        <div><dt className="font-medium text-slate-500">Priority</dt><dd>{complaint.priority}</dd></div>
        <div><dt className="font-medium text-slate-500">Address</dt><dd>{complaint.address}</dd></div>
        <div><dt className="font-medium text-slate-500">Submitted</dt><dd>{formatDate(complaint.createdAt)}</dd></div>
        <div><dt className="font-medium text-slate-500">Assigned to</dt><dd>{complaint.assignedStaffId?.name || 'Not assigned yet'}</dd></div>
        {showCitizen && <div><dt className="font-medium text-slate-500">Reported by</dt><dd>{complaint.citizenId?.name || '-'}</dd></div>}
        {hasCoords && <div><dt className="font-medium text-slate-500">Coordinates</dt><dd>{complaint.latitude}, {complaint.longitude}</dd></div>}
      </dl>

      <h2 className="mt-6 text-sm font-medium text-slate-500">Description</h2>
      <p className="mt-1 whitespace-pre-line text-slate-700">{complaint.description}</p>

      <Photos title="Photos from the citizen" urls={complaint.images} label="Complaint photo" />
      <Photos title="Completion evidence" urls={complaint.resolutionEvidence} label="Evidence photo" />

      {children}
    </section>
  );
}
