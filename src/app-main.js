/* ============================================================
   app-main.js — roteador e ligação dos eventos da página · v0.98
   ============================================================ */

/* ---------- rotas ---------- */
function parseHash(){
  let h=location.hash.slice(1)||'/';
  const [path,qs='']=h.split('?');
  return {path:path.replace(/\/$/,'')||'/',params:new URLSearchParams(qs)};
}
function navActive(path){
  $$('.main-nav a,.inv-link').forEach(a=>a.removeAttribute('aria-current'));
  const map={'/games':'nav-universos','/universos':'nav-universos','/merch':'nav-merch','/inventario':'nav-inv'};
  let key=map[path];
  if(path.startsWith('/universo/')||path.startsWith('/busca')||path.startsWith('/jogo/')||path.startsWith('/ofertas/')||path.startsWith('/plataforma/'))key='nav-universos';
  if(key){const el=document.getElementById(key);if(el)el.setAttribute('aria-current','page')}
}
/* ---------- largura real da tela (sem a barra de rolagem) ----------
   100vw em CSS conta a faixa da barra de rolagem como se fosse tela — em
   telas com barra "clássica" (a maioria fora de Mac com scroll por toque)
   isso empurra qualquer elemento alinhado por 100vw pra fora da área
   visível de verdade. document.documentElement.clientWidth já exclui a
   barra; guardamos como variável CSS pra logo/FAB usarem no lugar de vw. */
function updateViewportWidth(){
  document.documentElement.style.setProperty('--viewport-w',document.documentElement.clientWidth+'px');
}
updateViewportWidth();
window.addEventListener('resize',updateViewportWidth);

/* ---------- cabeçalho: cartão de vidro escuro em toda página ---------- */
const siteHeader=$('.site-header'),brandLogo=$('.brand-logo');
// Logo com a mochila nas cores originais + texto branco (não o monograma
// totalmente branco, que achata os detalhes da mochila em cima do vidro
// escuro do cabeçalho — ver ajustes-fase-1, item G).
const MONO_LOGO_WHITE='/assets/inventario-logo-darkbg-216.png?v=rodada11';
// O cabeçalho é sempre vidro escuro agora (não só sobre o bloco de cor do
// universo) — a logo fica sempre na versão clara, em qualquer scroll.
brandLogo.src=MONO_LOGO_WHITE;
function syncHeaderScroll(){
  siteHeader.classList.toggle('is-scrolled',window.scrollY>40);
}
// Fase 6, fundo ambiente (atrás da flag AMBIENT_BG): reaproveita a MESMA
// imagem do hero já carregada (sem pedido novo). Estático — nada de scroll
// ou animação — e desligado no mobile/prefers-reduced-motion (CSS cuida
// disso; aqui só liga/desliga a camada e troca a url quando muda o hero).
const ambientBgEl=document.getElementById('ambientBg');
const ambientShadeEl=document.getElementById('ambientShade');
// Pacote único, seção 1 (tema [game]): a camada de keyart desfocada passa a
// ser sempre ligada na ficha do jogo/comparadora (force=true, chamado do
// route() abaixo) — AMBIENT_BG continua só pra qualquer outro uso opcional
// que venha a existir fora do tema game.
// Pacote 2, item 1.3: mode='art' (artwork horizontal, scale 1.15) ou
// mode='cover' (capa ampliada, scale 1.5 — precisa de mais zoom pra
// cobrir o fundo já que a capa é vertical/quadrada, não widescreen).
function updateAmbientBg(url,force,mode){
  if(!(force||AMBIENT_BG)||!ambientBgEl){
    if(ambientBgEl)ambientBgEl.hidden=true;
    if(ambientShadeEl)ambientShadeEl.hidden=true;
    return;
  }
  if(!url){
    ambientBgEl.hidden=true;ambientBgEl.style.backgroundImage='';
    if(ambientShadeEl)ambientShadeEl.hidden=true;
    return;
  }
  ambientBgEl.style.backgroundImage=`url("${url}")`;
  ambientBgEl.classList.toggle('ambient-cover',mode==='cover');
  ambientBgEl.hidden=false;
  if(ambientShadeEl)ambientShadeEl.hidden=false;
}
// <meta name="theme-color"> acompanha --page-bg (pacote único, seção 1).
const themeColorMeta=document.getElementById('themeColorMeta');
function syncThemeColorMeta(){
  if(!themeColorMeta)return;
  const bg=getComputedStyle(document.documentElement).getPropertyValue('--page-bg').trim();
  if(bg)themeColorMeta.setAttribute('content',bg);
}
const rootStyle=document.documentElement.style;
// Ajustes fase 1, item E: paleta por universo (src/data/paleta-universos.json,
// via paletteForUniverse() em app-1-core.js). --page-bg/--panel-base/--action/
// --on-action nascem no :root com os valores do bloco "padrao" (home e
// universo sem entrada própria) — aqui só sobrescreve quando há paleta.
function applyUniverseChrome(pal){
  if(pal){
    rootStyle.setProperty('--page-bg',pal.fundo);
    rootStyle.setProperty('--panel-base',pal.painel);
    rootStyle.setProperty('--action',pal.acao);
    rootStyle.setProperty('--on-action',pal.acaoTexto);
  }else{
    rootStyle.removeProperty('--page-bg');
    rootStyle.removeProperty('--panel-base');
    rootStyle.removeProperty('--action');
    rootStyle.removeProperty('--on-action');
  }
  syncHeaderScroll();
}
window.addEventListener('scroll',()=>{
  if(!document.body.classList.contains('universe-hero-route'))return;
  syncHeaderScroll();
},{passive:true});

