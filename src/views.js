import {
  directorySections, featuredGameSlugs, gameSeeds, lineageLabels,
  getContextCount, getFranchiseSeed, getFranchiseTheme, getGameSeed
} from '../catalog-data.js';
import { demoMerch, demoFanMade } from '../mock-data.js';
import { escapeHtml, fetchJson, imageUrl, setDocumentTitle, showToast } from './app-core.js';
import { getGameState, readInventory, setGameStatus, toggleAlert } from './inventory.js';

function shell(content, className = '') { return `<div class="page ${className}">${content}</div>`; }
function breadcrumb(items) { return `<nav class="breadcrumb" aria-label="Breadcrumb">${items.map((item, i) => item.href ? `<a href="${item.href}">${escapeHtml(item.label)}</a>${i < items.length - 1 ? '<span>/</span>' : ''}` : `<span aria-current="page">${escapeHtml(item.label)}</span>`).join('')}</nav>`; }
function lineageBadge(lineage) { return `<span class="lineage-badge lineage-${escapeHtml(lineage)}">${escapeHtml(lineageLabels[lineage] || lineage)}</span>`; }
function loadingImage(kind='cover') { return `<div class="media-placeholder ${kind}" aria-hidden="true"><span>IG</span></div>`; }
function gameLink(game) { return `#/jogo/${encodeURIComponent(game.slug)}`; }

export function renderHome(root) {
  setDocumentTitle('');
  const featured = featuredGameSlugs.map(getGameSeed).filter(Boolean);
  root.innerHTML = shell(`
    <section class="home-hero">
      <div class="home-hero-copy">
        <p class="eyebrow">INVENTÁRIO GAMER 2.0</p>
        <h1>Encontre o item que falta no seu <span>Inventário.</span></h1>
        <p>Descubra jogos por universo, diferencie originais de remakes e encontre onde comprar sem misturar catálogo com anúncio.</p>
        <div class="hero-actions"><a class="btn primary" href="#/games">Explorar games</a><a class="btn ghost" href="#/inventario">Meu Inventário</a></div>
      </div>
      <div class="inventory-preview" aria-label="Princípios do catálogo">
        <span class="preview-kicker">CATÁLOGO COM CONTEXTO</span>
        <div class="preview-line"><strong>OG</strong><small>Original</small></div>
        <div class="preview-line"><strong>RE</strong><small>Remake</small></div>
        <div class="preview-line"><strong>RM</strong><small>Remaster</small></div>
        <div class="preview-rule"></div>
        <p>Retrô pertence ao lançamento, não à franquia inteira.</p>
      </div>
    </section>
    <section class="section-block">
      <div class="section-heading"><div><p class="eyebrow">EXPLORAR AGORA</p><h2>Destaques do Inventário</h2></div><a href="#/games">Ver diretório →</a></div>
      <div class="featured-grid">${featured.map(game => `
        <a class="game-card hydrate-game" href="${gameLink(game)}" data-query="${escapeHtml(game.igdbQuery)}" data-year="${game.year}">
          <div class="card-cover">${loadingImage()}</div>
          <div class="card-copy"><div>${lineageBadge(game.lineage)}${game.retro ? '<span class="retro-badge">Retrô</span>' : ''}</div><h3>${escapeHtml(game.name)}</h3><p>${game.year} · ${escapeHtml(game.platforms[0])}</p></div>
        </a>`).join('')}</div>
    </section>
    <section class="value-grid">
      <article><span>01</span><h3>Dados separados</h3><p>IGDB cuida da identidade do jogo. Lojas cuidam de preço, condição e link.</p></article>
      <article><span>02</span><h3>Universos curados</h3><p>A API ajuda; a estrutura editorial do Inventário Gamer decide o que pertence a cada universo.</p></article>
      <article><span>03</span><h3>Sem preço inventado</h3><p>Sem oferta real, mostramos ausência de oferta. Nunca R$ 0,00, desconto ou estoque fictício.</p></article>
    </section>
  `, 'home-page');
  hydrateGameCards(root);
}

