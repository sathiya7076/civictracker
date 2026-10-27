import Notification from '../models/Notification.js';

// A failed notification must never break the action that triggered it.
export async function notify(recipientId, complaint, message, type = 'status_change') {
  try {
    await Notification.create({ recipient: recipientId, complaint: complaint._id, message, type });
  } catch (err) {
    console.error('Notification failed:', err.message);
  }
}
