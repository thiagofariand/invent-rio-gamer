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
  return `<article class="card">${coverTile(p.title,{image:(b&&b.image)||''})}${saveButton(gameRef(p))}
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
function renderHome(){
  setTitle('');
  const trend=D.trendingNow,top=trend.slice(0,3),rest=trend.slice(3);
  const demo=mockOffers(),demoMerch=mockMerch();
  const sample=(key,cond)=>{const o=M.offersFor(key,'',cond)[0];return o};
  const usedDemo=demo?sample('Jogos usados','used'):null;
  const newDemo=demo?sample('Novos','new'):null;
  const retroDemo=demo?sample('Retrogamer','used'):null;
  const shelf=[
    {title:'Jogos usados',ctx:'Mídia física no mercado nacional',href:'#/busca?cond=usado',price:usedDemo&&usedDemo.displayPrice,was:usedDemo&&brl(usedDemo.priceValue/0.7),callout:usedDemo?'-30% · achado nacional':''},
    {title:'Novos',ctx:'Lançamentos e reposições',href:'#/busca?cond=novo',price:newDemo&&newDemo.displayPrice},
    {title:'Retrogamer',ctx:'NES, Mega Drive, N64, PS1 e mais',href:'#/busca?retro=1&cond=usado',price:retroDemo&&retroDemo.displayPrice}
  ];
  const minPrice=type=>{const l=M.items.filter(i=>i.type===type).map(i=>i.price);return l.length?brl(Math.min(...l)):null};
  const mshelf=[
    {title:'Amiibo',ctx:'Colecionáveis',href:'#/merch?cat=colecionaveis&tipo=amiibo',price:demoMerch?minPrice('amiibo'):null},
    {title:'Decoração',ctx:'Quadros, placas e luminárias',href:'#/merch?cat=merch',price:demoMerch?minPrice('decoracao'):null},
    {title:'Artesanais',ctx:'Fan-made',href:'#/merch?cat=fanmade',price:demoMerch?minPrice('artesanal'):null}
  ];
  main.innerHTML=`
  <h1 class="home-h1">Encontre o item que falta no seu Inventário.</h1>
  <div class="home-grid">
    <section class="panel panel-trend" aria-labelledby="h-trend">
      <div class="panel-head"><h2 id="h-trend">Em alta</h2><a class="link-cta" href="#/em-alta">Ver tudo</a></div>
      <div class="panel-body">
        <div class="cards3">${top.map(t=>`<article class="card">${coverTile(t.short,{})}
          <div class="card-title"><a href="#/tema/${t.slug}">${esc(t.short)}</a></div>
          <div class="card-ctx">${esc(sentence(t.tag))}</div><span class="card-cta">Ver mais →</span></article>`).join('')}</div>
        ${rest.length?`<div class="also"><h3>Também em alta</h3><ul>${rest.map(t=>`<li><a href="#/tema/${t.slug}"><span class="also-t">${esc(t.short)}</span><span class="also-tag">${esc(sentence(t.tag))}</span></a></li>`).join('')}</ul></div>`:''}
        <p class="fine" style="margin-top:auto">Curadoria manual de ${esc(D.trendingUpdated)}, com links oficiais.</p>
      </div>
    </section>
    <section class="panel" aria-labelledby="h-games"><div class="panel-head"><h2 id="h-games">Games e ofertas</h2><a class="link-cta" href="#/games">Ver universos</a></div>
      <div class="panel-body"><div class="cards3">${shelf.map(shelfCard).join('')}</div></div></section>
    <section class="panel" aria-labelledby="h-merch"><div class="panel-head"><h2 id="h-merch">Merch & fan-made</h2><a class="link-cta" href="#/merch">Ver tudo</a></div>
      <div class="panel-body"><div class="cards3">${mshelf.map(shelfCard).join('')}</div></div></section>
  </div>`;
}

/* ---------- busca e resultados ---------- */
function filtersMarkup(F,platforms,prefix){
  const chk=(name,val,label,on)=>`<label><input type="checkbox" data-filter="${name}" data-value="${esc(val)}" ${on?'checked':''}> <span>${esc(label)}</span></label>`;
  return `
  <div class="fg"><h3>Categoria</h3>${CATS.map(([k,l])=>chk('cat',k,l,F.cats.has(k))).join('')}</div>
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
      <div id="rowList">${visible.map(rowMarkup).join('')}</div>
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
  if(list)autoloadPrices(visible,token);
  main._filtersHtml=filtersMarkup(F,platforms,'m');
  main._filterCount=chips.length;
  main._filterTotal=filtered.length;
}

