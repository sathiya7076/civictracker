export default function About() {
  return (
    <article className="card max-w-3xl space-y-4">
      <h1 className="text-2xl font-bold text-navy-900">About CivicTrack</h1>
      <p className="text-slate-600">
        CivicTrack is a full-stack portfolio project built with React, Express and MongoDB. Citizens report problems, administrators assign them to field staff, and staff post progress until the issue is resolved.
      </p>
      <p className="text-slate-600">
        Reports made here are stored in this application only. They are not automatically forwarded to any municipality.
      </p>
    </article>
  );
}
