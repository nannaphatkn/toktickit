import { useCallback, useState, useEffect, useContext, type ReactNode } from 'react';
import { RequesterContext, type Requester } from './requesterContextCore';
import { AuthContext } from '../context/AuthContext';

function restoreRequester(): Requester | null {
  try {
    const saved = localStorage.getItem('requester');
    if (saved) {
      const candidate: unknown = JSON.parse(saved);
      if (
        typeof candidate === 'object' &&
        candidate !== null &&
        'id' in candidate &&
        typeof (candidate as any).id === 'number' &&
        Number.isSafeInteger((candidate as any).id) &&
        (candidate as any).id > 0 &&
        'name' in candidate &&
        typeof (candidate as any).name === 'string' &&
        'email' in candidate &&
        typeof (candidate as any).email === 'string' &&
        'isActive' in candidate &&
        (candidate as any).isActive === true
      ) {
        const requester = candidate as Requester;
        localStorage.setItem('requesterId', String(requester.id));
        return requester;
      }
    }

    const savedUser = localStorage.getItem('toktickit_user');
    if (savedUser) {
      const u = JSON.parse(savedUser);
      if (u && typeof u.id === 'number' && u.fullName && u.email) {
        const req: Requester = {
          id: u.id,
          name: u.fullName,
          email: u.email,
          isActive: true,
        };
        localStorage.setItem('requester', JSON.stringify(req));
        localStorage.setItem('requesterId', String(req.id));
        return req;
      }
    }

    return null;
  } catch {
    localStorage.removeItem('requester');
    localStorage.removeItem('requesterId');
    return null;
  }
}

export function RequesterProvider({ children }: { children: ReactNode }) {
  const auth = useContext(AuthContext);
  const [requester, setRequesterState] = useState<Requester | null>(restoreRequester);

  useEffect(() => {
    if (auth?.user) {
      const synced: Requester = {
        id: auth.user.id,
        name: auth.user.fullName,
        email: auth.user.email,
        isActive: true,
      };
      setRequesterState(synced);
      localStorage.setItem('requester', JSON.stringify(synced));
      localStorage.setItem('requesterId', String(synced.id));
    } else if (auth && !auth.user && !auth.isLoading) {
      setRequesterState(null);
      localStorage.removeItem('requester');
      localStorage.removeItem('requesterId');
    }
  }, [auth?.user, auth?.isLoading]);

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
