/* ---------- busca no catálogo (local) ---------- */
function scoreTitle(p,q,core){
  const names=[p.title,...p.aliases].map(norm),fr=norm(p.franchise);
  let s=0;
  if(q===fr||core===fr)s=80;
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
  const q=norm(raw);
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
    for(const cond of conds)rows.push({kind:'game',p:m.p,platform:v[1],eco:v[0],cond,score:m.score});
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
    conds:new Set(list('cond').map(c=>URL_COND[c]).filter(Boolean)),
    plats:new Set(list('plat')),
    min:num('min'),max:num('max'),
    retro:params.get('retro')==='1'
  };
}
const rowCat=r=>r.kind==='game'?'games':r.item.cat;
function applyFilters(rows,F){
  return rows.filter(r=>{
    if(F.cats.size&&!F.cats.has(rowCat(r)))return false;
    if(r.kind==='game'){
      if(F.conds.size&&!F.conds.has(r.cond))return false;
      if(F.plats.size&&!F.plats.has(r.platform))return false;
      if(F.retro&&!isRetro(r.platform))return false;
      if(F.min!=null||F.max!=null){
        const s=r.cond==='digital'?null:summaryOf(r.cond,r.p.title,r.platform);
        if(s&&s.min!=null){if(F.min!=null&&s.min<F.min)return false;if(F.max!=null&&s.min>F.max)return false}
      }
    }else{
      if(F.conds.size||F.plats.size||F.retro)return false;
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
    if(!res.offers.length&&mockOffers()){res={status:'ok',realStatus:res.status,offers:M.offersFor(title,platform,cond),mock:true,t:Date.now()}}
    results.set(k,res);
    if(!res.mock&&(res.status==='ok'||res.status==='empty')){const s=summarize(res);sums[k]={t:Date.now(),status:s.status,count:s.count,min:s.min,minDisplay:s.minDisplay,image:s.image||''};LS.set(KEYS.sums,sums)}
    memo.delete(k);
    return res;
  })();
  memo.set(k,pr);
  return pr;
}

/* ---------- linhas de resultado ---------- */
const rowKey=r=>r.kind==='game'?`${r.cond}|${r.p.slug}|${r.platform}`:`m|${r.item.id}`;
function priceCell(r){
  if(r.kind==='merch'){
    return `<div class="price-block">${r.item.unique?'preço do anúncio':'a partir de'}<span class="price-val">${brl(r.item.price)}</span><span class="fine">${mockChip()} preço de exemplo</span></div>`;
  }
  if(r.cond==='digital'){
    const names=digitalStores(r.p,r.platform).map(s=>s.name).join(' · ');
    return `<div class="price-block"><span class="price-muted">Lojas oficiais</span><br><span class="fine">${esc(names)}</span></div>`;
  }
  const s=summaryOf(r.cond,r.p.title,r.platform);
  if(!s)return `<div class="price-block price-muted">Preço ao abrir as ofertas</div>`;
  if(s.status==='ok'&&s.count)return `<div class="price-block">a partir de<span class="price-val">${esc(s.minDisplay)}</span>${s.count} ${s.count===1?'oferta encontrada':'ofertas encontradas'}${s.mock?` <br>${mockChip()}`:''}</div>`;
  if(s.status==='empty')return `<div class="price-block price-muted">Nenhuma oferta validada agora</div>`;
  return `<div class="price-block price-muted">Preço indisponível agora</div>`;
}
function rowAction(r){
  if(r.kind==='merch'){
    if(r.item.unique)return `<button class="btn btn-outline" data-act="mock-item" data-id="${esc(r.item.id)}">Ver item →</button>`;
    return `<button class="btn btn-outline" data-act="open-merch-offers" data-id="${esc(r.item.id)}">Ver ofertas →</button>`;
  }
  const label=r.cond==='digital'?'Ver digital →':'Ver ofertas →';
  return `<button class="btn btn-outline" data-act="open-offers" data-title="${esc(r.p.title)}" data-platform="${esc(r.platform)}" data-cond="${r.cond}">${label}</button>`;
}
function rowMarkup(r){
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
  const chips=`<span class="chip soft">${esc(r.platform)}</span><span class="chip">${COND_LABEL[r.cond]}</span>${r.cond!=='digital'?'<span class="chip soft">mídia física</span>':''}`;
  return `<article class="row" data-rowkey="${rk}">
    <a class="row-cover" href="${href}" tabindex="-1" aria-hidden="true" data-covercell
       data-igdb-cover data-igdb-title="${esc(p.title)}" data-igdb-platform="${esc(r.platform)}" data-igdb-year="${esc(p.year||'')}">${coverTile(p.title,{platform:''})}</a>
    <div class="row-main"><a class="row-title" href="${href}">${esc(p.title)}</a><div class="row-chips">${chips}</div>
      <div class="row-sub">${esc(p.franchise)}${p.year?' · '+p.year:''}</div></div>
    <div class="row-price" data-pcell>${priceCell(r)}</div>
    <div class="row-action">${rowAction(r)}</div></article>`;
}
let viewToken=0;
const PRICE_AUTOLOAD=6;
async function autoloadPrices(rows,token){
  const need=rows.filter(r=>r.kind==='game'&&r.cond!=='digital'&&!summaryOf(r.cond,r.p.title,r.platform)).slice(0,PRICE_AUTOLOAD);
  await mapLimit(need,2,async r=>{
    await fetchCond(r.p.title,r.platform,r.cond);
    if(token!==viewToken)return;
    const row=document.querySelector(`[data-rowkey="${CSS.escape(rowKey(r))}"]`);
    const el=row&&row.querySelector('[data-pcell]');
    if(el)el.innerHTML=priceCell(r);
    /* A capa canônica vem da IGDB; imagens de anúncios ficam restritas ao modal de ofertas. */
  });
}

/* ---------- lojas digitais e atalhos externos (links de busca reais) ---------- */
function digitalStores(p,platform){
  const out=[];
  if(platform==='Switch')out.push({name:'Nintendo Store',url:`https://www.nintendo.com/pt-br/search/#q=${enc(p.title)}`});
  if(platform==='PS4'||platform==='PS5')out.push({name:'PlayStation Store',url:`https://store.playstation.com/pt-br/search/${enc(p.title)}`});
  const d=D.digitalCatalog[p.title];
  if(d)out.push({name:'Nuuvem',url:d.url,note:d.platform});
  if(!out.length)out.push({name:'Nuuvem',url:`https://www.nuuvem.com/br-pt/catalog/page/1/search/${enc(p.title)}`});
  return out;
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
  nuuvem:q=>`https://www.nuuvem.com/br-pt/catalog/page/1/search/${enc(q)}`
};
const extLink=(label,url)=>`<a class="btn btn-ghost btn-sm" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label)} ↗</a>`;
const physicalLinks=q=>extLink('Mercado Livre',ext.ml(q))+extLink('OLX',ext.olx(q))+extLink('Enjoei',ext.enjoei(q));
const digitalLinks=q=>extLink('Nintendo Store',ext.nintendo(q))+extLink('PlayStation Store',ext.ps(q))+extLink('Nuuvem',ext.nuuvem(q));
function merchLinks(term,cat){
  if(cat==='fanmade')return extLink('Etsy',ext.etsy(term))+extLink('Mercado Livre',ext.ml(term))+extLink('Shopee',ext.shopee(term));
  if(cat==='colecionaveis')return extLink('Mercado Livre',ext.ml(term))+extLink('Shopee',ext.shopee(term))+extLink('eBay',ext.ebay(term));
  return extLink('Mercado Livre',ext.ml(term))+extLink('Shopee',ext.shopee(term))+extLink('Etsy',ext.etsy(term));
}

/* ---------- autocomplete (local, sem chamar APIs a cada tecla) ---------- */
function suggestions(raw){
  const q=norm(raw);
  if(q.length<2)return [];
  const tokens=q.split(' ').filter(Boolean);
  const out=[];
  const uni=universes.find(u=>u.hasCatalog&&norm(u.name).startsWith(q)&&q.length>=3);
  if(uni)out.push({type:'universe',u:uni,score:200});
  for(const p of catalog){
    const hay=' '+p.searchText;
    if(!tokens.every(t=>hay.includes(' '+t)))continue;
    const names=[p.title,...p.aliases].map(norm);
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
