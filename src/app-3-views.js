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
  // Pacote3, item 2.1: sem oferta real em cache, cai no preço de exemplo
  // ÚNICO do jogo (sampleOffers) — pode ser Usado OU Novo (o bucket do
  // jogo decide, nunca força "Usado" pra quem só tem Novo de exemplo).
  const demo=mockOn()?sampleOffersBestPhysical(p.title,{year:p.year}):null;
  const condLabel=cached?'Usado':demo?.label;
  const value=cached?.minDisplay||demo?.display;
  const isMock=!!(value&&!cached);
  // Item 2 (rodada 5): sem sobretítulo — o rótulo era o único lugar da
  // condição, então o preço nunca aparece sem ela ("Usado R$ X").
  // Pacote4 1B.2: o selo EXEMPLO saiu de dentro do <strong> (cortava em
  // cards estreitos) e virou um selo de canto sobre a capa — mas a capa é o
  // próprio alvo de hydrateIgdbCovers() (data-igdb-cover faz
  // el.innerHTML=coverTile(...)), então o selo fica num wrapper à parte
  // (.lux-product-media), nunca dentro do elemento que a IGDB substitui.
  return `<article class="lux-product-card">
    <div class="lux-product-media">
      <a class="lux-product-image igdb-cover-slot" href="#/jogo/${p.slug}" data-igdb-cover data-igdb-title="${esc(igdbTitleFor(p,platform))}" data-igdb-platform="${esc(platform)}" data-igdb-year="${esc(p.year||'')}">${coverTile(p.title,{size:'wide',note:false})}</a>
      <span class="corner-mock"${isMock?'':' hidden'}>EXEMPLO</span>
    </div>
    <div class="lux-product-body"><h3><a href="#/jogo/${p.slug}">${esc(p.title)}</a></h3><p>${esc(platform)}${p.year?` · ${p.year}`:''}</p>
    ${value?`<strong>${esc(condLabel)} ${esc(value)}</strong>`:'<span class="quiet-link">Ver opções →</span>'}</div>
  </article>`;
}
let homeRenderId=0;
const homeTrendHref=t=>t.href||`#/tema/${t.slug}`;
// initHomeCarousel: driver genérico de slide (crossfade + pontos + setas +
// contador), nascido pro hero antigo da home — continua em uso pelo hero da
// página de UNIVERSO (universeHeroMarkup/hydrateUniverseHero, mais abaixo
// no arquivo), por isso fica fora do bloco "home nova" (pacote3, seção 3)
// mesmo não sendo mais chamado pela home em si.
let homeHeroTimer=null;
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

/* ============================================================
   PACOTE3, SEÇÃO 3 — HOME NOVA
   Ordem: hero largo, Destaques, Universos em destaque, Retrô,
   Colecionáveis e merch, rodapé (rodapé é HTML estático, ver index.html).
   ============================================================ */

/* ---- Pacote5 1.1/1.2: hero largo (home e plataforma), componente único
   com rotação automática. Reaproveita o esqueleto do hero largo do
   pacote3 (.hhw-*); o que muda nesta versão: altura fixa 340px, janela de
   arte a 70% de largura (var(--hero-art-w)) com degradê pro --hero-base
   da PALETA do jogo/universo do slide (não mais a cor hash aleatória de
   antes), texto no topo-esquerdo, pílulas só informativas (ver
   heroWideStatePill/heroWideExclusivePill) e indicadores/pausa no canto
   SUPERIOR direito (os ladrilhos de universo cobrem a base — item 1.3). ---- */
function catalogGameForTrend(t){return catalog.find(p=>p.title===t.title)||null}
// Pacote5, COMO TRABALHAR: preço do botão do hero — jogo NÃO lançado
// nunca mostra "Usado a partir de" (reaproveita releaseState do 4B, não
// reimplementa). Com oferta física de exemplo (sampleOffers nunca gera
// Usado pra jogo não lançado, só Novo) mostra "Pré-venda a partir de
// R$X"; sem oferta nenhuma, "Em breve" (+ data, se houver).
// Pacote5b, item 2: botão e pílula de estado SEMPRE derivados da MESMA
// checagem (demo de pré-venda presente ou não) — nunca duas fontes que
// podem discordar entre si (antes a pílula olhava releaseState==='pre-venda'
// e o botão olhava só a oferta de exemplo; um jogo 'anunciado' com oferta
// podia mostrar botão "Pré-venda a partir de" com pílula "EM BREVE").
function heroWideReleaseInfo(p){
  if(!p||releaseState(p)==='lancado')return null;
  const demo=mockOn()?sampleOffersBestPhysical(p.title,{year:p.year}):null;
  return {hasOffer:!!demo?.display,offerDisplay:demo?.display,dateDisplay:releaseDateDisplay(p)};
}
function heroWidePriceCta(p,platform){
  if(!p)return `<a class="btn btn-primary hero-price-btn" href="#/">Ver detalhes →</a>`;
  const rel=heroWideReleaseInfo(p);
  if(rel){
    if(rel.hasOffer)return `<a class="btn btn-primary hero-price-btn" href="#/jogo/${p.slug}"><span class="hpc-full">Pré-venda a partir de ${esc(rel.offerDisplay)} →</span><span class="hpc-short">Pré-venda ${esc(rel.offerDisplay)} →</span>${mockChip()}</a>`;
    return `<a class="btn btn-ghost hero-price-btn" href="#/jogo/${p.slug}">Em breve${rel.dateDisplay?` · ${esc(rel.dateDisplay)}`:''} →</a>`;
  }
  const cached=bestUsed(p);
  const demo=mockOn()?sampleOffersBestPhysical(p.title,{year:p.year}):null;
  const label=cached?'Usado':demo?.label;
  const value=cached?.minDisplay||demo?.display;
  if(!value)return `<a class="btn btn-primary hero-price-btn" href="#/jogo/${p.slug}">Ver detalhes →</a>`;
  return `<a class="btn btn-primary hero-price-btn" href="${bestOfferHrefFor(p,platform)}"><span class="hpc-full">${esc(label)} a partir de ${esc(value)} →</span><span class="hpc-short">${esc(label)} ${esc(value)} →</span>${!cached?mockChip():''}</a>`;
}
// Pacote5b, item 2: no máximo 1 pílula de ESTADO (PRÉ-VENDA/EM BREVE),
// sempre coerente com o botão (heroWideReleaseInfo, acima — mesma
// checagem). "Só em console X" é uma pílula separada, de EXCLUSIVIDADE,
// não de estado (heurística best-effort: só 1 entrada em variants — sem
// rede pra IGDB neste ambiente pra validar contra exclusividade de
// verdade); quem chama decide se cabe junto (ver opts.showExclusivePill
// em homeHeroWideMarkup — no máximo 2 pílulas no total, nunca 3).
function heroWideStatePill(p){
  const rel=heroWideReleaseInfo(p);
  if(!rel)return null;
  if(rel.hasOffer)return `PRÉ-VENDA${rel.dateDisplay?` · ${esc(rel.dateDisplay)}`:''}`;
  return 'EM BREVE';
}
function heroWideExclusivePill(p){
  if(!p)return null;
  const plats=[...new Set((p.variants||[]).map(v=>v[1]))];
  if(plats.length!==1)return null;
  const rotulo=consoleInfo(plats[0])?.rotulo||plats[0];
  return `Só em console ${esc(rotulo)}`;
}
function homeHeroSlideFromTrend(t,pillLabel){
  const game=catalogGameForTrend(t);
  const platform=game?.variants?.[0]?.[1]||'';
  const u=game?.universe?uMap.get(game.universe):null;
  const pal=u?paletteForUniverse(u):null;
  return {
    pill:pillLabel,title:t.title,baseColor:pal?.fundo||'#1a1512',
    igdbTitle:game?igdbTitleFor(game,platform):t.title,igdbPlatform:platform,igdbYear:game?.year||'',
    heroSlug:game?.slug||'',
    href:homeTrendHref(t),
    ctaHtml:heroWidePriceCta(game,platform),
    statePill:heroWideStatePill(game),exclusivePill:heroWideExclusivePill(game),
    thumbLabel:t.short||t.title
  };
}
function homeHeroSlideFromUniverse(slug){
  const u=uMap.get(slug);
  if(!u)return null;
  const titles=titlesOf(slug);
  const rep=representativeFranchiseGame(titles);
  const pal=paletteForUniverse(u);
  const platform=rep?.variants?.[0]?.[1]||'';
  return {
    pill:'UNIVERSO',title:pal?.nome||u.name,baseColor:pal?.fundo||'#1a1512',
    igdbTitle:rep?igdbTitleFor(rep,platform):u.name,igdbPlatform:platform,igdbYear:rep?.year||'',
    heroSlug:rep?.slug||'',
    href:`#/universo/${u.slug}`,
    ctaHtml:`<a class="btn btn-primary hero-price-btn" href="#/universo/${u.slug}">Conhecer o universo →</a>`,
    statePill:null,exclusivePill:null,
    thumbLabel:pal?.nome||u.name
  };
}
function resolveHomeHeroSlide(entry){
  if(!entry||!entry.slug)return null;
  if(entry.tipo==='universo')return homeHeroSlideFromUniverse(entry.slug);
  const t=D.trendingNow.find(x=>x.slug===entry.slug);
  if(!t)return null;
  const pillMap={jogo:'EM ALTA',lancamento:'LANÇAMENTO','oferta-merch':'OFERTA'};
  return homeHeroSlideFromTrend(t,pillMap[entry.tipo]||'EM ALTA');
}
// 3.1: slides vêm de src/data/home-heroes.json (HOME_HEROES, carregado
// síncrono em app-1-core.js); sem arquivo/itens válidos, cai nos destaques
// locais de D.trendingNow (mesma fonte que /api/trending cura manualmente).
function loadHomeHeroSlides(){
  const fromFile=(HOME_HEROES||[]).map(resolveHomeHeroSlide).filter(Boolean);
  if(fromFile.length)return fromFile.slice(0,4);
  return D.trendingNow.slice(0,4).map(t=>homeHeroSlideFromTrend(t,'EM ALTA'));
}
// Página de plataforma (seção 3.1): destaques da plataforma, mais em alta
// primeiro — mesmo pool de D.trendingNow, filtrado pelos jogos que têm
// aquela plataforma no catálogo. Sem pílula de tipo (opts.showTypePill
// false faz homeHeroWideMarkup omitir a pílula EM ALTA/UNIVERSO).
function platformHeroSlides(plats){
  const inPlat=p=>p.variants.some(v=>plats.includes(v[1]));
  const trendTitles=new Set(D.trendingNow.map(t=>t.title));
  const pool=catalog.filter(inPlat);
  const trendGames=pool.filter(p=>trendTitles.has(p.title));
  const rest=pool.filter(p=>!trendTitles.has(p.title)).sort((a,b)=>(Number(b.year)||0)-(Number(a.year)||0));
  const games=[...trendGames,...rest].slice(0,4);
  return games.map(g=>{
    const platform=g.variants.find(v=>plats.includes(v[1]))?.[1]||g.variants[0][1];
    const u=g.universe?uMap.get(g.universe):null;
    const pal=u?paletteForUniverse(u):null;
    return {
      pill:'',title:g.title,baseColor:pal?.fundo||'#1a1512',
      igdbTitle:igdbTitleFor(g,platform),igdbPlatform:platform,igdbYear:g.year||'',
      heroSlug:g.slug,href:`#/jogo/${g.slug}`,
      ctaHtml:heroWidePriceCta(g,platform),
      statePill:heroWideStatePill(g),exclusivePill:heroWideExclusivePill(g),
      thumbLabel:g.title
    };
  });
}
// Pacote5b, item 2: sem reticências no hero — o título mostrado tira o
// complemento entre parênteses do final ("(2026)", "(Switch 2)"); o
// título completo continua no aria-label e na página do jogo. 3 faixas
// de tamanho (34/26/22px) pelo tamanho do título JÁ sem o complemento.
function heroDisplayTitle(title){
  const stripped=String(title||'').replace(/\s*\([^)]*\)\s*$/,'').trim();
  return stripped||title||'';
}
function homeHeroWideMarkup(slides,opts={}){
  const showTypePill=opts.showTypePill!==false;
  return `<section class="hhw" aria-roledescription="carrossel" aria-label="Destaques" data-hhw>
    <div class="hhw-track" data-hhw-track>
    ${slides.map((s,i)=>{
      const displayTitle=heroDisplayTitle(s.title);
      const sizeClass=displayTitle.length>36?'is-xlong':displayTitle.length>28?'is-long':'';
      // Pacote5b, item 2: no máximo 1 pílula de estado, SEMPRE coerente
      // com o botão (heroWideStatePill reusa a mesma checagem do botão).
      // Home: type (EM ALTA/UNIVERSO) + [estado OU exclusividade], nunca
      // as 3 juntas. Plataforma (showTypePill false): só a de estado —
      // "Só em console X" não aparece lá (item 2, pedido explícito).
      const pills=[];
      if(showTypePill){
        if(s.pill)pills.push(s.pill);
        if(s.statePill)pills.push(s.statePill);
        else if(s.exclusivePill)pills.push(s.exclusivePill);
      }else if(s.statePill)pills.push(s.statePill);
      return `<article class="hhw-slide ${i===0?'is-active':''}" data-hhw-slide aria-hidden="${i!==0}" style="--hero-base:${esc(s.baseColor||'#1a1512')}">
      <div class="hhw-art game-hero-art" data-hhw-art data-hhw-title="${esc(s.igdbTitle)}" data-hhw-platform="${esc(s.igdbPlatform)}" data-hhw-year="${esc(s.igdbYear)}" data-hhw-slug="${esc(s.heroSlug||'')}" aria-hidden="true"><div class="game-hero-placeholder"><b>${esc(initialsOf(s.title))}</b></div></div>
      <div class="hhw-copy">
        ${pills.length?`<div class="hhw-pills">${pills.map(p=>`<span class="hhw-pill">${p}</span>`).join('')}</div>`:''}
        <h1 class="${sizeClass}" aria-label="${esc(s.title)}">${esc(displayTitle)}</h1>
        <div class="hhw-cta">${s.ctaHtml}</div>
      </div>
    </article>`;
    }).join('')}
    </div>
    <div class="hhw-controls">
      <div class="hhw-indicators" role="tablist" aria-label="Selecionar destaque">${slides.map((s,i)=>`<button type="button" class="hhw-ind ${i===0?'is-active':''}" data-hhw-ind="${i}" role="tab" aria-selected="${i===0}" aria-label="Mostrar ${esc(s.thumbLabel)}"><span class="hhw-ind-fill" data-hhw-fill></span></button>`).join('')}</div>
      <button type="button" class="hhw-pause" data-hhw-pause aria-pressed="false" aria-label="Pausar rotação automática">${ico('check',0)}</button>
    </div>
    <div class="hhw-dots" role="tablist" aria-label="Selecionar destaque">${slides.map((s,i)=>`<button type="button" class="hhw-dot ${i===0?'is-active':''}" data-hhw-dot="${i}" role="tab" aria-selected="${i===0}" aria-current="${i===0}" aria-label="Mostrar ${esc(s.thumbLabel)}"></button>`).join('')}</div>
  </section>`;
}
async function hydrateHomeHeroWide(root){
  const arts=$$('[data-hhw-art]',root);
  // Pacote5b, item 1: a largura de verdade da janela de arte (var(--hero-art-w),
  // 70% do hero) precisa ir pro back-end — sem isso ele não sabe exigir uma
  // artwork larga o bastante pra cobrir a janela sem pixelar (mesmo esquema
  // de heroW que hydrateIgdbVisuals já usa pra ficha do jogo/universo).
  const heroW=arts[0]?arts[0].getBoundingClientRect().width:0;
  await mapLimit(arts,2,async art=>{
    const d=await fetchIgdbVisual(art.dataset.hhwTitle||'',art.dataset.hhwPlatform||'',art.dataset.hhwYear||'','',heroW);
    if(!art.isConnected)return;
    if(d?.hero?.url){
      setHeroBackground(art,d.hero.url);
      // parteB 6: banner "Conheça o universo" na busca reaproveita esta
      // mesma arte (sem fetch novo) quando o jogo do hero da home pertence
      // ao universo buscado — mesmo cache que a página de universo usa.
      if(art.dataset.hhwSlug)heroImageCache.set(art.dataset.hhwSlug,d.hero.url);
    }else if(d?.cover?.url){
      setHeroBackground(art,d.cover.url,true);
    }
  });
}
// 3.3: 7s por slide, crossfade via CSS (.is-active opacity), pausa em
// hover/foco/aba oculta; qualquer interação manual desliga a rotação pelo
// resto da sessão; sem rotação com prefers-reduced-motion ou pointer:coarse
// (toque). 3.2: a barra de progresso da miniatura ativa usa uma animação
// CSS (scaleX 0->1, linear, 7s) que dá pra pausar/retomar via
// animationPlayState — pausa junto com a rotação.
function initHomeHeroWide(root){
  const PAUSE_ICON='<svg class="ico" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>';
  const PLAY_ICON='<svg class="ico" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 5v14l12-7z"/></svg>';
  const slides=$$('[data-hhw-slide]',root),thumbs=$$('[data-hhw-ind]',root),dots=$$('[data-hhw-dot]',root),pauseBtn=$('[data-hhw-pause]',root);
  if(!slides.length)return;
  const reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
  const coarse=matchMedia('(pointer:coarse)').matches;
  const isMobileLayout=matchMedia('(max-width:899px)').matches;
  // Pacote3, item 4.3: entrada (escala da arte + texto subindo) só no
  // primeiro slide de cada visita — a classe cai sozinha depois de rodar
  // uma vez, pra trocas de slide por rotação/clique nunca repetirem.
  if(!reduced){root.classList.add('is-entering');setTimeout(()=>root.classList.remove('is-entering'),600)}
  const DURATION=7000;
  let current=0,userDisabled=reduced||coarse,paused=false,intervalId=null,syncingScroll=false;
  function paint(){
    slides.forEach((sl,idx)=>{const on=idx===current;sl.classList.toggle('is-active',on);sl.setAttribute('aria-hidden',String(!on));$$('a,button',sl).forEach(el=>el.tabIndex=on?0:-1)});
    thumbs.forEach((th,idx)=>{
      const on=idx===current;
      th.classList.toggle('is-active',on);
      th.setAttribute('aria-current',String(on));
      const fill=th.querySelector('[data-hhw-fill]');
      if(!fill)return;
      fill.style.animation='none';
      void fill.offsetWidth;
      fill.style.animation=(on&&!userDisabled)?`hhw-fill ${DURATION}ms linear forwards`:'';
      fill.style.animationPlayState=paused?'paused':'running';
    });
    dots.forEach((d,idx)=>{const on=idx===current;d.classList.toggle('is-active',on);d.setAttribute('aria-current',String(on));d.setAttribute('aria-selected',String(on))});
  }
  function show(i){current=(i+slides.length)%slides.length;paint()}
  function advance(){if(!paused&&!document.hidden)show(current+1)}
  function startInterval(){clearInterval(intervalId);if(userDisabled)return;intervalId=setInterval(advance,DURATION)}
  function disableAuto(){if(userDisabled)return;userDisabled=true;clearInterval(intervalId);paint()}
  const track=$('[data-hhw-track]',root);
  function scrollToSlide(i){
    const el=slides[i];
    if(!el||!isMobileLayout||!track)return;
    syncingScroll=true;
    el.scrollIntoView({behavior:reduced?'auto':'smooth',inline:'start',block:'nearest'});
    setTimeout(()=>{syncingScroll=false},reduced?50:500);
  }
  thumbs.forEach((th,i)=>th.addEventListener('click',()=>{disableAuto();show(i)}));
  dots.forEach((d,i)=>d.addEventListener('click',()=>{disableAuto();show(i);scrollToSlide(i)}));
  slides.forEach(sl=>$$('a,button',sl).forEach(el=>el.addEventListener('click',disableAuto)));
  // Indicadores viram bolinhas no mobile (b) e o hero desliza por
  // scroll-snap nativo (swipe); sincroniza current/dots com o slide que
  // está realmente visível, sem forçar scroll programático em resposta.
  if(isMobileLayout&&track&&'IntersectionObserver' in window){
    const mobileSync=new IntersectionObserver(entries=>{
      if(syncingScroll)return;
      entries.forEach(en=>{
        if(en.isIntersecting&&en.intersectionRatio>0.6){
          const idx=slides.indexOf(en.target);
          if(idx>=0&&idx!==current){current=idx;paint()}
        }
      });
    },{root:track,threshold:[0.6]});
    slides.forEach(sl=>mobileSync.observe(sl));
  }
  pauseBtn?.addEventListener('click',()=>{
    paused=!paused;
    pauseBtn.setAttribute('aria-pressed',String(paused));
    pauseBtn.innerHTML=paused?PLAY_ICON:PAUSE_ICON;
    pauseBtn.setAttribute('aria-label',paused?'Retomar rotação automática':'Pausar rotação automática');
    thumbs.forEach(th=>{const f=th.querySelector('[data-hhw-fill]');if(f)f.style.animationPlayState=paused?'paused':'running'});
  });
  pauseBtn.innerHTML=PAUSE_ICON;
  root.addEventListener('mouseenter',()=>{paused=true;thumbs.forEach(th=>{const f=th.querySelector('[data-hhw-fill]');if(f)f.style.animationPlayState='paused'})});
  root.addEventListener('mouseleave',()=>{if(pauseBtn.getAttribute('aria-pressed')==='true')return;paused=false;thumbs.forEach(th=>{const f=th.querySelector('[data-hhw-fill]');if(f)f.style.animationPlayState='running'})});
  root.addEventListener('focusin',()=>{paused=true});
  root.addEventListener('focusout',e=>{if(!root.contains(e.relatedTarget)&&pauseBtn.getAttribute('aria-pressed')!=='true')paused=false});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)return;paint()});
  // Slide inicial sorteado 1x por sessão (sessionStorage); a partir daí a
  // ordem é sempre sequencial fixa a partir desse ponto.
  let startIndex=0;
  try{
    const saved=sessionStorage.getItem('inventario-gamer:v1:home-hero-start');
    if(saved!=null&&!Number.isNaN(parseInt(saved,10)))startIndex=parseInt(saved,10)%slides.length;
    else{startIndex=Math.floor(Math.random()*slides.length);sessionStorage.setItem('inventario-gamer:v1:home-hero-start',String(startIndex))}
  }catch{}
  show(startIndex);
  startInterval();
}

