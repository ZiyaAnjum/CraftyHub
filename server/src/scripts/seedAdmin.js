import 'dotenv/config';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { User } from '../models/User.js';

const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const pw = process.env.ADMIN_PASSWORD;

if (!email || !pw || pw.length < 10) {
  console.error('Error: Please provide valid ADMIN_EMAIL and ADMIN_PASSWORD (at least 10 characters) in .env');
  process.exit(1);
}

try {
  await mongoose.connect(env.MONGO_URI);
  console.log('Connected to database.');

  const existing = await User.findOne({ email });
  if (existing) {
    let updated = false;
    if (existing.role !== 'admin') {
      existing.role = 'admin';
      updated = true;
    }
    // Update password hash if requested
    existing.passwordHash = await bcrypt.hash(pw, 12);
    existing.failedLoginCount = 0;
    existing.lockUntil = null;
    await existing.save();

    console.log(`✓ Admin user "${email}" updated successfully (role: admin).`);
  } else {
    await User.create({
      name: 'Fouzas Admin',
      email,
      phone: '9000000000',
      passwordHash: await bcrypt.hash(pw, 12),
      role: 'admin',
      emailVerified: true,
    });
    console.log(`✓ Admin user "${email}" created successfully.`);
  }
} catch (err) {
  console.error('Failed to seed admin:', err.message);
  process.exit(1);
} finally {
  await mongoose.disconnect();
  console.log('Disconnected from database.');
}
