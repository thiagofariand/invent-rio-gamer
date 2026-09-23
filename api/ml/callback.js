const {
  escapeHtml,
  exchangeAuthorizationCode,
  parseCookies
} = require('../../lib/meli-oauth');
const { safeError } = require('../../lib/http');

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  if (req.method !== 'GET') return res.status(405).send('Método não permitido.');

  const { code, state, error, error_description: description } = req.query || {};
  if (error) return res.status(400).send(`OAuth cancelado/negado: ${escapeHtml(error)} ${escapeHtml(description)}`);

  const cookies = parseCookies(req);
  if (!code || !state || !cookies.meli_oauth_state || state !== cookies.meli_oauth_state) {
    return res.status(400).send('Falha na validação do OAuth. Volte e tente novamente.');
  }

  const clientId = process.env.MELI_CLIENT_ID;
  const clientSecret = process.env.MELI_CLIENT_SECRET;
  if (!clientId || !clientSecret) return res.status(500).send('Credenciais MELI não configuradas na Vercel.');

  try {
    const data = await exchangeAuthorizationCode({ code, clientId, clientSecret });
    const access = escapeHtml(data.access_token);
    const refresh = escapeHtml(data.refresh_token);
    res.setHeader('Set-Cookie', 'meli_oauth_state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0');
    return res.status(200).send(`<!doctype html>
<html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Inventário • Mercado Livre conectado</title>
<style>body{font-family:system-ui;background:#f7f7f4;color:#1f2937;max-width:780px;margin:40px auto;padding:0 20px}.box{background:#fff;border:1px solid #e5e7eb;padding:20px;border-radius:12px}code{display:block;word-break:break-all;background:#f5f6f7;padding:10px;border-radius:8px;margin:8px 0 18px}.warn{color:#8a5d00;background:#fff8d9;border:1px solid #eedb8a;padding:10px;border-radius:8px}</style>
<body><div class="box"><h1>Mercado Livre conectado</h1>
<p>Copie estes valores diretamente para as variáveis Production da Vercel e feche esta página.</p>
<div class="warn"><strong>Não envie estes tokens por chat, print ou GitHub.</strong> A renovação permanece manual nesta versão.</div>
<h3>MELI_ACCESS_TOKEN</h3><code>${access}</code>
<h3>MELI_REFRESH_TOKEN</h3><code>${refresh}</code>
<p>O access token expira em aproximadamente ${Math.round((data.expires_in || 21600) / 3600)} horas.</p>
</div></body></html>`);
  } catch (exchangeError) {
    const safe = safeError(exchangeError, 'meli_oauth_failed');
    return res.status(safe.status).send(`Mercado Livre recusou a conexão: ${escapeHtml(safe.message)}`);
  }
};
