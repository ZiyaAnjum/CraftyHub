import { Order } from '../models/Order.js';
import { Item } from '../models/Item.js';

const KNOWN_OCCASIONS = [
  'Birthday',
  'Anniversary',
  'Wedding',
  'Engagement',
  'Baby Shower',
  'Housewarming',
  'Corporate',
  'Festive',
];

/**
 * Backfills occasion for existing orders that have an empty or missing occasion.
 * Inspects requirements text or the referenced item's occasionTags before falling back to 'Unspecified'.
 */
export async function backfillOrderOccasions() {
  try {
    const ordersToBackfill = await Order.find({
      $or: [
        { occasion: { $exists: false } },
        { occasion: null },
        { occasion: '' },
      ],
    }).populate('item', 'occasionTags title');

    if (!ordersToBackfill || ordersToBackfill.length === 0) {
      return { backfilled: 0 };
    }

    let count = 0;
    for (const order of ordersToBackfill) {
      let inferredOccasion = '';

      // 1. Check requirements string (e.g. "Occasion: Birthday | ...")
      if (order.requirements && typeof order.requirements === 'string') {
        const reqMatch = order.requirements.match(/Occasion:\s*([^|,\n]+)/i);
        if (reqMatch && reqMatch[1]) {
          const raw = reqMatch[1].trim();
          const matched = KNOWN_OCCASIONS.find(
            (o) => o.toLowerCase() === raw.toLowerCase()
          );
          if (matched) {
            inferredOccasion = matched;
          } else if (raw.length > 0 && raw.length <= 50) {
            inferredOccasion = raw;
          }
        }

        if (!inferredOccasion) {
          for (const occ of KNOWN_OCCASIONS) {
            const regex = new RegExp(`\\b${occ}\\b`, 'i');
            if (regex.test(order.requirements)) {
              inferredOccasion = occ;
              break;
            }
          }
        }
      }

      // 2. Check referenced item occasionTags
      if (!inferredOccasion && order.item?.occasionTags?.length > 0) {
        inferredOccasion = order.item.occasionTags[0];
      }

      // 3. Fallback to 'Unspecified'
      if (!inferredOccasion) {
        inferredOccasion = 'Unspecified';
      }

      order.occasion = inferredOccasion;
      await order.save();
      count++;
    }

    return { backfilled: count };
  } catch (err) {
    console.error('Error in backfillOrderOccasions:', err.message);
    return { backfilled: 0, error: err.message };
  }
}
