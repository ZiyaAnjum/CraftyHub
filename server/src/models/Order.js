import crypto from 'node:crypto';
import mongoose from 'mongoose';

export async function generateUniqueOrderNumber() {
  const MAX_RETRIES = 10;
  for (let i = 0; i < MAX_RETRIES; i++) {
    const randomHex = crypto.randomBytes(4).toString('hex').toUpperCase();
    const candidate = `FC-${randomHex}`;
    const exists = await mongoose.models.Order?.exists({ orderNumber: candidate });
    if (!exists) {
      return candidate;
    }
  }
  throw new Error('Failed to generate a unique order number after maximum attempts. Please try again.');
}

export const ORDER_STATUSES = [
  'placed',
  'confirmed',
  'in_progress',
  'ready',
  'delivered',
  'cancelled',
];

const customerInfoSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    phone: { type: String, required: true, trim: true, match: /^[6-9]\d{9}$/ },
    address: { type: String, trim: true, maxlength: 500, default: '' },
  },
  { _id: false }
);

const referenceImageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, default: '' },
  },
  { _id: false }
);

const statusHistorySchema = new mongoose.Schema(
  {
    status: { type: String, required: true, enum: ORDER_STATUSES },
    changedAt: { type: Date, default: Date.now },
    note: { type: String, trim: true, maxlength: 500, default: '' },
  },
  { _id: false }
);

const hamperItemSchema = new mongoose.Schema(
  {
    item: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
    title: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1, max: 10 },
    unitPrice: { type: Number, required: true, min: 0 },
    totalPrice: { type: Number, required: true, min: 0 },
    image: { type: String, default: '' },
  },
  { _id: false }
);

const hamperSchema = new mongoose.Schema(
  {
    base: {
      id: { type: String, default: '' },
      name: { type: String, default: '' },
      price: { type: Number, default: 0 },
    },
    items: { type: [hamperItemSchema], default: [] },
    giftMessage: { type: String, trim: true, maxlength: 500, default: '' },
    calculatedTotal: { type: Number, default: 0 },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, unique: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    item: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', default: null },
    itemSnapshot: {
      title: { type: String, default: '' },
      image: { type: String, default: '' },
    },
    hamper: { type: hamperSchema, default: null },
    customizationAnswers: { type: [mongoose.Schema.Types.Mixed], default: [] },
    customer: { type: customerInfoSchema, required: true },
    deliveryType: { type: String, enum: ['delivery', 'pickup'], default: 'delivery' },
    requirements: { type: String, trim: true, maxlength: 2000, default: '' },
    referenceImages: { type: [referenceImageSchema], default: [] },
    neededByDate: { type: Date, default: null },
    status: {
      type: String,
      enum: ORDER_STATUSES,
      default: 'placed',
      index: true,
    },
    quotedPrice: { type: Number, default: null, min: 0 },
    readyBy: { type: Date, default: null },
    occasion: { type: String, trim: true, maxlength: 100, default: '' },
    customerNote: { type: String, trim: true, maxlength: 1000, default: '' },
    adminNotes: { type: String, trim: true, maxlength: 1000, default: '' },
    statusHistory: { type: [statusHistorySchema], default: [] },
  },
  { timestamps: true }
);

orderSchema.pre('validate', async function (next) {
  if (!this.orderNumber) {
    try {
      this.orderNumber = await generateUniqueOrderNumber();
    } catch (err) {
      return next(err);
    }
  }
  if (!this.statusHistory || this.statusHistory.length === 0) {
    this.statusHistory = [{ status: this.status || 'placed', changedAt: new Date(), note: 'Order placed' }];
  }
  next();
});

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ readyBy: 1 });

export const Order = mongoose.model('Order', orderSchema);
