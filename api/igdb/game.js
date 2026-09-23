const { findGame } = require('../../lib/igdb');
const { safeError } = require('../../lib/http');

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800');
  if (req.method !== 'GET') return res.status(405).json({ error: 'method_not_allowed' });

  const clientId = process.env.IGDB_CLIENT_ID;
  const clientSecret = process.env.IGDB_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return res.status(503).json({ error: 'igdb_not_configured' });
  }

  try {
    const result = await findGame({
      query: req.query.q || req.query.title,
      platform: req.query.platform,
      year: req.query.year,
      credentials: { clientId, clientSecret }
    });
    return res.status(200).json(result);
  } catch (error) {
    const safe = safeError(error, 'igdb_server_error');
    return res.status(safe.status).json({ error: 'igdb_server_error', message: safe.message });
  }
};
