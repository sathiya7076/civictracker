import ApiError from '../utils/ApiError.js';

const OBJECT_ID = /^[a-f\d]{24}$/i;

// Rejects malformed ids with 400 before they reach the database.
export const validateObjectId = (param = 'id') => (req, _res, next) => {
  if (!OBJECT_ID.test(req.params[param] || '')) return next(ApiError.badRequest(`Invalid ${param}`));
  next();
};
