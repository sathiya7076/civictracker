import cloudinary from '../config/cloudinary.js';
import ApiError from '../utils/ApiError.js';

const UPLOAD_TIMEOUT_MS = 30000;

function uploadBuffer(buffer, folder) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image', timeout: UPLOAD_TIMEOUT_MS },
      (err, result) => {
        if (err) return reject(err);
        if (!result?.secure_url) return reject(new Error('Cloudinary returned no URL'));
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    stream.on('error', reject);
    stream.end(buffer);
  });
}

// Best-effort cleanup (never throws) so a failed request does not leave orphan images.
export async function deleteImages(publicIds = []) {
  await Promise.allSettled(publicIds.map((id) => cloudinary.uploader.destroy(id, { resource_type: 'image' })));
}

// .../upload/v123/civictrack/complaints/abc.jpg -> civictrack/complaints/abc
export function publicIdFromUrl(url) {
  const m = /\/upload\/(?:v\d+\/)?(.+)\.[a-z0-9]+$/i.exec(url || '');
  return m ? m[1] : null;
}

export async function deleteImagesByUrl(urls = []) {
  await deleteImages(urls.map(publicIdFromUrl).filter(Boolean));
}

// Uploads multer files to Cloudinary and returns their HTTPS URLs.
// If any file fails, the ones already uploaded are removed and a clear error is thrown.
export async function uploadImages(files = [], folder = 'civictrack/complaints') {
  if (!files.length) return [];

  const results = await Promise.allSettled(files.map((f) => uploadBuffer(f.buffer, folder)));
  const failed = results.find((r) => r.status === 'rejected');

  if (failed) {
    const done = results.filter((r) => r.status === 'fulfilled').map((r) => r.value.publicId);
    await deleteImages(done);
    // Real reason goes to the server logs (e.g. "Invalid cloud_name", "Invalid Signature").
    console.error('Cloudinary upload failed:', failed.reason?.message || failed.reason);
    throw new ApiError(502, 'Image upload failed. Please try again in a moment.');
  }
  return results.map((r) => r.value.url);
}