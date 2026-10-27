import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDB() {
  mongoose.set('strictQuery', true);
  try {
    const conn = await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    throw new Error(
      `MongoDB connection failed: ${err.message}. Check MONGODB_URI, your Atlas user, and the Atlas IP access list.`
    );
  }
}
