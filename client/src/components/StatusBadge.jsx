const styles = {
  Pending: 'bg-amber-100 text-amber-800',
  Assigned: 'bg-navy-100 text-navy-800',
  'In Progress': 'bg-orange-100 text-orange-800',
  Resolved: 'bg-green-100 text-green-800',
  Closed: 'bg-slate-200 text-slate-700',
  Rejected: 'bg-red-100 text-red-800',
};

// The status is always shown as text, so meaning never depends on colour alone.
export default function StatusBadge({ status }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status] || 'bg-slate-100 text-slate-700'}`}>
      {status}
    </span>
  );
}
