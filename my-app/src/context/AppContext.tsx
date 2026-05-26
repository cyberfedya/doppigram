import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { AuthState, User } from '../types';

interface AppContextType {
  auth: AuthState;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  createUser: (username: string, password: string, displayName?: string, email?: string) => Promise<boolean>;
  createChat: (name: string, isGroup: boolean, participantIds: string[]) => Promise<string | null>;
  isLoading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState>({ user: null, isAuthenticated: false, isLoading: true });
  const [localLoading, setLocalLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('doppigram_session');
    if (stored) {
      try {
        const userData = JSON.parse(stored) as User;
        setAuth({ user: userData, isAuthenticated: true, isLoading: false });
      } catch {
        localStorage.removeItem('doppigram_session');
        setAuth({ user: null, isAuthenticated: false, isLoading: false });
      }
    } else {
      setAuth({ user: null, isAuthenticated: false, isLoading: false });
    }
    setLocalLoading(false);
  }, []);

  const login = useCallback(async (_username: string, _password: string): Promise<boolean> => {
    // TODO: implement with your backend
    return false;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('doppigram_session');
    setAuth({ user: null, isAuthenticated: false, isLoading: false });
  }, []);

  const createUser = useCallback(async (
    _username: string,
    _password: string,
    _displayName?: string,
    _email?: string,
  ): Promise<boolean> => {
    // TODO: implement with your backend
    return false;
  }, []);

  const createChat = useCallback(async (
    _name: string,
    _isGroup: boolean,
    _participantIds: string[],
  ): Promise<string | null> => {
    // TODO: implement with your backend
    return null;
  }, []);

  const isLoading = localLoading || auth.isLoading;

  return (
    <AppContext.Provider value={{ auth, login, logout, createUser, createChat, isLoading }}>
      {children}
    </AppContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
}
