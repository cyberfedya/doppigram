import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useConvex, useMutation } from 'convex/react';
import { auth as firebaseAuth, googleProvider } from '../config/firebase';
import { signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged } from 'firebase/auth';
import type { Chat, Message, AuthState } from '../types';
import { api as generatedApi } from '../convex/_generated/api';

const api = generatedApi as any;

interface AppContextType {
  auth: AuthState;
  login: (email: string, password: string) => Promise<boolean>;
  register: (username: string, email: string, password: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<boolean>;
  logout: () => void;
  completeOnboarding: (username: string, avatar: string, avatarType: 'emoji' | 'image') => Promise<boolean>;
  updateProfile: (username: string, avatar: string, avatarType: 'emoji' | 'image') => Promise<void>;
  chats: Chat[];
  messages: Record<string, Message[]>;
  sendMessage: (chatId: string, text: string, image?: string) => void;
  markAsRead: (chatId: string) => void;
  currentChat: Chat | null;
  setCurrentChat: (chat: Chat | null) => void;
  isOnboarding: boolean;
  createChat: (name: string, isGroup: boolean, participantIds: string[]) => Promise<void>;
  uploadFile: (file: File) => Promise<string>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

function generateUsername(email: string): string {
  const base = email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '_');
  return `${base}_${Math.random().toString(36).substring(2, 6)}`;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const convex = useConvex();

  const [auth, setAuth] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  const [isOnboarding, setIsOnboarding] = useState(false);
  const [pendingUser, setPendingUser] = useState<{ uid: string; email: string } | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);

  // Инициализируем мутации
  const createUserMutation = useMutation(api?.users.createUser);
  const createChatMutation = useMutation(api?.users.createChat);
  const sendMessageMutation = useMutation(api?.users.sendMessage);
  const markMessagesAsReadMutation = useMutation(api?.users.markMessagesAsRead);
  const generateUploadUrlMutation = useMutation(api?.files.generateUploadUrl);

