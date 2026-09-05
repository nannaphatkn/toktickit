import { createContext, useContext, useState, type ReactNode } from 'react';

export interface Requester {
  id: number;
  name: string;
  email: string;
  isActive: boolean;
}

interface RequesterContextType {
  requester: Requester | null;
  setRequester: (requester: Requester | null) => void;
  clearRequester: () => void;
}

const RequesterContext = createContext<RequesterContextType | undefined>(undefined);

export function RequesterProvider({ children }: { children: ReactNode }) {
  const [requester, setRequesterState] = useState<Requester | null>(() => {
    try {
      const saved = localStorage.getItem('requester');
      return saved ? JSON.parse(saved) : null;
    } catch {
      localStorage.removeItem('requester');
      localStorage.removeItem('requesterId');
      return null;
    }
  });

  const setRequester = (r: Requester | null) => {
    setRequesterState(r);
    if (r) {
      localStorage.setItem('requester', JSON.stringify(r));
      localStorage.setItem('requesterId', String(r.id));
    } else {
      localStorage.removeItem('requester');
      localStorage.removeItem('requesterId');
    }
  };

  const clearRequester = () => setRequester(null);

  return (
    <RequesterContext.Provider value={{ requester, setRequester, clearRequester }}>
      {children}
    </RequesterContext.Provider>
  );
}

export function useRequester(): RequesterContextType {
  const context = useContext(RequesterContext);
  if (!context) {
    throw new Error('useRequester must be used within a RequesterProvider');
  }
  return context;
}
