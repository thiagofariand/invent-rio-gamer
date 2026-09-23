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
function listingRejectReason(title){
  const n=` ${norm(title)} `;
  const hard=[
    ['reprodução/repro',/\b(repro|reproduction|reproducao|replica|fake|falso|pirata)\b/],
    ['peças/defeito',/\b(for parts|parts only|para pecas|defeito|defeituoso|not working|broken)\b/],
    ['lote',/\b(lot of|bundle of|lote)\b/],
    ['sem jogo',/\b(case only|box only|empty case|empty box|no game|sem jogo|manual only|only manual|apenas manual|somente manual|capa apenas|somente capa|replacement case|replacement box|replacement shell|shell only|label only)\b/],
    ['acessório/merch',/\b(amiibo|figure|figurine|poster|camiseta|shirt|keychain|chaveiro|pelucia|plush|soundtrack|vinyl|controle|controller|memory card|console only)\b/]
  ];
  for(const [reason,re] of hard){if(re.test(n))return reason}
  const partWords=/\b(manual|booklet|capa|case|box|caixa|shell|carcaca|label|adesivo|sticker)\b/;
  const playable=/\b(jogo|game|cartucho|cartridge|disco|disc|disk|midia|media|cd|dvd|bluray|blu ray|cib|complete|completo|lacrado|sealed)\b/;
  if(partWords.test(n)&&!playable.test(n))return 'parte/acessório sem mídia identificável';
  return null;
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
    headers:{Authorization:'Bearer '+token,Accept:'application/json'}
  });
  const text=await r.text();
  let data={};
  try{data=text?JSON.parse(text):{}}catch{data={raw:text.slice(0,500)}}
  return {ok:r.ok,status:r.status,data};
}
function externalSearchUrl(title,platform){
  const q=[title,platform].filter(Boolean).join(' ');
  return 'https://lista.mercadolivre.com.br/'+encodeURIComponent(q).replace(/%20/g,'-');
}
function childIdsOf(product){
  const out=[];
  if(Array.isArray(product?.children_ids)) out.push(...product.children_ids);

  // Alguns produtos expõem alternativas/variantes via pickers.
  for(const picker of (product?.pickers||[])){
    for(const p of (picker?.products||[])){
      if(p?.product_id) out.push(p.product_id);
    }
  }
  return [...new Set(out.filter(Boolean))];
}

async function exploreCatalogProducts(rootIds,token){
  const MAX_PRODUCTS=30;
  const MAX_DEPTH=2;
  const queue=rootIds.map(id=>({id,depth:0}));
  const seen=new Set();
  const products=[];
  const winners=[];

  while(queue.length && seen.size<MAX_PRODUCTS){
    const cur=queue.shift();
    if(!cur?.id || seen.has(cur.id)) continue;
    seen.add(cur.id);

    const r=await apiGet(
      'https://api.mercadolibre.com/products/'+encodeURIComponent(cur.id),
      token
    );
    if(!r.ok) continue;

    const p=r.data;
    products.push(p);

    if(p?.buy_box_winner?.item_id){
      winners.push({
        productId:p.id,
        productName:p.name||p.family_name||'',
        winner:p.buy_box_winner
      });
    }

    if(cur.depth < MAX_DEPTH){
      for(const childId of childIdsOf(p)){
        if(!seen.has(childId) && seen.size+queue.length<MAX_PRODUCTS){
          queue.push({id:childId,depth:cur.depth+1});
        }
      }
    }
  }

  return {products,winners};
}

