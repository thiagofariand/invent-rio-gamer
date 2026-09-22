/* ============================================================
   INVENTÁRIO GAMER — mock-data.js (v0.96)
   DADOS DE DEMONSTRAÇÃO. Nada aqui é real.
   Tudo que vem deste arquivo aparece na tela com a etiqueta
   "EXEMPLO" e o rodapé avisa que o modo demonstração está ativo.

   Como desligar:
   - Troque  enabled:true  por  enabled:false  logo abaixo, ou
   - use o link "Modo demonstração" no rodapé do site, ou
   - abra o site com  ?mock=0  (e  ?mock=1  para ligar de novo).

   Como substituir por dados reais:
   - offersFor(): trocar pela resposta do /api/offers (já existe
     para Mercado Livre) — o site só usa este gerador quando a API
     não devolve ofertas e o modo demonstração está ligado.
   - items: trocar por uma fonte real de merch/fan-made
     (API de loja, feed de parceiro ou cadastro manual). A forma
     de cada item está descrita no comentário do primeiro objeto.
   ============================================================ */
window.INV_MOCK=(function(){
  const config={
    enabled:true,   // liga/desliga TODOS os dados de exemplo
    offers:true,    // preencher "a partir de" e ofertas quando a API não responde
    merch:true      // mostrar itens de merch/colecionáveis/fan-made de exemplo
  };

  /* Gerador determinístico: o mesmo título/plataforma sempre gera o mesmo exemplo. */
  function hash(str){let h=2166136261;for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
  function rng(seed){let a=seed>>>0;return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
  const fmt=v=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(v);

  const SOURCES=['Marketplace exemplo','Loja parceira exemplo','Vendedor exemplo'];

  /* cond: 'used' | 'new'. Devolve ofertas no MESMO formato do /api/offers. */
  function offersFor(title,platform,cond){
    const r=rng(hash(`${cond}|${title}|${platform}`));
    const count=2+Math.floor(r()*6);
    const base=cond==='new'?190+r()*200:55+r()*190;
    const list=[];
    for(let i=0;i<count;i++){
      const price=Math.round((base*(0.9+r()*0.9))*10)/10;
      const value=Math.floor(price)+0.9;
      list.push({
        source:SOURCES[Math.floor(r()*SOURCES.length)],
        sourceKind:'nacional',
        title:`${title} ${platform} — anúncio de exemplo ${i+1}`,
        condition:cond==='new'?'Novo':'Usado',
        priceValue:value,
        displayPrice:fmt(value),
        originalDisplayPrice:fmt(value),
        url:'#exemplo',
        image:'',
        location:'',
        currency:'BRL',
        shippingIncluded:r()>0.75,
        mock:true
      });
    }
    return list.sort((a,b)=>a.priceValue-b.priceValue);
  }


  /* Ofertas de exemplo para um item de merch/colecionável.
     A primeira oferta sempre tem o mesmo preço do item (para o "a partir de" bater). */
  function offersForItem(item){
    const r=rng(hash(item.id));
    const n=item.unique?1:2+Math.floor(r()*3);
    const list=[];
    for(let i=0;i<n;i++){
      const value=i===0?item.price:Math.round(item.price*(1+0.06*i+r()*0.05)*10)/10;
      list.push({
        source:SOURCES[i%SOURCES.length],
        sourceKind:'nacional',
        title:`${item.title} — anúncio de exemplo ${i+1}`,
        condition:'Novo',
        priceValue:value,
        displayPrice:fmt(value),
        originalDisplayPrice:fmt(value),
        url:'#exemplo',
        image:'',
        location:'',
        currency:'BRL',
        shippingIncluded:false,
        mock:true
      });
    }
    return list;
  }

  /* Itens de merch / colecionáveis / fan-made de exemplo.
     Forma de cada item:
     {
       id:'mock-…',            identificador único
       cat:'colecionaveis'|'acessorios'|'merch'|'fanmade',
       type:'amiibo'|'figure'|'livro'|'controle'|'decoracao'|'artesanal'|'impressao3d',
       origin:'oficial'|'nao-confirmado'|'fanmade'|'artesanal',
       unique:true|false,      true = peça única (sem equivalente em outras lojas)
       universe:'slug-do-universo'|null,
       title, subtitle, price (número), creator (só fan-made)
     } */
  const items=[
    {id:'mock-amiibo-link',cat:'colecionaveis',type:'amiibo',origin:'oficial',unique:false,universe:'the-legend-of-zelda',title:'Amiibo Link',subtitle:'Colecionável oficial · Nintendo',price:129.9},
    {id:'mock-amiibo-mario',cat:'colecionaveis',type:'amiibo',origin:'oficial',unique:false,universe:'mario',title:'Amiibo Mario',subtitle:'Colecionável oficial · Nintendo',price:119.9},
    {id:'mock-figure-leon',cat:'colecionaveis',type:'figure',origin:'oficial',unique:false,universe:'resident-evil',title:'Action figure Leon S. Kennedy',subtitle:'Colecionável oficial · escala 1:6',price:459.9},
    {id:'mock-livro-arte',cat:'colecionaveis',type:'livro',origin:'oficial',unique:false,universe:'the-legend-of-zelda',title:'Livro de arte oficial',subtitle:'Livro/guia oficial',price:189.9},
    {id:'mock-controle-tema',cat:'acessorios',type:'controle',origin:'oficial',unique:false,universe:'the-legend-of-zelda',title:'Controle edição temática',subtitle:'Acessório oficial · Switch',price:379.9},
    {id:'mock-placa-sonic',cat:'merch',type:'decoracao',origin:'nao-confirmado',unique:false,universe:'sonic',title:'Placa decorativa pixel art',subtitle:'Decoração · licenciamento não confirmado',price:59.9},
    {id:'mock-luminaria',cat:'merch',type:'decoracao',origin:'nao-confirmado',unique:false,universe:null,title:'Luminária de mesa estilo pixel',subtitle:'Decoração · licenciamento não confirmado',price:89.9},
    {id:'mock-quadro-gow',cat:'merch',type:'decoracao',origin:'nao-confirmado',unique:false,universe:'god-of-war',title:'Quadro decorativo em MDF',subtitle:'Decoração · licenciamento não confirmado',price:74.9},
    {id:'mock-diorama',cat:'fanmade',type:'artesanal',origin:'artesanal',unique:true,universe:'the-legend-of-zelda',title:'Diorama artesanal (peça única)',subtitle:'Artesanal · sem código de barras',price:340,creator:'Ateliê exemplo'},
    {id:'mock-chaveiro',cat:'fanmade',type:'artesanal',origin:'artesanal',unique:true,universe:'sonic',title:'Chaveiro de pixel art feito à mão',subtitle:'Artesanal · peça única',price:29.9,creator:'Ateliê exemplo'},
    {id:'mock-suporte-3d',cat:'fanmade',type:'impressao3d',origin:'fanmade',unique:false,universe:null,title:'Suporte de controle (impressão 3D)',subtitle:'Fan-made · sob encomenda',price:49.9,creator:'Oficina 3D exemplo'},
    {id:'mock-mini-resina',cat:'fanmade',type:'artesanal',origin:'artesanal',unique:true,universe:'resident-evil',title:'Miniatura em resina pintada à mão',subtitle:'Artesanal · peça única',price:180,creator:'Ateliê exemplo'}
  ];

  return {config,offersFor,offersForItem,items,fmt};
})();
