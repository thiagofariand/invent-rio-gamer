const crypto = require('crypto');

function redirectUri() {
  return process.env.MELI_REDIRECT_URI || 'https://inventario-gamer.vercel.app/api/ml/callback';
}

function escapeHtml(value) {
  return String(value || '').replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  })[character]);
}

function parseCookies(req) {
  const header = req.headers.cookie || '';
  return Object.fromEntries(header.split(';').map(value => value.trim()).filter(Boolean).map(value => {
    const index = value.indexOf('=');
    if (index < 0) return [value, ''];
    return [value.slice(0, index), decodeURIComponent(value.slice(index + 1))];
  }));
}

function createAuthorization(clientId) {
  const state = crypto.randomBytes(24).toString('hex');
  const url = new URL('https://auth.mercadolivre.com.br/authorization');
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', redirectUri());
  url.searchParams.set('state', state);
  return {
    state,
    url: url.toString(),
    cookie: `meli_oauth_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`
  };
}

async function exchangeAuthorizationCode({ code, clientId, clientSecret }) {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: clientId,
    client_secret: clientSecret,
    code,
    redirect_uri: redirectUri()
  });
  const response = await fetch('https://api.mercadolibre.com/oauth/token', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || data.error || 'Mercado Livre recusou a troca do código');
    error.status = response.status;
    throw error;
  }
  return data;
}

module.exports = {
  createAuthorization,
  escapeHtml,
  exchangeAuthorizationCode,
  parseCookies
};
