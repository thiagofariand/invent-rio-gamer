#!/usr/bin/env node
// pacote7b, item 5 — faxina diária das ofertas de merch (src/data/merch.json).
//
// Roda numa GitHub Action agendada (1x/dia, plano Hobby — CLAUDE.md "cron
// só 1x/dia") e também manual (workflow_dispatch). SEM IA: só HTTP simples
// em cada URL de oferta, com espera entre lojas pra não parecer robô.
//
// Escopo: só src/data/merch.json (schema já tem atualizadoEm/pecaUnica,
// pacote7b/CLAUDE.md "Merch"). lib/shopee-manual-offers.js (preço de JOGO,
// schema diferente — JS com objeto literal, não JSON) fica de fora desta
// rodada: editar esse arquivo automaticamente (regex em cima de JS) é
// arriscado demais pra faxina sem supervisão — ver docs/faxina-relatorio.md
// e CLAUDE.md pra essa decisão documentada.
//
// Nunca apaga oferta nenhuma — só grava um campo `estado` (null/ausente =
// visível, 'oculto-quebrado' | 'oculto-pecaunica' = oculta). Uma vez oculta
// por estar quebrada ou por pecaUnica vencida, fica oculta até o dono
// revisar à mão (removendo o campo `estado`) — o script nunca desoculta
// sozinho, mesmo que o link volte a responder.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const MERCH_PATH = path.join(ROOT, 'src', 'data', 'merch.json');

function arg(name, fallback) {
  const flag = `--${name}=`;
  const found = process.argv.find(a => a.startsWith(flag));
  if (found) return found.slice(flag.length);
  if (process.argv.includes(`--${name}`)) return true;
  const envKey = name.toUpperCase();
  if (process.env[envKey] !== undefined && process.env[envKey] !== '') return process.env[envKey];
  return fallback;
}
const SIMULAR = !!arg('simular', false) || process.env.SIMULAR === '1';
const PECA_UNICA_DIAS = 14;
const ESPERA_ENTRE_LOJAS_MS = 1200; // "espera entre lojas" (pacote7b, item 5)

function log(msg) { console.log(`[faxina-ofertas] ${msg}`); }

// Mercado Livre bloqueia requisição simples de robô com frequência (403/429)
// mesmo pra anúncio que existe de verdade — pacote7b item 5 é explícito:
// "comum no Mercado Livre: NÃO tratar como quebrado". Outras lojas também
// podem bloquear; a regra de "não verificável" vale pra qualquer uma (403/
// 429/bloqueio), só o aviso no relatório cita Mercado Livre por nome porque
// foi o caso citado no pacote.
function lojaDoUrl(url) {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return 'desconhecida'; }
}

async function checarUrl(url) {
  if (SIMULAR) {
    // Determinístico (hash simples do próprio URL) só pra validar o
    // formato do relatório sem rede — nunca usado na Action de verdade.
    let h = 0; for (const c of url) h = (h * 31 + c.charCodeAt(0)) | 0;
    const r = Math.abs(h) % 10;
    if (r === 0) return { status: 'quebrado', http: 404 };
    if (r === 1) return { status: 'nao-verificavel', http: 403 };
    return { status: 'ok', http: 200 };
  }
  try {
    const res = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; InventarioGamerFaxina/1.0)' },
      signal: AbortSignal.timeout(15000),
    });
    if (res.status === 404 || res.status === 410) return { status: 'quebrado', http: res.status };
    if (res.status === 403 || res.status === 429) return { status: 'nao-verificavel', http: res.status };
    if (res.status >= 500) return { status: 'nao-verificavel', http: res.status };
    if (res.ok) return { status: 'ok', http: res.status };
    return { status: 'nao-verificavel', http: res.status };
  } catch (e) {
    // timeout, DNS, TLS etc. — não dá pra afirmar que o anúncio morreu,
    // só que não deu pra confirmar agora.
    return { status: 'nao-verificavel', http: null, erro: String(e.message || e) };
  }
}

function diasDesde(iso) {
  if (!iso) return null;
  const then = new Date(iso + 'T00:00:00').getTime();
  if (Number.isNaN(then)) return null;
  return Math.floor((Date.now() - then) / 86400000);
}

// Serializa UMA linha por item (igual ao arquivo original) em vez de
// JSON.stringify(...,null,2) — senão o diff da PR reformataria as 37
// linhas inteiras do arquivo (identado em várias linhas) em vez de só
// mostrar os campos `estado` novos. Nota: JS não distingue 1141 de
// 1141.0 — um número inteiro escrito como "899.0" no original volta como
// "899" depois do parse+stringify (cosmético, nunca muda o valor).
function serializeMerch(merch) {
  return '[\n  ' + merch.map(it => JSON.stringify(it)).join(',\n  ') + '\n]\n';
}

