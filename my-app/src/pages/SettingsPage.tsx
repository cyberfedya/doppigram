import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Check, X, ArrowLeft, Save } from 'lucide-react';

interface SettingsState {
  theme: 'light' | 'dark';
  notifications: boolean;
  sound: boolean;
  language: 'ru' | 'en';
  showOnlineStatus: boolean;
}

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-6 right-6 z-50 animate-[slideIn_0.3s_ease-out]">
      <div className={`flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border ${type === 'success'
          ? 'bg-[#1a2a1f] border-[#2d5a3d] text-[#4ade80]'
          : 'bg-[#2a1a1a] border-[#5a2d2d] text-[#f87171]'
        }`}>
        {type === 'success' ? <Check size={20} /> : <X size={20} />}
        <span className="font-medium text-sm">{message}</span>
        <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100 transition-opacity">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

export function SettingsPage() {
  const navigate = useNavigate();
  const { auth, logout, updateProfile } = useApp();

  const [settings, setSettings] = useState<SettingsState>(() => {
    const saved = localStorage.getItem('doppigram_settings');
    return saved ? JSON.parse(saved) : {
      theme: 'dark',
      notifications: true,
      sound: true,
      language: 'ru',
      showOnlineStatus: true,
    };
  });

  const [avatar, setAvatar] = useState('🧑');
  const [avatarType, setAvatarType] = useState<'emoji' | 'image'>('emoji');
  const [username, setUsername] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (auth.user) {
      setUsername(auth.user.username);
      setAvatar(auth.user.avatar || '🧑');
      setAvatarType(auth.user.avatarType || 'emoji');
    }
  }, [auth.user]);

  const handleSave = async () => {
    localStorage.setItem('doppigram_settings', JSON.stringify(settings));
    await updateProfile(username, avatar, avatarType);
    setToast({ message: 'Настройки сохранены!', type: 'success' });
    document.documentElement.setAttribute('data-theme', settings.theme);
    setTimeout(() => navigate('/chats'), 800);
  };

  const avatars = ['🧑', '👨', '👩', '🧔', '👱', '🧒', '🦊', '🐱', '🐶', '🦁'];

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex flex-col h-screen bg-[#0a0a10]">
        <div className="flex items-center gap-5 px-8 py-5 bg-[#13131c] border-b border-[#1e1e2c]">
          <button
            onClick={() => navigate('/chats')}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#1a1a2c] border border-[#28283c] rounded-xl text-[#8888b0] text-sm font-medium hover:bg-[#22223a] hover:text-[#d0d0ec] transition-all"
          >
            <ArrowLeft size={18} />
            Назад
          </button>
          <h1 className="text-2xl font-bold text-[#f0f0f8]">Настройки</h1>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-[#13131c] border border-[#1e1e2c] rounded-3xl p-6">
              <h2 className="text-lg font-semibold text-[#f0f0f8] mb-6">Профиль</h2>
              <div className="space-y-6">
                <div>
                  <label className="text-sm text-[#8888b0] mb-3 block">Аватар</label>
                  <div className="flex items-start gap-6">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#6c3de5] to-[#3d8ef5] flex items-center justify-center text-4xl shadow-[0_4px_16px_rgba(108,61,229,0.4)]">
                      {avatar}
                    </div>
                    <div className="flex flex-wrap gap-2.5 max-w-md">
                      {avatars.map((a) => (
                        <button
                          key={a}
                          onClick={() => setAvatar(a)}
                          className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl transition-all ${avatar === a
                              ? 'bg-[#1a2240] border-2 border-[#4a6cf7] shadow-[0_0_0_2px_rgba(74,108,247,0.3)]'
                              : 'bg-[#1a1a2c] border border-[#28283c] hover:bg-[#22223a] hover:border-[#4a6cf7]'
                            }`}
                        >
                          {a}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-[#8888b0] mb-2 block">Имя пользователя</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Введите имя"
                    className="w-full bg-[#1a1a2c] border border-[#28283c] rounded-xl px-4 py-3 text-[#d0d0ec] placeholder-[#34344e] focus:border-[#4a6cf7] focus:shadow-[0_0_0_3px_rgba(74,108,247,0.1)] transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="bg-[#13131c] border border-[#1e1e2c] rounded-3xl p-6">
              <h2 className="text-lg font-semibold text-[#f0f0f8] mb-6">Внешний вид</h2>
              <div className="flex items-center justify-between">
                <span className="text-[#c0c0e0]">Тема оформления</span>
                <div className="flex gap-1.5 bg-[#1a1a2c] p-1 rounded-xl">
                  <button
                    onClick={() => setSettings({ ...settings, theme: 'light' })}
                    className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${settings.theme === 'light'
                        ? 'bg-[#4a6cf7] text-white shadow-[0_2px_8px_rgba(74,108,247,0.3)]'
                        : 'text-[#8888b0] hover:text-[#d0d0ec]'
                      }`}
                  >
                    ☀️ Светлая
                  </button>
                  <button
                    onClick={() => setSettings({ ...settings, theme: 'dark' })}
                    className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${settings.theme === 'dark'
                        ? 'bg-[#4a6cf7] text-white shadow-[0_2px_8px_rgba(74,108,247,0.3)]'
                        : 'text-[#8888b0] hover:text-[#d0d0ec]'
                      }`}
                  >
                    🌙 Тёмная
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-[#13131c] border border-[#1e1e2c] rounded-3xl p-6">
              <h2 className="text-lg font-semibold text-[#f0f0f8] mb-6">Уведомления</h2>
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <span className="text-[#c0c0e0]">Показывать уведомления</span>
                  <button
                    onClick={() => setSettings({ ...settings, notifications: !settings.notifications })}
                    className={`relative w-12 h-7 rounded-full transition-colors ${settings.notifications ? 'bg-[#4a6cf7]' : 'bg-[#252535]'
                      }`}
                  >
                    <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${settings.notifications ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-4">
              <button
                onClick={handleSave}
                className="flex items-center justify-center gap-2 w-full py-4 bg-gradient-to-br from-[#4a6cf7] to-[#3a5ce5] text-white rounded-2xl font-semibold border border-[#4a6cf7] shadow-[0_4px_14px_rgba(74,108,247,0.35)] hover:-translate-y-0.5 hover:shadow-[0_6px_18px_rgba(74,108,247,0.45)] transition-all"
              >
                <Save size={20} />
                Сохранить настройки
              </button>
              <button
                onClick={logout}
                className="flex items-center justify-center gap-2 w-full py-4 bg-[#1a1a2c] border border-[#28283c] text-[#c05050] rounded-2xl font-semibold hover:bg-[rgba(192,80,80,0.1)] hover:border-[#c05050] hover:text-[#e06060] transition-all"
              >
                Выйти из аккаунта
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(100px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </>
  );
}
