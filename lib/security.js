import { sendJson } from './http.js';

export function guardDiagnostics(req, res) {
  const expected = process.env.DIAGNOSTICS_SECRET;
  if (!expected) {
    sendJson(res, 404, { error: { message: 'Diagnostics disabled', status: 404 } });
    return false;
  }
  const supplied = req.headers?.['x-diagnostics-key'];
  if (!supplied || supplied !== expected) {
    sendJson(res, 401, { error: { message: 'Unauthorized', status: 401 } });
    return false;
  }
  return true;
}
