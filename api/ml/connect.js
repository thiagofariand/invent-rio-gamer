const { createAuthorization } = require('../../lib/meli-oauth');

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') return res.status(405).json({ error: 'method_not_allowed' });

  const clientId = process.env.MELI_CLIENT_ID;
  if (!clientId) return res.status(500).json({ error: 'missing_meli_client_id' });

  const authorization = createAuthorization(clientId);
  res.setHeader('Set-Cookie', authorization.cookie);
  res.writeHead(302, { Location: authorization.url });
  res.end();
};
