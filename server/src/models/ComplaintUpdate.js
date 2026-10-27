import mongoose from 'mongoose';
import { STATUSES } from '../utils/constants.js';

const complaintUpdateSchema = new mongoose.Schema(
  {
    complaint: { type: mongoose.Schema.Types.ObjectId, ref: 'Complaint', required: true },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    previousStatus: { type: String, enum: [...STATUSES, null], default: null },
    newStatus: { type: String, enum: STATUSES, required: true },
    note: { type: String, trim: true, maxlength: 1000 },
    evidenceImages: { type: [String], default: [] },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

complaintUpdateSchema.index({ complaint: 1, createdAt: 1 });

export default mongoose.model('ComplaintUpdate', complaintUpdateSchema);
