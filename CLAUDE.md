# Inventário Gamer — contexto para o Claude Code

> Este arquivo é lido automaticamente no início de cada sessão. Ele resume decisões tomadas
> em meses de conversa que você (Code) NÃO viu. Trate as "Regras de produto" como decididas:
> não reabra sem o dono pedir. Em caso de dúvida real, pergunte antes de agir.

## O que é
Redirecionador/comparador de preços estilo Skyscanner para o nicho geek/games no Brasil.
**Não vende**: leva para lojas externas. Foco em colecionador: mídia física nova/usada, digital,
retrô, merch e fã-made. Slogan: "Encontre o item que falta no seu Inventário."

## Como trabalhar com o dono
- Não é desenvolvedor (é arquiteto). Português do Brasil, informal, com humor. Explique de forma
  didática; em qualquer instrução manual diga **onde clicar** e **o que deve aparecer**.
- Confia em você nas decisões técnicas, mas produto/visual se **confirma**, não se presume.
- Há outro dev, o "GPT" (ChatGPT), que também edita o repositório (catálogo, layout). Faça commits
  pequenos e descritivos; leia `git log` antes de mexer em arquivos grandes.
- Seja honesto sobre o que NÃO conseguiu testar. Nunca invente dado, preço ou disponibilidade.

## Repositório e deploy
- GitHub: `thiagofariand/invent-rio-gamer`. Vercel: projeto `inventario-gamer`.
- **`main`** = produção (`inventario-gamer.vercel.app`). **`Teste-novo-layout`** = layout novo, publica em
  URL de Preview. Trabalhe em branch e abra PR; **não empurre direto no `main`** sem o dono aprovar.
- Preview usa as variáveis do ambiente **Preview** da Vercel (podem faltar lá).
- Plano Hobby: cron só 1x/dia; mantenha o número de funções em `/api` baixo (hoje 9).

## Stack (build mínimo desde o pacote6 — só gera arquivo estático, nunca function nova)
HTML/CSS/JS puro + Vercel Functions (Node 24, CommonJS). **Roteamento por endereço limpo** (History API,
pacote6 item 4 — era por hash antes: `#/games`, `#/jogo/:slug` etc.; hoje `/games`, `/jogo/:slug`,
`/universo/:slug`, `/plataforma/:slug`, `/item/:id`, `/ofertas/:slug?plat=&cond=`, `/busca?...`).
- **Endereços limpos** (`app-main.js`): os templates continuam gerando `href="#/..."` em centenas de lugares
  (nunca trocados um por um — risco alto demais pra pouco ganho) — quem transforma isso em navegação de URL
  limpa é `initCleanLinks()`, um interceptador de clique GLOBAL (`a[href^="#/"]`, clique normal sem
  modificadora) que faz `history.pushState` + chama `route()` direto. `navigateTo(path)` substitui todo
  `location.hash=` imperativo (eram só 8 lugares — `goSearch`, filtros, atalhos). `parseHash()` lê
  `location.pathname`/`location.search` como fonte principal agora; só cai no hash quando `pathname==='/'` E
  tem um `#/...` de verdade (compatibilidade — `redirectLegacyHash()` já troca isso por URL limpa 1x no
  carregamento, via `history.replaceState`, antes do 1º `route()`). `currentPath()` é o path da rota atual
  (usado pelos estados "ativo" da sidebar, que comparavam `location.hash` antes). `popstate` (não mais
  `hashchange`) cuida de voltar/avançar do navegador. **Limitação conhecida**: itens de navegação com query
  string no próprio link (ex. "Retrô" → `#/busca?retro=1`) comparam só o path na sidebar agora, não a query —
  o estado "ativo" desses 2 itens específicos pode ficar menos preciso que antes (cosmético, não quebra
  navegação).
- **Vercel** (`vercel.json`): `outputDirectory:"dist"` (pacote6b — ver "Build e pasta de saída" abaixo) +
  `cleanUrls:true` (serve `jogo/slug.html` em `/jogo/slug`, sem a extensão) + `trailingSlash:false` + 1 rewrite
  (`/((?!api/|.*\.).*)` → `/index.html`) — fallback SPA só pra rota SEM extensão e que não comece com `api/`
  (pacote6b, item 2: o catch-all antigo, `/(.*)`, devolvia a home com status 200 pra QUALQUER endereço, inclusive
  arquivo inexistente tipo `/CLAUDE.md` — não vazava conteúdo, já que `dist/` não tem esses arquivos, mas também
  não dava 404 de verdade. Path com ponto no nome — `.md`, `.js`, `.json`, `.xml` etc. — ou que comece com
  `api/` cai fora do rewrite; sem arquivo real em `dist/` pra esse path, a Vercel serve o 404.html de verdade,
  com status 404). Arquivo estático de verdade (inclusive as páginas geradas abaixo) tem prioridade sobre o
  rewrite, então nunca compete com elas. Links antigos com `#/` continuam funcionando (`redirectLegacyHash`,
  acima) — nunca quebra link já compartilhado (o hash nem chega no servidor, é só client-side).
- **Páginas estáticas + SEO** (pacote6, item 4; `scripts/build.js`): pra cada jogo (`jogo/{slug}.html`), universo
  com 3+ jogos (`universo/{slug}.html`), plataforma (`plataforma/{nintendo,playstation,xbox}.html`) e item de
  merch (`item/{id}.html`), o build gera uma cópia de `index.html` — MESMO CSS/JS, o app de verdade assume no
  navegador — só trocando o bloco `<!-- pacote6-seo:start/end -->` (title, meta description, canonical, Open
  Graph/Twitter; `og:image` quando o item de merch tem foto autorizada). Motivo: prévia de WhatsApp/Facebook não
  executa JavaScript, só lê o HTML bruto. Dados vêm de `catalog-data.js` carregado em Node via `vm` (não dá pra
  `require()` direto, é `window.INV_DATA=(function(){...})()`) — `D.catalog` (array achatado,
  `{franchise,title,variants}`, sem slug/ano próprio) cruzado com `D.collections` (franquia→`items[]`, tem
  `slug`/`year` por TÍTULO EXATO) pra achar o slug "oficial" de cada jogo, mesma conta do app-1-core.js
  (`c?c.slug:slugify(p.title)`) — sem isso os slugs gerados não bateriam com os que o app usa de verdade.
  Universo só gera página com 3+ jogos (mesma regra de sempre). `sitemap.xml` e `robots.txt` também gerados no
  build, com `SITE_URL` (env da Vercel; sem ela, cai no domínio de produção conhecido hoje —
  `inventario-gamer.vercel.app` — trocar pelo `.com.br` é só configurar a env). Tudo isso (jogo/universo/
  plataforma/item/sitemap/robots) é gerado DENTRO de `dist/` (pacote6b) — nunca mais na raiz do repo. `404.html`
  é a exceção: a baseline fica committada na RAIZ (só é criada se ainda não existir); o build copia ela pra
  `dist/404.html`, que é o arquivo de fato servido. **Rode `node scripts/build.js` local pra testar** (gera tudo
  em `dist/`, fora do commit — `.gitignore` ignora a pasta inteira).
  - **noindex pra página sem oferta real — NÃO IMPLEMENTADO**: pedido explícito do pacote6 era meta robots
    `noindex, follow` pra jogo sem nenhuma oferta real; isso depende de preço AO VIVO (mesma limitação do item
    3 — sem rede neste ambiente pra checar o Mercado Livre durante o build, e um build que chama a API pra
    cada um dos 515 jogos também não é desejável de verdade, deixaria o deploy lento). Toda página de jogo sai
    indexável por padrão hoje. Caminho futuro: um job separado (cron já existe, `/api/trending`) que atualiza
    um `offers-status.json` pequeno que o build lê, ou mover a decisão pro runtime via o cache que
    `/api/offers` já populariza — qualquer um dos dois é trabalho novo, ainda não feito.
  - **Testado** (Playwright, servidor Node que imita `cleanUrls`+rewrite da Vercel contra `dist/` — `python -m
    http.server` não reproduz isso): carregar `/jogo/breath-of-the-wild` direto (sem `#`, sem reload) funciona,
    `<title>` e `canonical` corretos, o app assume e renderiza a ficha normal; mesmo teste em `/universo/mario` e
    `/item/lego-71438-...`; `/jogo/inexistente-xyz` cai no 404 do próprio app, sem erro. Console limpo em
    home/busca/universos/merch/games/em-alta/inventário/plataforma/comparativo. **Não testado num deploy Vercel
    de verdade** — o comportamento de `cleanUrls`/rewrite em produção precisa ser conferido no preview antes de
    confiar 100%.
