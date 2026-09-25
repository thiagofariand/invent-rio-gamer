/**
 * Ofertas de afiliado da Shopee, curadas à mão (não é a API automática —
 * essa continua isolada em lib/shopee-affiliate.js, pendente de acesso).
 *
 * Fonte: planilha "Inventario-Gamer-Catalogo-Shopee-Switch-Revisado.xlsx",
 * aba "Switch revisado", filtrada só pras lojas com venda real comprovada
 * (Gamer Hut, legendgamesbr, Jogo Animal, Game e Lar, bionegames, GVL Games,
 * Ds_games, TOKYO MODE+) — as 13 lojas com zero venda ficaram de fora por
 * enquanto, aguardando validação manual.
 *
 * IMPORTANTE sobre condição: a maioria dos anúncios da planilha original não
 * informava se é Novo ou Usado. Por segurança, todo anúncio sem condição
 * explícita foi tratado aqui como "used" — nunca "new" sem confirmação, pra
 * não passar usado por novo. Se algum for confirmado novo de verdade, é só
 * mover o item pra lista `new` do jogo correspondente.
 *
 * Revisar/atualizar periodicamente: preço e disponibilidade na Shopee mudam
 * sem aviso, isso aqui não é ao vivo.
 */
const VERIFIED_AT = '2026-09-24';

const OFFERS = {
  "Super Mario 3D World + Bowser's Fury": {
    used: [{ store: 'Gamer Hut', price: 349.97, url: 'https://s.shopee.com.br/50ZJZIKwqZ', sales: 26 }]
  },
  'Super Mario Bros. Wonder': {
    used: [
      { store: 'Gamer Hut', price: 296.11, url: 'https://s.shopee.com.br/6AlGxRGVTj', sales: 1000 },
      { store: 'Game e Lar', price: 330.00, url: 'https://s.shopee.com.br/2qUozJTCFI', sales: 2 }
    ]
  },
  'Super Mario Maker 2': {
    used: [
      { store: 'GVL Games', price: 309.90, url: 'https://s.shopee.com.br/3g3vyqQ1YR', sales: 2 },
      { store: 'Gamer Hut', price: 314.11, url: 'https://s.shopee.com.br/4B0CZlO7XQ', sales: 34 },
      { store: 'bionegames', price: 379.00, url: 'https://s.shopee.com.br/4LJcm4NUCV', sales: 3 }
    ]
  },
  'Super Mario Odyssey': {
    used: [{ store: 'Ds_games', price: 429.00, url: 'https://s.shopee.com.br/3qNMB9PODS', sales: 3 }]
  },
  'Super Mario Party Jamboree': {
    used: [
      { store: 'Gamer Hut', price: 323.11, url: 'https://s.shopee.com.br/4qFtMzLaBU', sales: 252 },
      { store: 'legendgamesbr', price: 349.00, url: 'https://s.shopee.com.br/60Rql8H8og', sales: 28 }
    ]
  },
  'The Legend of Zelda: Breath of the Wild': {
    used: [
      { store: 'TOKYO MODE+', price: 275.00, url: 'https://s.shopee.com.br/1qcHnTX0G9', sales: 1 },
      { store: 'Gamer Hut', price: 314.11, url: 'https://s.shopee.com.br/5AsjlbKJUb', sales: 210 }
    ]
  },
  "The Legend of Zelda: Link's Awakening": {
    used: [{ store: 'Gamer Hut', price: 349.97, url: 'https://s.shopee.com.br/4qFtMzLaAZ', sales: 54 }]
  },
  'The Legend of Zelda: Tears of the Kingdom': {
    used: [{ store: 'Gamer Hut', price: 350.11, url: 'https://s.shopee.com.br/4fwTAgMDVW', sales: 390 }]
  },
  'Mario Golf: Super Rush': {
    used: [
      { store: 'Gamer Hut', price: 349.89, url: 'https://s.shopee.com.br/gQKPKbRe5', sales: 6 },
      { store: 'bionegames', price: 469.00, url: 'https://s.shopee.com.br/30oFBcSYuN', sales: 1 }
    ]
  },
  'Super Mario 3D All-Stars': {
    used: [{ store: 'Jogo Animal', price: 845.00, url: 'https://s.shopee.com.br/1BMb0FZXdC', sales: 16 }]
  },
  'Super Mario Galaxy + Super Mario Galaxy 2': {
    used: [{ store: 'Gamer Hut', price: 323.11, url: 'https://s.shopee.com.br/905SKe5iiy', sales: 1000 }]
  }
};

function manualShopeeOffers(title, condition) {
  const entry = OFFERS[title];
  const list = entry?.[condition] || [];
  return list.map(o => ({
    source: 'Shopee',
    sourceKind: 'afiliado_manual',
    title,
    condition: condition === 'new' ? 'Novo' : 'Usado',
    priceValue: o.price,
    displayPrice: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(o.price),
    url: o.url,
    sellerName: o.store,
    salesCount: o.sales,
    verifiedAt: VERIFIED_AT,
    mock: false
  }));
}

module.exports = { manualShopeeOffers, VERIFIED_AT };
