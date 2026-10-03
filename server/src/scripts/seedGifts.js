import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { Gift, slugify } from '../models/Gift.js';

const SAMPLE_GIFTS = [
  {
    title: 'Sample: Pastel Bliss Rose & Lily Bouquet',
    category: 'Bouquet',
    shortDescription: 'Delicate Ecuadorian roses, white oriental lilies, and fresh eucalyptus tied with blush silk ribbons.',
    description: 'A breathtaking floral arrangement handpicked at the peak of bloom. Features soft blush roses, fragrant stargazers, and textural greens, wrapped in sustainable luxury craft paper with a bespoke handwritten note card.',
    price: 1899,
    priceNote: 'seasonal fresh arrangement',
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
    includes: [
      '12 Premium Blush Pink Roses',
      '4 White Oriental Lilies',
      'Fresh Italian Eucalyptus foliage',
      'Blush Satin Keepsake Ribbon',
      'Fouzas Botanical Flower Food packet',
    ],
    customizationOptions: [
      'Ribbon color (Blush, Gold, Emerald, Ivory)',
      'Custom calligraphy gift tag message',
      'Optional vase addition',
    ],
    occasions: ['Birthday', 'Anniversary', 'Engagement', 'Valentine’s Day'],
    deliveryInfo: 'Hand-delivered with temperature control in 24-48 hours within major metro areas.',
    isFeatured: true,
    isPublished: true,
  },
  {
    title: 'Sample: Luxury Velvet Celebration Hamper',
    category: 'Hamper',
    shortDescription: 'Handcrafted velvet trunk packed with artisanal chocolates, soy candle, and customized keepsakes.',
    description: 'The signature Fouzas grandeur gift trunk. Draped in royal blush velvet with antique brass clasps, this treasure trove holds organic scented candles, gourmet hazelnut pralines, and personalized accessories tailored for milestones.',
    price: 4999,
    priceNote: 'starts from',
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
    includes: [
      'Reusable Handcrafted Velvet Trunk with Lock',
      'French Vanilla & Amber Hand-poured Soy Candle (200g)',
      'Box of 12 Artisanal Belgian Pralines',
      'Custom Acrylic Name Keyring with Tassel',
      'Gold-embossed Wax Sealed Message Scroll',
    ],
    customizationOptions: [
      'Trunk velvet shade (Rose Quartz, Royal Navy, Champagne)',
      'Custom monogram or initials on trunk plaque',
      'Scented candle aroma selection',
    ],
    occasions: ['Wedding', 'Anniversary', 'Corporate / Festive', 'Diwali'],
    deliveryInfo: 'Safely packed in multi-layer shockproof casing; ships nationwide in 3-5 days.',
    isFeatured: true,
    isPublished: true,
  },
  {
    title: 'Sample: Bespoke Wooden Memory Clock Frame',
    category: 'Frame',
    shortDescription: 'Laser-crafted natural pine frame integrating custom couple portraits and a silent sweep quartz clock.',
    description: 'Transform your most cherished memory into timeless wall art. Expertly carved from sustainable birch and pine, featuring ultra-HD archival printing protected by museum-grade anti-glare glass and precision quartz movement.',
    price: 2450,
    priceNote: 'inclusive of custom printing',
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
    includes: [
      '10x12 inch Natural Pine Wood Photo Clock Frame',
      'Silent Japanese Quartz Sweep Movement (AA Battery included)',
      'Archival Lustre Photo Print (Fade-proof)',
      'Tabletop Easel Stand & Heavy-duty Wall Hook',
    ],
    customizationOptions: [
      'High-resolution photo upload',
      'Customized date / anniversary timestamp inscription',
      'Roman or Arabic numeral clock dials',
    ],
    occasions: ['Anniversary', 'Birthday', 'Housewarming', 'Wedding'],
    deliveryInfo: 'Carefully packaged in custom foam; dispatched in 2-3 business days.',
    isFeatured: true,
    isPublished: true,
  },
  {
    title: 'Sample: Personalized Royal Brass Plaque',
    category: 'Engraved',
    shortDescription: 'Solid brushed brass plate deep-engraved with family coat of arms, wedding vows, or celebration milestones.',
    description: 'Exude timeless heritage with this weighty, solid brass plaque. Hand-finished with mirror-polished beveled edges and coated in a tarnish-resistant lacquer, mounted upon a solid dark walnut wooden plinth.',
    price: 3200,
    priceNote: 'engraving included',
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
    includes: [
      'Solid Brass Plaque (Thickness: 3mm)',
      'Solid Walnut Wood Display Stand',
      'Microfiber Polishing & Care Cloth',
      'Certificate of Handcrafting Authenticity',
    ],
    customizationOptions: [
      'Deep mechanical engraving (up to 150 words)',
      'Font typography style (Old English, Script, Minimal Sans)',
      'Option for engraved vector motifs or wedding crest',
    ],
    occasions: ['Anniversary', 'Retirement', 'Corporate / Festive', 'Achievement'],
    deliveryInfo: 'Delivered in a velvet-lined gift presentation box within 4-6 business days.',
    isFeatured: false,
    isPublished: true,
  },
  {
    title: 'Sample: Artisanal Gourmet Treats Hamper',
    category: 'Hamper',
    shortDescription: 'Curation of single-origin dark chocolates, honeyed dry fruits, and exotic loose-leaf herbal teas.',
    description: 'A culinary delight crafted for the connoisseur. Encased in a reusable woven seagrass picnic basket with leatherette straps, brimming with healthy, decadent delights sourced from ethical boutique estates.',
    price: 2850,
    priceNote: 'starts from',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80',
        publicId: '',
      },
      {
        url: 'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=800&q=80',
        publicId: '',
      },
    ],
    includes: [
      'Woven Natural Seagrass Gift Basket',
      'Kashmir Organic Saffron Infused Honey (250g)',
      'Roasted Californian Almonds with Himalayan Salt (150g)',
      'Darjeeling First Flush Whole Leaf Tea Tin (100g)',
      '70% Single Origin Artisanal Chocolate Bar',
    ],
    customizationOptions: [
      'Vegan or Gluten-free treat options',
      'Personalized wooden gift tag',
      'Curated celebration greeting card',
    ],
    occasions: ['Birthday', 'Corporate / Festive', 'Diwali', 'Get Well Soon'],
    deliveryInfo: 'Express transit across India within 3-4 days.',
    isFeatured: false,
    isPublished: true,
  },
  {
    title: 'Sample: Radiant Neon Acrylic Night Keepsake',
    category: 'Other',
    shortDescription: 'Custom laser-etched edge-lit acrylic LED art with warm glow and sustainable solid beechwood stand.',
    description: 'Infuse cozy enchantment into any bedroom or living space. Features optical-grade cast acrylic laser-etched with custom names, dates, or couple outlines, illuminated by soothing warm white LEDs with inline dimmer controls.',
    price: 1950,
    priceNote: 'includes power adapter',
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
    includes: [
      '5mm Laser-engraved Cast Acrylic Plaque',
      'Solid Beechwood Base with Integrated Warm LED Strip',
      'USB Braided Power Cable with Dimmer Switch',
      'Universal 5V USB Wall Power Adapter',
    ],
    customizationOptions: [
      'Custom text / song lyrics / date inscription',
      'Spotify code or QR code engraving',
      'Choice between Warm White or Sunset Glow lighting',
    ],
    occasions: ['Birthday', 'Anniversary', 'Valentine’s Day', 'Other Celebration'],
    deliveryInfo: 'Safely packed in foam-fitted gift box; arrives in 3-5 business days.',
    isFeatured: true,
    isPublished: true,
  },
];

async function seed() {
  try {
    await mongoose.connect(env.MONGO_URI);
    console.log('Connected to MongoDB for gift seeding.');

    for (const item of SAMPLE_GIFTS) {
      const slug = slugify(item.title);
      await Gift.findOneAndUpdate(
        { slug },
        { ...item, slug },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      console.log(`✓ Seeded: ${item.title} (/gifts/${slug})`);
    }

    console.log(`\nSuccessfully seeded ${SAMPLE_GIFTS.length} sample gifts.`);
  } catch (err) {
    console.error('Failed to seed gifts:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

seed();