document.body.classList.toggle('hide-breadcrumb',!SHOW_BREADCRUMB);
function route(){
  const {path,params}=parseHash();
  closeOverlay('offerOverlay');closeOverlay('saveOverlay');closeOverlay('filterOverlay');
  const token=++viewToken;
  document.body.classList.toggle('inventory-route',path==='/inventario');
  // Item 5 (rodada 5): ficha do jogo e comparadora migram 100% pro vidro
  // fumê também — cor base vem da paleta do universo do próprio jogo
  // (sem universo, cai no bloco "padrao", igual ao resto do site).
  const platformSlug=path.startsWith('/plataforma/')?path.slice(12):null;
  const gameSlug=path.startsWith('/jogo/')?path.slice(6):path.startsWith('/ofertas/')?path.slice(9):null;
  const gameUniverse=gameSlug?uMap.get(catalogBySlug.get(gameSlug)?.universe):null;
  const isUniverseRoute=path.startsWith('/universo/');
  // Pacote 2, item 1.1: nenhuma rota pode cair no tema claro antigo —
  // dark-surface-route vira incondicional (era só home/busca/universos/
  // plataforma/jogo; universo em qualquer aba != "tudo", /merch,
  // /inventario, /tema/:slug e /em-alta ficavam de fora e caíam no bege).
  document.body.classList.add('dark-surface-route');
  // universe-hero-route continua só pra aba "tudo" (é o hero grande +
  // Meu Inventário ao lado; as outras abas usam o cabeçalho compacto
  // gameHeroMarkup) — mas o TEMA universe agora vale pra franquia inteira,
  // em qualquer aba.
  const isUniverseHero=isUniverseRoute&&(params.get('tab')||'tudo')==='tudo';
  document.body.classList.toggle('universe-hero-route',isUniverseHero);
  // Pacote único, seção 1: data-theme no <html> — neutral (home/busca/
  // diretório/games/em-alta/ofertas/merch/inventário/tema e qualquer rota
  // fora da lista), platform, universe ou game. Trocado aqui a cada rota;
  // os componentes só leem variável (ver style.css).
  const pageTheme=gameSlug?'game':platformSlug?'platform':isUniverseRoute?'universe':'neutral';
  document.documentElement.setAttribute('data-theme',pageTheme);
  applyUniverseChrome(isUniverseRoute?paletteForUniverse(uMap.get(path.slice(10))):platformSlug?paletteForPlatform(platformSlug):gameSlug?paletteForUniverse(gameUniverse):null);
  updateAmbientBg(null,pageTheme==='game');
  syncThemeColorMeta();
  navActive(path);
  // Pacote único, item 4.1: #/multiplataforma (rota antiga, link salvo por
  // alguém) redireciona pro diretório — "Multi" não é mais categoria própria.
  if(path==='/multiplataforma'){location.replace('#/universos');return}
  if(path==='/'||path==='')renderHome();
  else if(path==='/busca')renderSearch(params,token);
  else if(path.startsWith('/jogo/'))renderProduct(path.slice(6),params,token);
  else if(path.startsWith('/ofertas/'))renderOfferComparison(path.slice(9),params,token);
  else if(path.startsWith('/universo/'))renderUniverse(path.slice(10),params,token);
  else if(path.startsWith('/plataforma/'))renderPlatform(path.slice(12),params,token);
  else if(path.startsWith('/tema/'))renderTheme(path.slice(6));
  else if(path==='/em-alta')renderTrendingPage();
  else if(path==='/games')renderGames(params);
  else if(path==='/universos')renderUniverses(params);
  else if(path==='/merch')renderMerch(params);
  else if(path.startsWith('/item/'))renderMerchItem(path.slice(6),token);
  else if(path==='/inventario')renderInventory(params);
  else if(SIMPLE_PAGES[path.slice(1)])renderSimplePage(path.slice(1));
  else renderNotFound();
  main.focus({preventScroll:true});
  window.scrollTo(0,0);
  closeSuggest();
  closeSidebarDrawer();
  syncSidebarMode();
  renderSidebar();
  // Pacote3, item 4.2: só o miolo (#main) faz crossfade na troca de rota —
  // header/sidebar não entram nesse efeito (renderSidebar acima já rodou,
  // sem fade). O conteúdo novo já está no DOM (innerHTML trocado de forma
  // síncrona pelos render*); o duplo rAF garante que o navegador pinte o
  // frame com opacity:0 antes de soltar pra opacity:1, virando um fade-in
  // do conteúdo novo (scroll pro topo já aconteceu acima, sem flash).
  main.classList.add('route-fade');
  requestAnimationFrame(()=>requestAnimationFrame(()=>main.classList.remove('route-fade')));
  // Pacote2, item 3.5: o campo do cabeçalho só mostra o texto digitado na
  // própria rota de resultado (#/busca) — em qualquer outra rota ele some,
  // pra não ficar um texto "fantasma" de uma busca antiga enquanto navega.
  syncSearchFieldWithRoute(path,params);
}
window.addEventListener('hashchange',route);

