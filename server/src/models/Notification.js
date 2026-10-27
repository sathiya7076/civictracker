import mongoose from 'mongoose';
import { NOTIFICATION_TYPES } from '../utils/constants.js';

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    complaint: { type: mongoose.Schema.Types.ObjectId, ref: 'Complaint' },
    message: { type: String, required: true, trim: true, maxlength: 300 },
    type: { type: String, enum: NOTIFICATION_TYPES, default: 'general' },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

export default mongoose.model('Notification', notificationSchema);
