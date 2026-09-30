import rateLimit from 'express-rate-limit';

const make = (windowMs, limit, message) =>
  rateLimit({ windowMs, limit, standardHeaders: 'draft-7', legacyHeaders: false, message: { error: message } });

export const globalLimiter = make(15 * 60 * 1000, 300, 'Too many requests. Please try again later.');
export const authLimiter = make(15 * 60 * 1000, 10, 'Too many attempts. Please try again in a few minutes.');
export const orderLimiter = make(60 * 60 * 1000, 20, 'Too many orders submitted. Please try again later.');