/* ---------- página do item ---------- */
function blockMarkup(cond,p,platform){
  if(cond==='digital'){
    const stores=digitalStores(p,platform);
    return `<button class="cond-block" data-act="open-offers" data-title="${esc(p.title)}" data-platform="${esc(platform)}" data-cond="digital">
      <div class="cond-name"><span>Digital</span><span class="link-cta">Ver digital →</span></div>
      <div class="cond-price">Lojas oficiais</div><div class="cond-note">${esc(stores.map(s=>s.name).join(' · '))} · o preço aparece direto na loja</div></button>`;
  }
  const s=summaryOf(cond,p.title,platform);
  let price;
  if(!s)price='<span class="fine">Consultando ofertas…</span>';
  else if(s.status==='ok'&&s.count)price=`A partir de <b>${esc(s.minDisplay)}</b> <span class="fine">· ${s.count} ${s.count===1?'oferta':'ofertas'}</span> ${s.mock?mockChip():''}`;
  else if(s.status==='empty')price='<span class="fine">Nenhuma oferta validada agora</span>';
  else price='<span class="fine">Preço indisponível agora</span>';
  const note=cond==='used'?'Autenticidade não verificada':'Frete e taxas podem variar';
  return `<button class="cond-block ${cond==='used'?'lead':''}" data-act="open-offers" data-title="${esc(p.title)}" data-platform="${esc(platform)}" data-cond="${cond}">
    <div class="cond-name"><span>${COND_LABEL[cond]}</span><span class="link-cta">Ver ofertas →</span></div>
    <div class="cond-price">${price}</div><div class="cond-note">${note}</div></button>`;
}
function renderProduct(slug,params,token){
  const p=catalogBySlug.get(slug);
  if(!p)return renderNotFound();
  const wanted=params.get('plat');
  const platforms=p.variants.map(v=>v[1]);
  const platform=platforms.includes(wanted)?wanted:platforms[0];
  const u=uMap.get(p.universe);
  const dig=hasDigital(p,platform);
  setTitle(`${p.title} (${platform})`);
  const ref=gameRef(p),cur=invGet(ref.id);
  main.innerHTML=`
  <nav class="crumbs" aria-label="Você está em"><a href="#/">Início</a> › <a href="#/universo/${u.slug}">${esc(u.name)}</a> › <span>${esc(p.title)}</span></nav>
  <div class="product">
    <div class="product-cover" id="productCoverSlot">${coverTile(p.title,{platform,image:bestOfferImage(p,platform)})}</div>
    <div>
      <h1>${esc(p.title)}</h1>
      <div class="plat-row" role="group" aria-label="Plataforma">${platforms.map(x=>`<button class="plat-btn" aria-pressed="${x===platform}" data-act="pick-platform" data-slug="${p.slug}" data-plat="${esc(x)}">${esc(x)}</button>`).join('')}</div>
      <p class="media-line">Mídia física${dig?' / Digital':''}${p.year?' · '+p.year:''}${cur?` · <span class="chip status">${cur.status==='owned'?'Tenho':'Quero'}</span>`:''}</p>
      <div class="product-actions">
        <button class="btn btn-primary" data-act="open-offers" data-title="${esc(p.title)}" data-platform="${esc(platform)}" data-cond="all">Ver ofertas</button>
        ${saveButton(ref,{label:true})}
      </div>
      <div class="cond-blocks" id="condBlocks">${blockMarkup('used',p,platform)}${blockMarkup('new',p,platform)}${dig?blockMarkup('digital',p,platform):''}</div>
      <p class="fine" style="margin-top:14px">Novo, usado e digital são comparados separadamente: cada um tem o seu “a partir de”.</p>
    </div>
  </div>`;
  ['used','new'].forEach(async cond=>{
    await fetchCond(p.title,platform,cond);
    if(token!==viewToken)return;
    const slot=$('#condBlocks');
    if(!slot)return;
    const idx=cond==='used'?0:1;
    const el=slot.children[idx];
    if(el)el.outerHTML=blockMarkup(cond,p,platform);
    const cover=$('#productCoverSlot');
    const img=bestOfferImage(p,platform);
    if(cover&&img)cover.innerHTML=coverTile(p.title,{platform,image:img});
  });
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
function renderUniverse(slug,params){
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
  let body='';
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
    const mi=items('').slice(0,4);
    body=(titles.length?`<h2 class="page-h" style="font-size:19px;margin-bottom:12px">Games</h2><div class="cards4">${titles.slice(0,8).map(p=>gameCard(p)).join('')}</div>${titles.length>8?`<p style="margin-top:12px"><a class="link-cta" href="#/universo/${slug}?tab=games">Ver os ${titles.length} jogos →</a></p>`:''}`:emptyCatalog)
      +(mi.length?`<h2 class="page-h" style="font-size:19px;margin:28px 0 12px">Colecionáveis, merch e fan-made</h2>${originLegend()}<div class="cards4">${mi.map(merchCard).join('')}</div>`:'')
      +`<div class="section-gap"><h2 class="page-h" style="font-size:19px">Buscar nas lojas</h2><p class="lede">Atalhos que abrem a busca de cada loja.</p>${marketShortcuts(u.name)}</div>`;
  }
  main.innerHTML=`
  <nav class="crumbs" aria-label="Você está em"><a href="#/">Início</a> › <a href="#/games">Games</a> › <span>${esc(u.name)}</span></nav>
  <section class="banner"><span class="chip">${esc(ECO_LABEL[u.eco]||'')}</span><h1>Universo ${esc(u.name)}</h1>
    <p>${titles.length?`${titles.length} jogos catalogados, com ofertas novas, usadas e digitais separadas.`:'Catálogo em preenchimento.'}${(owned||want)?` Você marcou ${owned} como Tenho e ${want} como Quero.`:''}</p></section>
  <div class="tabs" role="tablist">${tabs.map(([k,l])=>`<a class="tab" role="tab" href="#/universo/${slug}?tab=${k}" aria-current="${k===tab}">${l}</a>`).join('')}</div>
  ${body}`;
}

