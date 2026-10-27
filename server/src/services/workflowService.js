import Complaint from '../models/Complaint.js';
import ComplaintUpdate from '../models/ComplaintUpdate.js';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import { ACCOUNT_STATUS, ROLES } from '../utils/constants.js';
import { canTransition } from '../utils/statusTransitions.js';
import { notify } from './notificationService.js';
import { uploadImages } from './uploadService.js';

const CONFLICT = 'This complaint was just changed by someone else. Reload the page and try again.';

export async function changeStatus({ complaint, actor, newStatus, note }) {
  const previousStatus = complaint.status;
  if (!canTransition(previousStatus, newStatus, actor.role)) {
    throw ApiError.conflict(`Cannot change status from "${previousStatus}" to "${newStatus}"`);
  }
  // Atomic: only succeeds if nobody changed the status since we read it.
  const updated = await Complaint.findOneAndUpdate(
    { _id: complaint._id, status: previousStatus },
    { $set: { status: newStatus } },
    { new: true }
  );
  if (!updated) throw ApiError.conflict(CONFLICT);

  await ComplaintUpdate.create({ complaint: updated._id, actor: actor._id, previousStatus, newStatus, note });
  await notify(
    updated.citizenId,
    updated,
    `Your complaint ${updated.complaintId} is now "${newStatus}"`,
    newStatus === 'Resolved' ? 'feedback_request' : 'status_change'
  );
  return updated;
}

export async function assignComplaint({ complaint, admin, staffId, note }) {
  const staff = await User.findOne({ _id: staffId, role: ROLES.STAFF, accountStatus: ACCOUNT_STATUS.ACTIVE });
  if (!staff) throw ApiError.badRequest('Choose an active staff member');
  const previousStatus = complaint.status;
  if (!['Pending', 'Assigned'].includes(previousStatus)) {
    throw ApiError.conflict('Only Pending or Assigned complaints can be assigned');
  }
  const updated = await Complaint.findOneAndUpdate(
    { _id: complaint._id, status: previousStatus },
    { $set: { status: 'Assigned', assignedStaffId: staff._id } },
    { new: true }
  );
  if (!updated) throw ApiError.conflict(CONFLICT);

  await ComplaintUpdate.create({
    complaint: updated._id,
    actor: admin._id,
    previousStatus,
    newStatus: 'Assigned',
    note: note || `Assigned to ${staff.name}`,
  });
  await notify(staff._id, updated, `You were assigned complaint ${updated.complaintId}`, 'assignment');
  await notify(updated.citizenId, updated, `Your complaint ${updated.complaintId} was assigned to a staff member`);
  return updated;
}

export async function addEvidence({ complaint, actor, files, note }) {
  if (!['In Progress', 'Resolved'].includes(complaint.status)) {
    throw ApiError.conflict('Evidence can only be added while a complaint is In Progress or Resolved');
  }
  const urls = await uploadImages(files, 'civictrack/evidence');
  const updated = await Complaint.findByIdAndUpdate(
    complaint._id,
    { $push: { resolutionEvidence: { $each: urls } } },
    { new: true }
  );
  await ComplaintUpdate.create({
    complaint: updated._id,
    actor: actor._id,
    previousStatus: updated.status,
    newStatus: updated.status,
    note: note || 'Evidence uploaded',
    evidenceImages: urls,
  });
  return updated;
}
