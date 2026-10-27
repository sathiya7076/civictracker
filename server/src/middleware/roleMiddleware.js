import ApiError from '../utils/ApiError.js';

// Usage: router.get('/x', protect, authorize('admin'), handler)
export const authorize = (...roles) => (req, _res, next) => {
  if (!req.user) return next(ApiError.unauthorized());
  if (!roles.includes(req.user.role)) return next(ApiError.forbidden());
  next();
};