- **Build e pasta de saída** (pacote6, item 3 + **pacote6b** completo — `scripts/build.js`, `vercel.json` →
  `buildCommand`/`outputDirectory`): roda no build do Vercel (plano Hobby — zero function nova, só arquivo
  estático). **Pacote6b — por quê `dist/`**: com `outputDirectory:"."` (fix do deploy que tinha ficado
  `STATIC_BUILD_NO_OUT_DIR`), a Vercel servia a RAIZ do repo inteira como site — isso publicava `CLAUDE.md`,
  `docs/` (prompts, rascunho de texto legal), `scripts/`, `package.json` etc. `scripts/build.js` agora apaga e
  recria `dist/` a cada build e só copia pra lá uma **ALLOWLIST** explícita (nunca "copiar tudo menos X" —
  arquivo novo que o front precise carregar tem que ser ACRESCENTADO nela, ou vira 404 em produção):
  - Arquivos: `index.html`, `painel.html`, `catalog-data.js`, `mock-data.js`, `inventario-logo-header.png`.
  - `src/*.js` + `src/style.css` (os 4 módulos do app + a folha de estilo, carregados por `<script>`/`<link>`
    em `index.html`) — `src/env-generated.js` NÃO é copiado, é gerado direto em `dist/src/env-generated.js`
    (ver abaixo).
  - Diretórios inteiros: `assets/` (ícones, logos — exceto `assets/_originais`, material-fonte das logos, nunca
    servido) e `src/data/` (todo `*.json` carregado via XHR síncrono em `app-1-core.js`: paleta, consoles,
    merch, versões, home-heroes, search-aliases, hero-overrides).
  - `public/img/` (opcional — ainda não existe neste repo; quando o dono subir imagem oficial de merch pelo
    fluxo da seção "Merch" abaixo, o build copia pra `dist/img/` automaticamente, excluindo
    `public/img/merch/originais/`, que é material-fonte).
  - `api/` continua na RAIZ do repo, fora de `dist/` — as functions da Vercel não dependem de
    `outputDirectory`, só os arquivos estáticos.
  - As páginas geradas (`jogo/`, `universo/`, `plataforma/`, `item/`, `sitemap.xml`, `robots.txt`) e
    `src/env-generated.js` são escritos DENTRO de `dist/` pelo próprio script (não fazem parte da allowlist
    copiada — são gerados, não copiados).
  Gera `dist/src/env-generated.js` (`window.__SITE_ENV__={isProduction:bool}`, a partir de `VERCEL_ENV`) — o
  jeito confiável do cliente saber se está em produção de verdade (nem localhost nem preview conseguem fingir,
  já que `VERCEL_ENV` só existe no servidor de build). O `src/env-generated.js` da RAIZ (committado,
  `isProduction:false`) nunca é tocado por este script — é só o fallback de quem roda sem build (localhost,
  este sandbox). `.gitignore` ignora `/dist/` inteira; nada do que o build gera é committado.
- `index.html`, `painel.html` (painel de saúde), `catalog-data.js` (catálogo, gêneros, anos), `mock-data.js`.
- `src/app-1-core.js` (utilitários, ícones SVG, `coverTile`, `retailChip`, `GENRES`, `semDisco`/`formato`, `MERCH_ITEMS`) ·
  `app-2-search.js` (busca, filtros, `digitalStores`, `applyDirectStoreLinks`) · `app-3-views.js` (telas, Browse, páginas de merch) · `app-main.js` (roteador, eventos) · `style.css`.
- `src/data/`: `paleta-universos.json`, `paleta-plataformas.json`, `hero-overrides.json`, `home-heroes.json`,
  `search-aliases.json`, `merch.json` (fonte única de merch — ver "Merch" abaixo), `consoles.json` (console →
  `{familia,ano,rotulo}`, ver "Home, plataforma e diretório" abaixo), `guias.json` (vazio por enquanto —
  "Guia do dia" da home só aparece com pelo menos 1 entrada).
- `assets/icons-categoria.svg`: sprite dos ícones de categoria de merch (`#cat-colecionaveis`, `#cat-casa` etc.).
- `api/`: `offers.js`, `trending.js`, `ml/{connect,callback,refresh,status}`, `igdb/{game,status}`, `rawg/status`.
- `lib/`: `mercadolivre.js`, `meli-oauth.js`, `meli-token.js` (renovação automática via Redis Upstash),
  `igdb.js` (também devolve `lojas[]`, ver "Links diretos de loja"), `rawg.js`, `shopee-manual-offers.js` (preço manual
  Shopee **só de jogos** — não confundir com `src/data/merch.json`), `http.js`, `trending.js`.
- Variáveis: `MELI_CLIENT_ID/SECRET/REDIRECT_URI`, `KV_REST_API_URL/TOKEN` (Redis), `IGDB_CLIENT_ID/SECRET`,
  `RAWG_API_KEY`, `DIAGNOSTICS_SECRET`, `YOUTUBE_API_KEY`, `OPENAI_*`, `CRON_SECRET`, `SITE_URL` (pacote6 item 4 —
  domínio usado no canonical/Open Graph/sitemap das páginas geradas no build; opcional, sem ela cai em
  `https://inventario-gamer.vercel.app`). Nunca imprima segredos.

## Regras de produto (decididas)
**Preço e honestidade**
- Nunca inventar preço. Dado de demonstração aparece com selo **EXEMPLO**.
- Digital não tem "usado" (licença não se revende).
- **EXEMPLO fora de produção** (pacote6, item 3): o selo/preço de demonstração continua em localhost e nos
  previews do Vercel, mas **nunca em produção de verdade** — `mockOn()` (`app-1-core.js`) é travado em `false`
  sempre que `window.__SITE_ENV__.isProduction===true` (`isProductionEnv()`, gerado no build — ver "Stack"
  acima), nem o toggle manual (botão "Modo demonstração" do rodapé, que some inteiro em produção) consegue
  ligar de volta. Jogo lançado sem NENHUMA oferta real em produção: no lugar do preço, "Sem ofertas ainda" +
  botão "Avisar quando tiver" (`noOfferMarkup()`, página do jogo — reaproveita o estado Alerta do
  `data-act="open-save"`/modal Quero·Tenho·Alerta que já existe, não um mecanismo novo). Fora de produção, a
  mesma falta de oferta real cai no preço de EXEMPLO (regra de sempre) — só chega a "Sem ofertas ainda" quando
  nem isso existe. **Não dá pra saber neste ambiente quantos jogos do catálogo ficam nesse estado em produção**
  (depende de oferta real da API do Mercado Livre em tempo real, sem rede aqui) — conferir no painel de saúde
  (`painel.html`) ou direto no ambiente de produção.
- **PREÇO ÚNICO** (pacote6, item 2 — muda a regra antiga "cada condição com o seu a partir de"): card, hero,
  listas e a página do jogo mostram **1 preço só**, o MENOR entre todas as condições/plataformas do jogo
  (`gameCheapestOffer(p,platform)` em `app-3-views.js` — substitui `bestUsed()`/buscas manuais por "Usado"
  espalhadas), sempre com a condição escrita do lado ("a partir de R$ 194,90 · Usado") — preço nunca aparece
  sem condição. Fonte real primeiro (`summaryOf`/cache de `fetchCond`); sem nenhuma real, cai no preço de
  exemplo (`sampleOffersBestPhysical`, já escolhe a condição mais barata) com selo EXEMPLO. Digital nunca entra
  nessa conta (nunca tem valor numérico no catálogo hoje, só "Consultar"/link de loja).
  - **Página do jogo** (`purchaseModuleHorizontalMarkup`/`purchaseSinglePriceMarkup`/`purchaseSinglePanelMarkup`):
    o bloco "Comprar este jogo" não tem mais caixa por condição (Novo/Usado/Download lado a lado, removido —
    `purchasePriceColMarkup`/`.ppanel-col` não existem mais) — vira o preço único acima + botão "Comparar
    preços ({N} ofertas) →" (`gameOfferCount()`) que abre o comparativo. Seletor de plataforma continua no
    bloco. Pré-venda/Em breve/semDisco mantêm a mensagem de sempre, só que dentro desse bloco único.
  - **Página de comparativo** (`renderOfferComparison`, `#/ofertas/:slug`) é o **ÚNICO** lugar que ainda separa
    por Novo/Usado/Digital (filtros que já existiam). Na aba "Todas as ofertas", condição sem oferta real **não
    aparece** — a seção inteira some (nunca "sem ofertas"/"consultar nas lojas" como placeholder); com as 3
    condições vazias, mostra 1 estado vazio geral ("Nenhuma oferta encontrada agora" + atalhos pras lojas).
    Exceção: semDisco/jogo ainda não lançado continuam com a mensagem fixa de sempre na seção Usado (regra à
    parte do pacote4/4B, não é "sem oferta encontrada agora" genérico). Abas específicas (usuário clicou
    Novo/Usado/Digital na mão) continuam podendo mostrar "nenhuma oferta nesta condição" — é resposta direta a
    um filtro que a pessoa escolheu, não um placeholder automático.
  - Merch não muda — a página do item **já era** o comparativo (agrupado por condição desde o teste-merch).
