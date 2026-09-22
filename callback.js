const REDIRECT_URI = 'https://inventario-gamer.vercel.app/api/ml/callback';

function parseCookies(req) {
  const header = req.headers.cookie || '';
  return Object.fromEntries(
    header.split(';').map(x => x.trim()).filter(Boolean).map(x => {
      const i = x.indexOf('=');
      return [x.slice(0, i), decodeURIComponent(x.slice(i + 1))];
    })
  );
}

function esc(s) {
  return String(s || '').replace(/[&<>"']/g, m => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'
  })[m]);
}

module.exports = async function handler(req, res) {
  const { code, state, error, error_description } = req.query || {};
  res.setHeader('Cache-Control', 'no-store, max-age=0');

  if (error) {
    return res.status(400).send(`OAuth cancelado/negado: ${esc(error)} ${esc(error_description)}`);
  }

  const cookies = parseCookies(req);
  if (!code || !state || !cookies.meli_oauth_state || state !== cookies.meli_oauth_state) {
    return res.status(400).send('Falha na validação do OAuth (state/code). Volte e tente novamente.');
  }

  const clientId = process.env.MELI_CLIENT_ID;
  const clientSecret = process.env.MELI_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return res.status(500).send('Credenciais MELI não configuradas na Vercel.');
  }

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: clientId,
    client_secret: clientSecret,
    code,
    redirect_uri: REDIRECT_URI
  });

  const tokenResponse = await fetch('https://api.mercadolibre.com/oauth/token', {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'content-type': 'application/x-www-form-urlencoded'
    },
    body
  });

  const data = await tokenResponse.json().catch(() => ({}));

  if (!tokenResponse.ok) {
    return res.status(tokenResponse.status).send(
      `<h2>Mercado Livre recusou a troca do código</h2><pre>${esc(JSON.stringify(data, null, 2))}</pre>`
    );
  }

  // Para o piloto: mostramos os tokens uma única vez para o dono copiar
  // diretamente para Environment Variables da Vercel.
  // NÃO cole esses valores em GitHub, chat ou prints.
  const access = esc(data.access_token);
  const refresh = esc(data.refresh_token);

  res.setHeader(
    'Set-Cookie',
    'meli_oauth_state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0'
  );

  return res.status(200).send(`<!doctype html>
  <html lang="pt-BR">
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Inventário • Mercado Livre conectado</title>
  <style>
    body{font-family:system-ui;background:#f7f7f4;color:#1f2937;max-width:780px;margin:40px auto;padding:0 20px}
    .box{background:#fff;border:1px solid #e5e7eb;padding:20px;border-radius:12px}
    code{display:block;word-break:break-all;background:#f5f6f7;padding:10px;border-radius:8px;margin:8px 0 18px}
    .warn{color:#8a5d00;background:#fff8d9;border:1px solid #eedb8a;padding:10px;border-radius:8px}
  </style>
  <body>
    <div class="box">
      <h1>Mercado Livre conectado ✅</h1>
      <p>Para este piloto, copie os valores abaixo diretamente para a Vercel e depois feche esta página.</p>
      <div class="warn"><strong>Não envie estes tokens por chat, print ou GitHub.</strong> Esta página usa no-store e não deve ser compartilhada.</div>
      <h3>MELI_ACCESS_TOKEN</h3>
      <code>${access}</code>
      <h3>MELI_REFRESH_TOKEN</h3>
      <code>${refresh}</code>
      <p>O access token expira em aproximadamente ${Math.round((data.expires_in || 21600)/3600)} horas. O refresh token será usado depois para automatizar a renovação.</p>
    </div>
  </body></html>`);
};