import { getTwitchToken, igdbConfigured, queryIgdb } from '../../lib/igdb.js';
import { methodNotAllowed, sanitizeExternalError, sendJson } from '../../lib/http.js';
import { guardDiagnostics } from '../../lib/security.js';
export default async function handler(req,res){
  if(req.method!=='GET') return methodNotAllowed(res);
  if(!guardDiagnostics(req,res)) return;
  const status={configured:igdbConfigured(),tokenOk:false,igdbOk:false,httpStatus:null};
  if(!status.configured) return sendJson(res,200,status,'private, max-age=60');
  try{await getTwitchToken();status.tokenOk=true;await queryIgdb('games','fields id; limit 1;');status.igdbOk=true;status.httpStatus=200;}
  catch(error){const safe=sanitizeExternalError(error);status.httpStatus=safe.status;}
  return sendJson(res,200,status,'private, max-age=120');
}