- Selos: **Oficial** só com prova real (Nintendo eShop, PlayStation Store, Steam). Nuuvem = **Varejo autorizado**.
  Mercado Livre, Shopee e Gamer Hut = **Varejo/revenda**, mesmo sendo lojas grandes.
- Shopee: ofertas **manuais** em `lib/shopee-manual-offers.js` (não é a API). **Gamer Hut = Novo** (decisão do dono);
  as demais lojas seguem **Usado** até confirmação por anúncio. Só lojas com venda comprovada (as de zero venda estão fora).
- Mercado Livre: **Novo** via API de catálogo. **Usado** (`sites/MLB/search`) está **bloqueado (403)** para apps não
  certificados → o site usa link de busca externo. `searchUsedListings` fica no arquivo para o dia em que liberar.
- Rodapé tem aviso de link de afiliado; manter. Crédito de dados "IGDB e RAWG" também no rodapé global (link de volta obrigatório — exigência da RAWG).
- **Formato físico e pré-venda** (pacote4, seção 2): Sony anunciou (1º/07/2026) que, a partir de jan/2028, jogo novo de
  PlayStation vem só digital ou caixa física **com código** (sem disco). Campo `semDisco` por jogo (manual no catálogo, ex.
  GTA VI, ou automático: PlayStation + lançamento ≥ 2028-01-01) deriva `formato` (`fisico-disco`\|`fisico-codigo`\|`digital`).
  Jogo `semDisco` **nunca** tem oferta/coluna Usado (código de ativação não revende) — nem `sampleOffers` gera, nem a
  interface mostra; vira o bloco fixo "Sem revenda (código de uso único)". Selo "Disco" (padrão) ou "Físico · código de
  download" (`semDisco`) na coluna Novo do card de compra e da comparadora.
  Estado de lançamento (`releaseState`, a partir de `releaseDate` + `preVenda` manual): `pre-venda` (data futura +
  `preVenda:true`) \| `anunciado` (data futura sem `preVenda`) \| `lancado`. Pílula do hero PRÉ-VENDA/EM BREVE; jogo não
  lançado também não tem Usado (não existe o que revender ainda); botão "Tenho" vira "Em breve" sem ação.
- **Links diretos de loja digital** (pacote4, seção 3): `/api/igdb/game` devolve `lojas:[{loja,url,direto:true}]` a partir
  de `external_games`/`websites` da IGDB — mapeamento de categoria→loja é **best-effort** (não validado contra a API ao
  vivo neste ambiente; conferir no preview antes de confiar). Campo manual `lojas` no catálogo tem prioridade sobre a
  IGDB — é o jeito confiável de corrigir PlayStation/Xbox/Nintendo eShop (cujo código de categoria a IGDB não confirma
  bem). Com link direto: "Ver na {loja} ↗". Sem link direto: "Buscar na {loja} ↗" (nunca deixar parecer ficha do jogo).

**Catálogo**
- Só entra jogo com **data de lançamento confirmada** (pré-venda aberta vale). Sem data = fora
  (ex.: God of War: Laufey, Guild Wars 3). Não-lançados vão para `releaseCalendar`.
- Foco atual: geração atual (PS4/PS5, Switch 1/2, Xbox Series X|S); depois retroagir para o retrô. **Sem PC e sem VR por enquanto.**
- **Gratuitos (F2P) OFF por enquanto.** Reavaliar via universo/merch: só entram quando o universo tiver ~5 itens de merch.
- **Universo só existe com 3+ jogos** (~36 franquias hoje). Franquias de 1–2 jogos são jogos soltos (busca, ficha, Browse).
- **Multiplataforma** = disponível em mais de um ecossistema (Nintendo/PlayStation/Xbox); **PC não conta**.
  Ficha única por jogo, aparece no catálogo de cada plataforma. Na página Games, cada franquia aparece em **um** card.
- Remake com mesmo nome ganha "(ano)" no título (ex.: "Resident Evil 4 (2023)"). Edição Switch 2 do mesmo jogo usa o
  3º item da variante `[eco, plataforma, tituloAlternativoIGDB]`.
- Ano do jogo vem de `collections` por **título exato**; sem entrada lá, não mostra ano.
- Gêneros: lista curta editorial em `catalog-data.js` (Ação, Aventura, RPG, Luta, Tiro, Corrida, Esporte, Plataforma, Família, Terror).
- **Versões ocultas** (pacote5e, item 3): quando uma obra tem edições diferentes por plataforma (HD, 3D,
  Remaster, Deluxe...), **uma só obra** no catálogo (slug/título normais) com `src/data/versoes.json` guardando,
  por plataforma, a versão real: `{plataformas[],nome_completo,igdb_id,ano,tipo}`. Funções em `app-1-core.js`:
  `versionFor(p,platform)`, `versionYear`, `versionIgdbTitle`, `versionIgdbId`, `versionLatest` (a de maior
  `ano`, usada quando não há plataforma escolhida). `igdbTitleFor()` já prefere `nome_completo` da versão sobre
  o 3º item de `variants`. Busca: `nome_completo` de cada versão vira alias (merge automático em `p.aliases`
  pra obras com entrada em `versoes.json`); `matchCatalog` reconhece o nome da versão no texto digitado e já
  filtra pra aquela plataforma (mesmo mecanismo do nome de console). `fetchIgdbVisual`/`findGame`
  (`lib/igdb.js`) aceitam `igdb_id` com prioridade total sobre busca por nome (`getGameById`, `where id = X`)
  — regra do pacote: "a capa de cada versão vem do `igdb_id`, nunca de busca pelo nome". **Hoje só
  `majoras-mask` e `twilight-princess` têm entrada**, ambos com `igdb_id:null` (sem rede pra IGDB neste
  ambiente pra confirmar o número real sem inventar dado — `nome_completo` serve de busca por nome enquanto
  isso). Remake (jogo refeito do zero, "(ano)" no título) **não** é versão — fica obra separada, como já era.
  `docs/versoes-candidatas.md` lista outros candidatos achados numa varredura (nenhum aplicado ainda, exceto
  os dois confirmados).

**Merch** (colecionáveis, decoração, casa, iluminação, vestuário, livros e arte — pacote4, seção 4; blocos de montar,
amiibo e livros/mangás — teste-merch/teste-merch2)
- Fonte única: `src/data/merch.json` — **não é** `lib/shopee-manual-offers.js` (esse é preço de jogo, schema incompatível).
- Dois formatos de item convivem no mesmo arquivo: os 25 mocks do Pacote4 (schema "achatado" antigo —
  `id,titulo,universo,categoria,origem,tipo,loja,url,preco,precoAtualizadoEm,imagem,imagemFonte,imagemAutorizada,exemplo`,
  `exemplo:true`, preço fake com selo EXEMPLO) e os itens reais de teste (LEGO/amiibo/livros — sem `origem`, com
  `ofertas[]`; ver abaixo). **Todo item novo usa o schema de ofertas**; o achatado só existe pra não quebrar os mocks.
- **camelCase sempre** — nenhum campo em snake_case no JSON (`jogosRelacionados`, `regiaoCaixa`, `pecaUnica`,
  `notaCompra`, `imagemCredito`, `imagemFonte`, `precoAnterior`, `atualizadoEm`, `afiliadoTag`...).
- **Schema do item** (com `ofertas[]`): `id,titulo,universo,categoria,tipo,exemplo,jogosRelacionados[],etiquetas[],
  imagem,imagemCredito,imagemFonte,imagemAutorizada,ofertas[]` + campos por categoria (abaixo). **Sem `origem`** — a
  origem (nacional/importado) é só de cada OFERTA, nunca do item (removido o selo "Nacional" da ficha do item;
  pré-existente nos 25 mocks antigos, que ainda usam `origem` pro filtro "Origem" da busca de merch).
  `jogosRelacionados` é lista de **slugs do catálogo** (nunca nome livre) — um item pode ligar a mais de um jogo; sem
  jogo correspondente no catálogo, a lista fica vazia (sem link, sem texto solto).
- **Campos calculados, nunca gravados no JSON**: `preco,loja,url,precoAtualizadoEm,importado` do item são calculados
  ao carregar (`merchCheapestOffer()` em `app-1-core.js`) a partir da oferta **mais barata sem condição de cupom/
  pagamento** (`ofertas[].preco`, nunca `precoCondicional`) — fonte única, sem duplicar o preço em dois lugares. Item
  com `ofertas[]` mas nenhuma oferta com preço (ex. set fora de catálogo na loja oficial) mostra "Indisponível".
