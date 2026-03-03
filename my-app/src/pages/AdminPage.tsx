import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
  Users, MessageSquare, Settings, ArrowLeft,
  Search, Shield, UserCheck, Trash2, Ban, Activity
} from 'lucide-react';

interface AdminUser {
  id: string; username: string; email: string;
  status: 'active' | 'banned' | 'pending';
  joinedAt: Date; messagesCount: number;
}
interface AdminChat {
  id: string; name: string; type: 'private' | 'group';
  membersCount: number; messagesCount: number; createdAt: Date;
}

const mockUsers: AdminUser[] = [
  { id: '1', username: 'Павел Дуров', email: 'pavel@doppigram.com', status: 'active', joinedAt: new Date('2026-01-15'), messagesCount: 1542 },
  { id: '2', username: 'Мария Иванова', email: 'maria@example.com', status: 'active', joinedAt: new Date('2026-02-01'), messagesCount: 892 },
  { id: '3', username: 'Алексей Петров', email: 'alex@example.com', status: 'banned', joinedAt: new Date('2026-01-20'), messagesCount: 234 },
  { id: '4', username: 'Елена Смирнова', email: 'elena@example.com', status: 'active', joinedAt: new Date('2026-02-10'), messagesCount: 567 },
  { id: '5', username: 'Дмитрий Козлов', email: 'dmitry@example.com', status: 'pending', joinedAt: new Date('2026-03-01'), messagesCount: 45 },
];
const mockChats: AdminChat[] = [
  { id: '1', name: 'Павел Дуров', type: 'private', membersCount: 2, messagesCount: 156, createdAt: new Date('2026-01-15') },
  { id: '2', name: 'Команда разработки', type: 'group', membersCount: 12, messagesCount: 2341, createdAt: new Date('2026-01-10') },
  { id: '3', name: 'Мария Иванова', type: 'private', membersCount: 2, messagesCount: 89, createdAt: new Date('2026-02-01') },
  { id: '4', name: 'Общий чат', type: 'group', membersCount: 45, messagesCount: 5678, createdAt: new Date('2026-01-05') },
];
const stats = { totalUsers: 1247, activeUsers: 1189, totalChats: 523, totalMessages: 45892, onlineUsers: 342 };

const statusStyle: Record<AdminUser['status'], string> = {
  active: 'bg-[rgba(61,184,122,0.12)] text-[#3db87a] border border-[rgba(61,184,122,0.25)]',
  banned: 'bg-[rgba(224,82,82,0.12)] text-[#e05252] border border-[rgba(224,82,82,0.25)]',
  pending: 'bg-[rgba(250,189,47,0.12)] text-[#fabd2f] border border-[rgba(250,189,47,0.25)]',
};
const statusLabel: Record<AdminUser['status'], string> = { active: 'Активен', banned: 'Заблокирован', pending: 'Ожидание' };

