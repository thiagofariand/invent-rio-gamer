'use strict';

const {buildDailyTrends}=require('../lib/trending');
const {recordSearchMiss}=require('../lib/search-miss-log');

module.exports=async function handler(req,res){
  // Parte B, item 7e: POST aqui (em vez de criar uma função nova — plano
  // Hobby, contagem de /api baixa) registra uma busca sem resultado nenhum.
  // Sem-op com SEARCH_MISS_LOG!=='true' no servidor (ver lib/search-miss-log.js).
  if(req.method==='POST'){
    try{
      const term=typeof req.body==='object'&&req.body?req.body.term:JSON.parse(req.body||'{}').term;
      await recordSearchMiss(term);
    }catch{/* nunca falha visivelmente pro cliente — é só telemetria opcional */}
    return res.status(204).end();
  }
  if(req.method!=='GET')return res.status(405).json({error:'Método não permitido'});
  const authorization=req.headers.authorization;
  if(authorization&&authorization!==`Bearer ${process.env.CRON_SECRET||''}`){
    return res.status(401).json({error:'Não autorizado'});
  }
  res.setHeader('Cache-Control','public, s-maxage=82800, stale-while-revalidate=3600');
  try{
    const result=await buildDailyTrends();
    return res.status(200).json({...result,updatedAt:new Date().toISOString()});
  }catch(error){
    return res.status(200).json({configured:!!process.env.YOUTUBE_API_KEY,items:[],source:null,updatedAt:new Date().toISOString(),status:'fallback'});
  }
};
