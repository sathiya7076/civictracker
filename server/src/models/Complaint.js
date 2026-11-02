import mongoose from 'mongoose';
import { CATEGORIES, STATUSES } from '../utils/constants.js';

const responseSchema = new mongoose.Schema(
  {
    staff: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true, trim: true, maxlength: 2000 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const complaintSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, minlength: 5, maxlength: 120 },
    description: { type: String, required: true, trim: true, minlength: 10, maxlength: 2000 },
    category: { type: String, enum: CATEGORIES, required: true },
    address: { type: String, required: true, trim: true, minlength: 5, maxlength: 300 },
    latitude: { type: Number, min: -90, max: 90 },
    longitude: { type: Number, min: -180, max: 180 },
    // Default = first value of your STATUSES list (e.g. "pending"/"open").
    status: { type: String, enum: STATUSES, default: STATUSES[0] },
    responses: [responseSchema],
  },
  { timestamps: true }
);

complaintSchema.index({ status: 1, category: 1, createdAt: -1 });

export default mongoose.model('Complaint', complaintSchema);