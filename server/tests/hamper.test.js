import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { connectTestDb, clearTestDb, disconnectTestDb, createTestUser, createTestItem } from './helpers.js';

describe('Hamper Builder & Pricing Security Tests (F-40 to F-42, S-17)', () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
  });

  it('server recalculates total price from database and completely ignores fake client-sent price', async () => {
    const { accessToken } = await createTestUser();
    const item1 = await createTestItem({ startingPrice: 400, isVisible: true, isHamperEligible: true });
    const item2 = await createTestItem({ startingPrice: 250, isVisible: true, isHamperEligible: true });

    // Base: matte_box (price: 299)
    // item1: qty 2 (400 * 2 = 800)
    // item2: qty 3 (250 * 3 = 750)
    // Expected Total: 299 + 800 + 750 = 1849
    const expectedTotal = 299 + 800 + 750;

    const res = await request(app)
      .post('/api/orders')
      .set('X-Requested-With', 'fouzas-web')
      .set('Cookie', [`fc_at=${accessToken}`])
      .send({
        hamper: {
          baseId: 'matte_box',
          giftMessage: 'Happy Celebration!',
          items: [
            { item: item1._id.toString(), quantity: 2 },
            { item: item2._id.toString(), quantity: 3 },
          ],
        },
        // Client attempts to pass a low budget/price of 1
        budget: 1,
        address: '123 Gift Way, Bengaluru',
      });

    expect(res.status).toBe(201);
    const order = res.body.order;

    expect(order.hamper).toBeDefined();
    expect(order.hamper.base.id).toBe('matte_box');
    expect(order.hamper.base.price).toBe(299);
    expect(order.hamper.calculatedTotal).toBe(expectedTotal);
    expect(order.quotedPrice).toBe(expectedTotal);
  });

  it('merges duplicate items by item ID before checking limits, rejecting if merged quantity exceeds 5', async () => {
    const { accessToken } = await createTestUser();
    const item = await createTestItem({ startingPrice: 300, isVisible: true, isHamperEligible: true });

    // Client sends two duplicate entries of the same item ID: qty 3 and qty 3 (sum = 6 > 5)
    const res = await request(app)
      .post('/api/orders')
      .set('X-Requested-With', 'fouzas-web')
      .set('Cookie', [`fc_at=${accessToken}`])
      .send({
        hamper: {
          baseId: 'wicker_basket',
          items: [
            { item: item._id.toString(), quantity: 3 },
            { item: item._id.toString(), quantity: 3 },
          ],
        },
        address: '123 Gift Way, Bengaluru',
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Maximum 5 of any single item allowed/i);
  });

  it('merges duplicate items and succeeds when merged quantity is within limits (<= 5)', async () => {
    const { accessToken } = await createTestUser();
    const item = await createTestItem({ startingPrice: 200, isVisible: true, isHamperEligible: true });

    // Client sends two duplicate entries: qty 2 and qty 2 (sum = 4 <= 5)
    // Base: wicker_basket (price: 499) + item (4 * 200 = 800) = 1299
    const res = await request(app)
      .post('/api/orders')
      .set('X-Requested-With', 'fouzas-web')
      .set('Cookie', [`fc_at=${accessToken}`])
      .send({
        hamper: {
          baseId: 'wicker_basket',
          items: [
            { item: item._id.toString(), quantity: 2 },
            { item: item._id.toString(), quantity: 2 },
          ],
        },
        address: '123 Gift Way, Bengaluru',
      });

    expect(res.status).toBe(201);
    const order = res.body.order;
    expect(order.hamper.items.length).toBe(1);
    expect(order.hamper.items[0].quantity).toBe(4);
    expect(order.hamper.calculatedTotal).toBe(499 + 800);
  });

  it('rejects an unknown or invalid hamper baseId with HTTP 400', async () => {
    const { accessToken } = await createTestUser();
    const item = await createTestItem({ startingPrice: 300, isVisible: true, isHamperEligible: true });

    const res = await request(app)
      .post('/api/orders')
      .set('X-Requested-With', 'fouzas-web')
      .set('Cookie', [`fc_at=${accessToken}`])
      .send({
        hamper: {
          baseId: 'alien_unregistered_box',
          items: [{ item: item._id.toString(), quantity: 1 }],
        },
        address: '123 Gift Way, Bengaluru',
      });

    expect(res.status).toBe(400);
    const msg = res.body.details?.[0]?.message || res.body.error;
    expect(msg).toMatch(/Unknown hamper base selection|Invalid or unknown hamper base/i);
  });

  it('rejects an unpublished or invisible catalogue item with HTTP 400', async () => {
    const { accessToken } = await createTestUser();
    const unpublishedItem = await createTestItem({
      startingPrice: 500,
      isVisible: false, // Unpublished
      isHamperEligible: true,
    });

    const res = await request(app)
      .post('/api/orders')
      .set('X-Requested-With', 'fouzas-web')
      .set('Cookie', [`fc_at=${accessToken}`])
      .send({
        hamper: {
          baseId: 'matte_box',
          items: [{ item: unpublishedItem._id.toString(), quantity: 1 }],
        },
        address: '123 Gift Way, Bengaluru',
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/unpublished, discontinued, ineligible/i);
  });

  it('rejects a catalogue item flagged as not eligible for hampers with HTTP 400', async () => {
    const { accessToken } = await createTestUser();
    const ineligibleItem = await createTestItem({
      startingPrice: 800,
      isVisible: true,
      isHamperEligible: false, // Flagged ineligible
    });

    const res = await request(app)
      .post('/api/orders')
      .set('X-Requested-With', 'fouzas-web')
      .set('Cookie', [`fc_at=${accessToken}`])
      .send({
        hamper: {
          baseId: 'matte_box',
          items: [{ item: ineligibleItem._id.toString(), quantity: 1 }],
        },
        address: '123 Gift Way, Bengaluru',
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/unpublished, discontinued, ineligible/i);
  });
});
