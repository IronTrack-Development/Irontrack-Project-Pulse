export type Theme = 'dark' | 'light' | 'field';

export function getTheme(): Theme {
  if (typeof window === 'undefined') return 'dark';
  const saved = localStorage.getItem('pulse_theme') as Theme | null;
  return saved === 'light' || saved === 'field' || saved === 'dark' ? saved : 'dark';
}

export function setTheme(theme: Theme) {
  localStorage.setItem('pulse_theme', theme);
  applyTheme(theme);
}

export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.remove('dark-theme', 'light-theme', 'field-theme');
  if (theme === 'light') {
    root.classList.add('light-theme');
  } else if (theme === 'field') {
    root.classList.add('field-theme');
  } else {
    root.classList.add('dark-theme');
  }
}
