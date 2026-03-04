import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import {
  UserPlus,
  ArrowLeft,
  Users,
  Trash2,
  Shield,
  ShieldOff,
  Edit,
  X,
  Check,
  Search,
  Crown
} from 'lucide-react';
import type { Id } from '../../convex/_generated/dataModel';

interface UserData {
  _id: Id<"users">;
  username: string;
  email: string;
  avatar?: string;
  avatarType?: 'emoji' | 'image';
  isAdmin: boolean;
  isOnline: boolean;
  lastSeen: number;
  createdAt: number;
}

export default function AdminPanel() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const { logout } = useApp();
  const navigate = useNavigate();

  // Получаем список всех пользователей
  const allUsers = useQuery(api.users.getAllUsers) as UserData[] | undefined;
  
  // Мутации
  const createUserMut = useMutation(api.users.createUser);
  const deleteUserMut = useMutation(api.users.deleteUser);
  const toggleAdminMut = useMutation(api.users.toggleUserAdmin);
  const updateUserMut = useMutation(api.users.updateUser);

  // Фильтруем пользователей по поиску
  const filteredUsers = allUsers?.filter(user =>
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleDeleteUser = async (userId: Id<"users">, username: string) => {
    if (!confirm(`Удалить пользователя "${username}"?`)) return;
    
    try {
      await deleteUserMut({ userId });
      alert('Пользователь удалён');
    } catch (error) {
      alert('Ошибка при удалении: ' + error);
    }
  };

  const handleToggleAdmin = async (userId: Id<"users">) => {
    try {
      await toggleAdminMut({ userId });
    } catch (error) {
      alert('Ошибка: ' + error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-lg border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/chats')}
              className="p-2 hover:bg-white/10 rounded-xl transition-all group"
            >
              <ArrowLeft className="h-5 w-5 text-white group-hover:scale-110 transition-transform" />
            </button>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
                <Crown className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Admin Panel</h1>
                <p className="text-xs text-white/60">Boshqaruv paneli</p>
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl transition-all flex items-center gap-2"
          >
            <Users className="h-4 w-4" />
            Chiqish
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-white/60 text-sm">Jami foydalanuvchilar</p>
                <p className="text-2xl font-bold text-white">{allUsers?.length || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-white/60 text-sm">Adminlar</p>
                <p className="text-2xl font-bold text-white">
                  {allUsers?.filter(u => u.isAdmin).length || 0}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-white/60 text-sm">Onlayn</p>
                <p className="text-2xl font-bold text-white">
                  {allUsers?.filter(u => u.isOnline).length || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Foydalanuvchini qidirish..."
              className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/10 rounded-xl text-white placeholder-white/40 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            />
          </div>
          
          {/* Create Button */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:from-purple-700 hover:to-pink-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-500/25"
          >
            <UserPlus className="h-5 w-5" />
            Yangi foydalanuvchi
          </button>
        </div>

        {/* Users Table */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white/60 uppercase tracking-wider">
                    Foydalanuvchi
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white/60 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white/60 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white/60 uppercase tracking-wider">
                    Rol
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-white/60 uppercase tracking-wider">
                    Amallar
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredUsers.map((user) => (
                  <tr key={user._id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                          {user.avatar && user.avatarType === 'image' ? (
                            <img src={user.avatar} alt={user.username} className="w-full h-full rounded-full object-cover" />
                          ) : (
                            user.avatar || user.username.slice(0, 2).toUpperCase()
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-white">{user.username}</p>
                          <p className="text-xs text-white/40">
                            {new Date(user.createdAt).toLocaleDateString('ru-RU')}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-white/70">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                        user.isOnline
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          user.isOnline ? 'bg-green-400' : 'bg-gray-400'
                        }`} />
                        {user.isOnline ? 'Onlayn' : 'Oflayn'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                        user.isAdmin
                          ? 'bg-purple-500/20 text-purple-400'
                          : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {user.isAdmin ? (
                          <>
                            <Crown className="h-3 w-3" />
                            Admin
                          </>
                        ) : (
                          <>
                            <Users className="h-3 w-3" />
                            User
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggleAdmin(user._id)}
                          className={`p-2 rounded-lg transition-all ${
                            user.isAdmin
                              ? 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30'
                              : 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30'
                          }`}
                          title={user.isAdmin ? 'Убрать админа' : 'Сделать админом'}
                        >
                          {user.isAdmin ? <ShieldOff className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => {
                            setEditingUser(user);
                            setShowEditModal(true);
                          }}
                          className="p-2 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded-lg transition-all"
                          title="Редактировать"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user._id, user.username)}
                          className="p-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg transition-all"
                          title="Удалить"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-white/20 mx-auto mb-4" />
              <p className="text-white/40">Foydalanuvchilar topilmadi</p>
            </div>
          )}
        </div>
      </main>

      {/* Create User Modal */}
      {showCreateModal && (
        <CreateUserModal
          onClose={() => setShowCreateModal(false)}
          onCreate={async (username, password) => {
            try {
              await createUserMut({
                uid: 'user_' + username,
                username,
                email: `${username}@example.com`,
                password,
                avatar: '👤',
                avatarType: 'emoji',
                isAdmin: false,
              });
              setShowCreateModal(false);
              alert('Foydalanuvchi yaratildi!');
            } catch (error) {
              alert('Xatolik: ' + error);
            }
          }}
        />
      )}

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={() => {
            setShowEditModal(false);
            setEditingUser(null);
          }}
          onSave={async (username, password) => {
            try {
              await updateUserMut({
                userId: editingUser._id,
                username,
                ...(password ? { password } : {}),
              });
              setShowEditModal(false);
              setEditingUser(null);
              alert('Foydalanuvchi yangilandi!');
            } catch (error) {
              alert('Xatolik: ' + error);
            }
          }}
        />
      )}
    </div>
  );
}

// Modal for Creating User
function CreateUserModal({
  onClose,
  onCreate
}: {
  onClose: () => void;
  onCreate: (username: string, password: string) => Promise<void>;
}) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim() || !password.trim()) {
      alert('Barcha maydonlar to\'ldirilishi kerak');
      return;
    }
    
    if (password !== confirmPassword) {
      alert('Parollar mos kelmadi');
      return;
    }
    
    if (password.length < 6) {
      alert('Parol kamida 6 ta belgidan iborat bo\'lishi kerak');
      return;
    }
    
    await onCreate(username, password);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Yangi foydalanuvchi</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <X className="h-5 w-5 text-white/60" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">Login</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/10 rounded-xl text-white placeholder-white/40 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              placeholder="Login o'ylab toping"
              autoFocus
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">Parol</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/10 rounded-xl text-white placeholder-white/40 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              placeholder="Parol o'ylab toping"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">Parolni tasdiqlang</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/10 rounded-xl text-white placeholder-white/40 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              placeholder="Parolni takrorlang"
            />
          </div>
          
          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:from-purple-700 hover:to-pink-700 transition-all flex items-center justify-center gap-2"
          >
            <Check className="h-5 w-5" />
            Yaratish
          </button>
        </form>
      </div>
    </div>
  );
}

// Modal for Editing User
function EditUserModal({
  user,
  onClose,
  onSave
}: {
  user: UserData;
  onClose: () => void;
  onSave: (username: string, password: string) => Promise<void>;
}) {
  const [username, setUsername] = useState(user.username);
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim()) {
      alert('Login bo\'sh bo\'lishi mumkin emas');
      return;
    }
    
    await onSave(username, password);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Tahrirlash</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <X className="h-5 w-5 text-white/60" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">Login</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/10 rounded-xl text-white placeholder-white/40 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Yangi parol (ixtiyoriy)
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/10 rounded-xl text-white placeholder-white/40 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              placeholder="Bo'sh qoldirish mumkin"
            />
          </div>
          
          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:from-purple-700 hover:to-pink-700 transition-all flex items-center justify-center gap-2"
          >
            <Check className="h-5 w-5" />
            Saqlash
          </button>
        </form>
      </div>
    </div>
  );
}
