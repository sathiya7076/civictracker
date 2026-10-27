import { asyncHandler } from '../utils/asyncHandler.js';
import * as admin from '../services/adminService.js';

export const dashboard = asyncHandler(async (_req, res) => {
  res.json({ success: true, data: await admin.getDashboard() });
});

export const complaints = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await admin.listAllComplaints(req.validated.query) });
});

export const assign = asyncHandler(async (req, res) => {
  const complaint = await admin.assign(req.params.id, req.user, req.body);
  res.json({ success: true, message: 'Complaint assigned', data: { complaint } });
});

export const priority = asyncHandler(async (req, res) => {
  const complaint = await admin.setPriority(req.params.id, req.body.priority);
  res.json({ success: true, message: 'Priority updated', data: { complaint } });
});

export const verify = asyncHandler(async (req, res) => {
  const complaint = await admin.verify(req.params.id, req.user, req.body);
  res.json({ success: true, message: req.body.action === 'close' ? 'Complaint closed' : 'Complaint reopened', data: { complaint } });
});

export const reject = asyncHandler(async (req, res) => {
  const complaint = await admin.reject(req.params.id, req.user, req.body);
  res.json({ success: true, message: 'Complaint rejected', data: { complaint } });
});

export const users = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await admin.listUsers(req.validated.query) });
});

export const createStaff = asyncHandler(async (req, res) => {
  const user = await admin.createStaff(req.body);
  res.status(201).json({ success: true, message: 'Staff account created', data: { user } });
});

export const setUserStatus = asyncHandler(async (req, res) => {
  const user = await admin.setUserStatus(req.user, req.params.id, req.body.status);
  res.json({ success: true, message: 'Account status updated', data: { user } });
});
