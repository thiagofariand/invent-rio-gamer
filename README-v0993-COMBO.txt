INVENTÁRIO GAMER — v0.99.3 COMBO (LAYOUT + IGDB)

Este pacote já junta:
- layout v0.99.2 (hero widescreen, Comprar o jogo, menus ilustrados)
- integração v0.99.3 com IGDB para capa + artwork/screenshot

Substituir/adicionar somente:
index.html
catalog-data.js
src/style.css
src/app-3-views.js
api/igdb/game.js
api/igdb/status.js

NÃO apague nem substitua:
api/offers.js
api/ml/
src/app-1-core.js
src/app-2-search.js
src/app-main.js
mock-data.js

Vercel:
IGDB_CLIENT_ID = credencial Twitch Developer
IGDB_CLIENT_SECRET = secret Twitch Developer

Teste:
https://inventario-gamer.vercel.app/api/igdb/status

Depois abra uma página de jogo. O placeholder será trocado por capa e arte da IGDB quando houver correspondência.
