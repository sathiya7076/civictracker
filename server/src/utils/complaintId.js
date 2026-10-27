import crypto from 'crypto';

// No 0/O/1/I so IDs are easy to read out over the phone.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

// Example: CT-20261026-K7M2X
export function generateComplaintId(date = new Date()) {
  const day = date.toISOString().slice(0, 10).replace(/-/g, '');
  let suffix = '';
  for (const byte of crypto.randomBytes(5)) suffix += ALPHABET[byte % ALPHABET.length];
  return `CT-${day}-${suffix}`;
}
