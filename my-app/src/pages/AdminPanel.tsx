import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import {
  UserPlus, ArrowLeft, Users, Trash2, Shield, ShieldOff,
  Edit, X, Check, Search, Crown, LogOut,
} from 'lucide-react';
import type { Id } from '../../convex/_generated/dataModel';

interface UserData {
  _id: Id<"users">; username: string; email: string; avatar?: string;
  avatarType?: 'emoji' | 'image'; isAdmin: boolean; isOnline: boolean;
  lastSeen: number; createdAt: number;
}

const inputCls = "w-full px-4 py-3 bg-[#111] border border-[#222] rounded-xl text-white text-sm placeholder-[#333] transition-all focus:border-[#444] focus:shadow-[0_0_0_3px_rgba(255,255,255,0.03)]";
const labelCls = "block text-xs font-semibold text-[#666] mb-2 uppercase tracking-wider";

export default function AdminPanel() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const { logout } = useApp();
  const navigate = useNavigate();

  const allUsers = useQuery(api.users.getAllUsers) as UserData[] | undefined;
  const createUserMut = useMutation(api.users.createUser);
  const deleteUserMut = useMutation(api.users.deleteUser);
  const toggleAdminMut = useMutation(api.users.toggleUserAdmin);
  const updateUserMut = useMutation(api.users.updateUser);

  const filteredUsers = allUsers?.filter(user =>
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleLogout = () => { logout(); navigate('/login'); };

  const handleDeleteUser = async (userId: Id<"users">, username: string) => {
    if (!confirm(`Удалить пользователя "${username}"?`)) return;
    try { await deleteUserMut({ userId }); } catch (error) { alert('Ошибка при удалении: ' + error); }
  };

  const handleToggleAdmin = async (userId: Id<"users">) => {
    try { await toggleAdminMut({ userId }); } catch (error) { alert('Ошибка: ' + error); }
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="bg-[#080808] border-b border-[#151515] sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/chats')} className="p-2 hover:bg-white/[0.05] rounded-xl transition-all active:scale-95">
              <ArrowLeft className="h-5 w-5 text-[#666]" />
            </button>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white rounded-xl"><Crown className="h-5 w-5 text-black" /></div>
              <div>
                <h1 className="text-lg font-bold text-white">Панель управления</h1>
                <p className="text-[11px] text-[#555] font-medium">Администрирование</p>
              </div>
            </div>
          </div>
          <button onClick={handleLogout} className="px-4 py-2 text-sm text-[#666] hover:text-white bg-white/[0.03] hover:bg-white/[0.06] border border-[#1a1a1a] rounded-xl transition-all flex items-center gap-2">
            <LogOut className="h-4 w-4" /> Выйти
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 animate-fadeInUp">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
          {[
            { label: 'Всего', value: allUsers?.length || 0, icon: <Users className="h-5 w-5" /> },
            { label: 'Админы', value: allUsers?.filter(u => u.isAdmin).length || 0, icon: <Shield className="h-5 w-5" /> },
            { label: 'Онлайн', value: allUsers?.filter(u => u.isOnline).length || 0, icon: <Users className="h-5 w-5" /> },
          ].map((s, i) => (
            <div key={i} className="bg-[#0a0a0a] border border-[#151515] rounded-2xl p-5 flex items-center gap-4">
              <div className="p-2.5 bg-white/[0.04] border border-[#1a1a1a] rounded-xl text-[#888]">{s.icon}</div>
              <div>
                <p className="text-[#555] text-xs font-medium uppercase tracking-wider">{s.label}</p>
                <p className="text-2xl font-bold text-white">{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Action Bar */}
        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#333]" />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Поиск пользователя..."
              className="w-full pl-11 pr-4 py-3 bg-[#0a0a0a] border border-[#151515] rounded-xl text-white text-sm placeholder-[#333] transition-all focus:border-[#333]" />
          </div>
          <button onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-white text-black rounded-xl font-semibold text-sm hover:bg-[#e8e8e8] active:scale-[0.98] transition-all flex items-center justify-center gap-2">
            <UserPlus className="h-4 w-4" /> Новый пользователь
          </button>
        </div>

        {/* Users Table */}
        <div className="bg-[#0a0a0a] border border-[#151515] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#151515]">
                  <th className="px-6 py-4 text-left text-[10px] font-semibold text-[#444] uppercase tracking-wider">Пользователь</th>
                  <th className="px-6 py-4 text-left text-[10px] font-semibold text-[#444] uppercase tracking-wider">Email</th>
                  <th className="px-6 py-4 text-left text-[10px] font-semibold text-[#444] uppercase tracking-wider">Статус</th>
                  <th className="px-6 py-4 text-left text-[10px] font-semibold text-[#444] uppercase tracking-wider">Роль</th>
                  <th className="px-6 py-4 text-right text-[10px] font-semibold text-[#444] uppercase tracking-wider">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#111]">
                {filteredUsers.map((user) => (
                  <tr key={user._id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#1a1a1a] border border-[#222] flex items-center justify-center text-sm font-bold text-white">
                          {user.avatar && user.avatarType === 'image' ? (
                            <img src={user.avatar} alt={user.username} className="w-full h-full rounded-full object-cover" />
                          ) : (user.avatar || user.username.slice(0, 2).toUpperCase())}
                        </div>
                        <div>
                          <p className="font-semibold text-white text-sm">{user.username}</p>
                          <p className="text-[10px] text-[#444]">{new Date(user.createdAt).toLocaleDateString('ru-RU')}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#666]">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium ${user.isOnline ? 'bg-white/[0.04] text-[#4ade80]' : 'bg-white/[0.02] text-[#444]'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${user.isOnline ? 'bg-[#4ade80]' : 'bg-[#333]'}`} />
                        {user.isOnline ? 'Онлайн' : 'Офлайн'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium ${user.isAdmin ? 'bg-white/[0.06] text-white' : 'bg-white/[0.02] text-[#666]'}`}>
                        {user.isAdmin ? <><Crown className="h-3 w-3" /> Админ</> : <><Users className="h-3 w-3" /> Пользователь</>}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <button onClick={() => handleToggleAdmin(user._id)}
                          className="p-2 rounded-lg bg-white/[0.03] border border-[#1a1a1a] text-[#666] hover:text-white hover:bg-white/[0.06] transition-all active:scale-95"
                          title={user.isAdmin ? 'Убрать админа' : 'Сделать админом'}>
                          {user.isAdmin ? <ShieldOff className="h-3.5 w-3.5" /> : <Shield className="h-3.5 w-3.5" />}
                        </button>
                        <button onClick={() => { setEditingUser(user); setShowEditModal(true); }}
                          className="p-2 rounded-lg bg-white/[0.03] border border-[#1a1a1a] text-[#666] hover:text-white hover:bg-white/[0.06] transition-all active:scale-95" title="Редактировать">
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => handleDeleteUser(user._id, user.username)}
                          className="p-2 rounded-lg bg-white/[0.03] border border-[#1a1a1a] text-[#555] hover:text-[#ff6b6b] hover:bg-[#ff6b6b]/[0.06] transition-all active:scale-95" title="Удалить">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-16">
              <Users className="h-10 w-10 text-[#222] mx-auto mb-3" />
              <p className="text-[#444] text-sm">Пользователи не найдены</p>
            </div>
          )}
        </div>
      </main>

      {showCreateModal && (
        <CreateUserModal onClose={() => setShowCreateModal(false)} onCreate={async (username, password) => {
          try {
            await createUserMut({ uid: 'user_' + Date.now() + '_' + username, username, email: `${username}@doppigram.app`, password, avatar: '👤', avatarType: 'emoji', isAdmin: false });
            setShowCreateModal(false);
          } catch (error) { alert('Ошибка: ' + error); }
        }} />
      )}

      {showEditModal && editingUser && (
        <EditUserModal user={editingUser} onClose={() => { setShowEditModal(false); setEditingUser(null); }}
          onSave={async (username, password) => {
            try {
              await updateUserMut({ userId: editingUser._id, username, ...(password ? { password } : {}) });
              setShowEditModal(false); setEditingUser(null);
            } catch (error) { alert('Ошибка: ' + error); }
          }} />
      )}
    </div>
  );
}

function CreateUserModal({ onClose, onCreate }: { onClose: () => void; onCreate: (username: string, password: string) => Promise<void> }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) { alert('Все поля обязательны'); return; }
    if (password !== confirmPassword) { alert('Пароли не совпадают'); return; }
    if (password.length < 6) { alert('Пароль: минимум 6 символов'); return; }
    await onCreate(username, password);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn" onClick={onClose}>
      <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-6 w-full max-w-md animate-slideUp" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white">Новый пользователь</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/[0.05] rounded-lg transition-colors"><X className="h-4 w-4 text-[#555]" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className={labelCls}>Логин</label><input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className={inputCls} placeholder="Введите логин" autoFocus /></div>
          <div><label className={labelCls}>Пароль</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} placeholder="Минимум 6 символов" /></div>
          <div><label className={labelCls}>Подтвердите пароль</label><input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={inputCls} placeholder="Повторите пароль" /></div>
          <button type="submit" className="w-full py-3 bg-white text-black rounded-xl font-semibold text-sm hover:bg-[#e8e8e8] active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-2">
            <Check className="h-4 w-4" /> Создать
          </button>
        </form>
      </div>
    </div>
  );
}

function EditUserModal({ user, onClose, onSave }: { user: UserData; onClose: () => void; onSave: (username: string, password: string) => Promise<void> }) {
  const [username, setUsername] = useState(user.username);
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) { alert('Логин не может быть пустым'); return; }
    await onSave(username, password);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn" onClick={onClose}>
      <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-6 w-full max-w-md animate-slideUp" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white">Редактирование</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/[0.05] rounded-lg transition-colors"><X className="h-4 w-4 text-[#555]" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className={labelCls}>Логин</label><input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className={inputCls} /></div>
          <div><label className={labelCls}>Новый пароль (необязательно)</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} placeholder="Оставьте пустым, чтобы не менять" /></div>
          <button type="submit" className="w-full py-3 bg-white text-black rounded-xl font-semibold text-sm hover:bg-[#e8e8e8] active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-2">
            <Check className="h-4 w-4" /> Сохранить
          </button>
        </form>
      </div>
    </div>
  );
}
