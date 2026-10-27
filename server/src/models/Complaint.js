import mongoose from 'mongoose';
import { CATEGORIES, PRIORITIES, STATUSES } from '../utils/constants.js';

const complaintSchema = new mongoose.Schema(
  {
    complaintId: { type: String, required: true, unique: true }, // human-readable, e.g. CT-20261026-A1B2C
    title: { type: String, required: [true, 'Title is required'], trim: true, minlength: 5, maxlength: 120 },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: 10,
      maxlength: 2000,
    },
    category: { type: String, enum: CATEGORIES, required: true },
    address: { type: String, required: [true, 'Address is required'], trim: true, maxlength: 300 },
    latitude: { type: Number, min: -90, max: 90 },
    longitude: { type: Number, min: -180, max: 180 },
    citizenId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    assignedStaffId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    priority: { type: String, enum: PRIORITIES, default: 'Medium' },
    status: { type: String, enum: STATUSES, default: 'Pending' },
    images: { type: [String], default: [], validate: [(v) => v.length <= 5, 'At most 5 images allowed'] },
    resolutionEvidence: { type: [String], default: [] },
  },
  { timestamps: true }
);

complaintSchema.index({ citizenId: 1, createdAt: -1 });
complaintSchema.index({ assignedStaffId: 1, status: 1 });
complaintSchema.index({ status: 1, category: 1, createdAt: -1 });
complaintSchema.index({ title: 'text', description: 'text' });

export default mongoose.model('Complaint', complaintSchema);
