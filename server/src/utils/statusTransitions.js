// Single source of truth for the complaint workflow. Enforced on the server only;
// the UI just mirrors it. Assigning/reassigning is handled by assignComplaint (admin).
//   Pending -> Assigned -> In Progress -> Resolved -> Closed
//   Pending/Assigned -> Rejected (admin)        Resolved -> In Progress (admin reopen)
export const TRANSITIONS = {
  Pending: { Assigned: ['admin'], Rejected: ['admin'] },
  Assigned: { 'In Progress': ['staff', 'admin'], Rejected: ['admin'] },
  'In Progress': { Resolved: ['staff', 'admin'] },
  Resolved: { Closed: ['admin'], 'In Progress': ['admin'] },
  Closed: {},
  Rejected: {},
};

export const canTransition = (from, to, role) => TRANSITIONS[from]?.[to]?.includes(role) ?? false;
