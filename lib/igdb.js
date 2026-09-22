const IGDB_BASE = 'https://api.igdb.com/v4';
const TWITCH_TOKEN_URL = 'https://id.twitch.tv/oauth2/token';
const REQUEST_GAP_MS = 270; // ~3.7 req/s por instância, abaixo do limite documentado de 4 req/s.

let tokenCache = { value: null, refreshAt: 0, expiresAt: 0 };
let requestChain = Promise.resolve();
let lastRequestAt = 0;

const FRANCHISE_OVERRIDES = {
  'Resident Evil': { aliases: ['Resident Evil'], heroHints: ['Resident Evil 4', 'Resident Evil 2', 'Resident Evil Village'] },
  'The Legend of Zelda': { aliases: ['The Legend of Zelda', 'Zelda'], heroHints: ['The Legend of Zelda: Breath of the Wild', 'The Legend of Zelda: Tears of the Kingdom', 'The Legend of Zelda: Ocarina of Time'] },
  'Sonic': { aliases: ['Sonic the Hedgehog', 'Sonic'], heroHints: ['Sonic Frontiers', 'Sonic Generations', 'Sonic the Hedgehog'] }
};

function envConfig() {
  return { clientId: process.env.IGDB_CLIENT_ID, clientSecret: process.env.IGDB_CLIENT_SECRET };
}

function escapeApicalypse(value = '') {
  return String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"').slice(0, 120);
}

async function rateLimited(task) {
  const run = async () => {
    const wait = Math.max(0, REQUEST_GAP_MS - (Date.now() - lastRequestAt));
    if (wait) await new Promise(resolve => setTimeout(resolve, wait));
    lastRequestAt = Date.now();
    return task();
  };
  const next = requestChain.then(run, run);
  requestChain = next.catch(() => undefined);
  return next;
}

export async function getTwitchToken() {
  const { clientId, clientSecret } = envConfig();
  if (!clientId || !clientSecret) {
    const error = new Error('IGDB credentials are not configured');
    error.status = 503;
    throw error;
  }
  const now = Date.now();
  if (tokenCache.value && now < tokenCache.refreshAt) return tokenCache.value;

  const params = new URLSearchParams({ client_id: clientId, client_secret: clientSecret, grant_type: 'client_credentials' });
  const response = await fetch(`${TWITCH_TOKEN_URL}?${params}`, { method: 'POST', headers: { Accept: 'application/json' } });
  if (!response.ok) {
    const error = new Error(`Twitch auth failed (${response.status})`); error.status = response.status; throw error;
  }
  const data = await response.json();
  const ttlMs = Math.max(60_000, Number(data.expires_in || 3600) * 1000);
  tokenCache = {
    value: data.access_token,
    expiresAt: now + ttlMs,
    refreshAt: now + Math.floor(ttlMs * 0.8)
  };
  return tokenCache.value;
}

export async function queryIgdb(endpoint, body) {
  const { clientId } = envConfig();
  const token = await getTwitchToken();
  return rateLimited(async () => {
    const response = await fetch(`${IGDB_BASE}/${endpoint}`, {
      method: 'POST',
      headers: { 'Client-ID': clientId, Authorization: `Bearer ${token}`, Accept: 'application/json', 'Content-Type': 'text/plain' },
      body
    });
    if (!response.ok) {
      const error = new Error(`IGDB ${endpoint} failed (${response.status})`); error.status = response.status; throw error;
    }
    return response.json();
  });
}

function igdbImage(imageId, size) {
  return imageId ? `https://images.igdb.com/igdb/image/upload/t_${size}/${imageId}.jpg` : null;
}

function mediaScore(media, desiredRatio = 16 / 9) {
  if (!media?.image_id) return -1;
  const w = Number(media.width || 0), h = Number(media.height || 0);
  const ratio = w && h ? w / h : desiredRatio;
  const ratioPenalty = Math.abs(ratio - desiredRatio) * 1000;
  const pixels = Math.min(5_000_000, w * h) / 1000;
  return pixels - ratioPenalty;
}

function selectHero(game) {
  const artworks = [...(game.artworks || [])].sort((a,b) => mediaScore(b) - mediaScore(a));
  const screenshots = [...(game.screenshots || [])].sort((a,b) => mediaScore(b) - mediaScore(a));
  const selected = artworks[0] || screenshots[0] || null;
  if (!selected) return null;
  return { imageId: selected.image_id, url: igdbImage(selected.image_id, '1080p'), width: selected.width || null, height: selected.height || null, source: artworks[0] ? 'artwork' : 'screenshot' };
}

function normalizeRelation(value) {
  if (!value) return [];
  const arr = Array.isArray(value) ? value : [value];
  return arr.map(item => typeof item === 'object' ? { id:item.id, name:item.name || null, slug:item.slug || null } : { id:item, name:null, slug:null });
}

