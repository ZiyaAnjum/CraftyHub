import mongoose from 'mongoose';

export const ITEM_CATEGORIES = ['Bouquet', 'Hamper', 'Frame', 'Engraved', 'Other'];

export function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const itemImageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, default: '' },
  },
  { _id: false }
);

const customizationOptionSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true, maxlength: 100 },
    type: { type: String, required: true, trim: true, maxlength: 50 }, // text, select, color, note, etc.
  },
  { _id: false }
);

const itemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    slug: { type: String, unique: true, lowercase: true, trim: true },
    description: { type: String, required: true, trim: true, maxlength: 5000 },
    category: { type: String, required: true, enum: ITEM_CATEGORIES },
    images: {
      type: [itemImageSchema],
      validate: [
        (val) => Array.isArray(val) && val.length >= 1 && val.length <= 6,
        'Item must have between 1 and 6 images',
      ],
    },
    startingPrice: {
      type: Number,
      default: null, // nullable = "price on request"
      min: 0,
    },
    customizationOptions: {
      type: [customizationOptionSchema],
      default: [],
    },
    occasionTags: {
      type: [{ type: String, trim: true, maxlength: 60 }],
      default: [],
    },
    prepTimeDays: {
      type: Number,
      default: 2,
      min: 0,
      max: 60,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isVisible: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

itemSchema.pre('validate', function (next) {
  if (this.title && !this.slug) {
    this.slug = slugify(this.title);
  }
  next();
});

itemSchema.index({ isVisible: 1, createdAt: -1 });
itemSchema.index({ isVisible: 1, isFeatured: -1, createdAt: -1, _id: -1 });
itemSchema.index({ category: 1 });
itemSchema.index({ occasionTags: 1 });

export const Item = mongoose.model('Item', itemSchema);
