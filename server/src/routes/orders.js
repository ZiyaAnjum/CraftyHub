import { Router } from 'express';
import { z } from 'zod';
import { Order, ORDER_STATUSES } from '../models/Order.js';
import { User } from '../models/User.js';
import { Item } from '../models/Item.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { orderLimiter, orderUserLimiter, trackLimiter } from '../middleware/rateLimiters.js';
import { uploadSingleImage } from '../middleware/upload.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../utils/cloudinary.js';

const router = Router();

export function normalizePhone(phone) {
  if (!phone) return '';
  let digits = String(phone).replace(/\D/g, '');
  if (digits.startsWith('91') && digits.length === 12) {
    digits = digits.slice(2);
  }
  if (digits.startsWith('0') && digits.length === 11) {
    digits = digits.slice(1);
  }
  return digits;
}

const getStartOfTodayKolkata = () => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const y = parts.find((p) => p.type === 'year').value;
  const m = parts.find((p) => p.type === 'month').value;
  const d = parts.find((p) => p.type === 'day').value;
  return new Date(`${y}-${m}-${d}T00:00:00.000+05:30`);
};

const createOrderSchema = z
  .object({
    item: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid item ID').optional().nullable(),
    customizationAnswers: z
      .array(
        z.object({
          label: z.string().trim().max(100),
          value: z.string().trim().max(500),
        })
      )
      .optional()
      .default([]),
    requirements: z.string().trim().max(2000).optional().default(''),
    referenceImages: z
      .array(
        z.object({
          url: z.string().url(),
          publicId: z.string().default(''),
        }).strict()
      )
      .max(3, 'A maximum of 3 reference images are allowed per order')
      .optional()
      .default([]),
    neededByDate: z
      .any()
      .transform((val, ctx) => {
        if (val === null || val === undefined || val === '') return null;
        const d = new Date(val);
        if (isNaN(d.getTime())) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Needed-by date must be a valid date',
          });
          return z.NEVER;
        }
        if (d < getStartOfTodayKolkata()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Needed-by date cannot be in the past',
          });
          return z.NEVER;
        }
        return d;
      })
      .optional()
      .nullable(),
    phone: z.string().trim().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number').optional(),
    customer: z
      .object({
        name: z.string().trim().min(2).max(80).optional(),
        phone: z.string().trim().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number').optional(),
        address: z.string().trim().max(500).optional().default(''),
      })
      .optional(),
    deliveryType: z.enum(['delivery', 'pickup']).optional().default('delivery'),
    address: z.string().trim().max(500).optional(),
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
  itemSnapshot: o.itemSnapshot || { title: '', image: '' },
  customizationAnswers: o.customizationAnswers || [],
  customer: {
    name: o.customer?.name || '',
    phone: o.customer?.phone || '',
    address: o.customer?.address || '',
  },
  deliveryType: o.deliveryType || (o.customer?.address === 'pickup' ? 'pickup' : 'delivery'),
  requirements: o.requirements || '',
  referenceImages: o.referenceImages || [],
  neededByDate: o.neededByDate,
  status: o.status,
  quotedPrice: o.quotedPrice,
  readyBy: o.readyBy,
  statusHistory: (o.statusHistory || []).map(({ status, changedAt }) => ({
    status,
    changedAt,
    at: changedAt, // alias
  })), // NEVER returns internal admin notes
  createdAt: o.createdAt,
  updatedAt: o.updatedAt,
});

// 1. POST /api/orders - Customer submits order or enquiry (Authenticated)
router.post(
  '/',
  requireAuth,
  orderLimiter,
  orderUserLimiter,
  validateBody(createOrderSchema),
  async (req, res, next) => {
    try {
      const user = await User.findById(req.user.id);
      if (!user) return res.status(401).json({ error: 'Please sign in to continue.' });

      // Cap open orders per user at 10
      const openOrdersCount = await Order.countDocuments({
        user: user._id,
        status: { $nin: ['delivered', 'cancelled'] },
      });
      if (openOrdersCount >= 10) {
        return res.status(400).json({
          error: 'You have reached the maximum limit of 10 active orders. Please wait for an existing order to complete before placing a new one.',
        });
      }

      let itemRef = null;
      let itemSnapshot = {
        title: 'Bespoke Custom Creation',
        image: '',
      };

      if (req.body.item) {
        const itemExists = await Item.findById(req.body.item);
        if (itemExists) {
          itemRef = itemExists._id;
          itemSnapshot = {
            title: itemExists.title,
            image: itemExists.images?.[0]?.url || '',
          };
        }
      }

      // Customer info & address/pickup resolution
      const rawDeliveryType = req.body.deliveryType || (req.body.address === 'pickup' ? 'pickup' : 'delivery');
      const deliveryAddress =
        rawDeliveryType === 'pickup'
          ? 'pickup'
          : req.body.address || req.body.customer?.address || '';

      const customerPhone = req.body.phone || req.body.customer?.phone || user.phone;

      const customer = {
        name: req.body.customer?.name || user.name,
        phone: customerPhone,
        address: deliveryAddress,
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
        itemSnapshot,
        customizationAnswers: req.body.customizationAnswers || [],
        customer,
        deliveryType: rawDeliveryType,
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
  }
);

// 2. POST /api/orders/upload - Customer reference image upload (Authenticated)
router.post('/upload', requireAuth, (req, res, next) => {
  uploadSingleImage(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message || 'File upload failed.' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided.' });
    }

    try {
      const uploadResult = await uploadToCloudinary(req.file.buffer, 'fouzas/orders');
      res.status(201).json(uploadResult);
    } catch (uploadErr) {
      res.status(500).json({ error: uploadErr.message || 'Image upload failed.' });
    }
  });
});

