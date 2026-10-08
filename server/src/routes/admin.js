import { Router } from 'express';
import { z } from 'zod';
import { Order, ORDER_STATUSES } from '../models/Order.js';
import { Item, ITEM_CATEGORIES, slugify } from '../models/Item.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { uploadSingleImage } from '../middleware/upload.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../utils/cloudinary.js';
import { formatItemResponse } from './items.js';

const router = Router();
router.use(requireAuth, requireAdmin);

// --- ORDERS ---

function getKolkataDayBounds(dateInput) {
  if (!dateInput) return null;
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return null;
  const match = typeof dateInput === 'string' && dateInput.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  let y, m, day;
  if (match) {
    [, y, m, day] = match;
  } else {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(d);
    y = parts.find((p) => p.type === 'year').value;
    m = parts.find((p) => p.type === 'month').value;
    day = parts.find((p) => p.type === 'day').value;
  }
  const startOfDay = new Date(`${y}-${m}-${day}T00:00:00.000+05:30`);
  const endOfDay = new Date(`${y}-${m}-${day}T23:59:59.999+05:30`);
  return { startOfDay, endOfDay };
}

// GET /api/admin/stats
router.get('/stats', async (req, res, next) => {
  try {
    const now = new Date();
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const todayBounds = getKolkataDayBounds(now);

    const [statusAggregation, totalOrders, placedToday, overdueCount, dueWithin24hCount, recentOrdersRaw] =
      await Promise.all([
        Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
        Order.countDocuments(),
        Order.countDocuments({
          createdAt: { $gte: todayBounds.startOfDay, $lte: todayBounds.endOfDay },
        }),
        Order.countDocuments({
          readyBy: { $ne: null, $lt: now },
          status: { $nin: ['ready', 'delivered', 'cancelled'] },
        }),
        Order.countDocuments({
          readyBy: { $gte: now, $lte: in24h },
          status: { $nin: ['ready', 'delivered', 'cancelled'] },
        }),
        Order.find()
          .populate('user', 'name email phone')
          .populate('item', 'title category startingPrice images')
          .sort({ createdAt: -1 })
          .limit(10),
      ]);

    const countsByStatus = ORDER_STATUSES.reduce((acc, s) => {
      acc[s] = 0;
      return acc;
    }, {});
    statusAggregation.forEach((row) => {
      if (row._id && countsByStatus[row._id] !== undefined) {
        countsByStatus[row._id] = row.count;
      }
    });

    const recentOrders = recentOrdersRaw.map((o) => ({
      ...o.toObject(),
      id: o._id,
      orderId: o.orderNumber,
    }));

    res.json({
      countsByStatus,
      totalOrders,
      placedToday,
      overdueCount,
      dueWithin24hCount,
      recentOrders,
    });
  } catch (e) {
    next(e);
  }
});

