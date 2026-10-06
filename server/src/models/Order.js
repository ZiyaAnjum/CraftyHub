import mongoose from 'mongoose';
import { getNextOrderNumber } from './Counter.js';

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

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, unique: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    item: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', default: null },
    customer: { type: customerInfoSchema, required: true },
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
    adminNotes: { type: String, trim: true, maxlength: 1000, default: '' },
    statusHistory: { type: [statusHistorySchema], default: [] },
  },
  { timestamps: true }
);

orderSchema.pre('validate', async function (next) {
  if (!this.orderNumber) {
    try {
      this.orderNumber = await getNextOrderNumber();
    } catch (err) {
      return next(err);
    }
  }
  if (!this.statusHistory || this.statusHistory.length === 0) {
    this.statusHistory = [{ status: this.status || 'placed', changedAt: new Date(), note: 'Order placed' }];
  }
  next();
});

export const Order = mongoose.model('Order', orderSchema);
