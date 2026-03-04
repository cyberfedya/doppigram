import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Theme } from '../types';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  accentColor: string;
  setAccentColor: (color: string) => void;
  chatBackground: string;
  setChatBackground: (bg: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const ACCENT_PRESETS: Record<string, Record<string, string>> = {
  '#ffffff': { '--accent': '#ffffff', '--accent-secondary': '#aaaaaa', '--verified': '#ffffff', '--msg-me-bg': '#ffffff', '--msg-me-text': '#000000' },
  '#3b82f6': { '--accent': '#3b82f6', '--accent-secondary': '#60a5fa', '--verified': '#3b82f6', '--msg-me-bg': '#3b82f6', '--msg-me-text': '#ffffff' },
  '#8b5cf6': { '--accent': '#8b5cf6', '--accent-secondary': '#a78bfa', '--verified': '#8b5cf6', '--msg-me-bg': '#8b5cf6', '--msg-me-text': '#ffffff' },
  '#ef4444': { '--accent': '#ef4444', '--accent-secondary': '#f87171', '--verified': '#ef4444', '--msg-me-bg': '#ef4444', '--msg-me-text': '#ffffff' },
  '#22c55e': { '--accent': '#22c55e', '--accent-secondary': '#4ade80', '--verified': '#22c55e', '--msg-me-bg': '#22c55e', '--msg-me-text': '#ffffff' },
  '#f59e0b': { '--accent': '#f59e0b', '--accent-secondary': '#fbbf24', '--verified': '#f59e0b', '--msg-me-bg': '#f59e0b', '--msg-me-text': '#000000' },
  '#ec4899': { '--accent': '#ec4899', '--accent-secondary': '#f472b6', '--verified': '#ec4899', '--msg-me-bg': '#ec4899', '--msg-me-text': '#ffffff' },
  '#06b6d4': { '--accent': '#06b6d4', '--accent-secondary': '#22d3ee', '--verified': '#06b6d4', '--msg-me-bg': '#06b6d4', '--msg-me-text': '#000000' },
};

function applyAccent(color: string, theme: Theme) {
  const el = document.documentElement;
  const preset = ACCENT_PRESETS[color];
  if (preset) {
    Object.entries(preset).forEach(([k, v]) => el.style.setProperty(k, v));
  } else {
    // Custom hex color
    el.style.setProperty('--accent', color);
    el.style.setProperty('--accent-secondary', color);
    el.style.setProperty('--verified', color);
    el.style.setProperty('--msg-me-bg', color);
    // Auto-determine text color based on brightness
    const r = parseInt(color.slice(1, 3), 16), g = parseInt(color.slice(3, 5), 16), b = parseInt(color.slice(5, 7), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    el.style.setProperty('--msg-me-text', brightness > 128 ? '#000000' : '#ffffff');
  }
  // For default white/black accent, use theme defaults
  if (color === '#ffffff' && theme === 'light') {
    el.style.setProperty('--accent', '#000000');
    el.style.setProperty('--accent-secondary', '#555555');
    el.style.setProperty('--verified', '#000000');
    el.style.setProperty('--msg-me-bg', '#000000');
    el.style.setProperty('--msg-me-text', '#ffffff');
  }
}

function clearAccentOverrides() {
  const el = document.documentElement;
  ['--accent', '--accent-secondary', '--verified', '--msg-me-bg', '--msg-me-text'].forEach(k => el.style.removeProperty(k));
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem('doppigram_theme');
    return (stored === 'light' || stored === 'dark') ? stored : 'dark';
  });

  const [accentColor, setAccentColorState] = useState<string>(() => {
    return localStorage.getItem('doppigram_accent') || '#ffffff';
  });

  const [chatBackground, setChatBackgroundState] = useState<string>(() => {
    return localStorage.getItem('doppigram_chat_bg') || '';
  });

  useEffect(() => {
    localStorage.setItem('doppigram_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    // Re-apply accent after theme change
    if (accentColor !== '#ffffff') {
      applyAccent(accentColor, theme);
    } else {
      clearAccentOverrides();
    }
  }, [theme, accentColor]);

  useEffect(() => {
    localStorage.setItem('doppigram_accent', accentColor);
    if (accentColor === '#ffffff') {
      clearAccentOverrides();
    } else {
      applyAccent(accentColor, theme);
    }
  }, [accentColor, theme]);

  useEffect(() => {
    localStorage.setItem('doppigram_chat_bg', chatBackground);
  }, [chatBackground]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  const setAccentColor = (color: string) => setAccentColorState(color);
  const setChatBackground = (bg: string) => setChatBackgroundState(bg);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, accentColor, setAccentColor, chatBackground, setChatBackground }}>
      {children}
    </ThemeContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}
