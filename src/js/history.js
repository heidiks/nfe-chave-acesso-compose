const STORAGE_KEY = 'nfeHistory';
const MAX_ITEMS = 10;

function load() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function save(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function getHistory() {
  return load();
}

export function addToHistory(entry) {
  // entry: { chave, modelo, timestamp }
  const items = load();
  const existingIndex = items.findIndex(item => item.chave === entry.chave);
  if (existingIndex !== -1) {
    items.splice(existingIndex, 1);
  }
  items.unshift({ chave: entry.chave, modelo: entry.modelo, timestamp: Date.now() });
  if (items.length > MAX_ITEMS) {
    items.pop();
  }
  save(items);
}

export function clearHistory() {
  localStorage.removeItem(STORAGE_KEY);
}

export function filterHistory(query) {
  const items = load();
  if (!query) return items;
  const q = query.toLowerCase();
  return items.filter(item =>
    item.chave.includes(q) || (item.modelo || '').toLowerCase().includes(q)
  );
}

export function formatRelativeTime(timestamp) {
  const diff = Date.now() - timestamp;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'agora';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `há ${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours}h`;
  const days = Math.floor(hours / 24);
  return `há ${days}d`;
}
