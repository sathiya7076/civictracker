export default function Spinner({ label = 'Loading...' }) {
  return (
    <div role="status" className="flex items-center justify-center gap-3 p-8 text-slate-600">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-navy-200 border-t-navy-700" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
