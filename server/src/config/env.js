import 'dotenv/config';
import { z } from 'zod';

const schema = z
  .object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().default(5000),
    MONGO_URI: z.string().min(1, 'MONGO_URI is required'),
    JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
    CLIENT_ORIGIN: z.string().url('CLIENT_ORIGIN must be a valid URL'),
    PUBLIC_SITE_URL: z.string().url('PUBLIC_SITE_URL must be a valid URL').optional(),
    CLOUDINARY_CLOUD_NAME: z.string().optional(),
    CLOUDINARY_API_KEY: z.string().optional(),
    CLOUDINARY_API_SECRET: z.string().optional(),
    ADMIN_EMAIL: z.string().email().optional(),
    ADMIN_PASSWORD: z.string().min(10).optional(),
    COOKIE_DOMAIN: z.string().optional(),
    COOKIE_SAMESITE: z.enum(['lax', 'strict', 'none']).default('lax'),
    TRUST_PROXY: z.string().default('1'),
    EMAIL_HOST: z.string().optional().default('smtp.gmail.com'),
    EMAIL_PORT: z.coerce.number().optional().default(587),
    EMAIL_USER: z.string().optional().default(''),
    EMAIL_PASS: z.string().optional().default(''),
    EMAIL_FROM: z.string().optional().default('Fouzas Creation <noreply@fouzascreation.com>'),
    CLIENT_URL: z.preprocess(
      (val) => (typeof val === 'string' && val.trim() === '' ? undefined : val),
      z.string().url().optional()
    ),
    PUBLIC_SITE_URL: z.preprocess(
      (val) => (typeof val === 'string' && val.trim() === '' ? undefined : val),
      z.string().url().optional()
    ),
  })
  .superRefine((data, ctx) => {
    if (data.NODE_ENV === 'production') {
      if (!data.CLIENT_ORIGIN.startsWith('https://')) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'CLIENT_ORIGIN must use HTTPS in production',
          path: ['CLIENT_ORIGIN'],
        });
      }
      if (!data.CLOUDINARY_CLOUD_NAME || !data.CLOUDINARY_CLOUD_NAME.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'CLOUDINARY_CLOUD_NAME is required in production',
          path: ['CLOUDINARY_CLOUD_NAME'],
        });
      }
      if (!data.CLOUDINARY_API_KEY || !data.CLOUDINARY_API_KEY.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'CLOUDINARY_API_KEY is required in production',
          path: ['CLOUDINARY_API_KEY'],
        });
      }
      if (!data.CLOUDINARY_API_SECRET || !data.CLOUDINARY_API_SECRET.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'CLOUDINARY_API_SECRET is required in production',
          path: ['CLOUDINARY_API_SECRET'],
        });
      }
    }
  });

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment configuration:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = {
  ...parsed.data,
  PUBLIC_SITE_URL: (parsed.data.PUBLIC_SITE_URL || parsed.data.CLIENT_ORIGIN).replace(/\/+$/, ''),
  CLIENT_ORIGIN: parsed.data.CLIENT_ORIGIN.replace(/\/+$/, ''),
  CLIENT_URL: (parsed.data.CLIENT_URL || parsed.data.CLIENT_ORIGIN).replace(/\/+$/, ''),
};
export const isProd = env.NODE_ENV === 'production';

