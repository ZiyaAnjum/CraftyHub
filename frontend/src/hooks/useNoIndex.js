import { useEffect } from 'react';

/**
 * Injects <meta name="robots" content="noindex, nofollow"> into document.head
 * while the component is mounted, restoring previous state on unmount.
 */
export function useNoIndex() {
  useEffect(() => {
    let meta = document.querySelector('meta[name="robots"]');
    const created = !meta;

    if (created) {
      meta = document.createElement('meta');
      meta.name = 'robots';
      document.head.appendChild(meta);
    }

    const previousContent = meta.getAttribute('content');
    meta.setAttribute('content', 'noindex, nofollow');

    return () => {
      if (created) {
        meta.remove();
      } else if (previousContent !== null) {
        meta.setAttribute('content', previousContent);
      } else {
        meta.removeAttribute('content');
      }
    };
  }, []);
}