  // Синхронизация авторизации
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (fbUser) => {
      if (fbUser) {
        try {
          // Проверяем пользователя в Convex
          const userDoc = await convex.query(api.users.getUserByUid, { uid: fbUser.uid });
          if (userDoc) {
            setAuth({
              user: {
                id: fbUser.uid,
                username: userDoc.username,
                email: userDoc.email,
                avatar: userDoc.avatar,
                avatarType: userDoc.avatarType,
                isAdmin: userDoc.isAdmin,
                isOnboarded: true,
              },
              isAuthenticated: true,
              isLoading: false,
            });
            setIsOnboarding(false);
            return;
          }
          
          // Нет документа - переходим к онбордингу
          setPendingUser({ uid: fbUser.uid, email: fbUser.email || '' });
          setAuth({
            user: {
              id: fbUser.uid,
              username: generateUsername(fbUser.email || ''),
              email: fbUser.email || '',
              avatar: fbUser.photoURL || '🧑',
              avatarType: fbUser.photoURL ? 'image' : 'emoji',
              isAdmin: false,
              isOnboarded: false,
            },
            isAuthenticated: false,
            isLoading: false,
          });
          setIsOnboarding(true);
        } catch (error) {
          console.error('Auth error:', error);
          setAuth({ user: null, isAuthenticated: false, isLoading: false });
        }
      } else {
        setAuth({ user: null, isAuthenticated: false, isLoading: false });
        setIsOnboarding(false);
        setPendingUser(null);
      }
    });

    return () => unsubscribe();
  }, [convex]);

  const login = async (_email: string, password: string): Promise<boolean> => {
    if (_email && password.length >= 6) {
      setAuth({
        user: {
          id: 'demo_' + Date.now(),
          username: _email.split('@')[0],
          email: _email,
          avatar: '🧑',
          avatarType: 'emoji',
          isAdmin: _email.includes('admin'),
          isOnboarded: true,
        },
        isAuthenticated: true,
        isLoading: false,
      });
      return true;
    }
    return false;
  };

  const register = async (_username: string, email: string, password: string): Promise<boolean> => {
    return login(email, password);
  };

  const loginWithGoogle = async (): Promise<boolean> => {
    try {
      await signInWithPopup(firebaseAuth, googleProvider);
      return true;
    } catch (e) {
      console.error('Google login error:', e);
      return false;
    }
  };

  const logout = async () => {
    try {
      await firebaseSignOut(firebaseAuth);
    } catch (e) {
      console.error('Logout error:', e);
    }
    setAuth({ user: null, isAuthenticated: false, isLoading: false });
    setChats([]);
    setMessages({});
    setCurrentChat(null);
    setIsOnboarding(false);
    setPendingUser(null);
  };

  const completeOnboarding = async (
    username: string,
    avatar: string,
    avatarType: 'emoji' | 'image'
  ): Promise<boolean> => {
    if (!pendingUser) return false;

    try {
      // Если Convex подключён - используем его
      if (createUserMutation) {
        await createUserMutation({
          uid: pendingUser.uid,
          username,
          email: pendingUser.email,
          avatar,
          avatarType,
        });
      } else {
        // Fallback: сохраняем в localStorage для демо-режима
        const userData = {
          uid: pendingUser.uid,
          username,
          email: pendingUser.email,
          avatar,
          avatarType,
          isAdmin: false,
          isOnboarded: true,
        };
        localStorage.setItem('doppigram_user_' + pendingUser.uid, JSON.stringify(userData));
      }

      setAuth({
        user: {
          id: pendingUser.uid,
          username,
          email: pendingUser.email,
          avatar,
          avatarType,
          isAdmin: false,
          isOnboarded: true,
        },
        isAuthenticated: true,
        isLoading: false,
      });
      setIsOnboarding(false);
      setPendingUser(null);
      return true;
    } catch (error) {
      console.error('Onboarding error:', error);
      return false;
    }
  };

  const updateProfile = async (
    username: string,
    avatar: string,
    avatarType: 'emoji' | 'image'
  ) => {
    if (!auth.user) return;

    try {
      // Если Convex подключён - обновляем там
      if (api.users.updateUser) {
        const userDoc = await convex.query(api.users.getUserByUid, { uid: auth.user.id });
        if (userDoc) {
          const updateUserMutation = useMutation(api.users.updateUser);
          await updateUserMutation({
            userId: userDoc._id,
            username,
            avatar,
            avatarType,
          });
        }
      }
      
      // Обновляем локальное состояние
      setAuth(prev => ({
        ...prev,
        user: prev.user ? { ...prev.user, username, avatar, avatarType } : null,
      }));
    } catch (error) {
      console.error('Update profile error:', error);
    }
  };

  const sendMessage = (chatId: string, text: string, image?: string) => {
    if (!auth.user) return;

    // Оптимистичное обновление
    const newMessage: Message = {
      id: Date.now().toString(),
      chatId,
      senderId: 'me',
      text,
      image,
      timestamp: new Date(),
      isRead: true,
    };
    setMessages(prev => ({
      ...prev,
      [chatId]: [...(prev[chatId] || []), newMessage],
    }));

    // Отправка в Convex
    if (sendMessageMutation) {
      convex.query(api.users.getUserByUid, { uid: auth.user.id })
        .then(userDoc => {
          if (userDoc) {
            sendMessageMutation({
              chatId,
              senderId: userDoc._id,
              text,
              image,
            });
          }
        })
        .catch(console.error);
    }
  };

  const markAsRead = (chatId: string) => {
    // Оптимистичное обновление
    setMessages(prev => ({
      ...prev,
      [chatId]: prev[chatId]?.map(msg => ({ ...msg, isRead: true })) || [],
    }));

    // Отправка в Convex
    if (markMessagesAsReadMutation && auth.user) {
      convex.query(api.users.getUserByUid, { uid: auth.user.id })
        .then(userDoc => {
          if (userDoc) {
            markMessagesAsReadMutation({
              chatId,
              userId: userDoc._id,
            });
          }
        })
        .catch(console.error);
    }
  };

  const createChat = async (name: string, isGroup: boolean, participantIds: string[]) => {
    if (!auth.user || !createChatMutation) return;

    try {
      const userDoc = await convex.query(api.users.getUserByUid, { uid: auth.user.id });
      if (!userDoc) return;

      const chatId = await createChatMutation({
        name,
        isGroup,
        createdBy: userDoc._id,
        participantIds,
      });

      const newChat: Chat = {
        id: chatId,
        name,
        isGroup,
        participants: participantIds,
        unreadCount: 0,
      };
      setChats(prev => [...prev, newChat]);
    } catch (error) {
      console.error('Create chat error:', error);
    }
  };

  const uploadFile = async (file: File): Promise<string> => {
    if (!generateUploadUrlMutation) {
      throw new Error('Upload not available');
    }

    const uploadUrl = await generateUploadUrlMutation();
    const result = await fetch(uploadUrl, {
      method: 'POST',
      headers: { 'Content-Type': file.type },
      body: file,
    });

    const { storageId } = await result.json();
    return storageId;
  };

  return (
    <AppContext.Provider
      value={{
        auth,
        login,
        register,
        loginWithGoogle,
        logout,
        completeOnboarding,
        updateProfile,
        chats,
        messages,
        sendMessage,
        markAsRead,
        currentChat,
        setCurrentChat,
        isOnboarding,
        createChat,
        uploadFile,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
