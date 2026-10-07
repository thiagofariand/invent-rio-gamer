/* ---------- busca no catálogo (local) ---------- */
// Parte B, item 7e: opcional, atrás da flag SEARCH_MISS_LOG (desligada por
// padrão) — manda só o termo normalizado quando a busca não acha NADA, pro
// backend contar no KV (sem IP, sem título cru, sem qualquer identificação).
// Fire-and-forget: nunca atrasa nem quebra o render da página de busca.
function logSearchMiss(raw){
  if(!SEARCH_MISS_LOG)return;
  const term=normSearch(raw);
  if(!term)return;
  try{
    fetch('/api/trending',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({term}),keepalive:true}).catch(()=>{});
  }catch{/* nunca quebra a busca por causa disso */}
}
function scoreTitle(p,q,core){
  const names=[p.title,...p.aliases].map(normSearch),fr=normSearch(p.franchise);
  let s=0;
  // Parte B, item 7b: apelido de FRANQUIA (src/data/search-aliases.json,
  // chave = p.universe) conta igual ao nome literal da franquia bater.
  const franchiseAliases=franchiseAliasIdx.get(p.universe)||[];
  if(q===fr||core===fr||franchiseAliases.includes(q)||franchiseAliases.includes(core))s=80;
  else{
    if(names.includes(q))s=120;
    if(names.includes(core))s=Math.max(s,110);
    if(core.length>2&&names.some(n=>n.includes(core)))s=Math.max(s,65);
    const tokens=core.split(' ').filter(Boolean);
    const hay=' '+p.searchText;
    if(tokens.length&&tokens.every(t=>hay.includes(' '+t)))s=Math.max(s,50+tokens.length);
  }
  return s;
}
function matchCatalog(raw){
  const q=normSearch(raw);
  if(!q)return catalog.map(p=>({p,score:1,variants:p.variants,platform:null}));
  const platform=detectPlatform(raw),core=stripPlatform(raw,platform);
  const out=[];
  for(const p of catalog){
    let s=core?scoreTitle(p,q,core):30;
    if(!s)continue;
    let variants=p.variants;
    if(platform)variants=variants.filter(v=>v[1]===platform);
    if(!variants.length)continue;
    out.push({p,score:s,variants,platform});
  }
  return out.sort((a,b)=>b.score-a.score||a.p.title.localeCompare(b.p.title));
}
const COND_ORDER={used:0,new:1,digital:2};
const COND_LABEL={used:'Usado',new:'Novo',digital:'Digital'};
const COND_URL={used:'usado',new:'novo',digital:'digital'};
const URL_COND={usado:'used',novo:'new',digital:'digital'};
function rowsFromMatches(matches){
  const rows=[];
  for(const m of matches)for(const v of m.variants){
    const conds=['used','new'];
    if(hasDigital(m.p,v[1]))conds.push('digital');
    rows.push({kind:'game',p:m.p,platform:v[1],eco:v[0],conds,score:m.score});
  }
  return rows;
}
const CATS=[['games','Games'],['acessorios','Acessórios'],['colecionaveis','Colecionáveis'],['merch','Decoração'],['fanmade','Fan-made']];
const catLabel=k=>(CATS.find(c=>c[0]===k)||[])[1]||k;
const ORIGIN_LABEL={oficial:'Oficial','nao-confirmado':'Licenciamento não confirmado',fanmade:'Fan-made',artesanal:'Artesanal'};
function merchRows(raw){
  if(!mockMerch())return [];
  const q=norm(raw),tokens=q.split(' ').filter(Boolean);
  return M.items.map(it=>{
    const u=it.universe?uMap.get(it.universe):null;
    const hay=' '+norm([it.title,it.subtitle,u?u.name:'',(D.merchTypes[it.type]||{}).label||''].join(' '));
    const ok=!tokens.length||tokens.every(t=>hay.includes(' '+t));
    return ok?{kind:'merch',item:it,score:tokens.length?40:0}:null;
  }).filter(Boolean);
}
function readFilters(params){
  const list=k=>(params.get(k)||'').split(',').map(s=>s.trim()).filter(Boolean);
  const num=k=>{const v=parseFloat(String(params.get(k)||'').replace(',','.'));return Number.isFinite(v)?v:null};
  return {
    cats:new Set(list('cat')),
    genres:new Set(list('genre')),
    conds:new Set(list('cond').map(c=>URL_COND[c]).filter(Boolean)),
    plats:new Set(list('plat')),
    min:num('min'),max:num('max'),
    retro:params.get('retro')==='1',
    // Pacote2, item 4.1: #/busca?universo={slug}&retro=1 — link do card
    // "Clássicos" da página de universo, escopando a busca pra franquia.
    universo:params.get('universo')||'',
    sort:params.get('sort')||'relevancia',
    // Pacote4 2.5: filtro de estado de lançamento ('' = Todos).
    lanc:['lancado','pre-venda','anunciado'].includes(params.get('lanc'))?params.get('lanc'):''
  };
}
const rowCat=r=>r.kind==='game'?'games':r.item.cat;
function visibleConds(r,F){
  if(!F||!F.conds||!F.conds.size)return r.conds;
  const v=r.conds.filter(c=>F.conds.has(c));
  return v.length?v:r.conds;
}
function applyFilters(rows,F){
  return rows.filter(r=>{
    if(F.cats.size&&!F.cats.has(rowCat(r)))return false;
    if(r.kind==='game'){
      if(F.universo&&r.p.universe!==F.universo)return false;
      if(F.conds.size&&!r.conds.some(c=>F.conds.has(c)))return false;
      if(F.plats.size&&!F.plats.has(r.platform))return false;
      if(F.retro&&!isRetro(r.platform))return false;
      if(F.lanc&&releaseState(r.p)!==F.lanc)return false;
      if(F.genres&&F.genres.size&&!(r.p.genres||[]).some(g=>F.genres.has(g)))return false;
      if(F.min!=null||F.max!=null){
        const conds=visibleConds(r,F).filter(c=>c!=='digital');
        const known=conds.map(c=>summaryOf(c,r.p.title,r.platform)).filter(s=>s&&s.min!=null);
        if(known.length){
          const ok=known.some(s=>(F.min==null||s.min>=F.min)&&(F.max==null||s.min<=F.max));
          if(!ok)return false;
        }
      }
    }else{
      if(F.universo&&r.item.universe!==F.universo)return false;
      if(F.conds.size||F.plats.size||F.retro||F.lanc||(F.genres&&F.genres.size))return false;
      if(F.min!=null&&r.item.price<F.min)return false;
      if(F.max!=null&&r.item.price>F.max)return false;
    }
    return true;
  });
}

