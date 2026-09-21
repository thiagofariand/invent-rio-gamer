let ebayTokenCache={token:null,expiresAt:0};

function base64(s){return Buffer.from(s).toString('base64')}
function brl(v){return new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(v||0))}

async function getEbayToken(){
  const id=process.env.EBAY_CLIENT_ID;
  const secret=process.env.EBAY_CLIENT_SECRET;
  if(!id||!secret) throw new Error('EBAY_NOT_CONFIGURED');
  if(ebayTokenCache.token&&Date.now()<ebayTokenCache.expiresAt-60000)return ebayTokenCache.token;
  const sandbox=(process.env.EBAY_ENV||'production')==='sandbox';
  const host=sandbox?'https://api.sandbox.ebay.com':'https://api.ebay.com';
  const r=await fetch(host+'/identity/v1/oauth2/token',{
    method:'POST',
    headers:{
      'Content-Type':'application/x-www-form-urlencoded',
      'Authorization':'Basic '+base64(id+':'+secret)
    },
    body:'grant_type=client_credentials&scope='+encodeURIComponent('https://api.ebay.com/oauth/api_scope')
  });
  if(!r.ok) throw new Error('EBAY_TOKEN_'+r.status);
  const data=await r.json();
  ebayTokenCache={token:data.access_token,expiresAt:Date.now()+(data.expires_in||7200)*1000};
  return ebayTokenCache.token;
}

async function usdBrl(){
  try{
    const r=await fetch('https://api.frankfurter.app/latest?from=USD&to=BRL');
    if(!r.ok)return null;
    const d=await r.json();
    return d?.rates?.BRL||null;
  }catch{return null}
}

function money(v,currency,rate){
  const n=Number(v||0);
  if(currency==='BRL')return {value:n,display:brl(n),originalDisplay:brl(n)};
  if(currency==='USD'&&rate){
    const b=n*rate;
    return {
      value:b,
      display:'≈ '+brl(b),
      originalDisplay:new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(n)
    };
  }
  try{
    const display=new Intl.NumberFormat('pt-BR',{style:'currency',currency:currency||'USD'}).format(n);
    return {value:n,display,originalDisplay:display};
  }catch{return {value:n,display:(currency||'')+' '+n.toFixed(2),originalDisplay:(currency||'')+' '+n.toFixed(2)}}
}

async function searchEbay(q,rate){
  try{
    const token=await getEbayToken();
    const sandbox=(process.env.EBAY_ENV||'production')==='sandbox';
    const host=sandbox?'https://api.sandbox.ebay.com':'https://api.ebay.com';
    const params=new URLSearchParams({
      q,
      limit:'12',
      filter:'conditions:{USED},buyingOptions:{FIXED_PRICE}'
    });
    const r=await fetch(host+'/buy/browse/v1/item_summary/search?'+params.toString(),{
      headers:{
        Authorization:'Bearer '+token,
        'X-EBAY-C-MARKETPLACE-ID':process.env.EBAY_MARKETPLACE_ID||'EBAY_US'
      }
    });
    if(!r.ok){
      const body=await r.text();
      return {status:'error',offers:[],detail:'HTTP '+r.status+' '+body.slice(0,160)};
    }
    const data=await r.json();
    const offers=(data.itemSummaries||[])
      .filter(x=>x.price&&x.itemWebUrl)
      .map(x=>{
        const m=money(x.price.value,x.price.currency,rate);
        return {
          source:'eBay',
          sourceKind:'importado',
          title:x.title,
          condition:x.condition||'Usado',
          priceValue:m.value,
          displayPrice:m.display,
          originalDisplayPrice:m.originalDisplay,
          url:x.itemAffiliateWebUrl||x.itemWebUrl,
          image:x.image?.imageUrl||'',
          location:x.itemLocation?.country||'',
          currency:x.price.currency,
          shippingIncluded:false
        };
      });
    return {status:'ok',offers,total:Number(data.total||offers.length)};
  }catch(e){
    if(String(e.message)==='EBAY_NOT_CONFIGURED')return {status:'not_configured',offers:[]};
    return {status:'error',offers:[],detail:String(e.message||e)};
  }
}

async function searchMercadoLivre(q){
  const token=process.env.MELI_ACCESS_TOKEN;
  if(!token)return {status:'not_configured',offers:[]};
  try{
    const params=new URLSearchParams({q,limit:'12',condition:'used'});
    const r=await fetch('https://api.mercadolibre.com/sites/MLB/search?'+params.toString(),{
      headers:{Authorization:'Bearer '+token}
    });
    if(!r.ok){
      const body=await r.text();
      return {status:r.status===401?'token_expired':'error',offers:[],detail:'HTTP '+r.status+' '+body.slice(0,160)};
    }
    const data=await r.json();
    const offers=(data.results||[])
      .filter(x=>x.price&&x.permalink)
      .map(x=>({
        source:'Mercado Livre',
        sourceKind:'nacional',
        title:x.title,
        condition:x.condition==='new'?'Novo':'Usado',
        priceValue:Number(x.price),
        displayPrice:brl(x.price),
        originalDisplayPrice:brl(x.price),
        url:x.permalink,
        image:x.thumbnail||'',
        location:[x.address?.city_name,x.address?.state_name].filter(Boolean).join(', '),
        currency:x.currency_id||'BRL',
        shippingIncluded:Boolean(x.shipping?.free_shipping)
      }));
    return {status:'ok',offers,total:Number(data.paging?.total||offers.length)};
  }catch(e){
    return {status:'error',offers:[],detail:String(e.message||e)};
  }
}

module.exports=async function handler(req,res){
  res.setHeader('Cache-Control','s-maxage=180, stale-while-revalidate=600');
  if(req.method!=='GET')return res.status(405).json({error:'method_not_allowed'});
  const q=String(req.query.q||'').trim();
  if(!q)return res.status(400).json({error:'missing_query'});

  const rate=await usdBrl();
  const [ebay,meli]=await Promise.all([
    searchEbay(q,rate),
    searchMercadoLivre(q)
  ]);

  const offers=[...(meli.offers||[]),...(ebay.offers||[])].sort((a,b)=>a.priceValue-b.priceValue).slice(0,24);
  return res.status(200).json({
    query:q,
    offers,
    totalShown:offers.length,
    convertedRate:rate||null,
    generatedAt:new Date().toISOString(),
    sources:{
      mercado_livre:{status:meli.status,total:meli.total||0},
      ebay:{status:ebay.status,total:ebay.total||0}
    }
  });
};
