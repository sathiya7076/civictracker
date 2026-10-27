import ApiError from '../utils/ApiError.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

// CSRF defence for cookie auth: state-changing requests must carry a custom header.
// A cross-site form or <img> cannot set it, and a cross-origin fetch needs a CORS
// preflight, which only our explicit FRONTEND_URL passes.
export function requireXhrHeader(req, _res, next) {
  if (SAFE_METHODS.has(req.method)) return next();
  if (req.headers['x-requested-with'] !== 'XMLHttpRequest') {
    return next(ApiError.forbidden('Missing required X-Requested-With header'));
  }
  next();
}
