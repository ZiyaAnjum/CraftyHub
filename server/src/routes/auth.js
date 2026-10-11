import { Router } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { z } from 'zod';
import { User } from '../models/User.js';
import { RefreshToken } from '../models/RefreshToken.js';
import { validateBody } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import {
  authLimiter,
  refreshLimiter,
  resendVerificationLimiter,
  forgotPasswordLimiter,
} from '../middleware/rateLimiters.js';
import { isProd } from '../config/env.js';
import {
  signAccessToken, newRefreshToken, hashToken, setAuthCookies, clearAuthCookies, REFRESH_TTL_MS,
} from '../utils/tokens.js';
import { sendVerificationEmail, sendPasswordResetEmail } from '../utils/email.js';

const router = Router();
const BCRYPT_COST = 12;
const MAX_FAILED = 5;
const LOCK_MS = 15 * 60 * 1000;
// Compared against when the email is unknown, so timing does not reveal which emails exist
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password-1', BCRYPT_COST);

const generateToken = () => crypto.randomBytes(32).toString('hex');

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
  termsAccepted: z.literal(true, {
    errorMap: () => ({ message: 'You must accept the terms and privacy policy to continue' }),
  }),
}).strict();

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(1).max(72),
}).strict();

const verifyEmailSchema = z.object({
  token: z.string().trim().min(1, 'Verification token is required'),
}).strict();

const resendVerificationSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254).optional(),
}).strict();

const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
}).strict();

const resetPasswordSchema = z.object({
  token: z.string().trim().min(1, 'Reset token is required'),
  password,
}).strict();

const publicUser = (u) => ({
  id: u._id,
  name: u.name,
  email: u.email,
  phone: u.phone,
  savedAddress: u.savedAddress || '',
  role: u.role,
  emailVerified: !!u.emailVerified,
  termsAcceptedAt: u.termsAcceptedAt || null,
});

async function startSession(res, user) {
  const refresh = newRefreshToken();
  const access = signAccessToken(user);
  await RefreshToken.create({ user: user._id, tokenHash: hashToken(refresh), expiresAt: new Date(Date.now() + REFRESH_TTL_MS) });
  setAuthCookies(res, access, refresh);
  return { access, refresh };
}

