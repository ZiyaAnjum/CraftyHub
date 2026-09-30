import { isProd } from '../config/env.js';

export const notFound = (req, res) => res.status(404).json({ error: 'Not found.' });

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  if (err?.type === 'entity.too.large') return res.status(413).json({ error: 'Request too large.' });
  if (err?.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON.' });
  if (err?.message === 'Not allowed by CORS') return res.status(403).json({ error: 'Origin not allowed.' });
  console.error(isProd ? `[error] ${err?.name}: ${err?.message}` : err); // never send details to the client
  res.status(500).json({ error: 'Something went wrong. Please try again.' });
};