/* ---------- consulta de ofertas (API real + exemplos) ---------- */
const results=new Map(),memo=new Map(),SUM_TTL=30*60*1000,FAIL_TTL=60*1000;
let sums=LS.get(KEYS.sums,{});
const sumKey=(c,t,p)=>`${c}|${t}|${p}`;
function summarize(res){
  const offs=(res&&res.offers)||[];
  return {status:res.status,count:offs.length,min:offs.length?offs[0].priceValue:null,minDisplay:offs.length?offs[0].displayPrice:null,image:offs.find(o=>o.image)?.image||'',mock:!!res.mock};
}
function summaryOf(cond,title,platform){
  const k=sumKey(cond,title,platform),r=results.get(k);
  if(r&&!isStale(r))return summarize(r);
  const s=sums[k];
  if(s&&Date.now()-s.t<SUM_TTL)return {status:s.status,count:s.count,min:s.min,minDisplay:s.minDisplay,image:s.image||'',mock:false};
  return null;
}
function bestOfferImage(p,platform=''){
  const plats=platform?[platform]:p.variants.map(v=>v[1]);
  for(const plat of plats){for(const cond of ['used','new']){const s=summaryOf(cond,p.title,plat);if(s&&s.image)return s.image}}
  return '';
}
const FAIL_STATES=['error','offline','token_expired','not_configured'];
const isStale=r=>FAIL_STATES.includes(r.realStatus||r.status)&&r.mock!==true&&Date.now()-r.t>FAIL_TTL;
function fetchCond(title,platform,cond){
  const k=sumKey(cond,title,platform);
  const hit=results.get(k);
  if(hit&&!isStale(hit))return Promise.resolve(hit);
  if(memo.has(k))return memo.get(k);
  const pr=(async()=>{
    let res;
    try{
      const qs=new URLSearchParams({title,platform,condition:cond});
      const r=await fetch('/api/offers?'+qs.toString(),{headers:{Accept:'application/json'}});
      const d=await r.json();
      const offers=(d.nationalOffers||d.offers||[]).filter(o=>o&&o.priceValue!=null).map(o=>({...o,url:safeUrl(o.url)}));
      const st=d&&d.sources&&d.sources.mercado_livre?d.sources.mercado_livre.status:'error';
      res={status:r.ok?(offers.length?'ok':(st==='ok'?'empty':(st||'error'))):'error',offers,t:Date.now()};
    }catch{res={status:'offline',offers:[],t:Date.now()}}
    // Pacote3, item 2.1: a lista de anúncios de exemplo agora vem de
    // sampleOfferList (app-1-core.js), que deriva do MESMO preço único de
    // sampleOffers(title) usado em toda a vitrine — troca o antigo
    // M.offersFor(), que tinha sua própria semente e podia divergir do
    // preço já mostrado no card antes da API responder.
    if(!res.offers.length&&mockOffers()){res={status:'ok',realStatus:res.status,offers:sampleOfferList(title,{title},cond),mock:true,t:Date.now()}}
    results.set(k,res);
    if(!res.mock&&(res.status==='ok'||res.status==='empty')){const s=summarize(res);sums[k]={t:Date.now(),status:s.status,count:s.count,min:s.min,minDisplay:s.minDisplay,image:s.image||''};LS.set(KEYS.sums,sums)}
    memo.delete(k);
    return res;
  })();
  memo.set(k,pr);
  return pr;
}

