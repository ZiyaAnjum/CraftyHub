import { Router } from 'express';
import { z } from 'zod';
import multer from 'multer';
import { Template, TEMPLATE_CATEGORIES, slugifyTemplate } from '../models/Template.js';
import { Order } from '../models/Order.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { uploadLimiter } from '../middleware/rateLimiters.js';
import cloudinary from '../utils/cloudinary.js';
import { env } from '../config/env.js';

// Helper to strictly validate http/https URLs and reject javascript:, data:, etc.
export const isHttpUrl = (val) => {
  if (typeof val !== 'string') return false;
  try {
    const parsed = new URL(val);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

const httpUrlSchema = z
  .string()
  .trim()
  .refine(isHttpUrl, { message: 'Must be a valid HTTP or HTTPS URL' });

export async function getUniqueTemplateSlug(baseSlug, currentId = null) {
  let slug = baseSlug;
  let counter = 1;
  while (true) {
    const existing = await Template.findOne({ slug });
    if (!existing || (currentId && existing._id.toString() === currentId.toString())) {
      return slug;
    }
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

// Multer memory storage configuration for admin video upload (MP4 only, max 20MB - Amendment 10)
const videoUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'video/mp4') {
      cb(null, true);
    } else {
      cb(new Error('Only MP4 video files (video/mp4) are allowed.'));
    }
  },
}).single('video');

// -------------------------------------------------------------
// 1. PUBLIC TEMPLATE ROUTES (Mounted at /api/templates)
// -------------------------------------------------------------
export const publicTemplateRoutes = Router();

// GET /api/templates - List active templates with optional filters
publicTemplateRoutes.get('/', async (req, res, next) => {
  try {
    const { category, q, sort } = req.query;
    const filter = { isActive: true };

    if (category && category !== 'All' && category !== 'all') {
      const matched = TEMPLATE_CATEGORIES.find(
        (c) => c.toLowerCase() === category.trim().toLowerCase()
      );
      if (matched) {
        filter.category = matched;
      }
    }

    if (q && q.trim()) {
      const escaped = q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { title: { $regex: escaped, $options: 'i' } },
        { description: { $regex: escaped, $options: 'i' } },
      ];
    }

    let sortOption = { sortOrder: 1, isFeatured: -1, createdAt: -1 };
    if (sort === 'price_asc') {
      sortOption = { basePrice: 1, createdAt: -1 };
    } else if (sort === 'price_desc') {
      sortOption = { basePrice: -1, createdAt: -1 };
    } else if (sort === 'newest') {
      sortOption = { createdAt: -1 };
    }

    const templates = await Template.find(filter).sort(sortOption).lean();
    res.json({ templates });
  } catch (err) {
    next(err);
  }
});

// GET /api/templates/:slugOrId - Public template detail
publicTemplateRoutes.get('/:slugOrId', async (req, res, next) => {
  try {
    const param = req.params.slugOrId.trim();
    let filter = null;

    if (/^[0-9a-fA-F]{24}$/.test(param)) {
      filter = { _id: param, isActive: true };
    } else {
      filter = { slug: param.toLowerCase(), isActive: true };
    }

    const template = await Template.findOne(filter).lean();
    if (!template) {
      return res.status(404).json({ error: 'Video template not found or is currently inactive.' });
    }

    res.json({ template });
  } catch (err) {
    next(err);
  }
});

// -------------------------------------------------------------
// 2. ADMIN TEMPLATE ROUTES (Mounted at /api/admin/templates)
// -------------------------------------------------------------
export const adminTemplateRoutes = Router();
adminTemplateRoutes.use(requireAuth, requireAdmin);

const createTemplateSchema = z
  .object({
    title: z.string().trim().min(2, 'Title must be at least 2 characters').max(120),
    slug: z.string().trim().max(140).optional(),
    category: z.enum(TEMPLATE_CATEGORIES),
    description: z.string().trim().min(5, 'Description must be at least 5 characters').max(3000),
    previewVideoUrl: httpUrlSchema,
    thumbnailUrl: httpUrlSchema,
    basePrice: z.number().min(0, 'Base price cannot be negative'),
    deliveryDays: z.number().int().min(1).max(30).optional().default(2),
    whatsIncluded: z.array(z.string().trim().max(200)).max(15).optional().default([
      'Full HD 1080p Video File',
      'Custom Music / Audio Sync',
      'Up to 2 Rounds of Minor Text Edits',
      'Digital Delivery via Cloud Drive Link',
    ]),
    aspectRatio: z.enum(['9:16', '16:9', '1:1']).optional().default('9:16'),
    sampleAudioTitle: z.string().trim().max(120).optional().default(''),
    isActive: z.boolean().optional().default(true),
    isFeatured: z.boolean().optional().default(false),
    sortOrder: z.number().int().optional().default(0),
  })
  .strict();

