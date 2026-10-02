import { Router } from 'express';
import { z } from 'zod';
import { Order } from '../models/Order.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { orderLimiter } from '../middleware/rateLimiters.js';

const router = Router();

const createOrderSchema = z.object({
  occasion: z.string().trim().min(2).max(60),
  budget: z.number().min(0).max(1000000),
  items: z.array(z.object({ name: z.string().trim().min(1).max(120), qty: z.number().int().min(1).max(100) }).strict()).max(30).default([]),
  customization: z.object({
    text: z.string().trim().max(200).optional(),
    font: z.string().trim().max(40).optional(),
    colour: z.string().trim().max(40).optional(),
    theme: z.string().trim().max(40).optional(),
    notes: z.string().trim().max(1000).optional(),
  }).strict().default({}),
  preferredDate: z.coerce
    .date()
    .refine((d) => d >= new Date(Date.now() - 24 * 3600 * 1000), {
      message: 'Preferred date cannot be in the past',
    })
    .optional(),
}).strict(); // rejects unknown fields such as user, status, role, price

const ORDER_ID = /^FC-[0-9A-F]{8}$/;
const clientView = (o) => ({
  orderId: o.orderId, occasion: o.occasion, budget: o.budget, items: o.items, customization: o.customization,
  preferredDate: o.preferredDate, status: o.status, customerNote: o.customerNote, createdAt: o.createdAt,
  statusHistory: o.statusHistory.map(({ status, at }) => ({ status, at })),
});

// Ordering requires sign-in. The owner of the order always comes from the session, never the body.
router.post('/', requireAuth, orderLimiter, validateBody(createOrderSchema), async (req, res, next) => {
  try {
    const order = await Order.create({
      ...req.body,
      user: req.user.id,
      status: 'Received',
      statusHistory: [{ status: 'Received', by: 'customer' }],
    });
    res.status(201).json({ order: clientView(order) });
  } catch (e) { next(e); }
});

router.get('/mine', requireAuth, async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user.id }).sort({ createdAt: -1 }).limit(100);
    res.json({ orders: orders.map(clientView) });
  } catch (e) { next(e); }
});

// Filtered by owner, so another customer's order returns 404 even with a valid ID
router.get('/:orderId', requireAuth, async (req, res, next) => {
  try {
    if (!ORDER_ID.test(req.params.orderId)) return res.status(404).json({ error: 'Order not found.' });
    const order = await Order.findOne({ orderId: req.params.orderId, user: req.user.id });
    if (!order) return res.status(404).json({ error: 'Order not found.' });
    res.json({ order: clientView(order) });
  } catch (e) { next(e); }
});

export default router;
