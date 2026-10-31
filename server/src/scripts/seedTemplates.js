import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { Template, slugifyTemplate } from '../models/Template.js';

/**
 * Seed script for Video Templates
 *
 * NOTE: These are PLACEHOLDER templates meant for demonstration and initial setup.
 * Replace previewVideoUrl and thumbnailUrl with real branded assets in production.
 *
 * Usage: npm run seed:templates
 * (This script is NEVER executed automatically.)
 */

export const SAMPLE_TEMPLATES = [
  {
    title: 'Royal Islamic Nikah & Mehendi Invite',
    category: 'Nikah / Mehendi',
    description:
      '[SAMPLE PLACEHOLDER] An opulent emerald and gold animated vertical video invitation featuring intricate Islamic calligraphy, floral arches, gentle ambient sitar audio, and custom event transitions. Ideal for WhatsApp and Instagram Story invitations.',
    previewVideoUrl: 'https://res.cloudinary.com/demo/video/upload/q_auto,vc_h264/dog.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80',
    basePrice: 1499,
    deliveryDays: 2,
    aspectRatio: '9:16',
    sampleAudioTitle: 'Royal Sitar & Acoustic Strings (Royalty-free)',
    whatsIncluded: [
      'Full HD 1080p MP4 Video File (9:16 vertical)',
      'Customized Names, Dates, Venue & Family Inscriptions',
      'Ambient Music Track & Sound Effects',
      'Up to 2 Rounds of Minor Text Edits',
      'Direct Cloud Drive Download Link',
    ],
    isActive: true,
    isFeatured: true,
    sortOrder: 1,
  },
  {
    title: 'Floral Fairytale Wedding Announcement',
    category: 'Wedding',
    description:
      '[SAMPLE PLACEHOLDER] Romantic pastel watercolor florals blooming with gold foil typography and smooth photo carousel transitions. Set to a gentle romantic piano melody, tailored for modern wedding announcements and save-the-dates.',
    previewVideoUrl: 'https://res.cloudinary.com/demo/video/upload/q_auto,vc_h264/sea_turtle.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=800&q=80',
    basePrice: 1999,
    deliveryDays: 3,
    aspectRatio: '9:16',
    sampleAudioTitle: 'Acoustic Fairytale Romance (Royalty-free)',
    whatsIncluded: [
      'Full HD 1080p MP4 Video File (9:16 vertical)',
      'Photo Slideshow (Up to 6 of your couple portraits)',
      'Custom Font Pairing & Color Accent Matching',
      'Up to 2 Rounds of Minor Revisions',
      'Permanent Google Drive Download Folder',
    ],
    isActive: true,
    isFeatured: true,
    sortOrder: 2,
  },
  {
    title: 'Whimsical Jungle Safari Baby Shower & Birthday',
    category: 'Baby Shower',
    description:
      '[SAMPLE PLACEHOLDER] Playful watercolor safari animals with gentle parallax motion, milestone badges, and cheerful celebratory acoustic music. Perfect for 1st birthdays, welcoming newborns, and gender reveals.',
    previewVideoUrl: 'https://res.cloudinary.com/demo/video/upload/q_auto,vc_h264/elephants.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1533227268428-f9ed0900fb3b?auto=format&fit=crop&w=800&q=80',
    basePrice: 999,
    deliveryDays: 2,
    aspectRatio: '9:16',
    sampleAudioTitle: 'Joyful Acoustic Celebration (Royalty-free)',
    whatsIncluded: [
      'Full HD 1080p MP4 Video File (9:16 vertical)',
      'Baby/Child Name, Milestone Dates & Event Information',
      'Celebratory Upbeat Music Track',
      'Up to 2 Rounds of Minor Text Revisions',
      'Direct Cloud Drive Download Link',
    ],
    isActive: true,
    isFeatured: false,
    sortOrder: 3,
  },
];

async function seed() {
  console.log('Connecting to database:', env.MONGO_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));
  await mongoose.connect(env.MONGO_URI);

  console.log('Seeding sample placeholder video templates...');

  let createdCount = 0;
  let updatedCount = 0;

  for (const item of SAMPLE_TEMPLATES) {
    const slug = slugifyTemplate(item.title);
    const existing = await Template.findOne({ slug });

    if (!existing) {
      await Template.create({ ...item, slug });
      createdCount++;
      console.log(`+ Created template: "${item.title}" (${slug})`);
    } else {
      await Template.updateOne({ slug }, { $set: item });
      updatedCount++;
      console.log(`~ Updated existing template: "${item.title}" (${slug})`);
    }
  }

  console.log(`Done! Created: ${createdCount}, Updated: ${updatedCount}`);
  await mongoose.disconnect();
}

if (process.argv[1]?.endsWith('seedTemplates.js')) {
  seed().catch((err) => {
    console.error('Template seeding error:', err);
    process.exit(1);
  });
}
