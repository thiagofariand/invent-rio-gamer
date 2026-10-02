/* ============================================================
   Inventário Gamer v0.98 — core
   Sem framework e sem build: HTML + CSS + JS na Vercel.
   Dados estáticos: catalog-data.js · exemplos: mock-data.js
   Ofertas reais: /api/offers (Mercado Livre)
   ============================================================ */
const D=window.INV_DATA;
const M=window.INV_MOCK||{config:{enabled:false,offers:false,merch:false},items:[],offersFor:()=>[],offersForItem:()=>[]};

/* ---------- utilitários ---------- */
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const norm=s=>String(s??'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/['’]/g,'').replace(/&/g,' and ').replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
const slugify=s=>norm(s).replace(/ /g,'-');
const enc=encodeURIComponent;
const brl=v=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(v||0));
const safeUrl=u=>/^https?:\/\//i.test(String(u||''))?String(u):'#';
const sentence=s=>{s=String(s||'').toLowerCase();return s.charAt(0).toUpperCase()+s.slice(1)};
function hashStr(str){let h=2166136261;for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
async function mapLimit(items,limit,fn){let cursor=0;async function worker(){while(cursor<items.length){const i=cursor++;try{await fn(items[i],i)}catch{}}}await Promise.all(Array.from({length:Math.min(limit,items.length)},worker))}

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
// Item 6 (rodada 5): override manual de hero por jogo (src/data/hero-overrides.json).
let HERO_OVERRIDES={};
try{
  const xhrHero=new XMLHttpRequest();
  xhrHero.open('GET','/src/data/hero-overrides.json?v=Teste-Layout-Beta2',false);
  xhrHero.send(null);
  if(xhrHero.status===200)HERO_OVERRIDES=JSON.parse(xhrHero.responseText);
}catch(e){/* mantém {} */}
const genreLabel=k=>(GENRES.find(g=>g.slug===k)||{}).label||k;
const mockChip=()=>'<span class="mock-chip">EXEMPLO</span>';
// Selo de tipo de loja. "Oficial" só existe com prova real (loja da própria
// plataforma); marketplace e revenda, mesmo grandes e confiáveis, são "Varejo/revenda".
const retailChip=kind=>kind==='oficial'?'<span class="retail-chip oficial">Loja oficial</span>'
  :kind==='autorizado'?'<span class="retail-chip">Varejo autorizado</span>'
  :kind==='varejo'?'<span class="retail-chip">Varejo/revenda</span>':'';

/* ---------- catálogo: slugs, universos, plataformas ---------- */
const collectionsByTitle=new Map();
Object.values(D.collections).forEach(c=>c.items.forEach(i=>{if(!collectionsByTitle.has(i.title))collectionsByTitle.set(i.title,i)}));
const usedSlugs=new Set();
const catalog=D.catalog.map(p=>{
  const c=collectionsByTitle.get(p.title);
  let slug=c?c.slug:slugify(p.title);
  while(usedSlugs.has(slug))slug+='-2';
  usedSlugs.add(slug);
  return {...p,slug,year:c?c.year:null,universe:slugify(p.franchise),searchText:norm([p.title,...p.aliases,p.franchise].join(' '))};
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
const paletaIdx=new Map();
(PALETA_UNIVERSOS.universos||[]).forEach(p=>{
  paletaIdx.set(p.slug,p);
  (p.aliases||[]).forEach(a=>paletaIdx.set(norm(a),p));
  paletaIdx.set(norm(p.nome),p);
});
// Franquia que cruzou o piso de 3 jogos mas ainda não tem entrada na paleta
// (ex.: Donkey Kong) cai em null — quem chama usa o bloco "padrao" (tokens
// --page-bg/--panel-base/--action já nascem com esses valores no :root).
function paletteForUniverse(u){
  if(!u)return null;
  return paletaIdx.get(u.slug)||paletaIdx.get(norm(u.name))||null;
}
function releaseBadge(p){
  if(!p||!p.releaseDate)return null;
  const rd=new Date(p.releaseDate+'T00:00:00'),diffDays=(rd-new Date())/86400000;
  if(diffDays>0)return 'PRÉ-VENDA';
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
  playstation:['God of War','Uncharted','The Last of Us','Gran Turismo','Horizon','Ratchet & Clank','LittleBigPlanet',"Marvel's Spider-Man",'Marvel Spider-Man'],
  xbox:['Halo','Gears','Forza'],
  multi:['Resident Evil','Sonic','Mortal Kombat','Call of Duty','GTA','Grand Theft Auto',"Assassin's Creed",'Dark Souls','Elden Ring','Alan Wake','Diablo','EA Sports FC','Silent Hill']
};
const casaIdx=new Map();
Object.entries(CASA_TABLE).forEach(([casa,names])=>names.forEach(n=>casaIdx.set(norm(n),casa)));
function casaFor(name){return casaIdx.get(norm(name))||'multi'}

// Item 6 (rodada 5): sigla curada por franquia (nunca monograma automático
// — initialsOf() colidia, ex. Mario e Metroid viravam os dois "M"). Cobre
// hoje as franquias das casas Nintendo/PlayStation/Xbox (mostradas na
// página de plataforma); fora dessas cai no fallback initialsOf().
const SIGLA_TABLE={
  mario:'SM','the-legend-of-zelda':'Z',pokemon:'PK',metroid:'MT',kirby:'KB','donkey-kong':'DK','super-smash-bros':'SS',
  'god-of-war':'GoW',uncharted:'UC','the-last-of-us':'TLOU','gran-turismo':'GT',horizon:'HZ','ratchet-and-clank':'RC','ratchet-clank':'RC',littlebigplanet:'LBP','marvel-spider-man':'SPM',
  halo:'HL',gears:'GR',forza:'FZ'
};
const sigIdx=new Map();
Object.entries(SIGLA_TABLE).forEach(([slug,sig])=>sigIdx.set(slug,sig));
function siglaFor(slug,name){return sigIdx.get(slug)||initialsOf(name).slice(0,2)}

// Fase 5: fundo/ação por plataforma (mesmo formato de paleta-universos.json
// — fundo/painel/acao/acaoTexto — pra reaproveitar applyUniverseChrome()).
// Nintendo vermelho, PlayStation azul, Xbox verde, como pedido.
const PLATFORM_CHROME={
  nintendo:{fundo:'#5c1712',painel:'#6b1c16',acao:'#e0392f',acaoTexto:'#ffffff'},
  playstation:{fundo:'#0e2740',painel:'#123252',acao:'#3a86c8',acaoTexto:'#ffffff'},
  xbox:{fundo:'#0b4016',painel:'#0e4e1b',acao:'#3ac150',acaoTexto:'#000000'}
};
const PLATFORM_LABEL={nintendo:'Nintendo',playstation:'PlayStation',xbox:'Xbox'};
const PLATFORM_LOGO={nintendo:'/assets/nintendo-logo.svg',playstation:'/assets/playstation-logo.svg',xbox:'/assets/xbox-mark.svg'};

const universes=[],uMap=new Map();
function addUniverse(name,eco){
  const slug=slugify(name);
  if(uMap.has(slug))return uMap.get(slug);
  const u={slug,name,eco:eco||'Multi',hasCatalog:false,casa:casaFor(name),sigla:siglaFor(slug,name)};
  uMap.set(slug,u);universes.push(u);return u;
}
Object.entries(D.franchiseDirectory).forEach(([eco,arr])=>arr.forEach(n=>addUniverse(n,eco)));
catalog.forEach(p=>{addUniverse(p.franchise,'Multi').hasCatalog=true});
const ECO_LABEL={Nintendo:'Nintendo',PlayStation:'PlayStation',Multi:'Multiplataforma e retrô'};
const titlesOf=slug=>catalog.filter(p=>p.universe===slug);

const platIdx=D.platformAliases.map(p=>({platform:p.platform,aliases:p.aliases.map(norm).sort((a,b)=>b.length-a.length)}));
function detectPlatform(q){const n=' '+norm(q)+' ';for(const p of platIdx)for(const a of p.aliases)if(n.includes(' '+a+' '))return p.platform;return null}
function stripPlatform(q,platform){
  let n=' '+norm(q)+' ';
  if(platform){const p=platIdx.find(x=>x.platform===platform);for(const a of p.aliases){const pat=' '+a+' ';while(n.includes(pat))n=n.split(pat).join(' ')}}
  return n.replace(/\s+/g,' ').trim();
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
