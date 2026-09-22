export function sanitizeExternalError(error) {
  const status = Number(error?.status || error?.statusCode || error?.response?.status || 500);
  const message = typeof error?.message === 'string' ? error.message.slice(0, 240) : 'External request failed';
  return { message, status: Number.isFinite(status) ? status : 500 };
}

export function sendJson(res, status, payload, cacheControl = 'no-store') {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', cacheControl);
  return res.status(status).json(payload);
}

export function methodNotAllowed(res, allowed = ['GET']) {
  res.setHeader('Allow', allowed.join(', '));
  return sendJson(res, 405, { error: { message: 'Method not allowed', status: 405 } });
}

export function getQuery(req, key, fallback = '') {
  const value = req.query?.[key];
  if (Array.isArray(value)) return value[0] ?? fallback;
  return typeof value === 'string' ? value : fallback;
}
