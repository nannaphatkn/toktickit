const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Fetch wrapper that automatically attaches the X-Requester-Id header
 * from localStorage to every API request.
 */
export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  let requesterId = localStorage.getItem('requesterId');

  // The context persists both keys for compatibility. Recover the ID from the
  // canonical requester object if older storage contains only that value.
  if (!requesterId) {
    try {
      const storedRequester = JSON.parse(localStorage.getItem('requester') ?? 'null');
      if (Number.isSafeInteger(storedRequester?.id) && storedRequester.id > 0 && storedRequester.isActive === true) {
        requesterId = String(storedRequester.id);
        localStorage.setItem('requesterId', requesterId);
      }
    } catch {
      // Invalid persisted state is handled by RequesterProvider; public API
      // requests can continue without an identity header.
    }
  }

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
