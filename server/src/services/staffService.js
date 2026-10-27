import Complaint from '../models/Complaint.js';
import { listComplaints } from './complaintService.js';

export const listAssigned = (staffId, query) => listComplaints({ assignedStaffId: staffId }, query);

// completed = Resolved + Closed
export async function getStats(staffId) {
  const rows = await Complaint.aggregate([
    { $match: { assignedStaffId: staffId } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);
  const c = Object.fromEntries(rows.map((r) => [r._id, r.count]));
  const total = rows.reduce((sum, r) => sum + r.count, 0);
  return {
    total,
    assigned: c.Assigned || 0,
    inProgress: c['In Progress'] || 0,
    completed: (c.Resolved || 0) + (c.Closed || 0),
  };
}
