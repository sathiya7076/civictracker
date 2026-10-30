// Shrinks a photo in the browser before upload. Phone photos are often 3-8 MB; resizing to
// 1600px and re-encoding as JPEG makes them ~200-600 KB (Vercel rejects bodies over 4.5 MB).
const MAX_SIDE = 1600;
const QUALITY = 0.8;
const SKIP_BELOW_BYTES = 400 * 1024;

export async function compressImage(file) {
  if (file.size <= SKIP_BELOW_BYTES) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close?.();
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', QUALITY));
    if (!blob || blob.size >= file.size) return file;
    const name = file.name.replace(/\.[^.]+$/, '') + '.jpg';
    return new File([blob], name, { type: 'image/jpeg', lastModified: Date.now() });
  } catch {
    return file; // browser cannot decode it: upload the original
  }
}

export const compressAll = (files) => Promise.all(files.map(compressImage));