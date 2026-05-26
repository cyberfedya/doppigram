import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { VerifiedBadge } from '../components/VerifiedBadge';
import {
  UserPlus, ArrowLeft, Users, Trash2, Shield, ShieldOff,
  Edit, X, Check, Search, Crown, LogOut, BadgeCheck,
  BadgeX, Ban, Unlock, Sun, Moon,
} from 'lucide-react';

interface UserData {
  _id: string; username: string; email: string; avatar?: string;
  avatarType?: 'emoji' | 'image'; isAdmin: boolean; isOnline: boolean;
  isVerified?: boolean; isBanned?: boolean; banReason?: string;
  lastSeen: number; createdAt: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const _noop = async (..._: unknown[]): Promise<any> => { throw new Error('Backend not configured'); };

export default function AdminPanel() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBanModal, setShowBanModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [banningUser, setBanningUser] = useState<UserData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const { logout } = useApp();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  // TODO: replace with your backend queries/mutations
  const allUsers: UserData[] | undefined = undefined;
  const createUserMut = _noop;
  const deleteUserMut = _noop;
  const toggleAdminMut = _noop;
  const toggleVerifiedMut = _noop;
  const banUserMut = _noop;
  const unbanUserMut = _noop;
  const updateUserMut = _noop;

  const filteredUsers = allUsers?.filter(user =>
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleLogout = () => { logout(); navigate('/login'); };

  const handleDeleteUser = async (userId: string, username: string) => {
    if (!confirm(`Delete user "${username}"?`)) return;
    try { await deleteUserMut({ userId }); } catch (error) { alert('Error: ' + error); }
  };

  const handleToggleAdmin = async (userId: string) => {
    try { await toggleAdminMut({ userId }); } catch (error) { alert('Error: ' + error); }
  };

  const handleToggleVerified = async (userId: string) => {
    try { await toggleVerifiedMut({ userId }); } catch (error) { alert('Error: ' + error); }
  };

  const handleUnban = async (userId: string) => {
    try { await unbanUserMut({ userId }); } catch (error) { alert('Error: ' + error); }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-base)' }}>
      <header className="sticky top-0 z-40" style={{ backgroundColor: 'var(--bg-panel)', borderBottom: '1px solid var(--bg-border)' }}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/chats')} className="p-2 rounded-xl transition-all active:scale-95 themed-border" style={{ backgroundColor: 'var(--bg-card)' }}>
              <ArrowLeft className="h-5 w-5" style={{ color: 'var(--tx-secondary)' }} />
            </button>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl" style={{ backgroundColor: 'var(--accent)' }}>
                <Crown className="h-5 w-5" style={{ color: 'var(--bg-base)' }} />
              </div>
              <div>
                <h1 className="text-lg font-bold" style={{ color: 'var(--tx-primary)' }}>Control Panel</h1>
                <p className="text-[11px] font-medium" style={{ color: 'var(--tx-muted)' }}>Administration</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggleTheme} className="p-2 rounded-xl transition-all active:scale-95 themed-border" style={{ backgroundColor: 'var(--bg-card)' }}>
              {theme === 'dark' ? <Sun size={18} style={{ color: 'var(--accent)' }} /> : <Moon size={18} style={{ color: 'var(--accent-secondary)' }} />}
            </button>
            <button onClick={handleLogout} className="px-4 py-2 text-sm rounded-xl transition-all flex items-center gap-2 themed-border"
              style={{ backgroundColor: 'var(--bg-card)', color: 'var(--tx-secondary)' }}>
              <LogOut className="h-4 w-4" /> Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 animate-fadeInUp">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-8">
          {[
            { label: 'Total', value: allUsers?.length || 0, icon: <Users className="h-5 w-5" />, color: 'var(--accent)' },
            { label: 'Admins', value: allUsers?.filter(u => u.isAdmin).length || 0, icon: <Shield className="h-5 w-5" />, color: 'var(--accent-secondary)' },
            { label: 'Online', value: allUsers?.filter(u => u.isOnline).length || 0, icon: <Users className="h-5 w-5" />, color: 'var(--online)' },
            { label: 'Banned', value: allUsers?.filter(u => u.isBanned).length || 0, icon: <Ban className="h-5 w-5" />, color: 'var(--danger)' },
          ].map((s, i) => (
            <div key={i} className="rounded-2xl p-5 flex items-center gap-4 themed-border" style={{ backgroundColor: 'var(--bg-panel)' }}>
              <div className="p-2.5 rounded-xl" style={{ backgroundColor: 'var(--bg-card)', color: s.color, border: '1px solid var(--bg-border)' }}>{s.icon}</div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--tx-muted)' }}>{s.label}</p>
                <p className="text-2xl font-bold" style={{ color: 'var(--tx-primary)' }}>{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Action Bar */}
        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--tx-dim)' }} />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search users..."
              className="w-full pl-11 pr-4 py-3 rounded-xl text-sm transition-all themed-border themed-border-focus"
              style={{ backgroundColor: 'var(--bg-input)', color: 'var(--tx-primary)' }} />
          </div>
          <button onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 rounded-xl font-semibold text-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            style={{ background: 'var(--msg-me-bg)', color: 'var(--msg-me-text)' }}>
            <UserPlus className="h-4 w-4" /> New User
          </button>
        </div>

        {/* Users Table */}
        <div className="rounded-2xl overflow-hidden themed-border" style={{ backgroundColor: 'var(--bg-panel)' }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--bg-border)' }}>
                  <th className="px-6 py-4 text-left text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--tx-muted)' }}>User</th>
                  <th className="px-6 py-4 text-left text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--tx-muted)' }}>Email</th>
                  <th className="px-6 py-4 text-left text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--tx-muted)' }}>Status</th>
                  <th className="px-6 py-4 text-left text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--tx-muted)' }}>Role</th>
                  <th className="px-6 py-4 text-right text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--tx-muted)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user._id} className="transition-colors" style={{ borderBottom: '1px solid var(--bg-divider)' }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--bg-border)', color: 'var(--tx-primary)' }}>
                          {user.avatar && user.avatarType === 'image' ? (
                            <img src={user.avatar} alt={user.username} className="w-full h-full rounded-full object-cover" />
                          ) : (user.username.slice(0, 2).toUpperCase())}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="font-semibold text-sm" style={{ color: user.isBanned ? 'var(--danger)' : 'var(--tx-primary)' }}>{user.username}</p>
                            {user.isVerified && <VerifiedBadge size={14} />}
                            {user.isBanned && <Ban size={12} style={{ color: 'var(--danger)' }} />}
                          </div>
                          <p className="text-[10px]" style={{ color: 'var(--tx-dim)' }}>{new Date(user.createdAt).toLocaleDateString('en-US')}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm" style={{ color: 'var(--tx-secondary)' }}>{user.email}</td>
                    <td className="px-6 py-4">
                      {user.isBanned ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium" style={{ backgroundColor: 'rgba(255,51,85,0.08)', color: 'var(--danger)' }}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--danger)' }} /> Banned
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium"
                          style={{ backgroundColor: user.isOnline ? 'rgba(57,255,127,0.06)' : 'var(--bg-card)', color: user.isOnline ? 'var(--online)' : 'var(--tx-dim)' }}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: user.isOnline ? 'var(--online)' : 'var(--tx-dim)' }} />
                          {user.isOnline ? 'Online' : 'Offline'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium"
                        style={{ backgroundColor: user.isAdmin ? 'rgba(139,92,246,0.1)' : 'var(--bg-card)', color: user.isAdmin ? 'var(--accent-secondary)' : 'var(--tx-secondary)' }}>
                        {user.isAdmin ? <><Crown className="h-3 w-3" /> Admin</> : <><Users className="h-3 w-3" /> User</>}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <button onClick={() => handleToggleVerified(user._id)}
                          className="p-2 rounded-lg transition-all active:scale-95 themed-border"
                          style={{ backgroundColor: 'var(--bg-card)', color: user.isVerified ? 'var(--accent)' : 'var(--tx-dim)' }}
                          title={user.isVerified ? 'Remove verified' : 'Give verified tick'}>
                          {user.isVerified ? <BadgeX className="h-3.5 w-3.5" /> : <BadgeCheck className="h-3.5 w-3.5" />}
                        </button>
                        <button onClick={() => handleToggleAdmin(user._id)}
                          className="p-2 rounded-lg transition-all active:scale-95 themed-border"
                          style={{ backgroundColor: 'var(--bg-card)', color: 'var(--tx-secondary)' }}
                          title={user.isAdmin ? 'Remove admin' : 'Make admin'}>
                          {user.isAdmin ? <ShieldOff className="h-3.5 w-3.5" /> : <Shield className="h-3.5 w-3.5" />}
                        </button>
                        {user.isBanned ? (
                          <button onClick={() => handleUnban(user._id)}
                            className="p-2 rounded-lg transition-all active:scale-95 themed-border"
                            style={{ backgroundColor: 'var(--bg-card)', color: 'var(--online)' }}
                            title="Unban user">
                            <Unlock className="h-3.5 w-3.5" />
                          </button>
                        ) : (
                          <button onClick={() => { setBanningUser(user); setShowBanModal(true); }}
                            className="p-2 rounded-lg transition-all active:scale-95 themed-border"
                            style={{ backgroundColor: 'var(--bg-card)', color: 'var(--danger)' }}
                            title="Perm ban user">
                            <Ban className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button onClick={() => { setEditingUser(user); setShowEditModal(true); }}
                          className="p-2 rounded-lg transition-all active:scale-95 themed-border"
                          style={{ backgroundColor: 'var(--bg-card)', color: 'var(--tx-secondary)' }} title="Edit">
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => handleDeleteUser(user._id, user.username)}
                          className="p-2 rounded-lg transition-all active:scale-95"
                          style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--bg-border)', color: 'var(--tx-dim)' }}
                          title="Delete"
                          onMouseEnter={e => { e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.borderColor = 'var(--danger)'; }}
                          onMouseLeave={e => { e.currentTarget.style.color = 'var(--tx-dim)'; e.currentTarget.style.borderColor = 'var(--bg-border)'; }}>
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
              <Users className="h-10 w-10 mx-auto mb-3" style={{ color: 'var(--tx-ghost)' }} />
              <p className="text-sm" style={{ color: 'var(--tx-dim)' }}>No users found</p>
            </div>
          )}
        </div>
      </main>

      {showCreateModal && (
        <CreateUserModal onClose={() => setShowCreateModal(false)} onCreate={async (username, password) => {
          try {
            await createUserMut({ uid: 'user_' + Date.now() + '_' + username, username, displayName: username, email: `${username}@doppigram.app`, password, isAdmin: false });
            setShowCreateModal(false);
          } catch (error) { alert('Error: ' + error); }
        }} />
      )}

      {showEditModal && editingUser && (
        <EditUserModal user={editingUser} onClose={() => { setShowEditModal(false); setEditingUser(null); }}
          onSave={async (username, password) => {
            try {
              await updateUserMut({ userId: editingUser._id, username, ...(password ? { password } : {}) });
              setShowEditModal(false); setEditingUser(null);
            } catch (error) { alert('Error: ' + error); }
          }} />
      )}

      {showBanModal && banningUser && (
        <BanUserModal user={banningUser} onClose={() => { setShowBanModal(false); setBanningUser(null); }}
          onBan={async (reason) => {
            try {
              await banUserMut({ userId: banningUser._id, reason });
              setShowBanModal(false); setBanningUser(null);
            } catch (error) { alert('Error: ' + error); }
          }} />
      )}
    </div>
  );
}