function normalizeGame(game) {
  const year = game.first_release_date ? new Date(game.first_release_date * 1000).getUTCFullYear() : null;
  return {
    id: game.id,
    name: game.name,
    slug: game.slug,
    year,
    summary: game.summary || null,
    gameType: typeof game.game_type === 'object' ? game.game_type.type : null,
    versionTitle: game.version_title || null,
    versionParent: game.version_parent ? normalizeRelation(game.version_parent)[0] : null,
    platforms: (game.platforms || []).map(p => typeof p === 'object' ? p.name : p).filter(Boolean),
    franchises: (game.franchises || []).map(f => typeof f === 'object' ? f.name : f).filter(Boolean),
    collections: (game.collections || []).map(c => typeof c === 'object' ? c.name : c).filter(Boolean),
    cover: game.cover?.image_id ? { imageId:game.cover.image_id, url:igdbImage(game.cover.image_id, 'cover_big') } : null,
    hero: selectHero(game),
    relations: {
      remakes: normalizeRelation(game.remakes), remasters: normalizeRelation(game.remasters), ports: normalizeRelation(game.ports)
    },
    popularitySignal: Number(game.total_rating_count || 0) + Number(game.hypes || 0)
  };
}

const GAME_FIELDS = 'fields name,slug,summary,first_release_date,game_type.type,version_title,version_parent.name,version_parent.slug,platforms.name,franchises.name,collections.name,cover.image_id,cover.width,cover.height,artworks.image_id,artworks.width,artworks.height,screenshots.image_id,screenshots.width,screenshots.height,remakes.name,remakes.slug,remasters.name,remasters.slug,ports.name,ports.slug,total_rating_count,hypes;';

export async function searchGame(query, year = null) {
  const safe = escapeApicalypse(query);
  const games = await queryIgdb('games', `${GAME_FIELDS} search "${safe}"; where version_parent = null; limit 20;`);
  const target = String(query).toLowerCase();
  const ranked = games.map(game => {
    const gameYear = game.first_release_date ? new Date(game.first_release_date * 1000).getUTCFullYear() : null;
    const exact = String(game.name || '').toLowerCase() === target ? 5000 : 0;
    const yearScore = year && gameYear ? Math.max(0, 2400 - Math.abs(Number(year) - gameYear) * 800) : 0;
    const media = (game.artworks?.length ? 500 : 0) + (game.cover ? 250 : 0);
    return { game, score: exact + yearScore + media + Math.min(1200, Number(game.total_rating_count || 0)) };
  }).sort((a,b) => b.score - a.score);
  return ranked[0] ? normalizeGame(ranked[0].game) : null;
}

async function findSeriesRecord(endpoint, query) {
  const safe = escapeApicalypse(query);
  const records = await queryIgdb(endpoint, `fields name,slug,games; search "${safe}"; limit 10;`);
  const target = query.toLowerCase();
  return records.sort((a,b) => {
    const ae = String(a.name || '').toLowerCase() === target ? 1 : 0;
    const be = String(b.name || '').toLowerCase() === target ? 1 : 0;
    return be - ae || (b.games?.length || 0) - (a.games?.length || 0);
  })[0] || null;
}

function scoreHeroGame(game, hints = []) {
  const normalized = normalizeGame(game);
  const hintIndex = hints.findIndex(h => h.toLowerCase() === String(game.name || '').toLowerCase());
  const hintScore = hintIndex >= 0 ? 9000 - hintIndex * 1000 : 0;
  const type = normalized.gameType?.toLowerCase?.() || '';
  const typeScore = type.includes('main') || type.includes('remake') ? 900 : type.includes('port') ? -400 : 0;
  const mediaScoreValue = game.artworks?.length ? 1600 : game.screenshots?.length ? 700 : 0;
  return hintScore + typeScore + mediaScoreValue + Math.min(2500, normalized.popularitySignal);
}

export async function getFranchiseBundle(query) {
  const override = FRANCHISE_OVERRIDES[query] || { aliases:[query], heroHints:[] };
  const alias = override.aliases[0] || query;
  let series = await findSeriesRecord('franchises', alias);
  let source = 'franchise';
  if (!series || (series.games?.length || 0) < 2) {
    const collection = await findSeriesRecord('collections', alias);
    if (collection && (collection.games?.length || 0) > (series?.games?.length || 0)) { series = collection; source = 'collection'; }
  }
  if (!series?.games?.length) return { name:query, source:'curation', games:[], hero:null };

  const ids = series.games.slice(0, 80).join(',');
  const games = await queryIgdb('games', `${GAME_FIELDS} where id = (${ids}); limit 80;`);
  const ranked = [...games].sort((a,b) => scoreHeroGame(b, override.heroHints) - scoreHeroGame(a, override.heroHints));
  const heroGame = ranked.find(g => selectHero(g));
  return {
    name: series.name || query,
    slug: series.slug || null,
    source,
    hero: heroGame ? { ...selectHero(heroGame), gameId:heroGame.id, gameName:heroGame.name } : null,
    games: games.map(normalizeGame).sort((a,b) => (a.year || 9999) - (b.year || 9999))
  };
}

export async function getBrandAssets(query) {
  const safe = escapeApicalypse(query);
  const companies = await queryIgdb('companies', `fields name,slug,logo.image_id; search "${safe}"; limit 10;`);
  const target = query.toLowerCase();
  const company = companies.sort((a,b) => (String(b.name).toLowerCase() === target) - (String(a.name).toLowerCase() === target))[0];
  return company ? { id:company.id, name:company.name, slug:company.slug, logo:company.logo?.image_id ? igdbImage(company.logo.image_id, 'logo_med') : null } : null;
}

export function igdbConfigured() {
  const { clientId, clientSecret } = envConfig();
  return Boolean(clientId && clientSecret);
}
