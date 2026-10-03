import { Router } from 'express';
import { z } from 'zod';
import { Order, ORDER_STATUSES } from '../models/Order.js';
import { Gift, GIFT_CATEGORIES, slugify } from '../models/Gift.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { uploadSingleImage } from '../middleware/upload.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../utils/cloudinary.js';

const router = Router();
router.use(requireAuth, requireRole('admin'));

// --- ORDERS ---

router.get('/orders', async (req, res, next) => {
  try {
    const status = ORDER_STATUSES.includes(req.query.status) ? req.query.status : undefined;
    const filter = status ? { status } : {};
    const orders = await Order.find(filter).populate('user', 'name email phone').sort({ createdAt: -1 }).limit(200);
    res.json({ orders });
  } catch (e) { next(e); }
});

const updateOrderSchema = z.object({
  status: z.enum(ORDER_STATUSES).optional(),
  customerNote: z.string().trim().max(500).optional(),
}).strict();

router.patch('/orders/:orderId', validateBody(updateOrderSchema), async (req, res, next) => {
  try {
    if (!/^FC-[0-9A-F]{8}$/.test(req.params.orderId)) return res.status(404).json({ error: 'Order not found.' });
    const order = await Order.findOne({ orderId: req.params.orderId });
    if (!order) return res.status(404).json({ error: 'Order not found.' });
    const { status, customerNote } = req.body;
    if (status && status !== order.status) {
      order.status = status;
      order.statusHistory.push({ status, by: `admin:${req.user.id}` });
    }
    if (customerNote !== undefined) order.customerNote = customerNote;
    await order.save();
    res.json({ order });
  } catch (e) { next(e); }
});

// --- GIFTS ---

async function getUniqueSlug(baseSlug, currentId = null) {
  let slug = baseSlug;
  let counter = 1;
  while (true) {
    const existing = await Gift.findOne({ slug });
    if (!existing || (currentId && existing._id.toString() === currentId.toString())) {
      return slug;
    }
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

const giftImageSchema = z.object({
  url: z.string().url(),
  publicId: z.string().default(''),
}).strict();

const createGiftSchema = z.object({
  title: z.string().trim().min(2).max(120),
  slug: z.string().trim().min(2).max(140).optional(),
  category: z.enum(GIFT_CATEGORIES),
  shortDescription: z.string().trim().max(300).optional().default(''),
  description: z.string().trim().min(1).max(5000),
  price: z.number().min(0),
  priceNote: z.string().trim().max(60).optional().default(''),
  images: z.array(giftImageSchema).min(1).max(6),
  includes: z.array(z.string().trim().max(120)).optional().default([]),
  customizationOptions: z.array(z.string().trim().max(120)).optional().default([]),
  occasions: z.array(z.string().trim().max(60)).optional().default([]),
  deliveryInfo: z.string().trim().max(500).optional().default(''),
  isFeatured: z.boolean().optional().default(false),
  isPublished: z.boolean().optional().default(true),
}).strict();

const updateGiftSchema = z.object({
  title: z.string().trim().min(2).max(120).optional(),
  slug: z.string().trim().min(2).max(140).optional(),
  category: z.enum(GIFT_CATEGORIES).optional(),
  shortDescription: z.string().trim().max(300).optional(),
  description: z.string().trim().min(1).max(5000).optional(),
  price: z.number().min(0).optional(),
  priceNote: z.string().trim().max(60).optional(),
  images: z.array(giftImageSchema).min(1).max(6).optional(),
  includes: z.array(z.string().trim().max(120)).optional(),
  customizationOptions: z.array(z.string().trim().max(120)).optional(),
  occasions: z.array(z.string().trim().max(60)).optional(),
  deliveryInfo: z.string().trim().max(500).optional(),
  isFeatured: z.boolean().optional(),
  isPublished: z.boolean().optional(),
}).strict();

// GET /api/admin/gifts - List all gifts (including unpublished)
router.get('/gifts', async (req, res, next) => {
  try {
    const gifts = await Gift.find().sort({ createdAt: -1 });
    res.json({ gifts });
  } catch (e) { next(e); }
});

// POST /api/admin/gifts - Create a new gift
router.post('/gifts', validateBody(createGiftSchema), async (req, res, next) => {
  try {
    const baseSlug = req.body.slug ? slugify(req.body.slug) : slugify(req.body.title);
    const uniqueSlug = await getUniqueSlug(baseSlug);

    const gift = await Gift.create({
      ...req.body,
      slug: uniqueSlug,
    });
    res.status(201).json({ gift });
  } catch (e) { next(e); }
});

// PUT /api/admin/gifts/:id - Update an existing gift
router.put('/gifts/:id', validateBody(updateGiftSchema), async (req, res, next) => {
  try {
    const gift = await Gift.findById(req.params.id);
    if (!gift) return res.status(404).json({ error: 'Gift not found.' });

    let slug = gift.slug;
    if (req.body.slug && req.body.slug !== gift.slug) {
      slug = await getUniqueSlug(slugify(req.body.slug), gift._id);
    } else if (req.body.title && req.body.title !== gift.title && !req.body.slug) {
      slug = await getUniqueSlug(slugify(req.body.title), gift._id);
    }

    Object.assign(gift, req.body, { slug });
    await gift.save();
    res.json({ gift });
  } catch (e) { next(e); }
});

// DELETE /api/admin/gifts/:id - Delete a gift and remove images from Cloudinary
router.delete('/gifts/:id', async (req, res, next) => {
  try {
    const gift = await Gift.findById(req.params.id);
    if (!gift) return res.status(404).json({ error: 'Gift not found.' });

    // Delete associated Cloudinary images
    if (Array.isArray(gift.images)) {
      await Promise.allSettled(
        gift.images
          .filter((img) => img.publicId)
          .map((img) => deleteFromCloudinary(img.publicId))
      );
    }

    await Gift.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// POST /api/admin/gifts/upload - Upload an image to Cloudinary via multer memory storage
router.post('/gifts/upload', (req, res, next) => {
  uploadSingleImage(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message || 'File upload failed.' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided.' });
    }

    try {
      const uploadResult = await uploadToCloudinary(req.file.buffer);
      res.status(201).json(uploadResult);
    } catch (uploadErr) {
      res.status(500).json({ error: uploadErr.message || 'Image upload to Cloudinary failed.' });
    }
  });
});

export default router;
