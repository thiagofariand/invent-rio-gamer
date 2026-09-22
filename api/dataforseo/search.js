import { dataForSeoShoppingSearch } from '../../lib/dataforseo.js';
import { getQuery, methodNotAllowed, sanitizeExternalError, sendJson } from '../../lib/http.js';
import { guardDiagnostics } from '../../lib/security.js';
export default async function handler(req,res){
  if(req.method!=='GET')return methodNotAllowed(res);
  if(!guardDiagnostics(req,res))return;
  const q=getQuery(req,'q').trim(); if(q.length<2)return sendJson(res,400,{error:{message:'q must have at least 2 characters',status:400}});
  try{return sendJson(res,200,await dataForSeoShoppingSearch(q),'no-store');}
  catch(error){const safe=sanitizeExternalError(error);console.error('dataforseo/search',safe);return sendJson(res,safe.status,{error:safe});}
}
