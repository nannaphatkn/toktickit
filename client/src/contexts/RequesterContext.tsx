import { useCallback, useState, type ReactNode } from 'react';
import { RequesterContext, type Requester } from './requesterContextCore';

function restoreRequester(): Requester | null {
  try {
    const saved = localStorage.getItem('requester');
    if (!saved) return null;

    const candidate: unknown = JSON.parse(saved);
    if (
      typeof candidate !== 'object' ||
      candidate === null ||
      !('id' in candidate) ||
      typeof candidate.id !== 'number' ||
      !Number.isSafeInteger(candidate.id) ||
      candidate.id <= 0 ||
      !('name' in candidate) ||
      typeof candidate.name !== 'string' ||
      !('email' in candidate) ||
      typeof candidate.email !== 'string' ||
      !('isActive' in candidate) ||
      candidate.isActive !== true
    ) {
      throw new Error('Invalid stored requester');
    }

    const requester = candidate as Requester;
    localStorage.setItem('requesterId', String(requester.id));
    return requester;
  } catch {
    localStorage.removeItem('requester');
    localStorage.removeItem('requesterId');
    return null;
  }
}

export function RequesterProvider({ children }: { children: ReactNode }) {
  const [requester, setRequesterState] = useState<Requester | null>(restoreRequester);

  const setRequester = useCallback((r: Requester | null) => {
    setRequesterState(r);
    if (r) {
      localStorage.setItem('requester', JSON.stringify(r));
      localStorage.setItem('requesterId', String(r.id));
    } else {
      localStorage.removeItem('requester');
      localStorage.removeItem('requesterId');
    }
  }, []);

  const clearRequester = useCallback(() => setRequester(null), [setRequester]);

  return (
    <RequesterContext.Provider value={{ requester, setRequester, clearRequester }}>
      {children}
    </RequesterContext.Provider>
  );
}