// GET /api/admin/orders
router.get('/orders', async (req, res, next) => {
  try {
    const { status, startDate, endDate, search, q, overdue, page, limit } = req.query;
    const filter = {};

    // Search by order number, customer name, customer phone
    const searchTerm = (search || q || '').trim();
    if (searchTerm) {
      const escaped = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const searchRegex = new RegExp(escaped, 'i');
      filter.$or = [
        { orderNumber: searchRegex },
        { 'customer.name': searchRegex },
        { 'customer.phone': searchRegex },
      ];
    }

    // Status filter
    if (status && ORDER_STATUSES.includes(status)) {
      filter.status = status;
    }

    // Overdue filter: readyBy passed and status not ready, delivered or cancelled
    const isOverdue = overdue === 'true' || overdue === true || overdue === '1';
    if (isOverdue) {
      filter.readyBy = { $ne: null, $lt: new Date() };
      if (!filter.status) {
        filter.status = { $nin: ['ready', 'delivered', 'cancelled'] };
      }
    }

    // Date range filters
    let startBounds = null;
    let endBounds = null;

    if (startDate) {
      if (isNaN(new Date(startDate).getTime())) {
        return res.status(400).json({ error: 'Invalid startDate.' });
      }
      startBounds = getKolkataDayBounds(startDate);
    }

    if (endDate) {
      if (isNaN(new Date(endDate).getTime())) {
        return res.status(400).json({ error: 'Invalid endDate.' });
      }
      endBounds = getKolkataDayBounds(endDate);
    }

    if (startBounds && endBounds) {
      if (startBounds.startOfDay.getTime() > endBounds.endOfDay.getTime() || new Date(startDate) > new Date(endDate)) {
        return res.status(400).json({ error: 'startDate cannot be after endDate.' });
      }
    }

    if (startBounds || endBounds) {
      filter.createdAt = filter.createdAt || {};
      if (startBounds) filter.createdAt.$gte = startBounds.startOfDay;
      if (endBounds) filter.createdAt.$lte = endBounds.endOfDay;
    }

    // Pagination
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [total, orders] = await Promise.all([
      Order.countDocuments(filter),
      Order.find(filter)
        .populate('user', 'name email phone')
        .populate('item', 'title category startingPrice images')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
    ]);

    const totalPages = Math.ceil(total / limitNum) || 1;

    const formattedOrders = orders.map((o) => ({
      ...o.toObject(),
      id: o._id,
      orderId: o.orderNumber, // alias for frontend
    }));

    res.json({
      orders: formattedOrders,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
      },
    });
  } catch (e) {
    next(e);
  }
});

// GET /api/admin/orders/:orderNumberOrId
router.get('/orders/:orderNumberOrId', async (req, res, next) => {
  try {
    const idParam = req.params.orderNumberOrId;
    let filter = null;

    if (idParam.startsWith('FC-')) {
      filter = { orderNumber: idParam };
    } else if (/^[0-9a-fA-F]{24}$/.test(idParam)) {
      filter = { _id: idParam };
    } else {
      return res.status(404).json({ error: 'Order not found.' });
    }

    const order = await Order.findOne(filter)
      .populate('user', 'name email phone')
      .populate('item');

    if (!order) return res.status(404).json({ error: 'Order not found.' });

    res.json({
      order: {
        ...order.toObject(),
        id: order._id,
        orderId: order.orderNumber,
      },
    });
  } catch (e) {
    next(e);
  }
});

const updateOrderSchema = z
  .object({
    status: z.enum(ORDER_STATUSES).optional(),
    forceStatusOverride: z.boolean().optional(),
    overrideStatus: z.boolean().optional(),
    adminNotes: z.string().trim().max(1000).optional(),
    customerNote: z.string().trim().max(500).optional(), // alias
    quotedPrice: z.number().min(0).optional().nullable(),
    readyBy: z
      .preprocess((val) => {
        if (val === null || val === undefined || val === '') return null;
        return val;
      }, z.union([
        z.null(),
        z.undefined(),
        z.coerce
          .date({ errorMap: () => ({ message: 'Invalid ready-by date.' }) })
          .refine((d) => !isNaN(d.getTime()), { message: 'Invalid ready-by date.' }),
      ]))
      .optional()
      .nullable(),
    note: z.string().trim().max(500).optional(),
  })
  .strict();

