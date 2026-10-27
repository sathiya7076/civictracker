import { useEffect, useMemo } from 'react';

// Thumbnails of files the user picked, with a remove button for each.
export default function ImagePreview({ files, onRemove }) {
  const urls = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  useEffect(() => () => urls.forEach((u) => URL.revokeObjectURL(u)), [urls]);

  if (!files.length) return null;
  return (
    <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
      {files.map((file, i) => (
        <li key={`${file.name}-${i}`} className="relative overflow-hidden rounded-md border border-slate-200 bg-white">
          <img src={urls[i]} alt={`Preview of ${file.name}`} className="h-28 w-full object-cover" />
          <button
            type="button"
            onClick={() => onRemove(i)}
            className="absolute right-1 top-1 rounded bg-white/90 px-2 py-0.5 text-xs font-medium text-red-700"
            aria-label={`Remove ${file.name}`}
          >
            Remove
          </button>
        </li>
      ))}
    </ul>
  );
}
