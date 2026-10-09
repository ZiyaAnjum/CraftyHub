import { Router } from 'express';
import { Item } from '../models/Item.js';
import { env } from '../config/env.js';

const router = Router();

// Matches major social media and messaging app crawler user agents
const CRAWLER_USER_AGENTS =
  /facebookexternalhit|Facebot|WhatsApp|Twitterbot|Pinterest|LinkedInBot|Slackbot|TelegramBot|Discordbot/i;

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getOgImageUrl(item) {
  const raw = item?.images?.[0]?.url || '';
  if (typeof raw === 'string' && raw.includes('res.cloudinary.com') && raw.includes('/upload/')) {
    const secureUrl = raw.replace(/^http:\/\//i, 'https://');
    if (!secureUrl.includes('/upload/f_auto,q_auto')) {
      return secureUrl.replace('/upload/', '/upload/f_auto,q_auto,c_fill,g_auto,w_1200,h_630/');
    }
    return secureUrl;
  }
  if (typeof raw === 'string' && (raw.startsWith('http://') || raw.startsWith('https://'))) {
    return raw.replace(/^http:\/\//i, 'https://');
  }
  return `${env.PUBLIC_SITE_URL}/favicon.ico`;
}

function buildMetaHtml({ title, description, canonicalUrl, imageUrl }) {
  const safeTitle = escapeHtml(title);
  const safeDesc = escapeHtml(description);
  const safeUrl = escapeHtml(canonicalUrl);
  const safeImg = escapeHtml(imageUrl);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${safeTitle}</title>
  <meta name="description" content="${safeDesc}" />
  <link rel="canonical" href="${safeUrl}" />

  <!-- Open Graph / Facebook / WhatsApp / Instagram -->
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Fouzas Creation" />
  <meta property="og:title" content="${safeTitle}" />
  <meta property="og:description" content="${safeDesc}" />
  <meta property="og:url" content="${safeUrl}" />
  <meta property="og:image" content="${safeImg}" />
  <meta property="og:image:secure_url" content="${safeImg}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content="${safeTitle}" />

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${safeTitle}" />
  <meta name="twitter:description" content="${safeDesc}" />
  <meta name="twitter:image" content="${safeImg}" />
</head>
<body>
  <h1>${safeTitle}</h1>
  <p>${safeDesc}</p>
  <p><a href="${safeUrl}">View on Fouzas Creation</a></p>
</body>
</html>`;
}

async function renderItemPreview(req, res, next) {
  try {
    const userAgent = req.get('user-agent') || '';
    const isCrawler = CRAWLER_USER_AGENTS.test(userAgent);
    const isExplicitPreview = req.path.endsWith('/preview');

    // Only serve crawler HTML if requested by a crawler or preview route
    if (!isCrawler && !isExplicitPreview) {
      return next();
    }

    const item = await Item.findOne({ slug: req.params.slug, isVisible: true }).lean();

    // Specific minimal CSP header strictly scoped to this crawler HTML response
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; img-src https: data:; style-src 'unsafe-inline';"
    );
    res.setHeader('Content-Type', 'text/html; charset=utf-8');

    if (!item) {
      return res.status(404).send(
        buildMetaHtml({
          title: 'Item Not Found | Fouzas Creation',
          description: 'The requested bespoke creation could not be found.',
          canonicalUrl: `${env.PUBLIC_SITE_URL}/explore`,
          imageUrl: `${env.PUBLIC_SITE_URL}/favicon.ico`,
        })
      );
    }

    const priceText = item.startingPrice ? ` (Starting from ₹${item.startingPrice})` : '';
    const descText = item.description
      ? item.description.slice(0, 200).trim()
      : `Bespoke handcrafted ${item.category || 'creation'} by Fouzas Creation, Bengaluru.`;

    const html = buildMetaHtml({
      title: `${item.title}${priceText} | Fouzas Creation`,
      description: descText,
      canonicalUrl: `${env.PUBLIC_SITE_URL}/items/${encodeURIComponent(item.slug)}`,
      imageUrl: getOgImageUrl(item),
    });

    return res.status(200).send(html);
  } catch (err) {
    next(err);
  }
}

// Routes:
// 1. GET /items/:slug - For reverse proxy routing or unified hosting
router.get('/items/:slug', renderItemPreview);

// 2. GET /api/items/:slug/preview - Direct API endpoint
router.get('/api/items/:slug/preview', renderItemPreview);

export default router;
