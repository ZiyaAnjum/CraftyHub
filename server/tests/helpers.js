import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../src/models/User.js';
import { Item } from '../src/models/Item.js';
import { Order } from '../src/models/Order.js';
import { RefreshToken } from '../src/models/RefreshToken.js';
import { signAccessToken, newRefreshToken, hashToken } from '../src/utils/tokens.js';

// Guarantee that tests NEVER run against the primary 'fouzas' database!
const baseUri = process.env.TEST_MONGO_URI || process.env.MONGO_URI || '';
if (!baseUri) {
  throw new Error('MONGO_URI is required to run tests');
}

// Replace database path with isolated test database
const TEST_DB_NAME = 'test_fouzas_vitest';
export const TEST_MONGO_URI = baseUri.includes('/fouzas')
  ? baseUri.replace('/fouzas?', `/${TEST_DB_NAME}?`).replace('/fouzas', `/${TEST_DB_NAME}`)
  : baseUri;

export async function connectTestDb() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(TEST_MONGO_URI, {
      serverSelectionTimeoutMS: 30000,
      connectTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
    });
  }

  // Double-check db name to guarantee complete isolation
  if (mongoose.connection.name === 'fouzas') {
    await mongoose.disconnect();
    throw new Error('SAFETY CHECK FAILED: Attempted to run tests against production database "fouzas"!');
  }
}

export async function clearTestDb() {
  if (mongoose.connection.readyState !== 1) {
    await connectTestDb();
  }
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
}

export async function disconnectTestDb() {
  // Clear data instead of dropping DB between files to prevent Atlas connection resets
  if (mongoose.connection.readyState === 1 && mongoose.connection.name !== 'fouzas') {
    await clearTestDb();
  }
}

/**
 * Creates a verified customer user in the test database.
 */
export async function createTestUser(overrides = {}) {
  await connectTestDb();
  const email = overrides.email || `customer_${Date.now()}_${Math.random().toString(36).substring(7)}@test.com`;
  const plainPassword = overrides.password || 'SecurePassword123!';
  const passwordHash = await bcrypt.hash(plainPassword, 10);

  const user = await User.create({
    name: overrides.name || 'Test Customer',
    email,
    phone: overrides.phone || '9876543210',
    passwordHash,
    role: overrides.role || 'customer',
    emailVerified: overrides.emailVerified !== undefined ? overrides.emailVerified : true,
    savedAddress: overrides.savedAddress || '123 Test Street, Bengaluru',
    termsAcceptedAt: new Date(),
    failedLoginCount: overrides.failedLoginCount || 0,
    lockUntil: overrides.lockUntil || null,
  });

  const accessToken = signAccessToken(user);
  return { user, plainPassword, accessToken };
}

/**
 * Creates an admin user in the test database.
 */
export async function createTestAdmin(overrides = {}) {
  return createTestUser({
    name: 'Admin Artisan',
    email: overrides.email || `admin_${Date.now()}@test.com`,
    role: 'admin',
    ...overrides,
  });
}

/**
 * Creates a catalogue item in the test database.
 */
export async function createTestItem(overrides = {}) {
  await connectTestDb();
  return Item.create({
    title: overrides.title || 'Personalized Wooden Plaque',
    slug: overrides.slug || `test-item-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    description: overrides.description || 'Handcrafted bespoke item',
    startingPrice: overrides.startingPrice !== undefined ? overrides.startingPrice : 1200,
    category: overrides.category || 'Frame',
    occasionTags: overrides.occasionTags || ['birthday', 'anniversary'],
    isVisible: overrides.isVisible !== undefined ? overrides.isVisible : true,
    isHamperEligible: overrides.isHamperEligible !== undefined ? overrides.isHamperEligible : true,
    prepTimeDays: overrides.prepTimeDays || 4,
    images: overrides.images || [
      {
        url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
        publicId: 'sample',
        isPrimary: true,
      },
    ],
  });
}
