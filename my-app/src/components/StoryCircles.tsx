import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Plus } from 'lucide-react';
import { StoryViewer } from './StoryViewer';
import { StoryCreator } from './StoryCreator';
import { VerifiedBadge } from './VerifiedBadge';
import { stories as storiesApi, type ApiStoryGroup } from '../services/api';

type StoryGroup = Omit<ApiStoryGroup, 'stories'> & {
  stories: Array<{ _id: string; mediaUrl?: string; mediaType?: 'image' | 'video'; text?: string; createdAt: number; expiresAt: number }>;
};

function StoryAvatar({ name, hasUnviewed, size = 52 }: { name: string; hasUnviewed: boolean; size?: number }) {
  const initials = name.slice(0, 2).toUpperCase();
  return (
    <div className="rounded-full flex items-center justify-center font-semibold transition-colors"
      style={{
        width: size, height: size,
        border: `2px solid ${hasUnviewed ? 'var(--accent)' : 'var(--bg-border)'}`,
        backgroundColor: 'var(--bg-card)',
        color: 'var(--tx-primary)',
        fontSize: size > 48 ? 13 : 11,
        letterSpacing: '0.02em',
      }}>
      {initials}
    </div>
  );
}

export function StoryCircles() {
  const { auth } = useApp();
  const currentUserId = auth.user?.id;
  const [storyGroups, setStoryGroups] = useState<StoryGroup[] | undefined>(undefined);
  const [viewingGroup, setViewingGroup] = useState<StoryGroup | null>(null);
  const [showCreator, setShowCreator] = useState(false);

  const loadStories = () => {
    if (!currentUserId) return;
    storiesApi.getActive(currentUserId).then(groups =>
      setStoryGroups(groups.map(g => ({
        ...g,
        stories: g.stories.map(s => ({ ...s, _id: s.id, mediaType: s.mediaType as 'image' | 'video' | undefined }))
      })))
    ).catch(() => setStoryGroups([]));
  };

  useEffect(() => { loadStories(); }, [currentUserId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!currentUserId) return null;

  const myStories = storyGroups?.find(g => g.userId === currentUserId);
  const otherStories = storyGroups?.filter(g => g.userId !== currentUserId) ?? [];
  const hasStories = myStories || otherStories.length > 0;

  if (!hasStories && !storyGroups) return null;

  const myName = auth.user?.displayName || auth.user?.username || 'You';

  return (
    <>
      <div className="flex items-center gap-2 px-3 py-2.5 overflow-x-auto flex-shrink-0"
        style={{ borderBottom: '1px solid var(--bg-border)' }}>
        {/* My story */}
        <button onClick={() => myStories ? setViewingGroup(myStories) : setShowCreator(true)}
          className="flex flex-col items-center gap-1 flex-shrink-0 group">
          <div className="relative">
            <StoryAvatar name={myName} hasUnviewed={!!myStories} size={52} />
            {!myStories && (
              <div className="absolute -bottom-0.5 -right-0.5 w-[18px] h-[18px] rounded-full flex items-center justify-center"
                style={{ backgroundColor: 'var(--accent)', border: '2px solid var(--bg-panel)' }}>
                <Plus size={9} style={{ color: 'var(--msg-me-text)' }} strokeWidth={3} />
              </div>
            )}
          </div>
          <span className="text-[10px] font-medium truncate max-w-[56px]" style={{ color: 'var(--tx-muted)' }}>
            You
          </span>
        </button>

        {/* Others */}
        {otherStories.map(group => {
          const name = group.displayName || group.username;
          return (
            <button key={group.userId} onClick={() => setViewingGroup(group)}
              className="flex flex-col items-center gap-1 flex-shrink-0">
              <StoryAvatar name={name} hasUnviewed={!group.allViewed} size={52} />
              <span className="text-[10px] font-medium truncate max-w-[56px] flex items-center gap-0.5" style={{ color: 'var(--tx-muted)' }}>
                {name.split(' ')[0]}
                {group.isVerified && <VerifiedBadge size={9} />}
              </span>
            </button>
          );
        })}

        {/* Add new story */}
        {myStories && (
          <button onClick={() => setShowCreator(true)}
            className="flex flex-col items-center gap-1 flex-shrink-0">
            <div className="w-[52px] h-[52px] rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'var(--bg-card)', border: '1.5px solid var(--bg-border)' }}>
              <Plus size={18} style={{ color: 'var(--tx-dim)' }} />
            </div>
            <span className="text-[10px] font-medium" style={{ color: 'var(--tx-dim)' }}>New</span>
          </button>
        )}
      </div>

      {viewingGroup && (
        <StoryViewer
          group={viewingGroup}
          currentUserId={currentUserId}
          onClose={() => setViewingGroup(null)}
        />
      )}

      {showCreator && currentUserId && (
        <StoryCreator
          userId={currentUserId}
          onClose={() => setShowCreator(false)}
        />
      )}
    </>
  );
}
