/* ---------- componentes de vitrine ---------- */
const main=$('#main');
const setTitle=t=>{document.title=t?`${t} · Inventário Gamer`:'Inventário Gamer — encontre o item que falta'};
function bestUsed(p){
  let best=null;
  for(const v of p.variants){const s=summaryOf('used',p.title,v[1]);if(s&&s.status==='ok'&&s.count&&(best==null||s.min<best.min))best=s}
  return best;
}
function gameCard(p,{ctx}={}){
  const b=bestUsed(p);
  const plat=p.variants?.[0]?.[1]||'';
  return `<article class="card"><div class="igdb-cover-slot" data-igdb-cover data-igdb-title="${esc(igdbTitleFor(p,plat))}" data-igdb-platform="${esc(plat)}" data-igdb-year="${esc(p.year||'')}">${coverTile(p.title,{})}</div>${saveButton(gameRef(p))}
    <div class="card-title"><a href="#/jogo/${p.slug}">${esc(p.title)}</a></div>
    <div class="card-ctx">${esc(ctx||platShort(p))}${!ctx&&p.year?` · ${p.year}`:''}</div>
    ${b?`<div class="card-price"><small>usado a partir de</small><br>${esc(b.minDisplay)}${b.mock?' '+mockChip():''}</div>`:''}
    <span class="card-cta">Ver mais →</span></article>`;
}
function merchCard(it){
  const u=it.universe&&uMap.get(it.universe);
  const cta=it.unique
    ?`<button class="link-cta" data-act="mock-item" data-id="${esc(it.id)}">Ver item →</button>`
    :`<button class="link-cta" data-act="open-merch-offers" data-id="${esc(it.id)}">Ver ofertas →</button>`;
  return `<article class="card">${coverTile(it.title,{size:'wide',mock:true})}${saveButton(mockRef(it))}
    <div class="card-title">${esc(it.title)}</div>
    <div class="card-ctx">${esc(ORIGIN_LABEL[it.origin]||'')}${u?' · '+esc(u.name):''}</div>
    <div class="card-price"><small>${it.unique?'preço do anúncio':'a partir de'}</small><br>${brl(it.price)}</div>
    ${cta}</article>`;
}
const originLegend=()=>`<div class="legend"><span>Como identificamos cada item:</span>${Object.values(ORIGIN_LABEL).map(l=>`<span class="chip">${esc(l)}</span>`).join('')}</div>`;

/* ---------- home ---------- */
function shelfCard({title,ctx,href,price,callout,was}){
  return `<article class="card"><div class="cover-wrap">${callout?`<span class="callout">${esc(callout)}</span>`:''}${coverTile(title,{size:'wide',note:false,mock:!!price})}</div>
    <div class="card-title"><a href="${esc(href)}">${esc(title)}</a></div>
    <div class="card-ctx">${esc(ctx)}</div>
    ${price?`<div class="card-price">${was?`<span class="was">${esc(was)}</span> `:''}${esc(price)}</div>`:''}
    <span class="card-cta">Ver mais →</span></article>`;
}
function homeOfferCard(p,label){
  if(!p)return '';
  const platform=p.variants?.[0]?.[1]||'';
  const cached=bestUsed(p);
  const value=cached?.minDisplay||(mockOn()?demoPrice(p.title,'used'):null);
  // Item 2 (rodada 5): sem sobretítulo — o rótulo era o único lugar da
  // condição, então o preço nunca aparece sem ela ("Usado R$ X").
  return `<article class="lux-product-card">
    <a class="lux-product-image igdb-cover-slot" href="#/jogo/${p.slug}" data-igdb-cover data-igdb-title="${esc(igdbTitleFor(p,platform))}" data-igdb-platform="${esc(platform)}" data-igdb-year="${esc(p.year||'')}">${coverTile(p.title,{size:'wide',note:false})}</a>
    <div class="lux-product-body"><h3><a href="#/jogo/${p.slug}">${esc(p.title)}</a></h3><p>${esc(platform)}${p.year?` · ${p.year}`:''}</p>
    ${value?`<strong>Usado ${esc(value)}${!cached?' '+mockChip():''}</strong>`:'<span class="quiet-link">Ver opções →</span>'}</div>
  </article>`;
}
let homeHeroTimer=null,homeRenderId=0;
const homeTrendHref=t=>t.href||`#/tema/${t.slug}`;
function homeFeatureMarkup(trends){
  const items=trends.slice(0,3);
  return `<section class="home-feature" aria-label="Destaques em alta" data-home-carousel>
    ${items.map((t,i)=>`<article class="home-feature-slide ${i===0?'is-active':''}" data-home-slide aria-hidden="${i!==0}">
      <div class="home-feature-art game-hero-art" data-home-hero-art data-home-hero-title="${esc(t.title)}" style="--hero-h:${hashStr(t.title)%360}" aria-hidden="true"><div class="game-hero-placeholder"><b>${esc(initialsOf(t.title))}</b><span>DESTAQUE EM ALTA</span></div></div>
      <div class="home-feature-copy">${norm(t.tag||'')==='pre venda'?`<span class="game-hero-kicker">PRÉ-VENDA</span>`:''}<h1 id="home-feature-title-${i}">${esc(t.title)}</h1><p>${esc(t.copy||'Um dos assuntos gamer em destaque agora.')}</p>
        <div class="home-feature-actions"><a class="btn btn-primary" href="${esc(homeTrendHref(t))}">Explorar agora</a><a class="btn btn-glass" href="#/em-alta">Ver tudo em alta</a></div>
      </div>
    </article>`).join('')}
    <div class="home-feature-controls" role="group" aria-label="Escolher destaque">${items.map((t,i)=>`<button type="button" data-home-dot="${i}" aria-label="Mostrar ${esc(t.short||t.title)}" aria-current="${i===0}"></button>`).join('')}</div>
    <button type="button" class="home-feature-nav prev" data-home-prev aria-label="Destaque anterior">‹</button>
    <button type="button" class="home-feature-nav next" data-home-next aria-label="Próximo destaque">›</button>
  </section>`;
}
async function hydrateHomeHero(root){
  const arts=$$('[data-home-hero-art]',root);
  await mapLimit(arts,2,async art=>{
    const d=await fetchIgdbVisual(art.dataset.homeHeroTitle||'');
    if(art.isConnected&&d?.hero?.url)setHeroBackground(art,d.hero.url);
  });
}
function initHomeCarousel(root){
  clearInterval(homeHeroTimer);
  const slides=$$('[data-home-slide]',root),dots=$$('[data-home-dot]',root),counter=$('[data-home-counter]',root);
  if(slides.length<2||window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)return;
  let current=0,paused=false;
  const show=index=>{
    current=(index+slides.length)%slides.length;
    slides.forEach((slide,i)=>{
      const active=i===current;
      slide.classList.toggle('is-active',active);
      slide.setAttribute('aria-hidden',String(!active));
      $$('a,button',slide).forEach(el=>el.tabIndex=active?0:-1);
    });
    dots.forEach((dot,i)=>dot.setAttribute('aria-current',String(i===current)));
    if(counter)counter.textContent=`${current+1}/${slides.length}`;
  };
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const start=()=>{
    clearInterval(homeHeroTimer);
    if(reduced)return;
    homeHeroTimer=setInterval(()=>{
      if(!root.isConnected){clearInterval(homeHeroTimer);return}
      if(!paused&&!document.hidden)show(current+1);
    },6500);
  };
  dots.forEach((dot,i)=>dot.addEventListener('click',()=>{show(i);start()}));
  $('[data-home-prev]',root)?.addEventListener('click',()=>{show(current-1);start()});
  $('[data-home-next]',root)?.addEventListener('click',()=>{show(current+1);start()});
  root.addEventListener('mouseenter',()=>{paused=true});
  root.addEventListener('mouseleave',()=>{paused=false});
  root.addEventListener('focusin',()=>{paused=true});
  root.addEventListener('focusout',e=>{if(!root.contains(e.relatedTarget))paused=false});
  show(0);start();
}
async function loadDailyHomeTrends(renderId){
  try{
    const response=await fetch('/api/trending',{headers:{Accept:'application/json'}});
    if(!response.ok)return;
    const data=await response.json();
    const items=(data.items||[]).filter(t=>t&&t.title&&t.href).slice(0,3);
    if(items.length<3||renderId!==homeRenderId)return;
    const current=$('[data-home-carousel]',main);
    if(!current)return;
    const holder=document.createElement('div');
    holder.innerHTML=homeFeatureMarkup(items);
    const replacement=holder.firstElementChild;
    current.replaceWith(replacement);
    initHomeCarousel(replacement);
    hydrateHomeHero(replacement);
  }catch{}
}
function renderHome(){
  setTitle('');
  const trend=D.trendingNow;
  const slides=trend.slice(0,3),top=trend.filter(t=>!slides.includes(t)).slice(0,3);
  const renderId=++homeRenderId;
  const featured=[
    [catalogBySlug.get('twilight-princess'),'Nintendo · usado'],
    [catalogBySlug.get('ragnarok'),'PlayStation · usado'],
    [catalogBySlug.get('sonic-mania-plus'),'Multiplataforma'],
    [catalogBySlug.get('resident-evil-4-remake')||catalogBySlug.get('resident-evil-4'),'PlayStation · novo']
  ].filter(([p])=>p);
  main.innerHTML=`
  ${homeFeatureMarkup(slides)}
  ${top.length?`<div class="home-trending-cards" aria-label="Outros destaques">${top.map(t=>`<article class="home-trend-card"><div class="home-trend-cover igdb-cover-slot" data-igdb-cover data-igdb-title="${esc(t.title)}">${coverTile(t.short,{note:false})}</div><div><h2><a href="#/tema/${t.slug}">${esc(t.short)}</a></h2><p>${esc(t.copy)}</p></div><a class="round-arrow" href="#/tema/${t.slug}" aria-label="Abrir ${esc(t.short)}">→</a></article>`).join('')}</div>`:''}

  <section class="lux-section" aria-labelledby="home-offers-title"><div class="lux-section-head"><div><h2 id="home-offers-title">Ofertas em jogos</h2></div>${offerRowArrowsMarkup('home-offers')}<a href="#/busca?cond=usado">Ver todas →</a></div>
    <div class="home-offer-grid" data-offer-row="home-offers">${featured.map(([p,label])=>homeOfferCard(p,label)).join('')}</div>
  </section>

  <section class="merch-home-stage" aria-labelledby="home-merch-title"><div class="merch-home-copy"><h2 id="home-merch-title">Complete o seu espaço gamer.</h2><p>Produtos licenciados, criações independentes e peças para transformar coleção em ambiente.</p><a class="btn btn-warm" href="#/merch">Explorar tudo</a></div>
    <div class="merch-home-grid">
      <a class="merch-home-card" href="#/merch?cat=colecionaveis"><span class="merch-home-icon">${ico('cube',28)}</span><div><b>Produtos oficiais</b><small>Amiibo, figures, livros e acessórios licenciados.</small></div><span>→</span></a>
      <a class="merch-home-card" href="#/merch?cat=fanmade"><span class="merch-home-icon">${ico('brush',28)}</span><div><b>Feito por fãs</b><small>Artesanato, impressão 3D e peças autorais.</small></div><span>→</span></a>
      <a class="merch-home-card" href="#/merch?cat=merch"><span class="merch-home-icon">${ico('bag',28)}</span><div><b>Decoração gamer</b><small>Quadros, luminárias, placas e suportes.</small></div><span>→</span></a>
    </div>
  </section>`;
  const carousel=$('[data-home-carousel]',main);
  initHomeCarousel(carousel);
  hydrateHomeHero(carousel);
  loadDailyHomeTrends(renderId);
  hydrateIgdbCovers(main,12);
  initOfferCarousels(main);
}