/* ---- 3.4/3.5: Destaques (alternador Em alta/Mais novos/Menor preço) ---- */
// Pacote4 2.5: "Pré-venda" no alternador — joga pro topo (e só mostra) os
// jogos em pré-venda de verdade (releaseState 'pre-venda'; "Em breve"/
// anunciado fica de fora, o rótulo é específico pra pré-venda aberta).
const DESTAQUES_ORDERS=[['em-alta','Em alta'],['novos','Mais novos'],['menor-preco','Menor preço'],['pre-venda','Pré-venda']];
function destaquesPool(order,exclude){
  const pool=catalog.filter(p=>!exclude.has(p.title));
  if(order==='pre-venda')return pool.filter(p=>releaseState(p)==='pre-venda').sort((a,b)=>(a.releaseDate||'').localeCompare(b.releaseDate||'')).slice(0,12);
  if(order==='novos')return pool.filter(p=>p.year).sort((a,b)=>(Number(b.year)||0)-(Number(a.year)||0)).slice(0,12);
  if(order==='menor-preco'){
    return pool.map(p=>{
      const best=bestUsed(p);
      const demo=mockOn()?sampleOffersBestPhysical(p.title,{year:p.year}):null;
      const price=best?.min??demo?.price??null;
      return {p,price};
    }).filter(x=>x.price!=null).sort((a,b)=>a.price-b.price).slice(0,12).map(x=>x.p);
  }
  const trendTitles=new Set(D.trendingNow.map(t=>t.title));
  const trendGames=pool.filter(p=>trendTitles.has(p.title));
  const rest=pool.filter(p=>!trendTitles.has(p.title)).sort((a,b)=>(Number(b.year)||0)-(Number(a.year)||0));
  return [...trendGames,...rest].slice(0,12);
}
function destaquesAlternatorMarkup(order,hrefBase='#/',paramName='destaques'){
  return `<div class="destaques-alt" role="group" aria-label="Ordenar destaques">${DESTAQUES_ORDERS.map(([k,l])=>`<a class="destaques-alt-btn" href="${hrefBase}?${paramName}=${k}" aria-pressed="${k===order}" data-destaques-order="${k}" data-destaques-param="${paramName}" data-destaques-base="${hrefBase}">${esc(l)}</a>`).join('')}</div>`;
}
/* ============================================================
   PACOTE5, ITEM 1.3 — UniverseTile (componente único: home, plataforma
   e diretório de universos). Capa do jogo principal do universo
   saltando acima do ladrilho; sem capa válida (sem imagem, ou IGDB
   devolveu mas a imagem carregou com largura < 200px), fica só a cor
   da paleta + sigla. A hidratação mede a largura de verdade (naturalWidth)
   antes de trocar pra capa — nunca um <img> esticado/pixelado.
   ============================================================ */
function universeTileMarkup(u,opts={}){
  const titles=titlesOf(u.slug);
  const rep=representativeFranchiseGame(titles);
  const pal=paletteForUniverse(u);
  const platform=rep?.variants?.[0]?.[1]||'';
  const base=pal?.fundo||'#1f0b14';
  const displayName=pal?.nome||u.name;
  const count=opts.count!=null?opts.count:titles.length;
  return `<a class="universe-tile" href="#/universo/${u.slug}" aria-label="Universo ${esc(displayName)}, ${count} ${count===1?'jogo':'jogos'}" data-ut-tile data-ut-title="${esc(rep?igdbTitleFor(rep,platform):u.name)}" data-ut-platform="${esc(platform)}" data-ut-year="${esc(rep?.year||'')}" style="--ut-base:${esc(base)}">
    <span class="ut-cover-wrap" aria-hidden="true"><span class="ut-cover-slot"></span></span>
    <span class="ut-sigla" aria-hidden="true">${esc(u.sigla)}</span>
    <span class="ut-body"><b class="ut-name">${esc(displayName)}</b><small class="ut-count">${count} jogo${count===1?'':'s'}</small></span>
  </a>`;
}
// Pacote5b, item 5: "Ver todos →" — último ladrilho DA MESMA fileira
// (mesma largura/altura dos outros, sem capa) quando a plataforma tem
// mais de 6 universos; substitui a faixa de largura total do pacote5
// (item 3.2 antigo).
function universeTileMoreMarkup(href,count){
  return `<a class="universe-tile universe-tile-more" href="${esc(href)}">
    <span class="ut-body"><b class="ut-name">Ver todos →</b><small class="ut-count">${count} universo${count===1?'':'s'}</small></span>
  </a>`;
}
async function hydrateUniverseTiles(root){
  const nodes=$$('[data-ut-tile]',root).filter(el=>!el.dataset.utState);
  await mapLimit(nodes,3,async el=>{
    el.dataset.utState='loading';
    const d=await fetchIgdbVisual(el.dataset.utTitle||'',el.dataset.utPlatform||'',el.dataset.utYear||'');
    const url=d?.cover?.url;
    if(!el.isConnected)return;
    if(!url){el.dataset.utState='empty';return}
    const img=new Image();
    img.onload=()=>{
      if(!el.isConnected)return;
      if(img.naturalWidth<200){el.dataset.utState='empty';return}
      const slot=el.querySelector('.ut-cover-slot');
      if(slot)slot.style.backgroundImage=`url("${url.replace(/"/g,'%22')}")`;
      el.classList.add('has-cover');
      el.dataset.utState='done';
    };
    img.onerror=()=>{el.dataset.utState='empty'};
    img.src=url;
  });
}

/* ---- 3.8 / pacote4 4.2-4.4: card de merch (quadrado, sem foto por padrão) ---- */
const MERCH_ORIGEM_LABEL={nacional:'Nacional',importado:'Importado'};
const MERCH_TIPO_LABEL={oficial:'Oficial',licenciado:'Licenciado','fan-made':'Fan-made','nao-confirmado':'Não confirmado'};
// Pacote4 4.3: "a partir de R$X · loja · atualizado há N dias" só com
// precoAtualizadoEm de até 14 dias; passado isso (ou preco nulo), "Ver
// preço na {loja}" sem número — nunca finge um preço "ao vivo" que não é.
function merchPriceState(it){
  if(it.preco==null||!it.precoAtualizadoEm)return{fresh:false,days:null};
  const days=Math.floor((Date.now()-new Date(it.precoAtualizadoEm+'T00:00:00').getTime())/86400000);
  return{fresh:days>=0&&days<=14,days};
}
function merchPriceLine(it){
  const{fresh,days}=merchPriceState(it);
  if(fresh)return `<span class="merch-price">a partir de <b>${brl(it.preco)}</b></span><span class="merch-price-meta">${esc(it.loja)} · atualizado ${days===0?'hoje':`há ${days} dia${days===1?'':'s'}`}</span>`;
  return `<span class="merch-price-cta">Ver preço na ${esc(it.loja)}</span>`;
}
// Pacote4 4.2: só renderiza foto com imagem+imagemAutorizada===true (nunca
// hospedamos/copiamos foto de terceiro por conta própria); sem isso, cai
// no ícone da categoria (card "estilo C", 4.4) — fundo = arte do universo
// JÁ EM CACHE (heroImageCache, mesma do hero; sem pedido novo) ampliada e
// desfocada, ou o degradê da paleta sem arte nenhuma.
function merchSquareCard(it){
  const u=it.universo?uMap.get(it.universo):null;
  const pal=u?paletteForUniverse(u):null;
  const base=pal?.fundo||'#1f0b14';
  const art=it.universo?heroImageCache.get(it.universo):null;
  const hasPhoto=!!(it.imagem&&it.imagemAutorizada===true);
  const style=`--ms-base:${esc(base)}${!hasPhoto&&art?`;--ms-img:url("${art.replace(/"/g,'%22')}")`:''}`;
  const media=hasPhoto
    ?`<img class="merch-square-photo" src="${esc(safeUrl(it.imagem))}" alt="" loading="lazy"><span class="merch-photo-credit">Foto: ${esc(it.imagemFonte||'loja')}</span>`
    :`<svg class="merch-cat-icon" width="66" height="66" aria-hidden="true"><use href="assets/icons-categoria.svg#cat-${esc(it.categoria)}"></use></svg>`;
  return `<a class="merch-square-card" href="#/item/${esc(it.id)}" style="${style}">
    <div class="merch-square-media ${hasPhoto?'has-photo':(art?'has-art':'')}">
      ${media}
      <span class="merch-square-chips"><span class="chip-glass">${esc(MERCH_ORIGEM_LABEL[it.origem]||it.origem)}</span><span class="chip-glass">${esc(MERCH_TIPO_LABEL[it.tipo]||it.tipo)}</span>${it.exemplo?'<span class="chip-glass">EXEMPLO</span>':''}</span>
    </div>
    <div class="merch-square-body">
      <b class="merch-square-title">${esc(it.titulo)}</b>
      <div class="merch-square-price">${merchPriceLine(it)}</div>
      <small class="merch-square-store">${esc(it.loja)}</small>
    </div>
  </a>`;
}
/* ---- 3.9: lazy load (IntersectionObserver, margem 400px) ---- */
function initLazySections(root){
  const sections=$$('[data-lazy-section]',root);
  if(!sections.length)return;
  if(!('IntersectionObserver' in window)){sections.forEach(s=>hydrateIgdbCovers(s,24));return}
  const io=new IntersectionObserver(entries=>{
    entries.forEach(e=>{if(e.isIntersecting){hydrateIgdbCovers(e.target,24);io.unobserve(e.target)}});
  },{rootMargin:'400px 0px'});
  sections.forEach(s=>io.observe(s));
}
// Pacote3, item 4.4: os 6 pôsteres da 1ª fileira sobem 20px e aparecem com
// 40ms de atraso entre si — só 1x por sessão (sessionStorage), senão toda
// volta pra home replicaria a entrada.
function initStaggerEntrance(root){
  if(matchMedia('(prefers-reduced-motion:reduce)').matches)return;
  let already=false;
  try{already=sessionStorage.getItem('inventario-gamer:v1:home-stagger-done')==='1'}catch{}
  if(already)return;
  const cards=$$('.home-destaques .poster-card',root).slice(0,6);
  if(!cards.length)return;
  cards.forEach((card,i)=>{
    card.style.animationDelay=(i*40)+'ms';
    card.classList.add('is-stagger');
    card.addEventListener('animationend',()=>card.classList.add('is-stagger-done'),{once:true});
  });
  try{sessionStorage.setItem('inventario-gamer:v1:home-stagger-done','1')}catch{}
}
/* ============================================================
   PACOTE5, SEÇÃO 2 — HOME NOVA: coluna principal (hero largo + ladrilhos
   sobrepostos + abas + cards) e painel lateral (4 cartões). Substitui o
   layout do pacote3 (hero com miniaturas, Destaques com título próprio,
   bloco "Universos em destaque", fileira Retrô e vitrine de merch — ver
   item 2.4). "Colecionáveis e merch" sai da home nesta versão (não
   listado na nova composição do pacote5; continua acessível por #/merch
   e pelo menu).
   ============================================================ */
function universeTilesOverlapMarkup(label,href,list,extraTileHtml){
  if(!list.length)return '';
  return `<div class="universe-tiles-overlap">
    <a class="universe-tiles-label" href="${esc(href)}">${esc(label)} →</a>
    <div class="universe-tiles-row">${list.map(u=>universeTileMarkup(u)).join('')}${extraTileHtml||''}</div>
  </div>`;
}
/* ============================================================
   VOLTA AO PACOTE 4 (pedido do dono, pacote5b em andamento): a HOME
   especificamente volta pro layout do pacote4 (hero com miniaturas,
   "Destaques" com alternador, bloco "Universos em destaque", "Retrô" e
   a vitrine de merch) — plataforma/diretório/busca CONTINUAM no
   desenho do pacote5/5b (não mexidos aqui). Hero próprio (prefixo
   lhw-, "legacy hero wide") pra não colidir com o hero compartilhado
   (homeHeroWideMarkup/.hhw-*) que a página de plataforma usa.
   ============================================================ */
