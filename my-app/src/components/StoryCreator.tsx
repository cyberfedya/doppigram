import { useState, useRef } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { X, Image, Send, Type } from 'lucide-react';

export function StoryCreator({ userId, onClose }: {
  userId: Id<'users'>;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<'text' | 'media'>('text');
  const [text, setText] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createStoryMut = useMutation(api.stories.createStory);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);

  const handleFileSelect = (f: File) => {
    setFile(f);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(f);
    setMode('media');
  };

  const handlePost = async () => {
    if (isUploading) return;
    setIsUploading(true);

    try {
      if (file) {
        const uploadUrl = await generateUploadUrl();
        const resp = await fetch(uploadUrl, { method: 'POST', headers: { 'Content-Type': file.type }, body: file });
        const { storageId } = await resp.json() as { storageId: string };
        const mediaType = file.type.startsWith('video/') ? 'video' : 'image';
        await createStoryMut({ userId, storageId: storageId as Id<'_storage'>, mediaType, text: text || undefined });
      } else if (text.trim()) {
        await createStoryMut({ userId, text: text.trim() });
      }
      onClose();
    } catch (err) {
      console.error('Story creation error:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const canPost = file !== null || text.trim().length > 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.9)' }}>
      <div className="relative w-full max-w-[420px] h-[85vh] max-h-[750px] rounded-2xl overflow-hidden flex flex-col"
        style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--bg-border)' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--bg-border)' }}>
          <h2 className="text-sm font-bold" style={{ color: 'var(--tx-primary)' }}>New Story</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg transition-all" style={{ color: 'var(--tx-dim)' }}>
            <X size={18} />
          </button>
        </div>

        {/* Mode tabs */}
        <div className="flex gap-2 px-4 py-2" style={{ borderBottom: '1px solid var(--bg-border)' }}>
          <button onClick={() => setMode('text')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={mode === 'text' ? { backgroundColor: 'var(--accent)', color: 'var(--msg-me-text)' } : { backgroundColor: 'var(--bg-card)', color: 'var(--tx-secondary)' }}>
            <Type size={13} /> Text
          </button>
          <button onClick={() => { setMode('media'); fileInputRef.current?.click(); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={mode === 'media' ? { backgroundColor: 'var(--accent)', color: 'var(--msg-me-text)' } : { backgroundColor: 'var(--bg-card)', color: 'var(--tx-secondary)' }}>
            <Image size={13} /> Media
          </button>
        </div>

        {/* Content area */}
        <div className="flex-1 flex flex-col items-center justify-center p-4 overflow-hidden">
          {mode === 'text' && !preview && (
            <textarea value={text} onChange={e => setText(e.target.value)}
              placeholder="Type your story..."
              className="w-full h-full bg-transparent resize-none text-center text-lg font-semibold leading-relaxed"
              style={{ color: 'var(--tx-primary)' }}
              maxLength={500} autoFocus />
          )}
          {preview && (
            <div className="relative w-full flex-1 rounded-xl overflow-hidden flex items-center justify-center" style={{ backgroundColor: '#000' }}>
              {file?.type.startsWith('video/') ? (
                <video src={preview} controls className="max-w-full max-h-full object-contain" />
              ) : (
                <img src={preview} alt="Preview" className="max-w-full max-h-full object-contain" />
              )}
              <button onClick={() => { setPreview(null); setFile(null); setMode('text'); }}
                className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center"
                style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
                <X size={14} className="text-white" />
              </button>
            </div>
          )}
          {mode === 'media' && preview && (
            <input type="text" value={text} onChange={e => setText(e.target.value)}
              placeholder="Add a caption..."
              className="w-full mt-3 px-3 py-2 rounded-xl text-sm themed-border"
              style={{ backgroundColor: 'var(--bg-input)', color: 'var(--tx-primary)' }} />
          )}
        </div>

        {/* Post button */}
        <div className="px-4 py-3" style={{ borderTop: '1px solid var(--bg-border)' }}>
          <button onClick={handlePost} disabled={!canPost || isUploading}
            className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-40"
            style={{ backgroundColor: 'var(--accent)', color: 'var(--msg-me-text)' }}>
            {isUploading ? (
              <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(0,0,0,0.2)', borderTopColor: 'var(--msg-me-text)' }} />
            ) : (
              <><Send size={15} /> Post Story</>
            )}
          </button>
        </div>

        <input ref={fileInputRef} type="file" accept="image/*,video/*" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); e.target.value = ''; }} />
      </div>
    </div>
  );
}
