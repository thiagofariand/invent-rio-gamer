import { gameSeeds, directorySections } from '../catalog-data.js';
import { escapeHtml } from './app-core.js';

const franchiseMap = new Map();
for (const section of directorySections) {
  for (const [name, slug] of section.franchises) if (!franchiseMap.has(slug)) franchiseMap.set(slug, name);
}

export function searchLocal(query) {
  const q = query.trim().toLocaleLowerCase('pt-BR');
  if (q.length < 2) return [];
  const franchises = [...franchiseMap.entries()]
    .filter(([, name]) => name.toLocaleLowerCase('pt-BR').includes(q))
    .map(([slug, name]) => ({ type:'franchise', slug, label:name, meta:'Universo' }));
  const games = gameSeeds
    .filter(game => `${game.name} ${game.year}`.toLocaleLowerCase('pt-BR').includes(q))
    .map(game => ({ type:'game', slug:game.slug, label:`${game.name} (${game.year})`, meta:game.lineage }));
  return [...franchises, ...games].slice(0, 5);
}

export function mountSearch() {
  const input = document.querySelector('#global-search');
  const box = document.querySelector('#search-suggestions');
  if (!input || !box) return;

  const close = () => { box.hidden = true; box.innerHTML = ''; };
  input.addEventListener('input', () => {
    const results = searchLocal(input.value);
    if (!results.length) return close();
    box.innerHTML = results.map((r, index) => `
      <a role="option" id="search-option-${index}" href="#/${r.type === 'game' ? 'jogo' : 'universo'}/${encodeURIComponent(r.slug)}">
        <span>${escapeHtml(r.label)}</span><small>${escapeHtml(r.meta)}</small>
      </a>`).join('');
    box.hidden = false;
  });
  input.addEventListener('keydown', event => { if (event.key === 'Escape') close(); });
  document.addEventListener('click', event => { if (!event.target.closest('[data-search-shell]')) close(); });
  box.addEventListener('click', () => { input.value = ''; close(); });
}
