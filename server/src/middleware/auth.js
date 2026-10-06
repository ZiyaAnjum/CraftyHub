import { verifyAccessToken } from '../utils/tokens.js';

export const requireAuth = (req, res, next) => {
  const token = req.cookies?.fc_at;
  if (!token) return res.status(401).json({ error: 'Please sign in to continue.' });
  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch {
    return res.status(401).json({ error: 'Your session has expired. Please sign in again.' });
  }
};

export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'You do not have permission to do this.' });
  }
  next();
};

export const requireAdmin = requireRole('admin');

// CSRF defence in depth: browsers cannot add a custom header cross-site without a CORS
// preflight, and CORS only allows our own origin. Combined with SameSite cookies.
export const requireCsrfHeader = (req, res, next) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    if (req.get('X-Requested-With') !== 'fouzas-web') {
      return res.status(403).json({ error: 'Invalid request.' });
    }
  }
  next();
};
