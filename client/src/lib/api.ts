const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Fetch wrapper that automatically attaches the X-Requester-Id header
 * from localStorage to every API request.
 */
export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const requesterId = localStorage.getItem('requesterId');

  const headers = new Headers(options.headers);

  if (requesterId) {
    headers.set('X-Requester-Id', requesterId);
  }

  // Only set Content-Type for JSON if body is not FormData
  if (options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  return fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });
}
