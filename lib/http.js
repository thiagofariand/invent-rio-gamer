const crypto = require('crypto');

function cleanText(value, max = 160) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, max);
}

function safeError(error, fallback = 'unexpected_error') {
  return {
    message: cleanText(error?.message || fallback, 240),
    status: Number(error?.status || error?.statusCode) || 500
  };
}

function sameSecret(received, expected) {
  const left = Buffer.from(String(received || ''));
  const right = Buffer.from(String(expected || ''));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function requireDiagnosticsAccess(req, res) {
  const expected = process.env.DIAGNOSTICS_SECRET;
  if (!expected) {
    res.status(503).json({
      error: 'diagnostics_not_configured',
      message: 'Configure DIAGNOSTICS_SECRET para habilitar este endpoint.'
    });
    return false;
  }

  const received = req.headers['x-inventario-diagnostics'];
  if (!sameSecret(received, expected)) {
    res.status(401).json({ error: 'unauthorized' });
    return false;
  }
  return true;
}

module.exports = { cleanText, safeError, requireDiagnosticsAccess };
