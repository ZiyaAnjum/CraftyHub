import rateLimit from 'express-rate-limit';

const make = (windowMs, limit, message) =>
  rateLimit({ windowMs, limit, standardHeaders: 'draft-7', legacyHeaders: false, message: { error: message } });

export const globalLimiter = make(15 * 60 * 1000, 300, 'Too many requests. Please try again later.');
export const authLimiter = make(15 * 60 * 1000, 10, 'Too many attempts. Please try again in a few minutes.');
export const refreshLimiter = make(15 * 60 * 1000, 60, 'Too many refresh attempts. Please try again later.');
export const orderLimiter = make(60 * 60 * 1000, 20, 'Too many orders submitted. Please try again later.');

export const orderUserLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  keyGenerator: (req) => req.user?.id || req.ip,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many orders submitted. Please try again later.' },
});

export const trackLimiter = make(15 * 60 * 1000, 30, 'Too many tracking attempts. Please try again in a few minutes.');
