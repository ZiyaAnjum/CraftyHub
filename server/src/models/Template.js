import mongoose from 'mongoose';

export const TEMPLATE_CATEGORIES = [
  'Wedding',
  'Engagement',
  'Birthday',
  'Nikah / Mehendi',
  'Baby Shower',
  'Other',
];

export function slugifyTemplate(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const templateSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    category: {
      type: String,
      required: true,
      enum: TEMPLATE_CATEGORIES,
      index: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 3000,
    },
    previewVideoUrl: {
      type: String,
      required: true,
      trim: true,
    },
    thumbnailUrl: {
      type: String,
      required: true,
      trim: true,
    },
    basePrice: {
      type: Number,
      required: true,
      min: 0,
    },
    deliveryDays: {
      type: Number,
      default: 2,
      min: 1,
      max: 30,
    },
    whatsIncluded: {
      type: [String],
      default: [
        'Full HD 1080p Video File',
        'Custom Music / Audio Sync',
        'Up to 2 Rounds of Minor Text Edits',
        'Digital Delivery via Cloud Drive Link',
      ],
    },
    aspectRatio: {
      type: String,
      enum: ['9:16', '16:9', '1:1'],
      default: '9:16',
    },
    sampleAudioTitle: {
      type: String,
      trim: true,
      maxlength: 120,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

templateSchema.pre('validate', function (next) {
  if (!this.slug && this.title) {
    this.slug = slugifyTemplate(this.title);
  }
  next();
});

templateSchema.index({ isActive: 1, sortOrder: 1, createdAt: -1 });

export const Template = mongoose.model('Template', templateSchema);
