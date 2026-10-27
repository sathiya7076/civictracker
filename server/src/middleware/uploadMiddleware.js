import multer from 'multer';
import ApiError from '../utils/ApiError.js';

export const MAX_FILES = 5;
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

// Files are kept in memory only long enough to stream them to Cloudinary (nothing is written to disk).
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE, files: MAX_FILES },
  fileFilter: (_req, file, cb) =>
    ALLOWED_TYPES.has(file.mimetype)
      ? cb(null, true)
      : cb(ApiError.badRequest('Only JPEG, PNG or WebP images are allowed')),
});

// The browser-supplied mimetype can be faked, so also check the real file signature (magic bytes).
function detectImageType(buf) {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (buf.subarray(0, 4).toString('ascii') === 'RIFF' && buf.subarray(8, 12).toString('ascii') === 'WEBP') {
    return 'image/webp';
  }
  return null;
}

function verifySignatures(req, _res, next) {
  for (const file of req.files || []) {
    if (detectImageType(file.buffer) !== file.mimetype) {
      return next(ApiError.badRequest(`"${file.originalname}" is not a valid image file`));
    }
  }
  next();
}

// Usage: router.post('/', imageUpload('images'), handler)  -> req.files
export const imageUpload = (field = 'images') => [upload.array(field, MAX_FILES), verifySignatures];
