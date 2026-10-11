import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { Order } from '../src/models/Order.js';
import { connectTestDb, clearTestDb, disconnectTestDb, createTestUser, createTestItem } from './helpers.js';

describe('Order Security & Verification Tests', () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
  });

  describe('Email Verification Guard (F-95)', () => {
    it('blocks order placement with HTTP 403 when user.emailVerified is false', async () => {
      const { user, accessToken } = await createTestUser({ emailVerified: false });
      const item = await createTestItem();

      const res = await request(app)
        .post('/api/orders')
        .set('X-Requested-With', 'fouzas-web')
        .set('Cookie', [`fc_at=${accessToken}`])
        .send({
          item: item._id.toString(),
          requirements: 'Special anniversary plaque inscription',
          address: '456 Test Road, Bengaluru',
        });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('EMAIL_NOT_VERIFIED');
      expect(res.body.error).toMatch(/verify your email/i);

      // Verify no order was saved to database
      const orderCount = await Order.countDocuments({ user: user._id });
      expect(orderCount).toBe(0);
    });

    it('allows order placement when user.emailVerified is true', async () => {
      const { user, accessToken } = await createTestUser({ emailVerified: true });
      const item = await createTestItem();

      const res = await request(app)
        .post('/api/orders')
        .set('X-Requested-With', 'fouzas-web')
        .set('Cookie', [`fc_at=${accessToken}`])
        .send({
          item: item._id.toString(),
          requirements: 'Special anniversary plaque inscription',
          address: '456 Test Road, Bengaluru',
        });

      expect(res.status).toBe(201);
      expect(res.body.order).toBeDefined();
      expect(res.body.order.orderNumber).toMatch(/^FC-[0-9A-F]{8}$/);
    });
  });

  describe('Order Placement Session Binding (S-06, F-10)', () => {
    it('ignores tampered customer name and phone in request body, binding strictly to authenticated session', async () => {
      const { user, accessToken } = await createTestUser({
        name: 'Genuine Customer',
        phone: '9876543210',
        emailVerified: true,
      });
      const item = await createTestItem();

      // Attacker attempts to spoof customer name and phone in the payload
      const res = await request(app)
        .post('/api/orders')
        .set('X-Requested-With', 'fouzas-web')
        .set('Cookie', [`fc_at=${accessToken}`])
        .send({
          item: item._id.toString(),
          requirements: 'Test order requirements',
          address: '456 Test Road, Bengaluru',
          phone: '9123456789', // Tampered body phone
          customer: {
            name: 'Malicious Impersonator', // Tampered body name
            phone: '9123456789', // Tampered body phone
            address: '456 Test Road, Bengaluru',
          },
        });

      expect(res.status).toBe(201);
      const createdOrder = res.body.order;

      // Response customer details must match the verified user, not the tampered body
      expect(createdOrder.customer.name).toBe('Genuine Customer');
      expect(createdOrder.customer.phone).toBe('9876543210');

      // Database document must also strictly preserve session identity
      const dbOrder = await Order.findById(createdOrder.id);
      expect(dbOrder.customer.name).toBe('Genuine Customer');
      expect(dbOrder.customer.phone).toBe('9876543210');
    });
  });

  describe('Customer Notes Security & Isolation (F-22, F-63)', () => {
    it('never exposes adminNotes in customer order queries or public track responses', async () => {
      const { user, accessToken } = await createTestUser({
        name: 'Recipient Customer',
        phone: '9876543210',
      });
      const item = await createTestItem();

      // Create an order with both private adminNotes and customer-visible customerNote
      const dbOrder = await Order.create({
        orderNumber: 'FC-TESTNOTE',
        user: user._id,
        item: item._id,
        itemSnapshot: { title: item.title, image: '' },
        customer: {
          name: user.name,
          phone: user.phone,
          address: '789 Secret Ave',
        },
        requirements: 'Custom engraving',
        status: 'in_progress',
        adminNotes: 'INTERNAL CONFIDENTIAL: Artisan material cost ₹300, customer is high-profile VIP.',
        customerNote: 'Your frame is currently being hand-carved in our studio and will dry by tomorrow!',
      });

      // 1. Customer GET /api/orders/:id
      const customerRes = await request(app)
        .get(`/api/orders/${dbOrder.orderNumber}`)
        .set('Cookie', [`fc_at=${accessToken}`]);

      expect(customerRes.status).toBe(200);
      expect(customerRes.body.order.customerNote).toBe(
        'Your frame is currently being hand-carved in our studio and will dry by tomorrow!'
      );
      // adminNotes must be completely absent from response
      expect(customerRes.body.order.adminNotes).toBeUndefined();
      expect(JSON.stringify(customerRes.body)).not.toContain('INTERNAL CONFIDENTIAL');

      // 2. Customer GET /api/orders/mine
      const mineRes = await request(app)
        .get('/api/orders/mine')
        .set('Cookie', [`fc_at=${accessToken}`]);

      expect(mineRes.status).toBe(200);
      const myOrder = mineRes.body.orders.find((o) => o.orderNumber === 'FC-TESTNOTE');
      expect(myOrder.customerNote).toBe(
        'Your frame is currently being hand-carved in our studio and will dry by tomorrow!'
      );
      expect(myOrder.adminNotes).toBeUndefined();
      expect(JSON.stringify(mineRes.body)).not.toContain('INTERNAL CONFIDENTIAL');

      // 3. Public POST /api/orders/track
      const trackRes = await request(app)
        .post('/api/orders/track')
        .set('X-Requested-With', 'fouzas-web')
        .send({
          orderNumber: 'FC-TESTNOTE',
          phone: '9876543210',
        });

      expect(trackRes.status).toBe(200);
      expect(trackRes.body.order.customerNote).toBe(
        'Your frame is currently being hand-carved in our studio and will dry by tomorrow!'
      );
      expect(trackRes.body.order.adminNotes).toBeUndefined();
      expect(JSON.stringify(trackRes.body)).not.toContain('INTERNAL CONFIDENTIAL');
      // Public track must also protect address
      expect(trackRes.body.order.customer?.address).toBeUndefined();
    });
  });
});
