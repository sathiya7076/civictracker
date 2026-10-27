import ApiError from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getAccessibleComplaint } from '../services/complaintService.js';
import { addEvidence, changeStatus } from '../services/workflowService.js';
import { getStats, listAssigned } from '../services/staffService.js';

export const listMine = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await listAssigned(req.user._id, req.validated.query) });
});

export const stats = asyncHandler(async (req, res) => {
  res.json({ success: true, data: { stats: await getStats(req.user._id) } });
});

export const updateStatus = asyncHandler(async (req, res) => {
  const complaint = await getAccessibleComplaint(req.params.id, req.user); // staff: assigned only
  const updated = await changeStatus({ complaint, actor: req.user, newStatus: req.body.status, note: req.body.note });
  res.json({ success: true, message: 'Status updated', data: { complaint: updated } });
});

export const uploadEvidence = asyncHandler(async (req, res) => {
  if (!req.files?.length) throw ApiError.badRequest('Attach at least one image (field name: images)');
  const complaint = await getAccessibleComplaint(req.params.id, req.user);
  const updated = await addEvidence({ complaint, actor: req.user, files: req.files, note: req.body.note });
  res.status(201).json({ success: true, message: 'Evidence uploaded', data: { complaint: updated } });
});
