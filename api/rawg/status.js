const { getStatus } = require('../../lib/rawg');
const { requireDiagnosticsAccess, safeError } = require('../../lib/http');

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') return res.status(405).json({ error: 'method_not_allowed' });
  if (!requireDiagnosticsAccess(req, res)) return;

  const apiKey = process.env.RAWG_API_KEY;
  if (!apiKey) return res.status(200).json({ configured: false });

  try {
    return res.status(200).json(await getStatus({ apiKey }));
  } catch (error) {
    const safe = safeError(error, 'rawg_status_failed');
    return res.status(200).json({ configured: true, apiOk: false, httpStatus: safe.status, message: safe.message });
  }
};
