'use strict';

/**
 * Parte B, item 7e: contador de buscas sem resultado, pra descobrir apelido
 * que falta no catálogo. Sem IP, sem user-agent, sem qualquer identificação —
 * só o termo já normalizado (minúsculas, sem acento) e uma contagem (HINCRBY
 * num hash), no MESMO Redis (Upstash) já configurado pro token do Mercado
 * Livre (ver lib/meli-token.js). Atrás de DUAS flags desligadas por padrão:
 * SEARCH_MISS_LOG=false no cliente (src/app-1-core.js) E
 * process.env.SEARCH_MISS_LOG !== 'true' aqui — as duas pontas precisam
 * concordar antes de qualquer escrita acontecer.
 */
const HASH_KEY = 'search:misses:v1';
const MAX_TERM_LEN = 80;

function kvConfig() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url: url.replace(/\/$/, ''), token } : null;
}

async function recordSearchMiss(rawTerm) {
  if (process.env.SEARCH_MISS_LOG !== 'true') return { logged: false, reason: 'flag_off' };
  const config = kvConfig();
  if (!config) return { logged: false, reason: 'kv_not_configured' };
  const term = String(rawTerm || '').trim().toLowerCase().slice(0, MAX_TERM_LEN);
  if (!term) return { logged: false, reason: 'empty_term' };
  const response = await fetch(config.url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${config.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(['HINCRBY', HASH_KEY, term, 1])
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.error) {
    const error = new Error(data.error || `Redis respondeu HTTP ${response.status}`);
    error.status = 502;
    throw error;
  }
  return { logged: true };
}

module.exports = { recordSearchMiss };