async function searchCatalogNew(title,platform,token){
  const q=[cleanText(title,120),cleanText(platform,50)].filter(Boolean).join(' ');
  const params=new URLSearchParams({
    status:'active',
    site_id:'MLB',
    q
  });

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

  const roots=(search.data.results||[]).slice(0,8);
  if(!roots.length){
    return {
      status:'empty',
      stage:'products_search',
      offers:[],
      catalogMatches:0,
      catalogProducts:[]
    };
  }

  const rootIds=roots.map(p=>p.id).filter(Boolean);
  const explored=await exploreCatalogProducts(rootIds,token);

  const uniqueWinners=[
    ...new Map(
      explored.winners
        .filter(x=>x?.winner?.item_id)
        .map(x=>[x.winner.item_id,x])
    ).values()
  ].slice(0,12);

  const catalogProducts=explored.products
    .filter(p=>p && p.status==='active')
    .map(p=>({
      productId:p.id,
      name:p.name||p.family_name||'',
      permalink:p.permalink||'',
      hasWinner:Boolean(p.buy_box_winner?.item_id),
      isTerminal:childIdsOf(p).length===0
    }))
    .filter(p=>p.permalink)
    .slice(0,12);

  if(!uniqueWinners.length){
    return {
      status:'empty',
      stage:'catalog_children',
      offers:[],
      catalogMatches:roots.length,
      productsExamined:explored.products.length,
      catalogProducts,
      detail:'Catálogo encontrado, inclusive filhos/variantes, mas nenhum buy_box_winner ativo foi retornado.'
    };
  }

  const itemResults=await Promise.all(uniqueWinners.map(async entry=>{
    const r=await apiGet(
      'https://api.mercadolibre.com/items/'+encodeURIComponent(entry.winner.item_id),
      token
    );
    return {entry,response:r};
  }));

  const raw=[];
  for(const {entry,response} of itemResults){
    if(!response.ok) continue;

    const x=response.data;
    const cond=itemCondition(x);
    if(cond && cond!=='new') continue;

    const price=Number(x.price ?? entry.winner.price);
    const image=
      x.secure_thumbnail ||
      x.thumbnail ||
      x.pictures?.[0]?.secure_url ||
      x.pictures?.[0]?.url ||
      '';

    const url=x.permalink||'';
    if(!price || !url) continue;

    raw.push({
      source:'Mercado Livre',
      sourceKind:'nacional',
      title:x.title||entry.productName||title,
      condition:'Novo',
      priceValue:price,
      displayPrice:brl(price),
      originalDisplayPrice:x.original_price?brl(x.original_price):brl(price),
      url,
      image,
      location:[
        x.seller_address?.city?.name || entry.winner.seller_address?.city?.name,
        x.seller_address?.state?.name || entry.winner.seller_address?.state?.name
      ].filter(Boolean).join(', '),
      currency:x.currency_id||entry.winner.currency_id||'BRL',
      shippingIncluded:Boolean(
        x.shipping?.free_shipping ?? entry.winner.shipping?.free_shipping
      ),
      itemId:x.id||entry.winner.item_id,
      catalogProductId:x.catalog_product_id||entry.productId||null,
      mock:false
    });
  }

  // Primeiro tenta manter só resultados semanticamente próximos.
  let offers=raw.filter(o=>relevantEnough(o.title,title));
  if(!offers.length) offers=raw;

  offers=[
    ...new Map(offers.map(o=>[o.itemId||o.url,o])).values()
  ].sort((a,b)=>a.priceValue-b.priceValue);

  return {
    status:offers.length?'ok':'empty',
    stage:'catalog_children_buy_box',
    offers,
    catalogMatches:roots.length,
    productsExamined:explored.products.length,
    winnersFound:uniqueWinners.length,
    catalogProducts,
    detail:offers.length?null:'Buy box encontrado, mas nenhum item final utilizável passou pelos filtros.'
  };
}

async function searchUsedListings(title,platform,token){
  const q=[cleanText(title,120),cleanText(platform,50)].filter(Boolean).join(' ');
  const params=new URLSearchParams({q,limit:'20',condition:'used'});

  const search=await apiGet(
    'https://api.mercadolibre.com/sites/MLB/search?'+params.toString(),
    token
  );

  if(!search.ok){
    return {
      status:search.status===401?'token_expired':'error',
      httpStatus:search.status,
      stage:'sites_search',
      detail:search.data?.message||search.data?.error||'sites/MLB/search failed',
      offers:[]
    };
  }

  const results=search.data.results||[];
  let filteredOut=0;
  const raw=[];
  for(const x of results){
    if(!x.price||!x.permalink){filteredOut++;continue}
    const reject=listingRejectReason(x.title);
    if(reject){filteredOut++;continue}
    if(!relevantEnough(x.title,title)){filteredOut++;continue}
    raw.push({
      source:'Mercado Livre',
      sourceKind:'nacional',
      title:x.title,
      condition:itemCondition(x)==='new'?'Novo':'Usado',
      priceValue:Number(x.price),
      displayPrice:brl(x.price),
      originalDisplayPrice:brl(x.price),
      url:x.permalink,
      image:x.thumbnail||x.secure_thumbnail||'',
      location:[
        x.seller_address?.city?.name||x.address?.city_name,
        x.seller_address?.state?.name||x.address?.state_name
      ].filter(Boolean).join(', '),
      currency:x.currency_id||'BRL',
      shippingIncluded:Boolean(x.shipping?.free_shipping),
      itemId:x.id||null,
      mock:false
    });
  }

  const offers=raw.sort((a,b)=>a.priceValue-b.priceValue).slice(0,18);
  return {
    status:offers.length?'ok':'empty',
    stage:'sites_search',
    offers,
    totalFound:Number(search.data.paging?.total||results.length),
    filteredOut,
    detail:offers.length?null:'Busca retornou resultados, mas nenhum passou pelos filtros de relevância/lixo.'
  };
}

