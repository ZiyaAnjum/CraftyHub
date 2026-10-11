import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { connectTestDb, clearTestDb, disconnectTestDb, createTestUser, createTestAdmin } from './helpers.js';

describe('Admin Authorization & Customers View Tests (F-60, F-65)', () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
  });

  it('rejects unauthenticated requests to /api/admin/customers with HTTP 401', async () => {
    const res = await request(app).get('/api/admin/customers');
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/Please sign in/i);
  });

  it('rejects regular customer requests to /api/admin/customers with HTTP 403', async () => {
    const { accessToken } = await createTestUser({ role: 'customer' });

    const res = await request(app)
      .get('/api/admin/customers')
      .set('Cookie', [`fc_at=${accessToken}`]);

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/You do not have permission/i);
  });

  it('allows admin access to /api/admin/customers with HTTP 200 and paginated data', async () => {
    const { accessToken: adminToken } = await createTestAdmin();
    // Create two test customers
    await createTestUser({ name: 'Alice Customer', email: 'alice@example.com' });
    await createTestUser({ name: 'Bob Customer', email: 'bob@example.com' });

    const res = await request(app)
      .get('/api/admin/customers')
      .set('Cookie', [`fc_at=${adminToken}`]);

    expect(res.status).toBe(200);
    expect(res.body.customers).toBeDefined();
    expect(Array.isArray(res.body.customers)).toBe(true);
    expect(res.body.pagination.total).toBeGreaterThanOrEqual(2);

    // Verify projection security: password hashes and sensitive tokens must NEVER be present
    for (const c of res.body.customers) {
      expect(c.passwordHash).toBeUndefined();
      expect(c.refreshToken).toBeUndefined();
      expect(c.emailVerificationTokenHash).toBeUndefined();
      expect(c.passwordResetTokenHash).toBeUndefined();
    }
  });

  it('supports searching customers by name, email, or phone', async () => {
    const { accessToken: adminToken } = await createTestAdmin();
    await createTestUser({ name: 'UniqueCustomerName', email: 'unique@example.com', phone: '9988776655' });
    await createTestUser({ name: 'OtherPerson', email: 'other@example.com', phone: '9111222333' });

    const res = await request(app)
      .get('/api/admin/customers?q=UniqueCustomerName')
      .set('Cookie', [`fc_at=${adminToken}`]);

    expect(res.status).toBe(200);
    expect(res.body.customers.length).toBe(1);
    expect(res.body.customers[0].name).toBe('UniqueCustomerName');
  });
});
