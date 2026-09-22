let tokenCache={value:null,expiresAt:0};
async function token(clientId,clientSecret){
  if(tokenCache.value && Date.now()<tokenCache.expiresAt-120000)return tokenCache.value;
  const p=new URLSearchParams({client_id:clientId,client_secret:clientSecret,grant_type:'client_credentials'});
  const r=await fetch('https://id.twitch.tv/oauth2/token?'+p.toString(),{method:'POST'});
  const d=await r.json().catch(()=>({}));
  if(!r.ok||!d.access_token)return {error:d.message||'token_failed',status:r.status};
  tokenCache={value:d.access_token,expiresAt:Date.now()+Number(d.expires_in||3600)*1000};
  return tokenCache.value;
}
module.exports=async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  const clientId=process.env.IGDB_CLIENT_ID;
  const clientSecret=process.env.IGDB_CLIENT_SECRET;

  if(!clientId||!clientSecret){
    return res.status(200).json({configured:false});
  }

  const t=await token(clientId,clientSecret);
  if(typeof t!=='string'){
    return res.status(200).json({configured:true,tokenOk:false,httpStatus:t.status||null,error:t.error||null});
  }

  const r=await fetch('https://api.igdb.com/v4/games',{
    method:'POST',
    headers:{
      'Client-ID':clientId,
      Authorization:'Bearer '+t,
      Accept:'application/json',
      'Content-Type':'text/plain'
    },
    body:'fields id,name; search "The Legend of Zelda"; limit 1;'
  });
  const d=await r.json().catch(()=>[]);
  return res.status(200).json({
    configured:true,
    tokenOk:true,
    igdbOk:r.ok,
    httpStatus:r.status,
    sample:Array.isArray(d)&&d[0]?{id:d[0].id,name:d[0].name}:null
  });
};