export const API_HOST = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/+$/, '');
export const BASE_URL = `${API_HOST}/api`;

/**
 * Enterprise API Client wrapper for AgriPulse BFF backend
 */
export async function apiClient(endpoint, options = {}) {
  const token = localStorage.getItem('agripulse_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || `API error (${response.status})`);
  }

  return response.json();
}
