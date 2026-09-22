import { parseRoute } from './app-core.js';
import { mountSearch } from './search.js';
import { renderGame, renderGames, renderHome, renderInventory, renderMerch, renderNotFound, renderTrending, renderUniverse, updateHeaderInventoryCount } from './views.js';

const root = document.querySelector('#app');
let renderToken = 0;

function setRouteMode(route) {
  document.body.classList.toggle('inventory-mode', route.name === 'inventory');
  document.querySelectorAll('.main-nav a, .inventory-link').forEach(link => link.removeAttribute('aria-current'));
  const merchCat = route.query?.get('cat');
  const active = ['games','universe','game'].includes(route.name) ? '.main-nav a[href="#/games"]'
    : route.name === 'merch' && merchCat ? `.main-nav a[href="#/merch?cat=${merchCat}"]`
    : route.name === 'trending' ? '.main-nav a[href="#/em-alta"]'
    : route.name === 'inventory' ? '.inventory-link' : '';
  if (active) document.querySelector(active)?.setAttribute('aria-current','page');
}

async function render() {
  const token = ++renderToken;
  const route = parseRoute();
  setRouteMode(route);
  root.innerHTML = '<div class="route-loader" aria-label="Carregando"></div>';
  try {
    if (route.name === 'home') renderHome(root);
    else if (route.name === 'games') renderGames(root);
    else if (route.name === 'universe') await renderUniverse(root, route.params.slug, route.query);
    else if (route.name === 'game') await renderGame(root, route.params.slug);
    else if (route.name === 'inventory') renderInventory(root);
    else if (route.name === 'merch') renderMerch(root, route.query);
    else if (route.name === 'trending') renderTrending(root);
    else renderNotFound(root);
  } catch (error) {
    console.error('Render error:', error?.message || 'unknown');
    if (token === renderToken) renderNotFound(root);
  }
  updateHeaderInventoryCount();
  if (token === renderToken) window.scrollTo(0, 0);
}

mountSearch();
document.querySelector('[data-mobile-search]')?.addEventListener('click', () => {
  document.querySelector('#global-search')?.focus();
  window.scrollTo({top:0,behavior:'smooth'});
});
window.addEventListener('hashchange', render);
render();
