import { isProd } from '../config/env.js';

export const notFound = (req, res) => res.status(404).json({ error: 'Not found.' });

// Central error handler: never leaks internal errors or stack traces to clients in production
// Structured logs exclude sensitive personal data (phone, address, credentials)
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  if (err?.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Request too large.' });
  }
  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON.' });
  }
  if (err?.message === 'Not allowed by CORS') {
    return res.status(403).json({ error: 'Origin not allowed.' });
  }

  if (isProd) {
    console.error(
      JSON.stringify({
        level: 'error',
        timestamp: new Date().toISOString(),
        errorName: err?.name || 'Error',
        errorMessage: err?.message || 'Unknown error',
        path: req.originalUrl,
        method: req.method,
        ip: req.ip,
      })
    );
  } else {
    console.error('[DEV ERROR]', err);
  }

  res.status(500).json({ error: 'Something went wrong. Please try again.' });
};
