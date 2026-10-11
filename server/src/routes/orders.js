import { Router } from 'express';
import { z } from 'zod';
import { Order, ORDER_STATUSES } from '../models/Order.js';
import { User } from '../models/User.js';
import { Item } from '../models/Item.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { orderLimiter, orderUserLimiter, trackLimiter, trackOrderNumberLimiter } from '../middleware/rateLimiters.js';
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

export function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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

export const ALLOWED_FONTS = [
  "'Playfair Display', Georgia, serif",
  'Inter, system-ui, sans-serif',
  'Georgia, serif',
  "'Courier New', Courier, monospace",
];

export const ALLOWED_COLORS = [
  '#C4486A',
  '#D4AF37',
  '#1E293B',
  '#991B1B',
  '#065F46',
  '#1E3A8A',
];

export const ALLOWED_THEMES = ['floral', 'minimal', 'celebration', 'vintage'];

export const BASE_HAMPERS = {
  velvet_trunk: {
    id: 'velvet_trunk',
    name: 'Royal Velvet Keepsake Trunk',
    price: 899,
    description: 'Luxury handcrafted trunk in blush velvet with antique brass clasps',
  },
  wicker_basket: {
    id: 'wicker_basket',
    name: 'Handwoven Artisanal Wicker Basket',
    price: 499,
    description: 'Natural eco-friendly willow basket with satin ribbon wrapping',
  },
  matte_box: {
    id: 'matte_box',
    name: 'Classic Matte Magnetic Gift Box',
    price: 299,
    description: 'Rigid luxury gift box with embossed finish and magnetic closure',
  },
  wooden_tray: {
    id: 'wooden_tray',
    name: 'Carved Wooden Presentation Platter',
    price: 399,
    description: 'Rustic solid pine platter with decorative presentation shavings',
  },
};

