let tokenCache={token:null,expiresAt:0};

function base64(s){return Buffer.from(s).toString('base64')}
async function getToken(){
  const id=process.env.EBAY_CLIENT_ID;
  const secret=process.env.EBAY_CLIENT_SECRET;
  if(!id||!secret) throw new Error('EBAY_NOT_CONFIGURED');
  if(tokenCache.token&&Date.now()<tokenCache.expiresAt-60000)return tokenCache.token;
  const sandbox=(process.env.EBAY_ENV||'production')==='sandbox';
  const host=sandbox?'https://api.sandbox.ebay.com':'https://api.ebay.com';
  const r=await fetch(host+'/identity/v1/oauth2/token',{
    method:'POST',
    headers:{'Content-Type':'application/x-www-form-urlencoded','Authorization':'Basic '+base64(id+':'+secret)},
    body:'grant_type=client_credentials&scope='+encodeURIComponent('https://api.ebay.com/oauth/api_scope')
  });
  if(!r.ok) throw new Error('EBAY_TOKEN_'+r.status);
  const data=await r.json();
  tokenCache={token:data.access_token,expiresAt:Date.now()+(data.expires_in||7200)*1000};
  return tokenCache.token;
}
async function usdBrl(){
  try{
    const r=await fetch('https://api.frankfurter.app/latest?from=USD&to=BRL');
    if(!r.ok)return null;
    const d=await r.json();return d?.rates?.BRL||null;
  }catch{return null}
}
function money(v,currency,rate){
  const n=Number(v||0);
  if(currency==='BRL')return {value:n,display:new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(n)};
  if(currency==='USD'&&rate){const b=n*rate;return {value:b,display:'≈ '+new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(b)}};
  try{return {value:n,display:new Intl.NumberFormat('pt-BR',{style:'currency',currency:currency||'USD'}).format(n)}}catch{return {value:n,display:(currency||'')+' '+n.toFixed(2)}}
}
module.exports=async function handler(req,res){
  res.setHeader('Cache-Control','s-maxage=300, stale-while-revalidate=600');
  if(req.method!=='GET')return res.status(405).json({error:'method_not_allowed'});
  const q=String(req.query.q||'').trim();
  if(!q)return res.status(400).json({error:'missing_query'});
  try{
    const token=await getToken();
    const sandbox=(process.env.EBAY_ENV||'production')==='sandbox';
    const host=sandbox?'https://api.sandbox.ebay.com':'https://api.ebay.com';
    const params=new URLSearchParams({q,limit:'12',filter:'conditions:{USED},buyingOptions:{FIXED_PRICE}',sort:'price'});
    const r=await fetch(host+'/buy/browse/v1/item_summary/search?'+params.toString(),{
      headers:{Authorization:'Bearer '+token,'X-EBAY-C-MARKETPLACE-ID':process.env.EBAY_MARKETPLACE_ID||'EBAY_US'}
    });
    if(!r.ok){const body=await r.text();return res.status(r.status).json({error:'ebay_search_failed',detail:body.slice(0,500)})}
    const data=await r.json();
    const rate=await usdBrl();
    const raw=(data.itemSummaries||[]).filter(x=>x.price&&x.itemWebUrl);
    const offers=raw.map(x=>{const m=money(x.price.value,x.price.currency,rate);return {source:'eBay',title:x.title,condition:x.condition||'Usado',priceValue:m.value,displayPrice:m.display,url:x.itemAffiliateWebUrl||x.itemWebUrl,location:x.itemLocation?.country||'',currency:x.price.currency}}).sort((a,b)=>a.priceValue-b.priceValue).slice(0,8);
    return res.status(200).json({offers,totalShown:offers.length,query:q,convertedRate:rate||null});
  }catch(e){
    if(String(e.message)==='EBAY_NOT_CONFIGURED')return res.status(503).json({error:'source_not_configured'});
    return res.status(500).json({error:'server_error',detail:String(e.message||e)});
  }
}
