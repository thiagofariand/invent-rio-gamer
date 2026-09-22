PATCH v0.99 — MERCADO LIVRE
===========================

O problema encontrado
----------------------
A integração anterior usava:
  /sites/MLB/search?q=...

A documentação atual do Mercado Livre mantém /sites/{site}/search principalmente
para buscas ligadas a vendedor/nickname. Para keyword de produto, o fluxo
documentado é:
  /products/search?status=active&site_id=MLB&q=...

Este patch troca a busca de NOVOS por:
1. /products/search
2. /products/{product_id}
3. buy_box_winner.item_id
4. /items/{item_id}

Assim conseguimos preço, anúncio, imagem, link e frete reais quando o produto
possui vencedor de catálogo.

USADOS
------
A busca genérica de usados do marketplace não é fornecida por esse fluxo de
catálogo. O patch NÃO inventa preço. Para condition=used ele devolve:
- status explicando a limitação;
- externalSearchUrl para o Mercado Livre.

Depois podemos conectar outra fonte autorizada para usados.

COMO INSTALAR
-------------
Substitua:
  api/offers.js

Adicione:
  api/ml/status.js

Depois faça Redeploy na Vercel.

TESTE 1 — token
---------------
https://inventario-gamer.vercel.app/api/ml/status

Esperado:
configured: true
tokenCheck.ok: true
productSearchCheck.ok: true

TESTE 2 — oferta nova real
--------------------------
https://inventario-gamer.vercel.app/api/offers?title=Resident%20Evil%204&platform=Switch&condition=new

Se houver produto de catálogo com buy box no Brasil, "offers" terá preço/link/foto reais.

TESTE 3 — usado
---------------
https://inventario-gamer.vercel.app/api/offers?title=Resident%20Evil%204&platform=Switch&condition=used

Esperado:
status: used_search_not_available_in_catalog_flow
e externalSearchUrl.