function legacyCatalogGameForTrend(t){return catalog.find(p=>p.title===t.title)||null}
function legacyHomeHeroSlideFromTrend(t,pillLabel){
  const game=legacyCatalogGameForTrend(t);
  let ctaHtml;
  if(game){
    const platform=game.variants?.[0]?.[1]||'';
    ctaHtml=`<a class="btn btn-primary hero-price-btn" href="${bestOfferHrefFor(game,platform)}">${posterPriceChipText(game,platform)}</a>`;
  }else{
    ctaHtml=`<a class="btn btn-primary" href="${esc(homeTrendHref(t))}">Ver detalhes</a>`;
  }
  return {
    pill:pillLabel,title:t.title,
    igdbTitle:t.title,igdbPlatform:game?.variants?.[0]?.[1]||'',igdbYear:game?.year||'',
    heroSlug:game?.slug||'',
    href:homeTrendHref(t),ctaHtml,thumbLabel:t.short||t.title
  };
}
function legacyHomeHeroSlideFromUniverse(slug){
  const u=uMap.get(slug);
  if(!u)return null;
  const titles=titlesOf(slug);
  const rep=representativeFranchiseGame(titles);
  const pal=paletteForUniverse(u);
  const platform=rep?.variants?.[0]?.[1]||'';
  return {
    pill:'UNIVERSO',title:pal?.nome||u.name,
    igdbTitle:rep?igdbTitleFor(rep,platform):u.name,igdbPlatform:platform,igdbYear:rep?.year||'',
    heroSlug:rep?.slug||'',
    href:`#/universo/${u.slug}`,
    ctaHtml:`<a class="btn btn-primary" href="#/universo/${u.slug}">Conhecer o universo →</a>`,
    thumbLabel:pal?.nome||u.name
  };
}
function legacyResolveHomeHeroSlide(entry){
  if(!entry||!entry.slug)return null;
  if(entry.tipo==='universo')return legacyHomeHeroSlideFromUniverse(entry.slug);
  const t=D.trendingNow.find(x=>x.slug===entry.slug);
  if(!t)return null;
  const pillMap={jogo:'EM ALTA',lancamento:'LANÇAMENTO','oferta-merch':'OFERTA'};
  return legacyHomeHeroSlideFromTrend(t,pillMap[entry.tipo]||'EM ALTA');
}
// 3.1: slides vêm de src/data/home-heroes.json (HOME_HEROES, carregado
// síncrono em app-1-core.js); sem arquivo/itens válidos, cai nos destaques
// locais de D.trendingNow (mesma fonte que /api/trending cura manualmente).
function legacyLoadHomeHeroSlides(){
  const fromFile=(HOME_HEROES||[]).map(legacyResolveHomeHeroSlide).filter(Boolean);
  if(fromFile.length)return fromFile.slice(0,4);
  return D.trendingNow.slice(0,4).map(t=>legacyHomeHeroSlideFromTrend(t,'EM ALTA'));
}
function legacyHomeHeroWideMarkup(slides){
  return `<section class="lhw" aria-roledescription="carrossel" aria-label="Destaques" data-lhw>
    <div class="lhw-track" data-lhw-track>
    ${slides.map((s,i)=>`<article class="lhw-slide ${i===0?'is-active':''}" data-lhw-slide aria-hidden="${i!==0}">
      <div class="lhw-art game-hero-art" data-lhw-art data-lhw-title="${esc(s.igdbTitle)}" data-lhw-platform="${esc(s.igdbPlatform)}" data-lhw-year="${esc(s.igdbYear)}" data-lhw-slug="${esc(s.heroSlug||'')}" style="--hero-h:${hashStr(s.title)%360}" aria-hidden="true"><div class="game-hero-placeholder"><b>${esc(initialsOf(s.title))}</b></div></div>
      <div class="lhw-copy">
        <span class="lhw-pill">${esc(s.pill)}</span>
        <h1>${esc(s.title)}</h1>
        <div class="lhw-cta">${s.ctaHtml}</div>
      </div>
    </article>`).join('')}
    </div>
    <div class="lhw-thumbs" role="group" aria-label="Escolher destaque">${slides.map((s,i)=>`<button type="button" class="lhw-thumb ${i===0?'is-active':''}" data-lhw-thumb="${i}" aria-current="${i===0}" aria-label="Mostrar ${esc(s.thumbLabel)}" title="${esc(s.thumbLabel)}"><span class="lhw-thumb-img" data-lhw-thumb-img style="--hero-h:${hashStr(s.title)%360}"></span><span class="lhw-thumb-bar"><span class="lhw-thumb-fill" data-lhw-fill></span></span></button>`).join('')}</div>
    <div class="lhw-dots" role="tablist" aria-label="Selecionar destaque">${slides.map((s,i)=>`<button type="button" class="lhw-dot ${i===0?'is-active':''}" data-lhw-dot="${i}" role="tab" aria-selected="${i===0}" aria-current="${i===0}" aria-label="Mostrar ${esc(s.thumbLabel)}"></button>`).join('')}</div>
    <button type="button" class="lhw-pause" data-lhw-pause aria-pressed="false" aria-label="Pausar rotação automática">${ico('check',0)}</button>
  </section>`;
}
async function legacyHydrateHomeHeroWide(root){
  const arts=$$('[data-lhw-art]',root);
  await mapLimit(arts,2,async(art,i)=>{
    const d=await fetchIgdbVisual(art.dataset.lhwTitle||'',art.dataset.lhwPlatform||'',art.dataset.lhwYear||'');
    if(!art.isConnected)return;
    const thumbImg=root.querySelectorAll('[data-lhw-thumb-img]')[i];
    if(d?.hero?.url){
      setHeroBackground(art,d.hero.url);
      if(thumbImg)thumbImg.style.backgroundImage=`url("${d.hero.url.replace(/"/g,'%22')}")`;
      // parteB 6: banner "Conheça o universo" na busca reaproveita esta
      // mesma arte (sem fetch novo) quando o jogo do hero da home pertence
      // ao universo buscado — mesmo cache que a página de universo usa.
      if(art.dataset.lhwSlug)heroImageCache.set(art.dataset.lhwSlug,d.hero.url);
    }else if(d?.cover?.url){
      setHeroBackground(art,d.cover.url,true);
      if(thumbImg)thumbImg.style.backgroundImage=`url("${d.cover.url.replace(/"/g,'%22')}")`;
    }
  });
}
// 3.3: 7s por slide, crossfade via CSS (.is-active opacity), pausa em
// hover/foco/aba oculta; qualquer interação manual desliga a rotação pelo
// resto da sessão; sem rotação com prefers-reduced-motion ou pointer:coarse
// (toque). 3.2: a barra de progresso da miniatura ativa usa uma animação
// CSS (scaleX 0->1, linear, 7s) que dá pra pausar/retomar via
// animationPlayState — pausa junto com a rotação.
function legacyInitHomeHeroWide(root){
  const PAUSE_ICON='<svg class="ico" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>';
  const PLAY_ICON='<svg class="ico" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 5v14l12-7z"/></svg>';
  const slides=$$('[data-lhw-slide]',root),thumbs=$$('[data-lhw-thumb]',root),dots=$$('[data-lhw-dot]',root),pauseBtn=$('[data-lhw-pause]',root);
  if(!slides.length)return;
  const reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
  const coarse=matchMedia('(pointer:coarse)').matches;
  const isMobileLayout=matchMedia('(max-width:899px)').matches;
  // Pacote3, item 4.3: entrada (escala da arte + texto subindo) só no
  // primeiro slide de cada visita — a classe cai sozinha depois de rodar
  // uma vez, pra trocas de slide por rotação/clique nunca repetirem.
  if(!reduced){root.classList.add('is-entering');setTimeout(()=>root.classList.remove('is-entering'),600)}
  const DURATION=7000;
  let current=0,userDisabled=reduced||coarse,paused=false,intervalId=null,syncingScroll=false;
  function paint(){
    slides.forEach((sl,idx)=>{const on=idx===current;sl.classList.toggle('is-active',on);sl.setAttribute('aria-hidden',String(!on));$$('a,button',sl).forEach(el=>el.tabIndex=on?0:-1)});
    thumbs.forEach((th,idx)=>{
      const on=idx===current;
      th.classList.toggle('is-active',on);
      th.setAttribute('aria-current',String(on));
      const fill=th.querySelector('[data-lhw-fill]');
      if(!fill)return;
      fill.style.animation='none';
      void fill.offsetWidth;
      fill.style.animation=(on&&!userDisabled)?`lhw-fill ${DURATION}ms linear forwards`:'';
      fill.style.animationPlayState=paused?'paused':'running';
    });
    dots.forEach((d,idx)=>{const on=idx===current;d.classList.toggle('is-active',on);d.setAttribute('aria-current',String(on));d.setAttribute('aria-selected',String(on))});
  }
  function show(i){current=(i+slides.length)%slides.length;paint()}
  function advance(){if(!paused&&!document.hidden)show(current+1)}
  function startInterval(){clearInterval(intervalId);if(userDisabled)return;intervalId=setInterval(advance,DURATION)}
  function disableAuto(){if(userDisabled)return;userDisabled=true;clearInterval(intervalId);paint()}
  const track=$('[data-lhw-track]',root);
  function scrollToSlide(i){
    const el=slides[i];
    if(!el||!isMobileLayout||!track)return;
    syncingScroll=true;
    el.scrollIntoView({behavior:reduced?'auto':'smooth',inline:'start',block:'nearest'});
    setTimeout(()=>{syncingScroll=false},reduced?50:500);
  }
  thumbs.forEach((th,i)=>th.addEventListener('click',()=>{disableAuto();show(i)}));
  dots.forEach((d,i)=>d.addEventListener('click',()=>{disableAuto();show(i);scrollToSlide(i)}));
  slides.forEach(sl=>$$('a,button',sl).forEach(el=>el.addEventListener('click',disableAuto)));
  // Indicadores viram bolinhas no mobile (b) e o hero desliza por
  // scroll-snap nativo (swipe); sincroniza current/dots com o slide que
  // está realmente visível, sem forçar scroll programático em resposta.
  if(isMobileLayout&&track&&'IntersectionObserver' in window){
    const mobileSync=new IntersectionObserver(entries=>{
      if(syncingScroll)return;
      entries.forEach(en=>{
        if(en.isIntersecting&&en.intersectionRatio>0.6){
          const idx=slides.indexOf(en.target);
          if(idx>=0&&idx!==current){current=idx;paint()}
        }
      });
    },{root:track,threshold:[0.6]});
    slides.forEach(sl=>mobileSync.observe(sl));
  }
  pauseBtn?.addEventListener('click',()=>{
    paused=!paused;
    pauseBtn.setAttribute('aria-pressed',String(paused));
    pauseBtn.innerHTML=paused?PLAY_ICON:PAUSE_ICON;
    pauseBtn.setAttribute('aria-label',paused?'Retomar rotação automática':'Pausar rotação automática');
    thumbs.forEach(th=>{const f=th.querySelector('[data-lhw-fill]');if(f)f.style.animationPlayState=paused?'paused':'running'});
  });
  pauseBtn.innerHTML=PAUSE_ICON;
  root.addEventListener('mouseenter',()=>{paused=true;thumbs.forEach(th=>{const f=th.querySelector('[data-lhw-fill]');if(f)f.style.animationPlayState='paused'})});
  root.addEventListener('mouseleave',()=>{if(pauseBtn.getAttribute('aria-pressed')==='true')return;paused=false;thumbs.forEach(th=>{const f=th.querySelector('[data-lhw-fill]');if(f)f.style.animationPlayState='running'})});
  root.addEventListener('focusin',()=>{paused=true});
  root.addEventListener('focusout',e=>{if(!root.contains(e.relatedTarget)&&pauseBtn.getAttribute('aria-pressed')!=='true')paused=false});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)return;paint()});
  // Slide inicial sorteado 1x por sessão (sessionStorage); a partir daí a
  // ordem é sempre sequencial fixa a partir desse ponto.
  let startIndex=0;
  try{
    const saved=sessionStorage.getItem('inventario-gamer:v1:home-hero-start');
    if(saved!=null&&!Number.isNaN(parseInt(saved,10)))startIndex=parseInt(saved,10)%slides.length;
    else{startIndex=Math.floor(Math.random()*slides.length);sessionStorage.setItem('inventario-gamer:v1:home-hero-start',String(startIndex))}
  }catch{}
  show(startIndex);
  startInterval();
}
/* ---- 3.4/3.5: Destaques (alternador Em alta/Mais novos/Menor preço) ---- */
function posterPriceChipText(p,platform){
  const cached=bestUsed(p);
  const demo=mockOn()?sampleOffersBestPhysical(p.title,{year:p.year}):null;
  const label=cached?'Usado':demo?.label;
  const value=cached?.minDisplay||demo?.display;
  // Item 2.2: "botão do hero" é um dos 4 lugares nomeados pro selo EXEMPLO.
  return value?heroPriceCtaText(esc(label),esc(value),!cached?mockChip():''):'Ver detalhes';
}
function destaquesSection(order,heroExclude){
  const pool=destaquesPool(order,heroExclude);
  if(!pool.length)return '';
  return `<section class="lux-section home-destaques" aria-labelledby="home-destaques-title" data-lazy-eager>
    <div class="lux-section-head">
      <div>${rowTitleLink('home-destaques-title','Destaques',`#/em-alta?ordem=${order}`)}</div>
      ${destaquesAlternatorMarkup(order)}
    </div>
    <div class="carousel-row-wrap">
      <div class="peek-grid" data-carousel-row="home-destaques" data-scroll-mult="6">${pool.map(posterCard).join('')}</div>
      ${carouselEdgesMarkup('home-destaques')}
    </div>
  </section>`;
}

/* ---- 3.6: Universos em destaque (mesma lista curada da sidebar) ---- */
// Pacote4 1.7 (bug da vistoria): este card tinha data-igdb-cover direto no
// <a> inteiro — hydrateIgdbCovers() faz el.innerHTML=coverTile(...) quando
// acha capa, o que apagava sigla/pílula/nome/contagem/botão (sobrava só a
// capinha, daí o "ponto branco" no canto). Os 3 cards compactos nunca
// tiveram esse bug porque o data-igdb-cover deles fica num <span> interno
// só da capa (.ud-compact-cover), nunca no card inteiro. Fix: tira o
// data-igdb-cover daqui e hidrata à parte com setHeroBackground() (mesmo
// mecanismo do hero de universo — só troca --hero-img/classe, nunca o
// innerHTML), então nome/contagem/pílula/botão SEMPRE ficam no DOM.
function universeDestaqueBig(u){
  const titles=titlesOf(u.slug);
  const rep=representativeFranchiseGame(titles);
  const pal=paletteForUniverse(u);
  const platform=rep?.variants?.[0]?.[1]||'';
  const base=pal?.fundo||'#1f0b14';
  return `<a class="ud-big" href="#/universo/${u.slug}" aria-label="Conhecer o universo ${esc(pal?.nome||u.name)}" data-ud-big-art data-ud-art-title="${esc(rep?igdbTitleFor(rep,platform):u.name)}" data-ud-art-platform="${esc(platform)}" data-ud-art-year="${esc(rep?.year||'')}" style="--ud-base:${esc(base)}">
    <span class="ud-fallback-sigla" aria-hidden="true">${esc(u.sigla)}</span>
    <span class="ud-pill">${esc(PLATFORM_LABEL[u.casa]||'Multi')}</span>
    <span class="ud-name">${esc(pal?.nome||u.name)}</span>
    <span class="ud-count">${titles.length} jogos catalogados</span>
    <span class="btn btn-primary ud-cta">Conhecer o universo →</span>
  </a>`;
}
async function hydrateUniverseDestaqueBig(root){
  const el=root.querySelector('[data-ud-big-art]');
  if(!el)return;
  const d=await fetchIgdbVisual(el.dataset.udArtTitle||'',el.dataset.udArtPlatform||'',el.dataset.udArtYear||'');
  if(!el.isConnected)return;
  if(d?.hero?.url)setHeroBackground(el,d.hero.url);
  else if(d?.cover?.url)setHeroBackground(el,d.cover.url,true);
}
function universeDestaqueCompact(entry,u){
  const titles=titlesOf(u.slug);
  const rep=representativeFranchiseGame(titles);
  const platform=rep?.variants?.[0]?.[1]||'';
  return `<a class="ud-compact" href="#/universo/${u.slug}">
    <span class="ud-compact-cover igdb-cover-slot" data-igdb-cover data-igdb-title="${esc(rep?igdbTitleFor(rep,platform):u.name)}" data-igdb-platform="${esc(platform)}" data-igdb-year="${esc(rep?.year||'')}">${coverTile(u.name,{note:false})}</span>
    <span class="ud-compact-body"><b>${esc(entry.nome||u.name)}</b><small>${titles.length} jogos · ${esc(PLATFORM_LABEL[u.casa]||'Multi')}</small></span>
    <span class="btn btn-ghost btn-sm ud-compact-cta">Ver universo →</span>
  </a>`;
}
function universosDestaqueSection(){
  const entries=SIDEBAR_FEATURED_UNIVERSES.map(e=>({entry:e,u:uMap.get(e.slug)})).filter(x=>x.u).slice(0,4);
  if(!entries.length)return '';
  const [big,...rest]=entries;
  return `<section class="lux-section home-universes" aria-labelledby="home-universes-title" data-lazy-section>
    <div class="lux-section-head"><div>${rowTitleLink('home-universes-title','Universos em destaque','#/universos')}</div></div>
    <div class="home-universes-grid">
      ${universeDestaqueBig(big.u)}
      <div class="home-universes-compact">${rest.map(x=>universeDestaqueCompact(x.entry,x.u)).join('')}</div>
    </div>
  </section>`;
}

/* ---- 3.7: Retrô (mesmo card/expansão de Destaques) ---- */
function retroPool(exclude){
  const rank=p=>{const s=sampleOffers(p.title,{year:p.year});return s.bucket==='both'?3:(s.bucket==='used'||s.bucket==='new')?2:s.bucket==='digital'?1:0};
  return catalog.filter(p=>!exclude.has(p.title)&&p.variants.some(v=>isRetro(v[1])))
    .sort((a,b)=>rank(b)-rank(a))
    .slice(0,12);
}
function retroSection(exclude){
  const pool=retroPool(exclude);
  if(!pool.length)return '';
  return `<section class="lux-section home-retro" aria-labelledby="home-retro-title" data-lazy-section>
    <div class="lux-section-head"><div>${rowTitleLink('home-retro-title','Retrô','#/busca?retro=1')}<p class="row-subtitle">Clássicos, em preço de usado</p></div></div>
    <div class="carousel-row-wrap">
      <div class="peek-grid" data-carousel-row="home-retro" data-scroll-mult="6">${pool.map(posterCard).join('')}</div>
      ${carouselEdgesMarkup('home-retro')}
    </div>
  </section>`;
}

// Pacote4 4.9: a fileira aparece com item real (exemplo:false, sempre
// visível) OU de demonstração (só com o modo demonstração ligado);
// merchItemsVisible() (4.1) já aplica exatamente essa regra — sem item
// nenhum dos dois tipos, cai no fallback "Além dos jogos".
function homeMerchSection(){
  const items=merchItemsVisible().slice(0,12);
  if(!items.length){
    return `<section class="merch-home-stage" aria-labelledby="home-merch-title" data-lazy-section>
      <div class="merch-home-copy"><h2 id="home-merch-title">Além dos jogos</h2><p>Produtos licenciados, criações independentes e peças para transformar coleção em ambiente.</p><a class="btn btn-warm" href="#/merch">Explorar tudo</a></div>
      <div class="merch-home-grid">
        <a class="merch-home-card" href="#/merch?tipo=${enc('oficial,licenciado,nao-confirmado')}"><span class="merch-home-icon">${ico('cube',28)}</span><div><b>Produtos oficiais</b><small>Amiibo, figures, livros e acessórios licenciados.</small></div><span>→</span></a>
        <a class="merch-home-card" href="#/merch?tipo=fan-made"><span class="merch-home-icon">${ico('brush',28)}</span><div><b>Feito por fãs</b><small>Artesanato, impressão 3D e peças autorais.</small></div><span>→</span></a>
      </div>
    </section>`;
  }
  return `<section class="lux-section home-merch-squares" aria-labelledby="home-merch-title" data-lazy-section>
    <div class="lux-section-head"><div>${rowTitleLink('home-merch-title','Colecionáveis e merch','#/merch')}</div></div>
    <div class="merch-square-grid">${items.map(merchSquareCard).join('')}</div>
  </section>`;
}

/* ---- 3.10: título clicável com seta no hover (desktop) + "Ver tudo →" (mobile) ---- */
function rowTitleLink(id,label,href){
  return `<h2 id="${id}"><a class="row-title-link" href="${esc(href)}">${esc(label)}<span class="row-title-arrow" aria-hidden="true">→</span></a></h2><a class="row-see-all-mobile" href="${esc(href)}">Ver tudo →</a>`;
}

function renderHome(){
  setTitle('');
  const params=new URLSearchParams(location.hash.split('?')[1]||'');
  const order=DESTAQUES_ORDERS.some(([k])=>k===params.get('destaques'))?params.get('destaques'):'em-alta';
  const renderId=++homeRenderId;
  const heroSlides=legacyLoadHomeHeroSlides();
  const heroExclude=new Set(heroSlides.map(s=>s.title));
  const destaquesPoolList=destaquesPool(order,heroExclude);
  const retroExclude=new Set([...heroExclude,...destaquesPoolList.map(p=>p.title)]);
  main.innerHTML=`
  ${legacyHomeHeroWideMarkup(heroSlides)}
  ${destaquesSection(order,heroExclude)}
  ${universosDestaqueSection()}
  ${retroSection(retroExclude)}
  ${homeMerchSection()}`;
  const hero=$('[data-lhw]',main);
  legacyInitHomeHeroWide(hero);
  legacyHydrateHomeHeroWide(hero);
  hydrateUniverseDestaqueBig(main);
  initCarouselRows(main);
  // Acima da dobra (hero + Destaques) hidrata na hora; o resto é lazy (3.9).
  hydrateIgdbCovers(main,heroSlides.length*2+destaquesPoolList.length+2);
  initLazySections(main);
  hydrateHoverExpandPrices(destaquesPoolList);
  initHoverExpand(main);
  initStaggerEntrance(main);
  main.addEventListener('click',e=>{
    const btn=e.target.closest('[data-destaques-order]');
    if(!btn)return;
    e.preventDefault();
    history.replaceState(null,'','#/?destaques='+btn.dataset.destaquesOrder);
    renderHome();
  });
}

/* ---------- busca e resultados ---------- */
/* ---------- item 7 (rodada 5): barra de filtros horizontal (desktop) ----------
   Reaproveita a mesma convenção data-filter/data-price de sempre — o
   listener de "change" já escuta em .filters, então só muda o que tem
   dentro, não como o estado é lido/aplicado. */
function fdropCheckList(name,items,isOn,needsSearch){
  const search=needsSearch?`<input type="search" class="fdrop-search" data-dropdown-search placeholder="Buscar...">`:'';
  return `${search}<div class="fdrop-options">${items.map(([val,label])=>`<label><input type="checkbox" data-filter="${name}" data-value="${esc(val)}" ${isOn(val)?'checked':''}> <span>${esc(label)}</span></label>`).join('')}</div>`;
}
function fdrop(id,label,count,panelHtml){
  return `<div class="fdrop" data-dropdown="${id}">
    <button type="button" class="fdrop-btn" aria-expanded="false" aria-haspopup="true">${esc(label)}${count?` <span class="fdrop-count">${count}</span>`:''}<span class="fdrop-caret" aria-hidden="true">⌄</span></button>
    <div class="fdrop-panel" role="group" aria-label="${esc(label)}">${panelHtml}</div>
  </div>`;
}
function sortBarMarkup(sortKey){
  const opts=[['relevancia','Relevância'],['preco-asc','Menor preço'],['preco-desc','Maior preço'],['az','A-Z']];
  const hrefFor=key=>{const p=new URLSearchParams(location.hash.split('?')[1]||'');if(key==='relevancia')p.delete('sort');else p.set('sort',key);return '#/busca?'+p.toString()};
  const current=opts.find(([k])=>k===sortKey)||opts[0];
  return fdrop('sort','Ordenar por: '+current[1],0,`<div class="fdrop-options">${opts.map(([k,l])=>`<a class="fdrop-link" href="${hrefFor(k)}" aria-current="${k===sortKey}">${esc(l)}</a>`).join('')}</div>`);
}
// Pacote4 2.5: filtro "Lançamento" na busca (Todos | Lançados | Pré-venda
// | Em breve) — single-select como Ordenar por, não checkbox múltiplo.
const LANC_OPTS=[['','Todos'],['lancado','Lançados'],['pre-venda','Pré-venda'],['anunciado','Em breve']];
function lancBarMarkup(lanc){
  const hrefFor=key=>{const p=new URLSearchParams(location.hash.split('?')[1]||'');if(key)p.set('lanc',key);else p.delete('lanc');return '#/busca?'+p.toString()};
  const current=LANC_OPTS.find(([k])=>k===lanc)||LANC_OPTS[0];
  return fdrop('lanc','Lançamento: '+current[1],lanc?1:0,`<div class="fdrop-options">${LANC_OPTS.map(([k,l])=>`<a class="fdrop-link" href="${hrefFor(k)}" aria-current="${k===lanc}">${esc(l)}</a>`).join('')}</div>`);
}
function filterBarMarkup(F,platforms){
  const genreItems=GENRES.map(g=>[g.slug,g.label]);
  const platItems=platforms.map(p=>[p,p]);
  return `<div class="filterbar-row">
    ${fdrop('console','Plataforma',F.consoles.size,platItems.length?fdropCheckList('console',platItems,v=>F.consoles.has(v),platItems.length>8)+`<label class="fdrop-extra"><input type="checkbox" data-filter="retro" data-value="1" ${F.retro?'checked':''}> <span>Só retrô</span></label>`:'<p class="fine">Sem plataformas nesta busca.</p>')}
    ${fdrop('cat','Categoria',F.cats.size,fdropCheckList('cat',CATS,v=>F.cats.has(v),CATS.length>8))}
    ${fdrop('genre','Gênero',F.genres.size,fdropCheckList('genre',genreItems,v=>F.genres.has(v),genreItems.length>8))}
    ${fdrop('cond','Condição',F.conds.size,fdropCheckList('cond',[['usado','Usado'],['novo','Novo'],['digital','Digital']],v=>F.conds.has(URL_COND[v]),false))}
    ${lancBarMarkup(F.lanc)}
    ${fdrop('price','Preço',(F.min!=null||F.max!=null)?1:0,`<div class="price-inputs">
      <input type="number" inputmode="decimal" min="0" step="1" placeholder="R$ mín." aria-label="Preço mínimo" data-price="min" value="${F.min??''}">
      <input type="number" inputmode="decimal" min="0" step="1" placeholder="R$ máx." aria-label="Preço máximo" data-price="max" value="${F.max??''}"></div>
      <button type="button" class="btn btn-primary btn-sm btn-block" data-act="apply-pricebar" style="margin-top:10px">Aplicar</button>`)}
    <div class="filterbar-spacer"></div>
    ${sortBarMarkup(F.sort)}
  </div>`;
}
function filtersMarkup(F,platforms,prefix){
  const chk=(name,val,label,on)=>`<label><input type="checkbox" data-filter="${name}" data-value="${esc(val)}" ${on?'checked':''}> <span>${esc(label)}</span></label>`;
  return `
  <div class="fg"><h3>Categoria</h3>${CATS.map(([k,l])=>chk('cat',k,l,F.cats.has(k))).join('')}</div>
  <div class="fg"><h3>Gênero</h3>${GENRES.map(g=>chk('genre',g.slug,g.label,F.genres.has(g.slug))).join('')}</div>
  <div class="fg"><h3>Condição</h3>${['new','used','digital'].map(c=>chk('cond',COND_URL[c],COND_LABEL[c],F.conds.has(c))).join('')}</div>
  <div class="fg"><h3>Plataforma</h3><div class="scroll">${platforms.map(p=>chk('console',p,p,F.consoles.has(p))).join('')||'<span class="fine">Sem plataformas nesta busca.</span>'}</div>
    <label style="margin-top:6px"><input type="checkbox" data-filter="retro" data-value="1" ${F.retro?'checked':''}> <span>Só retrô</span></label></div>
  <div class="fg"><h3>Faixa de preço</h3><div class="price-inputs">
    <input type="number" inputmode="decimal" min="0" step="1" placeholder="R$ mín." aria-label="Preço mínimo" data-price="min" value="${F.min??''}">
    <input type="number" inputmode="decimal" min="0" step="1" placeholder="R$ máx." aria-label="Preço máximo" data-price="max" value="${F.max??''}"></div>
    <p class="fine" style="margin-top:6px">Considera só os preços já consultados.</p></div>`;
}
// Item 7 (rodada 5): "Ordenar por" — só usa preço já em cache (mesma regra
// de sempre, "considera só os preços já consultados"); sem dado, fica no
// fim do critério de preço (nunca derruba o resultado, só não prioriza).
function rowSortPrice(r){
  if(r.kind==='merch')return Number.isFinite(r.item.preco)?r.item.preco:Infinity;
  let min=Infinity;
  ['used','new'].forEach(c=>{const s=summaryOf(c,r.p.title,r.platform);if(s&&s.min!=null)min=Math.min(min,s.min)});
  return min;
}
function rowTitle(r){return r.kind==='merch'?r.item.titulo:r.p.title}
function sortRows(rows,sort){
  if(sort==='preco-asc')rows.sort((a,b)=>rowSortPrice(a)-rowSortPrice(b));
  else if(sort==='preco-desc')rows.sort((a,b)=>rowSortPrice(b)-rowSortPrice(a));
  else if(sort==='az')rows.sort((a,b)=>rowTitle(a).localeCompare(rowTitle(b)));
  return rows;
}
function activeChips(F){
  const chips=[];
  F.cats.forEach(c=>chips.push(['cat',c,catLabel(c)]));
  F.genres.forEach(g=>chips.push(['genre',g,genreLabel(g)]));
  F.conds.forEach(c=>chips.push(['cond',COND_URL[c],COND_LABEL[c]]));
  F.plats.forEach(p=>chips.push(['plat',p,FAMILY_LABEL[p]||p]));
  F.consoles.forEach(c=>chips.push(['console',c,c]));
  if(F.retro)chips.push(['retro','1','Retrô']);
  if(F.universo){const u=uMap.get(F.universo);chips.push(['universo',F.universo,u?u.name:F.universo])}
  if(F.min!=null)chips.push(['min','',`a partir de ${brl(F.min)}`]);
  if(F.max!=null)chips.push(['max','',`até ${brl(F.max)}`]);
  return chips;
}
// Pacote único, seção 5: banner de universo na busca. Regra de disparo —
// sigla só conta com busca >= 2 caracteres e igual à sigla, E com pelo
// menos 1 resultado daquele universo (nunca dispara por sigla "no vácuo",
// ex. "z" sozinho não abre o banner de Zelda); nome/alias exige >= 3
// caracteres como prefixo ou igualdade, e esses sempre valem mesmo com 0%
// dos resultados daquele universo. OU 60%+ dos resultados do mesmo
// universo (fallback antigo, mantido). Tudo lido do catálogo/paleta.
function universeAliasMatch(u,q){
  if(q.length>=3){
    const n=normSearch(u.name);
    if(n===q||n.startsWith(q))return {kind:'name'};
    const sideEntry=SIDEBAR_FEATURED_UNIVERSES.find(e=>e.slug===u.slug);
    const found=a=>{const na=normSearch(a);return na===q||na.startsWith(q)};
    let hit=sideEntry?.aliases?.find(found);
    if(hit)return {kind:'alias',alias:hit};
    const pal=paletteForUniverse(u);
    hit=pal?.aliases?.find(found);
    if(hit)return {kind:'alias',alias:hit};
    // Parte B, item 7b/7d: apelidos de franquia (src/data/search-aliases.json),
    // independentes da paleta de cor (funciona mesmo sem entrada lá ainda).
    hit=(SEARCH_ALIASES[u.slug]||[]).find(found);
    if(hit)return {kind:'alias',alias:hit};
  }
  if(q.length>=2&&u.sigla&&normSearch(u.sigla)===q)return {kind:'sigla'};
  return null;
}
function universeSearchHint(raw,matches){
  const q=normSearch(raw);
  if(q){
    for(const u of universes){
      if(!u.hasCatalog||!titlesOf(u.slug).length)continue;
      const m=universeAliasMatch(u,q);
      if(!m)continue;
      if(m.kind==='sigla'&&!matches.some(x=>x.p.universe===u.slug))continue;
      return {u,...m};
    }
  }
  // Fallback de 60%: mesma régua mínima de 3 caracteres do nome/alias — uma
  // busca de 1-2 letras ("z") gera ruído demais pra virar sinal de universo.
  if(q.length<3||!matches.length)return null;
  const counts=new Map();
  matches.forEach(m=>{if(m.p.universe)counts.set(m.p.universe,(counts.get(m.p.universe)||0)+1)});
  const [topSlug,topCount]=[...counts.entries()].sort((a,b)=>b[1]-a[1])[0]||[];
  if(topSlug&&topCount/matches.length>=0.6){const u=uMap.get(topSlug);return u?{u,kind:'majority'}:null}
  return null;
}
// parteB 6: mesma prioridade do hero da própria página de universo — o
// jogo do 1º slide (o mais recente, newestUniverseGames) primeiro; sem
// cache pra ele, o próximo jogo mais recente que já tiver arte em cache
// (de uma visita anterior à página de universo/jogo ou do hero da home);
// sem nenhum, cai no fallback (degradê + sigla) — nunca dispara fetch novo.
function cachedHeroForUniverse(u){
  const titles=titlesOf(u.slug);
  const byYearDesc=newestUniverseGames(titles,titles.length);
  for(const p of byYearDesc){if(heroImageCache.has(p.slug))return heroImageCache.get(p.slug)}
  return null;
}
function universeSearchBanner(u){
  if(!u)return '';
  const n=titlesOf(u.slug).length;
  const img=cachedHeroForUniverse(u);
  // Pacote único, seção 1: a busca fica no tema neutral inteira — a cor do
  // universo aparece só aqui dentro, nunca mais via applyUniverseChrome()
  // (que mudava a página inteira). --usb-fundo/--usb-acao são variáveis
  // locais deste cartão, declaradas no style= abaixo; o CSS do banner lê
  // elas (com fallback pro --action padrão) em vez de --page-bg/--action
  // globais.
  const pal=paletteForUniverse(u)||PALETA_UNIVERSOS.padrao;
  const styleVars=`--usb-fundo:${pal.fundo};--usb-acao:${pal.acao};--usb-acao-texto:${pal.acaoTexto}`
    +(pal.bannerFocus?`;--usb-focus:${esc(pal.bannerFocus)}`:'')
    +(img?`;--usb-img:url('${esc(img).replace(/'/g,"%27")}')`:'');
  // Item 5.4: nome de EXIBIÇÃO (campo `nome` da paleta, ex. "Super Mario")
  // — o nome interno da franquia no catálogo (u.name) é mais técnico
  // ("Mario"), só cai como fallback sem entrada na paleta.
  const displayName=pal.nome||u.name;
  return `<a class="universe-search-banner${img?' has-image':''}" href="#/universo/${u.slug}" style="${styleVars}">
    ${img?'':`<span class="usb-fallback" aria-hidden="true">${esc(u.sigla)}</span>`}
    <div class="usb-copy"><h2>Conheça o universo ${esc(displayName)}</h2><p>${n} ${n===1?'jogo catalogado':'jogos catalogados'}</p></div>
    <span class="btn usb-cta">Conhecer o universo →</span>
  </a>`;
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
  sortRows(filtered,F.sort);
  const chips=activeChips(F);
  const n=Math.max(12,parseInt(params.get('n')||'12',10)||12);
  const visible=filtered.slice(0,n);
  const uHint=universeSearchHint(raw,matches);
  // parteB 7c: só quando o termo bateu por APELIDO (não nome/sigla/maioria)
  // — nome de exibição vem da paleta (mesmo campo que o banner usa).
  // rodada11, item 7: aviso desligado por ALIAS_NOTE — apelido continua
  // valendo pra busca/autocomplete, só o aviso visual some.
  const aliasNote=ALIAS_NOTE&&uHint?.kind==='alias'?(()=>{
    const pal=paletteForUniverse(uHint.u);
    return {displayName:pal?.nome||uHint.u.name,alias:uHint.alias};
  })():null;
  // Pacote único, seção 1: a busca é sempre tema neutral — a cor do
  // universo não sai mais da página inteira, fica só dentro do banner
  // (ver universeSearchBanner acima). Nada de applyUniverseChrome() aqui.
  setTitle(raw?`Resultados para ${raw}`:'Todos os jogos');
  const heading=raw?`Resultados para “${esc(raw)}”`:'Todos os jogos';
  let body='';
  if(!rows.length){
    logSearchMiss(raw);
    const knownU=raw&&universes.find(u=>normSearch(u.name)===normSearch(raw));
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
    body=`${universeSearchBanner(uHint?.u||null)}
      <div id="rowList">${visible.map(r=>rowMarkup(r,F)).join('')}</div>
      ${filtered.length>visible.length?`<div class="results-more"><button class="btn btn-ghost" data-act="more-rows" data-n="${n+12}">Mostrar mais resultados (${filtered.length-visible.length})</button></div>`:''}`;
  }
  main.innerHTML=`
  <div class="results-head"><div><h1 class="page-h">${heading}</h1><p class="fine" style="margin-top:4px">${filtered.length} ${filtered.length===1?'resultado':'resultados'} · preços sem frete; frete e taxas podem variar</p>${aliasNote?`<p class="fine search-alias-note">Mostrando resultados de <b>${esc(aliasNote.displayName)}</b> (também conhecido como ${esc(aliasNote.alias)})</p>`:''}</div>
    <button class="btn btn-ghost filter-btn" data-act="open-filters">${ico('filter',16)} Filtrar${chips.length?` (${chips.length})`:''}</button></div>
  <aside class="filterbar" aria-label="Filtros">${filterBarMarkup(F,platforms)}</aside>
  ${chips.length?`<div class="chips-active">${chips.map(c=>`<button class="chip-x" data-act="rm-filter" data-k="${c[0]}" data-v="${esc(c[1])}" aria-label="Remover filtro ${esc(c[2])}">${esc(c[2])} ${ico('close',14)}</button>`).join('')}<button class="chip-x chip-x-clear" data-act="clear-filters">Limpar tudo</button></div>`:''}
  <div class="results-full">${body}</div>`;
  const list=$('#rowList');
  if(list)autoloadPrices(visible,token,F);
  main._filtersHtml=filtersMarkup(F,platforms,'m');
  main._filterCount=chips.length;
  main._filterTotal=filtered.length;
  hydrateIgdbCovers(main,12);
}


