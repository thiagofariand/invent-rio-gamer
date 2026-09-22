import { searchMercadoLivre } from '../lib/marketplace.js';
import { getQuery, methodNotAllowed, sanitizeExternalError, sendJson } from '../lib/http.js';
export default async function handler(req,res){
  if(req.method!=='GET') return methodNotAllowed(res);
  const q=getQuery(req,'q').trim(); const year=getQuery(req,'year').trim();
  if(q.length<2) return sendJson(res,400,{error:{message:'q must have at least 2 characters',status:400}});
  try{
    const offers=await searchMercadoLivre({query:q,year:/^\d{4}$/.test(year)?Number(year):null});
    return sendJson(res,200,{offers,providers:['Mercado Livre']},'public, s-maxage=900, stale-while-revalidate=1800');
  }catch(error){const safe=sanitizeExternalError(error);console.error('offers',safe);return sendJson(res,200,{offers:[],providers:[],degraded:true,reason:'provider_unavailable'},'public, s-maxage=120, stale-while-revalidate=300');}
}
