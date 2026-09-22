const crypto = require('crypto');

const REDIRECT_URI = 'https://inventario-gamer.vercel.app/api/ml/callback';

module.exports = async function handler(req, res) {
  const clientId = process.env.MELI_CLIENT_ID;
  if (!clientId) {
    return res.status(500).json({ error: 'missing_meli_client_id' });
  }

  const state = crypto.randomBytes(24).toString('hex');

  res.setHeader(
    'Set-Cookie',
    `meli_oauth_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`
  );

  const url = new URL('https://auth.mercadolivre.com.br/authorization');
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', REDIRECT_URI);
  url.searchParams.set('state', state);

  res.writeHead(302, { Location: url.toString() });
  res.end();
};