// Clean up an uploaded reference image if discarded
router.delete('/upload', requireAuth, async (req, res, next) => {
  try {
    const publicId = req.body?.publicId || req.query?.publicId;
    if (!publicId || typeof publicId !== 'string') {
      return res.status(400).json({ error: 'publicId is required.' });
    }
    // Security check: only permit deleting assets under fouzas/orders
    if (!publicId.startsWith('fouzas/orders')) {
      return res.status(403).json({ error: 'Cannot delete assets outside orders directory.' });
    }
    await deleteFromCloudinary(publicId);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// 3. GET /api/orders/mine - List orders owned by logged-in customer (Authenticated)
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

// 4. POST /api/orders/track - Public order tracking endpoint (Rate limited)
const trackSchema = z
  .object({
    orderNumber: z.string().trim().min(3).max(30),
    phone: z.string().trim().min(8).max(20),
  })
  .strict();

router.post('/track', trackLimiter, validateBody(trackSchema), async (req, res, next) => {
  try {
    const cleanPhone = normalizePhone(req.body.phone);
    const orderNum = req.body.orderNumber.trim();

    // Query order number case-insensitively
    const order = await Order.findOne({
      orderNumber: { $regex: new RegExp(`^${orderNum}$`, 'i') },
    }).populate('item', 'title');

    // Mismatch or not found returns the EXACT SAME generic 404 to prevent enumeration
    if (!order) {
      return res.status(404).json({ error: 'No order found with those details' });
    }

    const orderPhoneClean = normalizePhone(order.customer?.phone);
    if (!orderPhoneClean || orderPhoneClean !== cleanPhone) {
      return res.status(404).json({ error: 'No order found with those details' });
    }

    // Return strictly sanitized public tracking information
    // No address, phone, email, images, or admin notes!
    res.json({
      order: {
        orderNumber: order.orderNumber,
        status: order.status,
        statusTimeline: (order.statusHistory || []).map(({ status, changedAt }) => ({
          status,
          changedAt,
        })),
        readyBy: order.readyBy,
        quotedPrice: order.quotedPrice,
        itemTitle: order.itemSnapshot?.title || order.item?.title || 'Bespoke Custom Creation',
      },
    });
  } catch (err) {
    next(err);
  }
});

// 5. GET /api/orders/:orderNumberOrId - Single order owned by logged-in customer
router.get('/:orderNumberOrId', requireAuth, async (req, res, next) => {
  try {
    const query = req.params.orderNumberOrId;
    const filter = { user: req.user.id };

    if (query.startsWith('FC-') || query.startsWith('fc-')) {
      filter.orderNumber = { $regex: new RegExp(`^${query}$`, 'i') };
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

// 6. PATCH /api/orders/:orderNumberOrId/cancel - Customer cancels own order if status is 'placed'
router.patch('/:orderNumberOrId/cancel', requireAuth, async (req, res, next) => {
  try {
    const query = req.params.orderNumberOrId;
    const filter = { user: req.user.id };

    if (query.startsWith('FC-') || query.startsWith('fc-')) {
      filter.orderNumber = { $regex: new RegExp(`^${query}$`, 'i') };
    } else if (/^[0-9a-fA-F]{24}$/.test(query)) {
      filter._id = query;
    } else {
      return res.status(404).json({ error: 'Order not found.' });
    }

    const order = await Order.findOne(filter);
    if (!order) return res.status(404).json({ error: 'Order not found.' });

    if (order.status !== 'placed') {
      return res.status(400).json({
        error:
          'Orders can only be cancelled while in placed status. For updates on confirmed or in-progress orders, please contact us on WhatsApp.',
      });
    }

    order.status = 'cancelled';
    order.statusHistory.push({
      status: 'cancelled',
      changedAt: new Date(),
      note: 'Cancelled by customer',
    });
    await order.save();

    const populated = await Order.findById(order._id).populate('item', 'title category startingPrice images');
    res.json({ order: clientOrderView(populated) });
  } catch (err) {
    next(err);
  }
});

export default router;