- **Campos por categoria**:
  - `blocos-de-montar` (LEGO e afins): `marca,numeroSet,pecas,ano,faixaEtaria,status` (`status:"aposentado"` vira selo
    "Aposentado (fora de linha)"; `"a-venda"` não tem selo). Condições de oferta: `novo-lacrado`,`usado-completo`
    ("Usado (completo, com caixa)"), `usado-sem-caixa`.
  - `amiibo`: `regiaoCaixa` (`"Ocidental"|"Japonesa"` — japonesa vira etiqueta "Caixa japonesa"; ocidental não mostra
    nada), `serie` opcional (ex. `"Campeões"`, vira etiqueta). Condições: `novo-lacrado`,`usado-com-caixa`
    ("Usado (com caixa)"),`usado-sem-caixa`.
  - `livros-mangas`: `editora,idioma,formato` (`"Capa dura"|"Brochura"|"Box"|"Assinatura"`),`volumes` (só coleção),
    `isbn` (opcional), `notaCompra` (opcional — texto curto em destaque no card e na página, usado hoje pela
    assinatura de mangá pra avisar sobre o volume inicial do envio). Condições: `novo`,`usado`.
  - Ícone próprio por categoria em `assets/icons-categoria.svg` (`#cat-blocos-de-montar`, `#cat-amiibo`,
    `#cat-livros-mangas`) — nunca o logotipo da marca (LEGO/amiibo só em texto).
- **Schema da oferta** (`ofertas[]`): `loja,vendedor,anuncio,condicao,preco,precoAnterior,condicaoPagamento,
  precoCondicional,condicaoCondicional,freteGratis,importado,conferido,pecaUnica,atualizadoEm,url,afiliadoTag`.
  - `condicaoPagamento` é sufixo do PRÓPRIO `preco` quando ele já exige uma forma de pagamento específica (ex. "no
    Pix" — `preco` já É o valor no Pix, mostrado "R$ 438,84 no Pix", com `precoAnterior` riscado do valor cheio ao
    lado, no mesmo padrão de uma promoção comum).
  - `precoCondicional`+`condicaoCondicional` é um preço **menor** que exige mais (cupom) — mostrado como nota à
    parte ("R$ 252,70 no Pix com cupom"), nunca entra no cálculo de "a partir de"/preço calculado do item (regra de
    honestidade: nunca anunciar um valor que depende de ação do comprador).
  - `conferido:false` = vendedor/anúncio ainda não verificado manualmente; nesta fase de testes a oferta aparece
    normal (sem selo), só fica registrada pra triagem antes do lançamento (decisão futura: ocultar ou não).
  - `pecaUnica:true` = anúncio de unidade única (comum em usado de pessoa física) — mostra a nota "Peça única: pode
    já ter sido vendida".
  - `afiliadoTag` sempre criado vazio (`""`), pro dono preencher quando tiver o programa de afiliado da loja.
  - Preço da oferta SEMPRE com a condição escrita (`MERCH_COND_LABEL` em `app-3-views.js`); na página do item, o
    preço de destaque é da condição mais barata ("Novo (lacrado) a partir de R$ 899,40 · Importado"); as demais
    condições aparecem nos grupos abaixo (`merchOffersByCondition`).
  - Data do preço sempre "Preço visto em dd/mm/aaaa" (ou "hoje"/"ontem") — nunca finge um preço "ao vivo".
- Regra de imagem oficial (teste-merch2, item 4 — substitui a regra antiga "merch sem foto de terceiro"): item PODE
  ter foto oficial do fabricante/editora (Nintendo, LEGO, Panini, Dark Horse etc., direto do site/sala de imprensa
  deles) — foto de vendedor/anúncio/marketplace **nunca**. Hospedagem **sempre local**, nunca hotlink: dono deposita
  o arquivo original em `public/img/merch/originais/{id}.{ext}` + uma linha em
  `public/img/merch/originais/fontes.txt` (`"{id} | {URL da página oficial} | {crédito}"`); Code converte pra
  `.webp` 800px no lado maior (fundo transparente preservado) em `public/img/merch/{id}.webp` e preenche
  `imagem,imagemCredito,imagemFonte` (os três juntos — sem crédito e fonte, a imagem não aparece). Exibição:
  `object-fit:contain` sobre fundo da paleta do universo (produto inteiro visível), crédito em 11px `--text-2`
  abaixo da imagem na página do item. Sem arquivo em `originais/`: fica o fallback de ícone de categoria (não dá
  pra buscar imagem na internet neste ambiente).
- Regra fixa (vale pro site inteiro): nunca link direto pra loja a partir de card/lista — o clique abre `#/item/{id}`;
  só lá tem o botão de verdade pra loja (`rel="sponsored noopener"`) e o link "Pedir remoção de conteúdo".
- Busca (`#/busca`) migrada pro merch.json desde o pacote5 (`merchRows`/`priceCell`/`rowMarkup` em
  `app-2-search.js` leem `merchItemsVisible()`, não mais `M.items`); indexa também marca, número do set, editora e
  ISBN (campos que só os itens reais têm).
- **Colecionáveis de {jogo}** (teste-merch2, item 1): seção na página do jogo, logo abaixo de "Comprar este jogo" —
  fileira de até 12 itens de merch ligados ao jogo via `jogosRelacionados`, "Ver todos →" abre `#/merch` filtrado
  por esse jogo. Sem item ligado, a seção não aparece (nunca mostra vazia).