/* ---------- linhas de resultado ---------- */
const rowKey=r=>r.kind==='game'?`${r.p.slug}|${r.platform}`:`m|${r.item.id}`;
const condKey=(r,cond)=>rowKey(r)+'|'+cond;
function priceCell(r){
  if(r.kind==='merch'){
    return `<div class="price-block">${r.item.unique?'preço do anúncio':'a partir de'}<span class="price-val">${brl(r.item.price)}</span><span class="fine">${mockChip()} preço de exemplo</span></div>`;
  }
  return '';
}
function rowAction(r){
  if(r.kind==='merch'){
    if(r.item.unique)return `<button class="btn btn-outline" data-act="mock-item" data-id="${esc(r.item.id)}">Ver item →</button>`;
    return `<button class="btn btn-outline" data-act="open-merch-offers" data-id="${esc(r.item.id)}">Ver ofertas →</button>`;
  }
  return '';
}
// Pacote3, item 2.1: preço de exemplo da linha de busca vem do MESMO
// sampleOffers(title) do resto do site — se o bucket do jogo não inclui
// esta condição, cai em "sem ofertas" (não inventa mais preço pra toda
// condição como o antigo demoPrice fazia).
function purchasePriceMarkup(cond,p,platform){
  const s=summaryOf(cond,p.title,platform);
  if(s&&s.status==='ok'&&s.count){
    return `<span class="purchase-from">a partir de</span><strong>${esc(s.minDisplay)}</strong>${s.mock?mockChip():''}`;
  }
  const demo=sampleOffers(p.title,{year:p.year})[cond];
  if(demo)return `<span class="purchase-from">a partir de</span><strong>${esc(demo.display)}</strong>${mockChip()}`;
  return `<span class="purchase-from">sem ofertas</span>`;
}
function conditionRowMarkup(r,cond){
  const ck=esc(condKey(r,cond));
  if(cond==='digital'){
    return `<a class="purchase-price-row" data-condkey="${ck}" href="${offerPageHref(r.p,r.platform,'digital')}"><span class="purchase-condition">Digital</span><span class="purchase-value"><span class="purchase-from">lojas oficiais</span></span><span class="purchase-row-arrow">→</span></a>`;
  }
  return `<a class="purchase-price-row" data-condkey="${ck}" href="${offerPageHref(r.p,r.platform,cond)}"><span class="purchase-condition">${COND_LABEL[cond]}</span><span class="purchase-value">${purchasePriceMarkup(cond,r.p,r.platform)}</span><span class="purchase-row-arrow">→</span></a>`;
}
function gameRowPriceList(r,F){
  const conds=visibleConds(r,F);
  return `<div class="purchase-price-list">${conds.map(c=>conditionRowMarkup(r,c)).join('')}</div>`;
}
function rowMarkup(r,F){
  const rk=esc(rowKey(r));
  if(r.kind==='merch'){
    const it=r.item,u=it.universe?uMap.get(it.universe):null;
    regRef(mockRef(it));
    return `<article class="row" data-rowkey="${rk}">
      <div class="row-cover">${coverTile(it.title,{size:'',mock:false})}</div>
      <div class="row-main"><span class="row-title" style="cursor:default">${esc(it.title)}</span>
        <div class="row-chips"><span class="chip">${esc(ORIGIN_LABEL[it.origin]||'')}</span><span class="chip soft">${esc(catLabel(it.cat))}</span>${it.unique?'<span class="chip soft">peça única</span>':''}${mockChip()}</div>
        <div class="row-sub">${esc(it.subtitle)}${u?' · '+esc(u.name):''}</div></div>
      <div class="row-price" data-pcell>${priceCell(r)}</div>
      <div class="row-action">${rowAction(r)}</div></article>`;
  }
  const p=r.p,href=`#/jogo/${p.slug}?plat=${enc(r.platform)}`;
  const shown=visibleConds(r,F);
  const chips=`<span class="chip soft">${esc(r.platform)}</span>${shown.map(c=>`<span class="chip">${COND_LABEL[c]}</span>`).join('')}`;
  return `<article class="row row-game" data-rowkey="${rk}">
    <a class="row-cover" href="${href}" tabindex="-1" aria-hidden="true" data-covercell
       data-igdb-cover data-igdb-title="${esc(igdbTitleFor(p,r.platform))}" data-igdb-platform="${esc(r.platform)}" data-igdb-year="${esc(p.year||'')}">${coverTile(p.title,{platform:''})}</a>
    <div class="row-main"><a class="row-title" href="${href}">${esc(p.title)}</a><div class="row-chips">${chips}</div>
      <div class="row-sub">${esc(p.franchise)}${p.year?' · '+p.year:''}</div></div>
    <div class="row-price-list" data-pricelist>${gameRowPriceList(r,F)}</div>
  </article>`;
}
let viewToken=0;
const PRICE_AUTOLOAD=6;
async function autoloadPrices(rows,token,F){
  const tasks=[];
  for(const r of rows){
    if(r.kind!=='game')continue;
    for(const cond of visibleConds(r,F)){
      if(cond==='digital')continue;
      if(!summaryOf(cond,r.p.title,r.platform))tasks.push({r,cond});
    }
  }
  const need=tasks.slice(0,PRICE_AUTOLOAD);
  await mapLimit(need,2,async({r,cond})=>{
    await fetchCond(r.p.title,r.platform,cond);
    if(token!==viewToken)return;
    const el=document.querySelector(`[data-condkey="${CSS.escape(condKey(r,cond))}"]`);
    if(el)el.outerHTML=conditionRowMarkup(r,cond);
    /* A capa canônica vem da IGDB; imagens de anúncios ficam restritas ao modal de ofertas. */
  });
}