/* ---------- busca do cabeçalho + autocomplete ---------- */
const searchInput=$('#searchInput'),suggestBox=$('#suggest'),searchClearBtn=$('#searchClear');
function syncSearchFieldWithRoute(path,params){
  searchInput.value=path==='/busca'?(params.get('q')||''):'';
  syncSearchClearBtn();
}
function syncSearchClearBtn(){
  if(searchClearBtn)searchClearBtn.hidden=!searchInput.value;
}
searchClearBtn?.addEventListener('click',()=>{
  searchInput.value='';
  syncSearchClearBtn();
  closeSuggest();
  searchInput.focus();
});
let sIndex=-1;
function goSearch(q){location.hash='#/busca?q='+enc(q)}
function closeSuggest(){suggestBox.hidden=true;sIndex=-1;searchInput.setAttribute('aria-expanded','false')}
function renderSuggest(raw){
  const list=suggestions(raw);
  if(!list.length){closeSuggest();return}
  suggestBox.innerHTML=`<div class="sg-head">Sugestões</div>${list.map((s,i)=>{
    if(s.type==='universe')return `<a class="sg-item" href="#/universo/${s.u.slug}" data-i="${i}"><span class="cover mini" style="--h:${hashStr(s.u.name)%360}" aria-hidden="true"><span class="cv-ini">${esc(initialsOf(s.u.name))}</span></span><span><span class="sg-title">${esc(s.u.name)}</span><br><span class="sg-sub">Ver universo</span></span><span></span></a>`;
    const p=s.p,price=suggestPrice(p);
    return `<a class="sg-item" href="#/jogo/${p.slug}" data-i="${i}"><span class="cover mini" data-sg-slug="${esc(p.slug)}" style="--h:${hashStr(p.title)%360}" aria-hidden="true"><span class="cv-ini">${esc(initialsOf(p.title))}</span></span><span><span class="sg-title">${esc(p.title)}</span><br><span class="sg-sub">${esc(platShort(p))}</span></span><span class="sg-price">${price}</span></a>`;
  }).join('')}`;
  suggestBox.hidden=false;sIndex=-1;searchInput.setAttribute('aria-expanded','true');
  hydrateSuggestCovers(list);
}
// Pacote2, item 3.5: a sugestão nasce com a sigla (igual sempre foi) e troca
// pra capa real se/quando o IGDB responder — reaproveita o MESMO cache de
// fetchIgdbVisual (app-3-views.js) usado na ficha do jogo, sem pedido novo
// se o título já tiver passado por lá. Sem resposta (ou sem rede): fica na
// sigla, que já é o fallback funcional.
function hydrateSuggestCovers(list){
  list.forEach(s=>{
    if(s.type==='universe')return;
    const p=s.p;
    const el=suggestBox.querySelector(`[data-sg-slug="${p.slug}"]`);
    if(!el)return;
    fetchIgdbVisual(p.title,'',p.year||'').then(d=>{
      const url=d?.cover?.url;
      if(!url)return;
      const stillThere=suggestBox.querySelector(`[data-sg-slug="${p.slug}"]`);
      if(stillThere){stillThere.classList.add('has-image');stillThere.innerHTML=`<img class="cv-img" src="${esc(url)}" alt="" loading="lazy" referrerpolicy="no-referrer">`}
    }).catch(()=>{});
  });
}
searchInput.addEventListener('input',()=>{renderSuggest(searchInput.value);syncSearchClearBtn()});
searchInput.addEventListener('focus',()=>{if(searchInput.value.trim().length>=2)renderSuggest(searchInput.value)});
searchInput.addEventListener('keydown',e=>{
  const items=$$('.sg-item',suggestBox);
  if(e.key==='ArrowDown'&&!suggestBox.hidden){e.preventDefault();sIndex=Math.min(sIndex+1,items.length-1);items.forEach((it,i)=>it.setAttribute('aria-selected',i===sIndex));items[sIndex]?.scrollIntoView({block:'nearest'})}
  else if(e.key==='ArrowUp'&&!suggestBox.hidden){e.preventDefault();sIndex=Math.max(sIndex-1,0);items.forEach((it,i)=>it.setAttribute('aria-selected',i===sIndex));items[sIndex]?.scrollIntoView({block:'nearest'})}
  else if(e.key==='Enter'){e.preventDefault();if(sIndex>=0&&items[sIndex])items[sIndex].click();else{closeSuggest();goSearch(searchInput.value.trim())}}
  else if(e.key==='Escape')closeSuggest();
});
document.addEventListener('click',e=>{if(!e.target.closest('.search'))closeSuggest()});
$('#searchGo').addEventListener('click',()=>{closeSuggest();goSearch(searchInput.value.trim())});