const customizationAnswerSchema = z
  .object({
    label: z.string().trim().max(100),
    value: z.string().trim().max(500),
  })
  .superRefine((data, ctx) => {
    const label = data.label.toLowerCase();
    const val = data.value.trim();

    if (label === 'custom inscription' || label === 'preview inscription') {
      if (val.length > 80) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Custom inscription must not exceed 80 characters',
        });
      }
    } else if (label === 'inscription subtitle' || label === 'preview subtitle') {
      if (val.length > 40) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Inscription subtitle must not exceed 40 characters',
        });
      }
    } else if (label === 'chosen font' || label === 'preview font') {
      if (!ALLOWED_FONTS.includes(val)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Chosen font must be one of allowed typography styles',
        });
      }
    } else if (label === 'chosen accent color' || label === 'preview color') {
      if (!ALLOWED_COLORS.map((c) => c.toLowerCase()).includes(val.toLowerCase())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Chosen color must be one of allowed palette hex codes',
        });
      }
    } else if (label === 'chosen frame style' || label === 'preview theme') {
      if (!ALLOWED_THEMES.includes(val.toLowerCase())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Chosen frame style must be one of: ${ALLOWED_THEMES.join(', ')}`,
        });
      }
    }
  });

const hamperItemInputSchema = z.object({
  item: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid item ID in hamper'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1').max(5, 'Maximum 5 of any single item per hamper'),
});

const hamperInputSchema = z.object({
  baseId: z
    .string()
    .trim()
    .refine((val) => Boolean(BASE_HAMPERS[val]), {
      message: 'Unknown hamper base selection. Please select a valid hamper base.',
    }),
  items: z.array(hamperItemInputSchema).min(1, 'A hamper must contain at least 1 item').max(10, 'A hamper can hold a maximum of 10 items'),
  giftMessage: z.string().trim().max(500, 'Gift message cannot exceed 500 characters').optional().default(''),
});

const createOrderSchema = z
  .object({
    item: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid item ID').optional().nullable(),
    customizationAnswers: z.array(customizationAnswerSchema).max(20, 'Maximum 20 customization answers allowed').optional().default([]),
    hamper: hamperInputSchema.optional().nullable(),
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
  hamper: o.hamper || null,
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
  customerNote: o.customerNote || '', // Customer-visible note from artisan (F-22, F-63)
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

      // PRD F-95: Block order placement for unverified users
      if (!user.emailVerified) {
        return res.status(403).json({
          error: 'Please verify your email address before placing an order.',
          code: 'EMAIL_NOT_VERIFIED',
          email: user.email,
        });
      }

      // Cap open orders per user at 10 (counting only active orders: placed, confirmed, in_progress, ready)
      const openOrdersCount = await Order.countDocuments({
        user: user._id,
        status: { $in: ['placed', 'confirmed', 'in_progress', 'ready'] },
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
        if (!itemExists || itemExists.isVisible === false) {
          return res.status(400).json({
            error: 'The selected product is invalid, unpublished, or no longer available.',
          });
        }
        itemRef = itemExists._id;
        itemSnapshot = {
          title: itemExists.title,
          image: itemExists.images?.[0]?.url || '',
        };
      }

      // Handle Hamper Recalculation & Security (F-40 to F-42, S-17)
      let hamperData = null;
      let serverCalculatedPrice = null;

      if (req.body.hamper) {
        const { baseId, items: rawHamperItems, giftMessage } = req.body.hamper;
        const baseInfo = BASE_HAMPERS[baseId];
        if (!baseInfo) {
          return res.status(400).json({
            error: `Invalid or unknown hamper base selection '${baseId}'. Please select a valid hamper base.`,
          });
        }

        // Merge duplicate hamper items by itemId before checking per-item and total limits
        const mergedMap = new Map();
        for (const entry of rawHamperItems) {
          const idStr = String(entry.item);
          const currentQty = mergedMap.get(idStr) || 0;
          mergedMap.set(idStr, currentQty + Number(entry.quantity));
        }

        const mergedHamperItems = [];
        for (const [itemId, qty] of mergedMap.entries()) {
          if (qty > 5) {
            return res.status(400).json({
              error: 'Maximum 5 of any single item allowed per hamper.',
            });
          }
          mergedHamperItems.push({ item: itemId, quantity: qty });
        }

        const totalQuantity = mergedHamperItems.reduce((sum, i) => sum + i.quantity, 0);
        if (totalQuantity > 10) {
          return res.status(400).json({
            error: 'A hamper can hold a maximum of 10 items total.',
          });
        }

        const uniqueIds = mergedHamperItems.map((i) => i.item);
        const dbItems = await Item.find({
          _id: { $in: uniqueIds },
          isVisible: true,
          isHamperEligible: { $ne: false },
        }).lean();

        if (dbItems.length !== uniqueIds.length) {
          return res.status(400).json({
            error: 'One or more items in the hamper are unpublished, discontinued, ineligible, or do not exist.',
          });
        }

        for (const dbItem of dbItems) {
          if (dbItem.startingPrice === null || dbItem.startingPrice === undefined || dbItem.startingPrice <= 0) {
            return res.status(400).json({
              error: `Item "${dbItem.title}" cannot be added to a hamper because it does not have a fixed unit price.`,
            });
          }
        }

        let itemsSubtotal = 0;
        const validatedHamperItems = mergedHamperItems.map((entry) => {
          const dbItem = dbItems.find((d) => String(d._id) === String(entry.item));
          const unitPrice =
            dbItem.startingPrice !== null && dbItem.startingPrice !== undefined && Number.isFinite(dbItem.startingPrice)
              ? Number(dbItem.startingPrice)
              : 0;
          const totalPrice = unitPrice * entry.quantity;
          itemsSubtotal += totalPrice;

          return {
            item: dbItem._id,
            title: dbItem.title,
            quantity: entry.quantity,
            unitPrice,
            totalPrice,
            image: dbItem.images?.[0]?.url || '',
          };
        });

        serverCalculatedPrice = baseInfo.price + itemsSubtotal;

        hamperData = {
          base: {
            id: baseInfo.id,
            name: baseInfo.name,
            price: baseInfo.price,
          },
          items: validatedHamperItems,
          giftMessage: giftMessage || '',
          calculatedTotal: serverCalculatedPrice,
        };

        if (!itemRef) {
          itemSnapshot = {
            title: `Build-Your-Own Hamper (${baseInfo.name})`,
            image: validatedHamperItems[0]?.image || '',
          };
        }
      }

      // Customer info & address/pickup resolution
      const rawDeliveryType = req.body.deliveryType || (req.body.address === 'pickup' ? 'pickup' : 'delivery');
      const deliveryAddress =
        rawDeliveryType === 'pickup'
          ? 'pickup'
          : req.body.address || req.body.customer?.address || '';

      // Customer info strictly bound to authenticated session (PRD S-06 / F-10)
      const customer = {
        name: user.name,
        phone: user.phone,
        address: deliveryAddress,
      };

      // Consolidate requirements text
      let reqText = req.body.requirements || '';
      if (!reqText && (req.body.occasion || req.body.customization || req.body.items?.length || hamperData)) {
        const parts = [];
        if (req.body.occasion) parts.push(`Occasion: ${req.body.occasion}`);
        if (req.body.budget) parts.push(`Budget: ₹${req.body.budget}`);
        if (hamperData) {
          parts.push(`Hamper Base: ${hamperData.base.name}`);
          parts.push(`Hamper Items: ${hamperData.items.map((i) => `${i.title} (x${i.quantity})`).join(', ')}`);
          if (hamperData.giftMessage) parts.push(`Gift Message: "${hamperData.giftMessage}"`);
        } else if (req.body.items?.length) {
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
        hamper: hamperData,
        quotedPrice: serverCalculatedPrice !== null ? serverCalculatedPrice : (req.body.budget || null),
        customizationAnswers: req.body.customizationAnswers || [],
        customer,
        deliveryType: rawDeliveryType,
        requirements: reqText,
        occasion: req.body.occasion || (hamperData ? 'Hamper Celebration' : ''),
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
      const uploadResult = await uploadToCloudinary(req.file.buffer, `fouzas/orders/${req.user.id}`);
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
    // Security check: user may only delete images they uploaded themselves
    const userPrefix = `fouzas/orders/${req.user.id}/`;
    if (!publicId.startsWith(userPrefix)) {
      return res.status(403).json({ error: 'Cannot delete images you did not upload.' });
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

router.post('/track', trackLimiter, trackOrderNumberLimiter, validateBody(trackSchema), async (req, res, next) => {
  try {
    const cleanPhone = normalizePhone(req.body.phone);
    const orderNum = req.body.orderNumber.trim();

    // Query order number case-insensitively with regex escaping
    const order = await Order.findOne({
      orderNumber: { $regex: new RegExp(`^${escapeRegex(orderNum)}$`, 'i') },
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
        customerNote: order.customerNote || '',
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

    if (query.toUpperCase().startsWith('FC-')) {
      filter.orderNumber = { $regex: new RegExp(`^${escapeRegex(query)}$`, 'i') };
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

// 6. PATCH /api/orders/:orderNumberOrId/cancel - Customer cancels own order atomically if status is 'placed'
router.patch('/:orderNumberOrId/cancel', requireAuth, async (req, res, next) => {
  try {
    const query = req.params.orderNumberOrId;
    const filter = { user: req.user.id };

    if (query.toUpperCase().startsWith('FC-')) {
      filter.orderNumber = { $regex: new RegExp(`^${escapeRegex(query)}$`, 'i') };
    } else if (/^[0-9a-fA-F]{24}$/.test(query)) {
      filter._id = query;
    } else {
      return res.status(404).json({ error: 'Order not found.' });
    }

    const existing = await Order.findOne(filter);
    if (!existing) return res.status(404).json({ error: 'Order not found.' });

    if (existing.status !== 'placed') {
      return res.status(400).json({
        error:
          'Orders can only be cancelled while in placed status. For updates on confirmed or in-progress orders, please contact us on WhatsApp.',
      });
    }

    // Atomic update matching status: 'placed' so it cannot race with an admin confirming
    const order = await Order.findOneAndUpdate(
      { ...filter, status: 'placed' },
      {
        $set: { status: 'cancelled' },
        $push: {
          statusHistory: {
            status: 'cancelled',
            changedAt: new Date(),
            note: 'Cancelled by customer',
          },
        },
      },
      { new: true }
    ).populate('item', 'title category startingPrice images');

    if (!order) {
      return res.status(400).json({
        error:
          'Orders can only be cancelled while in placed status. For updates on confirmed or in-progress orders, please contact us on WhatsApp.',
      });
    }

    res.json({ order: clientOrderView(order) });
  } catch (err) {
    next(err);
  }
});

export default router;
