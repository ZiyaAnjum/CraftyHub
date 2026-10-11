import rateLimit from 'express-rate-limit';

const make = (windowMs, limit, message) =>
  rateLimit({ windowMs, limit, standardHeaders: 'draft-7', legacyHeaders: false, message: { error: message } });

export const globalLimiter = make(15 * 60 * 1000, 300, 'Too many requests. Please try again later.');
export const authLimiter = make(15 * 60 * 1000, 10, 'Too many attempts. Please try again in a few minutes.');
export const refreshLimiter = make(15 * 60 * 1000, 60, 'Too many refresh attempts. Please try again later.');
export const resendVerificationLimiter = make(15 * 60 * 1000, 5, 'Too many verification email requests. Please try again in 15 minutes.');
export const forgotPasswordLimiter = make(15 * 60 * 1000, 5, 'Too many password reset requests. Please try again in 15 minutes.');
export const orderLimiter = make(60 * 60 * 1000, 20, 'Too many orders submitted. Please try again later.');
export const builderLimiter = make(15 * 60 * 1000, 30, 'Too many builder requests. Please try again in a few minutes.');

export const orderUserLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  keyGenerator: (req) => req.user?.id || req.ip,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many orders submitted. Please try again later.' },
});

export const trackLimiter = make(15 * 60 * 1000, 10, 'Too many tracking attempts. Please try again in a few minutes.');

export const getTrackOrderKey = (req) => {
  const raw = req.body?.orderNumber;
  const orderKey = typeof raw === 'string' && raw.trim() ? raw.trim().toUpperCase() : 'UNKNOWN';
  return `${req.ip}_track_${orderKey}`;
};

// Per order failure limit: 5 failed attempts per hour keyed on IP + order number
// (so a stranger cannot lock a real customer out of tracking)
export const trackOrderNumberLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  skipSuccessfulRequests: true,
  keyGenerator: getTrackOrderKey,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  statusCode: 404,
  message: { error: 'No order found with those details' },
});
