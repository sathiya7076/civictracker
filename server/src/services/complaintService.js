import Complaint from '../models/Complaint.js';
import ComplaintUpdate from '../models/ComplaintUpdate.js';
import ApiError from '../utils/ApiError.js';
import { generateComplaintId } from '../utils/complaintId.js';
import { ROLES } from '../utils/constants.js';
import { uploadImages } from './uploadService.js';

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export async function createComplaint({ user, data, files }) {
  const images = await uploadImages(files);

  let complaint;
  for (let attempt = 0; ; attempt++) {
    try {
      complaint = await Complaint.create({ ...data, images, citizenId: user._id, complaintId: generateComplaintId() });
      break;
    } catch (err) {
      // Extremely unlikely collision on the random suffix: retry with a new reference.
      if (err.code === 11000 && err.keyPattern?.complaintId && attempt < 2) continue;
      throw err;
    }
  }

  await ComplaintUpdate.create({
    complaint: complaint._id,
    actor: user._id,
    previousStatus: null,
    newStatus: 'Pending',
    note: 'Complaint submitted',
  });
  return complaint;
}

// Shared by the citizen, staff and admin lists. `baseFilter` decides whose complaints are visible.
export async function listComplaints(baseFilter, query, populate = []) {
  const { page, limit, status, category, search, sort } = query;
  const filter = { ...baseFilter };
  if (status) filter.status = status;
  if (category) filter.category = category;
  if (search) {
    const rx = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ title: rx }, { description: rx }, { complaintId: rx }];
  }

  let find = Complaint.find(filter)
    .sort({ createdAt: sort === 'oldest' ? 1 : -1 })
    .skip((page - 1) * limit)
    .limit(limit);
  for (const p of populate) find = find.populate(p.path, p.select);

  const [items, total] = await Promise.all([find.lean(), Complaint.countDocuments(filter)]);
  return { items, pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } };
}

export const listMyComplaints = (userId, query) => listComplaints({ citizenId: userId }, query);

// Central ownership rule. Citizens see only their own complaints, staff only assigned ones,
// admins everything. Anyone else gets 404 so the existence of other complaints is not revealed.
export async function getAccessibleComplaint(id, user) {
  const complaint = await Complaint.findById(id);
  const allowed =
    complaint &&
    (user.role === ROLES.ADMIN ||
      (user.role === ROLES.CITIZEN && complaint.citizenId.equals(user._id)) ||
      (user.role === ROLES.STAFF && complaint.assignedStaffId && complaint.assignedStaffId.equals(user._id)));
  if (!allowed) throw ApiError.notFound('Complaint not found');
  return complaint;
}

export async function getComplaintDetails(id, user) {
  const complaint = await getAccessibleComplaint(id, user);
  await complaint.populate('assignedStaffId', 'name');
  if (user.role !== ROLES.CITIZEN) await complaint.populate('citizenId', 'name');
  return complaint;
}

export async function updateOwnComplaint(id, user, data) {
  const complaint = await getAccessibleComplaint(id, user);
  if (complaint.status !== 'Pending') throw ApiError.conflict('Only pending complaints can be edited');
  Object.assign(complaint, data);
  await complaint.save();
  return complaint;
}

export async function deleteOwnComplaint(id, user) {
  const complaint = await getAccessibleComplaint(id, user);
  if (complaint.status !== 'Pending') throw ApiError.conflict('Only pending complaints can be cancelled');
  await ComplaintUpdate.deleteMany({ complaint: complaint._id });
  await complaint.deleteOne();
}

export async function getComplaintUpdates(id, user) {
  const complaint = await getAccessibleComplaint(id, user);
  return ComplaintUpdate.find({ complaint: complaint._id }).sort({ createdAt: 1 }).populate('actor', 'name role');
}
