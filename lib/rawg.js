/**
 * Cliente da RAWG (api.rawg.io) — fonte adicional de metadado/capa, usada só
 * pra cross-check quando a IGDB não achar nada ou achar com confiança baixa.
 *
 * ISOLADO DE PROPÓSITO: nada aqui é chamado pelo fluxo principal ainda,
 * mesmo critério já usado pro DataForSEO e pra API de afiliados da Shopee —
 * só existe /api/rawg/status pra validar a chave antes de ligar em qualquer
 * página real.
 *
 * Autenticação é bem mais simples que a IGDB: só uma chave (`key`) direto na
 * URL, sem OAuth. Chave grátis em https://rawg.io/apidocs.
 */
const { cleanText } = require('./http');

const ENDPOINT = 'https://api.rawg.io/api/games';

async function searchGame({ title, platform = '', apiKey }) {
  const q = cleanText(title, 120);
  if (!q) return { ok: true, found: false };
  if (!apiKey) {
    const error = new Error('missing_rawg_api_key');
    error.status = 500;
    throw error;
  }

  const params = new URLSearchParams({ key: apiKey, search: q, page_size: '5' });
  const response = await fetch(`${ENDPOINT}?${params.toString()}`);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data?.error || `RAWG request failed (HTTP ${response.status})`);
    error.status = response.status;
    throw error;
  }

  const results = Array.isArray(data.results) ? data.results : [];
  if (!results.length) return { ok: true, found: false, query: q };

  // A RAWG já devolve ordenado por relevância própria; se uma plataforma foi
  // pedida, prioriza o primeiro resultado que a lista, mas sem descartar os
  // outros — não temos aqui o mesmo sistema de pontuação da IGDB ainda.
  const target = cleanText(platform, 50).toLowerCase();
  const withPlatform = target
    ? results.find(g => (g.platforms || []).some(p => (p.platform?.name || '').toLowerCase().includes(target)))
    : null;
  const best = withPlatform || results[0];

  return {
    ok: true,
    found: true,
    query: q,
    game: {
      id: best.id,
      name: best.name,
      slug: best.slug,
      releaseYear: best.released ? new Date(best.released).getUTCFullYear() : null,
      platforms: (best.platforms || []).map(p => p.platform?.name).filter(Boolean),
      rating: typeof best.rating === 'number' ? best.rating : null,
      ratingTop: best.rating_top || null,
      ratingsCount: best.ratings_count || null,
      metacritic: typeof best.metacritic === 'number' ? best.metacritic : null,
      developers: (best.developers || []).map(d => d.name).filter(Boolean),
      publishers: (best.publishers || []).map(p => p.name).filter(Boolean)
    },
    cover: best.background_image ? { url: best.background_image } : null,
    source: 'RAWG'
  };
}

async function getStatus({ apiKey }) {
  try {
    const result = await searchGame({ title: 'The Legend of Zelda: Ocarina of Time', apiKey });
    return {
      configured: true,
      apiOk: true,
      sample: result.found
        ? { name: result.game.name, rating: result.game.rating, metacritic: result.game.metacritic }
        : null
    };
  } catch (error) {
    return {
      configured: true,
      apiOk: false,
      httpStatus: error.status || null,
      message: cleanText(error.message, 240)
    };
  }
}

module.exports = { searchGame, getStatus };
