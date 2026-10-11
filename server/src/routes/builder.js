import { Router } from 'express';
import { z } from 'zod';
import { Item } from '../models/Item.js';
import { validateBody } from '../middleware/validate.js';
import { builderLimiter } from '../middleware/rateLimiters.js';
import { BASE_HAMPERS } from './orders.js';

const router = Router();

// GET /api/builder/hamper-bases - Public list of available hamper bases (F-40)
router.get('/hamper-bases', (req, res) => {
  res.json({
    bases: Object.values(BASE_HAMPERS),
  });
});

const budgetEnum = z.enum(['under_500', '500_1500', '1500_3000', 'above_3000', 'any']);

const suggestSchema = z
  .object({
    occasion: z.string().trim().max(60).optional().default(''),
    recipient: z.string().trim().max(60).optional().default(''),
    budget: budgetEnum.optional().default('any'),
    preferences: z.array(z.string().trim().max(50)).max(10).optional().default([]),
    color: z.string().trim().max(50).optional().default(''),
  })
  .strict();

const BUDGET_BOUNDS = {
  under_500: { min: 0, max: 500, label: 'Under ₹500' },
  '500_1500': { min: 500, max: 1500, label: '₹500–₹1,500' },
  '1500_3000': { min: 1500, max: 3000, label: '₹1,500–₹3,000' },
  above_3000: { min: 3000, max: Infinity, label: 'Above ₹3,000' },
  any: { min: 0, max: Infinity, label: 'Any Budget' },
};

function generateMatchReason(item, criteria, { occasionMatch, budgetMatch, tagMatches }) {
  const occ = criteria.occasion;
  const rec = criteria.recipient;
  const budgetInfo = BUDGET_BOUNDS[criteria.budget] || BUDGET_BOUNDS.any;

  const reasons = [];

  if (occasionMatch && occ) {
    const formattedOcc = occ.charAt(0).toUpperCase() + occ.slice(1);
    reasons.push(`matches ${formattedOcc}`);
  }

  if (budgetMatch && criteria.budget !== 'any') {
    reasons.push(`fits your ${budgetInfo.label} budget`);
  }

  if (tagMatches.length > 0) {
    const topTags = tagMatches.slice(0, 2).map((t) => t.toLowerCase()).join(' & ');
    reasons.push(`features ${topTags} aesthetics`);
  } else if (rec) {
    reasons.push(`popular gift choice for a ${rec.toLowerCase()}`);
  }

  if (reasons.length === 0) {
    if (item.category === 'Frame') {
      return 'Bespoke handcrafted frame customized with your personal photo & inscription.';
    }
    if (item.category === 'Hamper') {
      return 'Curated artisanal hamper assembled with personalized treats and keepsakes.';
    }
    return `Boutique handcrafted ${item.category.toLowerCase()} customizable for your special celebration.`;
  }

  const capitalizedStart = reasons[0].charAt(0).toUpperCase() + reasons[0].slice(1);
  return `${capitalizedStart}${reasons.length > 1 ? ` and ${reasons.slice(1).join(' and ')}` : ''}.`;
}