function ModalWrapper({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4 animate-fadeIn" style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }} onClick={onClose}>
      <div className="animate-slideUp" onClick={e => e.stopPropagation()}>{children}</div>
    </div>
  );
}

function CreateUserModal({ onClose, onCreate }: { onClose: () => void; onCreate: (username: string, password: string) => Promise<void> }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) { alert('All fields are required'); return; }
    if (password !== confirmPassword) { alert('Passwords do not match'); return; }
    if (password.length < 6) { alert('Password: minimum 6 characters'); return; }
    await onCreate(username, password);
  };

  const inputCls = "w-full px-4 py-3 rounded-xl text-sm transition-all themed-border themed-border-focus";
  const labelCls = "block text-xs font-semibold mb-2 uppercase tracking-wider";

  return (
    <ModalWrapper onClose={onClose}>
      <div className="rounded-2xl p-6 w-full max-w-md" style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--bg-border)' }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold" style={{ color: 'var(--tx-primary)' }}>New User</h2>
          <button onClick={onClose} className="p-2 rounded-lg transition-colors" style={{ color: 'var(--tx-dim)' }}><X className="h-4 w-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className={labelCls} style={{ color: 'var(--tx-muted)' }}>Username</label><input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className={inputCls} style={{ backgroundColor: 'var(--bg-input)', color: 'var(--tx-primary)' }} placeholder="Enter username" autoFocus /></div>
          <div><label className={labelCls} style={{ color: 'var(--tx-muted)' }}>Password</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} style={{ backgroundColor: 'var(--bg-input)', color: 'var(--tx-primary)' }} placeholder="Min 6 characters" /></div>
          <div><label className={labelCls} style={{ color: 'var(--tx-muted)' }}>Confirm Password</label><input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={inputCls} style={{ backgroundColor: 'var(--bg-input)', color: 'var(--tx-primary)' }} placeholder="Repeat password" /></div>
          <button type="submit" className="w-full py-3 rounded-xl font-semibold text-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-2"
            style={{ background: 'var(--msg-me-bg)', color: 'var(--msg-me-text)' }}>
            <Check className="h-4 w-4" /> Create
          </button>
        </form>
      </div>
    </ModalWrapper>
  );
}

