import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import { ACCOUNT_STATUS, ROLES } from '../utils/constants.js';

const SALT_ROUNDS = env.NODE_ENV === 'test' ? 4 : 12;
// Compared against when the email is unknown, so response time does not reveal which emails exist.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', SALT_ROUNDS);

export async function registerCitizen({ name, email, password, phone }) {
  if (await User.exists({ email })) throw ApiError.conflict('An account with this email already exists');
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  // Role is hard-coded: public registration can only ever create citizens.
  return User.create({ name, email, phone, passwordHash, role: ROLES.CITIZEN });
}

export async function authenticate(email, password) {
  const user = await User.findOne({ email }).select('+passwordHash');
  const matches = await bcrypt.compare(password, user ? user.passwordHash : DUMMY_HASH);
  if (!user || !matches) throw ApiError.unauthorized('Invalid email or password');
  if (user.accountStatus !== ACCOUNT_STATUS.ACTIVE) {
    throw ApiError.forbidden('Your account has been suspended. Contact the administrator.');
  }
  return user;
}

export const hashPassword = (password) => bcrypt.hash(password, SALT_ROUNDS);

// Staff accounts are only ever created by an admin (see adminService), never by public registration.
export async function createStaffAccount({ name, email, password, phone }) {
  if (await User.exists({ email })) throw ApiError.conflict('An account with this email already exists');
  const passwordHash = await hashPassword(password);
  return User.create({ name, email, phone, passwordHash, role: ROLES.STAFF });
}
