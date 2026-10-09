import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { env, isProd } from '../config/env.js';

export const ACCESS_TTL_MS = 15 * 60 * 1000;
export const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export const signAccessToken = (user) =>
  jwt.sign({ sub: String(user._id), role: user.role }, env.JWT_ACCESS_SECRET, {
    algorithm: 'HS256',
    expiresIn: '15m',
    issuer: 'fouzas-creation',
  });

export const verifyAccessToken = (token) =>
  jwt.verify(token, env.JWT_ACCESS_SECRET, { algorithms: ['HS256'], issuer: 'fouzas-creation' });

export const newRefreshToken = () => crypto.randomBytes(48).toString('base64url');
export const hashToken = (t) => {
  if (typeof t !== 'string' || !t) return null;
  return crypto.createHash('sha256').update(t).digest('hex');
};

const cookieSameSite = env.COOKIE_SAMESITE || 'lax';
const isSecure = isProd || cookieSameSite === 'none';

export const getAuthCookieOptions = (extra = {}) => {
  const opts = {
    httpOnly: true,
    secure: isSecure,
    sameSite: cookieSameSite,
    ...extra,
  };
  if (typeof env.COOKIE_DOMAIN === 'string' && env.COOKIE_DOMAIN.trim()) {
    opts.domain = env.COOKIE_DOMAIN.trim();
  }
  return opts;
};

export const setAuthCookies = (res, accessToken, refreshToken) => {
  res.cookie('fc_at', accessToken, getAuthCookieOptions({ path: '/', maxAge: ACCESS_TTL_MS }));
  res.cookie('fc_rt', refreshToken, getAuthCookieOptions({ path: '/api/auth', maxAge: REFRESH_TTL_MS }));
};

export const clearAuthCookies = (res) => {
  res.clearCookie('fc_at', getAuthCookieOptions({ path: '/' }));
  res.clearCookie('fc_rt', getAuthCookieOptions({ path: '/api/auth' }));
};
