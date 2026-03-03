import { createContext, useContext, useState, type ReactNode } from 'react';
import type { User, Chat, Message, AuthState } from '../types';
import { auth as firebaseAuth, googleProvider } from '../config/firebase';
import { signInWithPopup, signOut as firebaseSignOut } from 'firebase/auth';

interface AppContextType {
  auth: AuthState;
  login: (email: string, password: string) => Promise<boolean>;
  register: (username: string, email: string, password: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<boolean>;
  logout: () => void;
  chats: Chat[];
  messages: Record<string, Message[]>;
  sendMessage: (chatId: string, text: string) => void;
  markAsRead: (chatId: string) => void;
  currentChat: Chat | null;
  setCurrentChat: (chat: Chat | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Mock данные для демонстрации
const mockChats: Chat[] = [
  {
    id: '1',
    name: 'Павел Дуров',
    avatar: '👤',
    lastMessage: 'Привет! Как тебе новый мессенджер?',
    lastMessageTime: new Date(),
    unreadCount: 2,
    participants: ['1'],
    isGroup: false,
  },
  {
    id: '2',
    name: 'Команда разработки',
    avatar: '👥',
    lastMessage: 'Нужно закончить фичу до пятницы',
    lastMessageTime: new Date(Date.now() - 3600000),
    unreadCount: 0,
    participants: ['1', '2', '3'],
    isGroup: true,
  },
  {
    id: '3',
    name: 'Мария Иванова',
    avatar: '👩',
    lastMessage: 'Спасибо за информацию!',
    lastMessageTime: new Date(Date.now() - 7200000),
    unreadCount: 0,
    participants: ['3'],
    isGroup: false,
  },
];

const mockMessages: Record<string, Message[]> = {
  '1': [
    {
      id: '1',
      chatId: '1',
      senderId: 'other',
      text: 'Привет! Добро пожаловать в Doppigram!',
      timestamp: new Date(Date.now() - 86400000),
      isRead: true,
    },
    {
      id: '2',
      chatId: '1',
      senderId: 'other',
      text: 'Это новый мессенджер в стиле Twitter',
      timestamp: new Date(Date.now() - 86300000),
      isRead: true,
    },
    {
      id: '3',
      chatId: '1',
      senderId: 'other',
      text: 'Привет! Как тебе новый мессенджер?',
      timestamp: new Date(),
      isRead: false,
    },
  ],
  '2': [
    {
      id: '4',
      chatId: '2',
      senderId: 'other',
      text: 'Коллеги, напоминаю о дедлайне',
      timestamp: new Date(Date.now() - 7200000),
      isRead: true,
    },
    {
      id: '5',
      chatId: '2',
      senderId: 'me',
      text: 'Всё будет готово вовремя',
      timestamp: new Date(Date.now() - 3600000),
      isRead: true,
    },
  ],
  '3': [],
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: false,
  });

  const [chats] = useState<Chat[]>(mockChats);
  const [messages, setMessages] = useState<Record<string, Message[]>>(mockMessages);
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);

  const login = async (email: string, password: string): Promise<boolean> => {
    setAuth({ ...auth, isLoading: true });
    
    // Имитация задержки сети
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Простая проверка для демонстрации
    if (email && password.length >= 6) {
      const user: User = {
        id: 'me',
        username: email.split('@')[0],
        email,
        avatar: '🧑',
        isAdmin: email.includes('admin'),
      };
      setAuth({
        user,
        isAuthenticated: true,
        isLoading: false,
      });
      return true;
    }
    
    setAuth({ ...auth, isLoading: false });
    return false;
  };

  const register = async (_username: string, email: string, password: string): Promise<boolean> => {
    return login(email, password);
  };

  const loginWithGoogle = async (): Promise<boolean> => {
    try {
      const result = await signInWithPopup(firebaseAuth, googleProvider);
      const user = result.user;
      
      setAuth({
        user: {
          id: user.uid,
          username: user.displayName || user.email?.split('@')[0] || 'User',
          email: user.email || '',
          avatar: user.photoURL || undefined,
          isAdmin: user.email?.includes('admin'),
        },
        isAuthenticated: true,
        isLoading: false,
      });
      return true;
    } catch (error) {
      console.error('Google login error:', error);
      setAuth(prev => ({ ...prev, isLoading: false }));
      return false;
    }
  };

  const logout = () => {
    firebaseSignOut(firebaseAuth);
    setAuth({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
    setCurrentChat(null);
  };

  const sendMessage = (chatId: string, text: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      chatId,
      senderId: 'me',
      text,
      timestamp: new Date(),
      isRead: true,
    };

    setMessages(prev => ({
      ...prev,
      [chatId]: [...(prev[chatId] || []), newMessage],
    }));
  };

  const markAsRead = (chatId: string) => {
    setMessages(prev => ({
      ...prev,
      [chatId]: prev[chatId]?.map(msg => ({ ...msg, isRead: true })) || [],
    }));
  };

  return (
    <AppContext.Provider
      value={{
        auth,
        login,
        register,
        loginWithGoogle,
        logout,
        chats,
        messages,
        sendMessage,
        markAsRead,
        currentChat,
        setCurrentChat,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