// POST /api/builder/suggest (Public with rate limiting)
router.post('/suggest', builderLimiter, validateBody(suggestSchema), async (req, res, next) => {
  try {
    const { occasion, recipient, budget, preferences, color } = req.body;

    const normalizedOccasion = occasion.toLowerCase().trim();
    const normalizedRecipient = recipient.toLowerCase().trim();
    const normalizedColor = color.toLowerCase().trim();
    const normalizedPrefs = preferences.map((p) => p.toLowerCase().trim()).filter(Boolean);

    const budgetBound = BUDGET_BOUNDS[budget] || BUDGET_BOUNDS.any;

    // Fetch all active items
    const allItems = await Item.find({ isVisible: true }).lean();

    if (!allItems || allItems.length === 0) {
      return res.json({
        criteria: req.body,
        suggestions: [],
      });
    }

    const scored = allItems.map((item) => {
      let score = 10;
      let occasionMatch = false;
      let budgetMatch = false;
      const tagMatches = [];

      const itemOccasions = (item.occasionTags || []).map((t) => String(t).toLowerCase());
      const itemTitle = (item.title || '').toLowerCase();
      const itemDesc = (item.description || '').toLowerCase();
      const itemCategory = (item.category || '').toLowerCase();

      // 1. Occasion Matching
      if (normalizedOccasion) {
        const inTags = itemOccasions.some((t) => t.includes(normalizedOccasion) || normalizedOccasion.includes(t));
        const inText = itemTitle.includes(normalizedOccasion) || itemDesc.includes(normalizedOccasion);

        if (inTags) {
          score += 35;
          occasionMatch = true;
        } else if (inText) {
          score += 20;
          occasionMatch = true;
        }
      }

      // 2. Budget Matching
      if (item.startingPrice !== null && item.startingPrice !== undefined && Number.isFinite(item.startingPrice)) {
        const price = Number(item.startingPrice);
        if (price >= budgetBound.min && price <= budgetBound.max) {
          score += 30;
          budgetMatch = true;
        } else if (
          budgetBound.min !== 0 &&
          budgetBound.max !== Infinity &&
          price >= budgetBound.min * 0.75 &&
          price <= budgetBound.max * 1.25
        ) {
          score += 15; // close match tolerance
        }
      } else {
        // Price on request / bespoke can fit any budget
        score += budget === 'any' ? 20 : 15;
      }

      // 3. Recipient Affinities
      if (normalizedRecipient) {
        if (['partner', 'spouse', 'girlfriend', 'boyfriend', 'fiancé', 'fiancée'].some((r) => normalizedRecipient.includes(r))) {
          if (['frame', 'bouquet', 'hamper'].includes(itemCategory)) score += 12;
          if (itemOccasions.some((t) => t.includes('anniversary') || t.includes('romantic') || t.includes('wedding'))) {
            score += 10;
          }
        } else if (['colleague', 'friend', 'bestie'].some((r) => normalizedRecipient.includes(r))) {
          if (['hamper', 'engraved'].includes(itemCategory)) score += 12;
        } else if (['parents', 'family', 'mom', 'dad'].some((r) => normalizedRecipient.includes(r))) {
          if (['frame', 'engraved', 'hamper'].includes(itemCategory)) score += 12;
        }
      }

      // 4. Style Preferences & Color Matching
      for (const pref of normalizedPrefs) {
        if (
          itemOccasions.some((t) => t.includes(pref)) ||
          itemTitle.includes(pref) ||
          itemDesc.includes(pref) ||
          itemCategory.includes(pref)
        ) {
          score += 10;
          tagMatches.push(pref);
        }
      }

      if (normalizedColor) {
        if (itemTitle.includes(normalizedColor) || itemDesc.includes(normalizedColor)) {
          score += 8;
          tagMatches.push(normalizedColor);
        }
      }

      // 5. Item Quality Enhancers
      if (item.isFeatured) score += 5;
      if (Array.isArray(item.customizationOptions) && item.customizationOptions.length > 0) score += 5;

      const whyMatches = generateMatchReason(item, req.body, {
        occasionMatch,
        budgetMatch,
        tagMatches,
      });

      return {
        item,
        score,
        whyMatches,
      };
    });

    // Sort descending by score
    scored.sort((a, b) => b.score - a.score);

    // Return top 3 to 5 suggestions
    const topCount = Math.min(Math.max(scored.length > 0 ? 3 : 0, 3), Math.min(scored.length, 5));
    const topSuggestions = scored.slice(0, topCount);

    res.json({
      criteria: {
        occasion,
        recipient,
        budget,
        budgetLabel: budgetBound.label,
        preferences,
        color,
      },
      suggestions: topSuggestions.map(({ item, score, whyMatches }) => ({
        item: {
          _id: item._id,
          id: item._id,
          title: item.title,
          slug: item.slug,
          category: item.category,
          startingPrice: item.startingPrice,
          images: item.images,
          occasionTags: item.occasionTags || [],
          customizationOptions: item.customizationOptions || [],
          isFeatured: item.isFeatured,
          prepTimeDays: item.prepTimeDays,
        },
        score,
        whyMatches,
      })),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
