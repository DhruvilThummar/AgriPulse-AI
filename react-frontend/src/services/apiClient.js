export const API_HOST = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/+$/, '');
export const BASE_URL = `${API_HOST}/api`;

/**
 * Helper to retrieve stored auth token across localStorage, sessionStorage, and cookies
 */
export function getAuthToken() {
  const localToken = localStorage.getItem('agripulse_token');
  if (localToken) return localToken;

  const sessionToken = sessionStorage.getItem('agripulse_token');
  if (sessionToken) return sessionToken;

  const match = document.cookie.match(new RegExp('(^| )agripulse_token=([^;]+)'));
  if (match) return decodeURIComponent(match[2]);

  return null;
}

/**
 * Enterprise API Client wrapper for AgriPulse BFF backend with timeout & normalized errors
 */
export async function apiClient(endpoint, options = {}) {
  const { timeout = 12000, headers: customHeaders = {}, ...customOptions } = options;
  const token = getAuthToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...customHeaders,
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...customOptions,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timer);

    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json().catch(() => ({}));
    } else {
      const text = await response.text().catch(() => '');
      data = { message: text };
    }

    if (!response.ok) {
      const errorMsg = data?.error || data?.message || `API Error (${response.status})`;
      const err = new Error(errorMsg);
      err.status = response.status;
      err.data = data;
      throw err;
    }

    return data;
  } catch (error) {
    clearTimeout(timer);
    if (error.name === 'AbortError') {
      const timeoutErr = new Error('Network request timed out. Please check your connection.');
      timeoutErr.isTimeout = true;
      throw timeoutErr;
    }
    throw error;
  }
}

