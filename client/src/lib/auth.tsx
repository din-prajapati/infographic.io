import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { LegacyUser } from '@shared/schema';
import { clearUserStorage } from './storage';
import { useCanvasStore } from '../hooks/useCanvasStore';
import { queryClient } from './queryClient';

interface AuthContextType {
  user: LegacyUser | null;
  token: string | null;
  login: (user: LegacyUser, token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<LegacyUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('auth_user');

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
      }
    }
    setIsLoading(false);
  }, []);

  // Keep this tab's cached user in step with other tabs.
  //
  // Clicking a verification link opens a NEW tab. `VerifyEmailPage` writes the
  // refreshed session to localStorage there, but the tab the user came from
  // holds `user` in React state read once at mount — so it kept showing "please
  // verify your email" for an account that was already verified, and its Resend
  // button went on offering to send a mail the server would refuse to send.
  //
  // `storage` fires only in the OTHER tabs, which is precisely the case that was
  // broken. Logout in one tab propagates the same way.
  //
  // Not a full fix: verifying on a different device still leaves this tab stale
  // until reload, because nothing re-reads the user from the server. That needs
  // a current-user endpoint, which does not exist yet.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== 'auth_user' && e.key !== 'auth_token' && e.key !== null) return;

      const nextToken = localStorage.getItem('auth_token');
      const nextUser = localStorage.getItem('auth_user');

      if (!nextToken || !nextUser) {
        setUser(null);
        setToken(null);
        return;
      }

      try {
        setUser(JSON.parse(nextUser));
        setToken(nextToken);
      } catch {
        // Leave the current session alone rather than signing the user out on
        // an unparseable write from elsewhere.
      }
    };

    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const login = (newUser: LegacyUser, newToken: string) => {
    queryClient.clear();
    setUser(newUser);
    setToken(newToken);
    localStorage.setItem('auth_token', newToken);
    localStorage.setItem('auth_user', JSON.stringify(newUser));
  };

  const logout = () => {
    queryClient.clear();
    setUser(null);
    setToken(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    clearUserStorage();
    useCanvasStore.getState().clearCanvas();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        isAuthenticated: !!user && !!token,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

