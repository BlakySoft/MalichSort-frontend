export const THEME_KEY = 'malichsort-theme';

export function getPreferredTheme() {
  if (typeof window === 'undefined') return 'dark';

  const saved = window.localStorage.getItem(THEME_KEY);
  if (saved === 'light' || saved === 'dark') return saved;

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function applyTheme(theme) {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  root.classList.toggle('dark', theme === 'dark');
  root.style.colorScheme = theme;

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(THEME_KEY, theme);
  }
}
