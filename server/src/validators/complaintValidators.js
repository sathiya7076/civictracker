import { z } from 'zod';
import { CATEGORIES, STATUSES } from '../utils/constants.js';

// Multipart forms send everything as strings, so empty strings become "not provided".
export const emptyToUndefined = (v) => (v === '' || v === null ? undefined : v);

const coordinate = (min, max, label) =>
  z.preprocess(
    (v) => (v === '' || v === undefined || v === null ? undefined : Number(v)),
    z.number({ invalid_type_error: `${label} must be a number` }).min(min, `${label} must be between ${min} and ${max}`).max(max, `${label} must be between ${min} and ${max}`).optional()
  );

const fields = {
  title: z.string().trim().min(5, 'Title must be at least 5 characters').max(120, 'Title must be at most 120 characters'),
  description: z.string().trim().min(10, 'Description must be at least 10 characters').max(2000, 'Description must be at most 2000 characters'),
  category: z.enum(CATEGORIES, { errorMap: () => ({ message: 'Choose a valid category' }) }),
  address: z.string().trim().min(5, 'Address must be at least 5 characters').max(300, 'Address must be at most 300 characters'),
  latitude: coordinate(-90, 90, 'Latitude'),
  longitude: coordinate(-180, 180, 'Longitude'),
};

const bothOrNeither = (d) => (d.latitude === undefined) === (d.longitude === undefined);
const pairMessage = { message: 'Provide both latitude and longitude, or neither', path: ['latitude'] };

export const createComplaintSchema = z.object(fields).refine(bothOrNeither, pairMessage);

export const updateComplaintSchema = z
  .object(fields)
  .partial()
  .refine((d) => Object.keys(d).length > 0, { message: 'Provide at least one field to update' })
  .refine(bothOrNeither, pairMessage);

export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  status: z.preprocess(emptyToUndefined, z.enum(STATUSES).optional()),
  category: z.preprocess(emptyToUndefined, z.enum(CATEGORIES).optional()),
  search: z.preprocess(emptyToUndefined, z.string().trim().max(100).optional()),
  sort: z.enum(['newest', 'oldest']).default('newest'),
});