/* ---------- imagens automáticas IGDB ---------- */
const igdbVisualMemo=new Map();
// Item 8 (rodada 5): cache simples slug->url da última arte de hero
// resolvida pra cada jogo — o banner de universo na busca só mostra
// imagem se já tiver passado por aqui (nunca dispara pedido novo).
const heroImageCache=new Map();
async function fetchIgdbVisual(title,platform='',year='',heroRatio='',heroW=0){
  const key=[title,platform,year,heroRatio,heroW].join('|');
  if(igdbVisualMemo.has(key))return igdbVisualMemo.get(key);

  const p=(async()=>{
    try{
      const qs=new URLSearchParams({q:title});
      if(platform)qs.set('platform',platform);
      if(year)qs.set('year',year);
      if(heroRatio)qs.set('ratio',heroRatio);
      if(heroW)qs.set('heroW',String(Math.round(heroW)));
      const r=await fetch('/api/igdb/game?'+qs.toString(),{headers:{Accept:'application/json'}});
      if(!r.ok)return null;
      const d=await r.json();
      return d&&d.ok&&d.found?d:null;
    }catch{return null}
  })();

  igdbVisualMemo.set(key,p);
  return p;
}
// Pacote 2, item 1.3/1.4: coverMode=true quando a fonte é a CAPA (não a
// artwork) — aplica o mesmo tratamento "ampliada e desfocada" do fundo
// ambiente, mas DENTRO do próprio hero (classe .cover-fallback em vez de
// .has-image), já que não há artwork horizontal de verdade pra cobrir o
// hero com nitidez.
function setHeroBackground(el,url,coverMode){
  if(!el||!url)return;
  el.classList.add(coverMode?'cover-fallback':'has-image');
  el.style.setProperty('--hero-img',`url("${url.replace(/"/g,'%22')}")`);
  const ph=el.querySelector('.game-hero-placeholder');
  if(ph&&!coverMode)ph.remove();
}
function setCoverImage(el,title,platform,url){
  if(!el||!url)return;
  el.innerHTML=coverTile(title,{platform,image:url});
}
async function hydrateIgdbVisuals({title,platform='',year='',heroSelector='.game-hero-art',coverSelector='',slug=''}) {
  const hero=document.querySelector(heroSelector);
  // Pacote único, item 6.3: {fallback:true} em hero-overrides.json pula a
  // IGDB de vez pro hero (mas não pra capa — a capa pequena não sofre o
  // mesmo problema de logo esticado).
  const override=HERO_OVERRIDES[slug||''];
  // Item 2.2: largura renderizada de verdade do hero, pro back-end exigir
  // >= 1.2x dela na arte (evita logo pixelado esticado — ver pickHero()).
  const heroW=hero?hero.getBoundingClientRect().width:0;
  const d=await fetchIgdbVisual(title,platform,year,'',heroW);
  if(!d)return;
  const isGameTheme=document.documentElement.dataset.theme==='game';
  if(hero){
    // Pacote 2, item 1.3/1.4: ordem de fontes pro hero/fundo ambiente —
    // (a) artwork horizontal válida; (b) sem ela, a CAPA ampliada e
    // desfocada; (c) sem capa também, só a cor base (placeholder já
    // presente no HTML cuida disso sozinho).
    const heroUrl=!override?.fallback&&(override?.url||d.hero?.url);
    if(heroUrl){
      setHeroBackground(hero,heroUrl);
      updateAmbientBg(heroUrl,isGameTheme,'art');
    }else if(d.cover?.url){
      setHeroBackground(hero,d.cover.url,true);
      updateAmbientBg(d.cover.url,isGameTheme,'cover');
    }
  }
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
// Pacote 2, item 1.4: fallback sem artwork válida nunca mais mostra um
// rótulo de placeholder ("KEY ART DO JOGO" etc.) — só a sigla, pequena e
// apagada (opacity .10 via CSS, .game-hero-placeholder b).
function heroVisual(title,{image=''}={}){
  const src=localOrRemoteImage(image);
  const h=hashStr(title)%360;
  const style=src
    ?`--hero-img:url("${esc(src)}");--hero-h:${h}`
    :`--hero-img:none;--hero-h:${h}`;
  return `<div class="game-hero-art ${src?'has-image':''}" style='${style}'>
    ${src?'':`<div class="game-hero-placeholder"><b>${esc(initialsOf(title))}</b></div>`}
  </div>`;
}
// pillsHtml (pacote 2, item 2.1): HTML já pronto (pode ter mais de uma
// pílula — disponibilidade + PRÉ-VENDA) — passa por cima de `kicker`
// quando os dois vierem, já que kicker escapa a string (só serve pra
// texto simples de uma pílula só, usado pelas páginas de universo/tema).
function gameHeroMarkup({title,kicker='',copy='',image='',actions='',pillsHtml='',heroClass=''}) {
  return `<section class="game-hero ${heroClass}">
    <div class="game-hero-copy">
      ${pillsHtml||(kicker?`<span class="game-hero-kicker">${esc(kicker)}</span>`:'')}
      <h1>${esc(title)}</h1>
      ${copy?`<p>${esc(copy)}</p>`:''}
      ${actions?`<div class="game-hero-actions">${actions}</div>`:''}
    </div>
    ${heroVisual(title,{image})}
  </section>`;
}
function storePills(names){
  return `<div class="store-pills">${names.filter(Boolean).map(n=>`<span class="store-pill">${esc(n)}</span>`).join('')}</div>`;
}
function offerPageHref(p,platform,cond){
  return `#/ofertas/${p.slug}?plat=${enc(platform)}&cond=${enc(cond)}`;
}

// Pacote 2, item 2.1: pílula de disponibilidade da ficha do jogo —
// deriva da família de console do PRÓPRIO jogo (variants), não da
// franquia inteira. Campo opcional p.exclusivo (true|false|'nintendo'|
// 'playstation'|'xbox') sobrepõe a regra automática quando precisar
// corrigir um caso que o dado de catálogo não modela bem.
function gameConsoleFamilies(p){
  const set=new Set();
  p.variants.forEach(v=>{const k=PLATFORM_ECO_KEY[v[0]];if(k)set.add(k)});
  return set;
}
// Pacote3, item 1.1: texto da pílula trocado de "Exclusivo X" pra "Só em
// console X" (a regra de quando mostrar é a mesma, só mudou o rótulo).
function availabilityPillLabel(p,u){
  if(p.exclusivo===false)return null;
  if(typeof p.exclusivo==='string')return `Só em console ${PLATFORM_LABEL[p.exclusivo]||p.exclusivo}`;
  const families=gameConsoleFamilies(p);
  if(p.exclusivo===true){
    const only=[...families][0];
    return only?`Só em console ${PLATFORM_LABEL[only]}`:null;
  }
  if(families.size===1){
    const only=[...families][0];
    return (u&&u.casa===only)?`Só em console ${PLATFORM_LABEL[only]}`:null;
  }
  if(families.size>=2)return 'Multiplataforma';
  return null;
}
function productHeroPillsMarkup(p,u){
  const avail=availabilityPillLabel(p,u);
  const badge=releaseBadge(p);
  const pills=[];
  if(avail)pills.push(`<span class="avail-pill">${esc(avail)}</span>`);
  if(badge)pills.push(`<span class="game-hero-kicker">${esc(badge)}</span>`);
  return pills.length?`<div class="hero-pills-row">${pills.join('')}</div>`:'';
}

// Pacote4 2.2: selo de formato físico — "Disco" por padrão, ou "Físico ·
// código de download" (+ nota) nos jogos semDisco (ver pacote4 2.1). Nunca
// chamar de "físico" uma oferta sem disco sem esse selo.
function formatBadgeMarkup(p){
  return p.semDisco
    ?'<span class="format-chip format-chip-code">Físico · código de download</span>'
    :'<span class="format-chip">Disco</span>';
}
// Pacote 2, item 2.2: painel de preços em 3 colunas (Novo/Usado/Download),
// agrupadas por rótulo fino (FÍSICO cobre Novo+Usado; DIGITAL é só
// Download). Cada coluna é um bloco inteiro clicável (abre a comparadora
// na aba da condição); sem oferta carregada ainda, esmaece e tira a seta.
function purchasePriceColMarkup(cond,p,platform){
  const label=cond==='new'?'Novo':cond==='used'?'Usado':'Download';
  // Pacote4 2.2/2.3 + ajuste 4B.1: jogo semDisco nunca revende Usado
  // (código de uso único) — nem chega a consultar oferta, fica sempre
  // neste estado fixo, com PRIORIDADE sobre "ainda não lançado" (nunca
  // vai ter Usado de qualquer forma, lançado ou não). Jogo também ainda
  // não lançado ganha uma segunda linha com a data prevista.
  if(cond==='used'&&p.semDisco){
    const notLaunchedYet=releaseState(p)!=='lancado';
    return `<div class="ppanel-col is-empty ppanel-no-resale"><span class="ppanel-cond">${label}</span><span class="ppanel-price-wrap"><span class="ppanel-from">Sem revenda: esta edição física vem com código de download de uso único, sem disco.</span>${notLaunchedYet?`<span class="ppanel-from">${esc(releaseDateDisplay(p))}.</span>`:''}</span></div>`;
  }
  if(cond==='digital'){
    return `<a class="ppanel-col" href="${offerPageHref(p,platform,'digital')}">
      <span class="ppanel-cond">${label}</span>
      <span class="ppanel-price-wrap"><span class="ppanel-from">consultar nas lojas</span></span>
      <span class="ppanel-arrow">→</span>
    </a>`;
  }
  const formatNote=cond==='new'?`${formatBadgeMarkup(p)}${p.semDisco?'<span class="ppanel-format-note">Caixa com código de download, sem disco</span>':''}`:'';
  const s=summaryOf(cond,p.title,platform);
  if(s&&s.status==='ok'&&s.count){
    return `<a class="ppanel-col" href="${offerPageHref(p,platform,cond)}">
      <span class="ppanel-cond">${label}</span>${formatNote}
      <span class="ppanel-price-wrap"><span class="ppanel-from">a partir de</span><strong class="ppanel-price">${esc(s.minDisplay)}</strong>${s.mock?mockChip():''}</span>
      <span class="ppanel-arrow">→</span>
    </a>`;
  }
  if(s&&s.status==='ok'&&!s.count){
    return `<div class="ppanel-col is-empty"><span class="ppanel-cond">${label}</span>${formatNote}<span class="ppanel-price-wrap"><span class="ppanel-from">sem ofertas</span></span></div>`;
  }
  // Pacote3, item 2.1: ainda carregando ou sem fonte real — preço único de
  // sampleOffers(p.title). Se o bucket do jogo não tem essa condição, vira
  // "sem ofertas" de verdade (não inventa mais um preço pra toda condição).
  const demo=sampleOffers(p.title,{year:p.year,semDisco:p.semDisco})[cond];
  if(!demo){
    return `<div class="ppanel-col is-empty"><span class="ppanel-cond">${label}</span>${formatNote}<span class="ppanel-price-wrap"><span class="ppanel-from">sem ofertas</span></span></div>`;
  }
  return `<a class="ppanel-col" href="${offerPageHref(p,platform,cond)}">
    <span class="ppanel-cond">${label}</span>${formatNote}
    <span class="ppanel-price-wrap"><span class="ppanel-from">a partir de</span><strong class="ppanel-price">${esc(demo.display)}</strong>${mockChip()}</span>
    <span class="ppanel-arrow">→</span>
  </a>`;
}
function purchasePricePanelMarkup(p,platform){
  const physical=p.physical!==false;
  const digital=p.digital===true||hasDigital(p,platform);
  // Pacote4 2.5 + ajuste 4B.1: jogo ainda não lançado não tem coluna Usado
  // (não existe o que revender ainda) — EXCETO jogo semDisco, que sempre
  // mostra a coluna (com a mensagem "sem revenda", que tem prioridade
  // sobre "ainda não lançado" — ver purchasePriceColMarkup).
  const notLaunched=releaseState(p)!=='lancado';
  const cols=[];
  if(p.new!==false)cols.push(['new']);
  if(p.semDisco||(!notLaunched&&p.used!==false))cols.push(['used']);
  if(digital)cols.push(['digital']);
  if(!cols.length)return `<div class="purchase-empty">Ainda não há formato de compra catalogado para esta versão.</div>`;
  const fisicoSpan=cols.filter(c=>c[0]!=='digital').length;
  return `<div class="ppanel" id="purchaseOptions" style="--ppanel-cols:${cols.length}">
    ${fisicoSpan?`<div class="ppanel-group" style="--span:${fisicoSpan}">FÍSICO</div>`:''}
    ${digital?`<div class="ppanel-group" style="--span:1">DIGITAL</div>`:''}
    ${cols.map(([cond])=>purchasePriceColMarkup(cond,p,platform)).join('')}
  </div>`;
}
// Pacote4 1.3b: versão compacta (104px) dos 3 cartões de baixo da página de
// plataforma — cartão grande (visualMenuCard, acima) fica só pras outras
// telas que já usavam ele (ex. "Mais para descobrir").
function compactMenuCard({title,copy,kind='collectibles',href='#'}){
  const icon=kind==='fanmade'?ico('brush',26):ico('cube',26);
  return `<a class="cta-compact" href="${href}">
    <span class="cta-compact-icon ${kind}" aria-hidden="true">${icon}</span>
    <span class="cta-compact-body">
      <b>${esc(title)}</b>
      <small>${esc(copy)}</small>
      <span class="cta-compact-link">Explorar →</span>
    </span>
  </a>`;
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
// Pacote 2, item 2.2: card de compra HORIZONTAL (só na ficha do jogo de
// verdade — renderProduct). Classe "horizontal" isola o CSS novo do
// .purchase-module antigo, que /tema/ (renderTheme, página de demo de
// trending) continua usando sem mudança — não fazia parte do pedido desta
// seção e tem outra estrutura de DOM (coluna vertical).
function purchaseModuleHorizontalMarkup(p,platform){
  const cover=visualAsset('games',p.slug,'cover');
  const plats=p.variants.map(v=>v[1]).filter((v,i,a)=>a.indexOf(v)===i);
  return `<article class="purchase-module horizontal" id="comprar-jogo">
    <div class="purchase-cover" id="productCoverSlot">${coverTile(p.title,{platform,image:cover})}</div>
    <div class="purchase-platform-col">
      <h2>Comprar este jogo</h2>
      <p class="purchase-platform-label">Escolha a plataforma</p>
      <div class="plat-row" role="group" aria-label="Plataforma">${plats.map(x=>`<button class="plat-btn" aria-pressed="${x===platform}" data-act="pick-platform" data-slug="${p.slug}" data-plat="${esc(x)}">${esc(x)}</button>`).join('')}</div>
    </div>
    ${purchasePricePanelMarkup(p,platform)}
  </article>`;
}
// Pacote 2, item 2.3: Colecionáveis/Fan-made viram cards horizontais de
// 104px, lado a lado, só na ficha do jogo (visualMenuCard — vertical,
// 205px de arte — continua igual pras outras páginas que o usam).
function collectibleRowCard({title,copy,kind='collectibles',href='#'}){
  const icon=kind==='fanmade'?ico('brush',28):ico('cube',28);
  return `<a class="collectible-row-card ${kind}" href="${esc(href)}">
    <span class="crc-icon">${icon}</span>
    <span class="crc-body"><b>${esc(title)}</b><span class="crc-copy">${esc(copy)}</span></span>
    <span class="crc-cta">Explorar →</span>
  </a>`;
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
  const uDisplayName=u?(paletteForUniverse(u)?.nome||u.name):'';
  // Ajuste 4B.2: jogo ainda não lançado (pré-venda/anunciado) não pode
  // ser marcado "Já tenho" — o botão Salvar (que abre o modal Quero/
  // Tenho/Alerta; não é um favorito à parte, ver openSaveModal) vira
  // texto estático "Em breve" no hero, conforme pacote4 2.5.
  const heroNotLaunched=releaseState(p)!=='lancado';
  const heroActions=`
    ${heroNotLaunched?'<span class="btn save-btn is-disabled" aria-disabled="true">Em breve</span>':saveButton(ref,{label:true})}
    ${u?`<a class="btn btn-ghost" href="#/universo/${u.slug}">Universo ${esc(uDisplayName)} →</a>`:''}`;
  // Item 2.1: a pílula "plataforma · ano" saiu — o parágrafo abaixo do
  // título continua trazendo esse contexto em texto corrido (não é mais
  // pílula), e o kicker vira as novas pílulas (disponibilidade + PRÉ-VENDA).
  // Pacote4 2.4: jogo ainda não lançado troca o ano (que nem existe —
  // collections só tem jogo já saído) pela data prevista.
  const releaseCopy=releaseState(p)!=='lancado'?releaseDateDisplay(p):'';
  const heroCopy=[p.franchise,platform,releaseCopy||p.year].filter(Boolean).join(' · ');
  main.innerHTML=`
  <nav class="crumbs" aria-label="Você está em"><a href="#/">Início</a> › <a href="#/universo/${u.slug}">${esc(u.name)}</a> › <span>${esc(p.title)}</span></nav>
  ${gameHeroMarkup({title:p.title,pillsHtml:productHeroPillsMarkup(p,u),copy:heroCopy,image:heroImage,actions:heroActions,heroClass:'product-hero'})}
  ${purchaseModuleHorizontalMarkup(p,platform)}
  <p class="fine purchase-module-note">Preços de exemplo até a conexão das fontes oficiais.</p>
  <div class="collectible-row-grid">
    ${collectibleRowCard({title:'Colecionáveis e merch',copy:'Amiibo, figures, livros, guias e itens oficiais relacionados ao jogo.',kind:'collectibles',href:`#/merch?universo=${p.universe}&tipo=${enc('oficial,licenciado,nao-confirmado')}`})}
    ${collectibleRowCard({title:'Fan-made e artesanais',copy:'Peças artesanais, decoração e criações de fãs relacionadas ao universo.',kind:'fanmade',href:`#/merch?universo=${p.universe}&tipo=fan-made`})}
  </div>`;
  hydrateIgdbVisuals({
    title:igdbTitleFor(p,platform),
    platform,
    year:p.year||'',
    heroSelector:'.game-hero-art',
    coverSelector:'#productCoverSlot',
    slug:p.slug
  });
  ['used','new'].forEach(async cond=>{
    await fetchCond(p.title,platform,cond);
    if(token!==viewToken)return;
    const slot=$('#purchaseOptions');
    if(slot)slot.outerHTML=purchasePricePanelMarkup(p,platform);
  });
}

/* ---------- comparação de ofertas em página completa ---------- */
// Pacote4 3.3: com link direto (página do jogo na própria loja) o rótulo é
// "Ver na {loja} ↗"; sem link direto (cai na busca da loja), "Buscar na
// {loja} ↗" — pro visitante nunca achar que uma busca é a ficha do jogo.
function digitalOfferCards(p,platform,stores){
  return stores.map(s=>{
    const url=s.direto&&s.storeKey==='PlayStation'?psStoreLocaleBR(s.url):s.url;
    const label=`${s.direto?'Ver na':'Buscar na'} ${s.name} ↗`;
    return `<article class="compare-offer-card digital" data-store-card="${esc(s.storeKey||s.name)}"><div class="compare-source"><b>${esc(s.name)}</b>${retailChip(s.kind)}<span>Mídia digital</span></div><div class="compare-listing"><span class="compare-thumb-empty">${ico('gamepad',20)}</span><div><strong>${esc(p.title)} · ${esc(platform)}</strong><small>${s.direto?'Abre a página do jogo na loja.':'Preço e disponibilidade exibidos na loja.'}</small></div></div><div class="compare-price"><span>Preço</span><b>Consultar</b></div><a class="btn btn-primary" href="${esc(safeUrl(url))}" target="_blank" rel="noopener noreferrer">${esc(label)}</a></article>`;
  }).join('');
}
// Pacote4 3.3: troca o link de busca pelo direto assim que a IGDB (3.1)
// responder — mesma chamada/cache de fetchIgdbVisual que o resto da ficha
// já usa (nenhum pedido novo). Catálogo manual (3.2) já venceu no render
// síncrono; aqui só a IGDB pode ainda melhorar o link.
async function hydrateDigitalStoreLinks(p,platform,selector,stores,token){
  const d=await fetchIgdbVisual(igdbTitleFor(p,platform),platform,p.year||'');
  if(token!==viewToken||!d?.lojas?.length)return;
  const merged=applyDirectStoreLinks(stores,[...catalogStoreLinks(p),...d.lojas]);
  const el=$(selector);
  if(el)el.innerHTML=digitalOfferCards(p,platform,merged);
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
    <a class="btn btn-primary" href="${esc(safeUrl(o.url))}" target="_blank" rel="noopener noreferrer">Ver no site →</a>
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
  <div class="compare-heading">
    <a class="compare-back" href="#/jogo/${p.slug}?plat=${enc(platform)}">← Voltar ao jogo</a>
    <h1>${esc(p.title)}</h1>
    <p>Preços em BRL · confira condição, frete e detalhes antes de comprar.</p>
  </div>
  <div class="compare-filterbar"><div><span>Plataforma</span>${platforms.map(x=>`<a href="${comparisonHref(p,x,cond)}" aria-current="${x===platform}">${esc(x)}</a>`).join('')}</div><div><span>Formato</span><a href="${comparisonHref(p,platform,'all')}" aria-current="${cond==='all'}">Todos</a><a href="${comparisonHref(p,platform,'new')}" aria-current="${cond==='new'}">Novo</a><a href="${comparisonHref(p,platform,'used')}" aria-current="${cond==='used'}">Usado</a>${digitalAvailable?`<a href="${comparisonHref(p,platform,'digital')}" aria-current="${cond==='digital'}">Digital</a>`:''}</div></div>
  <div class="compare-layout">
    <section class="compare-results" aria-labelledby="compare-results-title"><div class="compare-results-head"><div><h2 id="compare-results-title">${esc(condText)} · ${esc(platform)}</h2><p id="compareStatus">Verificando preços e disponibilidade…</p></div><span class="compare-spinner" aria-hidden="true"></span></div><div id="comparisonOffers" class="compare-offers"><div class="compare-loading"><span></span><span></span><span></span></div></div></section>
    <aside class="compare-game-card"><div id="comparisonCover" class="compare-cover">${coverTile(p.title,{platform})}</div><h2>${esc(p.title)}</h2><dl><div><dt>Lançamento</dt><dd id="comparisonYear">${esc(p.year||'—')}</dd></div><div><dt>Plataforma</dt><dd>${esc(platform)}</dd></div><div><dt>Condição buscada</dt><dd>${esc(condText)}</dd></div><div class="compare-detail-row" hidden><dt>Estúdio / publicadora</dt><dd id="comparisonStudio"></dd></div></dl><p id="comparisonSummary" class="compare-summary">A sinopse será carregada com os dados do catálogo IGDB.</p>${p.universe?`<a href="#/universo/${p.universe}">Ver universo ${esc(p.franchise)} →</a>`:''}</aside>
  </div>`;
  hydrateComparisonDetails(p,platform);
  const offers=$('#comparisonOffers'),status=$('#compareStatus');
  if(cond==='all'){
    const stores=digitalAvailable?applyDirectStoreLinks(digitalStores(p,platform),catalogStoreLinks(p)):[];
    if(digitalAvailable&&!stores.length&&p.digitalUrl)stores.push({name:'Loja oficial',url:p.digitalUrl,direto:true});
    const loading='<div class="compare-loading"><span></span><span></span><span></span></div>';
    // Pacote4 2.2/2.5 + ajuste 4B.1: jogo semDisco nunca revende Usado — a
    // mensagem "sem revenda" tem PRIORIDADE sobre "ainda não lançado"
    // (nunca vai ter Usado de qualquer forma); jogo ainda não lançado
    // ganha uma segunda linha com a data prevista. Jogo comum (sem
    // semDisco) ainda não lançado não tem mercado de Usado nenhum ainda.
    const notLaunched=releaseState(p)!=='lancado';
    const noUsedMarket=p.semDisco||notLaunched;
    const usedMsg=p.semDisco
      ?`Sem revenda: esta edição física vem com código de download de uso único, sem disco.${notLaunched?`<br>${esc(releaseDateDisplay(p))}.`:''}`
      :'Ainda não lançado.';
    offers.innerHTML=`<section class="compare-block"><h3>Novo ${formatBadgeMarkup(p)}</h3>${p.semDisco?'<p class="fine">Caixa com código de download, sem disco.</p>':''}<div class="compare-offers" id="cmp-new">${loading}</div></section>
      <section class="compare-block"><h3>Usado</h3>${noUsedMarket?`<div class="empty compact"><p>${usedMsg}</p></div>`:`<div class="compare-offers" id="cmp-used">${loading}</div>`}</section>
      ${stores.length?`<section class="compare-block"><h3>Digital</h3><div class="compare-offers" id="cmp-digital">${digitalOfferCards(p,platform,stores)}</div></section>`:''}`;
    if(stores.length)hydrateDigitalStoreLinks(p,platform,'#cmp-digital',stores,token);
    const [resNew,resUsed]=await Promise.all([fetchCond(p.title,platform,'new'),noUsedMarket?Promise.resolve({offers:[]}):fetchCond(p.title,platform,'used')]);
    if(token!==viewToken)return;
    const fill=(id,res)=>{
      const list=res.offers||[];
      const box=document.getElementById(id);
      if(box)box.innerHTML=list.length?list.map(comparisonOfferCard).join(''):`<div class="empty compact"><p>Sem oferta validada agora. Procure direto: <span class="shortcut-links">${physicalLinks(p.title+' '+platform)}</span></p></div>`;
      return list.length;
    };
    const total=fill('cmp-new',resNew)+(noUsedMarket?0:fill('cmp-used',resUsed));
    const demo=resNew.mock||resUsed.mock;
    status.textContent=`${total?`${total} ${total===1?'oferta':'ofertas'} de preço`:'Nenhuma oferta de preço agora'}${stores.length?` · ${stores.length} ${stores.length===1?'loja digital':'lojas digitais'}`:''}${demo?' · demonstração':''}`;
    comparisonSpinnerOff();
    return;
  }
  if(cond==='digital'){
    const stores=applyDirectStoreLinks(digitalStores(p,platform),catalogStoreLinks(p));
    if(!stores.length&&p.digitalUrl)stores.push({name:'Loja oficial',url:p.digitalUrl,direto:true});
    if(token!==viewToken)return;
    status.textContent=stores.length?`${stores.length} ${stores.length===1?'loja':'lojas'} · preço e disponibilidade na própria loja`:'Consulte as lojas';
    comparisonSpinnerOff();
    offers.innerHTML=stores.length?digitalOfferCards(p,platform,stores):`<div class="empty"><p>Nenhuma loja digital oficial catalogada para esta versão.</p></div>`;
    if(stores.length)hydrateDigitalStoreLinks(p,platform,'#comparisonOffers',stores,token);
    return;
  }
  // Pacote4 2.2/2.5 + ajuste 4B.1: aba Usado isolada num jogo semDisco —
  // PRIORIDADE sobre "ainda não lançado" (nunca vai ter Usado, lançado ou
  // não; nunca sugerir "volte quando o jogo sair" pra esse caso). Jogo
  // comum ainda não lançado continua com a mensagem de "ainda não saiu".
  if(cond==='used'&&p.semDisco){
    const notLaunchedYet=releaseState(p)!=='lancado';
    status.textContent='Sem revenda nesta edição';
    comparisonSpinnerOff();
    offers.innerHTML=`<div class="empty"><h2>Sem revenda (código de uso único)</h2><p>Esta edição física vem com código de download de uso único, sem disco — não há o que revender.${notLaunchedYet?`<br>${esc(releaseDateDisplay(p))}.`:''}</p></div>`;
    return;
  }
  if(cond==='used'&&releaseState(p)!=='lancado'){
    status.textContent='Ainda não lançado';
    comparisonSpinnerOff();
    offers.innerHTML=`<div class="empty"><h2>Ainda não lançado</h2><p>${esc(releaseDateDisplay(p)||'Sem data de lançamento confirmada.')} Volte quando o jogo sair pra ver ofertas de Usado.</p></div>`;
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
// Pacote4 1.3a: igual ao fix de universeOfferPriceChipsMarkup — sem isso o
// botão do hero também caía sempre em "Ver detalhes" no primeiro render
// (summaryOf() só tem cache depois de fetchCond, que aqui nunca rodava).
function universeHeroDemoOffer(p){
  const demo=sampleOffers(p.title,{year:p.year});
  if(demo.used)return {cond:'used',summary:{minDisplay:demo.used.display,mock:true}};
  if(demo.new)return {cond:'new',summary:{minDisplay:demo.new.display,mock:true}};
  return null;
}
function universeHeroCtaMarkup(p,platform){
  const best=universeHeroBestOffer(p,platform)||(mockOn()?universeHeroDemoOffer(p):null);
  if(!best)return `<a class="btn btn-primary" href="#/jogo/${p.slug}?plat=${enc(platform)}">Ver detalhes</a>`;
  return `<a class="btn btn-primary hero-price-btn" href="${comparisonHref(p,platform,best.cond)}" data-universe-hero-price="${esc(p.slug)}">${heroPriceCtaText(esc(COND_LABEL[best.cond]),esc(best.summary.minDisplay),best.summary.mock?mockChip():'')}<span class="hpc-arrow">→</span></a>`;
}
// preferredPlatforms (item 6, rodada 5): na página de plataforma, cada
// slide deve mostrar a variante do jogo QUE PERTENCE à plataforma atual —
// sem isso, pegava sempre variants[0], que podia ser outra plataforma (ex.:
// "Halo Infinite" com variants começando em "PS5" aparecia com PS5 na
// página do Xbox, mesmo sendo franquia Xbox).
function universeHeroMarkup(u,titles,preferredPlatforms){
  const latest=newestUniverseGames(titles,4);
  const slides=latest.length?latest:[null];
  return `<section class="universe-feature-row">
    <div class="game-hero universe-hero" data-home-carousel>
      <div class="universe-hero-slides">${slides.map((p,i)=>{
        const platform=(preferredPlatforms&&p?.variants?.find(v=>preferredPlatforms.includes(v[1]))?.[1])||p?.variants?.[0]?.[1]||'',badge=p&&releaseBadge(p);
        return `<article class="home-feature-slide ${i===0?'is-active':''}" data-home-slide aria-hidden="${i!==0}">
          <div class="universe-hero-art" ${p?`data-igdb-hero-art data-igdb-eager="${i===0}" data-igdb-slug="${esc(p.slug)}" data-igdb-title="${esc(igdbTitleFor(p,platform))}" data-igdb-platform="${esc(platform)}" data-igdb-year="${esc(p.year||'')}"`:''}>
            <span class="game-hero-placeholder"><b>${esc(initialsOf(p?p.title:u.name))}</b></span>
          </div>
          <div class="universe-hero-legibility" aria-hidden="true"></div>
          <div class="game-hero-copy">
            ${badge?`<span class="game-hero-kicker">${esc(badge)}</span>`:''}
            <h1${(p?p.title:'Universo '+u.name).length>32?' class="is-long-title"':''}>${esc(p?p.title:'Universo '+u.name)}</h1>
            <p>${p?`${esc(platform)}${p.year?` · ${esc(p.year)}`:''}`:(titles.length?`${titles.length} jogos catalogados.`:'Catálogo em preenchimento.')}</p>
            ${p?`<div class="game-hero-actions">${universeHeroCtaMarkup(p,platform)}</div>`:''}
          </div>
        </article>`;
      }).join('')}</div>
      ${slides.length>1?`<div class="home-feature-controls" role="group" aria-label="Artes em destaque">${slides.map((_,i)=>`<button type="button" data-home-dot="${i}" aria-current="${i===0}" aria-label="Mostrar destaque ${i+1}"></button>`).join('')}</div>
      <span class="universe-hero-count" data-home-counter aria-hidden="true">1/${slides.length}</span>
      <button type="button" class="home-feature-nav prev" data-home-prev aria-label="Destaque anterior"><span class="hfn-circle" aria-hidden="true">‹</span></button>
      <button type="button" class="home-feature-nav next" data-home-next aria-label="Próximo destaque"><span class="hfn-circle" aria-hidden="true">›</span></button>`:''}
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
    // Item 6 (rodada 5) / pacote único item 6.3: override manual por jogo
    // quando a arte da IGDB é só wordmark/logo (sem cena) —
    // src/data/hero-overrides.json, chave = slug do jogo. {url} troca a
    // arte; {fallback:true} PULA só a artwork/hero (nunca usa wordmark/logo
    // esticado), mas pacote4 1B.4: ainda busca a capa pra aplicar o mesmo
    // tratamento ampliado/desfocado de qualquer hero sem artwork — antes
    // retornava cedo aqui e ficava "quase preto" (só a sigla fantasma sobre
    // a cor base). Sem capa também, cai no degradê da paleta já no HTML
    // (--hero-base), nunca preto liso. {artworkIndex} pediria a lista
    // completa de artworks do jogo, que a API hoje não devolve (só a
    // escolhida pelo back-end) — listado como pendência.
    const override=HERO_OVERRIDES[el.dataset.igdbSlug||''];
    const forceFallback=override?.fallback===true;
    const heroW=el.getBoundingClientRect().width;
    const d=(override?.url&&!forceFallback)?null:await fetchIgdbVisual(el.dataset.igdbTitle||'',el.dataset.igdbPlatform||'',el.dataset.igdbYear||'',UNIVERSE_HERO_RATIO,heroW);
    if(token!==viewToken||!el.isConnected)return;
    // Pacote 2, item 1.3/1.4: (a) artwork horizontal; (b) sem ela, a capa
    // ampliada e desfocada; (c) sem nenhuma, fica no fallback já no HTML.
    const src=!forceFallback&&(override?.url||d?.hero?.url);
    const coverSrc=!src&&d?.cover?.url;
    if(!src&&!coverSrc)return;
    if(src&&el.dataset.igdbSlug)heroImageCache.set(el.dataset.igdbSlug,src);
    el.classList.add(src?'has-image':'cover-fallback');
    el.innerHTML=`<img class="uh-art-img" src="${esc(src||coverSrc)}" alt="" loading="${eager?'eager':'lazy'}" fetchpriority="${eager?'high':'low'}">`;
    if(eager)updateAmbientBg(src||coverSrc,false,src?'art':'cover');
  });
  initHomeCarousel(root);
}
// Pacote4 1.3a: busca a oferta real do(s) jogo(s) em destaque no hero e troca
// o preço de exemplo pelo real quando a API responder — mesma fonte
// (summaryOf/fetchCond) que os cards de oferta já usam, só que aqui o botão
// já nasce com o preço de exemplo (não fica em "Ver detalhes" esperando).
function hydrateUniverseHeroPrices(root,token){
  const btns=$$('[data-universe-hero-price]',root);
  mapLimit(btns,2,async btn=>{
    const slug=btn.dataset.universeHeroPrice;
    const p=catalog.find(x=>x.slug===slug);
    if(!p)return;
    const url=new URL(btn.getAttribute('href'),location.href);
    const platform=url.searchParams.get('plat')||p.variants?.[0]?.[1]||'';
    const conds=['used','new','digital'].filter(cond=>!((cond==='used'&&p.used===false)||(cond==='new'&&p.new===false)));
    await Promise.all(conds.map(cond=>fetchCond(p.title,platform,cond)));
    if(token!==viewToken||!btn.isConnected)return;
    const best=universeHeroBestOffer(p,platform);
    if(!best)return;
    btn.href=comparisonHref(p,platform,best.cond);
    btn.innerHTML=`${heroPriceCtaText(esc(COND_LABEL[best.cond]),esc(best.summary.minDisplay),best.summary.mock?mockChip():'')}<span class="hpc-arrow">→</span>`;
  });
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
// rodada11, item 3: excluir s.mock aqui era a causa do bug (cards sempre
// "Ver detalhes") — fetchCond já injeta o preço de exemplo (sampleOfferList,
// mesma fonte de todo o site) no MESMO cache que summaryOf() lê, com
// mock:true; universeHeroBestOffer (hero do mesmo universo) nunca excluiu
// mock e por isso já mostrava preço — os cards é que estavam mais
// restritivos que o resto do site, não o contrário.
function universeOfferPhysicalBest(p,platform){
  let best=null;
  for(const cond of ['new','used']){
    if((cond==='used'&&p.used===false)||(cond==='new'&&p.new===false))continue;
    const s=summaryOf(cond,p.title,platform);
    if(!s||s.status!=='ok'||!s.count||s.min==null)continue;
    if(!best||s.min<best.summary.min)best={cond,summary:s};
  }
  return best;
}
function universeOfferDigital(p,platform){
  const s=summaryOf('digital',p.title,platform);
  if(!s||s.status!=='ok'||!s.count||s.min==null)return null;
  return s;
}
// Pacote4 1.3a: antes caía direto em "Ver detalhes" sempre que summaryOf()
// ainda não tinha oferta real em cache (ex.: API não respondeu ainda) — sem
// passar por sampleOffers(), a ÚNICA fonte de preço de exemplo do site (ver
// comentário em app-1-core.js). Agora, com o modo demonstração ligado, usa o
// mesmo preço de exemplo que o hero/home já mostram pro mesmo jogo.
// Pacote4 1B.2: o selo EXEMPLO morava DENTRO do chip ("Usado R$ 227,90
// EXEMPLO"), que cortava em cards estreitos (ex.: Xbox "Ofertas em
// destaque"). Agora o chip some só com o preço — o selo vira um selo de
// canto na capa (ver .uoc-mock-badge), controlado por esta função auxiliar.
function universeOfferIsMock(p,platform){
  const best=universeOfferPhysicalBest(p,platform);
  const digital=universeOfferDigital(p,platform);
  if(!best&&!digital){
    if(!mockOn())return false;
    const demo=sampleOffers(p.title,{year:p.year});
    return !!(demo.used||demo.new);
  }
  return !!(best?.summary?.mock||digital?.mock);
}
function universeOfferPriceChipsMarkup(p,platform){
  const best=universeOfferPhysicalBest(p,platform);
  const digital=universeOfferDigital(p,platform);
  if(!best&&!digital){
    if(mockOn()){
      const demo=sampleOffers(p.title,{year:p.year});
      const chips=[];
      if(demo.used)chips.push(`<a class="uoc-chip" href="${comparisonHref(p,platform,'used')}">Usado ${esc(demo.used.display)}</a>`);
      else if(demo.new)chips.push(`<a class="uoc-chip" href="${comparisonHref(p,platform,'new')}">Novo ${esc(demo.new.display)}</a>`);
      if(demo.digital?.consult)chips.push(`<a class="uoc-chip uoc-chip-digital" href="${comparisonHref(p,platform,'digital')}">Digital — consultar</a>`);
      if(chips.length)return chips.join('');
    }
    return `<a class="uoc-chip uoc-chip-wait" href="#/jogo/${p.slug}?plat=${enc(platform)}">Ver detalhes</a>`;
  }
  const chips=[];
  if(best)chips.push(`<a class="uoc-chip" href="${comparisonHref(p,platform,best.cond)}">${esc(COND_LABEL[best.cond])} ${esc(best.summary.minDisplay)}</a>`);
  if(digital)chips.push(`<a class="uoc-chip uoc-chip-digital" href="${comparisonHref(p,platform,'digital')}">Digital ${esc(digital.minDisplay)}</a>`);
  return chips.join('');
}
/* ---------- carrossel de cards (rodada11, item 5) ----------
   Componente único pras fileiras que rolam na horizontal (antes eram dois
   sistemas separados — offer-row com 2 setas na cabeça da seção, peek-row
   com 1 seta de "ver mais" fora da fileira). Agora as duas setas (prev/
   next) ficam DENTRO da fileira, coladas nas bordas esquerda/direita,
   dentro de uma faixa de gradiente — só aparecem no hover da fileira ou
   foco de teclado numa delas (CSS cuida disso via :hover/:focus-visible,
   não JS), e desaparecem no extremo correspondente (JS alterna
   .is-edge-end). data-scroll-mult no track define quantos cards rolam por
   clique (6 na home, 4 no resto — default 4 se o atributo faltar). */
function carouselEdgesMarkup(id){
  return `<button type="button" class="carousel-edge prev" data-carousel-prev="${id}" aria-label="Itens anteriores"><span class="hfn-circle" aria-hidden="true">‹</span></button>
  <button type="button" class="carousel-edge next" data-carousel-next="${id}" aria-label="Próximos itens"><span class="hfn-circle" aria-hidden="true">›</span></button>`;
}
function initCarouselRows(root){
  $$('[data-carousel-row]',root).forEach(track=>{
    const wrap=track.closest('.carousel-row-wrap');
    const id=track.dataset.carouselRow;
    const prev=wrap?.querySelector(`[data-carousel-prev="${id}"]`);
    const next=wrap?.querySelector(`[data-carousel-next="${id}"]`);
    if(!prev||!next)return;
    const mult=Number(track.dataset.scrollMult)||4;
    const step=()=>(track.children[0]?.getBoundingClientRect().width||300)+16;
    const update=()=>{
      const max=track.scrollWidth-track.clientWidth;
      const needsScroll=max>4;
      prev.classList.toggle('is-edge-end',!needsScroll||track.scrollLeft<=4);
      next.classList.toggle('is-edge-end',!needsScroll||track.scrollLeft>=max-4);
    };
    prev.addEventListener('click',()=>track.scrollBy({left:-step()*mult,behavior:'smooth'}));
    next.addEventListener('click',()=>track.scrollBy({left:step()*mult,behavior:'smooth'}));
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
  const isMock=universeOfferIsMock(p,platform);
  return `<article class="universe-offer-card">
    <a class="uoc-cover igdb-cover-slot" href="${mainHref}" data-igdb-cover data-igdb-title="${esc(igdbTitleFor(p,platform))}" data-igdb-platform="${esc(platform)}" data-igdb-year="${esc(p.year||'')}" aria-label="Ver ofertas de ${esc(p.title)}">${coverTile(p.title,{note:false})}</a>
    <span class="corner-mock" data-uoc-mock="${esc(p.slug)}"${isMock?'':' hidden'}>EXEMPLO</span>
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
    if(slot)slot.innerHTML=universeOfferPriceChipsMarkup(p,platform);
    const badge=main.querySelector(`[data-uoc-mock="${p.slug}"]`);
    if(badge)badge.hidden=!universeOfferIsMock(p,platform);
  });
}
// Pacote2, item 5: card com "hover-expand" (ver initHoverExpand) pras
// fileiras Ofertas e Clássicos da home — são jogos de catálogo de verdade,
// então dá pra mostrar as 3 condições com preço próprio. A fileira "Em
// alta" usa os itens de trending (home-trend-card, sem dado de preço
// consistente por condição) e não ganha este tratamento — ver renderHome.
function expandPriceLineMarkup(label,cond,p,platform){
  if(cond==='digital'){
    if(!hasDigital(p,platform))return '';
    const s=summaryOf('digital',p.title,platform);
    if(s&&s.status==='ok'&&s.count&&s.min!=null)return `<a class="hec-price-line" href="${comparisonHref(p,platform,'digital')}"><span class="hec-price-label">${label}</span><b>${esc(s.minDisplay)}</b>${s.mock?mockChip():''}</a>`;
    return `<a class="hec-price-line" href="${comparisonHref(p,platform,'digital')}"><span class="hec-price-label">${label}</span><em>consultar nas lojas</em></a>`;
  }
  // Pacote4 2.5: jogo ainda não lançado não tem mercado de Usado.
  if(cond==='used'&&releaseState(p)!=='lancado')return `<span class="hec-price-line is-off"><span class="hec-price-label">${label}</span><em>em breve</em></span>`;
  if((cond==='new'&&p.new===false)||(cond==='used'&&p.used===false))return `<span class="hec-price-line is-off"><span class="hec-price-label">${label}</span><em>sem ofertas</em></span>`;
  const s=summaryOf(cond,p.title,platform);
  if(s&&s.status==='ok'&&s.count&&s.min!=null)return `<a class="hec-price-line" href="${comparisonHref(p,platform,cond)}"><span class="hec-price-label">${label}</span><b>${esc(s.minDisplay)}</b>${s.mock?mockChip():''}</a>`;
  // Pacote3, item 2.1: preço único de sampleOffers — se o bucket do jogo
  // não tem esta condição, mostra "sem ofertas" de verdade.
  if(mockOn()){
    const demo=sampleOffers(p.title,{year:p.year})[cond];
    if(demo)return `<a class="hec-price-line" href="${comparisonHref(p,platform,cond)}"><span class="hec-price-label">${label}</span><b>${esc(demo.display)}</b>${mockChip()}</a>`;
  }
  return `<span class="hec-price-line is-off"><span class="hec-price-label">${label}</span><em>sem ofertas</em></span>`;
}
function hecExpandedPricesMarkup(p,platform){
  return `${expandPriceLineMarkup('Novo','new',p,platform)}${expandPriceLineMarkup('Usado','used',p,platform)}${expandPriceLineMarkup('Digital','digital',p,platform)}`;
}
function bestOfferHrefFor(p,platform){
  const best=universeOfferPhysicalBest(p,platform),digital=universeOfferDigital(p,platform);
  return best?comparisonHref(p,platform,best.cond):digital?comparisonHref(p,platform,'digital'):`#/jogo/${p.slug}?plat=${enc(platform)}`;
}
// Pacote3, item 3.5: conteúdo do painel de hover-expand (título, meta, 3
// linhas de preço, ações) — extraído da antiga hoverExpandGameCard (pacote2
// 5) pra ser reaproveitado pelo poster-card novo da home (3.5) sem duplicar.
function hecPanelMarkup(p,platform){
  const ref=gameRef(p),on=invGet(ref.id)?.status==='owned';
  // Pacote4 2.5: jogo ainda não lançado não tem o que "ter" — o botão
  // Tenho vira texto estático "Em breve" (sem ação).
  const notLaunched=releaseState(p)!=='lancado';
  const ownBtn=notLaunched
    ?`<span class="btn btn-sm hec-own-btn is-disabled" aria-disabled="true">Em breve</span>`
    :`<button type="button" class="btn btn-sm hec-own-btn ${on?'is-on':''}" data-act="toggle-owned" data-id="${esc(ref.id)}" aria-pressed="${on}">${on?'✓ Na coleção':'♡ Tenho'}</button>`;
  return `<h3 class="hec-title">${esc(p.title)}</h3>
    <p class="hec-meta">${esc(platform)}${p.year?` · ${p.year}`:''}</p>
    <div class="hec-prices" data-hec-prices="${esc(p.slug)}">${hecExpandedPricesMarkup(p,platform)}</div>
    <div class="hec-actions">
      ${ownBtn}
      <a class="btn btn-primary btn-sm" href="${bestOfferHrefFor(p,platform)}">Ver ofertas</a>
    </div>`;
}
// Menor preço físico de exemplo pra um chip de 1 linha (cards de pôster da
// home) — "Usado R$ X" / sem oferta: "Ver detalhes".
// Item 2.2: o selo EXEMPLO fica só nos 4 lugares nomeados no pacote (card
// de compra, comparadora, botão do hero, painel do hover) — este chip de 1
// linha do pôster não é um deles, e o card inteiro já abre num desses
// lugares ao clicar, onde o selo aparece.
function posterPriceChip(p,platform){
  const cached=bestUsed(p);
  const demo=mockOn()?sampleOffersBestPhysical(p.title,{year:p.year}):null;
  const label=cached?'Usado':demo?.label;
  const value=cached?.minDisplay||demo?.display;
  const href=value?bestOfferHrefFor(p,platform):`#/jogo/${p.slug}`;
  return value
    ?`<a class="poster-price" href="${href}">${esc(label)} ${esc(value)}</a>`
    :`<a class="poster-price is-quiet" href="${href}">Ver detalhes</a>`;
}
// Pacote3, item 3.5: pôster 3/4 sem degradê/texto por cima — título,
// plataforma·ano e chip de preço vêm ABAIXO da capa (.hec-fixed mantém essa
// largura original fixa quando o card expande, só o painel lateral some no
// espaço novo — ver initHoverExpand/.hec-fixed no CSS, "nunca esticar a
// capa" valendo tanto aqui quanto no card antigo).
// Pacote4 2.5: selo pequeno de PRÉ-VENDA/EM BREVE no canto superior
// esquerdo do pôster — em wrapper à parte (.hec-cover-wrap), nunca dentro
// de [data-igdb-cover] (hydrateIgdbCovers() troca o innerHTML daquele
// elemento quando acha capa; mesmo cuidado do fix do item 1.7/1B.2).
function posterReleaseBadgeMarkup(p){
  const state=releaseState(p);
  if(state==='lancado')return '';
  return `<span class="corner-mock">${state==='pre-venda'?'PRÉ-VENDA':'EM BREVE'}</span>`;
}
function posterCard(p){
  const platform=p.variants?.[0]?.[1]||'';
  // Pacote5b, item 4: "plataforma(s) · ano" em UMA linha (CSS corta com
  // reticências); texto completo no title="" pra quem passar o mouse.
  const metaFull=`${platShort(p)}${p.year?` · ${p.year}`:''}`;
  return `<article class="hec-card poster-card" data-hec data-hec-slug="${esc(p.slug)}" tabindex="0">
    <div class="hec-fixed">
      <div class="hec-cover-wrap">
        <a class="hec-cover igdb-cover-slot" href="#/jogo/${p.slug}" data-igdb-cover data-igdb-title="${esc(igdbTitleFor(p,platform))}" data-igdb-platform="${esc(platform)}" data-igdb-year="${esc(p.year||'')}">${coverTile(p.title,{note:false})}</a>
        ${posterReleaseBadgeMarkup(p)}
      </div>
      <div class="poster-info">
        <a class="poster-title" href="#/jogo/${p.slug}">${esc(p.title)}</a>
        <p class="poster-meta" title="${esc(metaFull)}">${esc(metaFull)}</p>
        ${posterPriceChip(p,platform)}
      </div>
    </div>
    <div class="hec-panel">${hecPanelMarkup(p,platform)}</div>
  </article>`;
}
async function hydrateHoverExpandPrices(games){
  await mapLimit(games,2,async p=>{
    const platform=p.variants?.[0]?.[1]||'';
    const conds=['used','new'].filter(cond=>!((cond==='used'&&p.used===false)||(cond==='new'&&p.new===false)));
    if(hasDigital(p,platform))conds.push('digital');
    await Promise.all(conds.map(cond=>fetchCond(p.title,platform,cond)));
    const slot=main.querySelector(`[data-hec-prices="${p.slug}"]`);
    if(slot&&slot.isConnected)slot.innerHTML=hecExpandedPricesMarkup(p,platform);
  });
}
// Intenção de 150ms pra abrir/trocar card, 120ms pra fechar; só um aberto por
// vez; nunca em fileiras de resultado de busca (não chamado lá). Desligado
// em touch (sem hover de verdade) e em prefers-reduced-motion.
function initHoverExpand(root){
  if(!matchMedia('(hover:hover) and (pointer:fine)').matches)return;
  const reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
  $$('.hec-card',root).forEach(card=>{
    let openTimer=null,closeTimer=null;
    const track=card.closest('[data-carousel-row]');
    const open=()=>{
      if(track){$$('.hec-card.is-open',track).forEach(c=>{if(c!==card)closeCard(c)})}
      const baseW=card.getBoundingClientRect().width;
      // "Nunca esticar a capa": trava a largura do conteúdo original
      // (.hec-fixed, quando existe — poster-card novo da home) ANTES de
      // alargar o card; o espaço novo (+224px) fica livre só pro painel.
      const fixedWrap=card.querySelector('.hec-fixed');
      if(fixedWrap)fixedWrap.style.width=Math.round(baseW)+'px';
      card.style.flex='0 0 auto';
      card.style.width=Math.round(baseW+224)+'px';
      card.classList.add('is-open');
      if(!reduced&&track){
        const r=card.getBoundingClientRect(),tr=track.getBoundingClientRect();
        if(r.right>tr.right)track.scrollBy({left:r.right-tr.right+24,behavior:'smooth'});
      }
    };
    const closeCard=c=>{
      c.classList.remove('is-open');c.style.flex='';c.style.width='';
      const fw=c.querySelector('.hec-fixed');if(fw)fw.style.width='';
    };
    card.addEventListener('mouseenter',()=>{
      clearTimeout(closeTimer);
      openTimer=setTimeout(open,150);
    });
    card.addEventListener('mouseleave',()=>{
      clearTimeout(openTimer);
      closeTimer=setTimeout(()=>closeCard(card),120);
    });
    card.addEventListener('focusin',open);
    card.addEventListener('focusout',e=>{if(!card.contains(e.relatedTarget))closeCard(card)});
    card.addEventListener('keydown',e=>{if(e.key==='Escape')closeCard(card)});
  });
}
// Pacote2, item 4.1: "Mais para descobrir" troca o grid fixo de 3 cards
// (que sempre aparecia, até sem nenhum item real atrás) por até 3 cards
// largos SÓ pra quem tem conteúdo — Clássicos (retrô da própria franquia),
// Colecionáveis e Fan-made. Sem nenhum card com item: a seção inteira some
// (ver renderUniverse). Imagem: capa de um jogo retrô representativo pra
// Clássicos (mesmo pipeline data-igdb-cover de hydrateIgdbCovers, sem pedido
// novo); Colecionáveis/Fan-made não têm foto de produto no mock atual, então
// usam o fallback oficial do item (gradiente da paleta + ícone).
function discoverMoreCard({href,title,copy,count,kind,coverSlot=''}){
  return `<a class="discover-more-card" href="${href}">
    <span class="dmc-media ${kind}">${coverSlot||`<span class="dmc-fallback-icon">${ico(kind==='classicos'?'retro':kind==='fanmade'?'brush':'cube',30)}</span>`}</span>
    <span class="dmc-body"><b>${esc(title)}</b><em>${esc(copy)}</em></span>
    <span class="dmc-arrow" aria-hidden="true">→</span>
  </a>`;
}
function universeDiscoverMoreSection(u){
  const allTitles=titlesOf(u.slug);
  const retroGames=allTitles.filter(p=>p.variants.some(v=>isRetro(v[1])));
  // Pacote4 4.8: conta e abre os itens de src/data/merch.json do universo
  // — "Colecionáveis e merch" é tudo que NÃO é tipo fan-made; "Fan-made e
  // decoração" é só tipo fan-made.
  const uMerch=merchItemsVisible().filter(i=>i.universo===u.slug);
  const colecionaveis=uMerch.filter(i=>i.tipo!=='fan-made');
  const fanmade=uMerch.filter(i=>i.tipo==='fan-made');
  const cards=[];
  if(retroGames.length){
    const rep=representativeFranchiseGame(retroGames),platform=rep?.variants?.[0]?.[1]||'';
    cards.push(discoverMoreCard({
      href:`#/busca?universo=${u.slug}&retro=1`,kind:'classicos',
      title:'Clássicos',
      copy:`${retroGames.length} jogo${retroGames.length===1?'':'s'} retrô de ${u.name}.`,
      coverSlot:rep?`<span class="igdb-cover-slot" data-igdb-cover data-igdb-title="${esc(igdbTitleFor(rep,platform))}" data-igdb-platform="${esc(platform)}" data-igdb-year="${esc(rep.year||'')}"></span>`:''
    }));
  }
  // rodada11, item 4: Colecionáveis e Fan-made aparecem SEMPRE (estado
  // vazio com "Em breve" em vez de sumir o card) — só Clássicos depende de
  // o universo ter jogo retrô mesmo.
  cards.push(discoverMoreCard({
    href:`#/merch?universo=${u.slug}&tipo=${enc('oficial,licenciado,nao-confirmado')}`,kind:'colecionaveis',
    title:'Colecionáveis e merch',
    copy:colecionaveis.length?`${colecionaveis.length} ${colecionaveis.length===1?'item':'itens'} de ${u.name} pra coleção e decoração.`:`Em breve: itens de ${u.name}.`
  }));
  cards.push(discoverMoreCard({
    href:`#/merch?universo=${u.slug}&tipo=fan-made`,kind:'fanmade',
    title:'Fan-made e decoração',
    copy:fanmade.length?`${fanmade.length} ${fanmade.length===1?'peça autoral feita':'peças autorais feitas'} por fãs.`:`Em breve: itens de ${u.name}.`
  }));
  return `<section class="lux-section universe-discover-more" aria-labelledby="universe-discover-more-title">
    <div class="lux-section-head"><div><h2 id="universe-discover-more-title">Mais para descobrir</h2></div></div>
    <div class="discover-more-grid" style="--dmc-count:${cards.length}">${cards.join('')}</div>
  </section>`;
}
// Painel opaco (superfície tonal, nunca vidro) com a lista completa de jogos
// da franquia, rolagem própria, e o toggle rápido de "Tenho" — fica ao lado
// do hero na aba "tudo" da página de universo.
// Pacote2, item 4.2: barra segmentada abaixo do "X de Y jogos" — 1 segmento
// por jogo até 12; acima disso vira barra contínua (12 segmentos de 8px já
// fica ilegível/apertado pra franquias grandes tipo Call of Duty).
function uinvProgressMarkup(owned,total){
  if(!total)return '';
  if(total<=12)return `<div class="uinv-progress" data-uinv-progress data-total="${total}" role="img" aria-label="${owned} de ${total} jogos marcados como Tenho">${Array.from({length:total},(_,i)=>`<span class="uinv-seg ${i<owned?'is-filled':''}"></span>`).join('')}</div>`;
  const pct=Math.round(owned/total*100);
  return `<div class="uinv-progress uinv-progress-bar" data-uinv-progress data-total="${total}" role="img" aria-label="${owned} de ${total} jogos marcados como Tenho"><span class="uinv-bar-fill" style="width:${pct}%"></span></div>`;
}
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
      ${uinvProgressMarkup(owned,titles.length)}
    </div>
    <ul class="uinv-list">${rows}</ul>
  </aside>`;
}
// Pacote único, item 4.4: contexto de plataforma vindo do diretório/página
// de plataforma (#/universo/:slug?plat=nintendo|playstation|xbox) — filtra
// a lista de jogos da franquia por essa plataforma; chips no topo com
// "Todas" sempre disponível. Franquia continua única por slug (não cria
// rota nova), só filtra o que já mostra.
function platFilterGames(titles,plat){
  if(!plat)return titles;
  return titles.filter(p=>p.variants.some(v=>PLATFORM_ECO_KEY[v[0]]===plat));
}
function platFilterChipsMarkup(slug,tab,plat,plataformas){
  if(!plataformas||!plataformas.length)return '';
  const base=k=>{const p=new URLSearchParams();if(tab&&tab!=='tudo')p.set('tab',tab);if(k)p.set('plat',k);const s=p.toString();return `#/universo/${slug}`+(s?'?'+s:'')};
  const opts=[['','Todas'],...plataformas.map(k=>[k,PLATFORM_LABEL[k]])];
  return `<div class="plat-filter-chips" role="group" aria-label="Filtrar por plataforma">${opts.map(([k,l])=>`<a class="plat-filter-chip" href="${base(k)}" aria-current="${k===plat}">${esc(l)}</a>`).join('')}</div>`;
}
function renderUniverse(slug,params,token){
  const u=uMap.get(slug);
  if(!u)return renderNotFound();
  const tab=params.get('tab')||'tudo';
  const platFilter=['nintendo','playstation','xbox'].includes(params.get('plat'))&&u.plataformas.includes(params.get('plat'))?params.get('plat'):'';
  const titles=platFilterGames(titlesOf(slug),platFilter);
  const tabs=[['tudo','Tudo'],['games','Games'],['digital','Digital'],['colecionaveis','Colecionáveis'],['merch','Merch'],['fanmade','Fan-made']];
  // Pacote4 4.8: abas Colecionáveis/Merch/Fan-made da página de universo
  // também passam a ler merch.json (fonte única) em vez de M.items.
  const MERCH_DECOR_CATS=['decoracao','casa','iluminacao','vestuario','livros-arte'];
  const items=cat=>{
    const uMerch=merchItemsVisible().filter(i=>i.universo===slug);
    if(cat==='fanmade')return uMerch.filter(i=>i.tipo==='fan-made');
    if(cat==='colecionaveis')return uMerch.filter(i=>i.categoria==='colecionaveis'&&i.tipo!=='fan-made');
    if(cat==='merch')return uMerch.filter(i=>MERCH_DECOR_CATS.includes(i.categoria)&&i.tipo!=='fan-made');
    return uMerch;
  };
  setTitle(`Universo ${u.name}`);
  const mine=invList().filter(i=>i.universe===slug);
  const owned=mine.filter(i=>i.status==='owned').length,want=mine.filter(i=>i.status==='wanted'||i.status==='saved').length;
  const emptyCatalog=`<div class="empty"><h2>O catálogo de ${esc(u.name)} ainda está sendo preenchido</h2><p>Enquanto isso, os atalhos abaixo levam à busca nas lojas.</p></div>`;
  let body='',featuredGames=[];
  const platChips=(tab==='tudo'||tab==='games')?platFilterChipsMarkup(slug,tab,platFilter,u.plataformas):'';
  if(tab==='games'){
    body=platChips+(titles.length?`<div class="cards4">${titles.map(p=>gameCard(p)).join('')}</div>`:emptyCatalog+marketShortcuts(u.name));
  }else if(tab==='digital'){
    const dt=titles.filter(p=>p.variants.some(v=>hasDigital(p,v[1])));
    body=(dt.length?`<div class="cards4">${dt.map(p=>gameCard(p,{ctx:p.variants.filter(v=>hasDigital(p,v[1])).map(v=>v[1]).join(' · ')+' · digital'})).join('')}</div>`:'<div class="empty"><p>Nenhum título digital catalogado neste universo ainda.</p></div>')
      +`<div class="section-gap"><h2 class="page-h" style="font-size:19px">Lojas oficiais</h2><p class="lede">Os preços digitais aparecem direto nas lojas.</p><div class="shortcut-links" style="margin-top:12px">${digitalLinks(u.name)}</div></div>`;
  }else if(tab==='colecionaveis'||tab==='merch'||tab==='fanmade'){
    const list=items(tab);
    const c=D.merchCategories.find(x=>x.key===tab);
    body=(list.length?`<div class="merch-square-grid">${list.map(merchSquareCard).join('')}</div>`:'<div class="empty"><p>Ainda não temos itens desta categoria para este universo.</p></div>')
      +`<div class="section-gap"><h2 class="page-h" style="font-size:19px">Buscar nas lojas</h2><p class="lede">${esc(c?c.hint:'')}. Sem integração ainda: os links abrem a busca de cada loja.</p><div class="shortcut-links" style="margin-top:12px">${merchLinks(u.name+' '+(tab==='fanmade'?'artesanal':tab==='colecionaveis'?'colecionável':'decoração'),tab)}</div></div>`;
  }else{
    featuredGames=dailyUniverseSelection(titles,slug,12);
    // parteB 3: "Ver todos" abre a busca já filtrada por este universo (e
    // pela plataforma escolhida, se houver chip ativo) — mesmo destino do
    // título, que também vira link.
    const seeAllHref=`#/busca?universo=${slug}`+(platFilter?`&plat=${enc(platFilter)}`:'');
    const seeAllMarkup=`<div class="universe-offers-head-actions"><a class="universe-see-all" href="${seeAllHref}">Ver todos (${titles.length}) →</a></div>`;
    body=(titles.length?`<section class="universe-game-shelf" aria-labelledby="universe-offers-title"><div class="lux-section-head"><div><h2 id="universe-offers-title"><a class="universe-offers-title-link" href="${seeAllHref}">Encontre o próximo da coleção</a></h2></div>${seeAllMarkup}</div>${platChips}<div class="carousel-row-wrap"><div class="universe-offer-grid" data-carousel-row="uni-offers">${featuredGames.map(universeOfferCard).join('')}</div>${carouselEdgesMarkup('uni-offers')}</div></section>`:platChips+emptyCatalog)
    +universeDiscoverMoreSection(u);
  }
  // Cores do universo (fundo/painel/ação) vêm dos tokens globais que
  // applyUniverseChrome() já definiu no :root pra rota universe-hero — não
  // precisa de style inline aqui, evita duas fontes de cor coexistindo.
  main.innerHTML=`
  <nav class="crumbs" aria-label="Você está em"><a href="#/">Início</a> › <a href="#/games">Games</a> › <span>${esc(u.name)}</span></nav>
  ${tab==='tudo'?`<div class="universe-layout">${universeHeroMarkup(u,titles)}${titles.length?universeInventoryPanel(u,titles):''}</div>`:gameHeroMarkup({
    title:`Universo ${u.name}`,
    copy:`${titles.length?`${titles.length} jogos catalogados.`:'Catálogo em preenchimento.'}${(owned||want)?` Você marcou ${owned} como Tenho e ${want} como Quero.`:''}`,
    image:visualAsset('universes',u.slug,'hero')
  })}
  ${tab==='tudo'?'':`<div class="tabs universe-tabs" role="tablist">${tabs.map(([k,l])=>`<a class="tab" role="tab" href="#/universo/${slug}?tab=${k}" aria-current="${k===tab}">${l}</a>`).join('')}</div>`}
  ${body}`;
  if(tab==='tudo'&&titles.length){hydrateUniverseHero($('[data-home-carousel]',main),token);hydrateUniverseHeroPrices(main,token)}
  if(tab!=='tudo')hydrateFranchiseHero(u,titles);
  // Na aba "tudo", a lista inteira do Meu Inventário também tem
  // data-igdb-cover (mesmo rolando por dentro) — sem folga aqui, uma
  // franquia com mais de 12 jogos comia o limite todo e os cards de
  // oferta (que vêm depois no DOM) nunca chegavam a ser hidratados.
  hydrateIgdbCovers(main,tab==='tudo'?titles.length+featuredGames.length+4:12);
  if(tab==='tudo'&&featuredGames.length)hydrateUniverseOffers(featuredGames,token);
  initCarouselRows(main);
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
    // Pacote3, item 2.1: /tema/ é a vitrine de demo dos destaques (nem
    // sempre tem jogo de catálogo por trás) e sempre mostra Novo+Usado
    // juntos quando configurado assim — usa rawNew/rawUsed (ignora o
    // bucket) pra não quebrar esse layout, mas com o MESMO gerador/hash
    // de preço do resto do site (mesmo título, mesmo valor).
    const s=sampleOffers(title);
    return `<section class="purchase-media-group">
      <div class="purchase-media-head"><div><span class="purchase-media-kicker">MÍDIA</span><h3>Físico</h3></div><span class="purchase-arrow">→</span></div>
      <div class="purchase-price-list">
        <a class="purchase-price-row" href="#/ofertas/${esc(slug)}?plat=${enc(platform)}&cond=new"><span class="purchase-condition">Novo</span><span class="purchase-value"><span class="purchase-from">preço de exemplo</span><strong>${esc(s.rawNew.display)}</strong>${mockChip()}</span><span class="purchase-row-arrow">→</span></a>
        <a class="purchase-price-row" href="#/ofertas/${esc(slug)}?plat=${enc(platform)}&cond=used"><span class="purchase-condition">Usado</span><span class="purchase-value"><span class="purchase-from">preço de exemplo</span><strong>${esc(s.rawUsed.display)}</strong>${mockChip()}</span><span class="purchase-row-arrow">→</span></a>
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
  ${gameHeroMarkup({title:t.title,kicker:sentence(t.tag),copy:t.copy,image:heroImage,actions:heroActions})}
  <p class="fine visual-demo-warning">Referência visual · imagens, disponibilidade e preços demonstrativos continuam identificados até a conexão das fontes oficiais.</p>
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
    ${visualMenuCard({title:'Colecionáveis e merch',copy:'Itens oficiais e colecionáveis relacionados a este jogo ou universo.',kind:'collectibles',image:merchImage,href:u?`#/merch?universo=${u.slug}&tipo=${enc('oficial,licenciado,nao-confirmado')}`:`#/merch?tipo=${enc('oficial,licenciado,nao-confirmado')}`})}
    ${visualMenuCard({title:'Fan-made e artesanais',copy:'Criações de fãs, decoração e peças artesanais relacionadas ao universo.',kind:'fanmade',image:fanImage,href:u?`#/merch?universo=${u.slug}&tipo=fan-made`:'#/merch?tipo=fan-made'})}
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
  const params=new URLSearchParams(location.hash.split('?')[1]||'');
  const order=DESTAQUES_ORDERS.some(([k])=>k===params.get('ordem'))?params.get('ordem'):'em-alta';
  const alternator=destaquesAlternatorMarkup(order,'#/em-alta','ordem');
  let body,pool=null;
  if(order==='em-alta'){
    body=`<div class="section-gap">${D.trendingNow.map(t=>{const cfg=themeDemoConfig(t);return `<article class="trend-row"><div class="igdb-cover-slot" data-igdb-cover data-igdb-title="${esc(t.title)}">${coverTile(t.short,{})}</div>
    <div><h2>${esc(t.title)}</h2><p>${esc(t.copy)}</p></div>
    <div class="trend-actions"><a class="btn btn-primary btn-sm" href="#/tema/${t.slug}">Ver mais →</a><a class="btn btn-ghost btn-sm" href="#/ofertas/${esc(t.slug)}?plat=${enc(cfg.platform)}&cond=digital">Digital / oficial ↗</a></div></article>`}).join('')}</div>`;
  }else{
    pool=destaquesPool(order,new Set());
    body=pool.length?`<div class="carousel-row-wrap"><div class="peek-grid" data-carousel-row="trending-page">${pool.map(posterCard).join('')}</div>${carouselEdgesMarkup('trending-page')}</div>`:'<p class="lede">Nenhum jogo encontrado neste filtro.</p>';
  }
  main.innerHTML=`<h1 class="page-h">Em alta</h1>
  <p class="lede">Assuntos que puxam a busca agora. Curadoria manual de ${esc(D.trendingUpdated)}, com links oficiais. Quando houver dados próprios, esta lista poderá mostrar o que está em alta no Inventário.</p>
  ${alternator}
  ${body}`;
  if(order==='em-alta'){
    hydrateIgdbCovers(main,8);
  }else{
    hydrateIgdbCovers(main,pool.length);
    hydrateHoverExpandPrices(pool);
    initHoverExpand(main);
    initCarouselRows(main);
  }
  main.addEventListener('click',e=>{
    const btn=e.target.closest('[data-destaques-order]');
    if(!btn||!main.contains(btn))return;
    e.preventDefault();
    history.replaceState(null,'',btn.dataset.destaquesBase+'?'+btn.dataset.destaquesParam+'='+btn.dataset.destaquesOrder);
    renderTrendingPage();
  });
}

/* ---------- games (hub de plataformas, fase 3) ---------- */
// Só 3 CTAs (Nintendo/PlayStation/Xbox — casa first-party); Retrô e
// Multiplataforma continuam existindo como destino (goNav via sidebar),
// sem card aqui.
const GAMES_HUB_CASAS=[
  {casa:'nintendo',label:'Nintendo',cls:'eco-nintendo',logo:'/assets/nintendo-logo.svg'},
  {casa:'playstation',label:'PlayStation',cls:'eco-playstation',logo:'/assets/playstation-logo.svg'},
  {casa:'xbox',label:'Xbox',cls:'eco-xbox',logo:null}
];
function gamesHubLinks(casa){
  return universes.filter(u=>u.casa===casa&&u.hasCatalog&&titlesOf(u.slug).length)
    .sort((a,b)=>titlesOf(b.slug).length-titlesOf(a.slug).length||a.name.localeCompare(b.name))
    .slice(0,7)
    .map(u=>`<a href="#/universo/${u.slug}">${esc(u.name)} <small>${titlesOf(u.slug).length}</small></a>`).join('');
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
  const filterTabs=[['','Todos'],['nintendo','Nintendo'],['playstation','PlayStation'],['xbox','Xbox'],['retro','Retrô']];
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
    <div class="lux-section-head"><div><h2 id="games-trend-title">Em alta no catálogo</h2></div></div>
    <div class="tabs" role="tablist" style="margin:-6px 0 18px">${filterTabs.map(([k,l])=>`<a class="tab" role="tab" href="${hrefFor(k)}" aria-current="${k===casaFilter}">${esc(l)}</a>`).join('')}</div>
    <div class="carousel-row-wrap"><div class="home-offer-grid" data-carousel-row="games-trend">${pool.map(p=>homeOfferCard(p)).join('')||'<p class="lede">Nenhum jogo encontrado neste filtro.</p>'}</div>${carouselEdgesMarkup('games-trend')}</div>
  </section>`;
  hydrateIgdbCovers(main,pool.length+GAMES_HUB_CASAS.length*7);
  initCarouselRows(main);
}

/* ---------- diretório de universos (#/universos, fase 4) ----------
   Vidro fumê (item explícito da fase): fundo da página e cards no
   material de --glass-2/--glass-border, sem blur (blur só em header/
   sidebar/painéis grandes, nunca em card — regra geral das fases). */
// Pacote único, item 4.3: jogos catalogados de uma franquia DISPONÍVEIS
// numa plataforma (console de 1ª parte) — conta pro selo de contagem da
// aba e pro critério de ordenação; nunca inclui PC/SEGA/etc.
function gamesOnPlatform(u,plat){
  if(!plat)return titlesOf(u.slug).length;
  return titlesOf(u.slug).filter(p=>p.variants.some(v=>PLATFORM_ECO_KEY[v[0]]===plat)).length;
}
// Pacote5, seção 4: ordem curada primeiro (SIDEBAR_FEATURED_UNIVERSES,
// declarada mais abaixo no arquivo — por isso o Map é montado dentro da
// função, não no topo do módulo), depois alfabética.
function sortUniversesCurated(list){
  const order=new Map(SIDEBAR_FEATURED_UNIVERSES.map((e,i)=>[e.slug,i]));
  return [...list].sort((a,b)=>{
    const ca=order.has(a.slug)?order.get(a.slug):Infinity;
    const cb=order.has(b.slug)?order.get(b.slug):Infinity;
    return ca!==cb?ca-cb:a.name.localeCompare(b.name);
  });
}
function renderUniverses(params){
  setTitle('Universos');
  const q=norm(params.get('q')||'');
  // Pacote único, item 4.1/4.3 + pacote5 seção 4: a aba é uma FAMÍLIA
  // (nintendo/playstation/xbox) — um universo aparece nela por
  // DISPONIBILIDADE real (u.plataformas, derivado dos jogos catalogados
  // em variants[][0]), não pela "casa"/dona da franquia. ?plat= abre
  // já na aba (vem do ladrilho "Ver todos os universos" da plataforma).
  const plat=['nintendo','playstation','xbox'].includes(params.get('plat'))?params.get('plat'):'';
  const list=sortUniversesCurated(universes.filter(u=>u.hasCatalog&&titlesOf(u.slug).length>=3)
    .filter(u=>!plat||u.plataformas.includes(plat))
    .filter(u=>!q||norm(u.name).includes(q)));
  const platTabs=[['','Todos'],['nintendo','Nintendo'],['playstation','PlayStation'],['xbox','Xbox']];
  const hrefFor=k=>{const p=new URLSearchParams();if(k)p.set('plat',k);if(params.get('q'))p.set('q',params.get('q'));const s=p.toString();return '#/universos'+(s?'?'+s:'')};
  main.innerHTML=`
  <h1 class="page-h">Universos</h1>
  <p class="lede">Explore franquias e encontre onde comprar cada jogo.</p>
  <div class="section-gap" style="margin-top:16px"><input id="uniSearchInput" type="search" class="select" placeholder="Buscar universo..." value="${esc(params.get('q')||'')}" style="max-width:320px;width:100%"></div>
  <div class="tabs" role="tablist" style="margin-top:14px">${platTabs.map(([k,l])=>`<a class="tab" role="tab" href="${hrefFor(k)}" aria-current="${k===plat}">${esc(l)}</a>`).join('')}</div>
  <div class="universe-tiles-grid" style="margin-top:24px">${list.map(u=>universeTileMarkup(u,{count:gamesOnPlatform(u,plat)})).join('')||'<p class="lede">Nenhum universo encontrado.</p>'}</div>`;
  hydrateUniverseTiles(main);
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
// Pacote único, item 4.3: a lista "Universos [plataforma]" filtra por
// DISPONIBILIDADE (u.plataformas, derivado dos jogos catalogados), não por
// "casa" — uma franquia multi com jogo nessa plataforma também aparece.
// Ordem: casa === plataforma primeiro, depois por nº de jogos NESSA
// plataforma (não o total da franquia).
function platformUniverses(casa){
  return universes.filter(u=>u.hasCatalog&&u.plataformas.includes(casa))
    .sort((a,b)=>{
      const aHome=a.casa===casa?0:1,bHome=b.casa===casa?0:1;
      if(aHome!==bHome)return aHome-bHome;
      const diff=gamesOnPlatform(b,casa)-gamesOnPlatform(a,casa);
      return diff||a.name.localeCompare(b.name);
    });
}
/* ============================================================
   PACOTE5, SEÇÃO 3 — PÁGINA DE PLATAFORMA: hero largo sem pílula de
   tipo/plataforma, ladrilhos sobrepostos (até 6 universos + "ver
   todos"), 1 linha de destaques (filtra por console via ?console=, URL
   muda por hash normal — botão voltar funciona, sem recarregar a
   página) e caixa de consoles alinhada ao topo dos CARDS (não do
   título). Substitui o layout anterior (hero de universo + "Ofertas em
   destaque" + painel de logotipo/lista de universos + Retrogaming).
   ============================================================ */
function familyPlatforms(fam){return Object.keys(CONSOLES).filter(c=>CONSOLES[c].familia===fam)}
function platformPool(plats){
  const inSet=p=>p.variants.some(v=>plats.includes(v[1]));
  const trendTitles=new Set(D.trendingNow.map(t=>t.title));
  const pool=catalog.filter(inSet);
  const trendGames=pool.filter(p=>trendTitles.has(p.title));
  const rest=pool.filter(p=>!trendTitles.has(p.title)).sort((a,b)=>(Number(b.year)||0)-(Number(a.year)||0));
  return [...trendGames,...rest];
}
function platformConsoleBoxMarkup(fam,label,consolesInfo,totalGames,selectedConsole){
  const logo=PLATFORM_LOGO[fam]?`<img src="${PLATFORM_LOGO[fam]}" alt="${esc(label)}" class="plat-box-logo">`:`<span class="plat-box-logo-fallback">${esc(label)}</span>`;
  return `<aside class="platform-console-box">
    <div class="plat-box-head">${logo}<span class="plat-box-count">${totalGames} jogo${totalGames===1?'':'s'} · ${consolesInfo.length} console${consolesInfo.length===1?'':'s'}</span></div>
    <hr class="plat-box-divider">
    <div class="plat-box-label">Console</div>
    <div class="plat-box-chips">
      <a class="plat-chip ${!selectedConsole?'is-active':''}" href="#/plataforma/${fam}">Todos</a>
      ${consolesInfo.map(c=>`<a class="plat-chip ${selectedConsole===c.name?'is-active':''}" href="#/plataforma/${fam}?console=${enc(c.name)}">${esc(c.name)} <b>${c.count}</b></a>`).join('')}
    </div>
  </aside>`;
}
const FAMILY_LABEL={playstation:'PlayStation',nintendo:'Nintendo',xbox:'Xbox'};
function consoleGameCounts(){
  const counts=new Map();
  catalog.forEach(p=>{
    new Set(p.variants.map(v=>v[1])).forEach(plat=>counts.set(plat,(counts.get(plat)||0)+1));
  });
  return counts;
}
function renderPlatform(slug,params,token){
  const label=PLATFORM_LABEL[slug];
  if(!label)return renderNotFound();
  setTitle(label);
  const fam=slug;
  const plats=familyPlatforms(fam);
  const selectedConsole=plats.includes(params.get('console')||'')?params.get('console'):'';
  const heroSlides=platformHeroSlides(plats);
  const unisAll=platformUniverses(fam);
  const tileUnis=unisAll.slice(0,6);
  // Pacote5b, item 5: "Ver todos →" entra na MESMA fileira (7º ladrilho,
  // mesma largura/altura) quando a plataforma tem mais de 6 universos —
  // nunca mais uma faixa de largura total abaixo dos ladrilhos.
  const moreTile=unisAll.length>6?universeTileMoreMarkup(`#/universos?plat=${fam}`,unisAll.length):'';
  const counts=consoleGameCounts();
  const consolesInfo=sortConsoles(plats.filter(c=>counts.get(c))).map(c=>({name:c,count:counts.get(c)}));
  const totalGames=catalog.filter(p=>p.variants.some(v=>plats.includes(v[1]))).length;
  const pool=platformPool(selectedConsole?[selectedConsole]:plats);
  const rowTitle=selectedConsole?`Jogos de ${selectedConsole}`:'Jogos em destaque';
  const seeAllHref=selectedConsole?`#/busca?plat=${fam}&console=${enc(selectedConsole)}`:`#/busca?plat=${fam}`;
  main.innerHTML=`
  <nav class="crumbs" aria-label="Você está em"><a href="#/">Início</a> › <span>${esc(label)}</span></nav>
  ${homeHeroWideMarkup(heroSlides,{showTypePill:false})}
  ${universeTilesOverlapMarkup(`Universos ${label}`,`#/universos?plat=${fam}`,tileUnis,moreTile)}
  <div class="lux-section-head" style="margin-top:28px"><div><h2 id="plat-destaques-title">${esc(rowTitle)}</h2></div><a class="pill-see-all" href="${esc(seeAllHref)}">Ver todos (${pool.length}) →</a></div>
  <div class="platform-destaques-grid" data-plat-destaques>
    <div class="carousel-row-wrap">
      <div class="peek-grid home-cards" data-carousel-row="plat-destaques" data-scroll-mult="6">${pool.slice(0,12).map(posterCard).join('')||'<p class="lede">Catálogo em preenchimento.</p>'}</div>
      ${carouselEdgesMarkup('plat-destaques')}
    </div>
    ${platformConsoleBoxMarkup(fam,label,consolesInfo,totalGames,selectedConsole)}
  </div>
  <div class="platform-cta-row3">
    ${compactMenuCard({title:'Merch e Colecionáveis',copy:'Amiibo, figures, livros e itens oficiais.',kind:'collectibles',href:`#/merch?tipo=${enc('oficial,licenciado,nao-confirmado')}`})}
    ${compactMenuCard({title:'Fan-made e Decoração',copy:'Peças artesanais, quadros e criações de fãs.',kind:'fanmade',href:'#/merch?tipo=fan-made'})}
  </div>`;
  const hero=$('[data-hhw]',main);
  initHomeHeroWide(hero);
  hydrateHomeHeroWide(hero);
  hydrateUniverseTiles(main);
  initCarouselRows(main);
  hydrateIgdbCovers(main,heroSlides.length*2+tileUnis.length+12);
  hydrateHoverExpandPrices(pool.slice(0,12));
  initHoverExpand(main);
  // Item 3.5: console selecionado rola suavemente até a linha de
  // destaques quando ela está abaixo da dobra.
  if(selectedConsole){
    const sec=$('[data-plat-destaques]',main);
    if(sec&&sec.getBoundingClientRect().top>window.innerHeight*0.6)sec.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth',block:'start'});
  }
}

/* ---------- pacote4 4.6: merch, colecionáveis e fan-made ---------- */
const MERCH_CATEGORIA_LABEL={colecionaveis:'Colecionáveis',decoracao:'Decoração',casa:'Casa',iluminacao:'Iluminação',vestuario:'Vestuário','livros-arte':'Livros e arte'};
const MERCH_CATEGORIA_ORDER=['colecionaveis','decoracao','casa','iluminacao','vestuario','livros-arte'];
function readMerchFilters(params){
  const list=k=>(params.get(k)||'').split(',').map(s=>s.trim()).filter(Boolean);
  const num=k=>{const v=parseFloat(String(params.get(k)||'').replace(',','.'));return Number.isFinite(v)?v:null};
  return {
    universo:new Set(list('universo')),
    categoria:new Set(list('categoria')),
    origem:new Set(list('origem')),
    tipo:new Set(list('tipo')),
    min:num('min'),max:num('max'),
    sort:params.get('sort')||'relevancia'
  };
}
function applyMerchFilters(items,F){
  return items.filter(it=>{
    if(F.universo.size&&!F.universo.has(it.universo||''))return false;
    if(F.categoria.size&&!F.categoria.has(it.categoria))return false;
    if(F.origem.size&&!F.origem.has(it.origem))return false;
    if(F.tipo.size&&!F.tipo.has(it.tipo))return false;
    if(F.min!=null||F.max!=null){
      if(it.preco==null)return false;
      if(F.min!=null&&it.preco<F.min)return false;
      if(F.max!=null&&it.preco>F.max)return false;
    }
    return true;
  });
}
function sortMerchItems(items,sort){
  if(sort==='menor-preco')return [...items].sort((a,b)=>(a.preco??Infinity)-(b.preco??Infinity));
  if(sort==='atualizados')return [...items].sort((a,b)=>String(b.precoAtualizadoEm||'').localeCompare(String(a.precoAtualizadoEm||'')));
  return items;
}
function merchActiveChips(F){
  const chips=[];
  F.universo.forEach(v=>chips.push(['universo',v,uMap.get(v)?.name||v]));
  F.categoria.forEach(v=>chips.push(['categoria',v,MERCH_CATEGORIA_LABEL[v]||v]));
  F.origem.forEach(v=>chips.push(['origem',v,MERCH_ORIGEM_LABEL[v]||v]));
  F.tipo.forEach(v=>chips.push(['tipo',v,MERCH_TIPO_LABEL[v]||v]));
  if(F.min!=null||F.max!=null)chips.push(['preco','','Preço: '+(F.min!=null?brl(F.min):'R$0')+' – '+(F.max!=null?brl(F.max):'∞')]);
  return chips;
}
// Mesma estrutura visual de fdropCheckList (busca), mas com data-mfilter
// em vez de data-filter — os dois nomes nunca podem colidir, senão o
// listener genérico de filtro da busca (escopo .filterbar, redireciona
// pra #/busca) dispararia nesta página também.
function mdropCheckList(name,items,isOn){
  return `<div class="fdrop-options">${items.map(([val,label])=>`<label><input type="checkbox" data-mfilter="${name}" data-value="${esc(val)}" ${isOn(val)?'checked':''}> <span>${esc(label)}</span></label>`).join('')}</div>`;
}
function merchFilterBarMarkup(F,all){
  const universosComItem=[...new Set(all.map(it=>it.universo).filter(Boolean))].map(slug=>[slug,uMap.get(slug)?.name||slug]).sort((a,b)=>a[1].localeCompare(b[1]));
  // "cada categoria sem item fica oculta nos filtros" — mesma regra pra
  // universo/origem/tipo, calculada sobre o conjunto completo (não o já
  // filtrado pelos outros filtros, senão a lista encolheria sozinha).
  const categoriasComItem=MERCH_CATEGORIA_ORDER.filter(c=>all.some(it=>it.categoria===c));
  const origensComItem=['nacional','importado'].filter(o=>all.some(it=>it.origem===o));
  const tiposComItem=['oficial','licenciado','fan-made','nao-confirmado'].filter(t=>all.some(it=>it.tipo===t));
  const sortOpts=[['relevancia','Relevância'],['menor-preco','Menor preço'],['atualizados','Atualizados recentemente']];
  const sortHrefFor=key=>{const p=new URLSearchParams(location.hash.split('?')[1]||'');if(key==='relevancia')p.delete('sort');else p.set('sort',key);return '#/merch?'+p.toString()};
  const current=sortOpts.find(([k])=>k===F.sort)||sortOpts[0];
  return `<div class="filterbar-row merch-filterbar">
    ${fdrop('m-universo','Universo',F.universo.size,universosComItem.length?mdropCheckList('universo',universosComItem,v=>F.universo.has(v)):'<p class="fine">Nenhum item com universo catalogado.</p>')}
    ${fdrop('m-categoria','Categoria',F.categoria.size,mdropCheckList('categoria',categoriasComItem.map(c=>[c,MERCH_CATEGORIA_LABEL[c]]),v=>F.categoria.has(v)))}
    ${fdrop('m-origem','Origem',F.origem.size,mdropCheckList('origem',origensComItem.map(o=>[o,MERCH_ORIGEM_LABEL[o]]),v=>F.origem.has(v)))}
    ${fdrop('m-tipo','Tipo',F.tipo.size,mdropCheckList('tipo',tiposComItem.map(t=>[t,MERCH_TIPO_LABEL[t]]),v=>F.tipo.has(v)))}
    ${fdrop('m-preco','Preço',(F.min!=null||F.max!=null)?1:0,`<div class="price-inputs">
      <input type="number" inputmode="decimal" min="0" step="1" placeholder="R$ mín." aria-label="Preço mínimo" data-mprice="min" value="${F.min??''}">
      <input type="number" inputmode="decimal" min="0" step="1" placeholder="R$ máx." aria-label="Preço máximo" data-mprice="max" value="${F.max??''}"></div>
      <button type="button" class="btn btn-primary btn-sm btn-block" data-act="merch-apply-pricebar" style="margin-top:10px">Aplicar</button>`)}
    <div class="filterbar-spacer"></div>
    ${fdrop('m-sort','Ordenar por: '+current[1],0,`<div class="fdrop-options">${sortOpts.map(([k,l])=>`<a class="fdrop-link" href="${sortHrefFor(k)}" aria-current="${k===F.sort}">${esc(l)}</a>`).join('')}</div>`)}
  </div>`;
}
function renderMerch(params){
  const F=readMerchFilters(params);
  const all=merchItemsVisible();
  const filtered=sortMerchItems(applyMerchFilters(all,F),F.sort);
  const chips=merchActiveChips(F);
  setTitle('Colecionáveis e merch');
  main.innerHTML=`<h1 class="page-h">Colecionáveis e merch</h1>
  <p class="lede">Itens curados à mão — oficiais, licenciados, não confirmados e fan-made. Preço do produto; frete e impostos são calculados na loja pelo seu CEP.</p>
  <aside class="filterbar" aria-label="Filtros">${merchFilterBarMarkup(F,all)}</aside>
  ${chips.length?`<div class="chips-active">${chips.map(c=>`<button class="chip-x" data-act="merch-rm-filter" data-k="${c[0]}" data-v="${esc(c[1])}" aria-label="Remover filtro ${esc(c[2])}">${esc(c[2])} ${ico('close',14)}</button>`).join('')}<button class="chip-x chip-x-clear" data-act="merch-clear-filters">Limpar tudo</button></div>`:''}
  <p class="fine" style="margin:4px 0 14px">${filtered.length} ${filtered.length===1?'item':'itens'}</p>
  ${filtered.length?`<div class="merch-square-grid">${filtered.map(merchSquareCard).join('')}</div>`:`<div class="empty"><h2>Nenhum item com estes filtros</h2><p>Tire algum filtro para ver mais opções.</p><p style="margin-top:12px"><button class="btn btn-outline btn-sm" data-act="merch-clear-filters">Limpar filtros</button></p></div>`}
  <p class="fine" style="margin-top:12px">Alguns links são de afiliado. Se você comprar por eles, o Inventário pode receber uma pequena comissão, sem custo extra para você.</p>`;
}
// Pacote4 4.7: página do item (#/item/{id}) — nunca link direto a partir
// de card/lista (regra fixa do pacote); o card inteiro (4.4) abre aqui, e
// só aqui tem o botão de verdade pra loja.
function renderMerchItem(id,token){
  const it=MERCH_ITEMS.find(x=>x.id===id&&(!x.exemplo||mockOn()));
  if(!it)return renderNotFound();
  const u=it.universo?uMap.get(it.universo):null;
  const pal=u?paletteForUniverse(u):null;
  const base=pal?.fundo||'#1f0b14';
  const art=it.universo?heroImageCache.get(it.universo):null;
  const hasPhoto=!!(it.imagem&&it.imagemAutorizada===true);
  const style=`--ms-base:${esc(base)}${!hasPhoto&&art?`;--ms-img:url("${art.replace(/"/g,'%22')}")`:''}`;
  const media=hasPhoto
    ?`<img class="merch-square-photo" src="${esc(safeUrl(it.imagem))}" alt="" loading="lazy"><span class="merch-photo-credit">Foto: ${esc(it.imagemFonte||'loja')}</span>`
    :`<svg class="merch-cat-icon" width="96" height="96" aria-hidden="true"><use href="assets/icons-categoria.svg#cat-${esc(it.categoria)}"></use></svg>`;
  const{fresh}=merchPriceState(it);
  setTitle(it.titulo);
  main.innerHTML=`<nav class="crumbs" aria-label="Você está em"><a href="#/">Início</a> › <a href="#/merch">Colecionáveis e merch</a> › <span>${esc(it.titulo)}</span></nav>
  <div class="merch-item-layout">
    <div class="merch-item-media ${hasPhoto?'has-photo':(art?'has-art':'')}" style="${style}">${media}</div>
    <div class="merch-item-body">
      <div class="merch-square-chips" style="position:static;margin-bottom:10px"><span class="chip-glass">${esc(MERCH_ORIGEM_LABEL[it.origem]||it.origem)}</span><span class="chip-glass">${esc(MERCH_TIPO_LABEL[it.tipo]||it.tipo)}</span>${it.exemplo?mockChip():''}</div>
      <h1 class="page-h" style="font-size:28px">${esc(it.titulo)}</h1>
      ${u?`<p class="lede">${esc(pal?.nome||u.name)}</p>`:''}
      <div class="merch-item-price">${merchPriceLine(it)}</div>
      <p class="fine" style="margin-top:4px">Preço do produto; frete e impostos calculados na loja pelo seu CEP.</p>
      ${it.origem==='importado'?'<p class="fine">Compra internacional: pode haver ICMS e prazo maior.</p>':''}
      <p class="fine" style="margin-top:10px">Alguns links são de afiliado. Se você comprar por eles, o Inventário pode receber uma pequena comissão, sem custo extra para você.</p>
      <div class="merch-item-actions">
        <a class="btn btn-primary" href="${esc(safeUrl(it.url))}" target="_blank" rel="sponsored noopener">Ver na ${esc(it.loja)} ↗</a>
        <a class="btn btn-ghost btn-sm" href="#/contato?assunto=remocao">Pedir remoção de conteúdo</a>
      </div>
    </div>
  </div>`;
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
// Pacote3, item 3.11: páginas simples atrás dos links do rodapé — só
// "Conteúdo em elaboração" por enquanto (noindex: o texto jurídico de
// verdade quem escreve é o dono, não dá pra inventar Privacidade/Termos).
const SIMPLE_PAGES={
  sobre:'Sobre',contato:'Contato',privacidade:'Privacidade',termos:'Termos de uso','aviso-afiliado':'Aviso de afiliado'
};
// Pacote4 5.2: #/contato?assunto=remocao (link do rodapé) pré-seleciona o
// assunto na página de Contato — texto jurídico de verdade continua por
// conta do dono, isto só mostra qual assunto trouxe a visita.
const CONTATO_ASSUNTOS={remocao:'Remoção de conteúdo'};
function renderSimplePage(slug,params){
  const title=SIMPLE_PAGES[slug];
  if(!title)return renderNotFound();
  setTitle(title);
  const assunto=slug==='contato'?CONTATO_ASSUNTOS[params?.get('assunto')||'']:null;
  // Nota: rota hash de SPA — <meta name="robots"> inserido via innerHTML não
  // tem efeito real de indexação (precisaria estar no <head> estático ou
  // num cabeçalho HTTP); como são só placeholders "em elaboração", motor de
  // busca não tem conteúdo relevante pra indexar de qualquer forma.
  main.innerHTML=`<div class="empty"><h1 class="page-h" style="font-size:22px">${esc(title)}</h1>${assunto?`<p class="fine">Assunto: <b>${esc(assunto)}</b></p>`:''}<p>Conteúdo em elaboração.</p><p style="margin-top:12px"><a class="btn btn-outline btn-sm" href="#/">Voltar ao início</a></p></div>`;
}


/* ---------- navegação: destino único + barra lateral ---------- */
// Destino único de navegação por slug (header, sidebar, hub etc.). Fase 5:
// nintendo/playstation/xbox agora vão pra própria página de plataforma
// (antes caíam na busca filtrada). Retrô ainda não tem rota própria —
// continua na busca filtrada equivalente. Pacote único, item 4.1: "Multi"
// sai da UI como categoria — #/multiplataforma (link antigo, se alguém
// tiver salvo) redireciona pro diretório de universos.
function goNav(slug){
  if(PLATFORM_LABEL[slug])return `#/plataforma/${slug}`;
  const routes={
    universos:'#/universos',
    retro:'#/busca?retro=1',
    multiplataforma:'#/universos',
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
// Parte A, item 6: ícones próprios por plataforma (sidebar) renderizados
// como máscara CSS (mask-image + background-color:currentColor) — mesma
// área 20x20, assumindo a cor do estado (neutro/hover/ativo) como o ícone
// genérico fazia antes. Retrô é um pouco mais largo (24px) porque o
// símbolo do PNG parece menor que os das outras plataformas na mesma área.
const SIDEBAR_MASK_ICON={
  nintendo:{url:'/assets/icon-nintendo.png',width:20},
  playstation:{url:'/assets/icon-playstation.svg',width:20},
  xbox:{url:'/assets/icon-xbox.svg',width:20},
  retro:{url:'/assets/icon-retro.png',width:24}
};
function maskIcon(slug){
  const m=SIDEBAR_MASK_ICON[slug];
  if(!m)return '';
  return `<span class="ico ico-mask" style="width:${m.width}px;-webkit-mask-image:url('${m.url}');mask-image:url('${m.url}')" aria-hidden="true"></span>`;
}
function sidebarItem(slug,label,icon){
  const href=goNav(slug);
  const active=location.hash===href;
  // Pacote2, item 6: Nintendo/PlayStation/Xbox ganham a cor da própria
  // plataforma (paleta-plataformas.json) no hover/estado ativo — as outras
  // linhas da sidebar ficam neutras (ver CSS: só os 3 itens de casa usam
  // --c, as demais não têm essa variável e caem no estilo padrão).
  const casa=['nintendo','playstation','xbox'].includes(slug)?slug:null;
  const c=casa?paletteForPlatform(casa)?.acao:null;
  const style=c?` style="--c:${esc(c)}"`:'';
  const iconHtml=SIDEBAR_MASK_ICON[slug]?maskIcon(slug):ico(icon,20);
  // rodada11, item 6: coluna de ícone de largura fixa (24px, ícone
  // centralizado) — sem isso o ícone mais largo do Retrô (24px, ver
  // SIDEBAR_MASK_ICON) empurrava só o rótulo dele ~4px mais à direita que
  // os outros itens (ícones de 20px).
  return `<a class="sidebar-item${casa?' sidebar-item-casa':''}" href="${href}"${style}${active?' aria-current="page"':''}><span class="sidebar-item-icon">${iconHtml}</span><span class="sidebar-item-label">${esc(label)}</span></a>`;
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
      <div class="sidebar-indicator" data-sidebar-indicator aria-hidden="true"></div>
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
// Pacote3, item 4.1: liga o indicador compartilhado a hover/foco dos itens
// (slide via transform — funciona também com a sidebar recolhida, já que só
// depende de getBoundingClientRect, não de largura fixa). Snap instantâneo
// pro item ativo a cada render (troca de rota já tem o crossfade do 4.2
// cuidando da transição visual maior; a sidebar não remonta nesse momento).
function initSidebarIndicator(root){
  const nav=root.querySelector('.sidebar-nav');
  const indicator=root.querySelector('[data-sidebar-indicator]');
  if(!nav||!indicator)return;
  const items=$$('.sidebar-item',nav);
  const moveTo=el=>{
    if(!el){indicator.classList.remove('is-visible');return}
    const navRect=nav.getBoundingClientRect(),itemRect=el.getBoundingClientRect();
    indicator.style.height=itemRect.height+'px';
    indicator.style.transform=`translateY(${Math.round(itemRect.top-navRect.top)}px)`;
    indicator.style.background=el.classList.contains('sidebar-item-casa')?`color-mix(in oklab,${getComputedStyle(el).getPropertyValue('--c')||'#fff'} 14%,transparent)`:'rgba(255,255,255,.06)';
    indicator.classList.add('is-visible');
  };
  const activeItem=items.find(el=>el.getAttribute('aria-current')==='page');
  moveTo(activeItem||null);
  items.forEach(el=>{
    el.addEventListener('mouseenter',()=>moveTo(el));
    el.addEventListener('focus',()=>moveTo(el));
  });
  nav.addEventListener('mouseleave',()=>moveTo(activeItem||null));
}
function renderSidebar(){
  const html=sidebarContent();
  const desktop=document.getElementById('appSidebar');
  const drawer=document.getElementById('sidebarDrawer');
  if(desktop){desktop.innerHTML=html;initSidebarIndicator(desktop)}
  if(drawer){drawer.innerHTML=html;initSidebarIndicator(drawer)}
  fitAllSidebars();
}
