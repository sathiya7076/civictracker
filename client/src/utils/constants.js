// Keep in sync with server/src/utils/constants.js
export const CATEGORIES = [
  'Road Damage',
  'Garbage Collection',
  'Streetlight',
  'Water Leakage',
  'Drainage & Sewage',
  'Other',
];

export const STATUSES = ['Pending', 'Assigned', 'In Progress', 'Resolved', 'Closed', 'Rejected'];
export const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];

export const MAX_IMAGES = 5;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
