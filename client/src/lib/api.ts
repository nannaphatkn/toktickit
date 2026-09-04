const API_BASE = 'http://localhost:5001/api';

/**
 * Fetch wrapper that automatically attaches the X-Requester-Id header
 * from localStorage to every API request.
 */
export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const requesterId = localStorage.getItem('requesterId');

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };

  if (requesterId) {
    headers['X-Requester-Id'] = requesterId;
  }

  // Only set Content-Type for JSON if body is not FormData
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  return fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });
}