/* ---------- busca e resultados ---------- */
function filtersMarkup(F,platforms,prefix){
  const chk=(name,val,label,on)=>`<label><input type="checkbox" data-filter="${name}" data-value="${esc(val)}" ${on?'checked':''}> <span>${esc(label)}</span></label>`;
  return `
  <div class="fg"><h3>Categoria</h3>${CATS.map(([k,l])=>chk('cat',k,l,F.cats.has(k))).join('')}</div>
  <div class="fg"><h3>Gênero</h3>${GENRES.map(g=>chk('genre',g.slug,g.label,F.genres.has(g.slug))).join('')}</div>
  <div class="fg"><h3>Condição</h3>${['new','used','digital'].map(c=>chk('cond',COND_URL[c],COND_LABEL[c],F.conds.has(c))).join('')}</div>
  <div class="fg"><h3>Plataforma</h3><div class="scroll">${platforms.map(p=>chk('plat',p,p,F.plats.has(p))).join('')||'<span class="fine">Sem plataformas nesta busca.</span>'}</div>
    <label style="margin-top:6px"><input type="checkbox" data-filter="retro" data-value="1" ${F.retro?'checked':''}> <span>Só retrô</span></label></div>
  <div class="fg"><h3>Faixa de preço</h3><div class="price-inputs">
    <input type="number" inputmode="decimal" min="0" step="1" placeholder="R$ mín." aria-label="Preço mínimo" data-price="min" value="${F.min??''}">
    <input type="number" inputmode="decimal" min="0" step="1" placeholder="R$ máx." aria-label="Preço máximo" data-price="max" value="${F.max??''}"></div>
    <p class="fine" style="margin-top:6px">Considera só os preços já consultados.</p></div>`;
}
function activeChips(F){
  const chips=[];
  F.cats.forEach(c=>chips.push(['cat',c,catLabel(c)]));
  F.genres.forEach(g=>chips.push(['genre',g,genreLabel(g)]));
  F.conds.forEach(c=>chips.push(['cond',COND_URL[c],COND_LABEL[c]]));
  F.plats.forEach(p=>chips.push(['plat',p,p]));
  if(F.retro)chips.push(['retro','1','Retrô']);
  if(F.min!=null)chips.push(['min','',`a partir de ${brl(F.min)}`]);
  if(F.max!=null)chips.push(['max','',`até ${brl(F.max)}`]);
  return chips;
}
function renderSearch(params,token){
  const raw=(params.get('q')||'').trim();
  const F=readFilters(params);
  $('#searchInput').value=raw;
  const matches=matchCatalog(raw);
  const gameRows=rowsFromMatches(matches);
  const rows=[...gameRows,...merchRows(raw)].sort((a,b)=>b.score-a.score);
  const platforms=[...new Set(gameRows.map(r=>r.platform))].sort();
  const filtered=applyFilters(rows,F);
  const chips=activeChips(F);
  const n=Math.max(12,parseInt(params.get('n')||'12',10)||12);
  const visible=filtered.slice(0,n);
  const unis=[...new Set(matches.map(m=>m.p.universe))];
  const uHint=unis.length===1&&(matches.length>=3||raw&&norm(uMap.get(unis[0]).name)===norm(raw))?uMap.get(unis[0]):null;
  // Fase 6: busca de um universo só usa a cor dele (fallback: padrao,
  // já definido no :root — sem chamada extra, mesma paleta da fase 1).
  applyUniverseChrome(uHint?paletteForUniverse(uHint):null);
  setTitle(raw?`Resultados para ${raw}`:'Todos os jogos');
  const heading=raw?`Resultados para “${esc(raw)}”`:'Todos os jogos';
  let body='';
  if(!rows.length){
    const knownU=raw&&universes.find(u=>norm(u.name)===norm(raw));
    body=`<div class="empty"><h2>Ainda não catalogamos “${esc(raw)}”</h2>
      <p>${knownU?`O catálogo de <b>${esc(knownU.name)}</b> está sendo preenchido. `:''}Você já pode procurar direto nas lojas: os links abrem a busca delas.</p>
      ${knownU?`<p style="margin-top:10px"><a class="btn btn-outline btn-sm" href="#/universo/${knownU.slug}">Ver universo ${esc(knownU.name)} →</a></p>`:''}
      <div class="shortcut-groups">
        <div class="shortcut-group"><h3>Físico no Brasil</h3><div class="shortcut-links">${physicalLinks(raw)}</div></div>
        <div class="shortcut-group"><h3>Digital</h3><div class="shortcut-links">${digitalLinks(raw)}</div></div>
        <div class="shortcut-group"><h3>Merch e fan-made</h3><div class="shortcut-links">${merchLinks(raw+' merch','merch')}</div></div>
      </div></div>`;
  }else if(!filtered.length){
    body=`<div class="empty"><h2>Nenhum resultado com estes filtros</h2><p>Tire algum filtro para ver mais opções.</p><p style="margin-top:12px"><button class="btn btn-outline btn-sm" data-act="clear-filters">Limpar filtros</button></p></div>`;
  }else{
    body=`${uHint?`<a class="uni-banner-link" href="#/universo/${uHint.slug}"><span><b>Universo ${esc(uHint.name)}</b><br><span class="fine">${titlesOf(uHint.slug).length} jogos, além de merch e fan-made</span></span><span class="link-cta">Ver universo →</span></a>`:''}
      <div id="rowList">${visible.map(r=>rowMarkup(r,F)).join('')}</div>
      ${filtered.length>visible.length?`<div class="results-more"><button class="btn btn-ghost" data-act="more-rows" data-n="${n+12}">Mostrar mais resultados (${filtered.length-visible.length})</button></div>`:''}`;
  }
  main.innerHTML=`
  <div class="results-head"><div><h1 class="page-h">${heading}</h1><p class="fine" style="margin-top:4px">${filtered.length} ${filtered.length===1?'resultado':'resultados'} · preços sem frete; frete e taxas podem variar</p></div>
    <button class="btn btn-ghost filter-btn" data-act="open-filters">${ico('filter',16)} Filtrar${chips.length?` (${chips.length})`:''}</button></div>
  ${chips.length?`<div class="chips-active">${chips.map(c=>`<button class="chip-x" data-act="rm-filter" data-k="${c[0]}" data-v="${esc(c[1])}" aria-label="Remover filtro ${esc(c[2])}">${esc(c[2])} ${ico('close',14)}</button>`).join('')}</div>`:''}
  <div class="results">
    <aside class="filters" aria-label="Filtros"><h2>Filtros</h2>${filtersMarkup(F,platforms,'s')}</aside>
    <div>${body}</div>
  </div>`;
  const list=$('#rowList');
  if(list)autoloadPrices(visible,token,F);
  main._filtersHtml=filtersMarkup(F,platforms,'m');
  main._filterCount=chips.length;
  main._filterTotal=filtered.length;
  hydrateIgdbCovers(main,12);
}


/* ---------- imagens automáticas IGDB ---------- */
const igdbVisualMemo=new Map();
async function fetchIgdbVisual(title,platform='',year='',heroRatio=''){
  const key=[title,platform,year,heroRatio].join('|');
  if(igdbVisualMemo.has(key))return igdbVisualMemo.get(key);

  const p=(async()=>{
    try{
      const qs=new URLSearchParams({q:title});
      if(platform)qs.set('platform',platform);
      if(year)qs.set('year',year);
      if(heroRatio)qs.set('ratio',heroRatio);
      const r=await fetch('/api/igdb/game?'+qs.toString(),{headers:{Accept:'application/json'}});
      if(!r.ok)return null;
      const d=await r.json();
      return d&&d.ok&&d.found?d:null;
    }catch{return null}
  })();

  igdbVisualMemo.set(key,p);
  return p;
}
function setHeroBackground(el,url){
  if(!el||!url)return;
  el.classList.add('has-image');
  el.style.setProperty('--hero-img',`url("${url.replace(/"/g,'%22')}")`);
  const ph=el.querySelector('.game-hero-placeholder');
  if(ph)ph.remove();
}
function setCoverImage(el,title,platform,url){
  if(!el||!url)return;
  el.innerHTML=coverTile(title,{platform,image:url});
}
async function hydrateIgdbVisuals({title,platform='',year='',heroSelector='.game-hero-art',coverSelector=''}) {
  const d=await fetchIgdbVisual(title,platform,year);
  if(!d)return;
  const hero=document.querySelector(heroSelector);
  if(hero&&d.hero?.url)setHeroBackground(hero,d.hero.url);
  if(coverSelector&&d.cover?.url){
    const cover=document.querySelector(coverSelector);
    setCoverImage(cover,title,platform,d.cover.url);
  }
}

async function hydrateIgdbCovers(root=document,limit=12){
  const nodes=Array.from(root.querySelectorAll('[data-igdb-cover]'))
    .filter(el=>!el.dataset.igdbState)
    .slice(0,limit);

  await mapLimit(nodes,3,async el=>{
    el.dataset.igdbState='loading';
    const title=el.dataset.igdbTitle||'';
    const platform=el.dataset.igdbPlatform||'';
    const year=el.dataset.igdbYear||'';
    const d=await fetchIgdbVisual(title,platform,year);

    if(!el.isConnected)return;
    if(d?.cover?.url){
      el.innerHTML=coverTile(title,{image:d.cover.url});
      el.dataset.igdbState='done';
    }else{
      el.dataset.igdbState='empty';
    }
  });
}

function representativeFranchiseGame(titles){
  return [...titles]
    .filter(Boolean)
    .sort((a,b)=>(Number(b.year)||0)-(Number(a.year)||0))[0]||null;
}
async function hydrateFranchiseHero(u,titles){
  const rep=representativeFranchiseGame(titles);
  if(rep){
    const platform=rep.variants?.[0]?.[1]||'';
    return hydrateIgdbVisuals({
      title:rep.title,
      platform,
      year:rep.year||'',
      heroSelector:'.game-hero-art'
    });
  }
  return hydrateIgdbVisuals({
    title:u.name,
    heroSelector:'.game-hero-art'
  });
}

