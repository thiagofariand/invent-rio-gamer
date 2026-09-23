'use strict';

const FRANCHISES=[
  {name:'Pokémon',slug:'pokemon',aliases:['pokemon','pokémon']},
  {name:'The Legend of Zelda',slug:'the-legend-of-zelda',aliases:['zelda','ocarina of time','tears of the kingdom','breath of the wild']},
  {name:'Grand Theft Auto',slug:'grand-theft-auto',aliases:['grand theft auto','gta 5','gta v','gta 6','gta vi']},
  {name:'Resident Evil',slug:'resident-evil',aliases:['resident evil','biohazard']},
  {name:'Sonic',slug:'sonic',aliases:['sonic the hedgehog','sonic']},
  {name:'Call of Duty',slug:'call-of-duty',aliases:['call of duty','warzone','black ops','modern warfare']},
  {name:'God of War',slug:'god-of-war',aliases:['god of war','kratos']},
  {name:'Mortal Kombat',slug:'mortal-kombat',aliases:['mortal kombat','mk1','mk 1']},
  {name:"Assassin's Creed",slug:'assassin-s-creed',aliases:["assassin's creed",'assassins creed']}
];

const normalize=value=>String(value||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();

async function fetchYoutubeGaming(){
  const key=process.env.YOUTUBE_API_KEY;
  if(!key)return [];
  const query=new URLSearchParams({part:'snippet,statistics',chart:'mostPopular',regionCode:'BR',videoCategoryId:'20',maxResults:'50',key});
  const response=await fetch(`https://www.googleapis.com/youtube/v3/videos?${query}`,{headers:{Accept:'application/json'},signal:AbortSignal.timeout(9000)});
  if(!response.ok)throw new Error(`YouTube respondeu ${response.status}`);
  const data=await response.json();
  return (data.items||[]).map((item,index)=>({
    title:item.snippet?.title||'',
    channel:item.snippet?.channelTitle||'',
    views:Number(item.statistics?.viewCount||0),
    rank:index+1
  })).filter(item=>item.title);
}

function heuristicRanking(videos){
  return FRANCHISES.map(franchise=>{
    let score=0,hits=0;
    for(const video of videos){
      const hay=normalize(`${video.title} ${video.channel}`);
      if(!franchise.aliases.some(alias=>hay.includes(normalize(alias))))continue;
      hits++;
      score+=(60-video.rank)+Math.log10(Math.max(10,video.views));
    }
    return {...franchise,score,hits};
  }).filter(item=>item.hits).sort((a,b)=>b.score-a.score||b.hits-a.hits);
}

function responseText(data){
  if(data.output_text)return data.output_text;
  for(const item of data.output||[])for(const content of item.content||[])if(content.type==='output_text'&&content.text)return content.text;
  return '';
}

async function aiRanking(videos,heuristic){
  if(!process.env.OPENAI_API_KEY)return [];
  const allowed=FRANCHISES.map(item=>({name:item.name,slug:item.slug}));
  const body={
    model:process.env.OPENAI_TRENDS_MODEL||'gpt-5',
    store:false,
    input:`Selecione exatamente três franquias gamer em alta no Brasil a partir dos vídeos populares abaixo. Só use slugs da lista permitida. Priorize recorrência, posição e sinais claros do assunto; não invente lançamentos, datas nem preços. Escreva um motivo curto em português, sem alegações além dos dados.\n\nFranquias permitidas: ${JSON.stringify(allowed)}\n\nRanking heurístico: ${JSON.stringify(heuristic.slice(0,9).map(x=>({slug:x.slug,hits:x.hits,score:Number(x.score.toFixed(2))})))}\n\nVídeos: ${JSON.stringify(videos.slice(0,40).map(x=>({title:x.title,channel:x.channel,rank:x.rank,views:x.views})))}`,
    text:{format:{type:'json_schema',name:'inventario_gaming_trends',strict:true,schema:{
      type:'object',additionalProperties:false,required:['items'],properties:{items:{type:'array',minItems:3,maxItems:3,items:{type:'object',additionalProperties:false,required:['slug','reason'],properties:{slug:{type:'string',enum:allowed.map(x=>x.slug)},reason:{type:'string'}}}}}
    }}}
  };
  const response=await fetch('https://api.openai.com/v1/responses',{
    method:'POST',
    headers:{Authorization:`Bearer ${process.env.OPENAI_API_KEY}`,'Content-Type':'application/json'},
    body:JSON.stringify(body),
    signal:AbortSignal.timeout(15000)
  });
  if(!response.ok)throw new Error(`IA respondeu ${response.status}`);
  const data=await response.json();
  const parsed=JSON.parse(responseText(data));
  const used=new Set();
  return (parsed.items||[]).map(item=>{
    const franchise=FRANCHISES.find(x=>x.slug===item.slug);
    if(!franchise||used.has(item.slug))return null;
    used.add(item.slug);
    return {...franchise,reason:String(item.reason||'').slice(0,180)};
  }).filter(Boolean);
}

function publicItem(item){
  return {
    title:item.name,
    short:item.name,
    tag:'EM ALTA',
    copy:item.reason||`${item.name} está entre os assuntos gamer em destaque no Brasil hoje.`,
    universe:item.slug,
    href:`#/universo/${item.slug}`
  };
}

async function buildDailyTrends(){
  const videos=await fetchYoutubeGaming();
  if(!videos.length)return {configured:false,items:[],source:null};
  const heuristic=heuristicRanking(videos);
  let selected=[],usedAi=false;
  try{selected=await aiRanking(videos,heuristic);usedAi=selected.length>=3}catch{}
  if(selected.length<3)selected=heuristic.slice(0,3);
  if(selected.length<3)return {configured:true,items:[],source:'youtube-gaming-br'};
  return {configured:true,items:selected.slice(0,3).map(publicItem),source:usedAi?'youtube-gaming-br+ai':'youtube-gaming-br'};
}

module.exports={buildDailyTrends};
