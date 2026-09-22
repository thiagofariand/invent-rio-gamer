import {
  directorySections, featuredGameSlugs, gameSeeds, lineageLabels,
  getContextCount, getFranchiseSeed, getFranchiseTheme, getGameSeed
} from '../catalog-data.js';
import { demoMerch, demoFanMade } from '../mock-data.js';
import { escapeHtml, fetchJson, setDocumentTitle, showToast } from './app-core.js';
import { getGameState, readInventory, setGameStatus, toggleAlert } from './inventory.js';

function shell(content, className = '') { return `<div class="page ${className}">${content}</div>`; }
function breadcrumb(items) {
  return `<nav class="breadcrumb" aria-label="Breadcrumb">${items.map((item, i) => item.href
    ? `<a href="${item.href}">${escapeHtml(item.label)}</a>${i < items.length - 1 ? '<span>/</span>' : ''}`
    : `<span aria-current="page">${escapeHtml(item.label)}</span>`).join('')}</nav>`;
}
function lineageBadge(lineage) { return `<span class="lineage-badge lineage-${escapeHtml(lineage)}">${escapeHtml(lineageLabels[lineage] || lineage)}</span>`; }
function loadingImage(kind='cover') { return `<div class="media-placeholder ${kind}" aria-hidden="true"><span>IG</span></div>`; }
function gameLink(game) { return `#/jogo/${encodeURIComponent(game.slug)}`; }
function universeLink(slug, tab='') { return `#/universo/${encodeURIComponent(slug)}${tab ? `?tab=${encodeURIComponent(tab)}` : ''}`; }

function marketSearchUrl(provider, query) {
  const q = encodeURIComponent(query);
  if (provider === 'Mercado Livre') return `https://lista.mercadolivre.com.br/${q}`;
  if (provider === 'OLX') return `https://www.olx.com.br/brasil?q=${q}`;
  if (provider === 'Amazon') return `https://www.amazon.com.br/s?k=${q}`;
  if (provider === 'Shopee') return `https://shopee.com.br/search?keyword=${q}`;
  return '#/games';
}

function marketShortcuts(query) {
  return `<div class="market-shortcuts">
    <div class="shortcut-group"><h3>Físico no Brasil</h3><div>${['Mercado Livre','OLX','Amazon'].map(name => `<a href="${marketSearchUrl(name, query)}" target="_blank" rel="noopener noreferrer">${name} ↗</a>`).join('')}</div></div>
    <div class="shortcut-group"><h3>Colecionáveis e merch</h3><div>${['Mercado Livre','Shopee'].map(name => `<a href="${marketSearchUrl(name, `${query} colecionável`)}" target="_blank" rel="noopener noreferrer">${name} ↗</a>`).join('')}</div></div>
    <div class="shortcut-group"><h3>Fan-made e artesanais</h3><div>${['Shopee','Mercado Livre'].map(name => `<a href="${marketSearchUrl(name, `${query} artesanal`)}" target="_blank" rel="noopener noreferrer">${name} ↗</a>`).join('')}</div></div>
  </div>`;
}

function externalSearchUrl(provider, query) {
  const q = encodeURIComponent(query);
  if (provider === 'Mercado Livre') return `https://lista.mercadolivre.com.br/${q}`;
  if (provider === 'OLX') return `https://www.olx.com.br/brasil?q=${q}`;
  if (provider === 'Enjoei') return `https://www.enjoei.com.br/s?q=${q}`;
  if (provider === 'Amazon') return `https://www.amazon.com.br/s?k=${q}`;
  if (provider === 'Shopee') return `https://shopee.com.br/search?keyword=${q}`;
  if (provider === 'eBay') return `https://www.ebay.com/sch/i.html?_nkw=${q}`;
  if (provider === 'Etsy') return `https://www.etsy.com/search?q=${q}`;
  return '#/games';
}

function storeButton(provider, query, label = provider) {
  return `<a href="${externalSearchUrl(provider, query)}" target="_blank" rel="noopener noreferrer">${escapeHtml(label)} ↗</a>`;
}

