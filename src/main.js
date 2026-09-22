import { parseRoute } from './app-core.js';
import { mountSearch } from './search.js';
import { renderGame, renderGames, renderHome, renderInventory, renderNotFound, renderUniverse } from './views.js';

const root = document.querySelector('#app');
let renderToken = 0;

async function render() {
  const token = ++renderToken;
  const route = parseRoute();
  document.body.classList.toggle('inventory-mode', route.name === 'inventory');
  root.innerHTML = '<div class="route-loader" aria-label="Carregando"></div>';
  try {
    if (route.name === 'home') renderHome(root);
    else if (route.name === 'games') renderGames(root);
    else if (route.name === 'universe') await renderUniverse(root, route.params.slug);
    else if (route.name === 'game') await renderGame(root, route.params.slug);
    else if (route.name === 'inventory') renderInventory(root);
    else renderNotFound(root);
  } catch (error) {
    console.error('Render error:', error?.message || 'unknown');
    if (token === renderToken) renderNotFound(root);
  }
  if (token === renderToken) window.scrollTo(0, 0);
}

mountSearch();
window.addEventListener('hashchange', render);
render();
