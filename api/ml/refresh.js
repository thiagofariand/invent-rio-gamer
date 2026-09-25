const {
  escapeHtml,
  refreshAccessToken
} = require('../../lib/meli-oauth');
const { requireDiagnosticsAccess, safeError } = require('../../lib/http');

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') return res.status(405).json({ error: 'method_not_allowed' });
  if (!requireDiagnosticsAccess(req, res)) return;

  const clientId = process.env.MELI_CLIENT_ID;
  const clientSecret = process.env.MELI_CLIENT_SECRET;
  const refreshToken = process.env.MELI_REFRESH_TOKEN;
  if (!clientId || !clientSecret) return res.status(500).json({ error: 'missing_meli_client_credentials' });
  if (!refreshToken) {
    return res.status(400).json({
      error: 'missing_refresh_token',
      hint: 'Nenhum MELI_REFRESH_TOKEN configurado ainda. Autorize uma vez em /api/ml/connect.'
    });
  }

  try {
    const data = await refreshAccessToken({ refreshToken, clientId, clientSecret });
    const access = escapeHtml(data.access_token);
    const refresh = escapeHtml(data.refresh_token || refreshToken);
    return res.status(200).send(`<!doctype html>
<html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Inventário • Mercado Livre renovado</title>
<style>body{font-family:system-ui;background:#f7f7f4;color:#1f2937;max-width:780px;margin:40px auto;padding:0 20px}.box{background:#fff;border:1px solid #e5e7eb;padding:20px;border-radius:12px}code{display:block;word-break:break-all;background:#f5f6f7;padding:10px;border-radius:8px;margin:8px 0 18px}.warn{color:#8a5d00;background:#fff8d9;border:1px solid #eedb8a;padding:10px;border-radius:8px}</style>
<body><div class="box"><h1>Token renovado</h1>
<p>Atualize estes valores nas variáveis Production da Vercel (o refresh token pode ter mudado — o Mercado Livre costuma trocá-lo a cada uso).</p>
<div class="warn"><strong>Não envie estes tokens por chat, print ou GitHub.</strong> Esta rota exige o header secreto de diagnóstico, então não fica exposta ao público.</div>
<h3>MELI_ACCESS_TOKEN</h3><code>${access}</code>
<h3>MELI_REFRESH_TOKEN</h3><code>${refresh}</code>
<p>O novo access token expira em aproximadamente ${Math.round((data.expires_in || 21600) / 3600)} horas.</p>
<p>Enquanto isso for manual: chame esta rota (com o header de diagnóstico) sempre que o token expirar, em vez de refazer o login completo em /api/ml/connect.</p>
</div></body></html>`);
  } catch (exchangeError) {
    const safe = safeError(exchangeError, 'meli_refresh_failed');
    return res.status(safe.status).json({ error: 'refresh_failed', detail: safe.message });
  }
};