function digitalStoreLinks(seed) {
  const q = encodeURIComponent(seed.name);
  const platforms = seed.platforms.join(' ').toLowerCase();
  const links = [];
  if (/playstation|ps[1-5]/.test(platforms)) links.push(`<a href="https://store.playstation.com/pt-br/search/${q}" target="_blank" rel="noopener noreferrer">PlayStation Store ↗</a>`);
  if (/nintendo|switch|gamecube|wii|game boy|n64/.test(platforms)) links.push(`<a href="https://www.nintendo.com/pt-br/search/#q=${q}" target="_blank" rel="noopener noreferrer">Nintendo Store ↗</a>`);
  if (/pc|windows|steam/.test(platforms)) links.push(`<a href="https://www.nuuvem.com/br-pt/catalog/page/1/search/${q}" target="_blank" rel="noopener noreferrer">Nuuvem ↗</a>`);
  if (!links.length) links.push(`<a href="https://www.nuuvem.com/br-pt/catalog/page/1/search/${q}" target="_blank" rel="noopener noreferrer">Nuuvem ↗</a>`);
  return links.join('');
}

function compactGameCard(game) {
  return `<a class="catalog-card hydrate-game" href="${gameLink(game)}" data-query="${escapeHtml(game.igdbQuery)}" data-year="${game.year}">
    <div class="card-cover pixel-cover">${loadingImage()}</div>
    <div class="catalog-card-title">${escapeHtml(game.name)}</div>
    <div class="catalog-card-meta">${game.year} · ${escapeHtml(game.platforms[0] || '')}</div>
    <div class="catalog-card-tags">${lineageBadge(game.lineage)}${game.retro ? '<span class="retro-badge">Retrô</span>' : ''}</div>
    <span class="catalog-card-cta">Ver o jogo →</span>
  </a>`;
}

export function renderHome(root) {
  setDocumentTitle('');
  const featured = featuredGameSlugs.map(getGameSeed).filter(Boolean);
  const top = featured.slice(0, 3);
  const rest = featured.slice(3);
  const shelf = [
    { title:'Jogos usados', context:'Mídia física no mercado nacional', label:'USADOS', href:'#/games', tone:'used' },
    { title:'Novos', context:'Lançamentos e reposições', label:'NOVOS', href:'#/games', tone:'new' },
    { title:'Retrogamer', context:'N64, PS1, Mega Drive e mais', label:'RETRÔ', href:'#/universo/sonic-the-hedgehog?tab=retro', tone:'retro' }
  ];
  const merch = [
    { title:'Amiibo', context:'Colecionáveis oficiais', label:'AMIIBO', href:'#/merch?cat=colecionaveis', tone:'amiibo' },
    { title:'Decoração', context:'Quadros, placas e luminárias', label:'MERCH', href:'#/merch?cat=merch', tone:'decor' },
    { title:'Artesanais', context:'Fan-made e criações de fãs', label:'FAN-MADE', href:'#/merch?cat=fanmade', tone:'fanmade' }
  ];
  const shelfCard = item => `<a class="home-shelf-card" href="${item.href}">
    <div class="home-shelf-art tone-${item.tone}"><span>${escapeHtml(item.label)}</span></div>
    <strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.context)}</small><span class="home-card-cta">Ver mais →</span>
  </a>`;

  root.innerHTML = shell(`
    <div class="home-classic-grid">
      <section class="home-panel home-panel-trending" aria-labelledby="home-trending-title">
        <div class="home-panel-head"><h2 id="home-trending-title">Em alta</h2><a href="#/em-alta">Ver tudo</a></div>
        <div class="home-panel-body">
          <div class="home-cards-three">${top.map(game => `<a class="home-trend-card hydrate-game" href="${gameLink(game)}" data-query="${escapeHtml(game.igdbQuery)}" data-year="${game.year}">
            <div class="card-cover pixel-cover">${loadingImage()}</div><strong>${escapeHtml(game.name)}</strong><small>${escapeHtml(lineageLabels[game.lineage])}${game.retro ? ' · Retrô' : ''}</small><span class="home-card-cta">Ver mais →</span>
          </a>`).join('')}</div>
          ${rest.length ? `<div class="home-also"><h3>Também em alta</h3>${rest.map(game => `<a href="${gameLink(game)}"><span>${escapeHtml(game.name)}</span><small>${game.year} · ${escapeHtml(lineageLabels[game.lineage])}</small></a>`).join('')}</div>` : ''}
          <p class="home-fine">Seleção do catálogo. Capas são hidratadas pela IGDB; preço só aparece quando existe fonte comercial válida.</p>
        </div>
      </section>
      <section class="home-panel" aria-labelledby="home-games-title"><div class="home-panel-head"><h2 id="home-games-title">Games e ofertas</h2><a href="#/games">Ver universos</a></div><div class="home-panel-body"><div class="home-cards-three">${shelf.map(shelfCard).join('')}</div></div></section>
      <section class="home-panel" aria-labelledby="home-merch-title"><div class="home-panel-head"><h2 id="home-merch-title">Merch &amp; fan-made</h2><a href="#/merch">Ver tudo</a></div><div class="home-panel-body"><div class="home-cards-three">${merch.map(shelfCard).join('')}</div></div></section>
    </div>
  `, 'home-page');
  hydrateGameCards(root);
}

