let tokenCache={value:null,expiresAt:0};

function cleanText(s,max=160){
  return String(s||'').replace(/\s+/g,' ').trim().slice(0,max);
}
function norm(s){
  return String(s||'').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[’']/g,'')
    .replace(/[^a-z0-9]+/g,' ')
    .replace(/\s+/g,' ').trim();
}
function escApicalypse(s){
  return String(s||'').replace(/\\/g,'\\\\').replace(/"/g,'\\"');
}
function img(imageId,size){
  if(!imageId)return null;
  return `https://images.igdb.com/igdb/image/upload/t_${size}/${imageId}.jpg`;
}
function pickHero(game){
  const all=[
    ...(Array.isArray(game.artworks)?game.artworks:[]).map(x=>({...x,_kind:'artwork'})),
    ...(Array.isArray(game.screenshots)?game.screenshots:[]).map(x=>({...x,_kind:'screenshot'}))
  ].filter(x=>x?.image_id);

  if(!all.length)return null;

  all.sort((a,b)=>{
    const arA=(Number(a.width)||1)/(Number(a.height)||1);
    const arB=(Number(b.width)||1)/(Number(b.height)||1);
    const target=16/9;
    const scoreA=Math.abs(arA-target) + (a._kind==='artwork'?0:0.15);
    const scoreB=Math.abs(arB-target) + (b._kind==='artwork'?0:0.15);
    return scoreA-scoreB;
  });

  const best=all[0];
  return {
    kind:best._kind,
    imageId:best.image_id,
    url:img(best.image_id,'1080p'),
    preview:img(best.image_id,'720p'),
    width:best.width||null,
    height:best.height||null
  };
}
async function getAppToken(clientId,clientSecret){
  const now=Date.now();
  if(tokenCache.value && now < tokenCache.expiresAt-120000)return tokenCache.value;

  const params=new URLSearchParams({
    client_id:clientId,
    client_secret:clientSecret,
    grant_type:'client_credentials'
  });

  const r=await fetch('https://id.twitch.tv/oauth2/token?'+params.toString(),{
    method:'POST',
    headers:{Accept:'application/json'}
  });
  const data=await r.json().catch(()=>({}));
  if(!r.ok||!data.access_token){
    const e=new Error(data.message||'Falha ao gerar token Twitch');
    e.status=r.status;
    throw e;
  }

  tokenCache={
    value:data.access_token,
    expiresAt:now+(Number(data.expires_in||3600)*1000)
  };
  return tokenCache.value;
}
function scoreGame(g,q,platform,year){
  let s=0;
  const n=norm(g.name), nq=norm(q);
  if(n===nq)s+=100;
  else if(n.startsWith(nq)||nq.startsWith(n))s+=45;
  else if(n.includes(nq)||nq.includes(n))s+=25;

  if(platform){
    const p=norm(platform);
    const plats=(g.platforms||[]).map(x=>norm(x.name));
    if(plats.some(x=>x.includes(p)||p.includes(x)))s+=20;
  }

  if(year && g.first_release_date){
    const y=new Date(Number(g.first_release_date)*1000).getUTCFullYear();
    const d=Math.abs(Number(year)-y);
    if(d===0)s+=15;
    else if(d===1)s+=6;
  }
  if(g.cover?.image_id)s+=4;
  if(g.artworks?.length)s+=3;
  return s;
}

module.exports=async function handler(req,res){
  res.setHeader('Cache-Control','s-maxage=86400, stale-while-revalidate=604800');

  if(req.method!=='GET')return res.status(405).json({error:'method_not_allowed'});

  const clientId=process.env.IGDB_CLIENT_ID;
  const clientSecret=process.env.IGDB_CLIENT_SECRET;
  if(!clientId||!clientSecret){
    return res.status(503).json({
      error:'igdb_not_configured',
      message:'IGDB_CLIENT_ID e IGDB_CLIENT_SECRET ainda não estão configurados na Vercel.'
    });
  }

  const q=cleanText(req.query.q||req.query.title,160);
  const platform=cleanText(req.query.platform,80);
  const year=cleanText(req.query.year,4);

  if(q.length<2)return res.status(400).json({error:'query_too_short'});

  try{
    const token=await getAppToken(clientId,clientSecret);
    const body=[
      `search "${escApicalypse(q)}";`,
      'fields id,name,slug,first_release_date,platforms.name,cover.image_id,cover.width,cover.height,artworks.image_id,artworks.width,artworks.height,screenshots.image_id,screenshots.width,screenshots.height;',
      'limit 10;'
    ].join('\n');

    const r=await fetch('https://api.igdb.com/v4/games',{
      method:'POST',
      headers:{
        'Client-ID':clientId,
        Authorization:'Bearer '+token,
        Accept:'application/json',
        'Content-Type':'text/plain'
      },
      body
    });

    const data=await r.json().catch(()=>[]);
    if(!r.ok){
      return res.status(r.status).json({
        error:'igdb_request_failed',
        status:r.status,
        detail:Array.isArray(data)?null:data?.message||null
      });
    }

    const games=(Array.isArray(data)?data:[])
      .map(g=>({...g,_score:scoreGame(g,q,platform,year)}))
      .sort((a,b)=>b._score-a._score);

    const game=games[0];
    if(!game){
      return res.status(200).json({ok:true,found:false,query:q});
    }

    const hero=pickHero(game);
    const cover=game.cover?.image_id ? {
      imageId:game.cover.image_id,
      url:img(game.cover.image_id,'cover_big_2x'),
      preview:img(game.cover.image_id,'cover_big')
    } : null;

    return res.status(200).json({
      ok:true,
      found:true,
      query:q,
      game:{
        id:game.id,
        name:game.name,
        slug:game.slug,
        releaseYear:game.first_release_date
          ? new Date(Number(game.first_release_date)*1000).getUTCFullYear()
          : null,
        platforms:(game.platforms||[]).map(x=>x.name).filter(Boolean)
      },
      cover,
      hero,
      source:'IGDB'
    });
  }catch(e){
    return res.status(e.status||500).json({
      error:'igdb_server_error',
      message:String(e.message||e)
    });
  }
};