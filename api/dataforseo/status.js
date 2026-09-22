import { dataForSeoConfigured, dataForSeoSearchEnabled } from '../../lib/dataforseo.js';
import { methodNotAllowed, sendJson } from '../../lib/http.js';
import { guardDiagnostics } from '../../lib/security.js';
export default async function handler(req,res){if(req.method!=='GET')return methodNotAllowed(res);if(!guardDiagnostics(req,res))return;return sendJson(res,200,{configured:dataForSeoConfigured(),searchEnabled:dataForSeoSearchEnabled(),paidCallPerformed:false},'private, max-age=120');}