export function renderGames(root) {
  setDocumentTitle('Games');
  root.innerHTML = shell(`
    ${breadcrumb([{label:'Início', href:'#/'},{label:'Games'}])}
    <header class="page-heading compact-heading"><h1>Games</h1><p>Escolha um universo. Retrô é um recorte do catálogo, não uma plataforma separada: o contador considera apenas os lançamentos retrô daquele universo.</p></header>
    <section class="directory-list">${directorySections.map(section => `<article class="directory-row" style="--section-color:${section.color}">
      <div class="directory-brand">${section.icon ? `<img src="${section.icon}" alt="" />` : `<span class="brand-word">${escapeHtml(section.brandText)}</span>`}<div><strong>${escapeHtml(section.title)}</strong><small>${escapeHtml(section.subtitle)}</small></div></div>
      <div class="franchise-chips">${section.franchises.map(([name, slug]) => { const count = getContextCount(slug, section.id); return `<a href="${universeLink(slug, section.id === 'retro' ? 'retro' : '')}" class="franchise-chip"><span>${escapeHtml(name)}</span>${count != null ? `<small title="Jogos catalogados neste contexto">${count}</small>` : ''}</a>`; }).join('')}</div>
    </article>`).join('')}</section>
  `, 'games-page');
}

function filterUniverseGames(games, tab) {
  if (tab === 'original') return games.filter(game => game.lineage === 'original');
  if (tab === 'remake') return games.filter(game => game.lineage === 'remake');
  if (tab === 'retro') return games.filter(game => game.retro);
  return games;
}

export async function renderUniverse(root, slug, query = new URLSearchParams()) {
  const theme = getFranchiseTheme(slug);
  const allGames = getFranchiseSeed(slug).sort((a,b) => a.year - b.year);
  const tab = query.get('tab') || 'tudo';
  const games = filterUniverseGames(allGames, tab);
  const tabs = [['tudo','Tudo'],['games','Games'],['original','Originais'],['remake','Remakes'],['retro','Retrô']];
  setDocumentTitle(`Universo ${theme.title}`);

  root.innerHTML = shell(`
    ${breadcrumb([{label:'Início',href:'#/'},{label:'Games',href:'#/games'},{label:`Universo ${theme.title}`}])}
    <section class="universe-hero theme-${theme.style}" style="--accent:${theme.accent};--focus:${theme.focus}">
      <div class="hero-backdrop" data-universe-hero>${loadingImage('hero')}</div>
      <div class="universe-hero-copy"><p class="universe-kicker">UNIVERSO</p><h1>${escapeHtml(theme.title)}</h1><p>${allGames.length ? `${allGames.length} jogo${allGames.length === 1 ? '' : 's'} catalogado${allGames.length === 1 ? '' : 's'}.` : 'Catálogo em preenchimento.'}</p></div>
    </section>
    <nav class="universe-tabs" aria-label="Filtros do universo">${tabs.map(([key,label]) => `<a href="${universeLink(slug,key)}" aria-current="${tab === key ? 'page' : 'false'}">${label}</a>`).join('')}</nav>
    <div class="universe-status" data-universe-status>Identidade visual: carregando IGDB…</div>
    <section class="universe-content">
      <h2>${tab === 'retro' ? 'Catálogo retrô' : tab === 'remake' ? 'Remakes' : tab === 'original' ? 'Originais' : 'Games'}</h2>
      ${games.length ? `<div class="universe-grid">${games.map(compactGameCard).join('')}</div>` : `<div class="empty-state compact-empty"><strong>Nenhum título desta categoria catalogado ainda.</strong><p>A página continua disponível enquanto a curadoria local é preenchida.</p></div>`}
    </section>
    <section class="store-search"><h2>Buscar nas lojas</h2><p>Atalhos para pesquisas externas. O Inventário não transforma resultado de busca em preço validado.</p>${marketShortcuts(theme.title)}</section>
  `, 'universe-page');

  hydrateGameCards(root);
  try {
    const data = await fetchJson(`/api/igdb/franchise?q=${encodeURIComponent(theme.title)}`);
    const hero = root.querySelector('[data-universe-hero]');
    if (hero && data.hero?.url) hero.innerHTML = `<img src="${data.hero.url}" alt="" style="object-position:${escapeHtml(theme.focus)}" />`;
    const status = root.querySelector('[data-universe-status]');
    if (status) status.textContent = data.games?.length ? `IGDB relacionada: ${data.games.length} registros · catálogo exibido: curadoria local` : 'Curadoria local ativa';
  } catch {
    const status = root.querySelector('[data-universe-status]');
    if (status) status.textContent = 'Curadoria local · IGDB indisponível agora';
  }
}

