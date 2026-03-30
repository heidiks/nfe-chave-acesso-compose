const STORAGE_KEY = 'theme';

function getSystemPreference() {
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function getSavedTheme() {
  return localStorage.getItem(STORAGE_KEY);
}

export function initTheme() {
  const saved = getSavedTheme();
  const theme = saved || getSystemPreference();
  applyTheme(theme);
  return theme;
}

export function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(STORAGE_KEY, theme);
}

export function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  return next;
}
