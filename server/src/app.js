import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import { env, isProd } from './config/env.js';
import { globalLimiter } from './middleware/rateLimiters.js';
import { requireCsrfHeader } from './middleware/auth.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/auth.js';
import orderRoutes from './routes/orders.js';
import adminRoutes from './routes/admin.js';
import itemRoutes from './routes/items.js';
import previewRoutes from './routes/previews.js';

const app = express();

// Trust proxy configured via environment (depth 1 for Render / Heroku / Vercel upstream proxies)
const trustProxy = /^\d+$/.test(env.TRUST_PROXY) ? parseInt(env.TRUST_PROXY, 10) : env.TRUST_PROXY;
app.set('trust proxy', trustProxy);
app.disable('x-powered-by');

// Strict Security headers (Helmet) - API serves JSON only by default
app.use(
  helmet({
    contentSecurityPolicy: { directives: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] } },
    hsts: isProd ? { maxAge: 31536000, includeSubDomains: true } : false,
  })
);

// CORS restricted strictly to frontend origin with credentials enabled
app.use(
  cors({
    origin: (origin, cb) =>
      !origin || origin === env.CLIENT_ORIGIN ? cb(null, true) : cb(new Error('Not allowed by CORS')),
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'X-Requested-With'],
  })
);

// Body size limit strictly capped at 10kb
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());
app.use(mongoSanitize());
app.use(hpp());

// Health endpoint - No sensitive information
app.get('/api/health', (req, res) =>
  res.json({ status: 'ok', uptime: Math.floor(process.uptime()) })
);

// Share preview route for social crawlers (WhatsApp, Facebook, Instagram, Twitter)
// Crawlers get Open Graph HTML; regular browsers fall through via next()
app.use(previewRoutes);

// Global rate limiting & CSRF header verification for state-changing routes
app.use('/api', globalLimiter, requireCsrfHeader);

// API route registrations
app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