function commerceTile(title, items, kind, query) {
  if (!items?.length) return '';
  const item = items[0];
  const links = kind === 'merch'
    ? [storeButton('Mercado Livre', `${query} colecionável`), storeButton('Shopee', `${query} colecionável`), storeButton('eBay', `${query} collectible`)].join('')
    : [storeButton('Etsy', `${query} artesanal`), storeButton('Mercado Livre', `${query} artesanal`), storeButton('Shopee', `${query} artesanal`)].join('');
  return `<article class="commerce-tile commerce-${kind}">
    <h3>${escapeHtml(title)}</h3>
    <div class="commerce-art"><span>${kind === 'merch' ? 'MERCH' : 'FAN-MADE'}</span></div>
    <div class="commerce-tile-copy"><p>${escapeHtml(item.title)}</p><small>${escapeHtml(item.note || 'Categoria curada; disponibilidade depende da loja de origem.')}</small></div>
    <div class="commerce-link-row">${links}</div>
  </article>`;
}

function gameSkeleton(seed, theme) {
  const state = getGameState(seed.slug);
  const familyName = seed.name.replace(/[:].*$/,'');
  const related = getFranchiseSeed(seed.franchise).filter(g => g.slug !== seed.slug && g.name.replace(/[:].*$/,'') === familyName);
  const merch = demoMerch[seed.slug] || [];
  const fanMade = demoFanMade[seed.slug] || [];
  const commerceCount = Number(Boolean(merch.length)) + Number(Boolean(fanMade.length));
  const physicalQuery = `${seed.name} ${seed.year}`;
  return `
    ${breadcrumb([{label:'Início',href:'#/'},{label:'Games',href:'#/games'},{label:`Universo ${theme.title}`,href:universeLink(seed.franchise)},{label:`${seed.name} (${seed.year})`}])}
    <section class="game-hero theme-${theme.style}" style="--accent:${theme.accent};--focus:${theme.focus || 'center'}">
      <div class="game-hero-media" data-game-hero>${loadingImage('hero')}</div><div class="game-hero-overlay"></div>
      <div class="game-hero-copy"><div class="hero-badges">${lineageBadge(seed.lineage)}${seed.retro ? '<span class="retro-badge">Retrô</span>' : ''}</div><h1>${escapeHtml(seed.name)}</h1><p>${escapeHtml(theme.title)} · ${escapeHtml(seed.platforms.join(' · '))} · ${seed.year}</p>
        <div class="hero-actions"><a class="btn primary" href="#physical-offers">Físico no Brasil ↗</a><a class="btn ghost" href="#digital-offers">Digital / oficial ↗</a><a class="btn ghost" href="${universeLink(seed.franchise)}">Universo ${escapeHtml(theme.title)} →</a></div>
      </div>
    </section>
    <p class="game-source-note">Dados visuais e metadados vêm da IGDB. Preços só aparecem quando uma fonte comercial válida responde; atalhos sem preço apenas abrem a busca da loja.</p>
    ${related.length ? `<section class="lineage-context compact-lineage"><strong>Mesma linhagem, versões diferentes:</strong><div>${related.map(g => `<a href="${gameLink(g)}">${escapeHtml(g.name)} (${g.year}) ${lineageBadge(g.lineage)}${g.retro ? '<span class="retro-badge">Retrô</span>' : ''}</a>`).join('')}</div></section>` : ''}
    <h2 class="game-market-title">Buscar nas lojas</h2>
    <section class="game-commerce-layout side-count-${commerceCount}">
      <article class="purchase-module">
        <div class="purchase-cover pixel-cover" data-game-cover>${loadingImage()}</div>
        <div class="purchase-main">
          <div class="purchase-heading"><p class="micro-label">COMPRAR O JOGO</p><h2>${escapeHtml(seed.name)}</h2><div class="platform-pills">${seed.platforms.map(p => `<span>${escapeHtml(p)}</span>`).join('')}</div></div>
          <section class="buy-source-section" id="physical-offers"><div class="buy-section-head"><h3>Físico</h3><p class="offer-status" data-offer-status>Consultando ofertas reais…</p></div>
            <div class="offer-columns" data-offers><div class="offer-empty compact-offer"><strong>Carregando Mercado Livre</strong><p>Nenhum preço de demonstração será mostrado como valor real.</p></div></div>
            <div class="buy-link-row">${storeButton('Mercado Livre', physicalQuery)}${storeButton('OLX', physicalQuery)}${storeButton('Enjoei', physicalQuery)}</div>
          </section>
          <section class="buy-source-section" id="digital-offers"><div class="buy-section-head"><h3>Digital</h3><p>Links oficiais/de loja, sem preço inventado.</p></div><div class="buy-link-row">${digitalStoreLinks(seed)}</div></section>
        </div>
      </article>
      ${commerceTile('Colecionáveis e merch', merch, 'merch', seed.name)}
      ${commerceTile('Fan-made e artesanais', fanMade, 'fanmade', seed.name)}
    </section>
    <section class="inventory-cta"><div><span class="inventory-kicker">MEU INVENTÁRIO</span><h2>Tenho, Quero ou acompanhar?</h2><p>“Tenho” e “Quero” são estados; alerta é uma ação independente.</p></div><div class="inventory-buttons"><button data-status="have" class="inventory-action ${state.status === 'have' ? 'active':''}">Tenho</button><button data-status="want" class="inventory-action ${state.status === 'want' ? 'active':''}">Quero</button><button data-alert class="${state.alert ? 'active':''}">${state.alert ? 'Alerta ativo' : 'Criar alerta'}</button></div></section>`;
}