/* ---------- toast ---------- */
let toastTimer=null;
function toast(msg){const el=$('#toast');el.textContent=msg;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),3600)}

/* ---------- overlays genéricos ---------- */
function openOverlay(id){const el=document.getElementById(id);el.classList.add('open');document.body.style.overflow='hidden';const f=el.querySelector('[data-autofocus]')||el.querySelector('button,input,a');f&&f.focus()}
function closeOverlay(id){const el=document.getElementById(id);if(!el)return;el.classList.remove('open');if(!$$('.overlay.open').length)document.body.style.overflow=''}
document.addEventListener('keydown',e=>{if(e.key==='Escape')$$('.overlay.open').forEach(o=>closeOverlay(o.id))});
$$('.overlay').forEach(o=>o.addEventListener('click',e=>{if(e.target===o)closeOverlay(o.id)}));

/* ---------- modal de ofertas ---------- */
let offerState=null;
function offersRowMarkup(o){
  const img=safeUrl(o.image);
  return `<div class="orow">${img!=='#'?`<img class="o-thumb" src="${esc(img)}" alt="" loading="lazy" referrerpolicy="no-referrer">`:'<span class="o-thumb o-thumb-empty"></span>'}<div class="o-src"><strong>${esc(o.source)}</strong><span class="o-sub">${esc(o.location||'')}${o.shippingIncluded?(o.location?' · ':'')+'frete grátis':''}</span></div>
    <div class="o-cond">${esc(o.condition||'')}${o.mock?`<br>${mockChip()}`:''}</div>
    <div class="o-price"><b>${esc(o.displayPrice)}</b>${o.originalDisplayPrice&&o.originalDisplayPrice!==o.displayPrice?`<small>${esc(o.originalDisplayPrice)}</small>`:''}</div>
    <div class="o-act"><a class="btn btn-outline btn-sm" href="${esc(safeUrl(o.url))}" target="_blank" rel="noopener noreferrer">Ir para anúncio →</a></div></div>`;
}
async function openOffersModal(title,platform,cond){
  offerState={title,platform,cond:cond==='all'?'used':cond};
  $('#offerModalTitle').textContent=platform?`${title} — ${platform}`:title;
  const p=catalog.find(x=>x.title===title);
  const conds=['used','new',...(p&&hasDigital(p,platform)?['digital']:[])];
  $('#offerTabs').innerHTML=conds.map(c=>`<button class="otab" data-act="offer-tab" data-cond="${c}" aria-pressed="${c===offerState.cond}">${COND_LABEL[c]}</button>`).join('');
  openOverlay('offerOverlay');
  await renderOfferBody();
}
async function renderOfferBody(){
  const {title,platform,cond}=offerState;
  const body=$('#offerBody');
  if(cond==='digital'){
    const p=catalog.find(x=>x.title===title),stores=digitalStores(p,platform);
    body.innerHTML=`<p class="fine">Lojas oficiais. O preço aparece direto na loja — o Inventário não replica valores de terceiros.</p>
      <div class="ext">${stores.map(s=>extLink(s.name,s.url)).join('')}</div>`;
    return;
  }
  body.innerHTML=`<p class="fine">Buscando ofertas…</p>`;
  const res=await fetchCond(title,platform,cond);
  if(res.offers&&res.offers.length){
    body.innerHTML=`<div class="othead"><span>Fonte / condição</span><span></span><span>Preço</span><span></span></div>
      <div>${res.offers.map(offersRowMarkup).join('')}</div>
      <p class="status-note"><span class="dot ${res.mock?'':'live'}"></span>${res.mock?'Ofertas de exemplo — sem integração real para esta busca.':'Frete e taxas podem variar conforme o anúncio.'}</p>
      <div class="ext"><h3>Buscar em outras lojas</h3>${physicalLinks(title+' '+platform)}</div>`;
  }else{
    body.innerHTML=`<div class="empty"><p><strong>Nenhuma oferta nacional validada agora.</strong> Use os atalhos abaixo enquanto a integração não retorna resultados compatíveis.</p></div>
      <p class="status-note"><span class="dot warn"></span>Sem preço fictício: se a fonte não responde com uma oferta válida, o Inventário não inventa um valor.</p>
      <div class="ext">${physicalLinks(title+' '+platform)}</div>`;
  }
}
function openMerchOffersModal(id){
  const it=M.items.find(x=>x.id===id);if(!it)return;
  $('#offerModalTitle').textContent=it.title;
  $('#offerTabs').innerHTML='';
  const offers=M.offersForItem(it);
  $('#offerBody').innerHTML=`<div class="othead"><span>Fonte / condição</span><span></span><span>Preço</span><span></span></div>
    <div>${offers.map(offersRowMarkup).join('')}</div>
    <p class="status-note"><span class="dot"></span>${mockChip()} Ofertas de exemplo. Sem integração real de merch ainda.</p>
    <div class="ext"><h3>Buscar em outras lojas</h3>${merchLinks(it.title,it.cat)}</div>`;
  openOverlay('offerOverlay');
}
function openMockItemModal(id){
  const it=M.items.find(x=>x.id===id);if(!it)return;
  const u=it.universe&&uMap.get(it.universe);
  $('#offerModalTitle').textContent=it.title;
  $('#offerTabs').innerHTML='';
  $('#offerBody').innerHTML=`${mockChip()} <p style="margin-top:10px">${esc(it.subtitle)}${u?' · '+esc(u.name):''}${it.creator?' · '+esc(it.creator):''}</p>
    <p class="cond-price" style="margin-top:8px">Preço do anúncio (exemplo): <b>${brl(it.price)}</b></p>
    <p class="fine" style="margin-top:6px">Peça única / fan-made: sem código de barras e sem equivalência garantida em outra loja.</p>
    <div class="product-actions" style="margin-top:16px">${saveButton(mockRef(it),{label:true})}</div>
    <div class="ext"><h3>Buscar itens parecidos</h3>${merchLinks(it.title,it.cat)}</div>`;
  openOverlay('offerOverlay');
}

