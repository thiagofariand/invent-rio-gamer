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
  retro:'<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 8h8M8 12h5M8 16h3"/><circle cx="16" cy="16" r="1"/>',
  cube:'<path d="M12 3 4 7.500v9L12 21l8-4.500v-9z"/><path d="m4 7.500 8 4.500 8-4.500M12 12v9"/>',
  brush:'<path d="M4 20c0-3 2-4 4-4l1 1c0 2-1 3-5 3z"/><path d="m9 16 9.500-9.500a2 2 0 0 0-3-3L6 13z"/>'
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
const mockChip=()=>'<span class="mock-chip">EXEMPLO</span>';

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

const universes=[],uMap=new Map();
function addUniverse(name,eco){
  const slug=slugify(name);
  if(uMap.has(slug))return uMap.get(slug);
  const u={slug,name,eco:eco||'Multi',hasCatalog:false};
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
  return `<div class="cover ${size} ${pic?'has-image':''}" style="--h:${h}" aria-hidden="true">${pic}${platform?`<span class="cv-plat">${esc(platform)}</span>`:'<span></span>'}${pic?'':`<span class="cv-ini">${esc(initialsOf(title))}</span>${note?'<span class="cv-note">capa em carregamento</span>':'<span></span>'}`}${mock?mockChip():''}</div>`;
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
