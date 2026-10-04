import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';

export type Role = 'REQUESTER' | 'IT_STAFF' | 'ADMINISTRATOR';

export interface User {
  id: number;
  email: string;
  fullName: string;
  role: Role;
  mustChangePassword: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; mustChangePassword?: boolean; error?: string }>;
  logout: () => void;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const savedUser = localStorage.getItem('toktickit_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() => localStorage.getItem('toktickit_token'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function verifySession() {
      if (token) {
        try {
          const res = await apiFetch('/auth/me');
          if (res.ok) {
            const data = await res.json();
            setUser(data.user);
            localStorage.setItem('toktickit_user', JSON.stringify(data.user));
            localStorage.setItem('requesterId', String(data.user.id));
            localStorage.setItem('requester', JSON.stringify({
              id: data.user.id,
              name: data.user.fullName,
              email: data.user.email,
              isActive: true,
            }));
          } else {
            logout();
          }
        } catch {
          // If server is unreachable, keep local state for now
        }
      }
      setIsLoading(false);
    }
    verifySession();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data.error || 'Login failed.' };
      }

      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('toktickit_token', data.token);
      localStorage.setItem('toktickit_user', JSON.stringify(data.user));
      localStorage.setItem('requesterId', String(data.user.id));
      localStorage.setItem('requester', JSON.stringify({
        id: data.user.id,
        name: data.user.fullName,
        email: data.user.email,
        isActive: true,
      }));

      return {
        success: true,
        mustChangePassword: data.user.mustChangePassword,
      };
    } catch (err) {
      return { success: false, error: 'Network error connecting to server.' };
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      const res = await apiFetch('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data.error || 'Password change failed.' };
      }

      if (data.token && data.user) {
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('toktickit_token', data.token);
        localStorage.setItem('toktickit_user', JSON.stringify(data.user));
      } else if (user) {
        const updatedUser = { ...user, mustChangePassword: false };
        setUser(updatedUser);
        localStorage.setItem('toktickit_user', JSON.stringify(updatedUser));
      }

      return { success: true };
    } catch (err) {
      return { success: false, error: 'Network error changing password.' };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('toktickit_token');
    localStorage.removeItem('toktickit_user');
    localStorage.removeItem('requesterId');
    localStorage.removeItem('requester');
    apiFetch('/auth/logout', { method: 'POST' }).catch(() => {});
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        logout,
        changePassword,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
