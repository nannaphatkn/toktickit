const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

/**
 * Fetch wrapper that automatically attaches the X-Requester-Id header
 * from localStorage to every API request.
 */
export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = localStorage.getItem('toktickit_token');
  let requesterId = localStorage.getItem('requesterId');

  if (!requesterId) {
    try {
      const storedRequester = JSON.parse(localStorage.getItem('requester') ?? 'null');
      if (Number.isSafeInteger(storedRequester?.id) && storedRequester.id > 0 && storedRequester.isActive === true) {
        requesterId = String(storedRequester.id);
        localStorage.setItem('requesterId', requesterId);
      }
    } catch {
      // Invalid persisted state ignored
    }
  }

  const headers = new Headers(options.headers);

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

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
