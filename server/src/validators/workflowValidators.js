import { z } from 'zod';
import { PRIORITIES } from '../utils/constants.js';
import { emptyToUndefined, listQuerySchema } from './complaintValidators.js';
import { registerSchema } from './authValidators.js';

const OBJECT_ID = /^[a-f\d]{24}$/i;
const note = z.preprocess(emptyToUndefined, z.string().trim().max(1000, 'Note must be at most 1000 characters').optional());

// ---- staff ----
export const staffStatusSchema = z.object({
  status: z.enum(['In Progress', 'Resolved'], { errorMap: () => ({ message: 'Status must be "In Progress" or "Resolved"' }) }),
  note,
});
export const evidenceSchema = z.object({ note });

// ---- admin ----
export const assignSchema = z.object({ staffId: z.string().regex(OBJECT_ID, 'Invalid staff id'), note });
export const prioritySchema = z.object({ priority: z.enum(PRIORITIES, { errorMap: () => ({ message: 'Choose a valid priority' }) }) });
export const verifySchema = z
  .object({ action: z.enum(['close', 'reopen']), note })
  .refine((d) => d.action !== 'reopen' || d.note, { message: 'A note is required when reopening', path: ['note'] });
export const rejectSchema = z.object({
  note: z.string().trim().min(5, 'Please give a reason (at least 5 characters)').max(1000),
});
export const userStatusSchema = z.object({ status: z.enum(['active', 'suspended']) });
export const createStaffSchema = registerSchema;

export const adminComplaintsQuerySchema = listQuerySchema.extend({
  priority: z.preprocess(emptyToUndefined, z.enum(PRIORITIES).optional()),
  staff: z.preprocess(emptyToUndefined, z.union([z.literal('unassigned'), z.string().regex(OBJECT_ID)]).optional()),
});

export const usersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  role: z.preprocess(emptyToUndefined, z.enum(['citizen', 'staff', 'admin']).optional()),
  status: z.preprocess(emptyToUndefined, z.enum(['active', 'suspended']).optional()),
  search: z.preprocess(emptyToUndefined, z.string().trim().max(100).optional()),
});
