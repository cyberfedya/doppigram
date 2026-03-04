export function TypingIndicator({ names }: { names: string[] }) {
  if (names.length === 0) return null;
  const text = names.length === 1 ? `${names[0]} is typing` : `${names.length} people typing`;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium" style={{ color: 'var(--accent)' }}>
      {text}
      <span className="inline-flex items-center gap-[3px]">
        <span className="typing-dot w-[4px] h-[4px] rounded-full" style={{ backgroundColor: 'var(--accent)' }} />
        <span className="typing-dot w-[4px] h-[4px] rounded-full" style={{ backgroundColor: 'var(--accent)' }} />
        <span className="typing-dot w-[4px] h-[4px] rounded-full" style={{ backgroundColor: 'var(--accent)' }} />
      </span>
    </span>
  );
}