/* ---------- modal de salvar (Quero/Tenho/Alerta) ---------- */
let saveTargetId=null;
function openSaveModal(id){
  const ref=refs.get(id);if(!ref)return;
  saveTargetId=id;
  const cur=invGet(id);
  $('#saveModalTitle').textContent=ref.title;
  const isFanmade=ref.kind==='fanmade';
  const opts=isFanmade
    ?[['saved','Salvar anúncio','Guardar este anúncio para olhar depois']]
    :[['wanted','Quero','Entra na sua lista de procurados'],['owned','Já tenho','Marca este item como seu']];
  let html=opts.map(([st,label,sub])=>`<button class="save-opt" data-act="set-status" data-status="${st}" aria-pressed="${cur&&cur.status===st}">${label}<small>${esc(sub)}</small></button>`).join('');
  if(!isFanmade)html+=`<button class="save-opt" data-act="toggle-alert" aria-pressed="${!!(cur&&cur.alert)}">${cur&&cur.alert?'🔔 Alerta marcado':'🔔 Criar alerta de preço'}<small>Só registra seu interesse neste aparelho — ainda não envia notificação</small></button>`;
  if(cur)html+=`<button class="save-opt" data-act="clear-status">Remover do inventário</button>`;
  $('#saveOptions').innerHTML=html;
  const showSnapshot=isFanmade&&cur&&cur.status==='saved';
  $('#saveSnapshot').hidden=!showSnapshot;
  if(showSnapshot){$('#snapPrice').value=cur.paid??''}
  openOverlay('saveOverlay');
}
function refreshSaveButtons(){
  $$('[data-act="open-save"]').forEach(btn=>{
    const id=btn.dataset.id,cur=invGet(id);
    btn.classList.toggle('on',!!cur);
  });
  updateBadge();
}

/* ---------- filtros mobile ---------- */
function openFiltersDrawer(){
  $('#filterBody').innerHTML=main._filtersHtml||'';
  $('#filterApply').textContent=`Aplicar filtros${main._filterCount?` (${main._filterCount})`:''}`;
  openOverlay('filterOverlay');
}
function collectFilterParams(scope){
  const params=new URLSearchParams(location.hash.split('?')[1]||'');
  ['cat','genre','cond','plat'].forEach(name=>{
    const vals=$$(`${scope} [data-filter="${name}"]:checked`).map(i=>i.dataset.value);
    if(vals.length)params.set(name,vals.join(','));else params.delete(name);
  });
  const retro=$(`${scope} [data-filter="retro"]`);
  if(retro&&retro.checked)params.set('retro','1');else params.delete('retro');
  const min=$(`${scope} [data-price="min"]`),max=$(`${scope} [data-price="max"]`);
  if(min&&min.value)params.set('min',min.value);else params.delete('min');
  if(max&&max.value)params.set('max',max.value);else params.delete('max');
  return params;
}
function applyParams(params){params.delete('n');location.hash='#/busca?'+params.toString()}

