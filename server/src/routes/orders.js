import { Router } from 'express';
import { z } from 'zod';
import { Order, ORDER_STATUSES } from '../models/Order.js';
import { User } from '../models/User.js';
import { Item } from '../models/Item.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { orderLimiter } from '../middleware/rateLimiters.js';

const router = Router();

const createOrderSchema = z
  .object({
    item: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid item ID').optional().nullable(),
    customer: z
      .object({
        name: z.string().trim().min(2).max(80).optional(),
        phone: z.string().trim().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number').optional(),
        address: z.string().trim().max(500).optional().default(''),
      })
      .optional(),
    requirements: z.string().trim().max(2000).optional().default(''),
    referenceImages: z
      .array(
        z.object({
          url: z.string().url(),
          publicId: z.string().default(''),
        }).strict()
      )
      .max(5)
      .optional()
      .default([]),
    neededByDate: z.coerce.date().optional().nullable(),
    // Backward compatibility fields from draft builder
    occasion: z.string().trim().max(60).optional(),
    budget: z.number().min(0).max(1000000).optional(),
    items: z.array(z.any()).optional(),
    customization: z.record(z.any()).optional(),
    preferredDate: z.coerce.date().optional(),
  })
  .strict();

export const clientOrderView = (o) => ({
  id: o._id,
  orderNumber: o.orderNumber,
  orderId: o.orderNumber, // alias for backwards compatibility
  user: o.user,
  item: o.item,
  customer: o.customer,
  requirements: o.requirements,
  referenceImages: o.referenceImages || [],
  neededByDate: o.neededByDate,
  status: o.status,
  quotedPrice: o.quotedPrice,
  readyBy: o.readyBy,
  statusHistory: (o.statusHistory || []).map(({ status, changedAt, note }) => ({
    status,
    changedAt,
    note,
    at: changedAt, // alias
  })),
  createdAt: o.createdAt,
  updatedAt: o.updatedAt,
});

// POST /api/orders - Customer submits order or enquiry
router.post('/', requireAuth, orderLimiter, validateBody(createOrderSchema), async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(401).json({ error: 'Please sign in to continue.' });

    let itemRef = null;
    if (req.body.item) {
      const itemExists = await Item.findById(req.body.item);
      if (itemExists) itemRef = itemExists._id;
    }

    // Build customer snapshot safely from session or input
    const customer = {
      name: req.body.customer?.name || user.name,
      phone: req.body.customer?.phone || user.phone,
      address: req.body.customer?.address || '',
    };

    // Consolidate requirements text
    let reqText = req.body.requirements || '';
    if (!reqText && (req.body.occasion || req.body.customization || req.body.items?.length)) {
      const parts = [];
      if (req.body.occasion) parts.push(`Occasion: ${req.body.occasion}`);
      if (req.body.budget) parts.push(`Budget: ₹${req.body.budget}`);
      if (req.body.items?.length) {
        parts.push(`Items: ${req.body.items.map((i) => `${i.name || i.title} (x${i.qty || 1})`).join(', ')}`);
      }
      if (req.body.customization) {
        const c = req.body.customization;
        if (c.text) parts.push(`Text: ${c.text}`);
        if (c.theme) parts.push(`Theme: ${c.theme}`);
        if (c.colour) parts.push(`Colour: ${c.colour}`);
        if (c.notes) parts.push(`Notes: ${c.notes}`);
      }
      reqText = parts.join(' | ');
    }

    const neededByDate = req.body.neededByDate || req.body.preferredDate || null;

    const order = await Order.create({
      user: user._id,
      item: itemRef,
      customer,
      requirements: reqText,
      referenceImages: req.body.referenceImages || [],
      neededByDate,
      status: 'placed',
      statusHistory: [{ status: 'placed', changedAt: new Date(), note: 'Order placed by customer' }],
    });

    const populated = await Order.findById(order._id).populate('item', 'title category startingPrice images');
    res.status(201).json({ order: clientOrderView(populated) });
  } catch (e) {
    next(e);
  }
});

// GET /api/orders/mine - List orders owned by logged-in customer
router.get('/mine', requireAuth, async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .populate('item', 'title category startingPrice images')
      .sort({ createdAt: -1 })
      .limit(100);
    res.json({ orders: orders.map(clientOrderView) });
  } catch (e) {
    next(e);
  }
});

// GET /api/orders/:orderNumberOrId - Single order owned by logged-in customer
router.get('/:orderNumberOrId', requireAuth, async (req, res, next) => {
  try {
    const query = req.params.orderNumberOrId;
    const filter = { user: req.user.id };

    if (query.startsWith('FC-')) {
      filter.orderNumber = query;
    } else if (/^[0-9a-fA-F]{24}$/.test(query)) {
      filter._id = query;
    } else {
      return res.status(404).json({ error: 'Order not found.' });
    }

    const order = await Order.findOne(filter).populate('item', 'title category startingPrice images');
    if (!order) return res.status(404).json({ error: 'Order not found.' });

    res.json({ order: clientOrderView(order) });
  } catch (e) {
    next(e);
  }
});

export default router;
