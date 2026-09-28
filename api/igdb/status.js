const { getStatus } = require('../../lib/igdb');
const { requireDiagnosticsAccess, safeError } = require('../../lib/http');

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') return res.status(405).json({ error: 'method_not_allowed' });
  if (!requireDiagnosticsAccess(req, res)) return;

  const clientId = process.env.IGDB_CLIENT_ID;
  const clientSecret = process.env.IGDB_CLIENT_SECRET;
  if (!clientId || !clientSecret) return res.status(200).json({ configured: false });

  try {
    return res.status(200).json(await getStatus({ clientId, clientSecret }));
  } catch (error) {
    const safe = safeError(error, 'igdb_status_failed');
    return res.status(200).json({ configured: true, tokenOk: false, httpStatus: safe.status, error: safe.message });
  }
};
