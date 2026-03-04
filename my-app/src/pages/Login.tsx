import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Lock, User, ArrowRight } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useApp();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!username.trim() || !password.trim()) {
      setError('Логин и пароль обязательны');
      setIsLoading(false);
      return;
    }

    const success = await login(username.trim(), password);

    if (success) {
      navigate('/chats');
    } else {
      setError('Неверный логин или пароль');
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 overflow-hidden relative">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />

      <div className="w-full max-w-[380px] relative animate-fadeInUp">
        {/* Logo */}
        <div 
          onClick={() => navigate('/init-admin')}
          className="text-center mb-10 cursor-pointer hover:scale-[0.98] hover:opacity-90 transition-all active:scale-95"
          title="Начальная настройка"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl mb-5 shadow-[0_0_60px_rgba(255,255,255,0.08)]">
            <span className="text-3xl">💬</span>
          </div>
          <h1 className="text-[28px] font-extrabold text-white tracking-tight">Doppigram</h1>
          <p className="text-[#555] mt-1.5 text-sm font-medium">Войдите в свой аккаунт</p>
        </div>

        {/* Login Form */}
        <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-7">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-white/[0.03] border border-white/10 text-[#ff6b6b] px-4 py-3 rounded-xl text-sm font-medium animate-slideDown">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#666] mb-2 uppercase tracking-wider">
                Логин
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <User className="h-[18px] w-[18px] text-[#333]" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[#111] border border-[#222] rounded-xl text-white text-sm placeholder-[#333] transition-all duration-200 focus:border-[#444] focus:shadow-[0_0_0_3px_rgba(255,255,255,0.03)]"
                  placeholder="Введите логин"
                  disabled={isLoading}
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#666] mb-2 uppercase tracking-wider">
                Пароль
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-[18px] w-[18px] text-[#333]" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[#111] border border-[#222] rounded-xl text-white text-sm placeholder-[#333] transition-all duration-200 focus:border-[#444] focus:shadow-[0_0_0_3px_rgba(255,255,255,0.03)]"
                  placeholder="Введите пароль"
                  disabled={isLoading}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-white text-black py-3 rounded-xl font-semibold text-sm hover:bg-[#e8e8e8] active:scale-[0.98] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : (
                <>
                  Войти
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-[#1a1a1a]">
            <p className="text-[11px] text-[#444] text-center">
              Только авторизованные пользователи могут войти в систему
            </p>
          </div>
        </div>

        <p className="text-center text-[#333] text-xs mt-6 font-medium">
          © 2027 rootvest
        </p>
      </div>
    </div>
  );
}
