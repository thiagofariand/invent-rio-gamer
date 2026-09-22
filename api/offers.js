function brl(v){
  return new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(v||0));
}
function cleanText(s,max=140){
  return String(s||'').replace(/\s+/g,' ').trim().slice(0,max);
}
function norm(s){
  return String(s||'').toLowerCase().normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'')
    .replace(/[’']/g,'')
    .replace(/[^a-z0-9]+/g,' ')
    .replace(/\s+/g,' ')
    .trim();
}
function relevantEnough(listingTitle,masterTitle){
  const stop=new Set(['the','of','and','a','an','edition','edicao','game','jogo','para']);
  const wanted=norm(masterTitle).split(' ').filter(t=>t.length>1&&!stop.has(t));
  if(!wanted.length)return true;
  const got=new Set(norm(listingTitle).split(' '));
  const matched=wanted.filter(t=>got.has(t)).length;
  if(wanted.length<=2)return matched===wanted.length;
  return matched/wanted.length>=0.55;
}
function itemCondition(item){
  if(item?.condition)return item.condition;
  const a=(item?.attributes||[]).find(x=>x.id==='ITEM_CONDITION');
  const n=norm(a?.value_name||'');
  if(n.includes('novo')||n.includes('new'))return 'new';
  if(n.includes('usado')||n.includes('used'))return 'used';
  return null;
}
async function apiGet(url,token){
  const r=await fetch(url,{
    headers:{
      Authorization:'Bearer '+token,
      Accept:'application/json'
    }
  });
  const text=await r.text();
  let data={};
  try{ data=text?JSON.parse(text):{} }catch{ data={raw:text.slice(0,500)} }
  return {ok:r.ok,status:r.status,data};
}
function externalSearchUrl(title,platform){
  const q=[title,platform].filter(Boolean).join(' ');
  return 'https://lista.mercadolivre.com.br/'+encodeURIComponent(q).replace(/%20/g,'-');
}

/*
  Fluxo atual para itens NOVOS:
  1) /products/search?site_id=MLB&q=...
  2) /products/{product_id}
  3) buy_box_winner.item_id
  4) /items/{item_id} para permalink/foto/detalhes

  O antigo /sites/MLB/search?q=... deixou de ser usado aqui.
*/
async function searchCatalogNew(title,platform,token){
  const q=[cleanText(title,120),cleanText(platform,50)].filter(Boolean).join(' ');
  const params=new URLSearchParams({status:'active',site_id:'MLB',q});
  const search=await apiGet(
    'https://api.mercadolibre.com/products/search?'+params.toString(),
    token
  );

  if(!search.ok){
    return {
      status:search.status===401?'token_expired':'error',
      httpStatus:search.status,
      stage:'products_search',
      detail:search.data?.message||search.data?.error||'products/search failed',
      offers:[]
    };
  }

  const products=(search.data.results||[]).slice(0,6);
  if(!products.length){
    return {status:'empty',stage:'products_search',offers:[],catalogMatches:0};
  }

  const details=await Promise.all(products.map(async p=>{
    const d=await apiGet('https://api.mercadolibre.com/products/'+encodeURIComponent(p.id),token);
    return d.ok?d.data:null;
  }));

  const winners=details.filter(Boolean).map(d=>d.buy_box_winner).filter(w=>w&&w.item_id);
  const uniqueWinners=[...new Map(winners.map(w=>[w.item_id,w])).values()].slice(0,6);

  if(!uniqueWinners.length){
    return {
      status:'empty',
      stage:'buy_box',
      offers:[],
      catalogMatches:products.length,
      detail:'Produtos encontrados, mas sem buy_box_winner disponível.'
    };
  }

  const itemResults=await Promise.all(uniqueWinners.map(async w=>{
    const r=await apiGet('https://api.mercadolibre.com/items/'+encodeURIComponent(w.item_id),token);
    return {winner:w,response:r};
  }));

  const raw=[];
  for(const {winner,response} of itemResults){
    if(!response.ok)continue;
    const x=response.data;
    const cond=itemCondition(x);
    if(cond && cond!=='new')continue;

    const image=x.secure_thumbnail
      || x.thumbnail
      || x.pictures?.[0]?.secure_url
      || x.pictures?.[0]?.url
      || '';

    const price=Number(x.price ?? winner.price);
    if(!price || !x.permalink)continue;

    raw.push({
      source:'Mercado Livre',
      sourceKind:'nacional',
      title:x.title||title,
      condition:'Novo',
      priceValue:price,
      displayPrice:brl(price),
      originalDisplayPrice:x.original_price?brl(x.original_price):brl(price),
      url:x.permalink,
      image,
      location:[
        x.seller_address?.city?.name || winner.seller_address?.city?.name,
        x.seller_address?.state?.name || winner.seller_address?.state?.name
      ].filter(Boolean).join(', '),
      currency:x.currency_id||winner.currency_id||'BRL',
      shippingIncluded:Boolean(x.shipping?.free_shipping ?? winner.shipping?.free_shipping),
      itemId:x.id||winner.item_id,
      catalogProductId:x.catalog_product_id||winner.product_id||null,
      mock:false
    });
  }

  let offers=raw.filter(o=>relevantEnough(o.title,title));
  if(!offers.length)offers=raw;
  offers.sort((a,b)=>a.priceValue-b.priceValue);

  return {
    status:offers.length?'ok':'empty',
    stage:'catalog_buy_box',
    offers,
    catalogMatches:products.length
  };
}

module.exports=async function handler(req,res){
  if(req.method!=='GET')return res.status(405).json({error:'method_not_allowed'});

  const title=cleanText(req.query.title||req.query.q,120);
  const platform=cleanText(req.query.platform,50);
  const condition=cleanText(req.query.condition||'new',16).toLowerCase();

  if(!title)return res.status(400).json({error:'missing_title'});
  if(title.length<2)return res.status(400).json({error:'query_too_short'});
  if(condition!=='used'&&condition!=='new'){
    return res.status(400).json({error:'unsupported_condition'});
  }

  const token=process.env.MELI_ACCESS_TOKEN;
  if(!token){
    res.setHeader('Cache-Control','no-store');
    return res.status(200).json({
      title,platform:platform||null,condition,
      offers:[],nationalOffers:[],importedOffers:[],totalShown:0,
      sources:{mercado_livre:{status:'not_configured'}},
      generatedAt:new Date().toISOString()
    });
  }

  // O catálogo oficial do ML é apropriado para produto novo.
  if(condition==='used'){
    res.setHeader('Cache-Control','s-maxage=120, stale-while-revalidate=300');
    return res.status(200).json({
      title,platform:platform||null,condition,
      offers:[],nationalOffers:[],importedOffers:[],totalShown:0,
      externalSearchUrl:externalSearchUrl(title,platform),
      generatedAt:new Date().toISOString(),
      sources:{
        mercado_livre:{
          status:'used_search_not_available_in_catalog_flow',
          flow:'catalog_products',
          note:'Busca de usados exige outra fonte/integração; não inventamos preço.'
        }
      }
    });
  }

  const meli=await searchCatalogNew(title,platform,token);
  const nationalOffers=(meli.offers||[]).slice(0,12);

  if(meli.status==='ok')res.setHeader('Cache-Control','s-maxage=180, stale-while-revalidate=600');
  else res.setHeader('Cache-Control','no-store');

  return res.status(200).json({
    title,
    platform:platform||null,
    condition,
    offers:nationalOffers,
    nationalOffers,
    importedOffers:[],
    totalShown:nationalOffers.length,
    generatedAt:new Date().toISOString(),
    sources:{
      mercado_livre:{
        status:meli.status,
        flow:'products_search_buy_box',
        stage:meli.stage||null,
        httpStatus:meli.httpStatus||null,
        catalogMatches:meli.catalogMatches||0,
        detail:meli.detail||null
      }
    }
  });
};