export function renderGames(root) {
  setDocumentTitle('Games');
  root.innerHTML = shell(`
    ${breadcrumb([{label:'Início', href:'#/'},{label:'Games'}])}
    <header class="page-heading"><p class="eyebrow">DIRETÓRIO</p><h1>Games por universo</h1><p>As faixas organizam a descoberta. Retrô é um recorte do catálogo: a mesma franquia pode aparecer em outra faixa sem virar duplicação de dados.</p></header>
    <section class="directory-list">${directorySections.map(section => `
      <article class="directory-row" style="--section-color:${section.color}">
        <div class="directory-brand">
          ${section.icon ? `<img src="${section.icon}" alt="" />` : `<span class="brand-word">${escapeHtml(section.brandText)}</span>`}
          <div><strong>${escapeHtml(section.title)}</strong><small>${escapeHtml(section.subtitle)}</small></div>
        </div>
        <div class="franchise-chips">${section.franchises.map(([name, slug]) => {
          const count = getContextCount(slug, section.id);
          return `<a href="#/universo/${encodeURIComponent(slug)}" class="franchise-chip"><span>${escapeHtml(name)}</span>${count != null ? `<small title="Jogos catalogados neste contexto">${count}</small>` : ''}</a>`;
        }).join('')}</div>
      </article>`).join('')}</section>
  `, 'games-page');
}

function universeLocalList(slug) {
  const games = getFranchiseSeed(slug);
  return games.length ? `<div class="lineage-list">${games.sort((a,b) => a.year-b.year).map(game => `
    <a class="lineage-row hydrate-game" href="${gameLink(game)}" data-query="${escapeHtml(game.igdbQuery)}" data-year="${game.year}">
      <div class="lineage-cover">${loadingImage()}</div>
      <div class="lineage-copy"><div>${lineageBadge(game.lineage)}${game.retro ? '<span class="retro-badge">Retrô</span>' : ''}</div><strong>${escapeHtml(game.name)}</strong><span>${game.year} · ${escapeHtml(game.platforms.join(' · '))}</span></div>
      <span class="row-arrow">→</span>
    </a>`).join('')}</div>` : `<div class="empty-state"><strong>Curadoria em montagem</strong><p>O universo já existe no diretório, mas a seleção local ainda será preenchida com dados validados.</p></div>`;
}

export async function renderUniverse(root, slug) {
  const theme = getFranchiseTheme(slug);
  setDocumentTitle(`Universo ${theme.title}`);
  root.innerHTML = shell(`
    ${breadcrumb([{label:'Início',href:'#/'},{label:'Games',href:'#/games'},{label:`Universo ${theme.title}`}])}
    <section class="universe-hero theme-${theme.style}" style="--accent:${theme.accent};--focus:${theme.focus}">
      <div class="hero-backdrop" data-universe-hero>${loadingImage('hero')}</div>
      <div class="universe-hero-copy"><p class="eyebrow">UNIVERSO</p><h1>${escapeHtml(theme.title)}</h1><p>Originais, remakes, remasters e ports permanecem distintos — mas conectados pela mesma linhagem.</p></div>
    </section>
    <section class="section-block"><div class="section-heading"><div><p class="eyebrow">LINHAGEM</p><h2>Jogos catalogados</h2></div><span class="data-note" data-universe-status>Carregando identidade IGDB…</span></div>${universeLocalList(slug)}</section>
  `, 'universe-page');
  hydrateGameCards(root);
  try {
    const data = await fetchJson(`/api/igdb/franchise?q=${encodeURIComponent(theme.title)}`);
    const hero = root.querySelector('[data-universe-hero]');
    if (hero && data.hero?.url) hero.innerHTML = `<img src="${data.hero.url}" alt="" style="object-position:${escapeHtml(theme.focus)}" />`;
    const status = root.querySelector('[data-universe-status]');
    if (status) status.textContent = data.games?.length ? `${data.games.length} registros relacionados na IGDB` : 'Curadoria local ativa';
  } catch {
    const status = root.querySelector('[data-universe-status]');
    if (status) status.textContent = 'Curadoria local · IGDB indisponível agora';
  }
}

