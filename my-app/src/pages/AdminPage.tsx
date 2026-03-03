import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
  Users,
  MessageSquare,
  Settings,
  ArrowLeft,
  Search,
  Shield,
  UserCheck,
  Trash2,
  Ban,
  Activity
} from 'lucide-react';
import './AdminPage.css';

interface User {
  id: string;
  username: string;
  email: string;
  status: 'active' | 'banned' | 'pending';
  joinedAt: Date;
  messagesCount: number;
}

interface Chat {
  id: string;
  name: string;
  type: 'private' | 'group';
  membersCount: number;
  messagesCount: number;
  createdAt: Date;
}

export function AdminPage() {
  const navigate = useNavigate();
  const { auth, logout } = useApp();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'chats' | 'settings'>('overview');
  const [searchQuery, setSearchQuery] = useState('');

  // Mock данные
  const users: User[] = [
    { id: '1', username: 'Павел Дуров', email: 'pavel@doppigram.com', status: 'active', joinedAt: new Date('2026-01-15'), messagesCount: 1542 },
    { id: '2', username: 'Мария Иванова', email: 'maria@example.com', status: 'active', joinedAt: new Date('2026-02-01'), messagesCount: 892 },
    { id: '3', username: 'Алексей Петров', email: 'alex@example.com', status: 'banned', joinedAt: new Date('2026-01-20'), messagesCount: 234 },
    { id: '4', username: 'Елена Смирнова', email: 'elena@example.com', status: 'active', joinedAt: new Date('2026-02-10'), messagesCount: 567 },
    { id: '5', username: 'Дмитрий Козлов', email: 'dmitry@example.com', status: 'pending', joinedAt: new Date('2026-03-01'), messagesCount: 45 },
  ];

  const chats: Chat[] = [
    { id: '1', name: 'Павел Дуров', type: 'private', membersCount: 2, messagesCount: 156, createdAt: new Date('2026-01-15') },
    { id: '2', name: 'Команда разработки', type: 'group', membersCount: 12, messagesCount: 2341, createdAt: new Date('2026-01-10') },
    { id: '3', name: 'Мария Иванова', type: 'private', membersCount: 2, messagesCount: 89, createdAt: new Date('2026-02-01') },
    { id: '4', name: 'Общий чат', type: 'group', membersCount: 45, messagesCount: 5678, createdAt: new Date('2026-01-05') },
  ];

  const stats = {
    totalUsers: 1247,
    activeUsers: 1189,
    totalChats: 523,
    totalMessages: 45892,
    onlineUsers: 342,
  };

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: User['status']) => {
    const badges = {
      active: <span className="status-badge active">Активен</span>,
      banned: <span className="status-badge banned">Заблокирован</span>,
      pending: <span className="status-badge pending">Ожидание</span>,
    };
    return badges[status];
  };

  if (!auth.user?.isAdmin) {
    return (
      <div className="admin-page">
        <div className="access-denied">
          <Shield size={64} />
          <h2>Доступ запрещён</h2>
          <p>У вас нет прав администратора</p>
          <button onClick={() => navigate('/chats')}>Вернуться к чатам</button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-sidebar">
        <div className="sidebar-header">
          <button className="back-button" onClick={() => navigate('/chats')}>
            <ArrowLeft size={24} />
          </button>
          <h1>Админ-панель</h1>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <Activity size={20} />
            <span>Обзор</span>
          </button>
          <button
            className={`nav-item ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <Users size={20} />
            <span>Пользователи</span>
          </button>
          <button
            className={`nav-item ${activeTab === 'chats' ? 'active' : ''}`}
            onClick={() => setActiveTab('chats')}
          >
            <MessageSquare size={20} />
            <span>Чаты</span>
          </button>
          <button
            className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <Settings size={20} />
            <span>Настройки</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <button className="logout-button" onClick={logout}>
            <ArrowLeft size={20} />
            <span>Выйти</span>
          </button>
        </div>
      </div>

      <div className="admin-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <h2>Обзор системы</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon users">
                  <Users size={24} />
                </div>
                <div className="stat-info">
                  <span className="stat-value">{stats.totalUsers}</span>
                  <span className="stat-label">Всего пользователей</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon online">
                  <UserCheck size={24} />
                </div>
                <div className="stat-info">
                  <span className="stat-value">{stats.onlineUsers}</span>
                  <span className="stat-label">Онлайн</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon chats">
                  <MessageSquare size={24} />
                </div>
                <div className="stat-info">
                  <span className="stat-value">{stats.totalChats}</span>
                  <span className="stat-label">Всего чатов</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon messages">
                  <Activity size={24} />
                </div>
                <div className="stat-info">
                  <span className="stat-value">{stats.totalMessages.toLocaleString()}</span>
                  <span className="stat-label">Сообщений</span>
                </div>
              </div>
            </div>

            <div className="recent-activity">
              <h3>Последняя активность</h3>
              <div className="activity-list">
                {users.slice(0, 3).map(user => (
                  <div key={user.id} className="activity-item">
                    <div className="activity-avatar">{user.username[0]}</div>
                    <div className="activity-info">
                      <span className="activity-name">{user.username}</span>
                      <span className="activity-action">{user.messagesCount} сообщений</span>
                    </div>
                    <span className="activity-time">Сейчас</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="users-tab">
            <div className="tab-header">
              <h2>Пользователи</h2>
              <div className="search-container">
                <Search size={20} className="search-icon" />
                <input
                  type="text"
                  placeholder="Поиск пользователей"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
              </div>
            </div>

            <div className="users-table">
              <table>
                <thead>
                  <tr>
                    <th>Пользователь</th>
                    <th>Email</th>
                    <th>Статус</th>
                    <th>Сообщений</th>
                    <th>Дата регистрации</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(user => (
                    <tr key={user.id}>
                      <td>
                        <div className="user-cell">
                          <div className="user-avatar-small">{user.username[0]}</div>
                          <span>{user.username}</span>
                        </div>
                      </td>
                      <td>{user.email}</td>
                      <td>{getStatusBadge(user.status)}</td>
                      <td>{user.messagesCount}</td>
                      <td>{user.joinedAt.toLocaleDateString('ru-RU')}</td>
                      <td>
                        <div className="action-buttons">
                          {user.status !== 'banned' ? (
                            <button className="action-btn ban" title="Заблокировать">
                              <Ban size={18} />
                            </button>
                          ) : (
                            <button className="action-btn unban" title="Разблокировать">
                              <UserCheck size={18} />
                            </button>
                          )}
                          <button className="action-btn delete" title="Удалить">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'chats' && (
          <div className="chats-tab">
            <h2>Чаты</h2>
            <div className="chats-list-admin">
              {chats.map(chat => (
                <div key={chat.id} className="chat-card">
                  <div className="chat-card-header">
                    <div className="chat-card-info">
                      <span className="chat-card-name">{chat.name}</span>
                      <span className="chat-card-type">{chat.type === 'group' ? 'Групповой' : 'Личный'}</span>
                    </div>
                    <button className="action-btn delete">
                      <Trash2 size={18} />
                    </button>
                  </div>
                  <div className="chat-card-stats">
                    <span>{chat.membersCount} участников</span>
                    <span>{chat.messagesCount} сообщений</span>
                    <span>{chat.createdAt.toLocaleDateString('ru-RU')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="settings-tab">
            <h2>Настройки системы</h2>
            <div className="settings-sections">
              <div className="settings-section">
                <h3>Общие настройки</h3>
                <div className="setting-item">
                  <div className="setting-info">
                    <span className="setting-label">Регистрация новых пользователей</span>
                    <span className="setting-description">Разрешить новым пользователям регистрироваться</span>
                  </div>
                  <label className="toggle">
                    <input type="checkbox" defaultChecked />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
                <div className="setting-item">
                  <div className="setting-info">
                    <span className="setting-label">Модерация сообщений</span>
                    <span className="setting-description">Автоматическая проверка сообщений</span>
                  </div>
                  <label className="toggle">
                    <input type="checkbox" />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>

              <div className="settings-section">
                <h3>Безопасность</h3>
                <div className="setting-item">
                  <div className="setting-info">
                    <span className="setting-label">Двухфакторная аутентификация</span>
                    <span className="setting-description">Требовать 2FA для всех пользователей</span>
                  </div>
                  <label className="toggle">
                    <input type="checkbox" />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
                <div className="setting-item">
                  <div className="setting-info">
                    <span className="setting-label">Аудит действий</span>
                    <span className="setting-description">Вести журнал всех действий администраторов</span>
                  </div>
                  <label className="toggle">
                    <input type="checkbox" defaultChecked />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
