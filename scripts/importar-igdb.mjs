#!/usr/bin/env node
// pacote7, item 1 — script de importação/amostragem da IGDB.
//
// Roda numa GitHub Action (workflow_dispatch, .github/workflows/importar-igdb.yml),
// nunca local (este sandbox não tem rede pra api.igdb.com) e nunca no build da
// Vercel. Lê TWITCH_CLIENT_ID/TWITCH_CLIENT_SECRET dos secrets do repositório —
// são as MESMAS credenciais (par client_id/secret do app Twitch Dev) que o site
// já usa em produção sob os nomes IGDB_CLIENT_ID/IGDB_CLIENT_SECRET (env da
// Vercel, ver CLAUDE.md "Variáveis") — só o nome do secret é diferente aqui
// porque o pedido do pacote7 foi literal sobre o nome.
//
// MODO AMOSTRA (único implementado nesta rodada — ver docs/prompt-pacote-7-expansao.md,
// item 1: "No primeiro retorno: o script, o workflow e um exemplo de
// docs/importacao-amostra.md"): NUNCA grava catálogo. Só varre a IGDB (ou,
// sem credenciais/com --simular, gera dados FAKE pra validar o formato) e
// escreve docs/importacao-amostra.md com, por plataforma, quantos jogos
// passariam em cada corte de popularidade + exemplos reais perto de cada
// corte. O dono lê esse arquivo, escolhe o corte, e só então o MODO COMPLETO
// (item 2 em diante do pacote7 — AINDA NÃO IMPLEMENTADO, ver resumo) roda de
// verdade.
//
// IDs de plataforma da IGDB usados abaixo (Switch, PS4, PS5, Xbox One, Xbox
// Series X|S, SNES) são os valores estáveis e amplamente documentados pela
// comunidade IGDB — NÃO confirmados contra a API ao vivo neste ambiente (sem
// rede pra api.igdb.com no sandbox). O primeiro run real da Action loga
// quantos jogos cada plataforma devolveu antes de qualquer filtro; se algum
// vier zerado, o ID está errado e precisa ser corrigido ali (ver PLATFORMS).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

function arg(name, fallback) {
  const flag = `--${name}=`;
  const found = process.argv.find(a => a.startsWith(flag));
  if (found) return found.slice(flag.length);
  const envKey = name.toUpperCase();
  if (process.env[envKey] !== undefined && process.env[envKey] !== '') return process.env[envKey];
  return fallback;
}
const MODO = (arg('modo', 'amostra') || 'amostra').toLowerCase(); // 'amostra' | 'completo'
const CORTE = arg('corte', null);
const SIMULAR = process.argv.includes('--simular') || !(process.env.TWITCH_CLIENT_ID && process.env.TWITCH_CLIENT_SECRET);

function log(msg) { console.log(`[importar-igdb] ${msg}`); }

// ---------- plataformas desta expansão (pacote7, COMO TRABALHAR) ----------
// current-gen: filtro é categoria + popularidade mínima (item 1).
// SNES: regras próprias (item 1b) — só popularidade (cartucho é sempre
// físico), corte PRÓPRIO, e split ocidental/exclusivo-japonês.
const PLATFORMS_ATUAIS = [
  { slug: 'switch', nome: 'Nintendo Switch', igdbId: 130 },
  { slug: 'ps4', nome: 'PlayStation 4', igdbId: 48 },
  { slug: 'ps5', nome: 'PlayStation 5', igdbId: 167 },
  { slug: 'xbox-one', nome: 'Xbox One', igdbId: 49 },
  { slug: 'xbox-series', nome: 'Xbox Series X|S', igdbId: 169 },
];
const SNES = { slug: 'snes', nome: 'Super Nintendo (SNES)', igdbId: 19 };

