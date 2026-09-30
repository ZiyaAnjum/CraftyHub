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

const app = express();

app.set('trust proxy', 1); // behind Render/Vercel proxy: needed for correct client IPs in rate limiting
app.disable('x-powered-by');

app.use(helmet({
  contentSecurityPolicy: { directives: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] } }, // API serves JSON only
  hsts: isProd ? { maxAge: 31536000, includeSubDomains: true } : false,
}));
app.use(cors({
  origin: (origin, cb) => (!origin || origin === env.CLIENT_ORIGIN ? cb(null, true) : cb(new Error('Not allowed by CORS'))),
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'X-Requested-With'],
}));
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());
app.use(mongoSanitize());
app.use(hpp());

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api', globalLimiter, requireCsrfHeader);
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
