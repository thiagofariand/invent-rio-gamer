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
  const map={'/games':'nav-games','/merch':'nav-merch','/em-alta':'nav-alta','/inventario':'nav-inv'};
  let key=map[path];
  if(path.startsWith('/universo/')||path.startsWith('/busca')||path.startsWith('/jogo/')||path.startsWith('/ofertas/'))key='nav-games';
  if(path.startsWith('/tema/'))key='nav-alta';
  if(key){const el=document.getElementById(key);if(el)el.setAttribute('aria-current','page')}
}
function route(){
  const {path,params}=parseHash();
  closeOverlay('offerOverlay');closeOverlay('saveOverlay');closeOverlay('filterOverlay');
  const token=++viewToken;
  document.body.classList.toggle('inventory-route',path==='/inventario');
  navActive(path);
  if(path==='/'||path==='')renderHome();
  else if(path==='/busca')renderSearch(params,token);
  else if(path.startsWith('/jogo/'))renderProduct(path.slice(6),params,token);
  else if(path.startsWith('/ofertas/'))renderOfferComparison(path.slice(9),params,token);
  else if(path.startsWith('/universo/'))renderUniverse(path.slice(10),params);
  else if(path.startsWith('/tema/'))renderTheme(path.slice(6));
  else if(path==='/em-alta')renderTrendingPage();
  else if(path==='/games')renderGames();
  else if(path==='/merch')renderMerch(params);
  else if(path==='/inventario')renderInventory(params);
  else renderNotFound();
  main.focus({preventScroll:true});
  window.scrollTo(0,0);
  closeSuggest();
}
window.addEventListener('hashchange',route);

/* ---------- busca do cabeçalho + autocomplete ---------- */
const searchInput=$('#searchInput'),suggestBox=$('#suggest');
let sIndex=-1;
function goSearch(q){location.hash='#/busca?q='+enc(q)}
function closeSuggest(){suggestBox.hidden=true;sIndex=-1;searchInput.setAttribute('aria-expanded','false')}
function renderSuggest(raw){
  const list=suggestions(raw);
  if(!list.length){closeSuggest();return}
  suggestBox.innerHTML=`<div class="sg-head">Sugestões</div>${list.map((s,i)=>{
    if(s.type==='universe')return `<a class="sg-item" href="#/universo/${s.u.slug}" data-i="${i}"><span class="cover mini" style="--h:${hashStr(s.u.name)%360}" aria-hidden="true"><span class="cv-ini">${esc(initialsOf(s.u.name))}</span></span><span><span class="sg-title">${esc(s.u.name)}</span><br><span class="sg-sub">Ver universo</span></span><span></span></a>`;
    const p=s.p,price=suggestPrice(p);
    return `<a class="sg-item" href="#/jogo/${p.slug}" data-i="${i}"><span class="cover mini" style="--h:${hashStr(p.title)%360}" aria-hidden="true"><span class="cv-ini">${esc(initialsOf(p.title))}</span></span><span><span class="sg-title">${esc(p.title)}</span><br><span class="sg-sub">${esc(platShort(p))}</span></span><span class="sg-price">${price}</span></a>`;
  }).join('')}`;
  suggestBox.hidden=false;sIndex=-1;searchInput.setAttribute('aria-expanded','true');
}
searchInput.addEventListener('input',()=>renderSuggest(searchInput.value));
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
  ['cat','cond','plat'].forEach(name=>{
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

/* ---------- ações delegadas (clique) ---------- */
document.addEventListener('click',e=>{
  const btn=e.target.closest('[data-act]');
  if(!btn)return;
  const act=btn.dataset.act;
  if(act==='open-save'){openSaveModal(btn.dataset.id);return}
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
    if(k==='cat'||k==='cond'||k==='plat'){
      const vals=(p.get(k)||'').split(',').filter(v=>v&&v!==btn.dataset.v);
      if(vals.length)p.set(k,vals.join(','));else p.delete(k);
    }else p.delete(k);
    location.hash='#/busca?'+p.toString();return;
  }
  if(act==='open-filters'){openFiltersDrawer();return}
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
  if(e.target.matches('[data-filter]'))applyParams(collectFilterParams('.filters'));
  if(e.target.matches('[data-act="pick-uni"]')){
    const p=new URLSearchParams(location.hash.split('?')[1]||'');
    if(e.target.value)p.set('uni',e.target.value);else p.delete('uni');
    location.hash='#/merch?'+p.toString();
  }
});
$('#filterApply').addEventListener('click',()=>{applyParams(collectFilterParams('#filterBody'));closeOverlay('filterOverlay')});

/* ---------- rodapé: modo demonstração ---------- */
function updateMockToggleLabel(){$('#mockToggle').textContent=mockOn()?'Desligar modo demonstração':'Ligar modo demonstração'}
$('#mockToggle').addEventListener('click',()=>{LS.set(KEYS.mock,mockOn()?0:1);updateMockToggleLabel();route();toast(mockOn()?'Modo demonstração ligado: preços e itens de exemplo aparecem com a etiqueta EXEMPLO.':'Modo demonstração desligado.')});
updateMockToggleLabel();

/* ---------- observador simples para manter botões de salvar sincronizados ---------- */
const _origInvSet=invSet;
invSet=function(ref,patch){_origInvSet(ref,patch);refreshSaveButtons()};

/* ---------- partida ---------- */
updateBadge();
route();


/* mobile: foco direto na busca */
document.querySelector('[data-mobile-search]')?.addEventListener('click',()=>{window.scrollTo(0,0);searchInput.focus();});
