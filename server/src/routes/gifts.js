import { Router } from 'express';
import { Gift, GIFT_CATEGORIES } from '../models/Gift.js';

const router = Router();

// GET /api/gifts/featured - Featured gifts on homepage
router.get('/featured', async (req, res, next) => {
  try {
    const gifts = await Gift.find({ isPublished: true, isFeatured: true })
      .sort({ createdAt: -1 })
      .limit(8);
    res.json({ gifts });
  } catch (err) {
    next(err);
  }
});

// GET /api/gifts - Filterable, searchable, paginated published gifts
router.get('/', async (req, res, next) => {
  try {
    const { category, occasion, q } = req.query;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 12));

    const filter = { isPublished: true };

    if (category && category !== 'All') {
      const matchedCategory = GIFT_CATEGORIES.find(
        (c) => c.toLowerCase() === category.toLowerCase()
      );
      if (matchedCategory) {
        filter.category = matchedCategory;
      }
    }

    const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    if (occasion && occasion !== 'All') {
      const escapedOccasion = escapeRegex(occasion.trim());
      filter.occasions = { $in: [new RegExp(`^${escapedOccasion}$`, 'i')] };
    }

    if (q && q.trim()) {
      const escapedQ = escapeRegex(q.trim());
      filter.$or = [
        { title: { $regex: escapedQ, $options: 'i' } },
        { shortDescription: { $regex: escapedQ, $options: 'i' } },
        { description: { $regex: escapedQ, $options: 'i' } },
      ];
    }

    const [gifts, total] = await Promise.all([
      Gift.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Gift.countDocuments(filter),
    ]);

    res.json({
      gifts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/gifts/:slug - Single published gift by slug
router.get('/:slug', async (req, res, next) => {
  try {
    const { slug } = req.params;
    const gift = await Gift.findOne({ slug, isPublished: true });
    if (!gift) {
      return res.status(404).json({ error: 'Gift not found.' });
    }
    res.json({ gift });
  } catch (err) {
    next(err);
  }
});

export default router;
