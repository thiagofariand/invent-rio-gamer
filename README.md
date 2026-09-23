# Inventário Gamer — Beta 1 + Claudinho · Quiet Luxury

Base completa da **Beta 1 + Claudinho**, agora com a nova direção visual aprovada. Este pacote substitui a sequência `.99x` como ponto de partida e pode ser enviado diretamente para a raiz do repositório no GitHub.

## Nova direção visual

- Cabeçalho maior, logotipo em alta resolução e ícone corrigido do Meu Inventário.
- Paleta quiet luxury gamer: marfim, grafite, tons quentes e vermelho Inventário mais contido.
- Cantos arredondados e sombras discretas apenas para separar planos.
- Home editorial em três partes: destaque em alta, ofertas em jogos e merch.
- Hero "Em alta" alternando três franquias, com atualização diária opcional e fallback local.
- Merch dividido em Produtos oficiais, Feito por fãs e Decoração gamer.
- Games em mosaico com Multiplataforma, Retrogaming, Nintendo e PlayStation.
- Universo com hero de franquia, jogos em medalhões e atalhos relacionados.
- Página do jogo com hero amplo e os três blocos de compra, colecionáveis e fan-made.
- Comparador de ofertas em página completa, com resultados à esquerda e ficha do jogo à direita.
- No celular, a ficha do jogo aparece antes das ofertas e a página Games segue a ordem Multi/Retro, Nintendo e PlayStation.

## Runtime da Vercel

O projeto está fixado em **Node.js 24.x** pelo campo `engines` do `package.json`. Isso impede que futuros deployments dependam do Node.js 20, que será desativado para novos deployments na Vercel em 1º de outubro de 2026.

O projeto permanece em CommonJS (`module.exports`/`require`), compatível com as funções atuais. Não adicione `"type": "module"` ao `package.json` sem migrar os arquivos do backend.

## O que foi preservado da revisão Claudinho

- Busca, catálogo, filtros, páginas de jogo/universo e Meu Inventário da Beta 1.
- Capas e artworks da IGDB.
- Ofertas do Mercado Livre com fallback gracioso.
- Catálogo local, mocks identificados e configuração central de plataformas retrô.
- Nova pasta `lib/`, fora de `api/`, para lógica reutilizável.
- Rotas de API menores, responsáveis apenas por request/response.
- Autenticação e cache do token Twitch centralizados.
- Token Twitch renovado antecipadamente aos 80% do TTL.
- Erros externos reduzidos a mensagem e status seguros.
- Diagnósticos IGDB e Mercado Livre protegidos por header secreto.
- Resultado dos diagnósticos guardado em memória por 60 segundos.
- OAuth do Mercado Livre centralizado e URI de callback configurável.
- `.gitignore` preparado para impedir o commit acidental de segredos.

## Estrutura

```text
api/                  rotas públicas finas da Vercel
  offers.js           agregador público de ofertas
  igdb/               jogo e diagnóstico IGDB
  ml/                 conexão, callback e diagnóstico ML
lib/                  clientes, autenticação, cache e erros compartilhados
src/                  frontend, estilos, busca, rotas e views
catalog-data.js       catálogo e configurações centrais
mock-data.js          fallback de demonstração
index.html            aplicação estática
package.json          fixa o runtime Node.js 24.x na Vercel
inventario-logo-header.png  logotipo em alta resolução
```

## Fluxo de ofertas

Na página de um jogo, as linhas **Novo**, **Usado** e **Digital** levam para:

```text
#/ofertas/:slug?plat=:plataforma&cond=:condicao
```

A tela compara os anúncios retornados pela fonte configurada e mantém a box-art, o ano, a plataforma, a condição e a sinopse visíveis. Se a integração não devolver resultados válidos, o site não inventa preço ou disponibilidade.

## Variáveis da Vercel

Configure em **Project Settings → Environment Variables**. Não coloque valores reais no GitHub.

```text
MELI_CLIENT_ID
MELI_CLIENT_SECRET
MELI_ACCESS_TOKEN
MELI_REFRESH_TOKEN
MELI_REDIRECT_URI
IGDB_CLIENT_ID
IGDB_CLIENT_SECRET
DIAGNOSTICS_SECRET
YOUTUBE_API_KEY
OPENAI_API_KEY
OPENAI_TRENDS_MODEL
CRON_SECRET
```