function EditUserModal({ user, onClose, onSave }: { user: UserData; onClose: () => void; onSave: (username: string, password: string) => Promise<void> }) {
  const [username, setUsername] = useState(user.username);
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) { alert('Username cannot be empty'); return; }
    await onSave(username, password);
  };

  const inputCls = "w-full px-4 py-3 rounded-xl text-sm transition-all themed-border themed-border-focus";
  const labelCls = "block text-xs font-semibold mb-2 uppercase tracking-wider";

  return (
    <ModalWrapper onClose={onClose}>
      <div className="rounded-2xl p-6 w-full max-w-md" style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--bg-border)' }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold" style={{ color: 'var(--tx-primary)' }}>Edit User</h2>
          <button onClick={onClose} className="p-2 rounded-lg transition-colors" style={{ color: 'var(--tx-dim)' }}><X className="h-4 w-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className={labelCls} style={{ color: 'var(--tx-muted)' }}>Username</label><input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className={inputCls} style={{ backgroundColor: 'var(--bg-input)', color: 'var(--tx-primary)' }} /></div>
          <div><label className={labelCls} style={{ color: 'var(--tx-muted)' }}>New Password (optional)</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} style={{ backgroundColor: 'var(--bg-input)', color: 'var(--tx-primary)' }} placeholder="Leave empty to keep current" /></div>
          <button type="submit" className="w-full py-3 rounded-xl font-semibold text-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-2"
            style={{ background: 'var(--msg-me-bg)', color: 'var(--msg-me-text)' }}>
            <Check className="h-4 w-4" /> Save
          </button>
        </form>
      </div>
    </ModalWrapper>
  );
}

