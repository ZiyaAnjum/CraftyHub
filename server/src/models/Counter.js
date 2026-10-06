import mongoose from 'mongoose';

const counterSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    seq: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Counter = mongoose.model('Counter', counterSchema);

export async function getNextOrderNumber() {
  const counter = await Counter.findOneAndUpdate(
    { name: 'orderNumber' },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return `FC-${String(counter.seq).padStart(4, '0')}`;
}
