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

## Stack (sem etapa de build)
HTML/CSS/JS puro + Vercel Functions (Node 24, CommonJS). Roteamento por hash (`#/games`,
`#/universo/:slug`, `#/jogo/:slug`, `#/ofertas/:slug?plat=&cond=`, `#/busca?...`).
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
  `RAWG_API_KEY`, `DIAGNOSTICS_SECRET`, `YOUTUBE_API_KEY`, `OPENAI_*`, `CRON_SECRET`. Nunca imprima segredos.

## Regras de produto (decididas)
**Preço e honestidade**
- Nunca inventar preço. Dado de demonstração aparece com selo **EXEMPLO**.
- Novo / Usado / Digital são separados. **Digital não tem "usado"** (licença não se revende).
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

**Merch** (colecionáveis, decoração, casa, iluminação, vestuário, livros e arte — pacote4, seção 4)
- Fonte única: `src/data/merch.json` — **não é** `lib/shopee-manual-offers.js` (esse é preço de jogo, schema incompatível).
  Schema do item: `id,titulo,universo,categoria,origem,tipo,loja,url,preco,precoAtualizadoEm,imagem,imagemFonte,imagemAutorizada,exemplo`.
- Regra de imagem: só renderiza foto com `imagem` **e** `imagemAutorizada===true` (nunca hospedar/copiar foto de
  terceiro); sem isso, ícone da categoria (`assets/icons-categoria.svg`) sobre o degradê do universo.
- Regra de preço: preço + "atualizado há N dias" só com `precoAtualizadoEm` de até 14 dias; passado isso (ou `preco`
  nulo), "Ver preço na {loja}" sem número.
- Regra fixa (vale pro site inteiro): nunca link direto pra loja a partir de card/lista — o clique abre `#/item/{id}`;
  só lá tem o botão de verdade pra loja (`rel="sponsored noopener"`) e o link "Pedir remoção de conteúdo".
- Busca (`#/busca`) migrada pro merch.json desde o pacote5 (`merchRows`/`priceCell`/`rowMarkup` em
  `app-2-search.js` leem `merchItemsVisible()`, não mais `M.items`).

**Página de plataforma e diretório de universos** (pacote5) · **Home** voltou pro desenho do Pacote 4 (pedido do
dono, pacote5b final — ver nota abaixo)
- **Hero largo** (`.hhw-*`, componente único reaproveitado só na plataforma agora, função `homeHeroWideMarkup`):
  altura fixa 340px, arte numa janela de 70% de largura (degradê pra `--hero-base`, a cor da paleta do
  jogo/universo do slide — não mais hash aleatório), texto no topo-esquerda, rotação automática (7s, pausa no
  hover/foco, indicadores finos + botão de pausa no canto **superior** direito — os ladrilhos cobrem a base).
  Pílulas só informativas (PRÉ-VENDA/EM BREVE reaproveita `releaseState` do pacote4; "Só em console X" quando o
  jogo só sai numa única plataforma — heurística best-effort). A home tem seu **próprio** hero, independente
  deste (ver nota "Home volta pro Pacote 4" abaixo).
- **Regra de preço pra jogo não lançado ou `semDisco`, em QUALQUER componente novo** (hero, cards, painel lateral,
  linhas): nunca "Usado a partir de". Com oferta física de exemplo (sempre Novo — `sampleOffers` nunca gera Usado
  pra jogo não lançado): "Pré-venda a partir de R$X". Sem oferta: "Em breve" (+ data se houver). Função central:
  `heroWidePriceCta`/`sideRowPriceChip` — não reimplementar em paralelo.
- **UniverseTile** (`universeTileMarkup`, item 1.3): ladrilho único usado na plataforma (sobreposto ao hero, até 6
  + "ver todos") e no diretório (`#/universos`, em grade, sem sobreposição). A home **não usa mais** esse
  componente (voltou aos cards `universeDestaqueBig`/`universeDestaqueCompact` do Pacote 4). Capa do jogo
  principal saltando acima do ladrilho — **só** com `naturalWidth>=200` medido de verdade (`hydrateUniverseTiles`);
  sem capa válida, a sigla (campo `sigla`) é o **plano B**, nunca o padrão.
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

## Arquivos de prompt (`docs/`)
- `docs/prompt-pacote-5-final.md`: pacote atual em execução (seções 1-5 feitas; 6 é este commit).
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
Pacote 4" acima). Sem rede pra IGDB neste ambiente de execução: ladrilhos/heróis validados com fallback de
sigla/degradê, não com capa real — conferir no preview antes de confiar nas 4 heurísticas de capa.
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

## Como testar
`node --check` em cada `.js`; servidor estático (`python3 -m http.server`) + Playwright para screenshots em desktop/tablet/mobile.
`/api/offers` precisa rodar como função (use `vercel dev` ou chame o handler direto com `req/res` simulados).
