const { cleanText } = require('./http');

let tokenCache = { value: null, expiresAt: 0 };
let statusCache = { value: null, expiresAt: 0 };

function norm(value) {
  return String(value || '').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ').trim();
}

function escApicalypse(value) {
  return String(value || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function imageUrl(imageId, size) {
  return imageId
    ? `https://images.igdb.com/igdb/image/upload/t_${size}/${imageId}.jpg`
    : null;
}

function pickHero(game) {
  const images = [
    ...(Array.isArray(game.artworks) ? game.artworks : []).map(item => ({ ...item, kind: 'artwork' })),
    ...(Array.isArray(game.screenshots) ? game.screenshots : []).map(item => ({ ...item, kind: 'screenshot' }))
  ].filter(item => item?.image_id);

  if (!images.length) return null;
  const target = 16 / 9;
  images.sort((a, b) => {
    const ratioA = (Number(a.width) || 1) / (Number(a.height) || 1);
    const ratioB = (Number(b.width) || 1) / (Number(b.height) || 1);
    const scoreA = Math.abs(ratioA - target) + (a.kind === 'artwork' ? 0 : 0.15);
    const scoreB = Math.abs(ratioB - target) + (b.kind === 'artwork' ? 0 : 0.15);
    return scoreA - scoreB;
  });

  const best = images[0];
  return {
    kind: best.kind,
    imageId: best.image_id,
    url: imageUrl(best.image_id, '1080p'),
    preview: imageUrl(best.image_id, '720p'),
    width: best.width || null,
    height: best.height || null
  };
}

async function getAppToken(clientId, clientSecret) {
  const now = Date.now();
  if (tokenCache.value && now < tokenCache.expiresAt) return tokenCache.value;

  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'client_credentials'
  });
  const response = await fetch(`https://id.twitch.tv/oauth2/token?${params}`, {
    method: 'POST',
    headers: { Accept: 'application/json' }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.access_token) {
    const error = new Error(data.message || 'Falha ao gerar token Twitch');
    error.status = response.status;
    throw error;
  }

  const ttlMs = Number(data.expires_in || 3600) * 1000;
  tokenCache = {
    value: data.access_token,
    // Refaz a autenticação aos 80% do TTL, como margem para instâncias aquecidas.
    expiresAt: now + Math.floor(ttlMs * 0.8)
  };
  return tokenCache.value;
}

async function requestIgdb(path, body, credentials) {
  const token = await getAppToken(credentials.clientId, credentials.clientSecret);
  const response = await fetch(`https://api.igdb.com/v4/${path}`, {
    method: 'POST',
    headers: {
      'Client-ID': credentials.clientId,
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      'Content-Type': 'text/plain'
    },
    body
  });
  const data = await response.json().catch(() => []);
  if (!response.ok) {
    const error = new Error(Array.isArray(data) ? 'IGDB request failed' : data?.message || 'IGDB request failed');
    error.status = response.status;
    throw error;
  }
  return Array.isArray(data) ? data : [];
}

function tokens(value) {
  return new Set(norm(value).split(' ').filter(Boolean));
}

// Compara plataforma do catálogo com a da IGDB por três vias, porque nomes
// curtos como "PS1"/"PSP" não são substring de "PlayStation"/"PlayStation
// Portable" — mas costumam bater com o campo `abbreviation` da IGDB. Casos
// como "PS Vita" x "PlayStation Vita" não batem nem por nome nem por
// abreviação isolados, mas dividem a palavra "vita" — daí o terceiro
// critério, por sobreposição de token.
function platformMatches(catalogPlatform, igdbPlatform) {
  const wanted = norm(catalogPlatform);
  const name = norm(igdbPlatform?.name);
  const abbr = norm(igdbPlatform?.abbreviation);
  if (name && (name.includes(wanted) || wanted.includes(name))) return true;
  if (abbr && (abbr === wanted || abbr.includes(wanted) || wanted.includes(abbr))) return true;
  if (name) {
    const a = tokens(catalogPlatform);
    const b = tokens(igdbPlatform.name);
    for (const t of a) if (b.has(t)) return true;
  }
  return false;
}

function scoreGame(game, query, platform, year) {
  let score = 0;
  const name = norm(game.name);
  const wanted = norm(query);
  if (name === wanted) score += 100;
  else if (name.startsWith(wanted) || wanted.startsWith(name)) score += 45;
  else if (name.includes(wanted) || wanted.includes(name)) score += 25;

  if (platform) {
    const platforms = Array.isArray(game.platforms) ? game.platforms : [];
    if (platforms.some(item => platformMatches(platform, item))) score += 20;
  }
  if (year && game.first_release_date) {
    const releaseYear = new Date(Number(game.first_release_date) * 1000).getUTCFullYear();
    const difference = Math.abs(Number(year) - releaseYear);
    if (difference === 0) score += 15;
    else if (difference === 1) score += 6;
  }
  if (game.cover?.image_id) score += 4;
  if (game.artworks?.length) score += 3;
  return score;
}

// Abaixo deste score, tratamos como "não encontrado" em vez de arriscar
// mostrar a capa/arte de um jogo errado com confiança baixa.
const MIN_CONFIDENT_SCORE = 40;

// Muitos títulos do catálogo combinam duas versões em um nome só
// ("Pokémon Red and Blue", "Pokémon Sun and Moon"), mas no IGDB cada
// versão costuma ser um jogo separado ("Pokémon Red Version", "Pokémon
// Sun"). Se a busca com o nome completo não for confiante o bastante,
// tentamos de novo só com a primeira metade do nome.
function splitCombinedTitle(query) {
  const match = query.match(/^(.*?)\s+(?:and|e)\s+.+$/i);
  if (!match) return null;
  const firstHalf = match[1].trim();
  return firstHalf.length >= 2 ? firstHalf : null;
}

// Remakes/remasters que reaproveitam o nome original ganham, no nosso
// catálogo, um sufixo "(ano)" só pra diferenciar da versão clássica (ex:
// "Resident Evil 4 (2023)", "...Ocarina of Time (2026)"). Esse sufixo é
// nosso, não da IGDB — buscar o texto exato com "(2023)" colado costuma
// não achar nada na busca por texto deles. Se a busca completa falhar,
// tenta de novo sem o sufixo, mantendo o ano só como critério de pontuação.
function stripYearSuffix(query) {
  const match = query.match(/^(.*?)\s*\(\d{4}\)\s*$/);
  return match ? match[1].trim() : null;
}

async function searchOnce(q, platformName, releaseYear, credentials) {
  const body = [
    `search "${escApicalypse(q)}";`,
    'fields id,name,slug,summary,storyline,first_release_date,platforms.name,platforms.abbreviation,cover.image_id,cover.width,cover.height,artworks.image_id,artworks.width,artworks.height,screenshots.image_id,screenshots.width,screenshots.height,involved_companies.developer,involved_companies.publisher,involved_companies.company.name;',
    'limit 10;'
  ].join('\n');
  const games = (await requestIgdb('games', body, credentials))
    .map(game => ({ ...game, score: scoreGame(game, q, platformName, releaseYear) }))
    .sort((a, b) => b.score - a.score);
  return games[0] || null;
}

async function findGame({ query, platform, year, credentials }) {
  const q = cleanText(query, 160);
  const platformName = cleanText(platform, 80);
  const releaseYear = cleanText(year, 4);
  if (q.length < 2) {
    const error = new Error('query_too_short');
    error.status = 400;
    throw error;
  }

  let game = await searchOnce(q, platformName, releaseYear, credentials);

  // Nome completo não convenceu (ou não achou nada)? Tenta variantes mais
  // simples do texto antes de desistir: primeiro sem o sufixo "(ano)" que é
  // nosso, depois só a primeira metade de um título combinado "X and Y".
  if (!game || game.score < MIN_CONFIDENT_SCORE) {
    const withoutYear = stripYearSuffix(q);
    if (withoutYear) {
      const alt = await searchOnce(withoutYear, platformName, releaseYear, credentials);
      if (alt && (!game || alt.score > game.score)) game = alt;
    }
  }
  if (!game || game.score < MIN_CONFIDENT_SCORE) {
    const firstHalf = splitCombinedTitle(q);
    if (firstHalf) {
      const alt = await searchOnce(firstHalf, platformName, releaseYear, credentials);
      if (alt && (!game || alt.score > game.score)) game = alt;
    }
  }

  if (!game || game.score < MIN_CONFIDENT_SCORE) {
    return { ok: true, found: false, query: q };
  }

  return {
    ok: true,
    found: true,
    query: q,
    game: {
      id: game.id,
      name: game.name,
      slug: game.slug,
      summary: game.summary || game.storyline || null,
      releaseYear: game.first_release_date
        ? new Date(Number(game.first_release_date) * 1000).getUTCFullYear()
        : null,
      platforms: (game.platforms || []).map(item => item.name).filter(Boolean),
      developers: (game.involved_companies || [])
        .filter(item => item?.developer && item?.company?.name)
        .map(item => item.company.name),
      publishers: (game.involved_companies || [])
        .filter(item => item?.publisher && item?.company?.name)
        .map(item => item.company.name)
    },
    cover: game.cover?.image_id ? {
      imageId: game.cover.image_id,
      url: imageUrl(game.cover.image_id, 'cover_big_2x'),
      preview: imageUrl(game.cover.image_id, 'cover_big')
    } : null,
    hero: pickHero(game),
    source: 'IGDB'
  };
}

async function getStatus(credentials) {
  const now = Date.now();
  if (statusCache.value && now < statusCache.expiresAt) return statusCache.value;
  const data = await requestIgdb('games', 'fields id,name; search "The Legend of Zelda"; limit 1;', credentials);
  statusCache = {
    value: {
      configured: true,
      tokenOk: true,
      igdbOk: true,
      sample: data[0] ? { id: data[0].id, name: data[0].name } : null
    },
    expiresAt: now + 60_000
  };
  return statusCache.value;
}

module.exports = { findGame, getStatus };