// Cortes mostrados na amostra (número mínimo de popularidade pra entrar).
// Correntes: os 4 sugeridos no pacote. SNES: corte próprio (coleção retrô
// tem volume de avaliação bem menor que lançamento atual — os mesmos 5/10/
// 20/50 ficariam todos "quase tudo passa"; usei uma escala 10x menor como
// ponto de partida, ajustável). Exclusivo-japonês: corte mais alto, à parte
// (pacote7, item 1b) — escala inicial 3x o corte ocidental do SNES.
const CORTES_ATUAIS = [5, 10, 20, 50];
const CORTES_SNES_OCIDENTAL = [3, 5, 10, 20];
const CORTES_SNES_JAPONES = [10, 20, 40, 80];

// Categoria IGDB (campo "category" do endpoint games): 0 main_game,
// 8 remake, 9 remaster são os únicos aceitos (pacote7, item 1 — "só jogos
// principais e remakes/remasters"). Ficam de fora, explicitamente: 1
// dlc_addon, 2 expansion, 3 bundle, 4 standalone_expansion, 5 mod, 6
// episode, 7 season, 13 pack, 14 update (tudo que o pacote pediu pra
// excluir, nomeado). NÃO mencionados pelo pacote e tratados como excluídos
// por padrão (mais perto de "jogo principal" que de shovelware, mas
// ambíguos sem o dono decidir): 10 expanded_game, 11 port, 12 fork — se
// algum desses fizer falta na amostra (ex. porte relevante faltando),
// é só acrescentar ao array abaixo.
const CATEGORIAS_PERMITIDAS = [0, 8, 9];

// Sinal de lançamento físico: a IGDB não tem um campo dedicado "físico"
// documentado publicamente (sem acesso à documentação ao vivo neste
// ambiente pra confirmar 100% — ver resumo). Único proxy indireto seria
// cruzar com outra fonte (ex. um dataset de GTIN/UPC), fora do escopo desta
// rodada. Critério usado: SÓ popularidade, como o pacote manda fazer
// quando não há sinal confiável ("se não houver sinal confiável,
// documentar e usar só popularidade").
const SINAL_FISICO_DISPONIVEL = false;

// Códigos de região da IGDB (release_dates.region) usados pro split do
// SNES. A IGDB não tem um código de região específico pro Brasil — carta
// brasileira de SNES era predominantemente NTSC-US (Playtronic licenciava
// os EUA), então "lançado no Brasil" não é distinguível via IGDB e não
// afeta esta classificação (a região vira atributo da OFERTA, não do
// jogo — pacote7, item 1b — então essa ausência não bloqueia nada aqui).
const REGIAO_JAPAO = 5;
const REGIOES_OCIDENTE = new Set([1, 2, 3, 4, 8]); // Europe, North America, Australia, New Zealand, Worldwide

// ---------- rate limit (IGDB: ~4 req/s por client_id) ----------
const RATE_DELAY_MS = 300; // ~3.3 req/s, com margem — sem paralelismo.
let lastRequestAt = 0;
async function throttle() {
  const wait = RATE_DELAY_MS - (Date.now() - lastRequestAt);
  if (wait > 0) await new Promise(r => setTimeout(r, wait));
  lastRequestAt = Date.now();
}

