import { Router } from 'express';
import { Item, ITEM_CATEGORIES } from '../models/Item.js';

const router = Router();

export const formatItemResponse = (item) => {
  const obj = item.toObject ? item.toObject() : item;
  return {
    ...obj,
    id: obj._id,
    // Backward-compatibility aliases for current frontend components
    price: obj.startingPrice !== null ? obj.startingPrice : 0,
    priceNote: obj.startingPrice === null ? 'price on request' : 'starting price',
    occasions: obj.occasionTags || [],
    isPublished: obj.isVisible,
  };
};

// GET /api/items/featured - Featured items on homepage
router.get('/featured', async (req, res, next) => {
  try {
    const items = await Item.find({ isVisible: true, isFeatured: true })
      .sort({ createdAt: -1 })
      .limit(8);
    res.json({
      items: items.map(formatItemResponse),
      gifts: items.map(formatItemResponse), // alias for current frontend
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/items - Filterable, searchable, paginated visible items
router.get('/', async (req, res, next) => {
  try {
    const { category, occasion, q } = req.query;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 12));

    const filter = { isVisible: true };

    if (category && category !== 'All') {
      const matchedCategory = ITEM_CATEGORIES.find(
        (c) => c.toLowerCase() === category.toLowerCase()
      );
      if (matchedCategory) {
        filter.category = matchedCategory;
      }
    }

    const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    if (occasion && occasion !== 'All') {
      const escapedOccasion = escapeRegex(occasion.trim());
      filter.occasionTags = { $in: [new RegExp(`^${escapedOccasion}$`, 'i')] };
    }

    if (q && q.trim()) {
      const escapedQ = escapeRegex(q.trim());
      filter.$or = [
        { title: { $regex: escapedQ, $options: 'i' } },
        { description: { $regex: escapedQ, $options: 'i' } },
      ];
    }

    const [items, total] = await Promise.all([
      Item.find(filter)
        .sort({ isFeatured: -1, createdAt: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Item.countDocuments(filter),
    ]);

    const formatted = items.map(formatItemResponse);

    res.json({
      items: formatted,
      gifts: formatted, // alias for current frontend
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

// GET /api/items/:slugOrId - Single visible item by slug or ID
router.get('/:slugOrId', async (req, res, next) => {
  try {
    const { slugOrId } = req.params;
    let item = await Item.findOne({ slug: slugOrId, isVisible: true });
    if (!item && /^[0-9a-fA-F]{24}$/.test(slugOrId)) {
      item = await Item.findOne({ _id: slugOrId, isVisible: true });
    }
    if (!item) {
      return res.status(404).json({ error: 'Item not found.' });
    }
    const formatted = formatItemResponse(item);
    res.json({ item: formatted, gift: formatted });
  } catch (err) {
    next(err);
  }
});

export default router;
