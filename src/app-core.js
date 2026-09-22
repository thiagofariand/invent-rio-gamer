export function escapeHtml(value = '') {
  return String(value).replace(/[&<>'"]/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[char]));
}

export function slugify(value = '') {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function parseRoute(hash = window.location.hash) {
  const raw = (hash || '#/').replace(/^#/, '');
  const [path, queryString = ''] = raw.split('?');
  const parts = path.split('/').filter(Boolean).map(decodeURIComponent);
  const query = new URLSearchParams(queryString);
  if (!parts.length) return { name:'home', params:{}, query };
  if (parts[0] === 'games') return { name:'games', params:{}, query };
  if (parts[0] === 'universo' && parts[1]) return { name:'universe', params:{ slug:parts[1] }, query };
  if (parts[0] === 'jogo' && parts[1]) return { name:'game', params:{ slug:parts[1] }, query };
  if (parts[0] === 'inventario') return { name:'inventory', params:{}, query };
  if (parts[0] === 'merch') return { name:'merch', params:{}, query };
  if (parts[0] === 'em-alta') return { name:'trending', params:{}, query };
  return { name:'notFound', params:{}, query };
}

export function formatYear(timestamp) {
  if (!timestamp) return null;
  return new Date(timestamp * 1000).getUTCFullYear();
}

export function imageUrl(imageId, size = 'cover_big') {
  return imageId ? `https://images.igdb.com/igdb/image/upload/t_${size}/${imageId}.jpg` : '';
}

export async function fetchJson(url, options = {}) {
  const response = await fetch(url, { headers:{ Accept:'application/json', ...(options.headers || {}) }, ...options });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data?.error?.message || data?.message || `HTTP ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return data;
}

export function setDocumentTitle(title) {
  document.title = title ? `${title} — Inventário Gamer` : 'Inventário Gamer';
}

export function showToast(message) {
  const root = document.querySelector('#toast-root');
  if (!root) return;
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = message;
  root.appendChild(el);
  setTimeout(() => el.remove(), 2600);
}
