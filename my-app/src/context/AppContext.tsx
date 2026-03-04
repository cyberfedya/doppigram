import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useMutation, useConvex } from 'convex/react';
import type { Chat, Message, AuthState, User } from '../types';
import { api as generatedApi } from '../../convex/_generated/api';

const api = generatedApi as any;

interface AppContextType {
  auth: AuthState;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  createUser: (username: string, password: string) => Promise<boolean>;
  chats: Chat[];
  messages: Record<string, Message[]>;
  sendMessage: (chatId: string, text: string, image?: string) => void;
  markAsRead: (chatId: string) => void;
  currentChat: Chat | null;
  setCurrentChat: (chat: Chat | null) => void;
  createChat: (name: string, isGroup: boolean, participantIds: string[]) => Promise<void>;
  uploadFile: (file: File) => Promise<string>;
  isLoading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const convex = useConvex();
  const [auth, setAuth] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [localLoading, setLocalLoading] = useState(true);

  // Мутации
  const createUserMutation = useMutation(api?.users.createUser);
  const createChatMutation = useMutation(api?.users.createChat);
  const sendMessageMutation = useMutation(api?.users.sendMessage);
  const markMessagesAsReadMutation = useMutation(api?.users.markMessagesAsRead);
  const generateUploadUrlMutation = useMutation(api?.files.generateUploadUrl);

  // Проверка сохранённой сессии при загрузке
  useEffect(() => {
    const checkSession = async () => {
      const stored = localStorage.getItem('doppigram_session');
      if (stored) {
        try {
          const userData = JSON.parse(stored);
          setAuth({
            user: userData,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (e) {
          localStorage.removeItem('doppigram_session');
          setAuth({ user: null, isAuthenticated: false, isLoading: false });
        }
      } else {
        setAuth({ user: null, isAuthenticated: false, isLoading: false });
      }
      setLocalLoading(false);
    };
    checkSession();
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      // Пробуем через Convex
      try {
        const user = await convex.query(api.users.loginUser, { username, password });
        if (user) {
          const userData: User = {
            id: user._id,
            username: user.username,
            email: user.email,
            avatar: user.avatar,
            avatarType: user.avatarType,
            isAdmin: user.isAdmin,
            isOnboarded: true,
          };
          localStorage.setItem('doppigram_session', JSON.stringify(userData));
          setAuth({
            user: userData,
            isAuthenticated: true,
            isLoading: false,
          });
          return true;
        }
      } catch (convexError) {
        console.error('Convex login error:', convexError);
      }
      
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = async () => {
    localStorage.removeItem('doppigram_session');
    setAuth({ user: null, isAuthenticated: false, isLoading: false });
    setChats([]);
    setMessages({});
    setCurrentChat(null);
  };

  const createUser = async (username: string, password: string): Promise<boolean> => {
    try {
      const userId = await createUserMutation({
        uid: 'user_' + username,
        username,
        email: `${username}@example.com`,
        password,
        avatar: '👤',
        avatarType: 'emoji',
        isAdmin: false,
      });
      return !!userId;
    } catch (error) {
      console.error('Create user error:', error);
      return false;
    }
  };

  const sendMessage = (chatId: string, text: string, image?: string) => {
    if (!auth.user) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      chatId,
      senderId: auth.user.id,
      text,
      image,
      timestamp: new Date(),
      isRead: true,
    };
    setMessages(prev => ({
      ...prev,
      [chatId]: [...(prev[chatId] || []), newMessage],
    }));

    if (sendMessageMutation && auth.user) {
      sendMessageMutation({
        chatId,
        senderId: auth.user.id as any,
        text,
        image,
      }).catch(err => console.warn('Convex sendMessage error:', err));
    }
  };

  const markAsRead = (chatId: string) => {
    setMessages(prev => ({
      ...prev,
      [chatId]: prev[chatId]?.map(msg => ({ ...msg, isRead: true })) || [],
    }));

    if (markMessagesAsReadMutation && auth.user) {
      markMessagesAsReadMutation({
        chatId,
        userId: auth.user.id as any,
      }).catch(err => console.warn('Convex markAsRead error:', err));
    }
  };

  const createChat = async (name: string, isGroup: boolean, participantIds: string[]) => {
    if (!auth.user || !createChatMutation) return;

    try {
      const chatId = await createChatMutation({
        name,
        isGroup,
        createdBy: auth.user.id as any,
        participantIds: participantIds as any[],
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
      return 'demo_file_' + Date.now();
    }

    try {
      const uploadUrl = await generateUploadUrlMutation();
      const result = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': file.type },
        body: file,
      });

      const { storageId } = await result.json();
      return storageId;
    } catch (error) {
      console.warn('Convex uploadFile error, using fallback:', error);
      return 'demo_file_' + Date.now();
    }
  };

  const isLoading = localLoading || auth.isLoading;

  return (
    <AppContext.Provider
      value={{
        auth,
        login,
        logout,
        createUser,
        chats,
        messages,
        sendMessage,
        markAsRead,
        currentChat,
        setCurrentChat,
        createChat,
        uploadFile,
        isLoading,
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
