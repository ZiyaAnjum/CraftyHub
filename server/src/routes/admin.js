import { Router } from 'express';
import { z } from 'zod';
import { Order, ORDER_STATUSES } from '../models/Order.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';

const router = Router();
router.use(requireAuth, requireRole('admin'));

router.get('/orders', async (req, res, next) => {
  try {
    const status = ORDER_STATUSES.includes(req.query.status) ? req.query.status : undefined; // whitelist, never pass raw query
    const filter = status ? { status } : {};
    const orders = await Order.find(filter).populate('user', 'name email phone').sort({ createdAt: -1 }).limit(200);
    res.json({ orders });
  } catch (e) { next(e); }
});

const updateSchema = z.object({
  status: z.enum(ORDER_STATUSES).optional(),
  customerNote: z.string().trim().max(500).optional(),
}).strict();

router.patch('/orders/:orderId', validateBody(updateSchema), async (req, res, next) => {
  try {
    if (!/^FC-[0-9A-F]{8}$/.test(req.params.orderId)) return res.status(404).json({ error: 'Order not found.' });
    const order = await Order.findOne({ orderId: req.params.orderId });
    if (!order) return res.status(404).json({ error: 'Order not found.' });
    const { status, customerNote } = req.body;
    if (status && status !== order.status) {
      order.status = status;
      order.statusHistory.push({ status, by: `admin:${req.user.id}` }); // audit trail
    }
    if (customerNote !== undefined) order.customerNote = customerNote;
    await order.save();
    res.json({ order });
  } catch (e) { next(e); }
});

export default router;