function gameSkeleton(seed, theme) {
  const state = getGameState(seed.slug);
  const related = getFranchiseSeed(seed.franchise).filter(g => g.slug !== seed.slug && g.name.replace(/[:].*$/,'') === seed.name.replace(/[:].*$/,''));
  return `
    ${breadcrumb([{label:'Início',href:'#/'},{label:'Games',href:'#/games'},{label:`Universo ${theme.title}`,href:`#/universo/${seed.franchise}`},{label:`${seed.name} (${seed.year})`}])}
    <section class="game-hero theme-${theme.style}" style="--accent:${theme.accent}">
      <div class="game-hero-media" data-game-hero>${loadingImage('hero')}</div>
      <div class="game-hero-overlay"></div>
      <div class="game-hero-copy">
        <div class="hero-badges">${lineageBadge(seed.lineage)}${seed.retro ? '<span class="retro-badge">Retrô</span>' : ''}</div>
        <h1>${escapeHtml(seed.name)}</h1>
        <p>${escapeHtml(theme.title)} · ${escapeHtml(seed.platforms.join(' · '))} · ${seed.year}</p>
        <div class="hero-actions"><a class="btn primary" href="#purchase">Onde comprar</a><button class="btn ghost inventory-action" data-status="want">${state.status === 'want' ? '✓ Quero' : 'Quero'}</button><a class="btn ghost" href="#/universo/${seed.franchise}">Universo ${escapeHtml(theme.title)}</a></div>
      </div>
    </section>
    ${related.length ? `<section class="lineage-context"><strong>Mesma linhagem, versões diferentes.</strong><div>${related.map(g => `<a href="${gameLink(g)}">${escapeHtml(g.name)} (${g.year}) ${lineageBadge(g.lineage)}</a>`).join('')}</div></section>` : ''}
    <section id="purchase" class="purchase-module">
      <div class="purchase-cover" data-game-cover>${loadingImage()}</div>
      <div class="purchase-main">
        <div><p class="eyebrow">ONDE COMPRAR</p><h2>${escapeHtml(seed.name)} <span>${seed.year}</span></h2><p class="offer-status" data-offer-status>Consultando ofertas reais…</p></div>
        <div class="platform-pills">${seed.platforms.map(p => `<span>${escapeHtml(p)}</span>`).join('')}</div>
        <div class="offer-columns" data-offers><div class="offer-empty"><strong>Carregando</strong><p>Nenhum valor de exemplo será mostrado como preço real.</p></div></div>
      </div>
    </section>
    ${renderOptionalCommerce('Colecionáveis e merch', demoMerch[seed.slug], 'merch')}
    ${renderOptionalCommerce('Fan-made e artesanais', demoFanMade[seed.slug], 'fanmade')}
    <section class="inventory-cta">
      <div><p class="eyebrow">MEU INVENTÁRIO</p><h2>Qual é a sua relação com este jogo?</h2><p>“Tenho” e “Quero” são estados. Alerta é uma ação independente.</p></div>
      <div class="inventory-buttons"><button data-status="have" class="inventory-action ${state.status === 'have' ? 'active':''}">Tenho</button><button data-status="want" class="inventory-action ${state.status === 'want' ? 'active':''}">Quero</button><button data-alert class="${state.alert ? 'active':''}">${state.alert ? 'Alerta ativo' : 'Criar alerta'}</button></div>
    </section>`;
}

function renderOptionalCommerce(title, items, kind) {
  if (!items?.length) return '';
  return `<section class="section-block optional-commerce"><div class="section-heading"><div><p class="eyebrow">${kind === 'merch' ? 'COLEÇÃO' : 'CRIAÇÕES'}</p><h2>${escapeHtml(title)}</h2></div></div><div class="commerce-grid">${items.map(item => `<article><div class="commerce-placeholder"></div><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.note || '')}</p><span class="demo-flag">EXEMPLO DE CATEGORIA</span></article>`).join('')}</div></section>`;
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
    const game = data.game;
    const hero = root.querySelector('[data-game-hero]');
    const cover = root.querySelector('[data-game-cover]');
    if (hero && game.hero?.url) hero.innerHTML = `<img src="${game.hero.url}" alt="" />`;
    if (cover && game.cover?.url) cover.innerHTML = `<img src="${game.cover.url}" alt="Capa de ${escapeHtml(seed.name)}" />`;
  } catch {
    // Fallback visual já está renderizado; falha externa nunca derruba a página.
  }
}

async function hydrateOffers(root, seed) {
  const status = root.querySelector('[data-offer-status]');
  const box = root.querySelector('[data-offers]');
  try {
    const data = await fetchJson(`/api/offers?q=${encodeURIComponent(seed.name)}&year=${seed.year}`);
    const offers = (data.offers || []).filter(o => o.kind === 'game');
    if (!offers.length) throw new Error('Sem ofertas');
    if (status) status.textContent = `${offers.length} oferta${offers.length > 1 ? 's' : ''} encontrada${offers.length > 1 ? 's' : ''}.`;
    if (box) box.innerHTML = offers.slice(0,6).map(o => `<a class="offer-card" href="${escapeHtml(o.url)}" target="_blank" rel="noopener noreferrer sponsored"><div><span>${escapeHtml(o.conditionLabel)}</span><strong>${escapeHtml(o.title)}</strong><small>${escapeHtml(o.seller || o.provider)}</small></div><b>${o.priceFormatted ? escapeHtml(o.priceFormatted) : 'Ver oferta'}</b></a>`).join('');
  } catch {
    if (status) status.textContent = 'Sem ofertas validadas no momento.';
    if (box) box.innerHTML = `<div class="offer-empty"><strong>Sem ofertas no momento</strong><p>O catálogo continua disponível. Nenhum preço fictício será exibido.</p><button data-alert-inline>Criar alerta</button></div>`;
    box?.querySelector('[data-alert-inline]')?.addEventListener('click', () => { toggleAlert(seed.slug); showToast('Alerta salvo neste dispositivo.'); });
  }
}

function mountInventoryActions(root, slug) {
  root.querySelectorAll('[data-status]').forEach(button => button.addEventListener('click', () => {
    const state = setGameStatus(slug, button.dataset.status);
    root.querySelectorAll('[data-status]').forEach(btn => btn.classList.toggle('active', state.status === btn.dataset.status));
    showToast(state.status ? `Marcado como “${state.status === 'have' ? 'Tenho' : 'Quero'}”.` : 'Estado removido.');
  }));
  root.querySelector('[data-alert]')?.addEventListener('click', event => {
    const state = toggleAlert(slug); event.currentTarget.classList.toggle('active', state.alert); event.currentTarget.textContent = state.alert ? 'Alerta ativo' : 'Criar alerta';
    showToast(state.alert ? 'Alerta ativado neste dispositivo.' : 'Alerta desativado.');
  });
}

export function renderInventory(root) {
  setDocumentTitle('Meu Inventário');
  const states = readInventory();
  const items = Object.entries(states).map(([slug, state]) => ({ game:getGameSeed(slug), state })).filter(x => x.game && (x.state.status || x.state.alert));
  root.innerHTML = shell(`
    <section class="inventory-world">
      <div class="inventory-world-header"><div><p class="eyebrow">PAUSE MENU</p><h1>Meu Inventário</h1><p>Seu espaço local para organizar o que você tem, quer e deseja acompanhar.</p></div><span class="inventory-count">${items.length.toString().padStart(2,'0')}</span></div>
      ${items.length ? `<div class="inventory-list">${items.map(({game,state}) => `<a href="${gameLink(game)}"><div><span>${state.status === 'have' ? 'TENHO' : state.status === 'want' ? 'QUERO' : 'ACOMPANHANDO'}</span><strong>${escapeHtml(game.name)} (${game.year})</strong><small>${escapeHtml(lineageLabels[game.lineage])}${state.alert ? ' · alerta ativo' : ''}</small></div><b>→</b></a>`).join('')}</div>` : `<div class="inventory-empty"><div class="pixel-box">?</div><h2>Seu inventário está vazio.</h2><p>Abra um jogo e marque “Tenho” ou “Quero”. Os dados ficam neste navegador nesta primeira versão.</p><a class="btn inventory-btn" href="#/games">Explorar catálogo</a></div>`}
    </section>`, 'inventory-page');
}

export function renderNotFound(root) {
  setDocumentTitle('Página não encontrada');
  root.innerHTML = shell(`<section class="not-found"><span>404</span><h1>Esse item não está no inventário.</h1><p>A rota pode ter mudado ou ainda não foi catalogada.</p><a class="btn primary" href="#/">Voltar ao início</a></section>`);
}

async function hydrateGameCards(root) {
  const cards = [...root.querySelectorAll('.hydrate-game')];
  const queue = cards.slice(0, 8);
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