**Página de plataforma e diretório de universos** (pacote5) · **Home** voltou pro desenho do Pacote 4 (pedido do
dono, pacote5b final — ver nota abaixo)
- **Hero largo** (`.hhw-*`, componente único reaproveitado só na plataforma agora, função `homeHeroWideMarkup`):
  altura fixa 340px, texto no topo-esquerda, rotação automática (7s, pausa no hover/foco, indicadores finos +
  botão de pausa no canto **superior** direito — os ladrilhos cobrem a base). Pílulas só informativas
  (PRÉ-VENDA/EM BREVE reaproveita `releaseState` do pacote4; "Só em console X" quando o jogo só sai numa única
  plataforma — heurística best-effort). A home tem seu **próprio** hero, independente deste (ver nota "Home volta
  pro Pacote 4" abaixo).
- **HERO ADAPTATIVO** (teste-merch2, item 0b — substitui a janela fixa `var(--hero-art-w)`/`var(--hero-fade)`,
  removidos): 3 camadas da MESMA arte, aplicadas em `.hhw-*` (plataforma) e, só a camada 3, em `.lhw-*` (home —
  a 1 já é full-bleed ali, redundante repetir). Camada 1 **fundo** (`.hhw-bg`): a arte ampliada/desfocada
  (`blur(30px) saturate(1.3) brightness(.55)`) cobrindo o hero inteiro — nunca cor chapada atrás do texto.
  Camada 2 **arte nítida** (`.hhw-art`): ancorada à direita, altura 100%, largura pela proporção NATURAL da
  imagem (medida com um `Image()` off-screen em `setHeroBackground`, `app-3-views.js` — sem conseguir medir, cai
  no fallback CSS de 70%/100% mobile); borda esquerda dissolve no fundo via `mask-image`. Capa (sem key art)
  joga o mesmo papel agora (antes era só borrada). Camada 3 **película de leitura** (`.hhw-film`/`.lhw-film`):
  degradê de `--hero-base` (hhw) ou de um tom escuro fixo (lhw, que não tem `--hero-base` por slide) até
  transparente, largura = bloco de texto real do slide (maior entre pílulas/título/botão) + 28px + 64px,
  calculada em `hhwUpdateFilm()` e aplicada só via `transform:scaleX` (nunca `width`) — anima com o crossfade
  (500ms), sem transição com `prefers-reduced-motion:reduce`. Contraste sobe pela OPACIDADE (até .9), nunca pela
  largura — hoje fixo em .75-.78, **não medido por pixel real** (sem artwork de verdade neste ambiente; conferir
  no preview). `hhwUpdateFilm` roda em `paint()` (toda troca de slide) e no resize (debounce 150ms) das duas
  inicializações (`initHomeHeroWide`/`legacyInitHomeHeroWide`).
- **Hero adaptativo completo** (pacote6, item 1 — fecha o que a camada 0b tinha deixado pra trás): home
  (`.lhw-*`) ganhou as camadas 1 (`.lhw-bg`, fundo desfocado) e 2 (`.lhw-art` virou ancorada à direita, 70%,
  proporção natural — antes era `inset:0` full-bleed cru) que faltavam; só a 3 (película) já existia. Hero de
  universo (`universeHeroMarkup`/`hydrateUniverseHero`, o card grande com "Meu Inventário" ao lado — continua
  sendo esse layout, não virou carrossel `.hhw-*`) ganhou as mesmas camadas 1 (`.uh-art-bg`) e 2 (`.uh-art-img`
  virou ancorada à direita/proporção natural, antes era `object-fit:cover` esticado); a camada 3 já existia ali
  (`.universe-hero-legibility`, degradê fixo — sem largura calculada por JS, porque esse card não troca de
  título curto/longo por slide do jeito que o carrossel troca). A medição de largura natural (camada 2) virou
  um único helper, `applyNaturalArtWidth(el,url)`, chamado pelos três lugares (`setHeroBackground` pra
  hhw/lhw, `hydrateUniverseHero` pro card de universo) — não duplicada. `.game-hero-art` (hero da FICHA do
  jogo, `renderProduct`) fica de fora dessa rodada — layout diferente (sem "fundo + arte ancorada", é um
  banner único), fora do escopo "home/plataforma/universo" do pacote.
- **Modo de depuração de contraste** (`?debug=contraste` na query string — `location.search`, funciona em
  qualquer rota em hash): painel fixo no canto inferior direito (`#contrastDebugBox`) com o contraste WCAG do
  título e do botão de cada hero visível (plataforma/home/universo), recalculado em `updateContrastDebug()`
  (`app-3-views.js`) toda vez que o hero muda — chamada de dentro de `hhwUpdateFilm` (plataforma/home),
  `hydrateUniverseHero` e `initHomeCarousel` (universo), e 1x no fim de `route()` como base. Mede de verdade
  (canvas, recorte "cover" manual + pixels da própria arte) quando a imagem permite leitura; a IGDB não garante
  CORS (armadilha já documentada acima) — sem leitura, cai numa ESTIMATIVA pela cor conhecida da
  película/legibilidade no ponto do título, sempre rotulada "(estimativa — CORS)" no painel, nunca apresentada
  como medição real. Sem o parâmetro, `contrastDebugActive()` retorna falso e nenhuma função roda — nada
  aparece, nem o elemento é criado. **Não validado com artwork real neste ambiente** (sem rede pra IGDB) —
  conferir os números no preview antes de confiar.
- **Regra de preço pra jogo não lançado ou `semDisco`, em QUALQUER componente novo** (hero, cards, painel lateral,
  linhas): nunca "Usado a partir de". Com oferta física de exemplo (sempre Novo — `sampleOffers` nunca gera Usado
  pra jogo não lançado): "Pré-venda a partir de R$X". Sem oferta: "Em breve" (+ data se houver). Função central:
  `heroWidePriceCta`/`sideRowPriceChip` — não reimplementar em paralelo.
- **UniverseTile** (`universeTileMarkup`, item 1.3): ladrilho único usado na plataforma (sobreposto ao hero, até 6
  + "ver todos") e no diretório (`#/universos`, em grade, sem sobreposição). A home **não usa mais** esse
  componente (voltou aos cards `universeDestaqueBig`/`universeDestaqueCompact` do Pacote 4). Capa do jogo
  principal saltando acima do ladrilho — **só** com `naturalWidth>=200` medido de verdade (`hydrateUniverseTiles`);
  sem capa válida, a sigla (campo `sigla`, 28px) é o **plano B**, nunca o padrão — fica **centralizada no lugar
  da capa** (mesma área que `.ut-cover-wrap` ocuparia, nunca "ao lado" do nome — pacote5e, item 2). Ladrilho
  "Ver todos" (7+ universos): o rótulo "Universos {plataforma}" **some** de cima da fileira (pacote5e, item 1)
  — a info mora só no próprio ladrilho ("Ver todos os universos → / {N} no total"); com 6 ou menos, sem
  ladrilho, o rótulo volta a ser o único link ("Universos {plataforma} →"), como na home.
- **Home volta pro Pacote 4 (pedido do dono, pacote5b final)**: o dono pediu explicitamente pra manter os layouts
  do pacote5/5b no resto do site mas devolver a Home ao desenho de antes do pacote5 — hero com miniaturas
  (thumbnails) de preview no canto inferior direito + abas em pílula "Destaques" (Em alta/Mais novos/Menor
  preço/Pré-venda) → "Universos em destaque" (1 card grande + 3 compactos) → "Retrô" (fileira de clássicos em
  preço de usado) → "Colecionáveis e merch" (vitrine de `merch.json`, de volta na home nesta versão). Pra isso,
  `renderHome` e sua cadeia de hero usam um fork **legacy**, prefixo `legacy*` nas funções
  (`legacyLoadHomeHeroSlides`, `legacyHomeHeroWideMarkup`, `legacyInitHomeHeroWide`, `legacyHydrateHomeHeroWide`
  etc.) e `.lhw-*` no CSS (em vez de `.hhw-*`) — **não é** o mesmo componente do hero largo da plataforma, é uma
  cópia independente pra não colidir com o CSS/JS que a plataforma ainda usa. Não reaproveite `legacy*`/`.lhw-*`
  em telas novas (é código congelado do Pacote 4); extensões de hero/ladrilho entram no componente `.hhw-*`
  (plataforma) e, se um dia a home for redesenhada de novo, decida com o dono antes de trocar.
- **Página de plataforma** (`renderPlatform`, `#/plataforma/:slug`): hero largo **sem** pílula de tipo/plataforma
  (slide = mais em alta daquela família) → ladrilhos (até 6 + "ver todos os universos") → 1 linha "Jogos em
  destaque"/"Jogos de {console}" com botão em pílula "Ver todos (N) →" → caixa de consoles (`--side-w`,
  **alinhada ao topo dos CARDS, não do título** — o título fica fora do grid de 2 colunas de propósito) com
  chips Todos + 1 por console da família com jogo no catálogo (`consoles.json`, mais novo primeiro). Console
  selecionado via `?console=` (link `<a>` normal — URL muda, botão voltar funciona, hero/ladrilhos não mudam).
  "Retrogaming" **não existe mais** nesta página.
- **Diretório de universos** (`renderUniverses`, `#/universos`): mesmo UniverseTile em grade (5/linha em 1100px,
  4 abaixo de 1000px, 2 no mobile). Aba = família, via `u.plataformas` (já derivado de `variants[][0]`, não
  reimplementado contra `consoles.json`). Ordem: lista curada (`SIDEBAR_FEATURED_UNIVERSES`) primeiro, depois
  alfabética. Parâmetro `?plat=` (não mais `?casa=`).
- **`consoles.json`**: `{console: {familia, ano, rotulo}}`, `familia` ∈ nintendo\|playstation\|xbox. Usado em
  plataforma (seção 3), diretório e busca (não mais na home, que voltou ao desenho do Pacote 4). Console do
  catálogo sem entrada aqui vai pro fim da
  ordenação (`sortConsoles`), por nome — nunca desaparece. Fora das 3 famílias (sem entrada, de propósito): PC,
  PC VR, PS VR2, Meta Quest 2/3, Android, iOS, Dreamcast, Game Gear, Master System, Mega Drive/Genesis.
- **Parâmetros da busca** (`#/busca`): `plat` = família (nintendo\|playstation\|xbox, via `consoleFamily()`);
  `console` = valor exato de `plataformas[]` (ex. PS5) — os dois juntos filtram console dentro da família. O
  filtro manual "Plataforma" da busca escreve em `console` (não em `plat`, reservado pros links de família).

**Visual**
- Duas fontes: **Georgia (serifa) nos títulos/monogramas + DM Sans** no resto. Nunca `!important` global de fonte.
- Cabeçalho: logo larga, começa na borda esquerda sem margem. Sem botão "Onde comprar" no hero (o cartão de preço já leva ao comparador).
- Vidro/translucidez só na navegação (cabeçalho, Browse, gavetas); conteúdo (cards, linhas de oferta) é opaco. Sempre fallback sólido.
- Ícones de universo: desenho próprio estilizado, sem recriar logo oficial.
- Comparador abre em **Todos** (Novo+Usado+Digital juntos); botões viram filtro.
- Tema por tipo de página (`data-theme` no `<html>`, trocado em cada rota — `route()` em `app-main.js`): `game` (ficha do
  jogo), `platform` (página de plataforma), `universe` (qualquer aba do universo), `neutral` (home, busca, diretório,
  merch, inventário, tema, o resto). Cor base vem de `applyUniverseChrome()` + paleta do universo/plataforma; sem
  paleta própria, cai no bloco "padrao" dos tokens `--page-bg`/`--panel-base`/`--action`.