export async function renderGame(root, slug) {
  const seed = getGameSeed(slug);
  if (!seed) return renderNotFound(root);
  const theme = getFranchiseTheme(seed.franchise);
  setDocumentTitle(`${seed.name} (${seed.year})`);
  root.innerHTML = shell(gameSkeleton(seed, theme), 'game-page');
  mountInventoryActions(root, seed.slug);
  hydrateGameDetail(root, seed);
  hydrateOffers(root, seed);
}

async function hydrateGameDetail(root, seed) {
  try {
    const data = await fetchJson(`/api/igdb/game?q=${encodeURIComponent(seed.igdbQuery)}&year=${seed.year}`);
    if (!data.game) throw new Error('Sem correspondência');
    const hero = root.querySelector('[data-game-hero]');
    const cover = root.querySelector('[data-game-cover]');
    if (hero && data.game.hero?.url) hero.innerHTML = `<img src="${data.game.hero.url}" alt="" />`;
    if (cover && data.game.cover?.url) cover.innerHTML = `<img src="${data.game.cover.url}" alt="Capa de ${escapeHtml(seed.name)}" />`;
  } catch { /* fallback visual permanece */ }
}

async function hydrateOffers(root, seed) {
  const status = root.querySelector('[data-offer-status]');
  const box = root.querySelector('[data-offers]');
  try {
    const platform = seed.platforms[0] || '';
    const data = await fetchJson(`/api/offers?q=${encodeURIComponent(seed.name)}&year=${seed.year}&platform=${encodeURIComponent(platform)}`);
    const offers = (data.offers || []).filter(o => o.kind === 'game' || o.kind === 'unverified');
    if (!offers.length) throw new Error('Sem ofertas');
    if (status) status.textContent = `${offers.length} oferta${offers.length > 1 ? 's' : ''} validada${offers.length > 1 ? 's' : ''}.`;
    if (box) box.innerHTML = offers.slice(0,4).map(o => `<a class="offer-card compact-market-offer" href="${escapeHtml(o.url)}" target="_blank" rel="noopener noreferrer sponsored"><div><span>${escapeHtml(o.conditionLabel || 'Oferta')}</span><strong>${escapeHtml(o.displayTitle || o.title)}</strong><small>${escapeHtml(o.seller || o.provider)}</small></div><b>${o.priceFormatted ? escapeHtml(o.priceFormatted) : 'Ver oferta'}</b></a>`).join('');
  } catch {
    if (status) status.textContent = 'Sem preço validado no momento.';
    if (box) box.innerHTML = `<div class="offer-empty compact-offer"><strong>Sem preço confirmado</strong><p>Use os atalhos abaixo para procurar nas lojas. O Inventário não converte busca em preço.</p><button data-alert-inline>Criar alerta</button></div>`;
    box?.querySelector('[data-alert-inline]')?.addEventListener('click', () => { toggleAlert(seed.slug); updateHeaderInventoryCount(); showToast('Alerta salvo neste dispositivo.'); });
  }
}