export function AdminPage() {
  const navigate = useNavigate();
  const { auth, logout } = useApp();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'chats' | 'settings'>('overview');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredUsers = mockUsers.filter(u =>
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const navItem = (tab: typeof activeTab, icon: React.ReactNode, label: string) => (
    <button onClick={() => setActiveTab(tab)}
      className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150 ${activeTab === tab ? 'bg-gradient-to-r from-[#4a6cf7] to-[#3a5ce5] text-white shadow-[0_3px_12px_rgba(74,108,247,0.3)]' : 'text-[#8888b0] hover:bg-[#1a1a28] hover:text-[#e0e0f8]'}`}>
      {icon} <span>{label}</span>
    </button>
  );

  if (!auth.user?.isAdmin) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0a0a10]">
        <div className="flex flex-col items-center gap-4 text-center">
          <Shield size={64} className="text-[#38385a]" />
          <h2 className="text-xl font-bold text-[#5a5a88]">Доступ запрещён</h2>
          <p className="text-sm text-[#38385a]">У вас нет прав администратора</p>
          <button onClick={() => navigate('/chats')}
            className="mt-2 px-5 py-2.5 rounded-xl bg-gradient-to-br from-[#4a6cf7] to-[#3a5ce5] text-white text-sm font-semibold shadow-[0_4px_14px_rgba(74,108,247,0.35)] hover:-translate-y-px transition-transform">
            Вернуться к чатам
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0a0a10] p-3 gap-2.5">

      {/* ── Sidebar ── */}
      <aside className="w-[220px] min-w-[200px] bg-[#13131c] border border-[#1e1e2c] rounded-[20px] flex flex-col overflow-hidden flex-shrink-0">
        <div className="flex items-center gap-3 px-4 py-4 border-b border-[#1e1e2c] flex-shrink-0">
          <button onClick={() => navigate('/chats')} className="w-8 h-8 rounded-full bg-[#1a1a2c] border border-[#28283c] text-[#6060a0] flex items-center justify-center hover:bg-[#22223a] hover:text-[#c0c0e0] transition-all flex-shrink-0">
            <ArrowLeft size={17} />
          </button>
          <h1 className="text-[15px] font-bold text-[#f0f0f8]">Админ-панель</h1>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 flex flex-col gap-1.5">
          {navItem('overview', <Activity size={18} />, 'Обзор')}
          {navItem('users', <Users size={18} />, 'Пользователи')}
          {navItem('chats', <MessageSquare size={18} />, 'Чаты')}
          {navItem('settings', <Settings size={18} />, 'Настройки')}
        </nav>
        <div className="p-3 border-t border-[#1e1e2c] flex-shrink-0">
          <button onClick={logout} className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-[#c05050] hover:bg-[rgba(192,80,80,0.1)] hover:text-[#e06060] transition-all">
            <ArrowLeft size={18} /><span>Выйти</span>
          </button>
        </div>
      </aside>

      {/* ── Content ── */}
      <main className="flex-1 bg-[#0f0f18] border border-[#1a1a28] rounded-[20px] overflow-y-auto">
        <div className="p-6">

          {/* Overview */}
          {activeTab === 'overview' && (
            <div>
              <h2 className="text-xl font-bold text-[#f0f0f8] mb-5">Обзор системы</h2>
              <div className="grid grid-cols-2 gap-3 mb-6">
                {[
                  { icon: <Users size={22} />, val: stats.totalUsers, label: 'Пользователей', color: 'from-[#4a6cf7] to-[#3a5ce5]' },
                  { icon: <UserCheck size={22} />, val: stats.onlineUsers, label: 'Онлайн', color: 'from-[#3db87a] to-[#2ea866]' },
                  { icon: <MessageSquare size={22} />, val: stats.totalChats, label: 'Чатов', color: 'from-[#6c3de5] to-[#5a2ec0]' },
                  { icon: <Activity size={22} />, val: stats.totalMessages.toLocaleString(), label: 'Сообщений', color: 'from-[#f59e0b] to-[#dc8a00]' },
                ].map(s => (
                  <div key={s.label} className="bg-[#13131c] border border-[#1e1e2c] rounded-2xl p-4 flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center text-white flex-shrink-0 shadow-lg`}>{s.icon}</div>
                    <div>
                      <div className="text-2xl font-bold text-[#f0f0f8]">{s.val}</div>
                      <div className="text-xs text-[#5a5a88] font-medium mt-0.5">{s.label}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-[#13131c] border border-[#1e1e2c] rounded-2xl p-4">
                <h3 className="text-[15px] font-bold text-[#f0f0f8] mb-3">Последняя активность</h3>
                <div className="flex flex-col gap-0">
                  {mockUsers.slice(0, 3).map((u, i) => (
                    <div key={u.id} className={`flex items-center gap-3 py-3 ${i < 2 ? 'border-b border-[#1e1e2c]' : ''}`}>
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#6c3de5] to-[#3d8ef5] flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                        {u.username[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-semibold text-[#e0e0f0] block truncate">{u.username}</span>
                        <span className="text-xs text-[#48487a]">{u.messagesCount} сообщений</span>
                      </div>
                      <span className="text-xs text-[#38385a] flex-shrink-0">Сейчас</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Users */}
          {activeTab === 'users' && (
            <div>
              <div className="flex items-center justify-between mb-5 gap-4">
                <h2 className="text-xl font-bold text-[#f0f0f8]">Пользователи</h2>
                <div className="relative">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#40405e] pointer-events-none" />
                  <input type="text" placeholder="Поиск..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                    className="bg-[#1a1a2c] border border-[#28283c] rounded-xl pl-9 pr-4 py-2.5 text-sm text-[#d0d0ec] placeholder-[#38385a] outline-none focus:border-[#4a6cf7] transition-all w-56" />
                </div>
              </div>
              <div className="bg-[#13131c] border border-[#1e1e2c] rounded-2xl overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#1e1e2c]">
                      {['Пользователь', 'Email', 'Статус', 'Сообщений', 'Регистрация', 'Действия'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-[#48487a] uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u, i) => (
                      <tr key={u.id} className={`border-b border-[#1a1a2a] hover:bg-[#18182a] transition-colors ${i === filteredUsers.length - 1 ? 'border-b-0' : ''}`}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#6c3de5] to-[#3d8ef5] flex items-center justify-center text-sm font-bold text-white flex-shrink-0">{u.username[0]}</div>
                            <span className="text-sm font-medium text-[#e0e0f0] truncate max-w-[120px]">{u.username}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-[#5a5a88]">{u.email}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${statusStyle[u.status]}`}>{statusLabel[u.status]}</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-[#8888b0]">{u.messagesCount}</td>
                        <td className="px-4 py-3 text-sm text-[#5a5a88]">{u.joinedAt.toLocaleDateString('ru-RU')}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            {u.status !== 'banned' ? (
                              <button title="Заблокировать" className="w-8 h-8 rounded-lg bg-[rgba(224,82,82,0.1)] text-[#e05252] flex items-center justify-center hover:bg-[rgba(224,82,82,0.2)] transition-colors">
                                <Ban size={15} />
                              </button>
                            ) : (
                              <button title="Разблокировать" className="w-8 h-8 rounded-lg bg-[rgba(61,184,122,0.1)] text-[#3db87a] flex items-center justify-center hover:bg-[rgba(61,184,122,0.2)] transition-colors">
                                <UserCheck size={15} />
                              </button>
                            )}
                            <button title="Удалить" className="w-8 h-8 rounded-lg bg-[rgba(224,82,82,0.1)] text-[#e05252] flex items-center justify-center hover:bg-[rgba(224,82,82,0.2)] transition-colors">
                              <Trash2 size={15} />
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

          {/* Chats */}
          {activeTab === 'chats' && (
            <div>
              <h2 className="text-xl font-bold text-[#f0f0f8] mb-5">Чаты</h2>
              <div className="grid grid-cols-2 gap-3">
                {mockChats.map(chat => (
                  <div key={chat.id} className="bg-[#13131c] border border-[#1e1e2c] rounded-2xl p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <span className="text-[15px] font-semibold text-[#e0e0f0] block mb-1">{chat.name}</span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-lg ${chat.type === 'group' ? 'bg-[rgba(108,61,229,0.12)] text-[#9870f5] border border-[rgba(108,61,229,0.2)]' : 'bg-[rgba(74,108,247,0.12)] text-[#7090f8] border border-[rgba(74,108,247,0.2)]'}`}>
                          {chat.type === 'group' ? 'Групповой' : 'Личный'}
                        </span>
                      </div>
                      <button className="w-8 h-8 rounded-lg bg-[rgba(224,82,82,0.1)] text-[#e05252] flex items-center justify-center hover:bg-[rgba(224,82,82,0.2)] transition-colors flex-shrink-0">
                        <Trash2 size={15} />
                      </button>
                    </div>
                    <div className="flex gap-4 text-xs text-[#5a5a88]">
                      <span>{chat.membersCount} участников</span>
                      <span>{chat.messagesCount} сообщений</span>
                      <span>{chat.createdAt.toLocaleDateString('ru-RU')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Settings */}
          {activeTab === 'settings' && (
            <div>
              <h2 className="text-xl font-bold text-[#f0f0f8] mb-5">Настройки системы</h2>
              {[
                {
                  title: 'Общие настройки', items: [
                    { label: 'Регистрация новых пользователей', desc: 'Разрешить новым пользователям регистрироваться', def: true },
                    { label: 'Модерация сообщений', desc: 'Автоматическая проверка сообщений', def: false },
                  ]
                },
                {
                  title: 'Безопасность', items: [
                    { label: 'Двухфакторная аутентификация', desc: 'Требовать 2FA для всех пользователей', def: false },
                    { label: 'Аудит действий', desc: 'Вести журнал всех действий администраторов', def: true },
                  ]
                },
              ].map(section => (
                <div key={section.title} className="bg-[#13131c] border border-[#1e1e2c] rounded-2xl p-4 mb-3">
                  <h3 className="text-[15px] font-bold text-[#f0f0f8] mb-3">{section.title}</h3>
                  <div className="flex flex-col gap-0">
                    {section.items.map((item, idx) => (
                      <div key={item.label} className={`flex items-center justify-between py-3 ${idx < section.items.length - 1 ? 'border-b border-[#1e1e2c]' : ''}`}>
                        <div>
                          <p className="text-sm font-medium text-[#d0d0ec] mb-0.5">{item.label}</p>
                          <p className="text-xs text-[#48487a]">{item.desc}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer ml-4 flex-shrink-0">
                          <input type="checkbox" defaultChecked={item.def} className="sr-only peer" />
                          <div className="w-9 h-5 bg-[#252535] rounded-full peer peer-checked:bg-[#4a6cf7] transition-colors duration-200 after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:w-3.5 after:h-3.5 after:rounded-full after:bg-white after:shadow after:transition-all peer-checked:after:translate-x-4" />
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