- Paleta por universo: `src/data/paleta-universos.json` (fundo/painel/ação por franquia, cor **fixa**, sem entrada ali
  cai no "padrao"); `src/data/paleta-plataformas.json` equivalente para Nintendo/PlayStation/Xbox.
- **PageBackdrop** (pacote5c, item 2): fundo dinâmico atrás de home, plataforma, universo e ficha/comparadora do jogo
  (`#ambientBg`/`#ambientBg2`, duas camadas que se alternam pra fazer crossfade de verdade, controladas por
  `setBackdropArt()` em `app-main.js`; `#ambientShade` é a vinheta por cima, tingida com `--hero-base` **global**
  — novo fallback em `:root`, deriva de `--page-bg`, pra um elemento irmão do `<body>` também saber a cor da
  página). Opacidade por tema via CSS (`--backdrop-art:.35` padrão, `--backdrop-art-game:.55`). Acompanha a
  rotação do hero (home/plataforma/universo, crossfade 1200ms) via `paint()`/`show()` de `initHomeHeroWide`,
  `legacyInitHomeHeroWide` e `initHomeCarousel`; troca de página usa 400ms. `resetBackdrop()` liga/desliga por
  rota (ligado nessas 4; desligado em busca/diretório/merch/inventário/tema/em-alta). `updateAmbientBg(url,force,mode)`
  continua existindo (usado pela ficha do jogo e pelo hero de universo) — por baixo, hoje é só uma casca fina
  sobre `setBackdropArt()`. **Não validado com artwork real neste ambiente** (sem rede pra IGDB) — conferir
  crossfade, opacidade e contraste dos títulos soltos no preview antes de confiar.
  **Correção pacote5d 1**: o fundo nunca aparecia porque `<body>` tinha `background:var(--store)` OPACO
  (`--store` = `--page-bg` em `body.dark-surface-route`, hoje toda página) — como `<body>` não cria stacking
  context próprio, essa cor pintava POR CIMA dos filhos de z-index negativo (ordem de pintura do CSS: z-index
  negativo entra antes da caixa não-posicionada do próprio elemento). A cor da paleta agora vive só em
  **`#ambientAnchor`** (camada 1, elemento próprio, `z-index:-3`, o mais baixo dos quatro) — `<body>` (e as 2
  outras "eras" de regra que setavam o mesmo background) ficou transparente.

## Arquivos de prompt (`docs/`)
- `docs/prompt-pacote-7-expansao.md`: pacote atual (expansão do catálogo via GitHub Action + universos
  automáticos). Só o item 1 (script + workflow + exemplo de amostra) feito até agora — ver seção própria abaixo.
- `docs/prompt-pacote-6b-saida.md`: pacote anterior, completo (pasta de saída `dist/` do build + fix da
  contagem 514/515 — ver seção "Build e pasta de saída" acima).
- `docs/prompt-pacote-6-lancamento.md`: pacote anterior, completo (hero adaptativo, preço único, EXEMPLO fora
  de produção, endereços limpos + SEO, Lighthouse).
- `docs/prompt-pacote-5e-versoes.md`: pacote anterior, completo (rótulo "Ver todos" vai pro ladrilho, sigla
  centralizada, versões ocultas). `docs/versoes-candidatas.md`: varredura de obras candidatas (item 3.2).
- `docs/prompt-pacote-5d-correcoes.md`: pacote anterior, completo (4 correções sobre o 5C — fundo dinâmico que
  não aparecia, hero da ficha do jogo sem arte, "Ver todos" duplicado, pílula branca vazia).
- `docs/prompt-pacote-5c.md`: pacote anterior, completo (hero ancorado à direita, fundo dinâmico, caixa de
  consoles "cabe ou sai", ladrilho "Ver todos" com leque de capas, contagem de universos corrigida).
- `docs/prompt-pacote-5b-ajustes.md`: pacote anterior, completo.
- `docs/prompt-pacote-5-final.md`: pacote anterior, completo (seções 1-6).
- `docs/prompt-pacote-4.md`: pacote anterior, completo (1B, 2, 3, 4, 5).
- `docs/antigos/prompt-pacote-4 (2).md`: duplicado do pacote 4, arquivado (mesmo conteúdo do atual, mantido só por histórico).
- `docs/franquias-sem-universo.md`: lista de franquias de 1–2 jogos (não viram universo ainda).

## Estado atual (07/10/2026)
Feito: catálogo base (Mario, Zelda, CoD, RE, Spider-Man, GoW…), IGDB com 4 heurísticas de capa, Mercado Livre com fallback,
token com renovação automática + `painel.html`, RAWG isolada (ainda não ligada a páginas), filtro de gênero,
selos Oficial/Varejo, comparador "Todos", página Games em bento (Multi+Retrô lado a lado). Pacote4 completo (vistoria,
formato físico/pré-venda, links diretos de loja, merch com fonte única, avisos) + ajuste 4B (prioridade da mensagem
"sem revenda", "Em breve" no hero de jogo não lançado, bug do link da Steam). Pacote5 completo: página de plataforma
(hero sem pílula + ladrilhos + 1 linha de destaques + caixa de consoles), diretório de universos com ladrilhos, busca
lendo merch.json + parâmetros plat (família)/console (exato), consoles.json. Pacote5B: ajustes finos do hero largo e
dos ladrilhos (preenchimento de arte, pílulas, espaçamento/altura fixa) — ainda na plataforma/diretório. Pedido do dono
depois do pacote5B: **manter os layouts do pacote5/5B no resto do site, mas devolver a Home ao desenho do Pacote 4**
(hero com thumbnails + abas em pílula "Destaques" + "Universos em destaque" + "Retrô" + "Colecionáveis e merch") — feito
via fork `legacy*`/`.lhw-*` isolado, sem mexer no que a plataforma/diretório/busca usam (ver seção "Home volta pro
Pacote 4" acima). Pacote5C completo (5 itens): hero largo da plataforma ancorado à direita de verdade (o bug do
"bloco escuro chapado" era a classe `game-hero-art` puxando CSS de um componente antigo não relacionado, não a
posição — removida do markup do `.hhw-art`/`.lhw-art`); fundo dinâmico da página (PageBackdrop, ver seção
"Visual" acima) em home/plataforma/universo/jogo; caixa de consoles "cabe ou sai" (altura fixa, esconde os
consoles com menos jogos primeiro até caber, nunca o selecionado, "+N →" quando sobra oculto); ladrilho "Ver
todos" sólido com leque de 3 mini-capas; contagem de universos corrigida (só conta universo de verdade, 3+
jogos — Nintendo 115→27, PlayStation 203→24). Pacote5D completo (4 correções sobre o 5C): fundo dinâmico que não
aparecia de jeito nenhum (causa: `<body>` opaco pintando por cima do PageBackdrop — ver "Correção pacote5d 1" na
seção "Visual" acima; não era bug de posição/imagem, era ordem de pintura do CSS); hero da ficha do jogo
"vazio" em jogos de pacote combo (ex. "Super Mario Galaxy + Super Mario Galaxy 2") — o hero já reaproveitava a
mesma cadeia de arte (`hydrateIgdbVisuals`→`setHeroBackground`→`fetchIgdbVisual`, nada duplicado), o problema
era o título composto não bater com nada na IGDB — `fetchIgdbVisual` agora tenta de novo só com o jogo antes do
" + " quando a busca completa falha; rótulo "Universos {plataforma}" não é mais link quando o ladrilho "Ver
todos" existe (os dois levavam pro mesmo lugar); selo "Varejo/revenda" de oferta real (Shopee/Gamer Hut) tinha
dois bugs de CSS empilhados dentro de `.compare-source` (coluna flex sem `align-self:flex-start` esticava o
chip pra largura inteira + `.compare-source>span` com especificidade maior pintava o texto quase-branco em
cima do fundo branco do próprio chip) — lia como "pílula branca vazia", corrigido. Pacote5E completo (3
itens): rótulo "Universos {plataforma}" sai de cima da fileira quando o ladrilho "Ver todos" existe (a info
já mora só nele — "Ver todos os universos → / {N} no total"); sigla do ladrilho sem capa volta a ficar
centralizada no lugar da capa (não mais ao lado do nome); **versões ocultas** (ver seção "Catálogo" acima) —
`src/data/versoes.json` + infra de busca por `igdb_id` (`getGameById` em `lib/igdb.js`, nunca por nome quando
o id existe) aplicada a Majora's Mask e Twilight Princess (ambos já eram obra única no catálogo, só faltava o
ano/título por plataforma); `docs/versoes-candidatas.md` lista mais 8 grupos achados numa varredura (1
candidato real não aplicado — Marvel's Spider-Man + Remastered —, 4 já cobertos pela convenção de remake, 3
falsos positivos). Sem rede pra IGDB neste ambiente de execução: ladrilhos/heróis validados com fallback de
sigla/degradê, não com capa real — conferir no preview antes de confiar nas 4 heurísticas de capa, no
crossfade do PageBackdrop, no leque de capas do "Ver todos", se o retry sem sufixo da IGDB acha os jogos de
pacote combo e se a capa de Majora's Mask/Twilight Princess muda de verdade ao trocar de plataforma (o
`igdb_id` de ambos está `null` — precisa ser confirmado com rede de verdade antes).
Se `main` e `Teste-novo-layout` divergirem, confira `git log` — alguns fixes foram feitos primeiro em um e depois portados.