router.patch('/orders/:orderNumberOrId', validateBody(updateOrderSchema), async (req, res, next) => {
  try {
    const idParam = req.params.orderNumberOrId;
    let order = null;

    if (idParam.startsWith('FC-')) {
      order = await Order.findOne({ orderNumber: idParam });
    } else if (/^[0-9a-fA-F]{24}$/.test(idParam)) {
      order = await Order.findById(idParam);
    }

    if (!order) return res.status(404).json({ error: 'Order not found.' });

    const {
      status,
      forceStatusOverride,
      overrideStatus,
      adminNotes,
      customerNote,
      quotedPrice,
      readyBy,
      note,
    } = req.body;
    const isOverride = !!(forceStatusOverride || overrideStatus);

    // 1. Enforce sensible status transitions:
    // No moving out of delivered or cancelled without an explicit admin override flag
    if (
      ['delivered', 'cancelled'].includes(order.status) &&
      status &&
      status !== order.status &&
      !isOverride
    ) {
      return res.status(400).json({
        error: `Cannot change status from "${order.status}" to "${status}" without admin override.`,
      });
    }

    // 2. Require readyBy when moving to "confirmed" unless already set
    if (status === 'confirmed') {
      const effectiveReadyBy = readyBy !== undefined ? readyBy : order.readyBy;
      if (!effectiveReadyBy) {
        return res.status(400).json({
          error: 'Ready-by date is required when moving order to confirmed status.',
        });
      }
    }

    // 3. Ready-by date validation
    if (readyBy !== undefined) {
      if (readyBy !== null) {
        const readyTime = new Date(readyBy).getTime();
        const createdTime = new Date(order.createdAt).getTime();
        if (isNaN(readyTime) || readyTime < createdTime) {
          return res.status(400).json({
            error: 'Ready-by date cannot be earlier than the order placement date.',
          });
        }
        order.readyBy = readyBy;
      } else {
        const nextStatus = status || order.status;
        if (nextStatus === 'confirmed') {
          return res.status(400).json({
            error: 'Ready-by date cannot be cleared for a confirmed order.',
          });
        }
        order.readyBy = null;
      }
    }

    // 4. Append every change to statusHistory with timestamp and optional note
    const statusChanged = status && status !== order.status;
    const defaultStatusNote = statusChanged ? `Status updated to ${status} by admin` : null;
    const entryNote = note || defaultStatusNote;

    if (statusChanged) {
      order.status = status;
      order.statusHistory.push({
        status,
        changedAt: new Date(),
        note: entryNote,
      });
    } else if (note) {
      order.statusHistory.push({
        status: order.status,
        changedAt: new Date(),
        note,
      });
    }

    if (adminNotes !== undefined) order.adminNotes = adminNotes;
    else if (customerNote !== undefined) order.adminNotes = customerNote;

    if (quotedPrice !== undefined) order.quotedPrice = quotedPrice;

    await order.save();
    const updated = await Order.findById(order._id)
      .populate('user', 'name email phone')
      .populate('item');

    res.json({
      order: {
        ...updated.toObject(),
        id: updated._id,
        orderId: updated.orderNumber,
      },
    });
  } catch (e) {
    next(e);
  }
});

// --- ITEMS (CRUD) ---