async function rodar() {
  const merch = JSON.parse(fs.readFileSync(MERCH_PATH, 'utf8'));
  const lastCheckByLoja = new Map();

  const linhas = [];
  linhas.push('# Faxina diária das ofertas');
  linhas.push('');
  linhas.push(`Gerado em ${new Date().toISOString()}${SIMULAR ? ' — **DADOS SIMULADOS** (sem rede de verdade neste run; só valida o formato do relatório).' : '.'}`);
  linhas.push('');
  linhas.push('Verifica cada URL de oferta de `src/data/merch.json` (requisição simples, sem IA, com espera entre lojas).');
  linhas.push('Nunca apaga oferta — só marca como oculta (`estado`), revertido manualmente pelo dono quando ele revisar.');
  linhas.push('');
  linhas.push('**Fora do escopo desta faxina**: `lib/shopee-manual-offers.js` (preço de jogo, schema em JS, não JSON — editar');
  linhas.push('isso automaticamente sem supervisão é arriscado demais; ver CLAUDE.md).');
  linhas.push('');

  const ocultadasAgora = [];
  const quebradas = [];
  const naoVerificaveis = [];
  let okCount = 0, jaOcultasCount = 0, verificadas = 0;

  for (const it of merch) {
    if (!Array.isArray(it.ofertas)) continue;
    for (const o of it.ofertas) {
      if (o.estado) { jaOcultasCount++; continue; }

      // Regra do pacote: pecaUnica + atualizadoEm > 14 dias -> oculta,
      // SEM precisar checar a URL (é só conta de data).
      const dias = diasDesde(o.atualizadoEm);
      if (o.pecaUnica && dias != null && dias > PECA_UNICA_DIAS) {
        o.estado = 'oculto-pecaunica';
        ocultadasAgora.push({ titulo: it.titulo, loja: o.loja, motivo: `pecaUnica + ${dias} dias sem atualizar`, url: o.url });
        continue;
      }

      const loja = lojaDoUrl(o.url);
      const last = lastCheckByLoja.get(loja) || 0;
      const wait = ESPERA_ENTRE_LOJAS_MS - (Date.now() - last);
      if (wait > 0) await new Promise(r => setTimeout(r, wait));
      lastCheckByLoja.set(loja, Date.now());

      const r = await checarUrl(o.url);
      verificadas++;
      log(`${it.titulo} · ${o.loja} (${loja}): ${r.status}${r.http ? ' ' + r.http : ''}`);

      if (r.status === 'quebrado') {
        o.estado = 'oculto-quebrado';
        quebradas.push({ titulo: it.titulo, loja: o.loja, http: r.http, url: o.url });
      } else if (r.status === 'nao-verificavel') {
        naoVerificaveis.push({ titulo: it.titulo, loja: o.loja, http: r.http, erro: r.erro || null, url: o.url, mercadoLivre: loja.includes('mercadolivre') || loja.includes('mercadolibre') });
      } else {
        okCount++;
      }
    }
  }

  linhas.push('## Resumo');
  linhas.push(`- Ofertas verificadas nesta execução: **${verificadas}**`);
  linhas.push(`- OK: **${okCount}**`);
  linhas.push(`- Quebradas agora (viram ocultas): **${quebradas.length}**`);
  linhas.push(`- Não verificáveis (403/429/timeout — ficam visíveis, não contam como quebradas): **${naoVerificaveis.length}**`);
  linhas.push(`- Ocultadas agora por pecaUnica vencida (>${PECA_UNICA_DIAS} dias sem atualizar): **${ocultadasAgora.length}**`);
  linhas.push(`- Já estavam ocultas (não re-verificadas, aguardando revisão do dono): **${jaOcultasCount}**`);
  linhas.push('');

  if (quebradas.length) {
    linhas.push('## Quebradas (404/410) — ocultadas agora');
    quebradas.forEach(q => linhas.push(`- **${q.titulo}** · ${q.loja} (HTTP ${q.http}) — ${q.url}`));
    linhas.push('');
  }
  if (ocultadasAgora.length) {
    linhas.push('## Ocultadas por pecaUnica vencida');
    ocultadasAgora.forEach(q => linhas.push(`- **${q.titulo}** · ${q.loja} — ${q.motivo} — ${q.url}`));
    linhas.push('');
  }
  if (naoVerificaveis.length) {
    linhas.push('## Não verificáveis (continuam visíveis)');
    naoVerificaveis.forEach(q => linhas.push(`- **${q.titulo}** · ${q.loja}${q.mercadoLivre ? ' (Mercado Livre — bloqueio de robô é comum, não indica anúncio quebrado)' : ''} — ${q.http ? 'HTTP ' + q.http : q.erro || 'sem resposta'} — ${q.url}`));
    linhas.push('');
  }

  const outPath = path.join(ROOT, 'docs', 'faxina-relatorio.md');
  fs.writeFileSync(outPath, linhas.join('\n') + '\n');
  log(`docs/faxina-relatorio.md gerado.`);

  const mudou = ocultadasAgora.length > 0 || quebradas.length > 0;
  if (mudou) {
    fs.writeFileSync(MERCH_PATH, serializeMerch(merch));
    log(`src/data/merch.json atualizado (${ocultadasAgora.length + quebradas.length} oferta(s) ocultada(s) agora).`);
  } else {
    log('Nenhuma oferta nova pra ocultar — merch.json não mudou.');
  }
}

await rodar();