router.post('/register', authLimiter, validateBody(registerSchema), async (req, res, next) => {
  try {
    const { name, email, phone, password: pw } = req.body;
    if (await User.exists({ email })) {
      return res.status(409).json({ error: 'Unable to create an account with these details. Try signing in.' });
    }

    const rawToken = generateToken();
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // role is never read from the request: new accounts are always customers
    const user = await User.create({
      name,
      email,
      phone,
      passwordHash: await bcrypt.hash(pw, BCRYPT_COST),
      termsAcceptedAt: new Date(),
      emailVerified: false,
      emailVerificationTokenHash: tokenHash,
      emailVerificationExpiresAt: expiresAt,
    });

    sendVerificationEmail({ email: user.email, name: user.name, token: rawToken }).catch((err) => {
      console.error('Failed to send verification email on register:', err.message);
    });

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

    if (user?.lockUntil && user.lockUntil > new Date()) {
      return res.status(429).json({ error: 'Too many failed attempts. Please try again in 15 minutes.' });
    }

    const ok = await bcrypt.compare(pw, user?.passwordHash ?? DUMMY_HASH);
    if (!user || !ok) {
      if (user) {
        const updated = await User.findByIdAndUpdate(user._id, { $inc: { failedLoginCount: 1 } }, { new: true });
        if (updated.failedLoginCount >= MAX_FAILED) {
          await User.updateOne({ _id: user._id }, { $set: { lockUntil: new Date(Date.now() + LOCK_MS), failedLoginCount: 0 } });
        }
      }
      if (isProd) {
        console.warn(
          JSON.stringify({
            level: 'warn',
            event: 'auth_login_failed',
            timestamp: new Date().toISOString(),
            ip: req.ip,
            reason: user ? 'invalid_password' : 'unknown_email',
          })
        );
      }
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    await User.updateOne({ _id: user._id }, { $set: { failedLoginCount: 0, lockUntil: null } });
    await startSession(res, user);
    res.json({ user: publicUser(user) });
  } catch (e) { next(e); }
});

// Rotating refresh tokens with reuse detection
router.post('/refresh', refreshLimiter, async (req, res) => {
  try {
    const raw = req.cookies?.fc_rt;
    if (!raw || typeof raw !== 'string' || !raw.trim()) {
      clearAuthCookies(res);
      console.warn(
        JSON.stringify({
          level: 'warn',
          event: 'auth_refresh_failed',
          reason: 'missing_cookie',
          ip: req.ip,
          timestamp: new Date().toISOString(),
        })
      );
      return res.status(401).json({ error: 'Please sign in.' });
    }

    const tokenHash = hashToken(raw);
    if (!tokenHash) {
      clearAuthCookies(res);
      console.warn(
        JSON.stringify({
          level: 'warn',
          event: 'auth_refresh_failed',
          reason: 'malformed_token',
          ip: req.ip,
          timestamp: new Date().toISOString(),
        })
      );
      return res.status(401).json({ error: 'Please sign in.' });
    }

    const record = await RefreshToken.findOneAndUpdate(
      { tokenHash, revokedAt: null, expiresAt: { $gt: new Date() } },
      { $set: { revokedAt: new Date() } },
      { new: true }
    );

    if (!record) {
      const revokedRecord = await RefreshToken.findOne({ tokenHash });
      if (revokedRecord?.revokedAt) {
        const age = Date.now() - revokedRecord.revokedAt.getTime();
        if (age < 10_000) {
          clearAuthCookies(res);
          console.warn(
            JSON.stringify({
              level: 'warn',
              event: 'auth_refresh_failed',
              reason: 'grace_period_exhausted',
              ip: req.ip,
              timestamp: new Date().toISOString(),
            })
          );
          return res.status(401).json({ error: 'Please sign in.' });
        }
        // A used token came back: possible theft. Revoke every session for this user.
        await RefreshToken.updateMany({ user: revokedRecord.user, revokedAt: null }, { $set: { revokedAt: new Date() } });
        clearAuthCookies(res);
        console.warn(
          JSON.stringify({
            level: 'warn',
            event: 'auth_refresh_failed',
            reason: 'token_reuse',
            ip: req.ip,
            timestamp: new Date().toISOString(),
          })
        );
        return res.status(401).json({ error: 'Please sign in.' });
      }

      const isExpired = revokedRecord && revokedRecord.expiresAt && revokedRecord.expiresAt <= new Date();
      clearAuthCookies(res);
      console.warn(
        JSON.stringify({
          level: 'warn',
          event: 'auth_refresh_failed',
          reason: isExpired ? 'expired_token' : 'invalid_token',
          ip: req.ip,
          timestamp: new Date().toISOString(),
        })
      );
      return res.status(401).json({ error: 'Please sign in.' });
    }

    const user = await User.findById(record.user);
    if (!user) {
      clearAuthCookies(res);
      console.warn(
        JSON.stringify({
          level: 'warn',
          event: 'auth_refresh_failed',
          reason: 'user_not_found',
          ip: req.ip,
          timestamp: new Date().toISOString(),
        })
      );
      return res.status(401).json({ error: 'Please sign in.' });
    }

    const { access } = await startSession(res, user);
    res.json({ user: publicUser(user), accessToken: access });
  } catch (e) {
    clearAuthCookies(res);
    console.warn(
      JSON.stringify({
        level: 'warn',
        event: 'auth_refresh_failed',
        reason: 'unexpected_error',
        ip: req.ip,
        timestamp: new Date().toISOString(),
      })
    );
    return res.status(401).json({ error: 'Please sign in.' });
  }
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

const updateProfileSchema = z
  .object({
    name: z.string().trim().min(2).max(80).optional(),
    phone: z.string().trim().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number').optional(),
    savedAddress: z.string().trim().max(500).optional(),
    address: z.string().trim().max(500).optional(),
  })
  .strict();

router.patch('/me', requireAuth, validateBody(updateProfileSchema), async (req, res, next) => {
  try {
    const updates = {};
    if (req.body.name !== undefined) updates.name = req.body.name;
    if (req.body.phone !== undefined) updates.phone = req.body.phone;
    if (req.body.savedAddress !== undefined) updates.savedAddress = req.body.savedAddress;
    else if (req.body.address !== undefined) updates.savedAddress = req.body.address;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { new: true, runValidators: true }
    );
    if (!user) return res.status(401).json({ error: 'Please sign in.' });
    res.json({ user: publicUser(user) });
  } catch (e) {
    next(e);
  }
});

// POST /api/auth/verify-email (F-95)
router.post('/verify-email', authLimiter, validateBody(verifyEmailSchema), async (req, res, next) => {
  try {
    const { token } = req.body;
    const tokenHash = hashToken(token);
    const user = await User.findOne({
      emailVerificationTokenHash: tokenHash,
      emailVerificationExpiresAt: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({
        error: 'Invalid or expired verification link. Please request a new verification email.',
      });
    }

    user.emailVerified = true;
    user.emailVerificationTokenHash = null;
    user.emailVerificationExpiresAt = null;
    await user.save();

    res.json({
      message: 'Your email has been successfully verified! You can now place custom orders.',
      user: publicUser(user),
    });
  } catch (e) {
    next(e);
  }
});

// POST /api/auth/resend-verification (F-95)
router.post('/resend-verification', resendVerificationLimiter, validateBody(resendVerificationSchema), async (req, res, next) => {
  try {
    const genericMessage = 'If that email is registered and unverified, a verification link has been sent.';
    const email = req.body.email;

    if (!email) {
      return res.json({ message: genericMessage });
    }

    const user = await User.findOne({ email });
    if (user && !user.emailVerified) {
      const rawToken = generateToken();
      user.emailVerificationTokenHash = hashToken(rawToken);
      user.emailVerificationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await user.save();

      sendVerificationEmail({ email: user.email, name: user.name, token: rawToken }).catch((err) => {
        console.error('Failed to resend verification email:', err.message);
      });
    }

    // Security rule: Never reveal whether the email exists
    res.json({ message: genericMessage });
  } catch (e) {
    next(e);
  }
});

// POST /api/auth/forgot-password (F-96)
router.post('/forgot-password', forgotPasswordLimiter, validateBody(forgotPasswordSchema), async (req, res, next) => {
  try {
    const { email } = req.body;
    const genericMessage = 'If an account exists with that email, a password reset link has been sent.';

    const user = await User.findOne({ email });
    if (user) {
      const rawToken = generateToken();
      user.passwordResetTokenHash = hashToken(rawToken);
      user.passwordResetExpiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      await user.save();

      sendPasswordResetEmail({ email: user.email, name: user.name, token: rawToken }).catch((err) => {
        console.error('Failed to dispatch password reset email:', err.message);
      });
    }

    // Security rule: Never reveal whether the email exists
    res.json({ message: genericMessage });
  } catch (e) {
    next(e);
  }
});

// POST /api/auth/reset-password (F-96)
router.post('/reset-password', authLimiter, validateBody(resetPasswordSchema), async (req, res, next) => {
  try {
    const { token, password: newPassword } = req.body;
    const tokenHash = hashToken(token);

    const user = await User.findOne({
      passwordResetTokenHash: tokenHash,
      passwordResetExpiresAt: { $gt: new Date() },
    }).select('+passwordHash');

    if (!user) {
      return res.status(400).json({
        error: 'Invalid or expired password reset link. Please request a new one.',
      });
    }

    user.passwordHash = await bcrypt.hash(newPassword, BCRYPT_COST);
    user.passwordResetTokenHash = null;
    user.passwordResetExpiresAt = null;
    user.failedLoginCount = 0;
    user.lockUntil = null;
    await user.save();

    // Revoke all existing refresh tokens for that user
    await RefreshToken.updateMany(
      { user: user._id, revokedAt: null },
      { $set: { revokedAt: new Date() } }
    );
    clearAuthCookies(res);

    res.json({
      message: 'Your password has been reset successfully. Please sign in with your new password.',
    });
  } catch (e) {
    next(e);
  }
});

export default router;
