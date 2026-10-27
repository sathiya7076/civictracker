import { IMAGE_TYPES, MAX_IMAGES, MAX_IMAGE_BYTES } from './constants.js';

// Adds newly picked files to the existing list, dropping invalid ones. Returns { files, problem }.
export function mergeImageFiles(existing, picked) {
  const problems = [];
  const accepted = [];
  for (const f of picked) {
    if (!IMAGE_TYPES.includes(f.type)) problems.push(`${f.name}: only JPEG, PNG or WebP`);
    else if (f.size > MAX_IMAGE_BYTES) problems.push(`${f.name}: larger than 5 MB`);
    else accepted.push(f);
  }
  const combined = [...existing, ...accepted];
  if (combined.length > MAX_IMAGES) problems.push(`At most ${MAX_IMAGES} photos at a time`);
  return { files: combined.slice(0, MAX_IMAGES), problem: problems.join('. ') };
}
