import { asyncHandler } from '../utils/asyncHandler.js';
import {
  createComplaint as create,
  deleteOwnComplaint,
  getComplaintDetails,
  getComplaintUpdates,
  listMyComplaints,
  updateOwnComplaint,
} from '../services/complaintService.js';

// CITIZEN: submit a complaint (multipart: fields + images[])
export const createComplaint = asyncHandler(async (req, res) => {
  const complaint = await create({ user: req.user, data: req.body, files: req.files });
  res.status(201).json({ success: true, message: 'Complaint submitted', data: { complaint } });
});

// CITIZEN: my complaints (pagination, filters, search)
export const listMine = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await listMyComplaints(req.user._id, req.validated.query) });
});

// OWNER citizen / assigned staff / admin
export const getOne = asyncHandler(async (req, res) => {
  res.json({ success: true, data: { complaint: await getComplaintDetails(req.params.id, req.user) } });
});

export const getUpdates = asyncHandler(async (req, res) => {
  res.json({ success: true, data: { updates: await getComplaintUpdates(req.params.id, req.user) } });
});

// CITIZEN: edit own complaint (Pending only)
export const update = asyncHandler(async (req, res) => {
  const complaint = await updateOwnComplaint(req.params.id, req.user, req.body);
  res.json({ success: true, message: 'Complaint updated', data: { complaint } });
});

// CITIZEN: cancel own complaint (Pending only)
export const remove = asyncHandler(async (req, res) => {
  await deleteOwnComplaint(req.params.id, req.user);
  res.json({ success: true, message: 'Complaint cancelled' });
});