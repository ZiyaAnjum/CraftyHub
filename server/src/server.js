import mongoose from 'mongoose';
import { env } from './config/env.js';
import app from './app.js';

mongoose.set('sanitizeFilter', true); // treats query operators inside values as plain data

await mongoose.connect(env.MONGO_URI);
app.listen(env.PORT, () => console.log(`API listening on port ${env.PORT}`));
