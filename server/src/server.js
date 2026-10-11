import mongoose from 'mongoose';
import { env } from './config/env.js';
import app from './app.js';
import { backfillOrderOccasions } from './utils/backfillOccasions.js';

// 1. Bind and listen on port immediately so HTTP requests are accepted
const server = app.listen(env.PORT, () => {
  console.log(`API listening on port ${env.PORT}`);
});

// 2. Connect to MongoDB with timeout and retry handling
async function startDatabase() {
  try {
    await mongoose.connect(env.MONGO_URI, {
      serverSelectionTimeoutMS: 15000,
    });
    console.log('MongoDB connected successfully.');

    // 3. Run backfill only after MongoDB connects, wrapped in try/catch so it never crashes startup
    try {
      const res = await backfillOrderOccasions();
      if (res?.backfilled > 0) {
        console.log(`Successfully backfilled occasions for ${res.backfilled} orders.`);
      }
    } catch (backfillErr) {
      console.error('Non-fatal error during order occasion backfill:', backfillErr.message);
    }
  } catch (err) {
    console.error('Initial MongoDB connection failed:', err.message);
    console.log('Server is running and will retry connecting to database in background.');
  }
}

startDatabase();

export default server;
