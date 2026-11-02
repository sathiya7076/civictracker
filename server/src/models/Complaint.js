import mongoose from 'mongoose';
import { CATEGORIES, PRIORITIES, STATUSES } from '../utils/constants.js';

const complaintSchema = new mongoose.Schema(
  {
    complaintId: { type: String, required: true, unique: true, trim: true }, // e.g. CT-20261026-K7M2X
    title: { type: String, required: true, trim: true, minlength: 5, maxlength: 120 },
    description: { type: String, required: true, trim: true, minlength: 10, maxlength: 2000 },
    category: { type: String, enum: CATEGORIES, required: true },
    address: { type: String, required: true, trim: true, minlength: 5, maxlength: 300 },
    latitude: { type: Number, min: -90, max: 90 },
    longitude: { type: Number, min: -180, max: 180 },
    citizenId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    assignedStaffId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    priority: { type: String, enum: PRIORITIES, default: 'Medium' },
    status: { type: String, enum: STATUSES, default: 'Pending' },
    images: { type: [String], default: [] }, // photos from the citizen
    resolutionEvidence: { type: [String], default: [] }, // photos uploaded by staff
  },
  { timestamps: true }
);

complaintSchema.index({ status: 1, category: 1, createdAt: -1 });

export default mongoose.model('Complaint', complaintSchema);