INVENTÁRIO GAMER — v0.98 MERGE
===============================

OBJETIVO
Esta versão junta:
1. o motor modular produzido pelo Claude (busca, rotas, inventário, cache e /api/offers);
2. a identidade visual v0.97 (logo wordmark, loja clara, capas em moldura pixel, Meu Inventário dark/pause menu);
3. a integração piloto do OAuth do Mercado Livre.

O QUE FOI PRESERVADO DO MOTOR DO CLAUDE
- catalog-data.js como catálogo local estruturado;
- busca local com autocomplete sem chamar API em cada tecla;
- resultados em linhas horizontais com filtros;
- Novo / Usado / Digital separados;
- /api/offers para Mercado Livre;
- filtros contra repro, peça defeituosa, caixa/manual sem jogo e lotes;
- Meu Inventário local (Tenho / Quero / Alertas);
- páginas de universo/franquia;
- mock-data como fallback claramente marcado EXEMPLO.

O QUE FOI TRAZIDO DA v0.97
- nova logo no cabeçalho;
- visual store-first branco/off-white;
- moldura pixel aplicada principalmente à capa/imagem;
- cantos menos genéricos e linguagem visual mais própria;
- Meu Inventário em #121218 com dourado #FFC700, inspirado em pause menu;
- navegação móvel inferior;
- identidade retrô concentrada na marca e no inventário, não no conteúdo comercial inteiro.

NOVIDADE: IMAGENS REAIS DO MERCADO LIVRE
- /api/offers já devolve thumbnail do anúncio.
- Quando uma busca real é carregada, a imagem da melhor oferta pode substituir o placeholder na linha de busca.
- A página do produto também aproveita a imagem disponível após consultar as ofertas.
- A imagem é do anúncio/origem, não é tratada como capa canônica do jogo.
- Para capa canônica/oficial ainda vale integrar IGDB/Twitch depois.

OAUTH MERCADO LIVRE
Rotas incluídas:
- /api/ml/connect
- /api/ml/callback

Variáveis que já devem existir na Vercel:
- MELI_CLIENT_ID
- MELI_CLIENT_SECRET

Fluxo do piloto:
1. subir esta versão;
2. abrir https://inventario-gamer.vercel.app/api/ml/connect
3. autorizar o app no Mercado Livre;
4. o callback exibirá MELI_ACCESS_TOKEN e MELI_REFRESH_TOKEN;
5. copiar esses dois valores DIRETAMENTE para a Vercel como Secret / Production;
6. não enviar tokens por chat, print ou GitHub;
7. fazer novo deployment;
8. buscar um jogo no site e abrir ofertas.

IMPORTANTE SOBRE TOKEN
O access token expira. O refresh token do Mercado Livre é rotativo; portanto esta versão é um PILOTO para provar a integração. A renovação automática exige armazenamento persistente apropriado e entra numa próxima etapa. Não tente gravar refresh token rotativo em arquivo do GitHub.

ESTRUTURA
index.html
inventario-logo-header.png
catalog-data.js
mock-data.js
env.example
src/
  style.css
  app-1-core.js
  app-2-search.js
  app-3-views.js
  app-main.js
api/
  offers.js
  ml/
    connect.js
    callback.js

DEPLOY
Suba o CONTEÚDO da pasta para a raiz do repositório, mantendo as pastas src/ e api/.
Não é necessário vercel.json para esta estrutura.

TESTES DE ACEITE
[ ] Home abre e a logo nova aparece no cabeçalho.
[ ] Busca por "Resident Evil 4" abre resultados.
[ ] Resultados permanecem em linhas, não grid.
[ ] Ao consultar oferta real, preço e thumbnail do Mercado Livre aparecem.
[ ] "Ver ofertas" abre comparação e o anúncio real abre em nova aba.
[ ] Meu Inventário muda para o tema dark/dourado.
[ ] Mobile mantém busca utilizável e navegação inferior.
[ ] Dados mock continuam identificados como EXEMPLO.
[ ] Nenhuma credencial aparece no GitHub.

NÃO IMPLEMENTADO NESTA CONSOLIDAÇÃO
- renovação automática persistente do refresh token;
- capa canônica via IGDB/Twitch;
- fluxo de importação/USCloser;
- página dedicada de ecossistema Nintendo/PlayStation com linha de consoles;
- histórico real de preço e selo de oportunidade validada.

Esses itens ficam como próximos módulos, sem bloquear o teste da integração Mercado Livre.
