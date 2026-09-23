'use strict';

const {buildDailyTrends}=require('../lib/trending');

module.exports=async function handler(req,res){
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
