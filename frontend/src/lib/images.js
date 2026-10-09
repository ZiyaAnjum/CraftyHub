/**
 * Utility to generate optimized responsive image URLs for Cloudinary assets.
 * Adds f_auto (format auto), q_auto (quality auto), and responsive width scaling.
 * Safely handles missing, non-string, and non-Cloudinary images without throwing.
 *
 * @param {string} url - Source image URL
 * @param {number} [width=600] - Desired bounding width in pixels
 * @returns {string} Optimized URL, unchanged non-Cloudinary URL, or empty string if missing
 */
export function getOptimizedImageUrl(url, width = 600) {
  if (!url || typeof url !== 'string') {
    return '';
  }

  const trimmed = url.trim();
  if (!trimmed) {
    return '';
  }

  // Only transform Cloudinary upload URLs
  if (trimmed.includes('res.cloudinary.com') && trimmed.includes('/upload/')) {
    // Avoid double-inserting transformations if already present
    if (trimmed.includes('/upload/f_auto,q_auto')) {
      return trimmed;
    }

    const safeWidth = Number.isFinite(width) && width > 0 ? Math.round(width) : 600;
    return trimmed.replace('/upload/', `/upload/f_auto,q_auto,w_${safeWidth},c_limit/`);
  }

  // Safely return non-Cloudinary images unchanged
  return trimmed;
}
