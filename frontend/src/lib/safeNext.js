/**
 * Safely resolves and normalizes a post-login redirect path.
 * Prevents open redirect attacks, protocol-relative exploits, and loops back into auth pages.
 *
 * @param {unknown} rawNext
 * @returns {string} Safe normalized relative path (e.g. "/orders", "/create?x=1") or "/"
 */
export function getSafeNextPath(rawNext) {
  try {
    if (typeof rawNext !== 'string' || !rawNext.startsWith('/')) {
      return '/';
    }

    const baseOrigin = window.location.origin;
    const url = new URL(rawNext, baseOrigin);

    if (url.origin !== baseOrigin) {
      return '/';
    }

    if (url.pathname.startsWith('/signin') || url.pathname.startsWith('/signup')) {
      return '/';
    }

    return url.pathname + url.search + url.hash;
  } catch {
    return '/';
  }
}
