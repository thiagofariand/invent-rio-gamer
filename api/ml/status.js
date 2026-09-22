import { mercadoLivreConfigured } from '../../lib/marketplace.js';
import { methodNotAllowed, sendJson } from '../../lib/http.js';
import { guardDiagnostics } from '../../lib/security.js';
export default async function handler(req,res){if(req.method!=='GET')return methodNotAllowed(res);if(!guardDiagnostics(req,res))return;return sendJson(res,200,{configured:mercadoLivreConfigured(),accessTokenConfigured:Boolean(process.env.MELI_ACCESS_TOKEN),refreshTokenConfigured:Boolean(process.env.MELI_REFRESH_TOKEN),automaticRefreshPersistence:false},'private, max-age=120');}