function mountInventoryActions(root, slug) {
  root.querySelectorAll('[data-status]').forEach(button => button.addEventListener('click', () => {
    const state = setGameStatus(slug, button.dataset.status);
    root.querySelectorAll('[data-status]').forEach(btn => { btn.classList.toggle('active', state.status === btn.dataset.status); if (btn.dataset.status === 'want' && btn.closest('.game-hero')) btn.textContent = state.status === 'want' ? '✓ Quero' : 'Quero'; });
    updateHeaderInventoryCount();
    showToast(state.status ? `Marcado como “${state.status === 'have' ? 'Tenho' : 'Quero'}”.` : 'Estado removido.');
  }));
  root.querySelector('[data-alert]')?.addEventListener('click', event => {
    const state = toggleAlert(slug); event.currentTarget.classList.toggle('active', state.alert); event.currentTarget.textContent = state.alert ? 'Alerta ativo' : 'Criar alerta';
    updateHeaderInventoryCount();
    showToast(state.alert ? 'Alerta ativado neste dispositivo.' : 'Alerta desativado.');
  });
}

export function renderTrending(root) {
  setDocumentTitle('Em alta');
  const games = featuredGameSlugs.map(getGameSeed).filter(Boolean);
  root.innerHTML = shell(`${breadcrumb([{label:'Início',href:'#/'},{label:'Em alta'}])}<header class="page-heading compact-heading"><h1>Em alta</h1><p>Seleção atual do catálogo para descoberta. Isto não é um ranking em tempo real nem usa dados inventados de tendência.</p></header><div class="universe-grid trending-grid">${games.map(compactGameCard).join('')}</div>`, 'trending-page');
  hydrateGameCards(root);
}

