const { buildOffersResponse } = require('../lib/mercadolivre');
const { manualShopeeOffers } = require('../lib/shopee-manual-offers');
const { safeError } = require('../lib/http');
const { getAccessToken, kvConfig } = require('../lib/meli-token');

module.exports = async function handler(req, res) {
  const title = String(req.query?.title || req.query?.q || '');
  const condition = String(req.query?.condition || 'new').toLowerCase();
  const shopee = manualShopeeOffers(title, condition);

  let body, statusCode, cacheControl;
  try {
    const query = req.query || {};
    let result = await buildOffersResponse({ method: req.method, query, token: await getAccessToken() });
    // Se o Mercado Livre disser que o token venceu, renova uma vez e tenta de novo.
    if (kvConfig() && result.body?.sources?.mercado_livre?.status === 'token_expired') {
      result = await buildOffersResponse({ method: req.method, query, token: await getAccessToken({ force: true }) });
    }
    body = result.body;
    statusCode = result.statusCode;
    cacheControl = result.cacheControl;
  } catch (error) {
    const safe = safeError(error, 'marketplace_unavailable');
    body = {
      offers: [], nationalOffers: [], importedOffers: [], totalShown: 0,
      sources: { mercado_livre: { status: 'temporarily_unavailable', httpStatus: safe.status, detail: safe.message } }
    };
    statusCode = 200;
    cacheControl = 'no-store';
  }

  if (shopee.length) {
    body.nationalOffers = [...(body.nationalOffers || []), ...shopee].sort((a, b) => a.priceValue - b.priceValue);
    body.offers = body.nationalOffers;
    body.totalShown = body.nationalOffers.length;
    body.sources = { ...body.sources, shopee_manual: { status: 'ok', count: shopee.length } };
  }

  res.setHeader('Cache-Control', cacheControl);
  return res.status(statusCode).json(body);
};
