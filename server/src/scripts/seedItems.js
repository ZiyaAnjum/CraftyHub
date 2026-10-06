import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { Item, slugify } from '../models/Item.js';

const SAMPLE_ITEMS = [
  {
    title: 'Pastel Bliss Rose & Lily Bouquet',
    category: 'Bouquet',
    description:
      'A breathtaking floral arrangement handpicked at the peak of bloom. Features soft blush roses, fragrant stargazers, and textural greens, wrapped in sustainable luxury craft paper with a bespoke handwritten note card.',
    startingPrice: 1899,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=800&q=80',
        publicId: '',
      },
      {
        url: 'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=800&q=80',
        publicId: '',
      },
      {
        url: 'https://images.unsplash.com/photo-1582794543139-8ac9cb0f7b11?auto=format&fit=crop&w=800&q=80',
        publicId: '',
      },
    ],
    customizationOptions: [
      { label: 'Ribbon Color', type: 'select' },
      { label: 'Card Message', type: 'text' },
      { label: 'Add Glass Vase', type: 'boolean' },
    ],
    occasionTags: ['Birthday', 'Anniversary', 'Engagement', 'Valentine’s Day'],
    prepTimeDays: 1,
    isFeatured: true,
    isVisible: true,
  },
  {
    title: 'Luxury Velvet Celebration Hamper',
    category: 'Hamper',
    description:
      'The signature Fouzas grandeur gift trunk. Draped in royal blush velvet with antique brass clasps, this treasure trove holds organic scented candles, gourmet hazelnut pralines, and personalized accessories tailored for milestones.',
    startingPrice: 4999,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80',
        publicId: '',
      },
      {
        url: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80',
        publicId: '',
      },
    ],
    customizationOptions: [
      { label: 'Trunk Velvet Shade', type: 'select' },
      { label: 'Name Monogram on Plaque', type: 'text' },
      { label: 'Candle Scent Aroma', type: 'select' },
    ],
    occasionTags: ['Wedding', 'Anniversary', 'Corporate / Festive', 'Diwali'],
    prepTimeDays: 3,
    isFeatured: true,
    isVisible: true,
  },
  {
    title: 'Bespoke Wooden Memory Clock Frame',
    category: 'Frame',
    description:
      'Transform your most cherished memory into timeless wall art. Expertly carved from sustainable birch and pine, featuring ultra-HD archival printing protected by museum-grade anti-glare glass and precision quartz movement.',
    startingPrice: 2450,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80',
        publicId: '',
      },
      {
        url: 'https://images.unsplash.com/photo-1534349762230-e0cadf78f5da?auto=format&fit=crop&w=800&q=80',
        publicId: '',
      },
    ],
    customizationOptions: [
      { label: 'Photo Upload', type: 'file' },
      { label: 'Anniversary Date Inscription', type: 'text' },
      { label: 'Dial Style (Roman / Arabic)', type: 'select' },
    ],
    occasionTags: ['Anniversary', 'Birthday', 'Housewarming', 'Wedding'],
    prepTimeDays: 2,
    isFeatured: true,
    isVisible: true,
  },
  {
    title: 'Personalized Royal Brass Plaque',
    category: 'Engraved',
    description:
      'Exude timeless heritage with this weighty, solid brass plaque. Hand-finished with mirror-polished beveled edges and coated in a tarnish-resistant lacquer, mounted upon a solid dark walnut wooden plinth.',
    startingPrice: 3200,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80',
        publicId: '',
      },
      {
        url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
        publicId: '',
      },
    ],
    customizationOptions: [
      { label: 'Engraved Message (up to 150 words)', type: 'text' },
      { label: 'Typography Font', type: 'select' },
      { label: 'Custom Crest Motif', type: 'text' },
    ],
    occasionTags: ['Anniversary', 'Retirement', 'Corporate / Festive', 'Achievement'],
    prepTimeDays: 4,
    isFeatured: false,
    isVisible: true,
  },
  {
    title: 'Custom Curated Milestone Hamper (Price on Request)',
    category: 'Hamper',
    description:
      'A bespoke gifting curation customized down to every single element. Ideal for grand weddings, luxury corporate retreats, and bespoke celebrations.',
    startingPrice: null, // nullable = "price on request"
    images: [
      {
        url: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80',
        publicId: '',
      },
    ],
    customizationOptions: [
      { label: 'Budget & Themes', type: 'text' },
      { label: 'Items Selection', type: 'text' },
    ],
    occasionTags: ['Wedding', 'Corporate / Festive'],
    prepTimeDays: 5,
    isFeatured: true,
    isVisible: true,
  },
  {
    title: 'Radiant Neon Acrylic Night Keepsake',
    category: 'Other',
    description:
      'Infuse cozy enchantment into any bedroom or living space. Features optical-grade cast acrylic laser-etched with custom names, dates, or couple outlines, illuminated by soothing warm white LEDs with inline dimmer controls.',
    startingPrice: 1950,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80',
        publicId: '',
      },
      {
        url: 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=800&q=80',
        publicId: '',
      },
    ],
    customizationOptions: [
      { label: 'Custom Inscription / Song Title', type: 'text' },
      { label: 'Lighting Hue', type: 'select' },
    ],
    occasionTags: ['Birthday', 'Anniversary', 'Valentine’s Day'],
    prepTimeDays: 2,
    isFeatured: true,
    isVisible: true,
  },
];

async function seed() {
  try {
    await mongoose.connect(env.MONGO_URI);
    console.log('Connected to MongoDB for item seeding.');

    for (const item of SAMPLE_ITEMS) {
      const slug = slugify(item.title);
      await Item.findOneAndUpdate(
        { slug },
        { ...item, slug },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      console.log(`✓ Seeded item: ${item.title} (${item.startingPrice ? '₹' + item.startingPrice : 'Price on Request'})`);
    }

    console.log(`\nSuccessfully seeded ${SAMPLE_ITEMS.length} items conforming to the Item schema.`);
  } catch (err) {
    console.error('Failed to seed items:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

seed();