// Pacote4 4.6: filtros da página de merch — mesmo padrão de collectFilterParams/
// applyParams acima, mas com data-mfilter/data-mprice (nunca data-filter/
// data-price, pra não disparar o listener da busca, que redireciona pra
// #/busca) e indo pra #/merch.
function collectMerchFilterParams(scope){
  const params=new URLSearchParams(location.hash.split('?')[1]||'');
  ['universo','categoria','origem','tipo'].forEach(name=>{
    const vals=$$(`${scope} [data-mfilter="${name}"]:checked`).map(i=>i.dataset.value);
    if(vals.length)params.set(name,vals.join(','));else params.delete(name);
  });
  const min=$(`${scope} [data-mprice="min"]`),max=$(`${scope} [data-mprice="max"]`);
  if(min&&min.value)params.set('min',min.value);else params.delete('min');
  if(max&&max.value)params.set('max',max.value);else params.delete('max');
  return params;
}
function applyMerchParams(params){location.hash='#/merch?'+params.toString()}

/* ---------- item 7 (rodada 5): dropdowns da barra de filtros (desktop) ---------- */
function closeAllFdrops(){
  $$('.fdrop.is-open').forEach(d=>{d.classList.remove('is-open');d.querySelector('.fdrop-btn')?.setAttribute('aria-expanded','false')});
}
document.addEventListener('click',e=>{
  const dropBtn=e.target.closest('.fdrop-btn');
  if(dropBtn){
    const drop=dropBtn.closest('.fdrop');
    const wasOpen=drop.classList.contains('is-open');
    closeAllFdrops();
    if(!wasOpen){drop.classList.add('is-open');dropBtn.setAttribute('aria-expanded','true')}
    return;
  }
  if(!e.target.closest('.fdrop-panel'))closeAllFdrops();
});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeAllFdrops()});
document.addEventListener('input',e=>{
  if(!e.target.matches('[data-dropdown-search]'))return;
  const panel=e.target.closest('.fdrop-panel'),q=norm(e.target.value);
  $$('.fdrop-options label',panel).forEach(l=>{l.hidden=!!q&&!norm(l.textContent).includes(q)});
});

