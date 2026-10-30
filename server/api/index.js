import app from '../src/app.js';
import { connectDB } from '../src/config/db.js';

let ready;

export default async function handler(req, res) {
  try {
    ready ||= connectDB();
    await ready;
  } catch (err) {
    ready = undefined;
    console.error(err.message);
    return res.status(500).json({ success: false, message: 'Database connection failed' });
  }
  return app(req, res);
}