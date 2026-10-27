import { asyncHandler } from '../utils/asyncHandler.js';
import * as complaintService from '../services/complaintService.js';

export const create = asyncHandler(async (req, res) => {
  const complaint = await complaintService.createComplaint({ user: req.user, data: req.body, files: req.files });
  res.status(201).json({ success: true, message: 'Complaint submitted', data: { complaint } });
});

export const listMine = asyncHandler(async (req, res) => {
  const data = await complaintService.listMyComplaints(req.user._id, req.validated.query);
  res.json({ success: true, data });
});

export const getOne = asyncHandler(async (req, res) => {
  const complaint = await complaintService.getComplaintDetails(req.params.id, req.user);
  res.json({ success: true, data: { complaint } });
});

export const update = asyncHandler(async (req, res) => {
  const complaint = await complaintService.updateOwnComplaint(req.params.id, req.user, req.body);
  res.json({ success: true, message: 'Complaint updated', data: { complaint } });
});

export const remove = asyncHandler(async (req, res) => {
  await complaintService.deleteOwnComplaint(req.params.id, req.user);
  res.json({ success: true, message: 'Complaint cancelled' });
});

export const getUpdates = asyncHandler(async (req, res) => {
  const updates = await complaintService.getComplaintUpdates(req.params.id, req.user);
  res.json({ success: true, data: { updates } });
});
