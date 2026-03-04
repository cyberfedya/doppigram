import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useMutation } from 'convex/react';
import type { AuthState, User } from '../types';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';

interface AppContextType {
  auth: AuthState;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  createUser: (username: string, password: string, displayName?: string, email?: string) => Promise<boolean>;
  createChat: (name: string, isGroup: boolean, participantIds: Id<'users'>[]) => Promise<string | null>;
  isLoading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState>({ user: null, isAuthenticated: false, isLoading: true });
  const [localLoading, setLocalLoading] = useState(true);

  const loginMutation = useMutation(api.users.loginUser);
  const createUserMutation = useMutation(api.users.createUser);
  const createChatMutation = useMutation(api.users.createChat);
  const setUserOnlineMutation = useMutation(api.users.setUserOnline);

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

  // Online/offline tracking with heartbeat
  useEffect(() => {
    if (!auth.user?.id) return;
    const uid = auth.user.id as Id<'users'>;

    // Set online on mount / login
    setUserOnlineMutation({ userId: uid, isOnline: true }).catch(() => {});

    // Heartbeat: keep lastSeen fresh every 30s so stale users can be detected
    const heartbeat = setInterval(() => {
      setUserOnlineMutation({ userId: uid, isOnline: true }).catch(() => {});
    }, 30_000);

    // Visibility change: offline when tab hidden, online when visible
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        setUserOnlineMutation({ userId: uid, isOnline: false }).catch(() => {});
      } else {
        setUserOnlineMutation({ userId: uid, isOnline: true }).catch(() => {});
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    // Best-effort offline on tab close
    const handleUnload = () => {
      setUserOnlineMutation({ userId: uid, isOnline: false }).catch(() => {});
    };
    window.addEventListener('beforeunload', handleUnload);

    return () => {
      clearInterval(heartbeat);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('beforeunload', handleUnload);
      setUserOnlineMutation({ userId: uid, isOnline: false }).catch(() => {});
    };
  }, [auth.user?.id, setUserOnlineMutation]);

  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    try {
      const user = await loginMutation({ username, password });
      if (user) {
        const userData: User = {
          id: user._id,
          username: user.username,
          displayName: user.displayName,
          email: user.email,
          avatar: user.avatar,
          avatarType: user.avatarType,
          isAdmin: user.isAdmin,
          isVerified: user.isVerified ?? false,
          isOnboarded: true,
          isOnline: true,
          lastSeen: user.lastSeen,
        };
        localStorage.setItem('doppigram_session', JSON.stringify(userData));
        setAuth({ user: userData, isAuthenticated: true, isLoading: false });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  }, [loginMutation]);

  const logout = useCallback(() => {
    if (auth.user?.id) {
      setUserOnlineMutation({ userId: auth.user.id as Id<'users'>, isOnline: false }).catch(() => {});
    }
    localStorage.removeItem('doppigram_session');
    setAuth({ user: null, isAuthenticated: false, isLoading: false });
  }, [auth.user?.id, setUserOnlineMutation]);

  const createUser = useCallback(async (username: string, password: string, displayName?: string, email?: string): Promise<boolean> => {
    try {
      const userId = await createUserMutation({
        uid: 'user_' + Date.now() + '_' + username,
        username: username.toLowerCase().trim(),
        displayName,
        email: email ?? `${username}@doppigram.app`,
        password,
        isAdmin: false,
      });
      return !!userId;
    } catch (error) {
      console.error('Create user error:', error);
      throw error;
    }
  }, [createUserMutation]);

  const createChat = useCallback(async (name: string, isGroup: boolean, participantIds: Id<'users'>[]): Promise<string | null> => {
    if (!auth.user) return null;
    try {
      const chatId = await createChatMutation({
        name,
        isGroup,
        createdBy: auth.user.id as Id<'users'>,
        participantIds,
      });
      return chatId as string;
    } catch (error) {
      console.error('Create chat error:', error);
      return null;
    }
  }, [auth.user, createChatMutation]);

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
