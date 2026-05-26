import { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { VerifiedBadge } from './VerifiedBadge';
import { stories as storiesApi } from '../services/api';

interface Story {
  _id: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  text?: string;
  createdAt: number;
  expiresAt: number;
}

interface StoryGroup {
  userId: string;
  username: string;
  displayName?: string;
  avatar?: string;
  isVerified: boolean;
  stories: Story[];
}

export function StoryViewer({ group, currentUserId, onClose }: {
  group: StoryGroup;
  currentUserId: string;
  onClose: () => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);

  const story = group.stories[currentIndex];
  const isOwn = group.userId === currentUserId;
  const DURATION = story?.mediaType === 'video' ? 15000 : 5000;

  useEffect(() => {
    if (!story) return;
    if (group.userId !== currentUserId) {
      storiesApi.view(story._id, currentUserId).catch(() => {});
    }
  }, [story, currentUserId, group.userId]);

  useEffect(() => {
    setProgress(0);
    const startTime = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(elapsed / DURATION, 1);
      setProgress(pct);
      if (pct >= 1) {
        clearInterval(timerRef.current);
        if (currentIndex < group.stories.length - 1) {
          setCurrentIndex(i => i + 1);
        } else {
          onClose();
        }
      }
    }, 50);
    return () => clearInterval(timerRef.current);
  }, [currentIndex, DURATION, group.stories.length, onClose]);

  const goNext = () => {
    clearInterval(timerRef.current);
    if (currentIndex < group.stories.length - 1) setCurrentIndex(i => i + 1);
    else onClose();
  };

  const goPrev = () => {
    clearInterval(timerRef.current);
    if (currentIndex > 0) setCurrentIndex(i => i - 1);
    else setProgress(0);
  };

  const handleDelete = async () => {
    if (!story) return;
    clearInterval(timerRef.current);
    await storiesApi.delete(story._id);
    if (group.stories.length <= 1) {
      onClose();
    } else if (currentIndex >= group.stories.length - 1) {
      setCurrentIndex(i => Math.max(0, i - 1));
    }
  };

  const fmtAgo = (ts: number) => {
    const mins = Math.floor((Date.now() - ts) / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    return `${Math.floor(mins / 60)}h ago`;
  };

  if (!story) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.95)' }}>
      <div className="relative w-full max-w-[420px] h-[85vh] max-h-[750px] rounded-2xl overflow-hidden flex flex-col"
        style={{ backgroundColor: '#000' }}>
        {/* Progress bars */}
        <div className="flex gap-1 px-3 pt-3 pb-1 z-10">
          {group.stories.map((_, i) => (
            <div key={i} className="flex-1 h-[3px] rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
              <div className="h-full rounded-full transition-all duration-100"
                style={{
                  backgroundColor: '#fff',
                  width: i < currentIndex ? '100%' : i === currentIndex ? `${progress * 100}%` : '0%',
                }} />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="flex items-center gap-3 px-3 py-2 z-10">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
            style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: '#fff' }}>
            {(group.displayName || group.username).slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <span className="text-sm font-semibold text-white truncate">{group.displayName || group.username}</span>
              {group.isVerified && <VerifiedBadge size={12} />}
            </div>
            <span className="text-[10px] text-white/50">{fmtAgo(story.createdAt)}</span>
          </div>
          {isOwn && (
            <button onClick={handleDelete} className="p-1.5 rounded-lg transition-all" style={{ color: 'rgba(255,255,255,0.6)' }}>
              <Trash2 size={16} />
            </button>
          )}
          <button onClick={onClose} className="p-1.5 rounded-lg transition-all" style={{ color: 'rgba(255,255,255,0.6)' }}>
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 relative flex items-center justify-center overflow-hidden">
          {story.mediaUrl && story.mediaType === 'image' && (
            <img src={story.mediaUrl} alt="" className="w-full h-full object-contain" />
          )}
          {story.mediaUrl && story.mediaType === 'video' && (
            <video src={story.mediaUrl} autoPlay muted className="w-full h-full object-contain" />
          )}
          {story.text && (
            <div className="absolute inset-0 flex items-center justify-center p-8">
              <p className="text-xl font-bold text-white text-center leading-relaxed"
                style={{ textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
                {story.text}
              </p>
            </div>
          )}
          {!story.mediaUrl && !story.text && (
            <p className="text-white/30 text-sm">No content</p>
          )}

          {/* Tap zones */}
          <button onClick={goPrev} className="absolute left-0 top-0 w-1/3 h-full" />
          <button onClick={goNext} className="absolute right-0 top-0 w-1/3 h-full" />
        </div>

        {/* Navigation arrows */}
        {currentIndex > 0 && (
          <button onClick={goPrev} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center z-10"
            style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
            <ChevronLeft size={18} className="text-white" />
          </button>
        )}
        {currentIndex < group.stories.length - 1 && (
          <button onClick={goNext} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center z-10"
            style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
            <ChevronRight size={18} className="text-white" />
          </button>
        )}
      </div>
    </div>
  );
}
