export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  avatarType?: 'emoji' | 'image';
  isAdmin?: boolean;
  isOnboarded?: boolean;
  isOnline?: boolean;
  lastSeen?: number;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  image?: string;
  timestamp: Date;
  isRead: boolean;
}

export interface Chat {
  id: string;
  name: string;
  avatar?: string;
  lastMessage?: string;
  lastMessageTime?: Date;
  unreadCount: number;
  participants: string[];
  isGroup: boolean;
  isOnline?: boolean;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
