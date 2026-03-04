import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Key, UserPlus, CheckCircle, AlertCircle } from 'lucide-react';

export default function InitAdmin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const createInitialAdmin = useMutation(api.seed.createInitialAdmin);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (!username.trim() || !password.trim()) { setMessage({ type: 'error', text: 'Все поля обязательны для заполнения' }); return; }
    if (password.length < 6) { setMessage({ type: 'error', text: 'Пароль должен содержать минимум 6 символов' }); return; }
    setIsLoading(true);
    try {
      await createInitialAdmin({ username, password });
      setMessage({ type: 'success', text: `Админ «${username}» создан! Перенаправление...` });
      setTimeout(() => navigate('/login'), 2000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Ошибка: ' + error });
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative">
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />

      <div className="w-full max-w-[400px] relative animate-fadeInUp">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl mb-5 shadow-[0_0_60px_rgba(255,255,255,0.08)]">
            <Key className="h-7 w-7 text-black" />
          </div>
          <h1 className="text-[28px] font-extrabold text-white tracking-tight">Начальная настройка</h1>
          <p className="text-[#555] mt-1.5 text-sm font-medium">Создайте первого администратора</p>
        </div>

        <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-7">
          <div className="flex items-start gap-2.5 mb-6 p-3.5 bg-white/[0.02] border border-white/[0.06] rounded-xl">
            <AlertCircle className="h-4 w-4 text-[#666] flex-shrink-0 mt-0.5" />
            <p className="text-[12px] text-[#555] leading-relaxed">
              Эта страница используется только один раз. После создания первого админа она больше не понадобится.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {message && (
              <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium animate-slideDown ${
                message.type === 'success' ? 'bg-white/[0.03] border border-white/10 text-[#4ade80]' : 'bg-white/[0.03] border border-white/10 text-[#ff6b6b]'
              }`}>
                {message.type === 'success' && <CheckCircle className="h-4 w-4 flex-shrink-0" />}
                {message.text}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#666] mb-2 uppercase tracking-wider">Логин админа</label>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-[#111] border border-[#222] rounded-xl text-white text-sm placeholder-[#333] transition-all focus:border-[#444] focus:shadow-[0_0_0_3px_rgba(255,255,255,0.03)]"
                placeholder="admin" disabled={isLoading} autoFocus />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#666] mb-2 uppercase tracking-wider">Пароль</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-[#111] border border-[#222] rounded-xl text-white text-sm placeholder-[#333] transition-all focus:border-[#444] focus:shadow-[0_0_0_3px_rgba(255,255,255,0.03)]"
                placeholder="Минимум 6 символов" disabled={isLoading} />
            </div>

            <button type="submit" disabled={isLoading}
              className="w-full bg-white text-black py-3 rounded-xl font-semibold text-sm hover:bg-[#e8e8e8] active:scale-[0.98] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2">
              {isLoading ? <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : <><UserPlus className="h-4 w-4" /> Создать админа</>}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-[#1a1a1a]">
            <p className="text-[11px] text-[#444] text-center">После создания вы будете направлены на страницу входа</p>
          </div>
        </div>
      </div>
    </div>
  );
}
