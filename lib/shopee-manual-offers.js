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
 * CONDIÇÃO (decisão do dono do projeto, 27/09/2026):
 * - Gamer Hut = "new". É uma loja com histórico grande de vendas e o anúncio
 *   se declara "100% original lacrado". É a própria informação do vendedor,
 *   não uma verificação da Shopee — por isso a oferta continua mostrando a
 *   data de verificação e a etiqueta "Varejo/revenda", nunca "Oficial".
 * - As demais lojas seguem "used" até alguém confirmar condição por anúncio
 *   (a planilha original não informava). Nunca "new" sem confirmação.
 *
 * Revisar/atualizar periodicamente: preço e disponibilidade na Shopee mudam
 * sem aviso, isso aqui não é ao vivo.
 */
const VERIFIED_AT = '2026-09-24';

const OFFERS = {
  "Super Mario 3D World + Bowser's Fury": {
    new: [
      { store: "Gamer Hut", price: 349.97, url: "https://s.shopee.com.br/50ZJZIKwqZ", sales: 26 }
    ]
  },
  "Super Mario Bros. Wonder": {
    new: [
      { store: "Gamer Hut", price: 296.11, url: "https://s.shopee.com.br/6AlGxRGVTj", sales: 1000 }
    ],
    used: [
      { store: "Game e Lar", price: 330, url: "https://s.shopee.com.br/2qUozJTCFI", sales: 2 }
    ]
  },
  "Super Mario Maker 2": {
    new: [
      { store: "Gamer Hut", price: 314.11, url: "https://s.shopee.com.br/4B0CZlO7XQ", sales: 34 }
    ],
    used: [
      { store: "GVL Games", price: 309.9, url: "https://s.shopee.com.br/3g3vyqQ1YR", sales: 2 },
      { store: "bionegames", price: 379, url: "https://s.shopee.com.br/4LJcm4NUCV", sales: 3 }
    ]
  },
  "Super Mario Odyssey": {
    used: [
      { store: "Ds_games", price: 429, url: "https://s.shopee.com.br/3qNMB9PODS", sales: 3 }
    ]
  },
  "Super Mario Party Jamboree": {
    new: [
      { store: "Gamer Hut", price: 323.11, url: "https://s.shopee.com.br/4qFtMzLaBU", sales: 252 }
    ],
    used: [
      { store: "legendgamesbr", price: 349, url: "https://s.shopee.com.br/60Rql8H8og", sales: 28 }
    ]
  },
  "The Legend of Zelda: Breath of the Wild": {
    new: [
      { store: "Gamer Hut", price: 314.11, url: "https://s.shopee.com.br/5AsjlbKJUb", sales: 210 }
    ],
    used: [
      { store: "TOKYO MODE+", price: 275, url: "https://s.shopee.com.br/1qcHnTX0G9", sales: 1 }
    ]
  },
  "The Legend of Zelda: Link's Awakening": {
    new: [
      { store: "Gamer Hut", price: 349.97, url: "https://s.shopee.com.br/4qFtMzLaAZ", sales: 54 }
    ]
  },
  "The Legend of Zelda: Tears of the Kingdom": {
    new: [
      { store: "Gamer Hut", price: 350.11, url: "https://s.shopee.com.br/4fwTAgMDVW", sales: 390 }
    ]
  },
  "Mario Golf: Super Rush": {
    new: [
      { store: "Gamer Hut", price: 349.89, url: "https://s.shopee.com.br/gQKPKbRe5", sales: 6 }
    ],
    used: [
      { store: "bionegames", price: 469, url: "https://s.shopee.com.br/30oFBcSYuN", sales: 1 }
    ]
  },
  "Super Mario 3D All-Stars": {
    used: [
      { store: "Jogo Animal", price: 845, url: "https://s.shopee.com.br/1BMb0FZXdC", sales: 16 }
    ]
  },
  "Super Mario Galaxy + Super Mario Galaxy 2": {
    new: [
      { store: "Gamer Hut", price: 323.11, url: "https://s.shopee.com.br/905SKe5iiy", sales: 1000 }
    ]
  }
};

function manualShopeeOffers(title, condition) {
  const entry = OFFERS[title];
  const list = entry?.[condition] || [];
  return list.map(o => ({
    source: 'Shopee',
    sourceKind: 'afiliado_manual',
    retailKind: 'varejo',
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