/* ---------- lojas digitais e atalhos externos (links de busca reais) ---------- */
// Pacote4 3.1/3.2/3.3: cada entrada tem `direto` (true = página do jogo na
// própria loja, false = busca da loja) e, quando faz sentido comparar com
// um link direto que a IGDB/catálogo possam fornecer pro mesmo nome de
// loja, `storeKey` (vocabulário de STORE_NAMES em app-1-core.js) — ver
// applyDirectStoreLinks(), chamada depois de fetchIgdbVisual() resolver.
function digitalStores(p,platform){
  const out=[];
  if(platform==='Switch'||platform==='Switch 2')out.push({kind:'oficial',name:'Nintendo Store',storeKey:'Nintendo',url:`https://www.nintendo.com/pt-br/search/#q=${enc(p.title)}`,direto:false});
  if(platform==='PS4'||platform==='PS5')out.push({kind:'oficial',name:'PlayStation Store',storeKey:'PlayStation',url:`https://store.playstation.com/pt-br/search/${enc(p.title)}`,direto:false});
  const u=p.universe?uMap.get(p.universe):null;
  if(u&&u.eco==='Multi')out.push({kind:'oficial',name:'Steam',storeKey:'Steam',url:`https://store.steampowered.com/search/?term=${enc(p.title)}`,direto:false});
  const d=D.digitalCatalog[p.title];
  // d.url já é um link verificado à mão (ver CLAUDE.md) — direto de verdade.
  if(d)out.push({kind:'autorizado',name:'Nuuvem',url:d.url,note:d.platform,direto:true});
  if(!out.length)out.push({kind:'autorizado',name:'Nuuvem',url:`https://www.nuuvem.com/br-pt/catalog/page/1/search/${enc(p.title)}`,direto:false});
  return out;
}
// Pacote4 3.3: troca o link de busca pelo link direto (catálogo manual ou
// IGDB, catálogo com prioridade) quando o nome da loja bate — mantém a
// busca como estava pra qualquer loja sem link direto confirmado.
function applyDirectStoreLinks(stores,directLinks){
  if(!directLinks||!directLinks.length)return stores;
  const byKey=new Map();
  // directLinks já chega ordenado por prioridade (catálogo antes da IGDB);
  // a primeira ocorrência de cada loja fica, as próximas são ignoradas.
  directLinks.forEach(l=>{if(!byKey.has(l.loja))byKey.set(l.loja,l)});
  return stores.map(s=>{
    const match=s.storeKey&&byKey.get(s.storeKey);
    return match?{...s,url:match.url,direto:true}:s;
  });
}
// Pacote4 3.4: tenta a versão pt-br do link da PlayStation Store — best
// effort (troca o segmento de locale da URL), atrás da flag
// STORE_LOCALE_BR (desligada por padrão). Sem rede neste ambiente pra
// validar contra a Store de verdade; documentado no resumo que o teste
// real depende do preview.
function psStoreLocaleBR(url){
  if(!STORE_LOCALE_BR)return url;
  try{
    const u=new URL(url);
    if(!/playstation\.com$/i.test(u.hostname.replace(/^store\./,'')))return url;
    u.pathname=u.pathname.replace(/^\/[a-z]{2}-[a-z]{2}\//i,'/pt-br/');
    return u.toString();
  }catch{return url}
}
const ext={
  ml:q=>`https://lista.mercadolivre.com.br/${enc(q)}`,
  olx:q=>`https://www.olx.com.br/brasil?q=${enc(q)}`,
  enjoei:q=>`https://www.enjoei.com.br/s?q=${enc(q)}`,
  shopee:q=>`https://shopee.com.br/search?keyword=${enc(q)}`,
  etsy:q=>`https://www.etsy.com/search?q=${enc(q)}`,
  ebay:q=>`https://www.ebay.com/sch/i.html?_nkw=${enc(q)}`,
  nintendo:q=>`https://www.nintendo.com/pt-br/search/#q=${enc(q)}`,
  ps:q=>`https://store.playstation.com/pt-br/search/${enc(q)}`,
  steam:q=>`https://store.steampowered.com/search/?term=${enc(q)}`,
  nuuvem:q=>`https://www.nuuvem.com/br-pt/catalog/page/1/search/${enc(q)}`
};
const extLink=(label,url)=>`<a class="btn btn-ghost btn-sm" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label)} ↗</a>`;
const physicalLinks=q=>extLink('Mercado Livre',ext.ml(q))+extLink('OLX',ext.olx(q))+extLink('Enjoei',ext.enjoei(q));
const digitalLinks=q=>extLink('Nintendo Store',ext.nintendo(q))+extLink('PlayStation Store',ext.ps(q))+extLink('Steam',ext.steam(q))+extLink('Nuuvem',ext.nuuvem(q));
function merchLinks(term,cat){
  if(cat==='fanmade')return extLink('Etsy',ext.etsy(term))+extLink('Mercado Livre',ext.ml(term))+extLink('Shopee',ext.shopee(term));
  if(cat==='colecionaveis')return extLink('Mercado Livre',ext.ml(term))+extLink('Shopee',ext.shopee(term))+extLink('eBay',ext.ebay(term));
  return extLink('Mercado Livre',ext.ml(term))+extLink('Shopee',ext.shopee(term))+extLink('Etsy',ext.etsy(term));
}

/* ---------- autocomplete (local, sem chamar APIs a cada tecla) ---------- */
function suggestions(raw){
  const q=normSearch(raw);
  if(q.length<2)return [];
  const tokens=q.split(' ').filter(Boolean);
  const out=[];
  // Parte B, item 7b: apelido (franquia ou universo) também sugere — a
  // sugestão sempre mostra o nome OFICIAL (u.name), nunca o apelido digitado.
  const uni=universes.find(u=>u.hasCatalog&&(normSearch(u.name).startsWith(q)&&q.length>=3||universeAliasMatch(u,q)));
  if(uni)out.push({type:'universe',u:uni,score:200});
  for(const p of catalog){
    const hay=' '+p.searchText;
    if(!tokens.every(t=>hay.includes(' '+t)))continue;
    const names=[p.title,...p.aliases].map(normSearch);
    let s=60;
    if(names.some(n=>n.startsWith(q)))s=100;else if(names.some(n=>(' '+n).includes(' '+q)))s=85;
    out.push({type:'title',p,score:s-Math.min(p.title.length,40)/100});
  }
  return out.sort((a,b)=>b.score-a.score).slice(0,5);
}
function suggestPrice(p){
  let best=null;
  for(const v of p.variants){const s=summaryOf('used',p.title,v[1]);if(s&&s.status==='ok'&&s.count&&(best==null||s.min<best.min))best=s}
  return best?`<span>usado a partir de</span> <b>${esc(best.minDisplay)}</b>`:'Ver ofertas';
}
