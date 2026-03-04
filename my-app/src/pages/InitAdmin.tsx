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

    if (!username.trim() || !password.trim()) {
      setMessage({ type: 'error', text: 'Barcha maydonlar to\'ldirilishi kerak' });
      return;
    }

    if (password.length < 6) {
      setMessage({ type: 'error', text: 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak' });
      return;
    }

    setIsLoading(true);
    
    try {
      await createInitialAdmin({ username, password });
      setMessage({ 
        type: 'success', 
        text: `Admin "${username}" yaratildi! Endi login qilishingiz mumkin.` 
      });
      
      // Автоматический редирект через 2 секунды
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Xatolik: ' + error });
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-600 via-orange-600 to-yellow-600 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Warning Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full shadow-lg mb-4">
            <Key className="h-10 w-10 text-orange-600" />
          </div>
          <h1 className="text-3xl font-bold text-white">Boshlang\'ich Admin</h1>
          <p className="text-orange-100 mt-2">Birinchı adminni yarating</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center gap-2 mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0" />
            <p className="text-sm text-orange-700">
              Bu sahifa faqat bir marta ishlatiladi. Birinchi admin yaratilgandan so\'ng, bu sahifa kerak bo\'lmaydi.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {message && (
              <div className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm ${
                message.type === 'success' 
                  ? 'bg-green-50 border border-green-200 text-green-600' 
                  : 'bg-red-50 border border-red-200 text-red-600'
              }`}>
                {message.type === 'success' ? (
                  <CheckCircle className="h-4 w-4 flex-shrink-0" />
                ) : null}
                {message.text}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Admin logini
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                placeholder="admin"
                disabled={isLoading}
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Parol
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                placeholder="Kamida 6 ta belgi"
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-orange-600 to-red-600 text-white py-3 rounded-lg font-medium hover:from-orange-700 hover:to-red-700 focus:ring-4 focus:ring-orange-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <UserPlus className="h-5 w-5" />
              {isLoading ? 'Yaratilmoqda...' : 'Admin yaratish'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              Yaratilgandan so\'ng, /login sahifasiga o\'tiladi
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
