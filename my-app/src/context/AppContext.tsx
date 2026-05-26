import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { AuthState, User } from '../types';
import { auth as authApi, users as usersApi, chats as chatsApi } from '../services/api';
import { startConnection, joinUserGroup, stopConnection } from '../services/signalr';

interface AppContextType {
  auth: AuthState;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  createUser: (username: string, password: string, displayName?: string, email?: string) => Promise<boolean>;
  createChat: (name: string, isGroup: boolean, participantIds: string[]) => Promise<string | null>;
  isLoading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

function apiUserToUser(u: {
  id: string; username: string; displayName: string; email: string;
  avatar?: string; avatarType?: string;
  isAdmin: boolean; isVerified: boolean; isBanned: boolean;
  isOnline: boolean; lastSeen: number; statusText?: string; createdAt: number;
}): User {
  return {
    id: u.id,
    username: u.username,
    displayName: u.displayName,
    email: u.email,
    avatar: u.avatar,
    avatarType: u.avatarType as 'emoji' | 'image' | undefined,
    isAdmin: u.isAdmin,
    isVerified: u.isVerified,
    isOnboarded: true,
    isOnline: u.isOnline,
    lastSeen: u.lastSeen,
  };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState>({ user: null, isAuthenticated: false, isLoading: true });
  const [localLoading, setLocalLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('doppigram_session');
    const token = localStorage.getItem('doppigram_token');
    if (stored && token) {
      try {
        const userData = JSON.parse(stored) as User;
        setAuth({ user: userData, isAuthenticated: true, isLoading: false });
        // Connect SignalR and join user group
        startConnection().then(() => joinUserGroup(userData.id)).catch(() => {});
        // Mark user online
        usersApi.setOnline(userData.id, true).catch(() => {});
      } catch {
        localStorage.removeItem('doppigram_session');
        localStorage.removeItem('doppigram_token');
        setAuth({ user: null, isAuthenticated: false, isLoading: false });
      }
    } else {
      setAuth({ user: null, isAuthenticated: false, isLoading: false });
    }
    setLocalLoading(false);
  }, []);

  // Mark offline on unload
  useEffect(() => {
    const handleUnload = () => {
      const stored = localStorage.getItem('doppigram_session');
      if (stored) {
        try {
          const u = JSON.parse(stored) as User;
          usersApi.setOnline(u.id, false).catch(() => {});
        } catch { /* ignore */ }
      }
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, []);

  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    try {
      const res = await authApi.login(username, password);
      const user = apiUserToUser(res.user);
      localStorage.setItem('doppigram_token', res.token);
      localStorage.setItem('doppigram_session', JSON.stringify(user));
      setAuth({ user, isAuthenticated: true, isLoading: false });
      await startConnection();
      await joinUserGroup(user.id);
      return true;
    } catch {
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    const stored = localStorage.getItem('doppigram_session');
    if (stored) {
      try {
        const u = JSON.parse(stored) as User;
        usersApi.setOnline(u.id, false).catch(() => {});
      } catch { /* ignore */ }
    }
    stopConnection().catch(() => {});
    localStorage.removeItem('doppigram_session');
    localStorage.removeItem('doppigram_token');
    setAuth({ user: null, isAuthenticated: false, isLoading: false });
  }, []);

  const createUser = useCallback(async (
    username: string,
    password: string,
    displayName?: string,
    email?: string,
  ): Promise<boolean> => {
    try {
      await authApi.register(username, password, displayName, email);
      return true;
    } catch {
      return false;
    }
  }, []);

  const createChat = useCallback(async (
    name: string,
    isGroup: boolean,
    participantIds: string[],
  ): Promise<string | null> => {
    const userId = auth.user?.id;
    if (!userId) return null;
    try {
      const res = await chatsApi.create(name, isGroup, userId, participantIds);
      return res.id;
    } catch {
      return null;
    }
  }, [auth.user?.id]);

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