## Backlog (ordem sugerida)
1. **Triagem do catálogo do GPT** (`catalogo-atualizado.js`, 559 títulos): estacionar ~56 (33 gratuitos, mobile, VR, PC-only) numa lista
   com o motivo; universo só com 3+ jogos; classificar gêneros dos ~348 sem gênero; corrigir "Luigi's Mansion" duplicado
   (apóstrofo curvo); **checar plataforma e data por título** (o GPT errou plataformas, ex.: pôs Xbox em Guild Wars 3).
2. **Página de universo** conforme referência: bloco de cor no topo com key art escurecida · hero à esquerda (4 lançamentos mais
   recentes, "1/4", botão **Ver ofertas**) · à direita **Meu Inventário** com rolagem própria (capa, título, plataforma·ano, "Tenho ✓")
   e abaixo dois blocos **Colecionáveis** e **Fã-made** (cards de categoria, como hoje) · fileira dos jogos da franquia com preço e setas. Mobile empilhado.
3. **Cor por universo**: tabela semente (~25) → paleta tonal (fundo escuro, painel, acento) com contraste ≥ 4.5:1. Dá para usar
   `@material/material-color-utilities` num script (rodar com npm aqui, o que o chat não conseguia). Cor **fixa por franquia**.
4. ~~Hubs de plataforma~~ — feito no pacote5 (seção "Página de plataforma e diretório de universos" acima), com
   um desenho diferente do descrito aqui (hero + ladrilhos + 1 linha de destaques + caixa de consoles, não a vitrine
   segmentada franquias→ofertas→retrô→merch original).
5. **Cabeçalho por universo**: transparente sobre o bloco de cor, sólido neutro ao rolar; botões brancos; "Meu Inventário" como
   Extended FAB (mesma forma, só a cor de fundo muda). Precisa de **logo branca** de verdade (a atual tem contorno preto).
6. Seção **Lojas oficiais** na home; nota **Metacritic** (RAWG) na ficha; **tradução** da sinopse (Google Cloud Translation, com cache).
7. Futuro: seção **Consoles** (3 atuais + retrô oficial usado + handhelds AYN/Retroid/Anbernic, sem prometer ROM); acessórios (8BitDo: "licenciamento não confirmado").
Pendências do dono (não são código): criar Redis Upstash na Vercel, trocar `DIAGNOSTICS_SECRET`, chave da RAWG, reconectar Mercado Livre;
aguardando aprovação: Kabum, API de afiliados Shopee, Nuuvem Co-Op.

## Armadilhas já vividas (não repita)
- CSS: `.games-directory` precisa de `display:grid`. Já houve 4 "eras" de regras empilhadas para a mesma classe — **procure a regra
  existente antes de criar outra** e remova a antiga. Limpezas grandes de CSS quebraram cor de fundo e grid: teste visual antes de commitar.
- Buscas por texto em APIs externas quebram quando a gente cola um sufixo nosso ("(2023)", nome da plataforma): tenha fallback sem o sufixo.
- Token do Mercado Livre é rotativo; a URL de redirect do OAuth é a de **produção** (conectar só lá).
- Não confie em fetch de imagem da IGDB no navegador para ler pixels sem testar CORS; sempre com fallback para a tabela fixa.
- `hydrateIgdbCovers()` faz `el.innerHTML=coverTile(...)` em qualquer elemento com `data-igdb-cover` quando a capa chega —
  nunca coloque esse atributo num card/contêiner que já tem outro conteúdo (nome, preço, botão), senão a capa some tudo
  quando a IGDB responde (bug do item 1.7). `data-igdb-cover` só num slot dedicado (um `<span>`/`<a>` só da capa); texto
  e botões ficam em elementos **irmãos**, fora do slot. Mesmo cuidado para selos/badges que entram por cima de uma capa
  (ex. corner-mock de EXEMPLO/PRÉ-VENDA): sempre num wrapper à parte, nunca dentro do próprio elemento com `data-igdb-cover`.
- **`src/data/paleta-universos.json`-style "tabela de anos por título exato" (`collections` em `catalog-data.js`)
  exige título ÚNICO por entrada, mesmo quando duas entradas são do MESMO universo em anos diferentes**
  (pacote6b, item 2): `collections.godofwar.items` tinha DUAS entradas com `title:'God of War'` (a de 2005 E a
  de 2018) — como a busca é por `Map.set(title,...)` (o último sobrescreve o primeiro), o jogo de 2005 (PS2)
  ficava com o ANO e o SLUG do jogo de 2018 (`god-of-war-2018`), e o jogo de 2018 de verdade caía no fallback
  `slugify(título)`, colidindo com o mesmo slug. Resultado visível: contagem "515 jogos no inventário" (conta
  `catalog.length`, 1 por linha de `D.catalog`, sempre correta) batendo diferente da contagem de páginas
  geradas pelo build (514 — o script tratava a colisão de slug como "mesmo jogo repetido" e descartava a
  segunda ocorrência, quando na verdade eram dois jogos DIFERENTES colidindo por um bug de dado). Corrigido
  ajustando a entrada de 2018 pra `title:'God of War (2018)'` (igual ao título já usado na linha do catálogo
  principal) — com títulos únicos, os dois jogos resolvem slug e ano certos e os dois números voltam a bater
  (515 = 515). **Lição**: ao adicionar uma entrada em `collections` pra um remake/relançamento com "(ano)" no
  título do catálogo principal, o título dentro de `collections.*.items` tem que ser EXATAMENTE esse (com o
  "(ano)"), nunca o nome "pelado" da franquia — título duplicado ali é silencioso (não dá erro, só embaralha
  slug/ano de dois jogos).

## Como testar
`node --check` em cada `.js`; servidor estático (`python3 -m http.server`) + Playwright para screenshots em desktop/tablet/mobile.
`/api/offers` precisa rodar como função (use `vercel dev` ou chame o handler direto com `req/res` simulados).
- **Endereços limpos**: `python3 -m http.server` não reproduz `cleanUrls`/rewrite da Vercel — pra testar
  `/jogo/{slug}` sem `#`, rode `node scripts/build.js` (gera `dist/`) e sirva `dist/` com algo que imite
  `cleanUrls` + o rewrite com exclusão por extensão/`api/` (serve `jogo/{slug}.html` em `/jogo/{slug}`, cai no
  `index.html` só pra path sem extensão e fora de `api/`, 404 de verdade pro resto) — python puro só serve o
  `.html` com a extensão e nunca dá 404 pro que não existe.
- **Lighthouse** (pacote6, item 5): `npx lighthouse <url> --preset=desktop` (desktop) ou sem `--preset` (mobile,
  simula rede/CPU lenta — pontuação de performance mobile é sempre bem mais baixa que desktop, é o throttling
  do próprio Lighthouse, não um bug; no deploy real da Vercel (CDN, compressão) o número sobe). Precisa do
  Chromium do Playwright: `CHROME_PATH=/caminho/do/chromium npx lighthouse ...`.

## Pacote6, item 5 — notas do Lighthouse (desktop/mobile; home, plataforma, universo, jogo, comparativo, item de
merch, testado localmente com o servidor que imita `cleanUrls`+rewrite, sem rede de verdade)
- **Acessibilidade: 100 em todas as 12 combinações** depois dos ajustes abaixo (estava 85-99). SEO: 100 em
  todas (as páginas estáticas do item 4 já cuidam disso). Best-practices: 81 em todas — ver "XHR síncrono"
  abaixo. Performance desktop 87-98 (bom); mobile 50-61 — esperado (throttling agressivo do próprio Lighthouse
  simulando rede 4G lenta + CPU 4x mais devagar; servidor local sem CDN/cache/compressão também pesa contra;
  conferir o número de verdade no preview da Vercel antes de se preocupar).