/* ---------- página do item: hero + módulo unificado de compra ---------- */
function visualAsset(scope,key,field){
  return D.visualAssets?.[scope]?.[key]?.[field] || '';
}
function localOrRemoteImage(u){
  const s=String(u||'').trim();
  return (/^https?:\/\//i.test(s)||s.startsWith('/'))?s:'';
}
function demoPrice(title,kind){
  const seed=hashStr(`${title}|${kind}|layout-demo`);
  const ranges={
    used:[79,220],
    new:[189,360],
    digital:[129,300],
    special:[399,900]
  };
  const [min,max]=ranges[kind]||[99,299];
  const value=min+(seed%(max-min+1));
  return brl(Math.floor(value)+0.90);
}
function heroVisual(title,{image='',label='KEY ART / WALLPAPER'}={}){
  const src=localOrRemoteImage(image);
  const h=hashStr(title)%360;
  const style=src
    ?`--hero-img:url("${esc(src)}");--hero-h:${h}`
    :`--hero-img:none;--hero-h:${h}`;
  return `<div class="game-hero-art ${src?'has-image':''}" style='${style}'>
    ${src?'':`<div class="game-hero-placeholder"><b>${esc(initialsOf(title))}</b><span>${esc(label)}</span></div>`}
  </div>`;
}
function gameHeroMarkup({title,kicker='',copy='',image='',artLabel='KEY ART / WALLPAPER',actions=''}) {
  return `<section class="game-hero">
    <div class="game-hero-copy">
      ${kicker?`<span class="game-hero-kicker">${esc(kicker)}</span>`:''}
      <h1>${esc(title)}</h1>
      ${copy?`<p>${esc(copy)}</p>`:''}
      ${actions?`<div class="game-hero-actions">${actions}</div>`:''}
    </div>
    ${heroVisual(title,{image,label:artLabel})}
  </section>`;
}
function storePills(names){
  return `<div class="store-pills">${names.filter(Boolean).map(n=>`<span class="store-pill">${esc(n)}</span>`).join('')}</div>`;
}
function purchasePriceMarkup(cond,p,platform){
  const s=summaryOf(cond,p.title,platform);
  if(s&&s.status==='ok'&&s.count){
    return `<span class="purchase-from">a partir de</span><strong>${esc(s.minDisplay)}</strong>${s.mock?mockChip():''}`;
  }
  return `<span class="purchase-from">preço de exemplo</span><strong>${esc(demoPrice(p.title,cond))}</strong>${mockChip()}`;
}
function offerPageHref(p,platform,cond){
  return `#/ofertas/${p.slug}?plat=${enc(platform)}&cond=${enc(cond)}`;
}
function physicalMediaMarkup(p,platform){
  const rows=[];
  if(p.new!==false){
    rows.push(`<a class="purchase-price-row" href="${offerPageHref(p,platform,'new')}"><span class="purchase-condition">Novo</span><span class="purchase-value">${purchasePriceMarkup('new',p,platform)}</span><span class="purchase-row-arrow">→</span></a>`);
  }
  if(p.used!==false){
    rows.push(`<a class="purchase-price-row" href="${offerPageHref(p,platform,'used')}"><span class="purchase-condition">Usado</span><span class="purchase-value">${purchasePriceMarkup('used',p,platform)}</span><span class="purchase-row-arrow">→</span></a>`);
  }
  return `<section class="purchase-media-group">
    <div class="purchase-media-head"><div><span class="purchase-media-kicker">MÍDIA</span><h3>Físico</h3></div><span class="purchase-arrow">→</span></div>
    <div class="purchase-price-list">${rows.join('')}</div>
  </section>`;
}
function digitalMediaMarkup(p,platform){
  return `<section class="purchase-media-group">
    <div class="purchase-media-head"><div><span class="purchase-media-kicker">MÍDIA</span><h3>Digital</h3></div><span class="purchase-arrow">→</span></div>
    <a class="purchase-price-row" href="${offerPageHref(p,platform,'digital')}"><span class="purchase-condition">Download</span><span class="purchase-value"><span class="purchase-from">consultar nas lojas</span></span><span class="purchase-row-arrow">→</span></a>
  </section>`;
}
function purchaseOptionsMarkup(p,platform){
  const physical=p.physical!==false;
  const digital=p.digital===true || hasDigital(p,platform);
  const blocks=[];
  if(physical)blocks.push(physicalMediaMarkup(p,platform));
  if(digital)blocks.push(digitalMediaMarkup(p,platform));
  if(!blocks.length){
    blocks.push(`<div class="purchase-empty">Ainda não há formato de compra catalogado para esta versão.</div>`);
  }
  return blocks.join('');
}
function visualMenuCard({title,copy,kind='collectibles',image='',href='#'}){
  const src=localOrRemoteImage(image);
  const icon=kind==='fanmade'?ico('brush',34):ico('cube',34);
  return `<article class="visual-menu-card">
    <div class="visual-menu-art ${kind} ${src?'has-image':''}" ${src?`style='--menu-img:url("${esc(src)}")'`:''}>
      ${src?'':`<span class="visual-menu-icon">${icon}</span>`}
    </div>
    <div class="visual-menu-body">
      <h2>${esc(title)}</h2>
      <p>${esc(copy)}</p>
      <a class="link-cta" href="${esc(href)}">Explorar →</a>
    </div>
  </article>`;
}
function purchaseModuleMarkup(p,platform,{coverImage=''}={}){
  const cover=coverImage||visualAsset('games',p.slug,'cover');
  return `<article class="purchase-module" id="comprar-jogo">
    <div class="purchase-cover" id="productCoverSlot">${coverTile(p.title,{platform,image:cover})}</div>
    <div class="purchase-main">
      <div class="purchase-title-row"><div><span class="purchase-kicker">COMPRAR O JOGO</span><h2>${esc(p.title)}</h2></div></div>
      <div class="plat-row" role="group" aria-label="Plataforma">${p.variants.map(v=>v[1]).filter((v,i,a)=>a.indexOf(v)===i).map(x=>`<button class="plat-btn" aria-pressed="${x===platform}" data-act="pick-platform" data-slug="${p.slug}" data-plat="${esc(x)}">${esc(x)}</button>`).join('')}</div>
      <div class="purchase-options" id="purchaseOptions">${purchaseOptionsMarkup(p,platform)}</div>
      <p class="purchase-demo-note">Referência visual: preços e disponibilidade podem ser exemplos. Quando as fontes reais entrarem, este mesmo componente recebe os valores verdadeiros.</p>
    </div>
  </article>`;
}
function renderProduct(slug,params,token){
  const p=catalogBySlug.get(slug);
  if(!p)return renderNotFound();
  const wanted=params.get('plat');
  const platforms=p.variants.map(v=>v[1]);
  const platform=platforms.includes(wanted)?wanted:platforms[0];
  const u=uMap.get(p.universe);
  setTitle(`${p.title} (${platform})`);
  const ref=gameRef(p),cur=invGet(ref.id);
  const heroImage=visualAsset('games',p.slug,'hero');
  const merchImage=visualAsset('games',p.slug,'merch');
  const fanImage=visualAsset('games',p.slug,'fanmade');
  const heroActions=`
    ${saveButton(ref,{label:true})}
    ${u?`<a class="btn btn-ghost" href="#/universo/${u.slug}">Universo ${esc(u.name)} →</a>`:''}`;
  const heroCopy=[p.franchise,platform,p.year].filter(Boolean).join(' · ');
  main.innerHTML=`
  <nav class="crumbs" aria-label="Você está em"><a href="#/">Início</a> › <a href="#/universo/${u.slug}">${esc(u.name)}</a> › <span>${esc(p.title)}</span></nav>
  ${gameHeroMarkup({title:p.title,kicker:platform,copy:heroCopy,image:heroImage,artLabel:'KEY ART DO JOGO',actions:heroActions})}
  <div class="game-commerce-grid">
    ${purchaseModuleMarkup(p,platform)}
    ${visualMenuCard({title:'Colecionáveis e merch',copy:'Amiibo, figures, livros, guias e itens oficiais relacionados ao jogo.',kind:'collectibles',image:merchImage,href:`#/merch?cat=colecionaveis&uni=${p.universe}`})}
    ${visualMenuCard({title:'Fan-made e artesanais',copy:'Peças artesanais, decoração e criações de fãs relacionadas ao universo.',kind:'fanmade',image:fanImage,href:`#/merch?cat=fanmade&uni=${p.universe}`})}
  </div>`;
  hydrateIgdbVisuals({
    title:igdbTitleFor(p,platform),
    platform,
    year:p.year||'',
    heroSelector:'.game-hero-art',
    coverSelector:'#productCoverSlot'
  });
  ['used','new'].forEach(async cond=>{
    await fetchCond(p.title,platform,cond);
    if(token!==viewToken)return;
    const slot=$('#purchaseOptions');
    if(slot)slot.innerHTML=purchaseOptionsMarkup(p,platform);
  });
}

/* ---------- comparação de ofertas em página completa ---------- */
function digitalOfferCards(p,platform,stores){
  return stores.map(s=>`<article class="compare-offer-card digital"><div class="compare-source"><b>${esc(s.name)}</b>${retailChip(s.kind)}<span>Mídia digital</span></div><div class="compare-listing"><span class="compare-thumb-empty">${ico('gamepad',20)}</span><div><strong>${esc(p.title)} · ${esc(platform)}</strong><small>Preço e disponibilidade exibidos na loja.</small></div></div><div class="compare-price"><span>Preço</span><b>Consultar</b></div><a class="btn btn-dark" href="${esc(safeUrl(s.url))}" target="_blank" rel="noopener noreferrer">Ver no site →</a></article>`).join('');
}
function comparisonSpinnerOff(){const el=document.querySelector('.compare-spinner');if(el)el.style.display='none'}
function comparisonHref(p,platform,cond){
  return `#/ofertas/${p.slug}?plat=${enc(platform)}&cond=${enc(cond)}`;
}
function comparisonOfferCard(o){
  const img=safeUrl(o.image);
  return `<article class="compare-offer-card">
    <div class="compare-source"><b>${esc(o.source||'Loja')}</b>${o.mock?mockChip():retailChip(o.retailKind||(o.source==='Mercado Livre'?'varejo':''))}<span>${esc(o.condition||'')}${o.location?` · ${esc(o.location)}`:o.sellerName?` · ${esc(o.sellerName)}`:''}</span></div>
    <div class="compare-listing">${img!=='#'?`<img src="${esc(img)}" alt="" loading="lazy" referrerpolicy="no-referrer">`:`<span class="compare-thumb-empty">${ico('bag',20)}</span>`}<div><strong>${esc(o.title||'Oferta compatível')}</strong><small>${o.shippingIncluded?'Frete grátis informado pela fonte':'Frete e taxas podem variar'}</small></div></div>
    <div class="compare-price"><span>Preço anunciado</span><b>${esc(o.displayPrice||'Consultar')}</b>${o.originalDisplayPrice&&o.originalDisplayPrice!==o.displayPrice?`<del>${esc(o.originalDisplayPrice)}</del>`:''}</div>
    <a class="btn btn-dark" href="${esc(safeUrl(o.url))}" target="_blank" rel="noopener noreferrer">Ver no site →</a>
  </article>`;
}
async function hydrateComparisonDetails(p,platform){
  const d=await fetchIgdbVisual(igdbTitleFor(p,platform),platform,p.year||'');
  if(!d)return;
  if(d.cover?.url)setCoverImage($('#comparisonCover'),p.title,platform,d.cover.url);
  const summary=$('#comparisonSummary');
  if(summary&&d.game?.summary)summary.textContent=d.game.summary;
  const year=$('#comparisonYear');
  if(year&&d.game?.releaseYear)year.textContent=d.game.releaseYear;
  const studio=$('#comparisonStudio');
  const names=[...(d.game?.developers||[]),...(d.game?.publishers||[])].filter((v,i,a)=>a.indexOf(v)===i);
  if(studio&&names.length){studio.textContent=names.join(' · ');studio.closest('.compare-detail-row').hidden=false}
}
async function renderOfferComparison(slug,params,token){
  let p=catalogBySlug.get(slug);
  if(!p){
    const t=D.trendingNow.find(item=>item.slug===slug);
    if(t){
      const cfg=themeDemoConfig(t);
      p={title:t.title,slug:t.slug,year:null,franchise:uMap.get(t.universe)?.name||t.short,universe:t.universe||'',variants:[['Destaque',cfg.platform||'Plataforma']],physical:cfg.physical,digital:cfg.digital,digitalUrl:t.digital||''};
    }
  }
  if(!p)return renderNotFound();
  const platforms=[...new Set(p.variants.map(v=>v[1]))];
  const wanted=params.get('plat');
  const platform=platforms.includes(wanted)?wanted:platforms[0];
  const allowed=['new','used','digital'];
  const cond=allowed.includes(params.get('cond'))?params.get('cond'):'all';
  const condText=cond==='all'?'Todas as ofertas':(COND_LABEL[cond]||sentence(cond));
  const digitalAvailable=p.digital===true||hasDigital(p,platform);
  setTitle(`Ofertas de ${p.title}`);
  main.innerHTML=`<nav class="crumbs" aria-label="Você está em"><a href="#/">Início</a> › <a href="#/jogo/${p.slug}?plat=${enc(platform)}">${esc(p.title)}</a> › <span>Ofertas</span></nav>
  <div class="compare-heading"><div><h1>${esc(p.title)}</h1><p>Preços em BRL · confira condição, frete e detalhes antes de comprar.</p></div><a class="btn btn-ghost" href="#/jogo/${p.slug}?plat=${enc(platform)}">← Voltar ao jogo</a></div>
  <div class="compare-filterbar"><div><span>Plataforma</span>${platforms.map(x=>`<a href="${comparisonHref(p,x,cond)}" aria-current="${x===platform}">${esc(x)}</a>`).join('')}</div><div><span>Formato</span><a href="${comparisonHref(p,platform,'all')}" aria-current="${cond==='all'}">Todos</a><a href="${comparisonHref(p,platform,'new')}" aria-current="${cond==='new'}">Novo</a><a href="${comparisonHref(p,platform,'used')}" aria-current="${cond==='used'}">Usado</a>${digitalAvailable?`<a href="${comparisonHref(p,platform,'digital')}" aria-current="${cond==='digital'}">Digital</a>`:''}</div></div>
  <div class="compare-layout">
    <section class="compare-results" aria-labelledby="compare-results-title"><div class="compare-results-head"><div><h2 id="compare-results-title">${esc(condText)} · ${esc(platform)}</h2><p id="compareStatus">Verificando preços e disponibilidade…</p></div><span class="compare-spinner" aria-hidden="true"></span></div><div id="comparisonOffers" class="compare-offers"><div class="compare-loading"><span></span><span></span><span></span></div></div></section>
    <aside class="compare-game-card"><span class="eyebrow">DETALHES DO JOGO</span><div id="comparisonCover" class="compare-cover">${coverTile(p.title,{platform})}</div><h2>${esc(p.title)}</h2><dl><div><dt>Lançamento</dt><dd id="comparisonYear">${esc(p.year||'—')}</dd></div><div><dt>Plataforma</dt><dd>${esc(platform)}</dd></div><div><dt>Condição buscada</dt><dd>${esc(condText)}</dd></div><div class="compare-detail-row" hidden><dt>Estúdio / publicadora</dt><dd id="comparisonStudio"></dd></div></dl><p id="comparisonSummary" class="compare-summary">A sinopse será carregada com os dados do catálogo IGDB.</p>${p.universe?`<a href="#/universo/${p.universe}">Ver universo ${esc(p.franchise)} →</a>`:''}</aside>
  </div>`;
  hydrateComparisonDetails(p,platform);
  const offers=$('#comparisonOffers'),status=$('#compareStatus');
  if(cond==='all'){
    const stores=digitalAvailable?digitalStores(p,platform):[];
    if(digitalAvailable&&!stores.length&&p.digitalUrl)stores.push({name:'Loja oficial',url:p.digitalUrl});
    const loading='<div class="compare-loading"><span></span><span></span><span></span></div>';
    offers.innerHTML=`<section class="compare-block"><h3>Novo</h3><div class="compare-offers" id="cmp-new">${loading}</div></section>
      <section class="compare-block"><h3>Usado</h3><div class="compare-offers" id="cmp-used">${loading}</div></section>
      ${stores.length?`<section class="compare-block"><h3>Digital</h3><div class="compare-offers">${digitalOfferCards(p,platform,stores)}</div></section>`:''}`;
    const [resNew,resUsed]=await Promise.all([fetchCond(p.title,platform,'new'),fetchCond(p.title,platform,'used')]);
    if(token!==viewToken)return;
    const fill=(id,res)=>{
      const list=res.offers||[];
      const box=document.getElementById(id);
      if(box)box.innerHTML=list.length?list.map(comparisonOfferCard).join(''):`<div class="empty compact"><p>Sem oferta validada agora. Procure direto: <span class="shortcut-links">${physicalLinks(p.title+' '+platform)}</span></p></div>`;
      return list.length;
    };
    const total=fill('cmp-new',resNew)+fill('cmp-used',resUsed);
    const demo=resNew.mock||resUsed.mock;
    status.textContent=`${total?`${total} ${total===1?'oferta':'ofertas'} de preço`:'Nenhuma oferta de preço agora'}${stores.length?` · ${stores.length} ${stores.length===1?'loja digital':'lojas digitais'}`:''}${demo?' · demonstração':''}`;
    comparisonSpinnerOff();
    return;
  }
  if(cond==='digital'){
    const stores=digitalStores(p,platform);
    if(!stores.length&&p.digitalUrl)stores.push({name:'Loja oficial',url:p.digitalUrl});
    if(token!==viewToken)return;
    status.textContent=stores.length?`${stores.length} ${stores.length===1?'loja':'lojas'} · preço e disponibilidade na própria loja`:'Consulte as lojas';
    comparisonSpinnerOff();
    offers.innerHTML=stores.length?stores.map(s=>`<article class="compare-offer-card digital"><div class="compare-source"><b>${esc(s.name)}</b>${retailChip(s.kind)}<span>Mídia digital</span></div><div class="compare-listing"><span class="compare-thumb-empty">${ico('gamepad',20)}</span><div><strong>${esc(p.title)} · ${esc(platform)}</strong><small>Preço e disponibilidade exibidos na loja.</small></div></div><div class="compare-price"><span>Preço</span><b>Consultar</b></div><a class="btn btn-dark" href="${esc(safeUrl(s.url))}" target="_blank" rel="noopener noreferrer">Ver no site →</a></article>`).join(''):`<div class="empty"><p>Nenhuma loja digital oficial catalogada para esta versão.</p></div>`;
    return;
  }
  const res=await fetchCond(p.title,platform,cond);
  if(token!==viewToken)return;
  const list=res.offers||[];
  comparisonSpinnerOff();
  status.textContent=list.length?`${list.length} ${list.length===1?'oferta encontrada':'ofertas encontradas'}${res.mock?' · demonstração':''}`:'Nenhuma oferta compatível encontrada agora';
  offers.innerHTML=list.length?list.map(comparisonOfferCard).join(''):`<div class="empty"><h2>Sem ofertas nacionais validadas agora</h2><p>O Inventário não inventa preço ou disponibilidade. Use os atalhos abaixo para continuar a busca diretamente nas lojas.</p><div class="shortcut-links" style="margin-top:14px">${physicalLinks(p.title+' '+platform)}</div></div>`;
}

/* ---------- universo ---------- */
function marketShortcuts(name){
  return `<div class="shortcut-groups">
    <div class="shortcut-group"><h3>Físico no Brasil</h3><div class="shortcut-links">${physicalLinks(name)}</div></div>
    <div class="shortcut-group"><h3>Digital</h3><div class="shortcut-links">${digitalLinks(name)}</div></div>
    <div class="shortcut-group"><h3>Colecionáveis e merch</h3><div class="shortcut-links">${merchLinks(name+' colecionável','colecionaveis')}</div></div>
    <div class="shortcut-group"><h3>Fan-made e artesanais</h3><div class="shortcut-links">${merchLinks(name+' artesanal','fanmade')}</div></div>
  </div>`;
}
function newestUniverseGames(titles,count=4){
  return [...titles].filter(Boolean).sort((a,b)=>(Number(b.year)||0)-(Number(a.year)||0)||a.title.localeCompare(b.title)).slice(0,count);
}
// Menor preço real do jogo, em qualquer condição (Novo/Usado/Digital) — lê
// do mesmo cache de summaryOf() que os cards de oferta já preenchem (nunca
// dispara fetch aqui). Diferente de universeOfferConditions(): aqui um
// preço de demonstração pode aparecer, só que com o selo EXEMPLO — o botão
// do hero não pode virar "Ver detalhes" só porque a API ainda não respondeu.
function universeHeroBestOffer(p,platform){
  let best=null;
  for(const cond of ['new','used','digital']){
    if((cond==='used'&&p.used===false)||(cond==='new'&&p.new===false))continue;
    const s=summaryOf(cond,p.title,platform);
    if(!s||s.status!=='ok'||!s.count||s.min==null)continue;
    if(!best||s.min<best.summary.min)best={cond,summary:s};
  }
  return best;
}
function universeHeroCtaMarkup(p,platform){
  const best=universeHeroBestOffer(p,platform);
  if(!best)return `<a class="btn btn-primary" href="#/jogo/${p.slug}?plat=${enc(platform)}">Ver detalhes</a>`;
  return `<a class="btn btn-primary" href="${comparisonHref(p,platform,best.cond)}">${esc(COND_LABEL[best.cond])} a partir de ${esc(best.summary.minDisplay)}${best.summary.mock?' '+mockChip():''} →</a>`;
}
function universeHeroMarkup(u,titles){
  const latest=newestUniverseGames(titles,4);
  const slides=latest.length?latest:[null];
  return `<section class="universe-feature-row">
    <div class="game-hero universe-hero" data-home-carousel>
      <div class="universe-hero-slides">${slides.map((p,i)=>{
        const platform=p?.variants?.[0]?.[1]||'',badge=p&&releaseBadge(p);
        return `<article class="home-feature-slide ${i===0?'is-active':''}" data-home-slide aria-hidden="${i!==0}">
          <div class="universe-hero-art" ${p?`data-igdb-hero-art data-igdb-eager="${i===0}" data-igdb-title="${esc(igdbTitleFor(p,platform))}" data-igdb-platform="${esc(platform)}" data-igdb-year="${esc(p.year||'')}"`:''}>
            <span class="game-hero-placeholder"><b>${esc(initialsOf(p?p.title:u.name))}</b></span>
          </div>
          <div class="universe-hero-legibility" aria-hidden="true"></div>
          <div class="game-hero-copy">
            ${badge?`<span class="game-hero-kicker">${esc(badge)}</span>`:''}
            <h1>${esc(p?p.title:'Universo '+u.name)}</h1>
            <p>${p?`${esc(platform)}${p.year?` · ${esc(p.year)}`:''}`:(titles.length?`${titles.length} jogos catalogados.`:'Catálogo em preenchimento.')}</p>
            ${p?`<div class="game-hero-actions">${universeHeroCtaMarkup(p,platform)}</div>`:''}
          </div>
        </article>`;
      }).join('')}</div>
      ${slides.length>1?`<div class="home-feature-controls" role="group" aria-label="Artes em destaque">${slides.map((_,i)=>`<button type="button" data-home-dot="${i}" aria-current="${i===0}" aria-label="Mostrar destaque ${i+1}"></button>`).join('')}</div>
      <span class="universe-hero-count" data-home-counter aria-hidden="true">1/${slides.length}</span>
      <button type="button" class="home-feature-nav prev" data-home-prev aria-label="Destaque anterior">‹</button>
      <button type="button" class="home-feature-nav next" data-home-next aria-label="Próximo destaque">›</button>`:''}
    </div>
  </section>`;
}
// Alvo 16:9 só como critério de desempate no fallback do pickHero() — a
// arte agora cobre o hero inteiro (object-fit:cover), não é mais uma caixa
// própria. Artworks primeiro, depois screenshots (pickHero() no back-end
// já filtra paisagem w/h>=1.6 e largura>=1280, pega a maior); nunca a
// capa — sem nenhuma imagem que bata o critério, fica no fallback
// (degradê da franquia + sigla) já presente no HTML.
const UNIVERSE_HERO_RATIO=(16/9).toFixed(3);
function hydrateUniverseHero(root,token){
  const arts=$$('[data-igdb-hero-art]',root);
  mapLimit(arts,2,async el=>{
    const eager=el.dataset.igdbEager==='true';
    const d=await fetchIgdbVisual(el.dataset.igdbTitle||'',el.dataset.igdbPlatform||'',el.dataset.igdbYear||'',UNIVERSE_HERO_RATIO);
    if(token!==viewToken||!el.isConnected)return;
    const src=d?.hero?.url;
    if(!src)return;
    el.classList.add('has-image');
    el.innerHTML=`<img class="uh-art-img" src="${esc(src)}" alt="" loading="${eager?'eager':'lazy'}" fetchpriority="${eager?'high':'low'}">`;
    if(eager)updateAmbientBg(src);
  });
  initHomeCarousel(root);
}
function dailyUniverseSelection(titles,slug,count=5){
  const day=new Date().toISOString().slice(0,10);
  return [...titles].sort((a,b)=>hashStr(`${day}|${slug}|${a.slug}`)-hashStr(`${day}|${slug}|${b.slug}`)).slice(0,count);
}
// Preços por condição (Novo/Usado/Digital) pro card de oferta do universo —
// só entra condição com oferta real validada (mesmo filtro de sempre: sem
// mock, status ok, com contagem e preço mínimo). Digital hoje nunca tem
// preço real (só lojas/links), então o chip simplesmente não aparece — a
// função já lida com isso sem precisar de caso especial.
// Físico (Novo/Usado) e Digital nunca dividem o mesmo "a partir de" — o
// card mostra no máximo 2 chips: o físico mais barato (com a condição
// escrita) e, se existir, o Digital à parte. Digital nunca entra no
// cálculo do menor preço físico.
function universeOfferPhysicalBest(p,platform){
  let best=null;
  for(const cond of ['new','used']){
    if((cond==='used'&&p.used===false)||(cond==='new'&&p.new===false))continue;
    const s=summaryOf(cond,p.title,platform);
    if(!s||s.mock||s.status!=='ok'||!s.count||s.min==null)continue;
    if(!best||s.min<best.summary.min)best={cond,summary:s};
  }
  return best;
}
function universeOfferDigital(p,platform){
  const s=summaryOf('digital',p.title,platform);
  if(!s||s.mock||s.status!=='ok'||!s.count||s.min==null)return null;
  return s;
}
function universeOfferPriceChipsMarkup(p,platform){
  const best=universeOfferPhysicalBest(p,platform);
  const digital=universeOfferDigital(p,platform);
  if(!best&&!digital)return `<a class="uoc-chip uoc-chip-wait" href="#/jogo/${p.slug}?plat=${enc(platform)}">Ver detalhes</a>`;
  const chips=[];
  if(best)chips.push(`<a class="uoc-chip" href="${comparisonHref(p,platform,best.cond)}">${esc(COND_LABEL[best.cond])} ${esc(best.summary.minDisplay)}</a>`);
  if(digital)chips.push(`<a class="uoc-chip uoc-chip-digital" href="${comparisonHref(p,platform,'digital')}">Digital ${esc(digital.minDisplay)}</a>`);
  return chips.join('');
}
/* ---------- carrossel de ofertas (ajustes fase 1, item B) ----------
   Componente reutilizável: fileira única (o CSS cuida do flex/scroll-snap),
   setas que rolam 4 cards por clique, escondidas com 4 ou menos cards. Um
   único id por fileira (ex. "home-offers", "uni-offers") liga o par de
   setas ao container via data-offer-row/data-offer-arrows. */
function offerRowArrowsMarkup(id){
  return `<div class="offer-row-arrows" data-offer-arrows="${id}" hidden>
    <button type="button" class="offer-arrow prev" data-offer-prev="${id}" aria-label="Itens anteriores">‹</button>
    <button type="button" class="offer-arrow next" data-offer-next="${id}" aria-label="Próximos itens">›</button>
  </div>`;
}
function initOfferCarousels(root){
  $$('[data-offer-row]',root).forEach(track=>{
    const id=track.dataset.offerRow;
    const arrows=root.querySelector(`[data-offer-arrows="${id}"]`);
    if(!arrows)return;
    const count=track.children.length;
    if(count<=4){arrows.hidden=true;return}
    arrows.hidden=false;
    const prev=arrows.querySelector('[data-offer-prev]'),next=arrows.querySelector('[data-offer-next]');
    const step=()=>(track.children[0]?.getBoundingClientRect().width||300)+16;
    const update=()=>{
      const max=track.scrollWidth-track.clientWidth;
      prev.style.opacity=track.scrollLeft<=4?'.4':'1';
      next.style.opacity=track.scrollLeft>=max-4?'.4':'1';
    };
    prev.addEventListener('click',()=>track.scrollBy({left:-step()*4,behavior:'smooth'}));
    next.addEventListener('click',()=>track.scrollBy({left:step()*4,behavior:'smooth'}));
    track.addEventListener('scroll',update,{passive:true});
    track.setAttribute('tabindex','0');
    track.addEventListener('keydown',e=>{
      if(e.key==='ArrowRight'){track.scrollBy({left:step(),behavior:'smooth'});e.preventDefault()}
      else if(e.key==='ArrowLeft'){track.scrollBy({left:-step(),behavior:'smooth'});e.preventDefault()}
    });
    update();
  });
}
function universeOfferCard(p){
  const platform=p.variants?.[0]?.[1]||'';
  const best=universeOfferPhysicalBest(p,platform);
  const digital=universeOfferDigital(p,platform);
  // Card inteiro abre na aba do chip principal (o físico mais barato, ou
  // o digital se só ele existir; sem nenhuma oferta, vai pra ficha do jogo).
  const mainHref=best?comparisonHref(p,platform,best.cond):digital?comparisonHref(p,platform,'digital'):`#/jogo/${p.slug}?plat=${enc(platform)}`;
  return `<article class="universe-offer-card">
    <a class="uoc-cover igdb-cover-slot" href="${mainHref}" data-igdb-cover data-igdb-title="${esc(igdbTitleFor(p,platform))}" data-igdb-platform="${esc(platform)}" data-igdb-year="${esc(p.year||'')}" aria-label="Ver ofertas de ${esc(p.title)}">${coverTile(p.title,{note:false})}</a>
    ${saveButton(gameRef(p))}
    <div class="uoc-overlay">
      <h3 class="uoc-title">${esc(p.title)}</h3>
      <div class="uoc-chips" data-universe-offer-price="${esc(p.slug)}">${universeOfferPriceChipsMarkup(p,platform)}</div>
    </div>
  </article>`;
}
async function hydrateUniverseOffers(games,token){
  await mapLimit(games,2,async p=>{
    const platform=p.variants?.[0]?.[1]||'';
    const conds=['used','new'].filter(cond=>!((cond==='used'&&p.used===false)||(cond==='new'&&p.new===false)));
    await Promise.all(conds.map(cond=>fetchCond(p.title,platform,cond)));
    if(token!==viewToken)return;
    const slot=main.querySelector(`[data-universe-offer-price="${p.slug}"]`);
    if(!slot)return;
    slot.innerHTML=universeOfferPriceChipsMarkup(p,platform);
  });
}
function universeDiscoveryCards(u){
  return `<div class="universe-discovery-grid">
    <a class="discovery-card official" href="#/merch?cat=colecionaveis&uni=${u.slug}"><span class="discovery-art">${ico('cube',34)}</span><span><small>ORIGEM</small><b>Produtos oficiais</b><em>Amiibo, figures, livros e acessórios relacionados a ${esc(u.name)}.</em></span><strong>Explorar →</strong></a>
    <a class="discovery-card fanmade" href="#/merch?cat=fanmade&uni=${u.slug}"><span class="discovery-art">${ico('brush',34)}</span><span><small>ORIGEM</small><b>Feito por fãs</b><em>Artesanato, impressão 3D e peças autorais do universo.</em></span><strong>Explorar →</strong></a>
    <a class="discovery-card decor" href="#/merch?cat=merch&uni=${u.slug}"><span class="discovery-art">${ico('bag',34)}</span><span><small>CATEGORIA</small><b>Decoração gamer</b><em>Quadros, luminárias, placas e itens para ambientes.</em></span><strong>Explorar →</strong></a>
  </div>`;
}
// Painel opaco (superfície tonal, nunca vidro) com a lista completa de jogos
// da franquia, rolagem própria, e o toggle rápido de "Tenho" — fica ao lado
// do hero na aba "tudo" da página de universo.
function universeInventoryPanel(u,titles){
  const owned=invList().filter(i=>i.universe===u.slug&&i.status==='owned').length;
  const style='';
  const rows=[...titles].sort((a,b)=>(Number(b.year)||0)-(Number(a.year)||0)||a.title.localeCompare(b.title)).map(p=>{
    const on=invGet('game:'+p.slug)?.status==='owned',platform=p.variants?.[0]?.[1]||'';
    return `<li class="uinv-row ${on?'is-owned':''}">
      <a class="uinv-link" href="#/jogo/${p.slug}">
        <span class="uinv-cover igdb-cover-slot" data-igdb-cover data-igdb-title="${esc(igdbTitleFor(p,platform))}" data-igdb-platform="${esc(platform)}" data-igdb-year="${esc(p.year||'')}">${coverTile(p.title,{note:false})}</span>
        <span class="uinv-info"><span class="uinv-title">${esc(p.title)}</span><span class="uinv-meta">${esc(platform)}${p.year?` · ${esc(p.year)}`:''}</span></span>
      </a>
      <button type="button" class="uinv-check ${on?'is-on':''}" data-act="toggle-owned" data-id="game:${esc(p.slug)}" aria-pressed="${on}" aria-label="${on?'Marcado como Tenho':'Marcar como Tenho'}: ${esc(p.title)}">${ico('check',15)}</button>
    </li>`;
  }).join('');
  return `<aside class="universe-inventory-panel"${style} aria-labelledby="universe-games-title">
    <div class="uinv-head">
      <span class="eyebrow">SUA COLEÇÃO</span>
      <h2 id="universe-games-title">Meu Inventário</h2>
      <p><span data-uinv-count>${owned}</span> de ${titles.length} jogos marcados como Tenho</p>
    </div>
    <ul class="uinv-list">${rows}</ul>
  </aside>`;
}
function renderUniverse(slug,params,token){
  const u=uMap.get(slug);
  if(!u)return renderNotFound();
  const tab=params.get('tab')||'tudo';
  const titles=titlesOf(slug);
  const tabs=[['tudo','Tudo'],['games','Games'],['digital','Digital'],['colecionaveis','Colecionáveis'],['merch','Merch'],['fanmade','Fan-made']];
  const items=cat=>mockMerch()?M.items.filter(i=>i.universe===slug&&(!cat||i.cat===cat||(cat==='merch'&&(i.cat==='merch'||i.cat==='acessorios')))):[];
  setTitle(`Universo ${u.name}`);
  const mine=invList().filter(i=>i.universe===slug);
  const owned=mine.filter(i=>i.status==='owned').length,want=mine.filter(i=>i.status==='wanted'||i.status==='saved').length;
  const emptyCatalog=`<div class="empty"><h2>O catálogo de ${esc(u.name)} ainda está sendo preenchido</h2><p>Enquanto isso, os atalhos abaixo levam à busca nas lojas.</p></div>`;
  let body='',featuredGames=[];
  if(tab==='games'){
    body=titles.length?`<div class="cards4">${titles.map(p=>gameCard(p)).join('')}</div>`:emptyCatalog+marketShortcuts(u.name);
  }else if(tab==='digital'){
    const dt=titles.filter(p=>p.variants.some(v=>hasDigital(p,v[1])));
    body=(dt.length?`<div class="cards4">${dt.map(p=>gameCard(p,{ctx:p.variants.filter(v=>hasDigital(p,v[1])).map(v=>v[1]).join(' · ')+' · digital'})).join('')}</div>`:'<div class="empty"><p>Nenhum título digital catalogado neste universo ainda.</p></div>')
      +`<div class="section-gap"><h2 class="page-h" style="font-size:19px">Lojas oficiais</h2><p class="lede">Os preços digitais aparecem direto nas lojas.</p><div class="shortcut-links" style="margin-top:12px">${digitalLinks(u.name)}</div></div>`;
  }else if(tab==='colecionaveis'||tab==='merch'||tab==='fanmade'){
    const list=items(tab);
    const c=D.merchCategories.find(x=>x.key===tab);
    body=(list.length?originLegend()+`<div class="cards4">${list.map(merchCard).join('')}</div>`:'<div class="empty"><p>Ainda não temos itens desta categoria para este universo.</p></div>')
      +`<div class="section-gap"><h2 class="page-h" style="font-size:19px">Buscar nas lojas</h2><p class="lede">${esc(c?c.hint:'')}. Sem integração ainda: os links abrem a busca de cada loja.</p><div class="shortcut-links" style="margin-top:12px">${merchLinks(u.name+' '+(tab==='fanmade'?'artesanal':tab==='colecionaveis'?'colecionável':'decoração'),tab)}</div></div>`;
  }else{
    featuredGames=dailyUniverseSelection(titles,slug,12);
    body=(titles.length?`<section class="universe-game-shelf" aria-labelledby="universe-offers-title"><div class="lux-section-head"><div><h2 id="universe-offers-title">Encontre o próximo da coleção</h2></div>${offerRowArrowsMarkup('uni-offers')}</div><div class="universe-offer-grid" data-offer-row="uni-offers">${featuredGames.map(universeOfferCard).join('')}</div></section>`:emptyCatalog)
    +`<section class="lux-section universe-related" aria-labelledby="universe-related-title"><div class="lux-section-head"><div><h2 id="universe-related-title">Colecionáveis, merch e fan-made</h2></div><a href="#/merch?uni=${u.slug}">Ver todas as ofertas →</a></div>${universeDiscoveryCards(u)}</section>`;
  }
  // Cores do universo (fundo/painel/ação) vêm dos tokens globais que
  // applyUniverseChrome() já definiu no :root pra rota universe-hero — não
  // precisa de style inline aqui, evita duas fontes de cor coexistindo.
  main.innerHTML=`
  <nav class="crumbs" aria-label="Você está em"><a href="#/">Início</a> › <a href="#/games">Games</a> › <span>${esc(u.name)}</span></nav>
  ${tab==='tudo'?`<div class="universe-layout">${universeHeroMarkup(u,titles)}${titles.length?universeInventoryPanel(u,titles):''}</div>`:gameHeroMarkup({
    title:`Universo ${u.name}`,
    kicker:ECO_LABEL[u.eco]||'',
    copy:`${titles.length?`${titles.length} jogos catalogados.`:'Catálogo em preenchimento.'}${(owned||want)?` Você marcou ${owned} como Tenho e ${want} como Quero.`:''}`,
    image:visualAsset('universes',u.slug,'hero'),
    artLabel:'ARTE DA FRANQUIA'
  })}
  ${tab==='tudo'?'':`<div class="tabs universe-tabs" role="tablist">${tabs.map(([k,l])=>`<a class="tab" role="tab" href="#/universo/${slug}?tab=${k}" aria-current="${k===tab}">${l}</a>`).join('')}</div>`}
  ${body}`;
  if(tab==='tudo'&&titles.length)hydrateUniverseHero($('[data-home-carousel]',main),token);
  if(tab!=='tudo')hydrateFranchiseHero(u,titles);
  // Na aba "tudo", a lista inteira do Meu Inventário também tem
  // data-igdb-cover (mesmo rolando por dentro) — sem folga aqui, uma
  // franquia com mais de 12 jogos comia o limite todo e os cards de
  // oferta (que vêm depois no DOM) nunca chegavam a ser hidratados.
  hydrateIgdbCovers(main,tab==='tudo'?titles.length+featuredGames.length+4:12);
  if(tab==='tudo'&&featuredGames.length)hydrateUniverseOffers(featuredGames,token);
  initOfferCarousels(main);
}

/* ---------- tema em alta ---------- */
function themeDemoConfig(t){
  const presets={
    'gta-vi':{physical:false,digital:true,platform:'PS5 · Xbox Series X|S'},
    'marvels-wolverine':{physical:true,digital:true,platform:'PS5'},
    'ocarina-of-time-remake':{physical:true,digital:true,platform:'Switch 2'},
    'fire-emblem-fortunes-weave':{physical:true,digital:true,platform:'Switch 2'},
    'marvels-spider-man-2':{physical:true,digital:true,platform:'PS5'},
    'astro-bot':{physical:true,digital:true,platform:'PS5'}
  };
  return presets[t.slug]||{physical:true,digital:true,platform:''};
}
function themePurchaseGroup(title,kind,enabled,platform,slug){
  if(!enabled)return '';
  if(kind==='physical'){
    return `<section class="purchase-media-group">
      <div class="purchase-media-head"><div><span class="purchase-media-kicker">MÍDIA</span><h3>Físico</h3></div><span class="purchase-arrow">→</span></div>
      <div class="purchase-price-list">
        <a class="purchase-price-row" href="#/ofertas/${esc(slug)}?plat=${enc(platform)}&cond=new"><span class="purchase-condition">Novo</span><span class="purchase-value"><span class="purchase-from">preço de exemplo</span><strong>${esc(demoPrice(title,'new'))}</strong>${mockChip()}</span><span class="purchase-row-arrow">→</span></a>
        <a class="purchase-price-row" href="#/ofertas/${esc(slug)}?plat=${enc(platform)}&cond=used"><span class="purchase-condition">Usado</span><span class="purchase-value"><span class="purchase-from">preço de exemplo</span><strong>${esc(demoPrice(title,'used'))}</strong>${mockChip()}</span><span class="purchase-row-arrow">→</span></a>
      </div>
    </section>`;
  }
  return `<section class="purchase-media-group">
    <div class="purchase-media-head"><div><span class="purchase-media-kicker">MÍDIA</span><h3>Digital</h3></div><span class="purchase-arrow">→</span></div>
    <a class="purchase-price-row" href="#/ofertas/${esc(slug)}?plat=${enc(platform)}&cond=digital"><span class="purchase-condition">Download</span><span class="purchase-value"><span class="purchase-from">consultar nas lojas</span></span><span class="purchase-row-arrow">→</span></a>
  </section>`;
}
function renderTheme(slug){
  const t=D.trendingNow.find(x=>x.slug===slug);
  if(!t)return renderNotFound();
  const u=t.universe&&uMap.get(t.universe);
  const cfg=themeDemoConfig(t);
  const heroImage=visualAsset('themes',t.slug,'hero');
  const coverImage=visualAsset('themes',t.slug,'cover');
  const merchImage=visualAsset('themes',t.slug,'merch');
  const fanImage=visualAsset('themes',t.slug,'fanmade');
  setTitle(t.short);
  const heroActions=`
    ${u?`<a class="btn btn-ghost" href="#/universo/${u.slug}">Universo ${esc(u.name)} →</a>`:''}`;
  const fakeProduct={title:t.title,slug:t.slug,variants:[['Demo',cfg.platform||'Plataforma']],physical:cfg.physical,digital:cfg.digital};
  main.innerHTML=`
  <nav class="crumbs" aria-label="Você está em"><a href="#/">Início</a> › <a href="#/em-alta">Em alta</a> › <span>${esc(t.short)}</span></nav>
  ${gameHeroMarkup({title:t.title,kicker:sentence(t.tag),copy:t.copy,image:heroImage,artLabel:'KEY ART / WALLPAPER OFICIAL',actions:heroActions})}
  <p class="fine visual-demo-warning">REFERÊNCIA VISUAL · Imagens, disponibilidade e preços demonstrativos continuam identificados até a conexão das fontes oficiais.</p>
  <div class="game-commerce-grid">
    <article class="purchase-module" id="comprar-jogo">
      <div class="purchase-cover">${coverTile(t.title,{platform:cfg.platform,image:coverImage})}</div>
      <div class="purchase-main">
        <div class="purchase-title-row"><div><span class="purchase-kicker">COMPRAR O JOGO</span><h2>${esc(t.short)}</h2></div></div>
        ${cfg.platform?`<p class="purchase-platform">${esc(cfg.platform)}</p>`:''}
        <div class="purchase-options">${themePurchaseGroup(t.title,'physical',cfg.physical,cfg.platform,t.slug)}${themePurchaseGroup(t.title,'digital',cfg.digital,cfg.platform,t.slug)}</div>
        <p class="purchase-demo-note">Quando os dados reais entrarem, o bloco mantém o mesmo desenho e apenas substitui preço, disponibilidade e lojas.</p>
      </div>
    </article>
    ${visualMenuCard({title:'Colecionáveis e merch',copy:'Itens oficiais e colecionáveis relacionados a este jogo ou universo.',kind:'collectibles',image:merchImage,href:u?`#/merch?cat=colecionaveis&uni=${u.slug}`:'#/merch?cat=colecionaveis'})}
    ${visualMenuCard({title:'Fan-made e artesanais',copy:'Criações de fãs, decoração e peças artesanais relacionadas ao universo.',kind:'fanmade',image:fanImage,href:u?`#/merch?cat=fanmade&uni=${u.slug}`:'#/merch?cat=fanmade'})}
  </div>`;
  hydrateIgdbVisuals({
    title:t.title,
    platform:cfg.platform||'',
    heroSelector:'.game-hero-art',
    coverSelector:'#comprar-jogo .purchase-cover'
  });
}
function renderTrendingPage(){
  setTitle('Em alta');
  main.innerHTML=`<h1 class="page-h">Em alta</h1>
  <p class="lede">Assuntos que puxam a busca agora. Curadoria manual de ${esc(D.trendingUpdated)}, com links oficiais. Quando houver dados próprios, esta lista poderá mostrar o que está em alta no Inventário.</p>
  <div class="section-gap">${D.trendingNow.map(t=>`<article class="trend-row"><div class="igdb-cover-slot" data-igdb-cover data-igdb-title="${esc(t.title)}">${coverTile(t.short,{})}</div>
    <div><span class="chip">${esc(sentence(t.tag))}</span><h2 style="margin-top:6px">${esc(t.title)}</h2><p>${esc(t.copy)}</p></div>
    <div class="trend-actions"><a class="btn btn-outline btn-sm" href="#/tema/${t.slug}">Ver mais →</a><a class="btn btn-ghost btn-sm" href="${esc(safeUrl(t.digital))}" target="_blank" rel="noopener noreferrer">Digital / oficial ↗</a></div></article>`).join('')}</div>`;
  hydrateIgdbCovers(main,8);
}

/* ---------- games (hub de plataformas, fase 3) ---------- */
// Só 3 CTAs (Nintendo/PlayStation/Xbox — casa first-party); Retrô e
// Multiplataforma continuam existindo como destino (goNav via sidebar),
// sem card aqui.
const GAMES_HUB_CASAS=[
  {casa:'nintendo',label:'Nintendo',cls:'eco-nintendo',logo:'/assets/nintendo-logo.svg'},
  {casa:'playstation',label:'PlayStation',cls:'eco-playstation',logo:'/assets/playstation-logo.svg'},
  {casa:'xbox',label:'Xbox',cls:'eco-xbox',logo:'/assets/xbox-mark.svg'}
];
function gamesHubLinks(casa){
  return universes.filter(u=>u.casa===casa&&u.hasCatalog&&titlesOf(u.slug).length)
    .sort((a,b)=>titlesOf(b.slug).length-titlesOf(a.slug).length||a.name.localeCompare(b.name))
    .slice(0,7)
    .map(u=>`<a href="#/universo/${u.slug}">${esc(u.name)} <small>${titlesOf(u.slug).length}</small></a>`).join('');
}
function gamesHubTrendLabel(p){
  const u=uMap.get(p.universe);
  if(u&&u.casa!=='multi')return {nintendo:'Nintendo',playstation:'PlayStation',xbox:'Xbox'}[u.casa];
  return p.variants.some(v=>isRetro(v[1]))?'Retrô':'Multiplataforma';
}
// "Em alta no catálogo" (item 3 da fase): a spec original pedia /api/trending
// pulando os itens já mostrados na home. O endpoint real só devolve até 3
// itens (vídeos do YouTube casados com universo, sem plataforma/preço) —
// não dá pra montar uma fileira de 8 filtrável por casa com esse dado.
// Fallback local: mesmo catálogo, ordenado por lançamento mais recente
// (seleção diária estável, igual ao resto do site), filtrado pela aba ativa.
function gamesHubTrendPool(casaFilter){
  const matches=p=>{
    if(!casaFilter)return true;
    if(casaFilter==='retro')return p.variants.some(v=>isRetro(v[1]));
    const u=uMap.get(p.universe);
    return u&&u.casa===casaFilter;
  };
  const day=new Date().toISOString().slice(0,10);
  return [...catalog].filter(matches)
    .sort((a,b)=>(Number(b.year)||0)-(Number(a.year)||0)||hashStr(`${day}|${a.slug}`)-hashStr(`${day}|${b.slug}`))
    .slice(0,8);
}
function renderGames(params){
  setTitle('Escolha sua plataforma');
  const casaFilter=(params&&params.get('casa'))||'';
  const filterTabs=[['','Todos'],['nintendo','Nintendo'],['playstation','PlayStation'],['xbox','Xbox'],['retro','Retrô'],['multi','Multi']];
  const hrefFor=k=>{const p=new URLSearchParams();if(k)p.set('casa',k);const s=p.toString();return '#/games'+(s?'?'+s:'')};
  const pool=gamesHubTrendPool(casaFilter);
  main.innerHTML=`
  <h1 class="page-h">Escolha sua plataforma</h1>
  <p class="lede">Veja as franquias mais fortes de cada ecossistema e encontre onde comprar.</p>
  <div class="platform-cta-row" style="margin-top:20px">
    ${GAMES_HUB_CASAS.map(g=>`<section class="ecosystem-card ${g.cls}" aria-label="${esc(g.label)}">
      <div class="ecosystem-visual">${g.logo?`<img class="ecosystem-logo" src="${g.logo}" alt="${esc(g.label)}">`:ico('gamepad',76)}</div>
      <div class="ecosystem-links">${gamesHubLinks(g.casa)||'<span class="fine" style="color:rgba(255,255,255,.7)">Catálogo em preenchimento.</span>'}</div>
      <a class="ecosystem-cta" href="${goNav(g.casa)}">Explorar ${esc(g.label)} →</a>
    </section>`).join('')}
  </div>
  <section class="lux-section" aria-labelledby="games-trend-title" style="margin-top:48px">
    <div class="lux-section-head"><div><h2 id="games-trend-title">Em alta no catálogo</h2></div>${offerRowArrowsMarkup('games-trend')}</div>
    <div class="tabs" role="tablist" style="margin:-6px 0 18px">${filterTabs.map(([k,l])=>`<a class="tab" role="tab" href="${hrefFor(k)}" aria-current="${k===casaFilter}">${esc(l)}</a>`).join('')}</div>
    <div class="home-offer-grid" data-offer-row="games-trend">${pool.map(p=>homeOfferCard(p,gamesHubTrendLabel(p))).join('')||'<p class="lede">Nenhum jogo encontrado neste filtro.</p>'}</div>
  </section>`;
  hydrateIgdbCovers(main,pool.length+GAMES_HUB_CASAS.length*7);
  initOfferCarousels(main);
}

/* ---------- diretório de universos (#/universos, fase 4) ----------
   Vidro fumê (item explícito da fase): fundo da página e cards no
   material de --glass-2/--glass-border, sem blur (blur só em header/
   sidebar/painéis grandes, nunca em card — regra geral das fases). */
function universeDirectoryCard(u){
  const rep=representativeFranchiseGame(titlesOf(u.slug));
  const plat=rep?.variants?.[0]?.[1]||'';
  return `<a class="udir-card" href="#/universo/${u.slug}">
    <div class="udir-cover igdb-cover-slot" data-igdb-cover data-igdb-title="${esc(rep?igdbTitleFor(rep,plat):u.name)}" data-igdb-platform="${esc(plat)}" data-igdb-year="${esc(rep?.year||'')}">${coverTile(u.name,{size:'wide',note:false})}</div>
    <div class="udir-body">
      <div class="udir-name">${esc(u.name)}</div>
      <div class="udir-count">${titlesOf(u.slug).length} ${titlesOf(u.slug).length===1?'jogo':'jogos'}</div>
    </div>
  </a>`;
}
function renderUniverses(params){
  setTitle('Universos');
  const q=norm(params.get('q')||'');
  const casa=params.get('casa')||'';
  // Universo só existe com 3+ jogos (regra do catálogo) — franquias de
  // 1-2 jogos ficam de fora do diretório, igual já vale pro resto do site.
  const list=universes.filter(u=>u.hasCatalog&&titlesOf(u.slug).length>=3)
    .filter(u=>!casa||u.casa===casa)
    .filter(u=>!q||norm(u.name).includes(q))
    .sort((a,b)=>a.name.localeCompare(b.name));
  const casaTabs=[['','Todos'],['nintendo','Nintendo'],['playstation','PlayStation'],['xbox','Xbox'],['multi','Multi']];
  const hrefFor=k=>{const p=new URLSearchParams();if(k)p.set('casa',k);if(params.get('q'))p.set('q',params.get('q'));const s=p.toString();return '#/universos'+(s?'?'+s:'')};
  main.innerHTML=`
  <h1 class="page-h">Universos</h1>
  <p class="lede">Explore franquias e encontre onde comprar cada jogo.</p>
  <div class="section-gap" style="margin-top:16px"><input id="uniSearchInput" type="search" class="select" placeholder="Buscar universo..." value="${esc(params.get('q')||'')}" style="max-width:320px;width:100%"></div>
  <div class="tabs" role="tablist" style="margin-top:14px">${casaTabs.map(([k,l])=>`<a class="tab" role="tab" href="${hrefFor(k)}" aria-current="${k===casa}">${esc(l)}</a>`).join('')}</div>
  <div class="udir-grid" style="margin-top:16px">${list.map(universeDirectoryCard).join('')||'<p class="lede">Nenhum universo encontrado.</p>'}</div>`;
  hydrateIgdbCovers(main,list.length);
  const searchEl=$('#uniSearchInput');
  searchEl?.addEventListener('input',()=>{
    const p=new URLSearchParams(location.hash.split('?')[1]||'');
    if(searchEl.value)p.set('q',searchEl.value);else p.delete('q');
    history.replaceState(null,'','#/universos'+(p.toString()?'?'+p:''));
    renderUniverses(p);
  });
}

/* ---------- página da plataforma (#/plataforma/:slug, fase 5) ----------
   Hero da franquia mais forte da casa (mesmo componente do Universo) +
   painel com o logotipo; fileira de 4 ofertas; 3 CTAs; universos
   principais; link pra busca filtrada com todos os jogos da plataforma. */
function platformUniverses(casa){
  return universes.filter(u=>u.casa===casa&&u.hasCatalog&&titlesOf(u.slug).length)
    .sort((a,b)=>titlesOf(b.slug).length-titlesOf(a.slug).length||a.name.localeCompare(b.name));
}
function renderPlatform(slug,params,token){
  const label=PLATFORM_LABEL[slug];
  if(!label)return renderNotFound();
  setTitle(label);
  const unis=platformUniverses(slug);
  const top=unis[0];
  const topTitles=top?titlesOf(top.slug):[];
  const platformsList=ecoPlatforms(label);
  const offerPool=[...catalog].filter(p=>uMap.get(p.universe)?.casa===slug)
    .sort((a,b)=>(Number(b.year)||0)-(Number(a.year)||0)||a.title.localeCompare(b.title))
    .slice(0,4);
  main.innerHTML=`
  <nav class="crumbs" aria-label="Você está em"><a href="#/">Início</a> › <span>${esc(label)}</span></nav>
  <div class="universe-layout">
    ${top?universeHeroMarkup(top,topTitles):`<section class="universe-feature-row"><div class="game-hero universe-hero"><div class="game-hero-copy"><h1>${esc(label)}</h1><p>Catálogo em preenchimento.</p></div></div></section>`}
    <aside class="universe-inventory-panel platform-brand-panel" aria-label="${esc(label)}">
      ${PLATFORM_LOGO[slug]?`<img src="${PLATFORM_LOGO[slug]}" alt="${esc(label)}" class="platform-brand-logo">`:`<span class="platform-brand-fallback">${esc(label)}</span>`}
    </aside>
  </div>
  <section class="universe-game-shelf" aria-labelledby="plat-offers-title">
    <div class="lux-section-head"><div><h2 id="plat-offers-title">Ofertas em destaque</h2></div></div>
    <div class="universe-offer-grid" data-offer-row="plat-offers">${offerPool.map(universeOfferCard).join('')||'<p class="lede">Catálogo em preenchimento.</p>'}</div>
  </section>
  <div class="platform-cta-row3">
    ${visualMenuCard({title:'Retrogaming',copy:`Clássicos e relançamentos do ecossistema ${label}.`,kind:'collectibles',href:`#/busca?retro=1&plat=${enc(platformsList.join(','))}`})}
    ${visualMenuCard({title:'Merch e Colecionáveis',copy:'Amiibo, figures, livros e itens oficiais.',kind:'collectibles',href:'#/merch?cat=colecionaveis'})}
    ${visualMenuCard({title:'Fan-made e Decoração',copy:'Peças artesanais, quadros e criações de fãs.',kind:'fanmade',href:'#/merch?cat=fanmade'})}
  </div>
  ${unis.length?`<section class="lux-section" aria-labelledby="plat-universes-title"><div class="lux-section-head"><div><h2 id="plat-universes-title">Universos ${esc(label)}</h2></div></div>
    <div class="platform-uni-list">${unis.slice(0,10).map(u=>`<a class="platform-uni-chip" href="#/universo/${u.slug}"><span class="platform-uni-dot">${esc(initialsOf(u.name).slice(0,2))}</span><span>${esc(u.name)}</span></a>`).join('')}</div>
  </section>`:''}
  <p class="fine" style="margin-top:32px;text-align:center"><a class="btn btn-primary" href="#/busca?plat=${enc(platformsList.join(','))}">Ver todos os jogos da ${esc(label)} →</a></p>`;
  hydrateIgdbCovers(main,offerPool.length+4);
  if(top)hydrateUniverseHero($('[data-home-carousel]',main),token);
  initOfferCarousels(main);
}

/* ---------- merch, colecionáveis e fan-made ---------- */
function renderMerch(params){
  const cat=params.get('cat')||'',tipo=params.get('tipo')||'',uni=params.get('uni')||'';
  const tabs=[['','Todos'],...D.merchCategories.map(c=>[c.key,c.label])];
  const c=D.merchCategories.find(x=>x.key===cat);
  const list=mockMerch()?M.items.filter(it=>(!cat||it.cat===cat)&&(!tipo||it.type===tipo)&&(!uni||it.universe===uni)):[];
  const uName=uni&&uMap.get(uni)?uMap.get(uni).name:'';
  const types=Object.entries(D.merchTypes).filter(([k,t])=>(!cat||t.cat===cat)&&(!tipo||k===tipo));
  const q=new URLSearchParams(params);
  const tabHref=k=>{const p=new URLSearchParams();if(k)p.set('cat',k);if(uni)p.set('uni',uni);const s=p.toString();return '#/merch'+(s?'?'+s:'')};
  setTitle(c?c.label:'Merch, colecionáveis e fan-made');
  main.innerHTML=`<h1 class="page-h">${esc(c?c.label:'Merch, colecionáveis e fan-made')}</h1>
  <p class="lede">${esc(c?c.hint+'.':'Acessórios, colecionáveis, decoração e criações de fãs.')} Itens oficiais podem ter várias ofertas; peças fan-made e artesanais costumam ser anúncios únicos.</p>
  <div class="tabs" role="tablist">${tabs.map(([k,l])=>`<a class="tab" role="tab" href="${tabHref(k)}" aria-current="${k===cat}">${esc(l)}</a>`).join('')}</div>
  <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:6px"><label for="uniSel" class="fine">Universo</label>
    <select id="uniSel" class="select" data-act="pick-uni"><option value="">Todos os universos</option>${universes.map(u=>`<option value="${u.slug}" ${u.slug===uni?'selected':''}>${esc(u.name)}</option>`).join('')}</select></div>
  ${list.length?originLegend()+`<div class="cards4">${list.map(merchCard).join('')}</div>`:(mockMerch()?'<div class="empty"><p>Nenhum item de exemplo para este filtro.</p></div>':'<div class="empty"><h2>Merch e fan-made ainda não têm integração</h2><p>Use os atalhos abaixo: eles abrem a busca direto nas lojas.</p></div>')}
  <div class="section-gap"><h2 class="page-h" style="font-size:19px">Buscar nas lojas</h2><p class="lede">Sem integração ainda: os links abrem a busca de cada loja${uName?` por ${esc(uName)}`:''}.</p>
    <div class="shortcut-groups">${types.map(([k,t])=>`<div class="shortcut-group"><h3>${esc(t.label)}</h3><div class="shortcut-links">${merchLinks(t.term+(uName?' '+uName:''),t.cat)}</div></div>`).join('')}</div></div>`;
}

/* ---------- Meu Inventário ---------- */
function monthYear(iso){try{return new Date(iso).toLocaleDateString('pt-BR',{month:'short',year:'numeric'}).replace('.','')}catch{return ''}}
function renderInventory(params){
  setTitle('Meu Inventário');
  const tab=params.get('tab')||'all';
  const items=invList().sort((a,b)=>String(b.addedAt).localeCompare(String(a.addedAt)));
  const owned=items.filter(i=>i.status==='owned'),wanted=items.filter(i=>i.status==='wanted'||i.status==='saved'),alerted=items.filter(i=>i.alert);
  const stat=(icon,n,l)=>`<div class="stat">${ico(icon,26)}<div><b>${n}</b><span>${l}</span></div></div>`;
  const shown=tab==='owned'?owned:tab==='wanted'?wanted:tab==='alerts'?alerted:items;
  const tabs=[['all','Todos os itens',items.length],['owned','Tenho',owned.length],['wanted','Quero',wanted.length],['alerts','Alertas de preço',alerted.length]];
  const card=i=>{
    regRef({id:i.id,kind:i.kind,cat:i.cat,type:i.type,origin:i.origin,unique:i.unique,creator:i.creator,title:i.title,universe:i.universe,platforms:i.platforms,price:i.price,mock:i.mock});
    const tag=i.status==='owned'?'Tenho':i.status==='saved'?'Salvo':'Quero';
    const meta=i.paid!=null?`Pago: ${brl(i.paid)}${i.boughtAt?' · '+monthYear(i.boughtAt):''}`:`Adicionado em ${monthYear(i.addedAt)}`;
    const p=i.kind==='game'?catalogBySlug.get(i.id.replace('game:','')):null;
    let cta='';
    if(p)cta=`<a class="btn btn-outline btn-sm" href="#/jogo/${p.slug}">Ver ofertas</a>`;
    else if(i.kind==='game')cta=`<a class="btn btn-outline btn-sm" href="#/busca?q=${enc(i.title)}">Buscar</a>`;
    else if(i.unique)cta=`<button class="btn btn-outline btn-sm" data-act="mock-item" data-id="${esc(i.id)}">Ver item</button>`;
    else cta=`<button class="btn btn-outline btn-sm" data-act="open-merch-offers" data-id="${esc(i.id)}">Ver ofertas</button>`;
    return `<article class="inv-card">${coverTile(i.title,{size:'wide',mock:!!i.mock})}
      <div class="inv-body"><div class="inv-title">${esc(i.title)}</div>
      <div class="inv-meta"><span class="chip status">${tag}</span>${i.alert?` <span class="chip soft">alerta marcado</span>`:''}</div>
      <div class="inv-meta">${esc(meta)}${i.kind==='fanmade'?' · anúncio único':''}</div>
      <div class="inv-actions">${cta}<button class="btn btn-ghost btn-sm" data-act="open-save" data-id="${esc(i.id)}">Alterar</button></div></div></article>`;
  };
  main.innerHTML=`<div class="inventory-world"><div class="inventory-topline"><div><span class="inventory-kicker">PAUSE MENU</span><h1 class="page-h">Meu Inventário</h1>
  <p class="lede">O que você tem, o que procura e os avisos que quer receber. Fica só neste aparelho: não há login nem envio de dados.</p></div><a class="btn inv-continue" href="#/">← Continuar procurando</a></div>
  <div class="stats">${stat('gamepad',items.filter(i=>i.kind==='game'&&i.status==='owned').length,'Games')}${stat('cube',items.filter(i=>i.kind==='merch'&&i.status==='owned').length,'Colecionáveis')}${stat('brush',items.filter(i=>i.kind==='fanmade'&&i.status==='owned').length,'Artesanais')}${stat('bell',alerted.length,'Alertas')}</div>
  <p class="fine">Sem porcentagem de “franquia completa”: contamos só o que você realmente tem.</p>
  <div class="tabs" role="tablist">${tabs.map(([k,l,n])=>`<a class="tab" role="tab" href="#/inventario?tab=${k}" aria-current="${k===tab}">${l} (${n})</a>`).join('')}</div>
  ${shown.length?`<div class="inv-grid">${shown.map(card).join('')}</div>`:`<div class="empty"><h2>${items.length?'Nada nesta aba ainda':'Seu inventário está vazio'}</h2><p>Toque em ${ico('heart',14)} num jogo ou item para escolher Quero, Já tenho ou Criar alerta.</p><p style="margin-top:12px"><a class="btn btn-primary btn-sm" href="#/games">Explorar games</a></p></div>`}
  ${items.length?`<p style="margin-top:22px"><button class="btn btn-ghost btn-sm" data-act="clear-inventory">Limpar meu inventário</button></p>`:''}
  <p class="fine" style="margin-top:14px">Alertas de preço ainda não enviam notificações: por enquanto só registram o seu interesse neste aparelho.</p></div>`;
}

function renderNotFound(){
  setTitle('Página não encontrada');
  main.innerHTML=`<div class="empty"><h1 class="page-h" style="font-size:22px">Não encontramos esta página</h1><p>O endereço pode ter mudado. Volte ao início ou pesquise um jogo.</p><p style="margin-top:12px"><a class="btn btn-primary btn-sm" href="#/">Ir para o início</a></p></div>`;
}


/* ---------- navegação: destino único + barra lateral ---------- */
function ecoPlatforms(eco){
  const set=new Set();
  catalog.forEach(p=>p.variants.forEach(v=>{if(v[0]===eco)set.add(v[1])}));
  return [...set];
}
// Destino único de navegação por slug (header, sidebar, hub etc.). Fase 5:
// nintendo/playstation/xbox agora vão pra própria página de plataforma
// (antes caíam na busca filtrada). Retrô/Multiplataforma ainda não têm
// rota própria — continuam na busca filtrada equivalente.
function goNav(slug){
  if(PLATFORM_LABEL[slug])return `#/plataforma/${slug}`;
  const routes={
    universos:'#/universos',
    retro:'#/busca?retro=1',
    multiplataforma:'#/busca',
    'em-alta':'#/em-alta',
    ofertas:'#/busca?cond=usado',
    merch:'#/merch'
  };
  return routes[slug]||'#/busca';
}
// Fonte da lista "Universos em destaque" da sidebar — só slugs, curados à
// mão; trocar aqui não mexe em nada da UI.
// Campos manuais (item C): nome de exibição, sigla (monograma) e aliases de
// busca não derivam mais do título do catálogo — cada universo em destaque
// escreve os seus. slug precisa bater com uMap (catalog-data.js/franchise).
const SIDEBAR_FEATURED_UNIVERSES=[
  {slug:'mario',nome:'Super Mario',sigla:'SM',aliases:['mario','mario kart']},
  {slug:'the-legend-of-zelda',nome:'The Legend of Zelda',sigla:'Z',aliases:['zelda']},
  {slug:'pokemon',nome:'Pokémon',sigla:'PK',aliases:['pokemon']},
  {slug:'god-of-war',nome:'God of War',sigla:'GoW',aliases:['god of war']},
  {slug:'resident-evil',nome:'Resident Evil',sigla:'RE',aliases:['resident evil']}
];
function sidebarItem(slug,label,icon){
  const href=goNav(slug);
  const active=location.hash===href;
  return `<a class="sidebar-item" href="${href}"${active?' aria-current="page"':''}>${ico(icon,20)}<span>${esc(label)}</span></a>`;
}
function sidebarUniverseItem(entry){
  const path=`#/universo/${entry.slug}`;
  const active=location.hash===path||location.hash.startsWith(path+'?');
  return `<li><a class="sidebar-uni-item" href="${path}"${active?' aria-current="page"':''}><span class="sidebar-uni-dot" aria-hidden="true">${esc(entry.sigla)}</span><span class="sidebar-uni-name">${esc(entry.nome)}</span></a></li>`;
}
function sidebarContent(){
  const featured=SIDEBAR_FEATURED_UNIVERSES.filter(entry=>uMap.has(entry.slug));
  const owned=invList().filter(i=>i.kind==='game'&&i.status==='owned').length;
  const invActive=location.hash==='#/inventario';
  return `
    <nav class="sidebar-nav" aria-label="Navegação principal">
      <div class="sidebar-group">
        ${sidebarItem('em-alta','Em alta','trend')}
        ${sidebarItem('ofertas','Ofertas','tag')}
      </div>
      <div class="sidebar-group">
        ${sidebarItem('nintendo','Nintendo','gamepad')}
        ${sidebarItem('playstation','PlayStation','gamepad')}
        ${sidebarItem('xbox','Xbox','gamepad')}
      </div>
      <div class="sidebar-group">
        ${sidebarItem('retro','Retrô','retro')}
        ${sidebarItem('multiplataforma','Multiplataforma','cube')}
        ${sidebarItem('merch','Colecionáveis','bag')}
      </div>
    </nav>
    ${featured.length?`<div class="sidebar-featured"><ul class="sidebar-uni-list">${featured.map(sidebarUniverseItem).join('')}</ul><a class="sidebar-see-all" href="#/universos">Ver todos →</a></div>`:''}
    <a class="sidebar-footer" href="#/inventario"${invActive?' aria-current="page"':''}>
      ${ico('chest',22)}
      <span class="sidebar-footer-info"><b>Meu Inventário</b><small>${owned} de ${catalog.length} jogos</small></span>
    </a>`;
}
// Item 4 (rodada 5): "Universos em destaque" mostra quantos itens couberem
// (mín. 3, máx. 5) sem rolar — medido de verdade (ResizeObserver chama
// isso de novo sempre que a barra muda de altura), não mais um chute por
// media query de altura de tela.
function fitSidebarFeatured(root){
  const list=root.querySelector('.sidebar-uni-list');
  if(!list)return;
  const items=[...list.children];
  if(!items.length)return;
  items.forEach(li=>{li.hidden=false});
  const seeAll=root.querySelector('.sidebar-see-all');
  const footer=root.querySelector('.sidebar-footer');
  const nav=root.querySelector('.sidebar-nav');
  const total=root.clientHeight;
  const used=(nav?.offsetHeight||0)+(seeAll?.offsetHeight||0)+(footer?.offsetHeight||0)+40;
  const perItem=items[0].offsetHeight||38;
  const fit=Math.max(3,Math.min(5,Math.floor((total-used)/perItem)));
  items.forEach((li,i)=>{li.hidden=i>=fit});
}
function fitAllSidebars(){
  [document.getElementById('appSidebar'),document.getElementById('sidebarDrawer')].forEach(el=>{
    if(el)fitSidebarFeatured(el);
  });
}
function renderSidebar(){
  const html=sidebarContent();
  const desktop=document.getElementById('appSidebar');
  const drawer=document.getElementById('sidebarDrawer');
  if(desktop)desktop.innerHTML=html;
  if(drawer)drawer.innerHTML=html;
  fitAllSidebars();
}