/* ---------- ações delegadas (clique) ---------- */
document.addEventListener('click',e=>{
  const btn=e.target.closest('[data-act]');
  if(!btn)return;
  const act=btn.dataset.act;
  if(act==='open-save'){openSaveModal(btn.dataset.id);return}
  if(act==='toggle-owned'){
    e.preventDefault();
    const id=btn.dataset.id,p=catalogBySlug.get(id.slice(5));
    if(!p)return;
    const on=invGet(id)?.status==='owned';
    invSet(gameRef(p),{status:on?null:'owned'});
    btn.classList.toggle('is-on',!on);
    btn.setAttribute('aria-pressed',String(!on));
    btn.closest('.uinv-row')?.classList.toggle('is-owned',!on);
    const countEl=$('[data-uinv-count]');
    const newCount=invList().filter(i=>i.universe===p.universe&&i.status==='owned').length;
    if(countEl){
      countEl.textContent=newCount;
      countEl.classList.remove('is-bumping');void countEl.offsetWidth;countEl.classList.add('is-bumping');
    }
    const progressEl=$('[data-uinv-progress]');
    if(progressEl){
      const total=parseInt(progressEl.dataset.total||'0',10);
      const pulseIndex=on?newCount:newCount-1;
      progressEl.outerHTML=uinvProgressMarkup(newCount,total);
      const seg=$$('.uinv-seg')[pulseIndex];
      if(seg)seg.classList.add('is-pulsing');
    }
    if(btn.classList.contains('hec-own-btn'))btn.textContent=!on?'✓ Na coleção':'♡ Tenho';
    return;
  }
  if(act==='open-offers'){openOffersModal(btn.dataset.title,btn.dataset.platform,btn.dataset.cond);return}
  if(act==='open-merch-offers'){openMerchOffersModal(btn.dataset.id);return}
  if(act==='mock-item'){openMockItemModal(btn.dataset.id);return}
  if(act==='offer-tab'){offerState.cond=btn.dataset.cond;$$('.otab',$('#offerTabs')).forEach(t=>t.setAttribute('aria-pressed',String(t===btn)));renderOfferBody();return}
  if(act==='pick-platform'){
    const p=new URLSearchParams(location.hash.split('?')[1]||'');p.set('plat',btn.dataset.plat);
    location.hash=`#/jogo/${btn.dataset.slug}?`+p.toString();return;
  }
  if(act==='more-rows'){
    const p=new URLSearchParams(location.hash.split('?')[1]||'');p.set('n',btn.dataset.n);
    location.hash='#/busca?'+p.toString();return;
  }
  if(act==='clear-filters'){
    const p=new URLSearchParams(location.hash.split('?')[1]||'');
    const q=p.get('q')||'';[...p.keys()].forEach(k=>p.delete(k));if(q)p.set('q',q);
    location.hash='#/busca'+(q?'?q='+enc(q):'');return;
  }
  if(act==='rm-filter'){
    const p=new URLSearchParams(location.hash.split('?')[1]||'');
    const k=btn.dataset.k;
    if(k==='cat'||k==='genre'||k==='cond'||k==='plat'){
      const vals=(p.get(k)||'').split(',').filter(v=>v&&v!==btn.dataset.v);
      if(vals.length)p.set(k,vals.join(','));else p.delete(k);
    }else p.delete(k);
    location.hash='#/busca?'+p.toString();return;
  }
  if(act==='open-filters'){openFiltersDrawer();return}
  if(act==='apply-pricebar'){applyParams(collectFilterParams('.filterbar'));return}
  if(act==='merch-apply-pricebar'){applyMerchParams(collectMerchFilterParams('.merch-filterbar'));return}
  if(act==='merch-clear-filters'){location.hash='#/merch';return}
  if(act==='merch-rm-filter'){
    const p=new URLSearchParams(location.hash.split('?')[1]||'');
    const k=btn.dataset.k;
    if(k==='preco'){p.delete('min');p.delete('max')}
    else if(k==='universo'||k==='categoria'||k==='origem'||k==='tipo'){
      const vals=(p.get(k)||'').split(',').filter(v=>v&&v!==btn.dataset.v);
      if(vals.length)p.set(k,vals.join(','));else p.delete(k);
    }else p.delete(k);
    applyMerchParams(p);return;
  }
  if(act==='clear-inventory'){
    if(!invList().length)return;
    if(confirm('Limpar todo o seu Inventário deste aparelho? Essa ação não pode ser desfeita.')){inv.items={};saveInv();route();toast('Inventário limpo.')}
    return;
  }
  if(act==='set-status'){
    const ref=refs.get(saveTargetId);if(!ref)return;
    const cur=invGet(saveTargetId),status=btn.dataset.status;
    invSet(ref,{status:cur&&cur.status===status?null:status});
    refreshSaveButtons();openSaveModal(saveTargetId);
    toast(status==='owned'?'Marcado como Tenho.':status==='saved'?'Anúncio salvo no seu Inventário.':'Adicionado à sua lista de Quero.');
    if(location.hash.startsWith('#/inventario'))route();
    return;
  }
  if(act==='toggle-alert'){
    const ref=refs.get(saveTargetId);if(!ref)return;
    const cur=invGet(saveTargetId),al=!(cur&&cur.alert);
    invSet(ref,{alert:al,status:(cur&&cur.status)||'wanted'});
    refreshSaveButtons();openSaveModal(saveTargetId);
    toast(al?'Interesse em alerta salvo neste aparelho. Ainda não enviamos notificações.':'Alerta removido.');
    if(location.hash.startsWith('#/inventario'))route();
    return;
  }
  if(act==='clear-status'){
    const ref=refs.get(saveTargetId);if(!ref)return;
    invSet(ref,{status:null,alert:false});
    refreshSaveButtons();closeOverlay('saveOverlay');
    toast('Removido do seu Inventário.');
    if(location.hash.startsWith('#/inventario'))route();
    return;
  }
  if(act==='save-snapshot'){
    const ref=refs.get(saveTargetId);if(!ref)return;
    const price=parseFloat(($('#snapPrice').value||'').replace(',','.'));
    invSet(ref,{status:'owned',paid:Number.isFinite(price)?price:null,boughtAt:new Date().toISOString()});
    refreshSaveButtons();closeOverlay('saveOverlay');
    toast('Item pessoal salvo no seu Inventário.');
    if(location.hash.startsWith('#/inventario'))route();
    return;
  }
  const closeId=btn.closest('.overlay')?.id;
  if(act==='close-overlay'&&closeId){closeOverlay(closeId);return}
});
document.addEventListener('change',e=>{
  if(e.target.matches('[data-filter]'))applyParams(collectFilterParams('.filterbar'));
  if(e.target.matches('[data-mfilter]'))applyMerchParams(collectMerchFilterParams('.merch-filterbar'));
});
$('#filterApply').addEventListener('click',()=>{applyParams(collectFilterParams('#filterBody'));closeOverlay('filterOverlay')});

/* ---------- rodapé: modo demonstração ---------- */
function updateMockToggleLabel(){$('#mockToggle').textContent=mockOn()?'Desligar modo demonstração':'Ligar modo demonstração'}
$('#mockToggle').addEventListener('click',()=>{LS.set(KEYS.mock,mockOn()?0:1);updateMockToggleLabel();route();toast(mockOn()?'Modo demonstração ligado: preços e itens de exemplo aparecem com a etiqueta EXEMPLO.':'Modo demonstração desligado.')});
updateMockToggleLabel();

/* ---------- observador simples para manter botões de salvar sincronizados ---------- */
const _origInvSet=invSet;
invSet=function(ref,patch){_origInvSet(ref,patch);refreshSaveButtons()};

