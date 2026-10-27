export default function StatCard({ label, value }) {
  return (
    <div className="card p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-bold text-navy-900">{value}</p>
    </div>
  );
}
