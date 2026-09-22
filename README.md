# Inventário Gamer — Beta1 + Claudinho

Pacote completo da Beta1 com a revisão estrutural e de segurança sugerida pelo Claude. Pode ser enviado diretamente para a raiz do repositório.

## Runtime da Vercel

O projeto está fixado em **Node.js 24.x** pelo campo `engines` do `package.json`. Isso impede que futuros deployments dependam do Node.js 20, que será desativado para novos deployments na Vercel em 1º de outubro de 2026.

O projeto permanece em CommonJS (`module.exports`/`require`), compatível com as funções atuais. Não adicione `"type": "module"` ao `package.json` sem migrar os arquivos do backend.

## O que foi preservado

- Home, busca, páginas de jogo/universo e Meu Inventário da Beta1.
- Capas e artworks da IGDB.
- Ofertas do Mercado Livre com fallback gracioso.
- Catálogo local, mocks identificados e configuração central de plataformas retrô.

## O que mudou

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
```

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
```

`MELI_REDIRECT_URI` é opcional enquanto o endereço continuar sendo:

```text
https://inventario-gamer.vercel.app/api/ml/callback
```

Use as credenciais reais apenas em **Production**. Para Preview, deixe sem credenciais ou use credenciais separadas.

## Diagnósticos protegidos

Os endpoints abaixo exigem o header `x-inventario-diagnostics` com o valor de `DIAGNOSTICS_SECRET`:

- `/api/ml/status`
- `/api/igdb/status`

Exemplo:

```bash
curl -H "x-inventario-diagnostics: SEU_SEGREDO" https://inventario-gamer.vercel.app/api/igdb/status
```

## Limitação consciente do Mercado Livre

Esta versão continua usando reautenticação manual. O refresh token do Mercado Livre é rotativo e não deve ser gravado em arquivo ou variável por uma função serverless. Renovação automática só deve ser implementada quando existir armazenamento durável apropriado.

Quando o token expira, o site devolve uma resposta segura sem derrubar a página.

## Próxima etapa

A estrutura está preparada para receber o endpoint de franquias da IGDB com consultas em lote, curadoria manual e seleção de hero por relevância. Esse recurso ainda não foi ativado nesta versão.
