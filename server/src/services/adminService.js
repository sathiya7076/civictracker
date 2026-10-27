import Complaint from '../models/Complaint.js';
import ComplaintUpdate from '../models/ComplaintUpdate.js';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import { CATEGORIES, ROLES, STATUSES } from '../utils/constants.js';
import { assignComplaint, changeStatus } from './workflowService.js';
import { createStaffAccount } from './authService.js';
import { listComplaints } from './complaintService.js';

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

async function findComplaint(id) {
  const complaint = await Complaint.findById(id);
  if (!complaint) throw ApiError.notFound('Complaint not found');
  return complaint;
}

export function listAllComplaints(query) {
  const base = {};
  if (query.priority) base.priority = query.priority;
  if (query.staff === 'unassigned') base.assignedStaffId = null;
  else if (query.staff) base.assignedStaffId = query.staff;
  return listComplaints(base, query, [
    { path: 'citizenId', select: 'name' },
    { path: 'assignedStaffId', select: 'name' },
  ]);
}

export async function assign(id, admin, { staffId, note }) {
  return assignComplaint({ complaint: await findComplaint(id), admin, staffId, note });
}

export async function setPriority(id, priority) {
  const complaint = await findComplaint(id);
  complaint.priority = priority;
  await complaint.save();
  return complaint;
}

// Admin verifies the resolution evidence, then closes (or sends back to In Progress).
export async function verify(id, admin, { action, note }) {
  const complaint = await findComplaint(id);
  if (action === 'close') {
    if (complaint.status === 'Resolved' && complaint.resolutionEvidence.length === 0) {
      throw ApiError.conflict('Cannot close: no resolution evidence has been uploaded');
    }
    return changeStatus({ complaint, actor: admin, newStatus: 'Closed', note: note || 'Resolution verified and closed' });
  }
  return changeStatus({ complaint, actor: admin, newStatus: 'In Progress', note });
}

export async function reject(id, admin, { note }) {
  return changeStatus({ complaint: await findComplaint(id), actor: admin, newStatus: 'Rejected', note });
}

export async function listUsers({ page, limit, role, status, search }) {
  const filter = {};
  if (role) filter.role = role;
  if (status) filter.accountStatus = status;
  if (search) {
    const rx = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ name: rx }, { email: rx }];
  }
  const [items, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    User.countDocuments(filter),
  ]);
  return { items, pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } };
}

export const createStaff = (data) => createStaffAccount(data);

export async function setUserStatus(admin, id, status) {
  const target = await User.findById(id);
  if (!target) throw ApiError.notFound('User not found');
  if (target._id.equals(admin._id)) throw ApiError.badRequest('You cannot change your own account status');
  if (target.role === ROLES.ADMIN) throw ApiError.forbidden('Administrator accounts cannot be suspended here');
  target.accountStatus = status;
  await target.save();
  return target;
}

// "inProgress" counts status "In Progress" only; "resolved" counts "Resolved" only (Closed is separate).
export async function getDashboard() {
  const [total, byStatusRaw, byCategoryRaw, recentActivity] = await Promise.all([
    Complaint.countDocuments(),
    Complaint.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Complaint.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]),
    ComplaintUpdate.find()
      .sort({ createdAt: -1 })
      .limit(8)
      .populate('complaint', 'complaintId title')
      .populate('actor', 'name role')
      .lean(),
  ]);
  const byStatus = Object.fromEntries(STATUSES.map((s) => [s, 0]));
  byStatusRaw.forEach((r) => (byStatus[r._id] = r.count));
  const byCategory = Object.fromEntries(CATEGORIES.map((c) => [c, 0]));
  byCategoryRaw.forEach((r) => (byCategory[r._id] = r.count));

  return {
    totals: { total, pending: byStatus.Pending, inProgress: byStatus['In Progress'], resolved: byStatus.Resolved },
    byStatus,
    byCategory,
    recentActivity,
  };
}
