const { checkStatus } = require('../../lib/mercadolivre');
const { requireDiagnosticsAccess, safeError } = require('../../lib/http');

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') return res.status(405).json({ error: 'method_not_allowed' });
  if (!requireDiagnosticsAccess(req, res)) return;

  const token = process.env.MELI_ACCESS_TOKEN;
  if (!token) return res.status(200).json({ configured: false });

  try {
    return res.status(200).json(await checkStatus(token));
  } catch (error) {
    const safe = safeError(error, 'meli_status_failed');
    return res.status(200).json({ configured: true, ok: false, httpStatus: safe.status, error: safe.message });
  }
};
