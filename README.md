# Inventário Gamer 2.0

Reconstrução limpa do Inventário Gamer, sem reaproveitar a estrutura acumulada das versões 0.9x.

**Proposta:** “Encontre o item que falta no seu Inventário.”

## O que já existe nesta base

- Frontend estático, responsivo e sem framework pesado.
- Home, diretório Games, Universo, página individual do jogo e Meu Inventário.
- Diretório em quatro faixas: Nintendo, PlayStation, Multiplataforma e Catálogo Retrô.
- Busca/autocomplete local (não consulta API a cada tecla).
- Integração server-side com IGDB/Twitch, com cache de token em memória por instância e controle de ritmo abaixo de 4 req/s.
- Cache HTTP nas rotas IGDB para aproveitar a CDN da Vercel.
- Hero por artwork/screenshot e cover separada; cover nunca é esticada para hero.
- Curadoria de franquia com fallback `franchises -> collections` e seleção de hero por mídia + sinal de popularidade + overrides.
- Modelo de **linhagem por lançamento**: original, remake, remaster, port e edição são registros distintos.
- “Retrô” é atributo do lançamento/registro, nunca herdado pela franquia inteira.
- Mercado Livre isolado atrás de `/api/offers`, com falha graciosa.
- DataForSEO isolado e busca paga **desligada por padrão**.
- Endpoints de diagnóstico desativados sem `DIAGNOSTICS_SECRET`.
- Meu Inventário local com `Tenho`, `Quero` e alerta.

## Estrutura

```text
/
├─ index.html
├─ catalog-data.js
├─ mock-data.js
├─ package.json
├─ vercel.json
├─ env.example
├─ assets/
├─ src/
├─ api/             # somente rotas HTTP finas
├─ lib/             # autenticação, IGDB, marketplace, segurança, helpers
└─ tests/
```

## Regra principal de dados

**Dados são a verdade. IA interpreta os dados.**

O frontend não inventa preço, desconto, estoque, disponibilidade ou frete. Quando não há oferta validada, mostra “Sem ofertas no momento”.

### OG x remake x remaster x port

A relação pertence ao registro do jogo. Exemplo:

- `Resident Evil 2 (1998)` → original + retrô
- `Resident Evil 2 (2019)` → remake + moderno

Os dois podem aparecer no mesmo Universo Resident Evil, mas possuem páginas, capas, plataformas, ofertas e classificação Retrô independentes.

A IGDB fornece `game_type`, `remakes`, `remasters`, `ports` e `version_parent`; a curadoria local continua sendo a camada final para decisões editoriais do Inventário Gamer.

## Variáveis de ambiente

Copie `env.example` apenas para referência. **Nunca versione valores reais.** As credenciais já existentes na Vercel podem ser usadas nos nomes abaixo:

- `IGDB_CLIENT_ID`
- `IGDB_CLIENT_SECRET`
- `MELI_ACCESS_TOKEN`
- `MELI_REFRESH_TOKEN`
- `MELI_CLIENT_ID`
- `MELI_CLIENT_SECRET`
- `DATAFORSEO_LOGIN`
- `DATAFORSEO_PASSWORD`

Opcionais:

- `DIAGNOSTICS_SECRET`: habilita/protege `/api/*/status` via `X-Diagnostics-Key`.
- `DATAFORSEO_SEARCH_ENABLED=1`: libera explicitamente a rota paga de teste. Deixe `0` no MVP.

## Mercado Livre e refresh token

A base **não tenta persistir automaticamente refresh token rotativo**. O access token atual é usado se existir; quando a autenticação falhar, `/api/offers` devolve lista vazia em modo degradado e a interface continua funcionando.

Persistência durável do refresh token fica para uma etapa específica (ex.: Redis/Upstash ou outro storage adequado), evitando introduzir infraestrutura apenas para fazer a 2.0 nascer.

## Diagnóstico

Com `DIAGNOSTICS_SECRET` configurado:

```bash
curl -H "X-Diagnostics-Key: SEU_SEGREDO" https://seu-dominio/api/igdb/status
curl -H "X-Diagnostics-Key: SEU_SEGREDO" https://seu-dominio/api/ml/status
curl -H "X-Diagnostics-Key: SEU_SEGREDO" https://seu-dominio/api/dataforseo/status
```

Os endpoints nunca devolvem access token, refresh token, senha ou client secret.

## Deploy na Vercel

1. Extraia os arquivos na raiz do repositório vazio.
2. Faça commit/push.
3. Mantenha as Environment Variables de Production já configuradas.
4. Confirme em **Project Settings > Build and Deployment** que o runtime é Node.js `24.x`.
5. Faça o redeploy.

O projeto usa hash routing (`#/games`, `#/universo/...`, `#/jogo/...`) para manter o frontend estático simples e evitar rewrites desnecessários.

## Testes locais

```bash
npm test
npm run check
```

Para visualizar apenas o frontend estático (as APIs não funcionarão nesse servidor simples):

```bash
npm run serve
```

## Limitações conscientes desta primeira build 2.0

- O catálogo local é uma curadoria inicial, não a base completa de todas as franquias.
- Chips sem curadoria local suficiente não exibem contador inventado.
- A integração ML não faz refresh persistente automático ainda.
- DataForSEO não participa da experiência principal e fica desligado por padrão.
- Nintendo/PlayStation usam fallback textual quando um logo apropriado não está disponível; não há hotlink obrigatório para marca.
- Meu Inventário usa `localStorage`; conta/sincronização ficam para versão futura.
