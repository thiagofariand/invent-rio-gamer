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
- `src/app-1-core.js` (utilitários, ícones SVG, `coverTile`, `retailChip`, `GENRES`) ·
  `app-2-search.js` (busca, filtros, `digitalStores`) · `app-3-views.js` (telas, Browse) · `app-main.js` (roteador, eventos) · `style.css`.
- `api/`: `offers.js`, `trending.js`, `ml/{connect,callback,refresh,status}`, `igdb/{game,status}`, `rawg/status`.
- `lib/`: `mercadolivre.js`, `meli-oauth.js`, `meli-token.js` (renovação automática via Redis Upstash),
  `igdb.js`, `rawg.js`, `shopee-manual-offers.js`, `http.js`, `trending.js`.
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
- Rodapé tem aviso de link de afiliado; manter.

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

**Visual**
- Duas fontes: **Georgia (serifa) nos títulos/monogramas + DM Sans** no resto. Nunca `!important` global de fonte.
- Cabeçalho: logo larga, começa na borda esquerda sem margem. Sem botão "Onde comprar" no hero (o cartão de preço já leva ao comparador).
- Vidro/translucidez só na navegação (cabeçalho, Browse, gavetas); conteúdo (cards, linhas de oferta) é opaco. Sempre fallback sólido.
- Ícones de universo: desenho próprio estilizado, sem recriar logo oficial.
- Comparador abre em **Todos** (Novo+Usado+Digital juntos); botões viram filtro.

## Estado atual (28/09/2026)
Feito: catálogo base (Mario, Zelda, CoD, RE, Spider-Man, GoW…), IGDB com 4 heurísticas de capa, Mercado Livre com fallback,
token com renovação automática + `painel.html`, RAWG isolada (ainda não ligada a páginas), Browse no cabeçalho, filtro de gênero,
selos Oficial/Varejo, comparador "Todos", página Games em bento (Multi+Retrô lado a lado).
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
4. **Hubs de plataforma** (Nintendo, PlayStation): vitrine segmentada, ordem franquias → ofertas → retrô → merch; ícones por universo.
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

## Como testar
`node --check` em cada `.js`; servidor estático (`python3 -m http.server`) + Playwright para screenshots em desktop/tablet/mobile.
`/api/offers` precisa rodar como função (use `vercel dev` ou chame o handler direto com `req/res` simulados).