/* ---------- tema em alta ---------- */
function renderTheme(slug){
  const t=D.trendingNow.find(x=>x.slug===slug);
  if(!t)return renderNotFound();
  const u=t.universe&&uMap.get(t.universe);
  setTitle(t.short);
  main.innerHTML=`
  <nav class="crumbs" aria-label="Você está em"><a href="#/">Início</a> › <a href="#/em-alta">Em alta</a> › <span>${esc(t.short)}</span></nav>
  <section class="banner"><span class="chip">${esc(sentence(t.tag))}</span><h1>${esc(t.title)}</h1><p>${esc(t.copy)}</p>
    <div class="banner-actions"><a class="btn btn-primary" href="${esc(ext.ml(t.query))}" target="_blank" rel="noopener noreferrer">Físico no Brasil ↗</a>
    <a class="btn btn-ghost" href="${esc(safeUrl(t.digital))}" target="_blank" rel="noopener noreferrer">Digital / oficial ↗</a>
    ${u?`<a class="btn btn-ghost" href="#/universo/${u.slug}">Universo ${esc(u.name)} →</a>`:''}</div></section>
  <p class="fine" style="margin-top:12px">Curadoria manual de ${esc(D.trendingUpdated)}. Os links levam às páginas oficiais e às buscas das lojas; o Inventário não mostra preço deste item até haver uma fonte confiável.</p>
  <div class="section-gap"><h2 class="page-h" style="font-size:19px">Buscar nas lojas</h2>${marketShortcuts(t.short)}</div>`;
}
function renderTrendingPage(){
  setTitle('Em alta');
  main.innerHTML=`<h1 class="page-h">Em alta</h1>
  <p class="lede">Assuntos que puxam a busca agora. Curadoria manual de ${esc(D.trendingUpdated)}, com links oficiais. Quando houver dados próprios, esta lista poderá mostrar o que está em alta no Inventário.</p>
  <div class="section-gap">${D.trendingNow.map(t=>`<article class="trend-row">${coverTile(t.short,{})}
    <div><span class="chip">${esc(sentence(t.tag))}</span><h2 style="margin-top:6px">${esc(t.title)}</h2><p>${esc(t.copy)}</p></div>
    <div class="trend-actions"><a class="btn btn-outline btn-sm" href="#/tema/${t.slug}">Ver mais →</a><a class="btn btn-ghost btn-sm" href="${esc(safeUrl(t.digital))}" target="_blank" rel="noopener noreferrer">Digital / oficial ↗</a></div></article>`).join('')}</div>`;
}

/* ---------- games (diretório de universos) ---------- */
function renderGames(){
  setTitle('Games');
  const group=eco=>universes.filter(u=>u.eco===eco);
  main.innerHTML=`<h1 class="page-h">Games</h1>
  <p class="lede">Escolha um universo para ver jogos novos, usados e digitais, além de colecionáveis, merch e fan-made.</p>
  <div class="section-gap" style="display:flex;gap:10px;flex-wrap:wrap">
    <a class="btn btn-outline btn-sm" href="#/busca?cond=usado">Todos os usados</a><a class="btn btn-ghost btn-sm" href="#/busca?cond=novo">Todos os novos</a><a class="btn btn-ghost btn-sm" href="#/busca?retro=1&amp;cond=usado">Retrogamer</a><a class="btn btn-ghost btn-sm" href="#/busca">Catálogo completo</a></div>
  <div class="uni-groups">${['Nintendo','PlayStation','Multi'].map(eco=>`<section class="panel"><div class="panel-head"><h2>${esc(ECO_LABEL[eco])}</h2></div><div class="panel-body"><div class="uni-chips">${group(eco).map(u=>`<a class="uni-chip" href="#/universo/${u.slug}">${esc(u.name)}${u.hasCatalog?`<small>${titlesOf(u.slug).length}</small>`:''}</a>`).join('')}</div></div></section>`).join('')}</div>
  <p class="fine" style="margin-top:14px">O número ao lado do nome é a quantidade de jogos já catalogados. Universos sem número ainda estão em preenchimento.</p>`;
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
