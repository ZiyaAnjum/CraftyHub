// Usage: ADMIN_EMAIL=owner@example.com ADMIN_PASSWORD='a-long-strong-password' npm run seed:admin
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { User } from '../models/User.js';

const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const pw = process.env.ADMIN_PASSWORD;
if (!email || !pw || pw.length < 12) {
  console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD (at least 12 characters).');
  process.exit(1);
}
await mongoose.connect(env.MONGO_URI);
if (await User.exists({ email })) {
  console.log('A user with this email already exists. Nothing changed.');
} else {
  await User.create({ name: 'Fouzas Admin', email, phone: '9000000000', passwordHash: await bcrypt.hash(pw, 12), role: 'admin', emailVerified: true });
  console.log('Admin created.');
}
await mongoose.disconnect();
