/* ============================================================
   Inventário Gamer v0.98 — core
   Sem framework e sem build: HTML + CSS + JS na Vercel.
   Dados estáticos: catalog-data.js · exemplos: mock-data.js
   Ofertas reais: /api/offers (Mercado Livre)
   ============================================================ */
const D=window.INV_DATA;
const M=window.INV_MOCK||{config:{enabled:false,offers:false,merch:false},items:[],offersForItem:()=>[]};

/* ---------- utilitários ---------- */
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const norm=s=>String(s??'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/['’]/g,'').replace(/&/g,' and ').replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
const slugify=s=>norm(s).replace(/ /g,'-');
// Parte B, item 7a: só pra busca (nunca pra slug/URL, que tem que continuar
// estável) — token que é um numeral romano válido (II, VII, XV...) vira o
// arábico equivalente, nos dois lados (catálogo e termo digitado), pra
// "Final Fantasy VII" e "final fantasy 7" baterem igual.
const ROMAN_RE=/^m{0,4}(cm|cd|d?c{0,3})(xc|xl|l?x{0,3})(ix|iv|v?i{0,3})$/;
function romanToArabic(tok){
  if(!tok||!/^[mdclxvi]+$/.test(tok)||!ROMAN_RE.test(tok))return null;
  const vals={m:1000,d:500,c:100,l:50,x:10,v:5,i:1};
  let total=0,prev=0;
  for(let i=tok.length-1;i>=0;i--){
    const v=vals[tok[i]];
    if(v<prev)total-=v;else{total+=v;prev=v}
  }
  return total>0?String(total):null;
}
const normSearch=s=>norm(s).split(' ').map(t=>romanToArabic(t)||t).join(' ');
const enc=encodeURIComponent;
const brl=v=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(v||0));
const safeUrl=u=>/^https?:\/\//i.test(String(u||''))?String(u):'#';
const sentence=s=>{s=String(s||'').toLowerCase();return s.charAt(0).toUpperCase()+s.slice(1)};
function hashStr(str){let h=2166136261;for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
async function mapLimit(items,limit,fn){let cursor=0;async function worker(){while(cursor<items.length){const i=cursor++;try{await fn(items[i],i)}catch{}}}await Promise.all(Array.from({length:Math.min(limit,items.length)},worker))}

// Pacote3, item 2: PRICE_MODE troca entre preços de exemplo ('demo') e uma
// futura fonte real ('real', ainda não implementada) — padrão 'demo' em
// TODOS os ambientes, inclusive produção; não existe modo "hidden" (nunca
// escondemos o preço de exemplo, só identificamos com o selo EXEMPLO).
const PRICE_MODE='demo';
// rng determinístico (mulberry32) — mesma fórmula que já existia dentro de
// mock-data.js, só exposta aqui pra sampleOffers/sampleOfferList (abaixo)
// poderem gerar a MESMA lista de anúncios que M.offersFor gerava, agora a
// partir do preço único de sampleOffers (sem duas fontes divergentes).
function mulberry32(seed){let a=seed>>>0;return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const SAMPLE_OFFER_SOURCES=['Marketplace exemplo','Loja parceira exemplo','Vendedor exemplo'];
// Pacote3, item 2.1: ÚNICA função que decide o preço de exemplo de um jogo
// — chamada de qualquer tela (home, hero, cards, hover, card de compra,
// comparadora, busca) sempre com o MESMO resultado pro mesmo gameId, porque
// tudo vem de hashStr(gameId+sal) — nunca Math.random(). Distribuição fixa
// por hash (35% só usado / 25% só novo / 25% os dois / 10% só digital sem
// preço / 5% sem oferta nenhuma); usado sempre 55%-85% do novo (mesmo
// quando só usado existe, o novo "de referência" é calculado por baixo pra
// manter a proporção, só não é mostrado); jogos retrô (ano<=2012) saem mais
// baratos (fator .6 no preço-base).
function sampleOffers(gameId,meta){
  meta=meta||{};
  const title=meta.title||gameId;
  const cat=catalog.find(p=>p.title===title);
  const year=meta.year!=null?meta.year:cat?.year;
  // Pacote4 2.3/2.5: jogo semDisco (2.1) nunca gera oferta Usado — o código
  // de ativação é de uso único, não revende; jogo ainda não lançado também
  // não tem mercado de Usado (não existe o que revender). Em qualquer dos
  // dois casos, "both"/"used" caem pra "new" (sem Novo no bucket, vira
  // "none" — nunca Usado escondido atrás de outro rótulo).
  const semDisco=meta.semDisco!=null?meta.semDisco:!!cat?.semDisco;
  const notLaunched=cat?releaseState(cat)!=='lancado':false;
  const bucketRoll=hashStr(gameId+'|pacote3-bucket')%100;
  let bucket=bucketRoll<35?'used':bucketRoll<60?'new':bucketRoll<85?'both':bucketRoll<95?'digital':'none';
  if(semDisco||notLaunched){
    if(bucket==='both')bucket='new';
    else if(bucket==='used')bucket='none';
  }
  const isRetro=year!=null&&Number(year)<=2012;
  let newBase=189+(hashStr(gameId+'|pacote3-base')%172); // 189..360
  if(isRetro)newBase=Math.round(newBase*0.6);
  const newPrice=Math.floor(newBase)+0.9;
  const usedFrac=0.55+(hashStr(gameId+'|pacote3-usedfrac')%31)/100; // .55..85
  const usedPrice=Math.floor(newBase*usedFrac)+0.9;
  const hasNew=bucket==='new'||bucket==='both',hasUsed=bucket==='used'||bucket==='both',hasDigital=bucket==='digital';
  return {
    bucket,
    new:hasNew?{price:newPrice,display:brl(newPrice),exemplo:true}:null,
    used:hasUsed?{price:usedPrice,display:brl(usedPrice),exemplo:true}:null,
    // "consultar nas lojas" — o bucket "só digital" nunca tem preço de
    // exemplo, só confirma que a condição existe pro jogo (item 2.1).
    digital:hasDigital?{price:null,display:null,consult:true,exemplo:true}:null,
    // Preço de referência SEMPRE presente (ignora o bucket) — usado só pela
    // página /tema/ (renderTheme), que é uma vitrine de demonstração própria
    // e sempre mostra Novo+Usado juntos quando a configuração do destaque
    // pede os dois; mantém o MESMO valor de new/used quando o bucket já os
    // inclui, só não vira null quando o bucket escolheu outra condição.
    rawNew:{price:newPrice,display:brl(newPrice),exemplo:true},
    rawUsed:{price:usedPrice,display:brl(usedPrice),exemplo:true}
  };
}
// Lista de "anúncios" de exemplo (pro modal comparador/autoload de preço),
// derivada do MESMO preço de sampleOffers — o primeiro item da lista
// ordenada é sempre esse preço, os demais variam só pra cima dele.
function sampleOfferList(gameId,meta,cond){
  const s=sampleOffers(gameId,meta);
  const entry=cond==='used'?s.used:cond==='new'?s.new:null;
  if(!entry)return [];
  const title=meta?.title||gameId;
  const r=mulberry32(hashStr(gameId+'|'+cond+'|pacote3-list'));
  const count=2+Math.floor(r()*6);
  const list=[];
  for(let i=0;i<count;i++){
    const value=i===0?entry.price:Math.floor(entry.price*(1+r()*0.18))+0.9;
    list.push({source:SAMPLE_OFFER_SOURCES[Math.floor(r()*SAMPLE_OFFER_SOURCES.length)],sourceKind:'nacional',title:`${title} — anúncio de exemplo ${i+1}`,condition:cond==='new'?'Novo':'Usado',priceValue:value,displayPrice:brl(value),originalDisplayPrice:brl(value),url:'#exemplo',image:'',location:'',currency:'BRL',shippingIncluded:r()>0.75,mock:true,exemplo:true});
  }
  return list.sort((a,b)=>a.priceValue-b.priceValue);
}
// Menor condição física de exemplo (usado é sempre <= novo por construção,
// então "both" devolve usado) — usado pelos cards que mostram só 1 preço
// (home, hub de games) quando ainda não há oferta real em cache.
function sampleOffersBestPhysical(gameId,meta){
  const s=sampleOffers(gameId,meta);
  if(s.used)return {cond:'used',label:'Usado',...s.used};
  if(s.new)return {cond:'new',label:'Novo',...s.new};
  return null;
}

const LS={
  get(k,def){try{const v=localStorage.getItem(k);return v==null?def:JSON.parse(v)}catch{return def}},
  set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch{}},
  del(k){try{localStorage.removeItem(k)}catch{}}
};
const KEYS={inv:'inventario-gamer:v096:inventory',sums:'inventario-gamer:v096:sums',mock:'inventario-gamer:v096:mock'};

/* ---------- ícones (SVG inline, sem dependência) ---------- */
const ICONS={
  search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6"/>',
  heart:'<path d="M12 20.3s-7.6-4.5-9.4-9.3C1.4 7.7 3.4 4.8 6.6 4.8c2 0 3.6 1 5.4 2.9 1.8-1.9 3.4-2.9 5.4-2.9 3.2 0 5.2 2.9 4 6.2-1.8 4.8-9.4 9.3-9.4 9.3z"/>',
  bell:'<path d="M6 9.5a6 6 0 1 1 12 0c0 6 2.5 7.5 2.5 7.5h-17S6 15.500 6 9.500z"/><path d="M10 20.500a2 2 0 0 0 4 0"/>',
  bag:'<path d="M9 6.500a3 3 0 0 1 6 0"/><rect x="4.500" y="6.500" width="15" height="14" rx="3.500"/><path d="M9 14.500h6"/>',
  check:'<path d="m5 12.500 4.500 4.500L19 7.500"/>',
  close:'<path d="M6 6l12 12M18 6 6 18"/>',
  filter:'<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',
  gamepad:'<rect x="3" y="7" width="18" height="10" rx="5"/><path d="M8 10v4M6 12h4"/><circle cx="15.500" cy="11" r=".6"/><circle cx="17.500" cy="13" r=".6"/>',
  retro:'<rect x="3" y="6" width="7" height="14" rx="1.2"/><path d="M5.500 6V3.800h2v2.200"/><circle cx="16.700" cy="13" r="5.300"/><circle cx="16.700" cy="13" r="1.300"/>',
  cube:'<path d="M12 3 4 7.500v9L12 21l8-4.500v-9z"/><path d="m4 7.500 8 4.500 8-4.500M12 12v9"/>',
  brush:'<path d="M4 20c0-3 2-4 4-4l1 1c0 2-1 3-5 3z"/><path d="m9 16 9.500-9.500a2 2 0 0 0-3-3L6 13z"/>',
  trend:'<path d="m3 17 6-6 4 4 8-8"/><path d="M15 6h6v6"/>',
  tag:'<path d="M20 12.5 12.5 20 4 11.5V4h7.5z"/><circle cx="8.5" cy="8.5" r="1.5"/>',
  menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',
  chest:'<rect x="3" y="10" width="18" height="10" rx="2"/><path d="M3 10a9 9 0 0 1 18 0"/><path d="M10 14h4"/>'
};
const ico=(n,s=18,cls='')=>`<svg class="ico ${cls}" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n]||''}</svg>`;

/* ---------- modo demonstração (dados de exemplo) ---------- */
(function readMockParam(){
  const qp=new URLSearchParams(location.search).get('mock');
  if(qp==='0'||qp==='1'){
    LS.set(KEYS.mock,qp==='1'?1:0);
    try{history.replaceState(null,'',location.pathname+location.hash)}catch{}
  }
})();
const mockOn=()=>{const s=LS.get(KEYS.mock,null);return s===null?!!M.config.enabled:s===1};
const mockOffers=()=>mockOn()&&!!M.config.offers;
const mockMerch=()=>mockOn()&&!!M.config.merch;
const GENRES=D.genreList||[];
// Fase 1: com a barra lateral cuidando da navegação, a migalha de pão some
// das páginas — flag única pra religar se precisar no futuro.
const SHOW_BREADCRUMB=false;
// Fase 6: fundo ambiente (camada fixa atrás de tudo, reaproveitando a arte
// do hero já carregada, sem pedido novo) — opcional, desligado por padrão.
const AMBIENT_BG=false;
// Pacote único, item 4.3: selo "Exclusivo" (franquia com casa === a
// plataforma da aba ativa) atrás de flag — desligado por padrão até
// aprovação visual.
const SHOW_EXCLUSIVE_BADGE=false;
// Parte B, item 7e: busca sem resultado nenhum registra só o termo
// normalizado + contagem (HINCRBY) no KV já configurado pro Mercado Livre —
// sem IP nem qualquer identificação, só pra descobrir apelido que falta.
// Desligado por padrão; precisa ligar aqui E o backend ter SEARCH_MISS_LOG=true
// (ver api/trending.js) — as duas pontas desligadas por padrão de propósito.
const SEARCH_MISS_LOG=false;
// rodada11, item 7: desliga o aviso "Mostrando resultados de X (também
// conhecido como Y)" na busca — o apelido continua valendo pra busca,
// autocomplete e banner "Conheça o universo" (que nunca mostrou o aviso,
// só o nome oficial); código mantido pra religar bastando virar true.
const ALIAS_NOTE=false;
// Pacote4 3.4: tenta a versão pt-br dos links diretos da PlayStation Store
// (troca o segmento de locale da URL) — desligado por padrão; sem rede
// neste ambiente pra validar contra a Store de verdade (ver app-2-search.js
// psStoreLocaleBR). Ligar só depois de confirmar no preview.
const STORE_LOCALE_BR=false;
// Item 6 (rodada 5) / pacote único, item 6.3: override manual de hero por
// jogo (src/data/hero-overrides.json). {url} só aceita o CDN oficial da
// IGDB (images.igdb.com) — qualquer outra origem é rejeitada (e avisada no
// console) pra não virar brecha de hot-linking de imagem de fonte
// desconhecida. {fallback:true} força o degradê da franquia + sigla
// mesmo que a IGDB tenha uma arte disponível — usado quando a arte real é
// ruim (logo/wordmark) e ainda não temos uma artwork de troca verificada.
let HERO_OVERRIDES={};
try{
  const xhrHero=new XMLHttpRequest();
  xhrHero.open('GET','/src/data/hero-overrides.json?v=Pacote6',false);
  xhrHero.send(null);
  if(xhrHero.status===200){
    const raw=JSON.parse(xhrHero.responseText);
    HERO_OVERRIDES={};
    Object.entries(raw).forEach(([slug,v])=>{
      if(slug.startsWith('_'))return;
      if(v&&v.fallback){HERO_OVERRIDES[slug]=v;return}
      if(v&&v.url){
        if(/^https:\/\/images\.igdb\.com\//.test(v.url))HERO_OVERRIDES[slug]=v;
        else console.warn('[hero-overrides] URL fora do CDN da IGDB, ignorada:',slug,v.url);
      }
    });
  }
}catch(e){/* mantém {} */}
const genreLabel=k=>(GENRES.find(g=>g.slug===k)||{}).label||k;
const mockChip=()=>'<span class="mock-chip">EXEMPLO</span>';
// Pacote4 1.1: botão de preço do hero (home/universo). Duas versões de texto
// na mesma marcação — a curta (sem "a partir de") entra quando o bloco de
// texto do hero fica estreito (<340px), via container query em CSS; nenhum
// JS decide isso em runtime, então não quebra em 3 linhas nem precisa medir.
function heroPriceCtaText(label,value,mockHtml){
  return `<span class="hpc-full">${label} a partir de ${value}</span><span class="hpc-short">${label} ${value}</span>${mockHtml||''}`;
}
// Selo de tipo de loja. "Oficial" só existe com prova real (loja da própria
// plataforma); marketplace e revenda, mesmo grandes e confiáveis, são "Varejo/revenda".
const retailChip=kind=>kind==='oficial'?'<span class="retail-chip oficial">Loja oficial</span>'
  :kind==='autorizado'?'<span class="retail-chip">Varejo autorizado</span>'
  :kind==='varejo'?'<span class="retail-chip">Varejo/revenda</span>':'';

// Pacote4 3.2: campo manual `lojas` no catálogo — [{loja,url}], loja em
// STORE_NAMES (mesmos nomes do mapeamento da IGDB em lib/igdb.js, pra UI
// não ter que conhecer dois vocabulários) — tem PRIORIDADE sobre o link
// que a IGDB (3.1) devolver pro mesmo jogo, pra corrigir manualmente os
// títulos principais (sobretudo PlayStation/Xbox/Nintendo, cujo código de
// categoria a IGDB não confirma de forma estável). Nenhuma URL é inventada
// aqui — fica vazio até o dono confirmar e preencher no catalog-data.js.
const STORE_NAMES=new Set(['Steam','GOG','Epic Games','Xbox','PlayStation','Nintendo','itch.io']);
function catalogStoreLinks(p){
  if(!Array.isArray(p?.lojas))return [];
  return p.lojas.filter(l=>l&&STORE_NAMES.has(l.loja)&&/^https?:\/\//i.test(String(l.url||'')));
}

/* ---------- catálogo: slugs, universos, plataformas ---------- */
const collectionsByTitle=new Map();
Object.values(D.collections).forEach(c=>c.items.forEach(i=>{if(!collectionsByTitle.has(i.title))collectionsByTitle.set(i.title,i)}));
const usedSlugs=new Set();
// Pacote4 2.1: Sony anunciou (1º/07/2026) que, a partir de jan/2028, jogos
// novos de PlayStation vêm só digital ou em caixa física COM CÓDIGO (sem
// disco). semDisco é manual por título (campo no catalog-data.js, ex.: GTA
// VI, cuja edição física já nasce sem disco antes da regra geral) OU
// automático: jogo de PlayStation com lançamento >= 2028-01-01. formato
// deriva de semDisco quando não vier explícito no catálogo.
const PS_NO_DISC_FROM='2028-01-01';
function computeSemDisco(p){
  if(typeof p.semDisco==='boolean')return p.semDisco;
  const isPlayStation=(p.variants||[]).some(v=>v[0]==='PlayStation');
  return !!(isPlayStation&&p.releaseDate&&p.releaseDate>=PS_NO_DISC_FROM);
}
function computeFormato(p,semDisco){
  if(p.formato)return p.formato;
  if(p.new===false&&p.used===false)return 'digital';
  return semDisco?'fisico-codigo':'fisico-disco';
}
const catalog=D.catalog.map(p=>{
  const c=collectionsByTitle.get(p.title);
  let slug=c?c.slug:slugify(p.title);
  while(usedSlugs.has(slug))slug+='-2';
  usedSlugs.add(slug);
  const semDisco=computeSemDisco(p);
  return {...p,slug,year:c?c.year:null,universe:slugify(p.franchise),searchText:normSearch([p.title,...p.aliases,p.franchise].join(' ')),semDisco,formato:computeFormato(p,semDisco)};
});
const catalogBySlug=new Map(catalog.map(p=>[p.slug,p]));

// Algumas versões (remake/remaster/porte) têm nome oficial ligeiramente
// diferente na IGDB, com capa própria (ex: "Super Mario Bros. Wonder" no
// Switch x "...: Nintendo Switch 2 Edition"). O 3º item da variante
// [ecossistema, plataforma, tituloIgdb?] permite apontar o nome certo pra
// busca de capa sem mudar o título que aparece pro usuário no site.
function igdbTitleFor(p,platform){
  if(!p)return '';
  const v=platform&&p.variants?p.variants.find(x=>x[1]===platform):null;
  return (v&&v[2])||p.title;
}

// Paleta por franquia (ajustes fase 1, item E · src/data/paleta-universos.json).
// Carregada de forma síncrona: é um arquivo local pequeno e precisa estar
// pronta já no primeiro render (senão o universo abriria com a cor errada
// por um instante até um fetch assíncrono voltar).
let PALETA_UNIVERSOS={padrao:{fundo:'#1f0b14',painel:'#2a1019',acao:'#E64236',acaoTexto:'#000000'},universos:[]};
try{
  const xhrPal=new XMLHttpRequest();
  xhrPal.open('GET','/src/data/paleta-universos.json?v=Teste-Layout-Beta2',false);
  xhrPal.send(null);
  if(xhrPal.status===200)PALETA_UNIVERSOS=JSON.parse(xhrPal.responseText);
}catch(e){/* mantém o fallback "padrao" acima */}
// Pacote3, item 3.1: slides do hero largo da home — mesmo padrão de carga
// síncrona do arquivo acima. Sem arquivo ou vazio: HOME_HEROES fica [] e
// renderHome() cai no fallback de /api/trending (ver loadHomeHeroSlides).
let HOME_HEROES=[];
try{
  const xhrHeroes=new XMLHttpRequest();
  xhrHeroes.open('GET','/src/data/home-heroes.json?v=Pacote3',false);
  xhrHeroes.send(null);
  if(xhrHeroes.status===200){const parsed=JSON.parse(xhrHeroes.responseText);if(Array.isArray(parsed))HOME_HEROES=parsed}
}catch(e){/* mantém HOME_HEROES=[] — cai no fallback */}
const paletaIdx=new Map();
(PALETA_UNIVERSOS.universos||[]).forEach(p=>{
  paletaIdx.set(p.slug,p);
  (p.aliases||[]).forEach(a=>paletaIdx.set(norm(a),p));
  paletaIdx.set(norm(p.nome),p);
});
// Parte B, item 7b/7d: apelidos de franquia pra busca — carga síncrona igual
// aos outros arquivos pequenos acima. Independente da paleta de cor (uma
// franquia pode ter apelido de busca sem ainda ter cor própria, ex. Donkey
// Kong) — nunca cria nem altera entrada de paleta-universos.json.
let SEARCH_ALIASES={};
try{
  const xhrAliases=new XMLHttpRequest();
  xhrAliases.open('GET','/src/data/search-aliases.json?v=Pacote3b',false);
  xhrAliases.send(null);
  if(xhrAliases.status===200)SEARCH_ALIASES=JSON.parse(xhrAliases.responseText);
}catch(e){/* mantém {} — busca cai só nos aliases do próprio jogo/franquia literal */}
// Pacote4 4.1: fonte única de merch (colecionáveis, decoração, casa,
// iluminação, vestuário, livros e arte) — ver 0.A: lib/shopee-manual-
// offers.js é só de JOGOS (preço, chaveado por título), estrutura
// incompatível com item de merch (categoria/origem/tipo/imagem), por isso
// este arquivo é uma fonte separada, não uma extensão daquele. Migra os
// 25 itens de demonstração que existiam em mock-data.js (M.items) — 1
// item ("Controle edição temática") ficou de fora porque é acessório
// (fora do escopo desta seção; ver backlog item 7). exemplo:true em
// todos por enquanto; merchItemsVisible() já filtra pelo modo
// demonstração (mockOn()), como o M.items antigo fazia via mockMerch().
let MERCH_ITEMS=[];
try{
  const xhrMerch=new XMLHttpRequest();
  xhrMerch.open('GET','/src/data/merch.json?v=Pacote4',false);
  xhrMerch.send(null);
  if(xhrMerch.status===200){const parsed=JSON.parse(xhrMerch.responseText);if(Array.isArray(parsed))MERCH_ITEMS=parsed}
}catch(e){/* mantém [] — telas de merch caem no estado "sem itens" */}
function merchItemsVisible(){
  return MERCH_ITEMS.filter(it=>!it.exemplo||mockOn());
}
// slug-de-franquia normalizado -> lista de apelidos normalizados (pra
// comparar com normSearch(termo digitado) em scoreTitle). searchAliasIdx
// faz o caminho inverso (apelido normalizado -> {slug,alias cru}) pra achar
// o apelido exato que bateu e montar o aviso "também conhecido como".
const franchiseAliasIdx=new Map(),searchAliasIdx=new Map();
Object.entries(SEARCH_ALIASES).forEach(([slug,aliases])=>{
  if(slug.startsWith('_')||!Array.isArray(aliases))return;
  const norms=aliases.map(a=>normSearch(a));
  franchiseAliasIdx.set(slug,norms);
  aliases.forEach((a,i)=>searchAliasIdx.set(norms[i],{slug,alias:a}));
});
// Franquia que cruzou o piso de 3 jogos mas ainda não tem entrada na paleta
// (ex.: Donkey Kong) cai em null — quem chama usa o bloco "padrao" (tokens
// --page-bg/--panel-base/--action já nascem com esses valores no :root).
function paletteForUniverse(u){
  if(!u)return null;
  return paletaIdx.get(u.slug)||paletaIdx.get(norm(u.name))||null;
}
// Pacote4 2.4: estado de lançamento — "lancamento" é o par releaseDate
// (ISO, campo já existente no catálogo, reaproveitado como a "data") +
// preVenda (boolean, novo; "fonte" já existe como catalogSources). Estado
// derivado: data futura + preVenda => 'pre-venda'; data futura sem
// preVenda => 'anunciado'; data passada ou ausente => 'lancado'. A virada
// é à meia-noite em America/Sao_Paulo (não no fuso de quem está vendo),
// por isso compara datas (YYYY-MM-DD) em vez de diffDays com Date local.
const saoPauloDateFmt=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo'});
function todaySaoPaulo(){return saoPauloDateFmt.format(new Date())}
function releaseState(p){
  if(!p||!p.releaseDate)return 'lancado';
  if(p.releaseDate<=todaySaoPaulo())return 'lancado';
  return p.preVenda?'pre-venda':'anunciado';
}
function releaseDateDisplay(p){
  if(!p||!p.releaseDate)return '';
  const [y,m,d]=p.releaseDate.split('-');
  return `Lançamento previsto: ${d}/${m}/${y}`;
}
function releaseBadge(p){
  const state=releaseState(p);
  if(state==='pre-venda')return 'PRÉ-VENDA';
  if(state==='anunciado')return 'EM BREVE';
  if(!p||!p.releaseDate)return null;
  const rd=new Date(p.releaseDate+'T00:00:00'),diffDays=(rd-new Date())/86400000;
  if(diffDays>-10)return 'LANÇAMENTO';
  return null;
}

// Fase 3: "casa" = dona/first-party da franquia (nintendo|playstation|xbox|
// multi) — não confundir com --eco (onde o jogo É VENDIDO, usado no chip de
// plataforma). Tabela aplicada literalmente como pedido; franquia fora dela
// cai em "multi" mesmo sendo claramente first-party de alguém — ver RESUMO
// FINAL da rodada pelos casos sinalizados como duvidosos.
const CASA_TABLE={
  nintendo:['Mario','Zelda','The Legend of Zelda','Pokémon','Metroid','Kirby','Donkey Kong','Smash','Super Smash Bros.'],
  playstation:['God of War','Uncharted','The Last of Us','Gran Turismo','Horizon','Ratchet & Clank','LittleBigPlanet','Spider-Man',"Marvel's Spider-Man",'Marvel Spider-Man'],
  xbox:['Halo','Gears','Forza'],
  multi:['Resident Evil','Sonic','Mortal Kombat','Call of Duty','GTA','Grand Theft Auto',"Assassin's Creed",'Dark Souls','Elden Ring','Alan Wake','Diablo','EA Sports FC','Silent Hill']
};
const casaIdx=new Map();
Object.entries(CASA_TABLE).forEach(([casa,names])=>names.forEach(n=>casaIdx.set(norm(n),casa)));
function casaFor(name){return casaIdx.get(norm(name))||'multi'}

// Item 6 (rodada 5) / pacote4 1.5: sigla curada por franquia (nunca
// monograma automático — initialsOf() colidia, ex. Mario e Metroid viravam
// os dois "M"). Cobre as franquias grandes das casas Nintendo/PlayStation/
// Xbox (mostradas na página de plataforma). Fora dessas, cai no fallback
// initialsOf() — intencional só pelo tamanho do problema: franchiseDirectory
// em catalog-data.js tem ~250 entradas, a maioria jogo avulso do catálogo do
// GPT ainda não triado (CLAUDE.md, backlog item 1 — "universo só com 3+
// jogos"); curar sigla manual pra cada uma seria trabalho arbitrário que a
// triagem do catálogo vai invalidar de qualquer jeito. Resumo do pacote4 1.5
// lista o que foi corrigido agora x o que ainda depende dessa triagem.
const SIGLA_TABLE={
  mario:'SM','the-legend-of-zelda':'Z',pokemon:'PK',metroid:'MT',kirby:'KB','donkey-kong':'DK','super-smash-bros':'SS',
  'god-of-war':'GoW',uncharted:'UC','the-last-of-us':'TLOU','gran-turismo':'GT',horizon:'HZ','ratchet-and-clank':'RC','ratchet-clank':'RC',littlebigplanet:'LBP','spider-man':'SP',
  halo:'HL',gears:'GR',forza:'FZ',
  // Pacote4 1.5: antes caíam no fallback initialsOf() (NF/ES) — ambos
  // apareciam na lista "Universos Xbox" da página de plataforma.
  'need-for-speed':'NFS','the-elder-scrolls':'TES'
};
const sigIdx=new Map();
Object.entries(SIGLA_TABLE).forEach(([slug,sig])=>sigIdx.set(slug,sig));
function siglaFor(slug,name){return sigIdx.get(slug)||initialsOf(name).slice(0,2)}

// Pacote único, seção 1: fundo liso por plataforma (tema [platform]), de
// src/data/paleta-plataformas.json — mesmo formato de paleta-universos.json,
// reaproveita applyUniverseChrome(). PLATFORM_CHROME fica só como fallback
// caso o arquivo não carregue (rede fora do ar etc.).
let PALETA_PLATAFORMAS={};
try{
  const xhrPlat=new XMLHttpRequest();
  xhrPlat.open('GET','/src/data/paleta-plataformas.json?v=Pacote1',false);
  xhrPlat.send(null);
  if(xhrPlat.status===200)PALETA_PLATAFORMAS=JSON.parse(xhrPlat.responseText);
}catch(e){/* mantém {} — cai no fallback PLATFORM_CHROME abaixo */}
const PLATFORM_CHROME={
  nintendo:{fundo:'#5c1712',painel:'#6b1c16',acao:'#e0392f',acaoTexto:'#ffffff'},
  playstation:{fundo:'#0e2740',painel:'#123252',acao:'#3a86c8',acaoTexto:'#ffffff'},
  xbox:{fundo:'#0b4016',painel:'#0e4e1b',acao:'#3ac150',acaoTexto:'#000000'}
};
function paletteForPlatform(slug){return PALETA_PLATAFORMAS[slug]||PLATFORM_CHROME[slug]||null}
const PLATFORM_LABEL={nintendo:'Nintendo',playstation:'PlayStation',xbox:'Xbox'};
// Pacote único, item 6.2: o "xbox-mark.svg" era um wordmark DESENHADO por
// nós imitando a tipografia da marca (criado numa rodada anterior só
// porque a rede bloqueava buscar o SVG oficial) — proibido por regra geral
// deste pacote ("nunca recriar nem imitar logotipos"). Removido da tabela:
// sem entrada aqui, o card da plataforma cai no fallback de texto simples
// (.platform-brand-fallback, DM Sans 700, já era o comportamento pra
// qualquer plataforma sem logo).
const PLATFORM_LOGO={nintendo:'/assets/nintendo-logo.svg',playstation:'/assets/playstation-logo.svg',xbox:'/assets/xbox-logo.svg'};

const universes=[],uMap=new Map();
function addUniverse(name,eco){
  const slug=slugify(name);
  if(uMap.has(slug))return uMap.get(slug);
  const u={slug,name,eco:eco||'Multi',hasCatalog:false,casa:casaFor(name),sigla:siglaFor(slug,name)};
  uMap.set(slug,u);universes.push(u);return u;
}
// Ajuste 4B.3: addUniverse() é "primeira-escrita-vence" — processar as
// chaves na ordem natural do objeto (Nintendo, PlayStation, Multi) trava
// o eco de QUALQUER franquia também listada em Nintendo/PlayStation (quase
// todas, incluindo Elden Ring e Resident Evil, que também aparecem em
// Multi) antes de chegar na entrada Multi, que nunca roda. Resultado:
// nenhuma franquia do catálogo resolvia eco==='Multi' (conferido — a
// interseção de "só em Multi" é vazia), e o link da Steam em
// digitalStores() (único lugar que lê u.eco) nunca aparecia pra ninguém.
// Processar "Multi" primeiro faz a entrada Multi (sinal editorial de
// franquia realmente multiplataforma, inclusive PC) ganhar prioridade —
// franquia sem entrada em Multi continua caindo em Nintendo/PlayStation
// normalmente.
['Multi','Nintendo','PlayStation'].forEach(eco=>(D.franchiseDirectory[eco]||[]).forEach(n=>addUniverse(n,eco)));
catalog.forEach(p=>{addUniverse(p.franchise,'Multi').hasCatalog=true});
const titlesOf=slug=>catalog.filter(p=>p.universe===slug);

// Pacote único, item 4.2: "casa" (franquia dona) só serve pra ordenar e pro
// selo "Exclusivo" — a plataforma de verdade de uma franquia é derivada dos
// jogos catalogados (nunca digitada à mão): u.plataformas é o conjunto de
// ecossistemas de 1ª parte (nintendo/playstation/xbox) em que a franquia TEM
// jogo no catálogo, lido de variants[][0] de cada título. SEGA (Sonic) e
// qualquer outro eco fora dos três não conta pra esse conjunto — franquia
// só com jogos fora dos três (ex. só SEGA) fica com plataformas:[] (listada
// no resumo da rodada como "casa: multi sem jogo em console").
const PLATFORM_ECO_KEY={Nintendo:'nintendo',PlayStation:'playstation',Xbox:'xbox'};
(function derivePlataformas(){
  const sets=new Map();
  catalog.forEach(p=>{
    const u=uMap.get(p.universe);
    if(!u)return;
    if(!sets.has(u.slug))sets.set(u.slug,new Set());
    const set=sets.get(u.slug);
    p.variants.forEach(v=>{const k=PLATFORM_ECO_KEY[v[0]];if(k)set.add(k)});
  });
  universes.forEach(u=>{u.plataformas=[...(sets.get(u.slug)||[])].sort()});
})();

const platIdx=D.platformAliases.map(p=>({platform:p.platform,aliases:p.aliases.map(norm).sort((a,b)=>b.length-a.length)}));
function detectPlatform(q){const n=' '+norm(q)+' ';for(const p of platIdx)for(const a of p.aliases)if(n.includes(' '+a+' '))return p.platform;return null}
function stripPlatform(q,platform){
  let n=' '+norm(q)+' ';
  if(platform){const p=platIdx.find(x=>x.platform===platform);for(const a of p.aliases){const pat=' '+a+' ';while(n.includes(pat))n=n.split(pat).join(' ')}}
  // normSearch de novo por cima (não dá pra aplicar antes: o pattern-match
  // acima dos aliases de plataforma usa norm() puro) — garante que o roman
  // numeral também vire arábico no resultado final de stripPlatform.
  return normSearch(n.replace(/\s+/g,' ').trim());
}
const hasDigital=(p,platform)=>D.digitalPlatforms.includes(platform);
const isRetro=platform=>D.retroPlatforms.includes(platform);
const platShort=p=>p.variants.map(v=>v[1]).join(' · ');

/* ---------- capas de exemplo (marcador de posição) ---------- */
function initialsOf(title){
  const stop=new Set(['the','of','and','a','de','do','da']);
  const words=norm(title).split(' ').filter(w=>w&&!stop.has(w));
  const letters=words.slice(0,3).map(w=>/^\d+$/.test(w)?w:w[0].toUpperCase()).join('');
  return letters.slice(0,4)||'?';
}
function coverTile(title,{platform='',size='',note=true,mock=false,image=''}={}){
  const h=hashStr(title)%360;
  const src=safeUrl(image);
  const pic=src!=='#'?`<img class="cv-img" src="${esc(src)}" alt="" loading="lazy" referrerpolicy="no-referrer">`:'';
  const placeholder=`<span class="cv-ini">${esc(initialsOf(title))}</span>${note?'<span class="cv-note">capa em carregamento</span>':'<span></span>'}`;
  return `<div class="cover ${size} ${pic?'has-image':''}" style="--h:${h}" aria-hidden="true">${pic}${platform?`<span class="cv-plat">${esc(platform)}</span>`:'<span></span>'}${pic?'':placeholder}${mock?mockChip():''}</div>`;
}

/* ---------- Meu Inventário: dados locais (sem login) ---------- */
function migrateV095(){
  const cs=LS.get('inventario-gamer:v095:collections',{}),as=LS.get('inventario-gamer:v095:alerts',{}),ta=LS.get('inventario-gamer:v095:title-alerts',{});
  const items={},now=new Date().toISOString();
  for(const [ck,state] of Object.entries(cs||{})){
    const col=D.collections[ck];if(!col||!state)continue;
    for(const it of col.items){
      const st=state[it.slug],al=as?.[ck]?.[it.slug];
      if(!st&&!al)continue;
      const p=catalogBySlug.get(it.slug);
      items['game:'+it.slug]={id:'game:'+it.slug,kind:'game',cat:'games',title:it.title,universe:p?p.universe:null,platforms:it.platforms,status:st||'wanted',alert:!!al,addedAt:now};
    }
  }
  for(const [k,v] of Object.entries(ta||{})){
    const p=catalog.find(x=>norm(x.title)===k);
    const id=p?'game:'+p.slug:'game:'+k.replace(/ /g,'-');
    if(items[id])items[id].alert=true;
    else items[id]={id,kind:'game',cat:'games',title:v.title||k,universe:p?p.universe:null,platforms:p?p.variants.map(x=>x[1]):[],status:'wanted',alert:true,addedAt:v.createdAt||now};
  }
  return items;
}
const inv={items:{}};
(function loadInv(){
  const saved=LS.get(KEYS.inv,null);
  if(saved&&saved.items){inv.items=saved.items;return}
  const migrated=migrateV095();
  inv.items=migrated;
  if(Object.keys(migrated).length)LS.set(KEYS.inv,{v:1,items:migrated});
})();
const saveInv=()=>LS.set(KEYS.inv,{v:1,items:inv.items});
const invGet=id=>inv.items[id]||null;
const invList=()=>Object.values(inv.items);
function invSet(ref,patch){
  const cur=inv.items[ref.id]||{id:ref.id,kind:ref.kind,cat:ref.cat||null,type:ref.type||null,origin:ref.origin||null,unique:!!ref.unique,creator:ref.creator||null,title:ref.title,universe:ref.universe||null,platforms:ref.platforms||[],price:ref.price??null,mock:!!ref.mock,addedAt:new Date().toISOString(),status:null,alert:false};
  Object.assign(cur,patch);
  if(!cur.status&&!cur.alert)delete inv.items[ref.id];else inv.items[ref.id]=cur;
  saveInv();updateBadge();
}
function updateBadge(){const b=$('#invCount');if(!b)return;const n=invList().length;b.textContent=n;b.hidden=!n}

/* registro de itens "salváveis" (evita colocar JSON dentro do HTML) */
const refs=new Map();
function regRef(ref){refs.set(ref.id,ref);return ref.id}
const gameRef=p=>({id:'game:'+p.slug,kind:'game',cat:'games',title:p.title,universe:p.universe,platforms:p.variants.map(v=>v[1])});
const mockRef=it=>({id:it.id,kind:it.unique?'fanmade':'merch',cat:it.cat,type:it.type,origin:it.origin,unique:it.unique,creator:it.creator||null,title:it.title,universe:it.universe,price:it.price,mock:true});
function saveButton(ref,{label=false,icon=true}={}){
  const id=regRef(ref),cur=invGet(id),on=!!cur;
  const txt=label?(on?(cur.status==='owned'?'Tenho':cur.status==='saved'?'Salvo':'Quero'):'Salvar'):'';
  return `<button class="save-btn ${on?'on':''} ${label?'':'icon-only'}" data-act="open-save" data-id="${esc(id)}" aria-label="${on?'Alterar':'Salvar'}: ${esc(ref.title)}">${icon?ico(cur&&cur.status==='owned'?'check':'heart',16,on&&cur.status!=='owned'?'on':''):''}${txt?`<span>${txt}</span>`:''}</button>`;
}