`MELI_REDIRECT_URI` é opcional enquanto o endereço continuar sendo:

```text
https://inventario-gamer.vercel.app/api/ml/callback
```

Use as credenciais reais apenas em **Production**. Para Preview, deixe sem credenciais ou use credenciais separadas.

## Em alta automático

O endpoint `/api/trending` consulta diariamente os vídeos populares da categoria Gaming no Brasil e cruza os títulos com as franquias que já possuem catálogo no Inventário. Se `OPENAI_API_KEY` estiver configurada, a IA seleciona e resume as três franquias mais relevantes; sem ela, o ranking usa recorrência, posição e visualizações. Se nenhuma integração responder, a Home mantém os destaques estáticos de `catalog-data.js`.

O `vercel.json` agenda a atualização para **11:00 UTC (08:00 de Brasília)**. A chamada do cron usa `CRON_SECRET`; o acesso público de leitura continua disponível para a Home, sem expor nenhuma chave.

## Diagnósticos protegidos

Os endpoints abaixo exigem o header `x-inventario-diagnostics` com o valor de `DIAGNOSTICS_SECRET`:

- `/api/ml/status` — agora também sonda a busca de usados (`sites/MLB/search`), além do catálogo de novos e do token.
- `/api/igdb/status`
- `/api/ml/refresh` — renova o `MELI_ACCESS_TOKEN` usando o `MELI_REFRESH_TOKEN` já salvo, sem precisar refazer o login completo em `/api/ml/connect`. Mostra os novos valores na tela para você colar na Vercel (o refresh token costuma trocar a cada uso).

Exemplo:

```bash
curl -H "x-inventario-diagnostics: SEU_SEGREDO" https://inventario-gamer.vercel.app/api/igdb/status
curl -H "x-inventario-diagnostics: SEU_SEGREDO" https://inventario-gamer.vercel.app/api/ml/refresh
```

## Limitação consciente do Mercado Livre

Esta versão continua usando reautenticação **manual**, só que agora em duas velocidades:

- **Renovação (a cada ~6h):** chame `/api/ml/refresh` (com o header de diagnóstico) e cole os dois valores na Vercel. Não precisa logar de novo.
- **Login do zero:** só é necessário se o refresh token for revogado/expirar por inatividade — aí sim volte a `/api/ml/connect`.

O motivo de não ser 100% automático: o refresh token do Mercado Livre é rotativo (troca a cada uso) e uma função serverless não consegue reescrever a própria variável de ambiente em disco. Renovação automática de verdade exige um armazenamento durável (ex.: Vercel KV, gratuito e nativo da Vercel) guardando o token atual e um cron chamando `/api/ml/refresh` sozinho antes da expiração. Ainda não implementado — é o próximo passo natural quando fizer sentido investir nisso.

Quando o token expira ou a busca falha, o site devolve uma resposta segura (`status` explicando o motivo) sem derrubar a página, tanto para Novo quanto para Usado.

## Busca de usados

`condition=used` agora consulta `sites/MLB/search` (o mesmo endpoint que já funcionava na v0.95) e reaplica os dois filtros herdados daquela versão antes de mostrar qualquer oferta:

- `listingRejectReason`: descarta reprodução/repro, peça sem mídia, lote, apenas capa/case e acessórios (amiibo, pôster etc.) que poluem a busca geral.
- `relevantEnough`: exige que o título do anúncio bata com o título do jogo buscado.

Isso é separado do fluxo de **Novo**, que continua usando a API de Catálogo (`products/search` + buy box) — pensada para produtos com catálogo oficial no Mercado Livre, por isso as duas rotas têm status independentes em `/api/ml/status`.

## Publicação

1. Extraia o ZIP.
2. Envie **o conteúdo da pasta** para a raiz do repositório no GitHub.
3. Confirme as variáveis de ambiente no projeto da Vercel.
4. Faça um novo deploy; a Vercel lerá o `package.json` e usará Node.js 24.x.

Não envie arquivos `.env` nem valores reais de credenciais ao GitHub.

## Próximas etapas possíveis

- Conectar os cards de merch a uma fonte real sem perder a identificação de origem.
- Refinar a curadoria de heroes e medalhões da IGDB por franquia.
- Adicionar armazenamento durável antes de automatizar a renovação do token do Mercado Livre.
