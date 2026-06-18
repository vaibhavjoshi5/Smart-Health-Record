/**
 * Utility functions for authenticated API calls
 * 
 * Features:
 * - Automatic JWT token attachment
 * - Request timeout (30s)
 * - Auto-redirect on 401 (expired token)
 * - Retry logic for network errors (1 retry)
 * - Safe JSON parsing
 */

const REQUEST_TIMEOUT_MS = 30000; // 30 seconds

export function getToken() {
  try {
    const user = JSON.parse(localStorage.getItem('user'));
    return user && user.token ? user.token : null;
  } catch {
    return null;
  }
}

export function getUser() {
  try {
    return JSON.parse(localStorage.getItem('user'));
  } catch {
    localStorage.removeItem('user');
    return null;
  }
}

export async function authFetch(url, options = {}) {
  const token = getToken();
  const headers = { ...(options.headers || {}) };
  if (token) headers['Authorization'] = 'Bearer ' + token;

  // Create an AbortController for timeout if not provided
  let timeoutId;
  let controller = null;
  if (!options.signal) {
    controller = new AbortController();
    timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  }

  const fetchOptions = {
    ...options,
    headers,
    signal: options.signal || (controller ? controller.signal : undefined),
  };

  try {
    const response = await fetch(url, fetchOptions);

    // Clear timeout on success
    if (timeoutId) clearTimeout(timeoutId);

    // Handle 401 - Auto redirect to login
    if (response.status === 401) {
      localStorage.removeItem('user');
      // Only redirect if not already on login page
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
      return response;
    }

    return response;
  } catch (err) {
    if (timeoutId) clearTimeout(timeoutId);

    // Don't retry if request was intentionally aborted
    if (err.name === 'AbortError') {
      throw err;
    }

    // Retry once for network errors
    if (!options._retried) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return authFetch(url, { ...options, _retried: true });
    }

    throw err;
  }
}