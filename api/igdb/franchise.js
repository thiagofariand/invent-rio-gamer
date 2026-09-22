import { getFranchiseBundle } from '../../lib/igdb.js';
import { getQuery, methodNotAllowed, sanitizeExternalError, sendJson } from '../../lib/http.js';
export default async function handler(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res);
  const q = getQuery(req, 'q').trim();
  if (q.length < 2) return sendJson(res, 400, { error:{ message:'q must have at least 2 characters', status:400 } });
  try {
    const bundle = await getFranchiseBundle(q);
    return sendJson(res, 200, bundle, 'public, s-maxage=43200, stale-while-revalidate=172800');
  } catch (error) {
    const safe = sanitizeExternalError(error);
    console.error('igdb/franchise', safe);
    return sendJson(res, safe.status >= 500 ? 503 : safe.status, { error:safe });
  }
}