async function getUniqueSlug(baseSlug, currentId = null) {
  let slug = baseSlug;
  let counter = 1;
  while (true) {
    const existing = await Item.findOne({ slug });
    if (!existing || (currentId && existing._id.toString() === currentId.toString())) {
      return slug;
    }
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

const itemImageSchema = z
  .object({
    url: z.string().url(),
    publicId: z.string().default(''),
  })
  .strict();

const customizationOptionSchema = z
  .object({
    label: z.string().trim().min(1).max(100),
    type: z.string().trim().min(1).max(50),
  })
  .strict();

const createItemSchema = z
  .object({
    title: z.string().trim().min(2).max(120),
    slug: z.string().trim().min(2).max(140).optional(),
    description: z.string().trim().min(1).max(5000),
    category: z.enum(ITEM_CATEGORIES),
    images: z.array(itemImageSchema).min(1, 'At least 1 image is required').max(6, 'Maximum 6 images allowed'),
    startingPrice: z.number().min(0).optional().nullable().default(null),
    price: z.number().min(0).optional().nullable(), // alias
    customizationOptions: z
      .array(
        z.union([
          customizationOptionSchema,
          z.string().transform((str) => ({ label: str, type: 'text' })),
        ])
      )
      .max(20)
      .optional()
      .default([]),
    occasionTags: z.array(z.string().trim().max(60)).max(20).optional().default([]),
    occasions: z.array(z.string().trim().max(60)).max(20).optional(), // alias
    prepTimeDays: z.number().int().min(0).max(60).optional().default(2),
    isFeatured: z.boolean().optional().default(false),
    isVisible: z.boolean().optional().default(true),
    isPublished: z.boolean().optional(), // alias
    deliveryInfo: z.string().optional(),
    shortDescription: z.string().optional(),
    includes: z.array(z.string()).optional(),
  })
  .strict();

const updateItemSchema = createItemSchema.partial();

// Normalize payload to conform to Item model
function normalizeItemBody(body) {
  const normalized = { ...body };
  if (normalized.price !== undefined && normalized.startingPrice === undefined) {
    normalized.startingPrice = normalized.price;
  }
  if (normalized.occasions !== undefined && normalized.occasionTags === undefined) {
    normalized.occasionTags = normalized.occasions;
  }
  if (normalized.isPublished !== undefined && normalized.isVisible === undefined) {
    normalized.isVisible = normalized.isPublished;
  }
  return normalized;
}

// GET /api/admin/items
const listItemsHandler = async (req, res, next) => {
  try {
    const items = await Item.find().sort({ createdAt: -1 });
    const formatted = items.map(formatItemResponse);
    res.json({ items: formatted });
  } catch (e) {
    next(e);
  }
};
router.get('/items', listItemsHandler);

// POST /api/admin/items
const createItemHandler = async (req, res, next) => {
  try {
    const normalized = normalizeItemBody(req.body);
    const baseSlug = normalized.slug ? slugify(normalized.slug) : slugify(normalized.title);
    const uniqueSlug = await getUniqueSlug(baseSlug);

    const item = await Item.create({
      ...normalized,
      slug: uniqueSlug,
    });
    const formatted = formatItemResponse(item);
    res.status(201).json({ item: formatted });
  } catch (e) {
    next(e);
  }
};
router.post('/items', validateBody(createItemSchema), createItemHandler);

// PUT / PATCH /api/admin/items/:id
const updateItemHandler = async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Item not found.' });

    const normalized = normalizeItemBody(req.body);
    let slug = item.slug;
    if (normalized.slug && normalized.slug !== item.slug) {
      slug = await getUniqueSlug(slugify(normalized.slug), item._id);
    } else if (normalized.title && normalized.title !== item.title && !normalized.slug) {
      slug = await getUniqueSlug(slugify(normalized.title), item._id);
    }

    // Clean up removed images from Cloudinary
    if (Array.isArray(normalized.images) && Array.isArray(item.images)) {
      const newPublicIds = new Set(normalized.images.map((img) => img.publicId).filter(Boolean));
      const removedImages = item.images.filter(
        (img) => img.publicId && !newPublicIds.has(img.publicId)
      );
      if (removedImages.length > 0) {
        await Promise.allSettled(
          removedImages.map((img) => deleteFromCloudinary(img.publicId))
        );
      }
    }

    Object.assign(item, normalized, { slug });
    await item.save();
    const formatted = formatItemResponse(item);
    res.json({ item: formatted });
  } catch (e) {
    next(e);
  }
};
router.put('/items/:id', validateBody(updateItemSchema), updateItemHandler);
router.patch('/items/:id', validateBody(updateItemSchema), updateItemHandler);

// DELETE /api/admin/items/:id
const deleteItemHandler = async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Item not found.' });

    // Block delete if existing orders reference this item
    const referencingOrdersCount = await Order.countDocuments({ item: item._id });
    if (referencingOrdersCount > 0) {
      return res.status(400).json({
        error: `Cannot delete item because ${referencingOrdersCount} existing order(s) reference it. Please hide the item instead.`,
      });
    }

    if (Array.isArray(item.images)) {
      await Promise.allSettled(
        item.images
          .filter((img) => img.publicId)
          .map((img) => deleteFromCloudinary(img.publicId))
      );
    }

    await Item.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
};
router.delete('/items/:id', deleteItemHandler);

// POST /api/admin/items/upload
const uploadHandler = (req, res, next) => {
  uploadSingleImage(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message || 'File upload failed.' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided.' });
    }

    try {
      const uploadResult = await uploadToCloudinary(req.file.buffer, 'fouzas/items');
      res.status(201).json(uploadResult);
    } catch (uploadErr) {
      res.status(500).json({ error: uploadErr.message || 'Image upload to Cloudinary failed.' });
    }
  });
};
router.post('/items/upload', uploadHandler);

export default router;
