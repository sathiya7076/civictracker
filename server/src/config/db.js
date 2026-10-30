import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDB() {
  mongoose.set('strictQuery', true);

  mongoose.connection.on('disconnected', () => console.warn('MongoDB disconnected'));
  mongoose.connection.on('reconnected', () => console.log('MongoDB reconnected'));
  mongoose.connection.on('error', (e) => console.error('MongoDB error:', e.message));

  try {
    const conn = await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 8000,
      maxPoolSize: 10,
    });
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    throw new Error(
      `MongoDB connection failed: ${err.message}. Check MONGODB_URI, your Atlas user, and the Atlas IP access list.`
    );
  }
}