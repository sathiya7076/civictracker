import app from './app.js';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import './config/cloudinary.js';

async function start() {
  try {
    await connectDB();
    app.listen(env.PORT, () => console.log(`CivicTrack API running on port ${env.PORT} (${env.NODE_ENV})`));
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
  process.exit(1);
});

start();
