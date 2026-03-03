import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import type { Chat as ChatType } from '../types';
import { Search, MessageCircle, Settings, LogOut, Users, PenSquare } from 'lucide-react';
import './ChatListPage.css';

export function ChatListPage() {
  const { chats, auth, logout, setCurrentChat } = useApp();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredChats = chats.filter((chat) =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleChatClick = (chat: ChatType) => {
    setCurrentChat(chat);
    navigate(`/chat/${chat.id}`);
  };

  const formatTime = (date?: Date) => {
    if (!date) return '';
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (hours < 1) {
      const minutes = Math.floor(diff / 60000);
      return `${minutes}м`;
    } else if (hours < 24) {
      return `${hours}ч`;
    } else if (days < 7) {
      return `${days}д`;
    } else {
      return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
    }
  };

  return (
    <div className="chat-list-page">
      <div className="sidebar">
        <div className="sidebar-header">
          <div className="user-info">
            <div className="user-avatar">
              {auth.user?.avatar || '👤'}
            </div>
            <div className="user-details">
              <span className="user-name">{auth.user?.username}</span>
              <span className="user-status">online</span>
            </div>
          </div>
          <div className="header-actions">
            <button
              className="icon-button"
              onClick={() => navigate('/admin')}
              title="Админ-панель"
            >
              <Settings size={20} />
            </button>
            <button
              className="icon-button"
              onClick={logout}
              title="Выйти"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>

        <div className="search-container">
          <Search size={20} className="search-icon" />
          <input
            type="text"
            placeholder="Поиск"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="chats-list">
          {filteredChats.map((chat) => (
            <div
              key={chat.id}
              className="chat-item"
              onClick={() => handleChatClick(chat)}
            >
              <div className="chat-avatar">
                {chat.avatar || (chat.isGroup ? <Users size={24} /> : <MessageCircle size={24} />)}
              </div>
              <div className="chat-info">
                <div className="chat-header">
                  <span className="chat-name">{chat.name}</span>
                  <span className="chat-time">
                    {formatTime(chat.lastMessageTime)}
                  </span>
                </div>
                <div className="chat-footer">
                  <span className="chat-last-message">
                    {chat.lastMessage || 'Нет сообщений'}
                  </span>
                  {chat.unreadCount > 0 && (
                    <span className="unread-badge">
                      {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <button className="new-chat-button">
          <PenSquare size={20} />
          <span>Новый чат</span>
        </button>
      </div>
    </div>
  );
}