const updateTemplateSchema = createTemplateSchema.partial();

// GET /api/admin/templates - Admin list all templates (active + hidden)
adminTemplateRoutes.get('/', async (req, res, next) => {
  try {
    const templates = await Template.find().sort({ sortOrder: 1, createdAt: -1 }).lean();
    res.json({ templates });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/templates/:id - Admin get template for editing
adminTemplateRoutes.get('/:id', async (req, res, next) => {
  try {
    const template = await Template.findById(req.params.id).lean();
    if (!template) {
      return res.status(404).json({ error: 'Template not found.' });
    }
    res.json({ template });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/templates - Create new template
adminTemplateRoutes.post('/', validateBody(createTemplateSchema), async (req, res, next) => {
  try {
    const baseSlug = req.body.slug ? slugifyTemplate(req.body.slug) : slugifyTemplate(req.body.title);
    const uniqueSlug = await getUniqueTemplateSlug(baseSlug);

    const template = await Template.create({
      ...req.body,
      slug: uniqueSlug,
    });

    res.status(201).json({ template });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/templates/:id - Update existing template
adminTemplateRoutes.patch('/:id', validateBody(updateTemplateSchema), async (req, res, next) => {
  try {
    const template = await Template.findById(req.params.id);
    if (!template) {
      return res.status(404).json({ error: 'Template not found.' });
    }

    if (req.body.title && !req.body.slug && req.body.title !== template.title) {
      const baseSlug = slugifyTemplate(req.body.title);
      req.body.slug = await getUniqueTemplateSlug(baseSlug, template._id);
    } else if (req.body.slug && req.body.slug !== template.slug) {
      req.body.slug = await getUniqueTemplateSlug(slugifyTemplate(req.body.slug), template._id);
    }

    Object.assign(template, req.body);
    await template.save();

    res.json({ template });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/templates/:id - Delete or soft-hide template (Amendment 9)
adminTemplateRoutes.delete('/:id', async (req, res, next) => {
  try {
    const template = await Template.findById(req.params.id);
    if (!template) {
      return res.status(404).json({ error: 'Template not found.' });
    }

    // Check if any existing orders reference this template
    const orderCount = await Order.countDocuments({ template: template._id });
    if (orderCount > 0) {
      // Soft-archive to protect order records
      template.isActive = false;
      await template.save();
      return res.json({
        message: `Template has ${orderCount} existing order(s). It has been hidden from public view instead of permanently deleted to preserve customer records.`,
        archived: true,
        template,
      });
    }

    await Template.findByIdAndDelete(template._id);
    res.json({ message: 'Template successfully deleted.', id: template._id });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/templates/upload-video - Admin video upload (MP4 only, max 20MB - Amendment 10)
adminTemplateRoutes.post('/upload-video', uploadLimiter, (req, res, next) => {
  videoUpload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message || 'Video upload failed.' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No video file provided.' });
    }

    if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
      return res.status(500).json({ error: 'Cloudinary credentials are not configured on the server.' });
    }

    try {
      const uploadResult = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: 'fouzas/templates',
            resource_type: 'video',
            allowed_formats: ['mp4'],
          },
          (uploadErr, result) => {
            if (uploadErr) return reject(uploadErr);
            resolve(result);
          }
        );
        stream.end(req.file.buffer);
      });

      // Generate video URL and poster thumbnail URL
      const videoUrl = uploadResult.secure_url;
      const posterUrl = videoUrl.replace(/\.[a-zA-Z0-9]+$/, '.jpg');

      res.status(201).json({
        previewVideoUrl: videoUrl,
        thumbnailUrl: posterUrl,
        publicId: uploadResult.public_id,
        duration: uploadResult.duration || null,
        format: uploadResult.format,
      });
    } catch (uploadErr) {
      res.status(500).json({ error: uploadErr.message || 'Video upload to Cloudinary failed.' });
    }
  });
});

export default publicTemplateRoutes;
