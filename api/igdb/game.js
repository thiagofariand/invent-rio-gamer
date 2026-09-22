import { searchGame } from '../../lib/igdb.js';
import { getQuery, methodNotAllowed, sanitizeExternalError, sendJson } from '../../lib/http.js';
export default async function handler(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res);
  const q = getQuery(req, 'q').trim();
  const yearRaw = getQuery(req, 'year').trim();
  if (q.length < 2) return sendJson(res, 400, { error:{ message:'q must have at least 2 characters', status:400 } });
  try {
    const game = await searchGame(q, /^\d{4}$/.test(yearRaw) ? Number(yearRaw) : null);
    return sendJson(res, 200, { game }, 'public, s-maxage=21600, stale-while-revalidate=86400');
  } catch (error) {
    const safe = sanitizeExternalError(error);
    console.error('igdb/game', safe);
    return sendJson(res, safe.status >= 500 ? 503 : safe.status, { error:safe });
  }
}
