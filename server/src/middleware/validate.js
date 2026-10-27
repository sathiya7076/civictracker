import ApiError from '../utils/ApiError.js';

// validate(schema) checks req.body; validate(schema, 'query') / 'params' store the parsed
// result in req.validated.query / req.validated.params.
export const validate = (schema, source = 'body') => (req, _res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) {
    const errors = result.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }));
    return next(new ApiError(400, 'Validation failed', errors));
  }
  if (source === 'body') {
    req.body = result.data;
  } else {
    req.validated = { ...(req.validated || {}), [source]: result.data };
  }
  next();
};