- **Corrigido** (achados reais do Lighthouse, não suposição):
  - `aria-pressed` num `<a>` sem `role="button"` (pílulas "Ordenar destaques" da home) — ARIA inválido.
  - Capa de jogo sem imagem carregada (fallback de sigla) ficava sem nome acessível nenhum (`link-name`) — ganhou
    `aria-label` combinando a sigla visível + o título completo (as duas coisas precisam bater, senão vira o
    próximo item).
  - `aria-label` customizado que não batia com o texto visível do próprio link (`label-content-name-mismatch`) —
    `.ud-big` (card grande de universo), `.universe-tile`/`.universe-tile-more` (ladrilhos): removido o
    `aria-label` nesses 3, o texto visível (nome + contagem/CTA) já é um nome acessível coerente sozinho.
  - `.mock-chip` (selo EXEMPLO) e o link "Ver universo →" do comparativo usavam cor fixa (`--text-2`/`--red-ink`)
    sem contraste garantido em cima de toda cor de paleta de universo/plataforma — trocados por tokens
    translúcidos mais opacos / `--action-on-glass` (mistura com branco, pensado pra isso).
  - `--text-2`/`--muted` (dark-surface-route) subiu de opacidade .68→.76 — tinha 4.1:1 (abaixo do mínimo) em
    cima de cor de plataforma saturada (ex. vermelho do Mario); mudança praticamente imperceptível no visual.
  - Cor ativa da barra inferior mobile (`--action` puro) trocada por `--action-on-glass` (mesmo motivo).
  - `<h3>` pulando direto do `<h1>` na página do item de merch (grupo de ofertas por condição) — virou `<h2>`
    (`heading-order`).
  - Bolinhas/barras de indicador dos carrosséis (hero de plataforma/home/universo) tinham alvo de toque de 8px
    (precisa 24px) — ganharam padding invisível (`background-clip:content-box`, não muda o visual) até 24px.
  - `aria-label` no card de jogo vazio do comparativo ("ver todos") já cobria `link-name`; as capas de jogo
    (`posterCard`) ganharam `aria-label` com o título completo onde faltava.
- **Não corrigido, documentado aqui** — `deprecations` (XHR síncrono): `app-1-core.js` carrega 8 arquivos
  pequenos de `src/data/*.json` com `XMLHttpRequest(...,false)` (síncrono) logo no topo do script, pra todo o
  resto do app poder assumir que os dados já estão prontos sem precisar de `await`/callback em cascata.
  Consertar isso de verdade pede reestruturar o bootstrap inteiro do app pra assíncrono (Promise.all no
  carregamento + segurar a 1ª renderização até resolver) — mudança grande, testada com cuidado, fora do escopo
  seguro desta rodada. É o ÚNICO audit que prende best-practices em 81 (confirmado lendo os `auditRefs` do
  Lighthouse) — se for atacado no futuro, vale um pacote próprio só pra isso.
- **Links** (varredura programática, não manual): 0 parâmetro de rastreamento (`utm_`, `gclid`, `tag=`,
  `affiliate`) em qualquer URL externa do catálogo (`catalog-data.js`, `src/data/merch.json`, `lib/*.js`,
  `api/*.js`); todo `jogosRelacionados`/`universo` do merch.json aponta pra um slug real do catálogo (checado
  slug a slug, 0 referência quebrada); todo `href="#/..."` interno usa um prefixo de rota que `route()`
  realmente trata (sem typo tipo `#/jogos/` por `#/jogo/`). Console sem erro em 21 rotas × 2 tamanhos de tela
  (desktop 1440×770 e mobile 393×852) — a lista completa cobre home, busca, diretórios, merch, 3 plataformas,
  2 universos, 2 jogos, 2 comparativos, 2 itens de merch, 1 tema e os dois arquivos gerados (sitemap.xml,
  robots.txt).

## Pacote7 — expansão do catálogo via GitHub Action (em andamento — só o item 1 feito)
- **Por quê uma Action e não o build da Vercel**: este ambiente de execução (e o build da Vercel) não tem rede
  pra `api.igdb.com`; a importação roda numa GitHub Action manual (`workflow_dispatch`,
  `.github/workflows/importar-igdb.yml`), usando os secrets do repositório `TWITCH_CLIENT_ID`/
  `TWITCH_CLIENT_SECRET` (mesmo par de credenciais do app Twitch Dev que o site já usa em produção sob os
  nomes `IGDB_CLIENT_ID`/`IGDB_CLIENT_SECRET` nas env da Vercel — só o nome do secret é diferente aqui porque o
  pacote pediu esse nome literal). A Action **nunca** altera o catálogo direto numa branch — sempre abre PR.
- **Item 1 (script + modo amostra) — feito**: `scripts/importar-igdb.mjs`.
  - Plataformas atuais: Nintendo Switch (igdbId 130), PS4 (48), PS5 (167), Xbox One (49), Xbox Series X|S
    (169). Retrô (teste): SNES (19). IDs não confirmados contra a API ao vivo neste ambiente (sem rede pra
    IGDB no sandbox) — valores estáveis e documentados pela comunidade IGDB; o primeiro run real loga quantos
    jogos cada plataforma devolveu antes de qualquer filtro, pra pegar na hora se algum ID estiver errado
    (viria zerado).
  - Filtro anti-shovelware: campo `category` da IGDB, só aceita 0 (jogo principal), 8 (remake), 9 (remaster).
    Excluídos, nomeados no pacote: DLC(1)/expansão(2,4)/bundle(3)/mod(5)/episódio(6)/temporada(7)/pacote(13)/
    atualização(14). **Não nomeados pelo pacote, excluídos por padrão por ambiguidade**: port(11),
    expanded_game(10), fork(12) — se fizer falta algum porte relevante na amostra, é só acrescentar ao array
    `CATEGORIAS_PERMITIDAS` no script.
  - Popularidade: `max(total_rating_count, hypes)` — avaliações (críticas+usuários) OU "quero jogar"
    pré-lançamento, o que for maior (pensado pra não descartar jogo recém-anunciado e popular que ainda não
    tem avaliação nenhuma).
  - **Sinal de lançamento físico — não implementado, documentado**: a IGDB não tem um campo dedicado e
    confiável pra "teve lançamento físico" (não confirmado contra a documentação ao vivo neste ambiente); o
    pacote previa usar esse sinal como critério alternativo SE existisse — como não há, o filtro é só
    popularidade (exatamente o fallback que o próprio pacote pedia pra esse caso).
  - SNES (item 1b): corte PRÓPRIO e SEPARADO do das plataformas atuais (`CORTES_SNES_OCIDENTAL`/
    `CORTES_SNES_JAPONES` no script — valores de partida, ajustáveis depois de ver a amostra real). Split
    ocidental/exclusivo-japonês via `release_dates.region` (região 5 = Japão; 1/2/3/4/8 = Europa/América do
    Norte/Austrália/Nova Zelândia/Mundial = "ocidental"). A IGDB não tem código de região específico pra
    Brasil — cartucho brasileiro de SNES era predominantemente NTSC-US (Playtronic licenciava os jogos dos
    EUA), então "lançado no Brasil" não é distinguível por essa via e não muda a classificação aqui (a região
    só importa como atributo da OFERTA depois, no catálogo — nunca do jogo).
  - Rate limit: fila sequencial, ~3,3 requisições/segundo (sem paralelismo), margem sobre o limite de ~4/s da
    IGDB.
  - **Validado com dados simulados** (sem rede pra IGDB neste ambiente): `node scripts/importar-igdb.mjs
    --modo=amostra` sem `TWITCH_CLIENT_ID`/`TWITCH_CLIENT_SECRET` no ambiente cai automaticamente no gerador
    de dados fake (distribuição de popularidade em cauda longa, pra validar a lógica de corte/exemplos) e
    rotula o relatório inteiro como SIMULADO. `docs/importacao-amostra.md` commitado é esse resultado
    simulado — é só pra o dono ver o FORMATO antes de rodar a Action de verdade; os números e nomes não são
    reais.
  - Workflow (`.github/workflows/importar-igdb.yml`): `workflow_dispatch` com inputs `modo`
    (amostra/completo) e `corte` (string livre). Modo amostra: roda o script e abre PR (via
    `peter-evans/create-pull-request`) só com `docs/importacao-amostra.md`. Modo completo: o script já tem o
    ponto de entrada (`rodarCompleto()`) mas ainda não faz nada (ver abaixo) — a Action roda, loga e sai com
    erro de propósito, pra nunca passar impressão de que completou algo que não fez.
- **Itens 2 (importação completa + catálogo dividido por plataforma + mescla), 3 (universos automáticos) e 4
  (documentação final) — NÃO IMPLEMENTADOS ainda**: dependem do dono rodar a Action em modo amostra, escolher
  o corte vendo nomes reais, e pedir o modo completo (fluxo pedido pelo próprio pacote: "Eu rodo a Action em
  modo amostra, escolho o corte e peço o modo completo"). Ficam pra uma próxima rodada.
