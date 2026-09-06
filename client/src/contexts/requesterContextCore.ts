import { createContext, useContext } from 'react';

export interface Requester {
  id: number;
  name: string;
  email: string;
  isActive: boolean;
}

export interface RequesterContextType {
  requester: Requester | null;
  setRequester: (requester: Requester | null) => void;
  clearRequester: () => void;
}

export const RequesterContext = createContext<RequesterContextType | undefined>(undefined);

export function useRequester(): RequesterContextType {
  const context = useContext(RequesterContext);
  if (!context) {
    throw new Error('useRequester must be used within a RequesterProvider');
  }
  return context;
}
