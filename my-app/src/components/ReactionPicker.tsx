import { Heart, ThumbsUp, ThumbsDown, Flame, Star, Laugh } from 'lucide-react';

const REACTIONS = [
  { icon: <Heart size={14} />, value: 'heart' },
  { icon: <ThumbsUp size={14} />, value: 'like' },
  { icon: <ThumbsDown size={14} />, value: 'dislike' },
  { icon: <Flame size={14} />, value: 'fire' },
  { icon: <Star size={14} />, value: 'star' },
  { icon: <Laugh size={14} />, value: 'laugh' },
];

export const REACTION_ICONS: Record<string, React.ReactNode> = {
  heart: <Heart size={12} />,
  like: <ThumbsUp size={12} />,
  dislike: <ThumbsDown size={12} />,
  fire: <Flame size={12} />,
  star: <Star size={12} />,
  laugh: <Laugh size={12} />,
};

export function ReactionPicker({ onSelect }: { onSelect: (reaction: string) => void }) {
  return (
    <div className="flex items-center gap-0.5 px-1.5 py-1 rounded-full animate-fadeIn"
      style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--bg-border)', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
      {REACTIONS.map(r => (
        <button key={r.value} onClick={() => onSelect(r.value)}
          className="p-1.5 rounded-full transition-all active:scale-90"
          style={{ color: 'var(--tx-secondary)' }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--accent)'; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--tx-secondary)'; }}>
          {r.icon}
        </button>
      ))}
    </div>
  );
}
