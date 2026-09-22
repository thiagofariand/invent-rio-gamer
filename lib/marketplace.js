const MERCH_TERMS = ['chaveiro','camiseta','caneca','poster','pôster','quadro','boneco','figure','action figure','adesivo','capinha','luminária','luminaria','pelúcia','pelucia','colar','pingente','cosplay','controle skin','skin'];
const FAN_TERMS = ['fan made','fan-made','artesanal','impresso 3d','impressão 3d','impressao 3d','repro box','reprobox'];
const GAME_TERMS = ['jogo','game','mídia física','midia fisica','disco','cartucho','ps4','ps5','switch','xbox','playstation','nintendo'];

function norm(value = '') {
  return String(value).toLowerCase().normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'')
    .replace(/[’']/g,'')
    .replace(/[^a-z0-9]+/g,' ')
    .replace(/\s+/g,' ')
    .trim();
}

export function classifyMarketplaceTitle(title = '') {
  const text = title.toLocaleLowerCase('pt-BR');
  if (FAN_TERMS.some(term => text.includes(term))) return 'fanMade';
  if (MERCH_TERMS.some(term => text.includes(term))) return 'merch';
  if (GAME_TERMS.some(term => text.includes(term))) return 'game';
  return 'unverified';
}

export function cleanMarketplaceTitle(title = '') {
  return String(title)
    .replace(/[|•]+/g, ' · ')
    .replace(/\b(promo(?:ção)?|oferta|imperd[ií]vel|top|barato|frete gr[aá]tis)\b/gi, '')
    .replace(/\s*·\s*·\s*/g, ' · ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 140);
}

export function relevantEnough(listingTitle, masterTitle) {
  const stop = new Set(['the','of','and','a','an','edition','edicao','game','jogo','para','remake','remaster']);
  const wanted = norm(masterTitle).split(' ').filter(t => t.length > 1 && !stop.has(t));
  if (!wanted.length) return true;
  const got = new Set(norm(listingTitle).split(' '));
  const matched = wanted.filter(t => got.has(t)).length;
  if (wanted.length <= 2) return matched === wanted.length;
  return matched / wanted.length >= 0.55;
}

function formatBRL(value, currency = 'BRL') {
  try { return new Intl.NumberFormat('pt-BR', { style:'currency', currency }).format(value); } catch { return null; }
}

function externalSearchUrl(query, platform = '') {
  const term = [query, platform].filter(Boolean).join(' ');
  return `https://lista.mercadolivre.com.br/${encodeURIComponent(term).replace(/%20/g,'-')}`;
}

function itemCondition(item) {
  if (item?.condition) return item.condition;
  const attr = (item?.attributes || []).find(x => x.id === 'ITEM_CONDITION');
  const value = norm(attr?.value_name || '');
  if (value.includes('novo') || value.includes('new')) return 'new';
  if (value.includes('usado') || value.includes('used')) return 'used';
  return null;
}

async function apiGet(url, token) {
  const headers = { Accept:'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(url, { headers });
  const text = await response.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch { data = {}; }
  return { ok:response.ok, status:response.status, data };
}

function normalizeOffer(item, winner, query) {
  const price = Number(item?.price ?? winner?.price);
  if (!Number.isFinite(price) || !item?.permalink) return null;
  const condition = itemCondition(item) || 'new';
  const kind = classifyMarketplaceTitle(item.title || query);
  return {
    provider:'Mercado Livre',
    providerId:item.id || winner?.item_id || null,
    catalogProductId:item.catalog_product_id || winner?.product_id || null,
    kind,
    rawTitle:item.title || query,
    displayTitle:cleanMarketplaceTitle(item.title || query),
    title:query,
    price,
    currency:item.currency_id || winner?.currency_id || 'BRL',
    priceFormatted:formatBRL(price, item.currency_id || winner?.currency_id || 'BRL'),
    originalPrice:Number.isFinite(Number(item.original_price)) ? Number(item.original_price) : null,
    condition,
    conditionLabel:condition === 'used' ? 'Usado' : condition === 'new' ? 'Novo' : 'Oferta',
    seller:item.seller?.nickname || null,
    url:item.permalink,
    image:item.secure_thumbnail || item.thumbnail || item.pictures?.[0]?.secure_url || item.pictures?.[0]?.url || null,
    shippingIncluded:Boolean(item.shipping?.free_shipping ?? winner?.shipping?.free_shipping),
    mock:false
  };
}

async function searchCatalogNew(query, platform, token) {
  const params = new URLSearchParams({ status:'active', site_id:'MLB', q:[query, platform].filter(Boolean).join(' ') });
  const search = await apiGet(`https://api.mercadolibre.com/products/search?${params}`, token);
  if (!search.ok) {
    const error = new Error(`Mercado Livre products search failed (${search.status})`);
    error.status = search.status;
    throw error;
  }

  const products = (search.data.results || []).slice(0, 6);
  if (!products.length) return [];
  const details = await Promise.all(products.map(async product => {
    const response = await apiGet(`https://api.mercadolibre.com/products/${encodeURIComponent(product.id)}`, token);
    return response.ok ? response.data : null;
  }));
  const winners = [...new Map(details.filter(Boolean).map(d => d.buy_box_winner).filter(w => w?.item_id).map(w => [w.item_id, w])).values()].slice(0, 6);
  if (!winners.length) return [];

  const itemResults = await Promise.all(winners.map(async winner => ({
    winner,
    response:await apiGet(`https://api.mercadolibre.com/items/${encodeURIComponent(winner.item_id)}`, token)
  })));
  const raw = [];
  for (const { winner, response } of itemResults) {
    if (!response.ok) continue;
    const condition = itemCondition(response.data);
    if (condition && condition !== 'new') continue;
    const offer = normalizeOffer(response.data, winner, query);
    if (offer) raw.push(offer);
  }
  const relevant = raw.filter(o => relevantEnough(o.rawTitle, query));
  return (relevant.length ? relevant : raw).sort((a,b) => a.price - b.price);
}

async function fallbackOpenSearch(query, platform, token) {
  // Fallback tolerante: alguns apps/contas ainda conseguem usar a busca aberta.
  const url = new URL('https://api.mercadolibre.com/sites/MLB/search');
  url.searchParams.set('q', [query, platform].filter(Boolean).join(' '));
  url.searchParams.set('limit', '20');
  const response = await apiGet(url, token);
  if (!response.ok) return [];
  return (response.data.results || [])
    .map(item => normalizeOffer(item, null, query))
    .filter(Boolean)
    .filter(item => item.condition !== 'used')
    .filter(item => relevantEnough(item.rawTitle, query))
    .sort((a,b) => a.price - b.price)
    .slice(0, 8);
}

export async function searchMercadoLivre({ query, platform = '', year = null }) {
  const token = process.env.MELI_ACCESS_TOKEN;
  const externalUsedSearchUrl = externalSearchUrl(`${query}${year ? ` ${year}` : ''}`, platform);
  if (!token) return { status:'not_configured', offers:[], externalUsedSearchUrl, flow:'none' };

  let offers = [];
  let flow = 'products_search_buy_box';
  try {
    offers = await searchCatalogNew(query, platform, token);
  } catch (error) {
    if (Number(error?.status) === 401) throw error;
    flow = 'open_search_fallback';
  }
  if (!offers.length) {
    const fallback = await fallbackOpenSearch(query, platform, token);
    if (fallback.length) { offers = fallback; flow = 'open_search_fallback'; }
  }
  return { status:offers.length ? 'ok' : 'empty', offers, externalUsedSearchUrl, flow };
}

export function mercadoLivreConfigured() {
  return Boolean(process.env.MELI_CLIENT_ID && process.env.MELI_CLIENT_SECRET && process.env.MELI_ACCESS_TOKEN);
}
