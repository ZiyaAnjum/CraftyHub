import mongoose from 'mongoose';
import crypto from 'node:crypto';

export const GIFT_CATEGORIES = ['Bouquet', 'Hamper', 'Frame', 'Engraved', 'Other'];

export function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const giftSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    category: { type: String, required: true, enum: GIFT_CATEGORIES },
    shortDescription: { type: String, trim: true, maxlength: 300, default: '' },
    description: { type: String, required: true, trim: true, maxlength: 5000 },
    price: { type: Number, required: true, min: 0 },
    priceNote: { type: String, trim: true, maxlength: 60, default: '' },
    images: {
      type: [
        {
          url: { type: String, required: true },
          publicId: { type: String, default: '' },
        },
      ],
      validate: [
        (val) => Array.isArray(val) && val.length >= 1 && val.length <= 6,
        'Gift must have between 1 and 6 images',
      ],
    },
    includes: [{ type: String, trim: true, maxlength: 120 }],
    customizationOptions: [{ type: String, trim: true, maxlength: 120 }],
    occasions: [{ type: String, trim: true, maxlength: 60 }],
    deliveryInfo: { type: String, trim: true, maxlength: 500, default: '' },
    isFeatured: { type: Boolean, default: false },
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true }
);

giftSchema.pre('validate', function (next) {
  if (this.title && !this.slug) {
    this.slug = slugify(this.title);
  }
  next();
});

giftSchema.index({ isPublished: 1, createdAt: -1 });
giftSchema.index({ category: 1 });

export const Gift = mongoose.model('Gift', giftSchema);
