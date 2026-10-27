import cloudinary from '../config/cloudinary.js';

function uploadBuffer(buffer, folder) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder, resource_type: 'image' }, (err, result) =>
      err ? reject(err) : resolve(result.secure_url)
    );
    stream.end(buffer);
  });
}

// Uploads multer files to Cloudinary and returns their HTTPS URLs.
export async function uploadImages(files = [], folder = 'civictrack/complaints') {
  return Promise.all(files.map((f) => uploadBuffer(f.buffer, folder)));
}
