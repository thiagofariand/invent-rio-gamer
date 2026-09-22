import { searchMercadoLivre } from '../lib/marketplace.js';
import { getQuery, methodNotAllowed, sanitizeExternalError, sendJson } from '../lib/http.js';

export default async function handler(req,res){
  if(req.method!=='GET') return methodNotAllowed(res);
  const q=getQuery(req,'q').trim();
  const year=getQuery(req,'year').trim();
  const platform=getQuery(req,'platform').trim();
  if(q.length<2) return sendJson(res,400,{error:{message:'q must have at least 2 characters',status:400}});
  try{
    const ml=await searchMercadoLivre({query:q,platform,year:/^\d{4}$/.test(year)?Number(year):null});
    return sendJson(res,200,{
      offers:ml.offers,
      physical:{new:ml.offers,used:[],usedSearchUrl:ml.externalUsedSearchUrl},
      providers:ml.offers.length?['Mercado Livre']:[],
      sources:{mercado_livre:{status:ml.status,flow:ml.flow,usedMode:'external_search_only'}}
    },ml.offers.length?'public, s-maxage=180, stale-while-revalidate=600':'public, s-maxage=120, stale-while-revalidate=300');
  }catch(error){
    const safe=sanitizeExternalError(error);
    console.error('offers',safe);
    return sendJson(res,200,{offers:[],physical:{new:[],used:[],usedSearchUrl:null},providers:[],degraded:true,reason:'provider_unavailable',sources:{mercado_livre:{status:safe.status===401?'token_expired':'unavailable'}}},'public, s-maxage=120, stale-while-revalidate=300');
  }
}