export function renderMerch(root, query = new URLSearchParams()) {
  const cat = query.get('cat') || 'tudo';
  const labels = { tudo:'Merch, colecionáveis e fan-made', acessorios:'Acessórios', colecionaveis:'Colecionáveis', merch:'Merch', fanmade:'Fan-made' };
  const title = labels[cat] || labels.tudo;
  const merchItems = Object.entries(demoMerch).flatMap(([slug,items]) => items.map(item => ({...item,slug,kind:'merch'})));
  const fanItems = Object.entries(demoFanMade).flatMap(([slug,items]) => items.map(item => ({...item,slug,kind:'fanmade'})));
  let items = [...merchItems, ...fanItems];
  if (cat === 'fanmade') items = fanItems;
  else if (cat === 'colecionaveis' || cat === 'merch' || cat === 'acessorios') items = merchItems;
  setDocumentTitle(title);
  root.innerHTML = shell(`${breadcrumb([{label:'Início',href:'#/'},{label:title}])}<header class="page-heading compact-heading"><h1>${escapeHtml(title)}</h1><p>Esta área já preserva a navegação do projeto antigo. Só itens explicitamente marcados como demonstração aparecem antes das integrações comerciais.</p></header><nav class="category-tabs"><a href="#/merch" aria-current="${cat === 'tudo' ? 'page' : 'false'}">Tudo</a><a href="#/merch?cat=acessorios" aria-current="${cat === 'acessorios' ? 'page' : 'false'}">Acessórios</a><a href="#/merch?cat=colecionaveis" aria-current="${cat === 'colecionaveis' ? 'page' : 'false'}">Colecionáveis</a><a href="#/merch?cat=fanmade" aria-current="${cat === 'fanmade' ? 'page' : 'false'}">Fan-made</a></nav>${items.length ? `<div class="merch-grid">${items.map(item => { const game=getGameSeed(item.slug); return `<article class="merch-card"><div class="commerce-art"><span>${item.kind === 'fanmade' ? 'FAN-MADE' : 'MERCH'}</span></div><h2>${escapeHtml(item.title)}</h2><p>${escapeHtml(item.note || '')}</p><span class="demo-flag">EXEMPLO DE CATEGORIA</span>${game ? `<a href="${gameLink(game)}">Ver jogo relacionado →</a>` : ''}</article>`; }).join('')}</div>` : `<div class="empty-state"><strong>Integração em preparação.</strong><p>Não há itens reais validados nesta categoria agora, então nenhuma oferta fictícia será exibida.</p></div>`}`, 'merch-page');
}

export function renderInventory(root) {
  setDocumentTitle('Meu Inventário');
  const states = readInventory();
  const items = Object.entries(states).map(([slug, state]) => ({ game:getGameSeed(slug), state })).filter(x => x.game && (x.state.status || x.state.alert));
  root.innerHTML = shell(`<section class="inventory-world"><div class="inventory-world-header"><div><p class="inventory-kicker">PAUSE MENU</p><h1>Meu Inventário</h1><p>O que você tem, o que procura e os avisos que quer acompanhar neste aparelho.</p></div><span class="inventory-count">${items.length.toString().padStart(2,'0')}</span></div>${items.length ? `<div class="inventory-list">${items.map(({game,state}) => `<a href="${gameLink(game)}"><div><span>${state.status === 'have' ? 'TENHO' : state.status === 'want' ? 'QUERO' : 'ACOMPANHANDO'}</span><strong>${escapeHtml(game.name)} (${game.year})</strong><small>${escapeHtml(lineageLabels[game.lineage])}${state.alert ? ' · alerta ativo' : ''}</small></div><b>→</b></a>`).join('')}</div>` : `<div class="inventory-empty"><div class="pixel-box">?</div><h2>Seu inventário está vazio.</h2><p>Abra um jogo e marque “Tenho” ou “Quero”. Os dados ficam neste navegador nesta primeira versão.</p><a class="btn inventory-btn" href="#/games">Explorar catálogo</a></div>`}</section>`, 'inventory-page');
}

export function renderNotFound(root) {
  setDocumentTitle('Página não encontrada');
  root.innerHTML = shell(`<section class="not-found"><span>404</span><h1>Esse item não está no inventário.</h1><p>A rota pode ter mudado ou ainda não foi catalogada.</p><a class="btn primary" href="#/">Voltar ao início</a></section>`);
}

export function updateHeaderInventoryCount() {
  const badge = document.querySelector('[data-inventory-count]');
  if (!badge) return;
  const count = Object.values(readInventory()).filter(state => state?.status || state?.alert).length;
  badge.textContent = String(count);
  badge.hidden = count === 0;
}

async function hydrateGameCards(root) {
  const cards = [...root.querySelectorAll('.hydrate-game')];
  const queue = cards.slice(0, 24);
  const worker = async () => {
    while (queue.length) {
      const card = queue.shift();
      try {
        const data = await fetchJson(`/api/igdb/game?q=${encodeURIComponent(card.dataset.query)}&year=${encodeURIComponent(card.dataset.year || '')}`);
        if (data.game?.cover?.url) {
          const slot = card.querySelector('.card-cover, .lineage-cover');
          if (slot) slot.innerHTML = `<img src="${data.game.cover.url}" alt="" loading="lazy" />`;
        }
      } catch { /* fallback permanece */ }
    }
  };
  await Promise.all([worker(), worker()]);
}
