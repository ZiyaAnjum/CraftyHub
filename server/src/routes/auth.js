import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { User } from '../models/User.js';
import { RefreshToken } from '../models/RefreshToken.js';
import { validateBody } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiters.js';
import {
  signAccessToken, newRefreshToken, hashToken, setAuthCookies, clearAuthCookies, REFRESH_TTL_MS,
} from '../utils/tokens.js';

const router = Router();
const BCRYPT_COST = 12;
const MAX_FAILED = 5;
const LOCK_MS = 15 * 60 * 1000;
// Compared against when the email is unknown, so timing does not reveal which emails exist
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password-1', BCRYPT_COST);

const password = z
  .string()
  .min(10, 'Password must be at least 10 characters')
  .max(72, 'Password must be at most 72 characters')
  .regex(/[A-Za-z]/, 'Password must contain a letter')
  .regex(/\d/, 'Password must contain a number');

const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().toLowerCase().email().max(254),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number'),
  password,
}).strict();

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(1).max(72),
}).strict();

const publicUser = (u) => ({ id: u._id, name: u.name, email: u.email, phone: u.phone, role: u.role, emailVerified: u.emailVerified });

async function startSession(res, user) {
  const refresh = newRefreshToken();
  await RefreshToken.create({ user: user._id, tokenHash: hashToken(refresh), expiresAt: new Date(Date.now() + REFRESH_TTL_MS) });
  setAuthCookies(res, signAccessToken(user), refresh);
}

router.post('/register', authLimiter, validateBody(registerSchema), async (req, res, next) => {
  try {
    const { name, email, phone, password: pw } = req.body;
    if (await User.exists({ email })) {
      return res.status(409).json({ error: 'Unable to create an account with these details. Try signing in.' });
    }
    // role is never read from the request: new accounts are always customers
    const user = await User.create({ name, email, phone, passwordHash: await bcrypt.hash(pw, BCRYPT_COST) });
    await startSession(res, user);
    res.status(201).json({ user: publicUser(user) });
  } catch (e) {
    if (e?.code === 11000) return res.status(409).json({ error: 'Unable to create an account with these details. Try signing in.' });
    next(e);
  }
});

router.post('/login', authLimiter, validateBody(loginSchema), async (req, res, next) => {
  try {
    const { email, password: pw } = req.body;
    const user = await User.findOne({ email }).select('+passwordHash');
    const ok = await bcrypt.compare(pw, user?.passwordHash ?? DUMMY_HASH);

    if (user?.lockUntil && user.lockUntil > new Date()) {
      return res.status(429).json({ error: 'Too many failed attempts. Please try again in 15 minutes.' });
    }
    if (!user || !ok) {
      if (user) {
        const updated = await User.findByIdAndUpdate(user._id, { $inc: { failedLoginCount: 1 } }, { new: true });
        if (updated.failedLoginCount >= MAX_FAILED) {
          await User.updateOne({ _id: user._id }, { $set: { lockUntil: new Date(Date.now() + LOCK_MS), failedLoginCount: 0 } });
        }
      }
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    await User.updateOne({ _id: user._id }, { $set: { failedLoginCount: 0, lockUntil: null } });
    await startSession(res, user);
    res.json({ user: publicUser(user) });
  } catch (e) { next(e); }
});

// Rotating refresh tokens with reuse detection
router.post('/refresh', authLimiter, async (req, res, next) => {
  try {
    const raw = req.cookies?.fc_rt;
    if (!raw) return res.status(401).json({ error: 'Please sign in.' });

    const record = await RefreshToken.findOne({ tokenHash: hashToken(raw) });
    if (!record || record.expiresAt < new Date()) {
      clearAuthCookies(res);
      return res.status(401).json({ error: 'Please sign in.' });
    }
    if (record.revokedAt) {
      // A used token came back: possible theft. Revoke every session for this user.
      await RefreshToken.updateMany({ user: record.user, revokedAt: null }, { $set: { revokedAt: new Date() } });
      clearAuthCookies(res);
      return res.status(401).json({ error: 'Please sign in again.' });
    }

    const user = await User.findById(record.user);
    if (!user) { clearAuthCookies(res); return res.status(401).json({ error: 'Please sign in.' }); }

    record.revokedAt = new Date();
    await record.save();
    await startSession(res, user);
    res.json({ user: publicUser(user) });
  } catch (e) { next(e); }
});

router.post('/logout', async (req, res, next) => {
  try {
    const raw = req.cookies?.fc_rt;
    if (raw) await RefreshToken.updateOne({ tokenHash: hashToken(raw), revokedAt: null }, { $set: { revokedAt: new Date() } });
    clearAuthCookies(res);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(401).json({ error: 'Please sign in.' });
    res.json({ user: publicUser(user) });
  } catch (e) { next(e); }
});

export default router;
