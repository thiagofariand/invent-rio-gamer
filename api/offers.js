/* Inventário Gamer v0.98 — Mercado Livre offers adapter */
function brl(v){return new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(v||0))}
function cleanText(s,max=140){return String(s||'').replace(/\s+/g,' ').trim().slice(0,max)}
function norm(s){return String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[’']/g,'').replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim()}

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
  const stop=new Set(['the','of','and','a','an','edition','edicao','game','jogo']);
  const wanted=norm(masterTitle).split(' ').filter(t=>t.length>1&&!stop.has(t));
  if(!wanted.length)return true;
  const got=new Set(norm(listingTitle).split(' '));
  const matched=wanted.filter(t=>got.has(t)).length;
  if(wanted.length<=2)return matched===wanted.length;
  return matched/wanted.length>=0.6;
}

function filterOffers(rawOffers,masterTitle){
  let filteredOut=0;const offers=[];
  for(const o of rawOffers){
    if(listingRejectReason(o.title)||!relevantEnough(o.title,masterTitle)){filteredOut++;continue}
    offers.push(o);
  }
  return {offers,filteredOut};
}

function sourceQuery(title,platform){return [cleanText(title,120),cleanText(platform,50)].filter(Boolean).join(' ')}

async function searchMercadoLivre(title,platform,condition){
  const token=process.env.MELI_ACCESS_TOKEN;
  if(!token)return {status:'not_configured',offers:[]};
  try{
    const params=new URLSearchParams({q:sourceQuery(title,platform),limit:'20',condition:condition==='new'?'new':'used'});
    const r=await fetch('https://api.mercadolibre.com/sites/MLB/search?'+params.toString(),{headers:{Authorization:'Bearer '+token}});
    if(!r.ok){
      const body=await r.text();
      return {status:r.status===401?'token_expired':'error',offers:[],detail:'HTTP '+r.status+' '+body.slice(0,160)};
    }
    const data=await r.json();
    const raw=(data.results||[]).filter(x=>x.price&&x.permalink).map(x=>({
      source:'Mercado Livre',sourceKind:'nacional',title:x.title,condition:x.condition==='new'?'Novo':'Usado',
      priceValue:Number(x.price),displayPrice:brl(x.price),originalDisplayPrice:brl(x.price),url:x.permalink,
      image:x.thumbnail||'',location:[x.address?.city_name,x.address?.state_name].filter(Boolean).join(', '),
      currency:x.currency_id||'BRL',shippingIncluded:Boolean(x.shipping?.free_shipping)
    }));
    const filtered=filterOffers(raw,title);
    return {status:'ok',offers:filtered.offers,total:Number(data.paging?.total||raw.length),filteredOut:filtered.filteredOut};
  }catch(e){return {status:'error',offers:[],detail:String(e.message||e)}}
}

module.exports=async function handler(req,res){
  if(req.method!=='GET')return res.status(405).json({error:'method_not_allowed'});
  const title=cleanText(req.query.title||req.query.q,120);
  const platform=cleanText(req.query.platform,50);
  const condition=cleanText(req.query.condition||'used',16).toLowerCase();
  if(!title)return res.status(400).json({error:'missing_title'});
  if(title.length<2)return res.status(400).json({error:'query_too_short'});
  if(condition!=='used'&&condition!=='new')return res.status(400).json({error:'unsupported_condition'});

  const meli=await searchMercadoLivre(title,platform,condition);
  const nationalOffers=(meli.offers||[]).sort((a,b)=>a.priceValue-b.priceValue).slice(0,18);
  if(meli.status==='ok')res.setHeader('Cache-Control','s-maxage=180, stale-while-revalidate=600');
  else res.setHeader('Cache-Control','no-store');

  return res.status(200).json({
    title,platform:platform||null,condition,
    offers:nationalOffers,nationalOffers,importedOffers:[],totalShown:nationalOffers.length,generatedAt:new Date().toISOString(),
    sources:{mercado_livre:{status:meli.status,total:meli.total||0,filteredOut:meli.filteredOut||0}}
  });
};
