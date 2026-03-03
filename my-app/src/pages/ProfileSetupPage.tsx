import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { User, Upload, Check, X, Image as ImageIcon, Sparkles } from 'lucide-react';

const EMOJI_AVATARS = ['🧑', '👨', '👩', '🧔', '👱', '🧒', '🦊', '🐱', '🐶', '🦁', '🐯', '🐼', '🐨', '🐸', '🦄', '🤖'];

export function ProfileSetupPage() {
  const navigate = useNavigate();
  const { auth, completeOnboarding } = useApp();
  const [username, setUsername] = useState(auth.user?.username || '');
  const [avatar, setAvatar] = useState(auth.user?.avatar || '');
  const [avatarType, setAvatarType] = useState<'emoji' | 'image'>(
    auth.user?.avatarType || 'emoji'
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleEmojiSelect = (emoji: string) => {
    setAvatar(emoji);
    setAvatarType('emoji');
    setError('');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Выберите изображение');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Размер файла не должен превышать 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setAvatar(result);
      setAvatarType('image');
      setError('');
    };
    reader.onerror = () => {
      setError('Ошибка загрузки изображения');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    setError('');

    if (!username.trim()) {
      setError('Введите имя пользователя');
      return;
    }

    if (username.length < 3) {
      setError('Имя должно быть не менее 3 символов');
      return;
    }

    if (!avatar) {
      setError('Выберите аватар');
      return;
    }

    setIsLoading(true);
    const success = await completeOnboarding(username.trim(), avatar, avatarType);
    setIsLoading(false);

    if (success) {
      navigate('/chats');
    } else {
      setError('Ошибка сохранения профиля. Попробуйте ещё раз.');
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a10] flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-[#6c3de5] to-[#3d8ef5] mb-4 shadow-[0_8px_32px_rgba(108,61,229,0.4)]">
            <User size={40} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-[#f0f0f8] mb-2">Настройте профиль</h1>
          <p className="text-sm text-[#5a5a88]">Расскажите немного о себе</p>
        </div>

        {/* Card */}
        <div className="bg-[#13131c] border border-[#1e1e2c] rounded-3xl p-8 space-y-6">
          
          {/* Avatar Preview */}
          <div className="flex flex-col items-center">
            <div className="relative mb-4">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#6c3de5] to-[#3d8ef5] flex items-center justify-center overflow-hidden shadow-[0_8px_32px_rgba(108,61,229,0.4)]">
                {avatarType === 'image' && avatar ? (
                  <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-6xl">{avatar || '🧑'}</span>
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-11 h-11 rounded-full bg-[#4a6cf7] border-4 border-[#13131c] flex items-center justify-center text-white hover:bg-[#3a5ce5] transition-colors shadow-lg"
              >
                <Upload size={18} />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-xs text-[#4a6cf7] font-medium hover:text-[#6888ff] transition-colors flex items-center gap-1.5"
            >
              <ImageIcon size={14} />
              Загрузить фото
            </button>
          </div>

          {/* Username Input */}
          <div>
            <label className="text-sm text-[#8888b0] mb-2 block">Имя пользователя</label>
            <div className="relative">
              <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#40405e]" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="@username"
                className="w-full bg-[#1a1a2c] border border-[#28283c] rounded-xl py-3.5 pl-12 pr-4 text-[#d0d0ec] placeholder-[#34344e] focus:border-[#4a6cf7] focus:shadow-[0_0_0_3px_rgba(74,108,247,0.1)] transition-all"
              />
            </div>
            <p className="text-xs text-[#48487a] mt-2">
              Это имя будет видно другим пользователям
            </p>
          </div>

          {/* Emoji Selector */}
          <div>
            <label className="text-sm text-[#8888b0] mb-3 block flex items-center gap-2">
              <Sparkles size={14} className="text-[#4a6cf7]" />
              Или выберите эмодзи
            </label>
            <div className="grid grid-cols-8 gap-2">
              {EMOJI_AVATARS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleEmojiSelect(emoji)}
                  className={`w-11 h-11 rounded-xl flex items-center justify-center text-2xl transition-all ${
                    avatar === emoji && avatarType === 'emoji'
                      ? 'bg-[#1a2240] border-2 border-[#4a6cf7] shadow-[0_0_0_2px_rgba(74,108,247,0.3)]'
                      : 'bg-[#1a1a2c] border border-[#28283c] hover:bg-[#22223a] hover:border-[#4a6cf7]'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 bg-[rgba(224,80,80,0.1)] border border-[rgba(224,80,80,0.2)] rounded-xl px-4 py-3">
              <X size={16} className="text-[#e06060] flex-shrink-0" />
              <p className="text-sm text-[#e06060]">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-br from-[#4a6cf7] to-[#3a5ce5] text-white rounded-2xl font-semibold border border-[#4a6cf7] shadow-[0_4px_14px_rgba(74,108,247,0.35)] hover:-translate-y-0.5 hover:shadow-[0_6px_18px_rgba(74,108,247,0.45)] transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0"
            >
              <Check size={20} />
              {isLoading ? 'Сохранение...' : 'Готово'}
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-[#2e2e48] mt-6">
          Нажмите «Готово», чтобы продолжить
        </p>
      </div>
    </div>
  );
}
