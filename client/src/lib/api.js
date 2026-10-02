/**
 * Fouzas Creation API client layer
 * Handles credentials, CSRF header, single-flight token refresh, and readable error handling.
 */


export class ApiError extends Error {
  constructor(message, status, details = null, raw = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details; // Array of { field, message } from server validation
    this.raw = raw;
  }

  // Get first error message for a specific form field if present
  getFieldError(fieldName) {
    if (!Array.isArray(this.details)) return null;
    const match = this.details.find((d) => d.field === fieldName);
    return match ? match.message : null;
  }
}

let refreshPromise = null;

async function doRefresh() {
  let res = await fetch('/api/auth/refresh', {
    method: 'POST',
    headers: {
      'X-Requested-With': 'fouzas-web',
    },
    credentials: 'include',
  });

  if (!res.ok) {
    if (res.status === 401) {
      let isRetry = false;
      try {
        const data = await res.json();
        if (data?.error === 'Please retry.') {
          isRetry = true;
        }
      } catch {
        // ignore
      }

      if (isRetry) {
        await new Promise((resolve) => setTimeout(resolve, 300));
        res = await fetch('/api/auth/refresh', {
          method: 'POST',
          headers: {
            'X-Requested-With': 'fouzas-web',
          },
          credentials: 'include',
        });
      }
    }

    if (!res.ok) {
      throw new Error('Refresh failed');
    }
  }

  return res.json();
}

function getRefreshPromise() {
  if (!refreshPromise) {
    refreshPromise = doRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

export async function apiFetch(endpoint, options = {}, isRetry = false) {
  const isAuthEndpoint =
    endpoint.includes('/api/auth/login') ||
    endpoint.includes('/api/auth/register') ||
    endpoint.includes('/api/auth/refresh') ||
    endpoint.includes('/api/auth/logout');

  const headers = {
    'X-Requested-With': 'fouzas-web',
    ...(options.body && typeof options.body === 'object' && !(options.body instanceof FormData)
      ? { 'Content-Type': 'application/json' }
      : {}),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
    credentials: 'include',
    body:
      options.body && typeof options.body === 'object' && !(options.body instanceof FormData)
        ? JSON.stringify(options.body)
        : options.body,
  };

  let response;
  try {
    response = await fetch(endpoint, config);
  } catch (networkErr) {
    throw new ApiError('Unable to connect to the server. Please check your internet connection.', 0);
  }

  // On 401, attempt token refresh once (if not already an auth route or retry)
  if (response.status === 401 && !isRetry && !isAuthEndpoint) {
    try {
      await getRefreshPromise();
      // Retry original request with same arguments, flagged as retry
      return await apiFetch(endpoint, options, true);
    } catch {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('session-lost'));
      }
      throw new ApiError('Session expired. Please sign in again.', 401);
    }
  }

  let data = null;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    if (response.status === 401 && !isAuthEndpoint) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('session-lost'));
      }
    }
    let errorMessage = 'An unexpected error occurred.';
    let details = null;

    if (data && typeof data === 'object') {
      if (data.error) {
        errorMessage = data.error;
      }
      if (data.details) {
        details = data.details;
      }
    } else if (response.statusText) {
      errorMessage = response.statusText;
    }

    throw new ApiError(errorMessage, response.status, details, data);
  }

  return data;
}

export const api = {
  get: (url, options = {}) => apiFetch(url, { ...options, method: 'GET' }),
  post: (url, body, options = {}) => apiFetch(url, { ...options, method: 'POST', body }),
  patch: (url, body, options = {}) => apiFetch(url, { ...options, method: 'PATCH', body }),
  delete: (url, options = {}) => apiFetch(url, { ...options, method: 'DELETE' }),
};