/* ---------- barra lateral: modo (aberta/recolhida/gaveta) ---------- */
const sidebarDrawerBtn=document.getElementById('sidebarDrawerBtn');
const sidebarDrawer=document.getElementById('sidebarDrawer');
const sidebarDrawerOverlay=document.getElementById('sidebarDrawerOverlay');
const appSidebar=document.getElementById('appSidebar');
// Aberta (252px) na home/universo/plataforma; recolhida (72px, só ícones,
// expande por cima do conteúdo no hover — via CSS, não JS) na busca, na
// ficha do jogo e em qualquer tela <1280px; <900px some e vira gaveta.
// Item 4 (rodada 5): a largura decide sozinha — sem recolher por página
// (busca/jogo não forçam mais o modo ícone). ≥1100px aberta, 900–1100px
// recolhida (expande por cima no hover), <900px vira gaveta.
function syncSidebarMode(){
  const width=document.documentElement.clientWidth;
  const hidden=width<900;
  const forceCollapse=width<1100;
  document.body.classList.toggle('sidebar-hidden',hidden);
  document.body.classList.toggle('sidebar-collapsed',!hidden&&forceCollapse);
}
window.addEventListener('resize',syncSidebarMode);
// Item 4 (rodada 5): reajusta quantos universos em destaque cabem sempre
// que a barra muda de altura de verdade (resize da janela) — não só no
// primeiro render.
if('ResizeObserver' in window){
  const sidebarResizeObserver=new ResizeObserver(()=>fitAllSidebars());
  [appSidebar,sidebarDrawer].forEach(el=>{if(el)sidebarResizeObserver.observe(el)});
}
function openSidebarDrawer(){
  if(!sidebarDrawer||!sidebarDrawerOverlay)return;
  sidebarDrawer.hidden=false;sidebarDrawerOverlay.hidden=false;
  sidebarDrawerBtn?.setAttribute('aria-expanded','true');
  requestAnimationFrame(()=>sidebarDrawer.classList.add('is-open'));
}
function closeSidebarDrawer(){
  if(!sidebarDrawer||sidebarDrawer.hidden)return;
  sidebarDrawer.classList.remove('is-open');
  sidebarDrawerBtn?.setAttribute('aria-expanded','false');
  setTimeout(()=>{if(sidebarDrawer)sidebarDrawer.hidden=true;if(sidebarDrawerOverlay)sidebarDrawerOverlay.hidden=true},200);
}
sidebarDrawerBtn?.addEventListener('click',()=>{
  if(!sidebarDrawer)return;
  sidebarDrawer.hidden?openSidebarDrawer():closeSidebarDrawer();
});
sidebarDrawerOverlay?.addEventListener('click',closeSidebarDrawer);
sidebarDrawer?.addEventListener('click',e=>{if(e.target.closest('a'))closeSidebarDrawer()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&sidebarDrawer&&!sidebarDrawer.hidden)closeSidebarDrawer()});

/* ---------- partida ---------- */
updateBadge();

route();


/* ---------- pacote único, item 7.2: busca em tela cheia no mobile ----------
   Reaproveita o mesmo #searchInput/#suggest do cabeçalho (toda a lógica de
   sugestões/teclado já ligada neles) — só muda a classe do body, que o CSS
   usa pra tirar o campo do cabeçalho e cobrir a tela inteira. */
const DESKTOP_SEARCH_PLACEHOLDER=searchInput.placeholder;
const MOBILE_SEARCH_PLACEHOLDER='Buscar jogos, franquias…';
function openMobileSearch(){
  document.body.classList.add('mobile-search-open');
  searchInput.placeholder=MOBILE_SEARCH_PLACEHOLDER;
  searchInput.focus();
}
function closeMobileSearch(){
  document.body.classList.remove('mobile-search-open');
  searchInput.placeholder=DESKTOP_SEARCH_PLACEHOLDER;
  closeSuggest();
}
document.querySelector('[data-mobile-search]')?.addEventListener('click',openMobileSearch);
document.getElementById('mobileSearchClose')?.addEventListener('click',closeMobileSearch);
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.body.classList.contains('mobile-search-open'))closeMobileSearch()});
window.addEventListener('hashchange',closeMobileSearch);

/* Destaca a aba ativa da barra inferior (mobile) conforme a rota. */
function syncMobileBottomActive(){
  const path=parseHash().path;
  const map={'':'inicio','/':'inicio','/busca':'busca','/inventario':'inventario'};
  let key=map[path]||(path.startsWith('/universo')||path==='/universos'?'universos':null);
  document.querySelectorAll('.mobile-bottom [data-mobile-tab]').forEach(el=>{
    if(el.dataset.mobileTab===key)el.setAttribute('aria-current','page');
    else el.removeAttribute('aria-current');
  });
}
window.addEventListener('hashchange',syncMobileBottomActive);
syncMobileBottomActive();
