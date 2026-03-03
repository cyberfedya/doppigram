import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import type { Message as MessageType } from '../types';
import { ArrowLeft, Send, Smile, Paperclip, Check, CheckCheck } from 'lucide-react';

export function ChatPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { messages, sendMessage, currentChat, markAsRead } = useApp();
  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const chatMessages = id ? (messages[id] || []) : [];

  useEffect(() => {
    if (id) {
      markAsRead(id);
    }
  }, [id]);

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = () => {
    if (messageText.trim() && id) {
      sendMessage(id, messageText.trim());
      setMessageText('');
      if (inputRef.current) {
        inputRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessageText(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / 86400000);

    if (days === 0) return 'Сегодня';
    if (days === 1) return 'Вчера';
    if (days < 7) return `${days} дн. назад`;
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
  };

  const MessageStatus = ({ message }: { message: MessageType }) => {
    if (message.senderId !== 'me') return null;
    return message.isRead ? (
      <CheckCheck size={16} className="message-status read" />
    ) : (
      <Check size={16} className="message-status" />
    );
  };

  if (!currentChat && id) {
    return (
      <div className="chat-page">
        <div className="chat-header">
          <button className="back-button" onClick={() => navigate('/chats')}>
            <ArrowLeft size={24} />
          </button>
          <div className="chat-title">Загрузка...</div>
        </div>
      </div>
    );
  }

  const chat = currentChat || { name: 'Чат', avatar: '💬' };

  return (
    <div className="chat-page">
      <div className="chat-header">
        <div className="header-left">
          <button className="back-button" onClick={() => navigate('/chats')}>
            <ArrowLeft size={24} />
          </button>
          <div className="chat-avatar-small">
            {chat.avatar || '💬'}
          </div>
          <div className="chat-info-header">
            <span className="chat-name-header">{chat.name}</span>
            <span className="chat-status">online</span>
          </div>
        </div>
        <div className="header-actions">
          <button className="icon-button-header">
            <Smile size={22} />
          </button>
        </div>
      </div>

      <div className="messages-container">
        {chatMessages.length === 0 ? (
          <div className="empty-chat">
            <div className="empty-chat-icon">💬</div>
            <p>Здесь пока нет сообщений</p>
            <p className="empty-hint">Напишите первое сообщение!</p>
          </div>
        ) : (
          <>
            {chatMessages.map((message, index) => {
              const isMe = message.senderId === 'me';
              const showDate =
                index === 0 ||
                new Date(message.timestamp).toDateString() !==
                new Date(chatMessages[index - 1].timestamp).toDateString();

              return (
                <div key={message.id}>
                  {showDate && (
                    <div className="date-divider">
                      <span>{formatDate(message.timestamp)}</span>
                    </div>
                  )}
                  <div className={`message ${isMe ? 'message-out' : 'message-in'}`}>
                    <div className="message-content">
                      <p className="message-text">{message.text}</p>
                      <div className="message-meta">
                        <span className="message-time">{formatTime(message.timestamp)}</span>
                        <MessageStatus message={message} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <div className="message-input-container">
        <button className="attach-button">
          <Paperclip size={22} />
        </button>
        <div className="message-input-wrapper">
          <textarea
            ref={inputRef}
            placeholder="Написать сообщение..."
            value={messageText}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            rows={1}
            className="message-input"
          />
        </div>
        <button
          className={`send-button ${messageText.trim() ? 'active' : ''}`}
          onClick={handleSend}
          disabled={!messageText.trim()}
        >
          <Send size={22} />
        </button>
      </div>
    </div>
  );
}