async function buildOffersResponse({method,query,token}){
  if(method!=='GET')return {statusCode:405,cacheControl:'no-store',body:{error:'method_not_allowed'}};

  const title=cleanText(query.title||query.q,120);
  const platform=cleanText(query.platform,50);
  const condition=cleanText(query.condition||'new',16).toLowerCase();

  if(!title)return {statusCode:400,cacheControl:'no-store',body:{error:'missing_title'}};
  if(title.length<2)return {statusCode:400,cacheControl:'no-store',body:{error:'query_too_short'}};
  if(condition!=='used'&&condition!=='new'){
    return {statusCode:400,cacheControl:'no-store',body:{error:'unsupported_condition'}};
  }

  if(!token){
    return {statusCode:200,cacheControl:'no-store',body:{
      title,platform:platform||null,condition,
      offers:[],nationalOffers:[],importedOffers:[],totalShown:0,
      generatedAt:new Date().toISOString(),
      sources:{mercado_livre:{status:'not_configured'}}
    }};
  }

  if(condition==='used'){
    if(!token){
      return {statusCode:200,cacheControl:'no-store',body:{
        title,platform:platform||null,condition,
        offers:[],nationalOffers:[],importedOffers:[],totalShown:0,
        externalSearchUrl:externalSearchUrl(title,platform),
        generatedAt:new Date().toISOString(),
        sources:{mercado_livre:{status:'not_configured'}}
      }};
    }
    const meli=await searchUsedListings(title,platform,token);
    const nationalOffers=(meli.offers||[]).slice(0,12);
    const cacheControl=meli.status==='ok'
      ? 's-maxage=180, stale-while-revalidate=600'
      : 'no-store';
    return {statusCode:200,cacheControl,body:{
      title,platform:platform||null,condition,
      offers:nationalOffers,nationalOffers,importedOffers:[],totalShown:nationalOffers.length,
      externalSearchUrl:externalSearchUrl(title,platform),
      generatedAt:new Date().toISOString(),
      sources:{
        mercado_livre:{
          status:meli.status,
          flow:'sites_search',
          stage:meli.stage||null,
          httpStatus:meli.httpStatus||null,
          totalFound:meli.totalFound||0,
          filteredOut:meli.filteredOut||0,
          detail:meli.detail||null
        }
      }
    }};
  }

  const meli=await searchCatalogNew(title,platform,token);
  const nationalOffers=(meli.offers||[]).slice(0,12);
  const cacheControl=meli.status==='ok'
    ? 's-maxage=180, stale-while-revalidate=600'
    : 'no-store';

  return {statusCode:200,cacheControl,body:{
    title,
    platform:platform||null,
    condition,
    offers:nationalOffers,
    nationalOffers,
    importedOffers:[],
    totalShown:nationalOffers.length,
    catalogProducts:meli.catalogProducts||[],
    generatedAt:new Date().toISOString(),
    sources:{
      mercado_livre:{
        status:meli.status,
        flow:'products_search_children_buy_box',
        stage:meli.stage||null,
        httpStatus:meli.httpStatus||null,
        catalogMatches:meli.catalogMatches||0,
        productsExamined:meli.productsExamined||0,
        winnersFound:meli.winnersFound||0,
        detail:meli.detail||null
      }
    }
  }};
}

let statusCache={value:null,expiresAt:0};
async function checkStatus(token){
  const now=Date.now();
  if(statusCache.value && now<statusCache.expiresAt)return statusCache.value;
  const me=await apiGet('https://api.mercadolibre.com/users/me',token);
  const products=await apiGet(
    'https://api.mercadolibre.com/products/search?status=active&site_id=MLB&q=Resident%20Evil%204',
    token
  );
  const used=await apiGet(
    'https://api.mercadolibre.com/sites/MLB/search?q=Resident%20Evil%204&condition=used&limit=5',
    token
  );
  const result={
    configured:true,
    tokenCheck:{
      ok:me.ok,
      httpStatus:me.status,
      error:me.data?.error||null,
      message:me.data?.message||null,
      userId:me.data?.id||null,
      nickname:me.data?.nickname||null
    },
    productSearchCheck:{
      ok:products.ok,
      httpStatus:products.status,
      error:products.data?.error||null,
      message:products.data?.message||null,
      productCount:Array.isArray(products.data?.results)?products.data.results.length:null
    },
    usedSearchCheck:{
      ok:used.ok,
      httpStatus:used.status,
      error:used.data?.error||null,
      message:used.data?.message||null,
      resultCount:Array.isArray(used.data?.results)?used.data.results.length:null
    }
  };
  statusCache={value:result,expiresAt:now+60_000};
  return result;
}

module.exports={buildOffersResponse,checkStatus};
