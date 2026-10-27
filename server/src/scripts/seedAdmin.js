import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';
import { ROLES } from '../utils/constants.js';
import { registerSchema } from '../validators/authValidators.js';

// Run once: npm run seed:admin   (reads ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD from server/.env)
async function seed() {
  const parsed = registerSchema.safeParse({
    name: process.env.ADMIN_NAME,
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
  });
  if (!parsed.success) {
    console.error('Set valid ADMIN_NAME, ADMIN_EMAIL and ADMIN_PASSWORD in server/.env:');
    parsed.error.issues.forEach((i) => console.error(`  - ${i.path.join('.')}: ${i.message}`));
    process.exit(1);
  }
  const { name, email, password } = parsed.data;

  await connectDB();
  if (await User.exists({ email })) {
    console.log(`A user with email ${email} already exists. Nothing to do.`);
  } else {
    const passwordHash = await bcrypt.hash(password, 12);
    await User.create({ name, email, passwordHash, role: ROLES.ADMIN });
    console.log(`Admin created: ${email}. Remove ADMIN_PASSWORD from .env now.`);
  }
  await mongoose.disconnect();
}

seed().catch(async (err) => {
  console.error(err.message);
  await mongoose.disconnect();
  process.exit(1);
});
