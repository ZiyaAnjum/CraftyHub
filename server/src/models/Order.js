import mongoose from 'mongoose';
import crypto from 'node:crypto';

export const ORDER_STATUSES = ['Received', 'Confirmed', 'In Progress', 'Ready', 'Delivered', 'Cancelled'];

const orderSchema = new mongoose.Schema(
  {
    // Random, non-sequential ID so orders cannot be enumerated
    orderId: { type: String, unique: true, default: () => 'FC-' + crypto.randomBytes(4).toString('hex').toUpperCase() },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    occasion: { type: String, required: true, maxlength: 60 },
    budget: { type: Number, required: true, min: 0, max: 1000000 },
    items: [{ name: { type: String, maxlength: 120 }, qty: { type: Number, min: 1, max: 100 } }],
    customization: {
      text: { type: String, maxlength: 200 },
      font: { type: String, maxlength: 40 },
      colour: { type: String, maxlength: 40 },
      theme: { type: String, maxlength: 40 },
      notes: { type: String, maxlength: 1000 },
    },
    preferredDate: { type: Date },
    status: { type: String, enum: ORDER_STATUSES, default: 'Received' },
    customerNote: { type: String, maxlength: 500 },
    statusHistory: [{ status: String, at: { type: Date, default: Date.now }, by: String }],
  },
  { timestamps: true }
);

export const Order = mongoose.model('Order', orderSchema);
