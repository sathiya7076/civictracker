import Complaint from '../models/Complaint.js';
import ApiError from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ROLES } from '../utils/constants.js';

const isStaff = (user) => [ROLES.STAFF, ROLES.ADMIN].includes(user.role);
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// CITIZEN: raise a complaint
export const createComplaint = asyncHandler(async (req, res) => {
  const complaint = await Complaint.create({ ...req.body, user: req.user._id });
  res.status(201).json({
    success: true,
    message: 'Complaint submitted successfully',
    data: complaint,
  });
});

// CITIZEN -> own complaints only | STAFF/ADMIN -> all complaints
// Supports ?page&limit&status&category&search&sort
export const listComplaints = asyncHandler(async (req, res) => {
  const { page, limit, status, category, search, sort } = req.validated.query;

  const filter = {};
  if (!isStaff(req.user)) filter.user = req.user._id;
  if (status) filter.status = status;
  if (category) filter.category = category;
  if (search) {
    const rx = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ title: rx }, { description: rx }, { address: rx }];
  }

  const [items, total] = await Promise.all([
    Complaint.find(filter)
      .sort({ createdAt: sort === 'oldest' ? 1 : -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('user', 'name email phone')
      .populate('responses.staff', 'name'),
    Complaint.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: items,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

// OWNER or STAFF: view one complaint with responses
export const getComplaintById = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id)
    .populate('user', 'name email phone')
    .populate('responses.staff', 'name');
  if (!complaint) throw new ApiError(404, 'Complaint not found');

  const isOwner = complaint.user._id.equals(req.user._id);
  if (!isOwner && !isStaff(req.user)) throw ApiError.forbidden();

  res.json({ success: true, data: complaint });
});

// CITIZEN: edit own complaint, only until staff has replied
export const updateComplaint = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) throw new ApiError(404, 'Complaint not found');
  if (!complaint.user.equals(req.user._id)) throw ApiError.forbidden();
  if (complaint.responses.length > 0) {
    throw ApiError.badRequest('Cannot edit a complaint after staff has responded');
  }

  complaint.set(req.body);
  await complaint.save();
  res.json({ success: true, message: 'Complaint updated', data: complaint });
});

// STAFF: reply to the citizen (and optionally change status)
export const respondToComplaint = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) throw new ApiError(404, 'Complaint not found');

  complaint.responses.push({ staff: req.user._id, message: req.body.message });
  if (req.body.status) complaint.status = req.body.status;
  await complaint.save();

  res.status(201).json({
    success: true,
    message: 'Response sent to the user',
    data: complaint,
  });
});