function BanUserModal({ user, onClose, onBan }: { user: UserData; onClose: () => void; onBan: (reason: string) => Promise<void> }) {
  const [reason, setReason] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onBan(reason || 'Permanently banned by admin.');
  };

  return (
    <ModalWrapper onClose={onClose}>
      <div className="rounded-2xl p-6 w-full max-w-md" style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--bg-border)' }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold" style={{ color: 'var(--danger)' }}>Permanent Ban</h2>
          <button onClick={onClose} className="p-2 rounded-lg transition-colors" style={{ color: 'var(--tx-dim)' }}><X className="h-4 w-4" /></button>
        </div>
        <div className="flex items-center gap-3 mb-4 p-3 rounded-xl" style={{ backgroundColor: 'rgba(255,51,85,0.06)', border: '1px solid rgba(255,51,85,0.15)' }}>
          <Ban size={20} style={{ color: 'var(--danger)' }} />
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--tx-primary)' }}>Ban "{user.username}"?</p>
            <p className="text-xs" style={{ color: 'var(--tx-secondary)' }}>This user will be permanently banned and unable to log in.</p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--tx-muted)' }}>Ban Reason (optional)</label>
            <input type="text" value={reason} onChange={(e) => setReason(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm transition-all themed-border themed-border-focus"
              style={{ backgroundColor: 'var(--bg-input)', color: 'var(--tx-primary)' }}
              placeholder="Reason for the ban..." autoFocus />
          </div>
          <button type="submit" className="w-full py-3 rounded-xl font-semibold text-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            style={{ backgroundColor: 'var(--danger)', color: '#fff' }}>
            <Ban className="h-4 w-4" /> Permanently Ban
          </button>
        </form>
      </div>
    </ModalWrapper>
  );
}
