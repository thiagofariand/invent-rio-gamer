const MERCH_TERMS = ['chaveiro','camiseta','caneca','poster','pôster','quadro','boneco','figure','action figure','adesivo','capinha','luminária','luminaria','pelúcia','pelucia','colar','pingente','cosplay','controle skin','skin'];
const FAN_TERMS = ['fan made','fan-made','artesanal','impresso 3d','impressão 3d','impressao 3d','repro box','reprobox'];
const GAME_TERMS = ['jogo','game','mídia física','midia fisica','disco','cartucho','ps4','ps5','switch','xbox','playstation','nintendo'];

export function classifyMarketplaceTitle(title = '') {
  const text = title.toLocaleLowerCase('pt-BR');
  if (FAN_TERMS.some(term => text.includes(term))) return 'fanMade';
  if (MERCH_TERMS.some(term => text.includes(term))) return 'merch';
  if (GAME_TERMS.some(term => text.includes(term))) return 'game';
  return 'unverified';
}

export function cleanMarketplaceTitle(title = '') {
  return String(title).replace(/[|•]+/g, ' · ').replace(/\s+/g, ' ').trim().slice(0, 140);
}

function formatBRL(value, currency = 'BRL') {
  try { return new Intl.NumberFormat('pt-BR', { style:'currency', currency }).format(value); } catch { return null; }
}

export async function searchMercadoLivre({ query, year = null }) {
  const url = new URL('https://api.mercadolibre.com/sites/MLB/search');
  url.searchParams.set('q', `${query} jogo${year ? ` ${year}` : ''}`);
  url.searchParams.set('limit', '20');
  const headers = { Accept:'application/json' };
  if (process.env.MELI_ACCESS_TOKEN) headers.Authorization = `Bearer ${process.env.MELI_ACCESS_TOKEN}`;
  const response = await fetch(url, { headers });
  if (!response.ok) { const error = new Error(`Mercado Livre search failed (${response.status})`); error.status = response.status; throw error; }
  const data = await response.json();
  return (data.results || []).map(item => {
    const kind = classifyMarketplaceTitle(item.title);
    return {
      provider:'Mercado Livre', providerId:item.id, kind,
      rawTitle:item.title, title: kind === 'game' ? query : cleanMarketplaceTitle(item.title),
      price:Number.isFinite(item.price) ? item.price : null,
      currency:item.currency_id || 'BRL', priceFormatted:Number.isFinite(item.price) ? formatBRL(item.price, item.currency_id || 'BRL') : null,
      condition:item.condition || null, conditionLabel:item.condition === 'new' ? 'Novo' : item.condition === 'used' ? 'Usado' : 'Oferta',
      seller:item.seller?.nickname || null, url:item.permalink || null
    };
  }).filter(item => item.url && item.price != null);
}

export function mercadoLivreConfigured() {
  return Boolean(process.env.MELI_CLIENT_ID && process.env.MELI_CLIENT_SECRET && process.env.MELI_ACCESS_TOKEN);
}
