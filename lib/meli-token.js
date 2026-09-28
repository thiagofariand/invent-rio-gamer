/**
 * Token do Mercado Livre com renovação automática.
 *
 * O access token vence em ~6h e o refresh token é rotativo: cada renovação
 * devolve um refresh novo e invalida o anterior. Como uma função serverless
 * não consegue reescrever variável de ambiente, o par de tokens fica num
 * Redis (Upstash, conectado pela aba Storage da Vercel) e é renovado sozinho
 * quando faltam poucos minutos pra vencer.
 *
 * Sem Redis configurado, tudo continua funcionando como antes: lê
 * MELI_ACCESS_TOKEN da variável de ambiente e a renovação é manual.
 *
 * Nada aqui usa dependência externa — o Redis é chamado pela API REST dele
 * (fetch), então não há `npm install` nem package.json a mexer.
 */
const { refreshAccessToken } = require('./meli-oauth');
const { cleanText } = require('./http');

const KEY = 'meli:tokens';
const LOCK = 'meli:lock';
const SKEW_MS = 10 * 60 * 1000; // renova quando faltarem menos de 10 min

let memory = { access: null, expiresAt: 0 };

function kvConfig() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url: url.replace(/\/$/, ''), token } : null;
}

async function kv(command) {
  const config = kvConfig();
  const response = await fetch(config.url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${config.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(command)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.error) {
    const error = new Error(data.error || `Redis respondeu HTTP ${response.status}`);
    error.status = 502;
    throw error;
  }
  return data.result;
}

async function readState() {
  const raw = await kv(['GET', KEY]);
  return raw ? JSON.parse(raw) : null;
}

async function writeState(state) {
  await kv(['SET', KEY, JSON.stringify(state)]);
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

/** Guarda o par de tokens vindo do login (OAuth) ou de uma renovação. */
async function saveTokens(data, previous) {
  const state = {
    access_token: data.access_token,
    refresh_token: data.refresh_token || previous?.refresh_token,
    expires_at: Date.now() + Number(data.expires_in || 21600) * 1000,
    updated_at: new Date().toISOString(),
    last_error: null
  };
  await writeState(state);
  memory = { access: state.access_token, expiresAt: state.expires_at };
  return state;
}

async function refreshNow(stored) {
  const clientId = process.env.MELI_CLIENT_ID;
  const clientSecret = process.env.MELI_CLIENT_SECRET;
  if (!clientId || !clientSecret || !stored?.refresh_token) return null;

  // Trava curta: se duas visitas chegarem juntas com o token vencido, só uma
  // renova (senão a segunda usaria um refresh token já invalidado).
  const locked = await kv(['SET', LOCK, '1', 'NX', 'EX', '25']);
  if (locked !== 'OK') {
    for (let i = 0; i < 8; i += 1) {
      await sleep(500);
      const fresh = await readState();
      if (fresh?.access_token && fresh.expires_at - Date.now() > SKEW_MS) {
        memory = { access: fresh.access_token, expiresAt: fresh.expires_at };
        return fresh.access_token;
      }
    }
    return null;
  }

  try {
    const data = await refreshAccessToken({ refreshToken: stored.refresh_token, clientId, clientSecret });
    const state = await saveTokens(data, stored);
    return state.access_token;
  } catch (error) {
    await writeState({
      ...stored,
      last_error: { at: new Date().toISOString(), status: error.status || null, message: cleanText(error.message, 160) }
    }).catch(() => {});
    return null;
  } finally {
    await kv(['DEL', LOCK]).catch(() => {});
  }
}

/**
 * Devolve um access token válido (ou null).
 * `force: true` ignora o que está guardado e renova agora.
 */
async function getAccessToken({ force = false } = {}) {
  if (!kvConfig()) return process.env.MELI_ACCESS_TOKEN || null;
  if (!force && memory.access && memory.expiresAt - Date.now() > SKEW_MS) return memory.access;

  let stored;
  try {
    stored = await readState();
  } catch {
    return process.env.MELI_ACCESS_TOKEN || null; // Redis fora do ar: degrada, não derruba
  }

  // Primeira vez com Redis ligado: aproveita as variáveis antigas, se existirem.
  if (!stored && process.env.MELI_REFRESH_TOKEN) {
    stored = {
      access_token: process.env.MELI_ACCESS_TOKEN || '',
      refresh_token: process.env.MELI_REFRESH_TOKEN,
      expires_at: 0
    };
  }
  if (!stored) return process.env.MELI_ACCESS_TOKEN || null;

  if (!force && stored.access_token && stored.expires_at - Date.now() > SKEW_MS) {
    memory = { access: stored.access_token, expiresAt: stored.expires_at };
    return stored.access_token;
  }

  const refreshed = await refreshNow(stored);
  if (refreshed) return refreshed;
  return stored.access_token && stored.expires_at > Date.now() ? stored.access_token : null;
}

/** Resumo legível pro painel de saúde (nunca devolve o token em si). */
async function tokenInfo() {
  if (!kvConfig()) {
    return { mode: 'env', automatic: false, hasToken: Boolean(process.env.MELI_ACCESS_TOKEN) };
  }
  try {
    const stored = await readState();
    if (!stored) return { mode: 'kv', automatic: true, connected: false };
    return {
      mode: 'kv',
      automatic: true,
      connected: true,
      expiresInMinutes: Math.round((stored.expires_at - Date.now()) / 60000),
      updatedAt: stored.updated_at || null,
      lastError: stored.last_error || null
    };
  } catch (error) {
    return { mode: 'kv', automatic: true, connected: null, redisError: cleanText(error.message, 160) };
  }
}

module.exports = { getAccessToken, saveTokens, tokenInfo, kvConfig };
