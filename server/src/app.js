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

const app = express();

app.set('trust proxy', 1); // behind Render/Vercel proxy: needed for correct client IPs in rate limiting
app.disable('x-powered-by');

// Security headers (Helmet)
app.use(
  helmet({
    contentSecurityPolicy: { directives: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] } }, // API serves JSON only
    hsts: isProd ? { maxAge: 31536000, includeSubDomains: true } : false,
  })
);

// CORS restricted to frontend origin
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

app.get('/api/health', (req, res) => res.json({ ok: true }));

// Global rate limiting & CSRF header verification
app.use('/api', globalLimiter, requireCsrfHeader);

// API route registrations
app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/gifts', itemRoutes); // backward compatibility alias
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
