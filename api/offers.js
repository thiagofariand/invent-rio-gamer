const { buildOffersResponse } = require('../lib/mercadolivre');
const { safeError } = require('../lib/http');

module.exports = async function handler(req, res) {
  try {
    const result = await buildOffersResponse({
      method: req.method,
      query: req.query || {},
      token: process.env.MELI_ACCESS_TOKEN
    });
    res.setHeader('Cache-Control', result.cacheControl);
    return res.status(result.statusCode).json(result.body);
  } catch (error) {
    const safe = safeError(error, 'marketplace_unavailable');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({
      offers: [],
      nationalOffers: [],
      importedOffers: [],
      totalShown: 0,
      sources: {
        mercado_livre: {
          status: 'temporarily_unavailable',
          httpStatus: safe.status,
          detail: safe.message
        }
      }
    });
  }
};
