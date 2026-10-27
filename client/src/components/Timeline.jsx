import StatusBadge from './StatusBadge.jsx';
import { formatDate } from '../utils/formatDate.js';

export default function Timeline({ updates }) {
  return (
    <section className="card" aria-labelledby="timeline-title">
      <h2 id="timeline-title" className="text-lg font-semibold text-navy-900">Progress timeline</h2>
      {updates.length === 0 ? (
        <p className="mt-2 text-sm text-slate-600">No updates yet.</p>
      ) : (
        <ol className="mt-4 space-y-4 border-l-2 border-navy-100 pl-4">
          {updates.map((u) => (
            <li key={u._id}>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={u.newStatus} />
                <span className="text-xs text-slate-500">{formatDate(u.createdAt)}</span>
              </div>
              {u.note && <p className="mt-1 text-sm text-slate-700">{u.note}</p>}
              {u.evidenceImages?.length > 0 && (
                <ul className="mt-2 flex flex-wrap gap-2">
                  {u.evidenceImages.map((src, i) => (
                    <li key={src}>
                      <a href={src} target="_blank" rel="noreferrer noopener">
                        <img src={src} alt={`Evidence ${i + 1}`} className="h-16 w-16 rounded border border-slate-200 object-cover" loading="lazy" />
                      </a>
                    </li>
                  ))}
                </ul>
              )}
              {u.actor?.name && <p className="text-xs text-slate-500">by {u.actor.name}</p>}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