// ---------- autenticação (client_credentials, mesmo fluxo de lib/igdb.js) ----------
let tokenCache = null;
async function getToken() {
  if (tokenCache) return tokenCache;
  const params = new URLSearchParams({
    client_id: process.env.TWITCH_CLIENT_ID,
    client_secret: process.env.TWITCH_CLIENT_SECRET,
    grant_type: 'client_credentials',
  });
  const res = await fetch(`https://id.twitch.tv/oauth2/token?${params}`, { method: 'POST' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.access_token) {
    throw new Error(`Falha ao autenticar na Twitch: ${res.status} ${data?.message || ''}`);
  }
  tokenCache = data.access_token;
  return tokenCache;
}

async function igdbQuery(endpoint, body) {
  await throttle();
  const token = await getToken();
  const res = await fetch(`https://api.igdb.com/v4/${endpoint}`, {
    method: 'POST',
    headers: {
      'Client-ID': process.env.TWITCH_CLIENT_ID,
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
    body,
  });
  const data = await res.json().catch(() => []);
  if (!res.ok) throw new Error(`IGDB ${endpoint} falhou: ${res.status} ${JSON.stringify(data).slice(0, 300)}`);
  return Array.isArray(data) ? data : [];
}

// Varre TODOS os jogos de uma plataforma + categorias permitidas, paginando
// (limite 500 por página, o máximo da IGDB v4). Campos: popularidade
// (total_rating_count = críticas+usuários; hypes = "quero jogar" pré-
// lançamento, usado como sinal secundário pra jogo recém-anunciado que
// ainda não tem avaliação) + ano + nome. release_dates.region só pedido
// pra plataformas que precisam do split ocidental/japonês (SNES).
async function fetchAllForPlatform(igdbId, { comRegiao } = {}) {
  const fields = ['id', 'name', 'first_release_date', 'total_rating_count', 'hypes', 'category'];
  if (comRegiao) fields.push('release_dates.region');
  const categoriasWhere = `category = (${CATEGORIAS_PERMITIDAS.join(',')})`;
  const out = [];
  let offset = 0;
  const limit = 500;
  for (;;) {
    const body = `fields ${fields.join(',')}; where platforms = (${igdbId}) & ${categoriasWhere}; limit ${limit}; offset ${offset}; sort id asc;`;
    const page = await igdbQuery('games', body);
    out.push(...page);
    if (page.length < limit) break;
    offset += limit;
  }
  return out;
}

function popularidade(game) {
  const ratingCount = Number(game.total_rating_count) || 0;
  const hypes = Number(game.hypes) || 0;
  return Math.max(ratingCount, hypes);
}
function anoOf(game) {
  if (!game.first_release_date) return null;
  return new Date(Number(game.first_release_date) * 1000).getUTCFullYear();
}
function isJapaoExclusivo(game) {
  const regions = (game.release_dates || []).map(rd => rd.region).filter(Boolean);
  if (!regions.length) return false; // sem dado de região -> trata como ocidental (conservador: não exclui por falta de dado)
  const temOcidental = regions.some(r => REGIOES_OCIDENTE.has(r));
  const temJapao = regions.includes(REGIAO_JAPAO);
  return temJapao && !temOcidental;
}

// ---------- dados simulados (sem rede pra IGDB neste ambiente) ----------
// Gera um conjunto fake, mas com uma distribuição de popularidade plausível
// (muitos jogos de baixa avaliação, poucos de alta — como na IGDB de
// verdade), só pra validar a lógica de corte/relatório abaixo. Nunca usado
// se TWITCH_CLIENT_ID/SECRET estiverem configurados (ou seja, nunca na
// Action de verdade) — rotulado como SIMULADO no relatório.
function gerarSimulado(seedBase, n, { comRegiao } = {}) {
  let seed = seedBase;
  function rand() { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; }
  const nomes = ['Quest', 'Legends', 'Chronicles', 'Saga', 'Arena', 'Odyssey', 'Tactics', 'Heroes', 'Shadows', 'Empire'];
  const out = [];
  for (let i = 0; i < n; i++) {
    // distribuição em cauda longa: poucos jogos populares, muitos obscuros
    const popularidadeFake = Math.round(Math.pow(rand(), 4) * 400);
    const ano = 2016 + Math.floor(rand() * 10);
    const game = {
      id: seedBase * 100000 + i,
      name: `${nomes[i % nomes.length]} ${Math.floor(i / nomes.length) + 1} (simulado)`,
      first_release_date: Math.floor(new Date(`${ano}-06-15`).getTime() / 1000),
      total_rating_count: popularidadeFake,
      hypes: Math.round(popularidadeFake * 0.1),
      category: [0, 0, 0, 8, 9][i % 5],
    };
    if (comRegiao) {
      // ~12% exclusivos do Japão (aproximação pra teste de formato, não um dado real)
      game.release_dates = rand() < 0.12
        ? [{ region: REGIAO_JAPAO }]
        : [{ region: REGIOES_OCIDENTE.has(2) ? 2 : 1 }, { region: REGIAO_JAPAO }];
    }
    out.push(game);
  }
  return out;
}

// ---------- amostragem: contagem por corte + exemplos perto da borda ----------
function amostrarCortes(games, cortes) {
  const porCorte = cortes.map(corte => {
    const passam = games.filter(g => popularidade(g) >= corte);
    return { corte, total: passam.length };
  });
  // Exemplos perto de CADA corte: joga de popularidade dentro de [corte, corte*2.5),
  // ordena aleatoriamente (shuffle determinístico simples) e pega até 8 por
  // corte -- com 4 cortes dá até ~30 no total, perto da borda de cada um
  // (pedido do pacote: "30 exemplos sorteados perto de cada corte").
  const exemplosPorCorte = cortes.map(corte => {
    const faixa = games.filter(g => popularidade(g) >= corte && popularidade(g) < corte * 2.5);
    const embaralhados = [...faixa].sort((a, b) => (a.id * 2654435761 % 2147483647) - (b.id * 2654435761 % 2147483647));
    return {
      corte,
      exemplos: embaralhados.slice(0, 8).map(g => ({ nome: g.name, ano: anoOf(g), popularidade: popularidade(g) })),
    };
  });
  return { porCorte, exemplosPorCorte };
}

function tabelaCortes(porCorte) {
  return porCorte.map(c => `| ${c.corte}+ | ${c.total} |`).join('\n');
}
function listaExemplos(exemplosPorCorte) {
  return exemplosPorCorte.map(({ corte, exemplos }) => {
    if (!exemplos.length) return `**Corte ${corte}+**: nenhum exemplo nessa faixa.`;
    const linhas = exemplos.map(e => `  - ${e.nome} (${e.ano ?? 's/ data'}) — popularidade ${e.popularidade}`).join('\n');
    return `**Corte ${corte}+** (exemplos perto da borda):\n${linhas}`;
  }).join('\n\n');
}

async function rodarAmostra() {
  const linhas = [];
  linhas.push('# Importação IGDB — modo amostra');
  linhas.push('');
  linhas.push(`Gerado em ${new Date().toISOString()}${SIMULAR ? ' — **DADOS SIMULADOS** (sem TWITCH_CLIENT_ID/SECRET neste run; usado só pra validar o formato do relatório, não reflete a IGDB de verdade)' : ' com dados reais da IGDB.'}`);
  linhas.push('');
  linhas.push('Nenhum jogo foi gravado no catálogo — este modo só mede. Escolha um corte vendo os nomes');
  linhas.push('reais abaixo e peça o modo completo com `corte=<valor>` pra aplicar de verdade.');
  linhas.push('');
  linhas.push('## Filtro aplicado');
  linhas.push(`- Categorias IGDB aceitas: ${CATEGORIAS_PERMITIDAS.join(', ')} (0 jogo principal, 8 remake, 9 remaster). Excluídos: DLC, expansão, bundle, mod, episódio, temporada, pacote, atualização — e, por ambiguidade não resolvida pelo pacote, port/expanded_game/fork.`);
  linhas.push(`- Popularidade = maior valor entre \`total_rating_count\` (avaliações) e \`hypes\` (quero-jogar pré-lançamento).`);
  linhas.push(`- Sinal de lançamento físico: **não há campo confiável documentado na IGDB pra isso** (não confirmado ao vivo neste ambiente) — critério é só popularidade, como o pacote prevê pra esse caso.`);
  linhas.push('');

  for (const plat of PLATFORMS_ATUAIS) {
    log(`varrendo ${plat.nome} (igdbId=${plat.igdbId})...`);
    const games = SIMULAR
      ? gerarSimulado(plat.igdbId, 600)
      : await fetchAllForPlatform(plat.igdbId);
    log(`${plat.nome}: ${games.length} jogos (categoria principal/remake/remaster) antes do corte de popularidade.`);
    const { porCorte, exemplosPorCorte } = amostrarCortes(games, CORTES_ATUAIS);
    linhas.push(`## ${plat.nome}`);
    linhas.push(`Total após filtro de categoria, antes do corte de popularidade: **${games.length} jogos**.`);
    linhas.push('');
    linhas.push('| Corte (popularidade mínima) | Jogos que entrariam |');
    linhas.push('| --- | --- |');
    linhas.push(tabelaCortes(porCorte));
    linhas.push('');
    linhas.push(listaExemplos(exemplosPorCorte));
    linhas.push('');
  }

  log(`varrendo ${SNES.nome} (igdbId=${SNES.igdbId})...`);
  const snesGames = SIMULAR
    ? gerarSimulado(SNES.igdbId, 800, { comRegiao: true })
    : await fetchAllForPlatform(SNES.igdbId, { comRegiao: true });
  const snesOcidental = snesGames.filter(g => !isJapaoExclusivo(g));
  const snesJapones = snesGames.filter(g => isJapaoExclusivo(g));
  log(`${SNES.nome}: ${snesGames.length} jogos totais (${snesOcidental.length} ocidentais, ${snesJapones.length} exclusivos do Japão).`);

  linhas.push(`## ${SNES.nome} (retrô — regras próprias, pacote7 item 1b)`);
  linhas.push('Cartucho de SNES é sempre físico — o filtro aqui é só popularidade, com corte PRÓPRIO,');
  linhas.push('separado do das plataformas atuais. Região não divide o jogo em dois (é atributo da');
  linhas.push('OFERTA), mas exclusivo-do-Japão usa um corte mais alto (lista de retrô colecionável');
  linhas.push('japonesa é enorme — corte baixo traria volume demais pro catálogo).');
  linhas.push('');
  linhas.push(`### Ocidental (lançado na América do Norte, Europa ou Brasil) — ${snesOcidental.length} candidatos`);
  linhas.push('| Corte | Jogos que entrariam |');
  linhas.push('| --- | --- |');
  const ocAmostra = amostrarCortes(snesOcidental, CORTES_SNES_OCIDENTAL);
  linhas.push(tabelaCortes(ocAmostra.porCorte));
  linhas.push('');
  linhas.push(listaExemplos(ocAmostra.exemplosPorCorte));
  linhas.push('');
  linhas.push(`### Exclusivo do Japão (Super Famicom, sem lançamento ocidental) — ${snesJapones.length} candidatos, corte separado e mais alto`);
  linhas.push('| Corte | Jogos que entrariam |');
  linhas.push('| --- | --- |');
  const jpAmostra = amostrarCortes(snesJapones, CORTES_SNES_JAPONES);
  linhas.push(tabelaCortes(jpAmostra.porCorte));
  linhas.push('');
  linhas.push(listaExemplos(jpAmostra.exemplosPorCorte));
  linhas.push('');

  const outPath = path.join(ROOT, 'docs', 'importacao-amostra.md');
  fs.writeFileSync(outPath, linhas.join('\n') + '\n');
  log(`docs/importacao-amostra.md gerado (${SIMULAR ? 'SIMULADO' : 'dados reais da IGDB'}).`);
}

async function rodarCompleto() {
  // pacote7, itens 2-4 (importação completa + mescla + universos
  // automáticos): AINDA NÃO IMPLEMENTADO nesta rodada — ver resumo/commit.
  // Fica aqui o ponto de entrada já ligado ao "modo" da Action, pra quando
  // for implementado não precisar mexer no workflow de novo.
  log('MODO COMPLETO ainda não implementado (pacote7, itens 2-4) — nenhuma ação tomada.');
  log(`corte recebido: ${CORTE ?? '(nenhum)'}`);
  process.exitCode = 1;
}

if (MODO === 'completo') await rodarCompleto();
else await rodarAmostra();
