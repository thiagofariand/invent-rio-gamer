import { getBrandAssets } from '../../lib/igdb.js';
import { getQuery, methodNotAllowed, sanitizeExternalError, sendJson } from '../../lib/http.js';
export default async function handler(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res);
  const q = getQuery(req, 'q').trim();
  if (q.length < 2) return sendJson(res, 400, { error:{ message:'q must have at least 2 characters', status:400 } });
  try { return sendJson(res, 200, { brand:await getBrandAssets(q) }, 'public, s-maxage=86400, stale-while-revalidate=604800'); }
  catch (error) { const safe=sanitizeExternalError(error); console.error('igdb/brand',safe); return sendJson(res,503,{error:safe}); }
}
