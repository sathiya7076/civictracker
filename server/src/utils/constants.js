export const ROLES = Object.freeze({ CITIZEN: 'citizen', STAFF: 'staff', ADMIN: 'admin' });
export const ACCOUNT_STATUS = Object.freeze({ ACTIVE: 'active', SUSPENDED: 'suspended' });

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
export const NOTIFICATION_TYPES = ['status_change', 'assignment', 'feedback_request', 'general'];
