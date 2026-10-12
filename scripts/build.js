#!/usr/bin/env node
// pacote6 — script de build do Vercel (sem function nova, plano Hobby:
// tudo que é "gerado" roda aqui, no build, e vira arquivo estático).
//
// item 3: grava src/env-generated.js com a env REAL do Vercel
// (VERCEL_ENV, só existe no servidor de build — nunca chega no
// navegador sozinha) — window.__SITE_ENV__.isProduction é a única forma
// confiável do cliente saber se está em produção de verdade (nem
// localhost, nem preview). mockOn() (app-1-core.js) lê essa flag e
// desliga o modo demonstração (selo EXEMPLO) à força em produção.
//
// item 4: páginas estáticas por jogo/universo/plataforma/item de merch
// (título, meta description, canonical, Open Graph/Twitter já escritos
// no HTML — prévia de WhatsApp/Facebook não executa JavaScript) +
// sitemap.xml + robots.txt + 404.html. Cada página gerada é o MESMO
// index.html (mesmo CSS/JS, o app de verdade assume no navegador) só
// com o bloco <!-- pacote6-seo:start/end --> trocado — nunca uma cópia
// divergente do app.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const vercelEnv = process.env.VERCEL_ENV || 'development'; // 'production' | 'preview' | 'development'
const isProduction = vercelEnv === 'production';
// item 4: domínio pra canonical/OG/sitemap das páginas GERADAS (a home,
// index.html, usa um valor fixo próprio, nunca gerado — ver o arquivo).
// Sem SITE_URL configurada na Vercel, cai no endereço de produção
// conhecido hoje; trocar pelo .com.br é só configurar a env, sem mexer
// em código.
const SITE_URL = (process.env.SITE_URL || 'https://inventario-gamer.vercel.app').replace(/\/+$/, '');

function log(msg) { console.log(`[build] ${msg}`); }

// ---------- item 3: env-generated.js ----------
function writeEnvFile() {
  const content = `// GERADO NO BUILD (scripts/build.js) — não editar à mão.
// VERCEL_ENV no momento do build: ${vercelEnv}
// Fallback neste arquivo (committado): development/isProduction:false,
// pra localhost e qualquer ambiente sem build (ex. este sandbox) sempre
// terem um valor seguro em vez de 404 no <script>.
window.__SITE_ENV__={isProduction:${isProduction}};
`;
  fs.writeFileSync(path.join(ROOT, 'src', 'env-generated.js'), content);
  log(`src/env-generated.js gerado (VERCEL_ENV=${vercelEnv}, isProduction=${isProduction})`);
}

// ---------- item 4: catálogo ----------
// Mesmo algoritmo de norm()/slugify() do app-1-core.js (copiado, não
// importado — app-1-core.js depende do navegador/DOM demais pra rodar
// em Node; catalog-data.js é só dado, carrega limpo com vm).
function norm(s) {
  return String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/['’]/g, '').replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
}
function slugify(s) { return norm(s).replace(/ /g, '-'); }
function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function loadCatalogData() {
  const code = fs.readFileSync(path.join(ROOT, 'catalog-data.js'), 'utf8');
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox, { filename: 'catalog-data.js' });
  return sandbox.window.INV_DATA;
}
function loadMerch() {
  try {
    return JSON.parse(fs.readFileSync(path.join(ROOT, 'src', 'data', 'merch.json'), 'utf8'));
  } catch (e) { return []; }
}

const PLATFORM_LABEL = { nintendo: 'Nintendo', playstation: 'PlayStation', xbox: 'Xbox' };

// D.catalog é um ARRAY achatado ({franchise,title,aliases,variants}),
// sem slug/ano próprios — D.collections (outra estrutura,
// franquia->items[{slug,title,year,platforms}]) é a tabela de ANO por
// TÍTULO EXATO que o app-1-core.js também usa pra achar o slug "oficial"
// quando existe (c.slug), caindo em slugify(título) senão. Mesma conta
// aqui (ver app-1-core.js: "let slug=c?c.slug:slugify(p.title)").
function buildCollectionsIndex(D) {
  const byTitle = new Map();
  Object.values(D.collections || {}).forEach(fr => {
    (fr.items || []).forEach(it => byTitle.set(it.title, it));
  });
  return byTitle;
}
// Mesma regra de "universo só existe com 3+ jogos" do app-1-core.js/
// app-3-views.js (titlesOf(u.slug).length>=3) — aqui contando quantos
// títulos do catalog caem em cada franquia (slugify(p.franchise)).
function collectEntities(D) {
  const collByTitle = buildCollectionsIndex(D);
  const games = [];
  const seenSlugs = new Set();
  const universeCounts = new Map(); // slug -> {name,count}
  (D.catalog || []).forEach(p => {
    const c = collByTitle.get(p.title);
    const slug = c ? c.slug : slugify(p.title);
    const year = c ? c.year : null;
    const uSlug = slugify(p.franchise);
    const platform = (p.variants && p.variants[0] && p.variants[0][1]) || '';
    if (!seenSlugs.has(slug)) {
      seenSlugs.add(slug);
      games.push({ slug, title: p.title, year, platform, universeSlug: uSlug, universeName: p.franchise });
    }
    const cur = universeCounts.get(uSlug) || { name: p.franchise, count: 0 };
    cur.count++;
    universeCounts.set(uSlug, cur);
  });
  const universes = [...universeCounts.entries()]
    .filter(([, v]) => v.count >= 3)
    .map(([slug, v]) => ({ slug, name: v.name, count: v.count }));
  return { games, universes };
}

// ---------- geração de página (mesmo index.html, só troca o bloco SEO) ----------
const SEO_MARKER = /<!--\s*pacote6-seo:start[\s\S]*?pacote6-seo:end\s*-->/;
function renderHeadBlock({ title, description, canonicalPath, ogImage, noindex }) {
  const url = SITE_URL + canonicalPath;
  const robots = noindex ? `<meta name="robots" content="noindex, follow">\n` : '';
  return `<!-- pacote6-seo:start — gerado por scripts/build.js, não editar à mão -->
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${esc(url)}">
${robots}<meta property="og:type" content="website">
<meta property="og:site_name" content="Inventário Gamer">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(url)}">
${ogImage ? `<meta property="og:image" content="${esc(ogImage)}">\n` : ''}<meta name="twitter:card" content="${ogImage ? 'summary_large_image' : 'summary'}">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<!-- pacote6-seo:end -->`;
}
function writeEntityPage(template, relPath, headOpts) {
  if (!SEO_MARKER.test(template)) {
    throw new Error('index.html sem o marcador <!-- pacote6-seo:start/end --> — build cancelado.');
  }
  const html = template.replace(SEO_MARKER, renderHeadBlock(headOpts));
  const outPath = path.join(ROOT, relPath);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, html);
}

function buildPages() {
  const template = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const D = loadCatalogData();
  const merch = loadMerch();
  const { games, universes } = collectEntities(D);
  const sitemapEntries = [{ path: '/', priority: '1.0' }];

  games.forEach(g => {
    const desc = `${g.title}${g.platform ? ` para ${g.platform}` : ''}${g.year ? ` (${g.year})` : ''} — compare preços novo, usado e digital no Inventário Gamer.`;
    // item 4: noindex pra página sem NENHUMA oferta real depende de preço
    // ao vivo (mesma limitação do item 3 — sem rede neste ambiente pra
        // checar o Mercado Livre durante o build); fica como pendência
    // explícita, documentada no CLAUDE.md — toda página de jogo sai
    // indexável por padrão até existir esse sinal.
    writeEntityPage(template, `jogo/${g.slug}.html`, {
      title: `${g.title} — Inventário Gamer`,
      description: desc,
      canonicalPath: `/jogo/${g.slug}`,
      noindex: false,
    });
    sitemapEntries.push({ path: `/jogo/${g.slug}`, priority: '0.8' });
  });

  universes.forEach(u => {
    writeEntityPage(template, `universo/${u.slug}.html`, {
      title: `Universo ${u.name} — Inventário Gamer`,
      description: `${u.count} jogos de ${u.name}: preços, colecionáveis e itens fã-made num só lugar.`,
      canonicalPath: `/universo/${u.slug}`,
      noindex: false,
    });
    sitemapEntries.push({ path: `/universo/${u.slug}`, priority: '0.7' });
  });

  Object.keys(PLATFORM_LABEL).forEach(slug => {
    const label = PLATFORM_LABEL[slug];
    writeEntityPage(template, `plataforma/${slug}.html`, {
      title: `Jogos ${label} — Inventário Gamer`,
      description: `Catálogo ${label}: compare preços de jogos novos, usados e digitais, por console e por universo.`,
      canonicalPath: `/plataforma/${slug}`,
      noindex: false,
    });
    sitemapEntries.push({ path: `/plataforma/${slug}`, priority: '0.7' });
  });

  merch.forEach(it => {
    if (!it || !it.id) return;
    const catLabel = it.categoria || 'colecionável';
    writeEntityPage(template, `item/${it.id}.html`, {
      title: `${it.titulo} — Inventário Gamer`,
      description: `${it.titulo} (${catLabel}) — compare preços e condição antes de comprar.`,
      canonicalPath: `/item/${it.id}`,
      ogImage: it.imagemAutorizada && it.imagem ? SITE_URL.replace(/\/$/, '') + it.imagem : undefined,
      noindex: false,
    });
    sitemapEntries.push({ path: `/item/${it.id}`, priority: '0.5' });
  });

  [
    { path: '/universos', priority: '0.6' },
    { path: '/merch', priority: '0.6' },
    { path: '/busca', priority: '0.3' },
  ].forEach(e => sitemapEntries.push(e));

  log(`${games.length} jogos, ${universes.length} universos (3+ jogos), 3 plataformas, ${merch.length} itens de merch — páginas estáticas geradas.`);
  return sitemapEntries;
}

// ---------- sitemap.xml / robots.txt / 404.html ----------
function writeSitemap(entries) {
  const urls = entries.map(e => `  <url>\n    <loc>${esc(SITE_URL + e.path)}</loc>\n    <priority>${e.priority}</priority>\n  </url>`).join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
  fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), xml);
  log(`sitemap.xml gerado (${entries.length} URLs, SITE_URL=${SITE_URL}).`);
}
function writeRobots() {
  const txt = `User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /painel.html\nSitemap: ${SITE_URL}/sitemap.xml\n`;
  fs.writeFileSync(path.join(ROOT, 'robots.txt'), txt);
  log('robots.txt gerado.');
}
function write404() {
  const out = path.join(ROOT, '404.html');
  if (fs.existsSync(out)) { log('404.html já existe, mantido.'); return; }
  const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, follow">
<title>Página não encontrada — Inventário Gamer</title>
<style>body{font-family:system-ui,sans-serif;background:#17090e;color:#f5efe9;display:flex;min-height:100vh;align-items:center;justify-content:center;text-align:center;padding:24px}main{max-width:420px}h1{font-size:28px;margin-bottom:8px}p{color:#cbb9b2;margin-bottom:20px}a{color:#fff;background:#e64236;padding:10px 20px;border-radius:999px;text-decoration:none;font-weight:600}</style>
</head>
<body><main><h1>Essa página não existe</h1><p>O item que você procura pode ter mudado de endereço ou saído do catálogo.</p><a href="/">Voltar ao início</a></main></body>
</html>
`;
  fs.writeFileSync(out, html);
  log('404.html gerado.');
}

writeEnvFile();
const sitemapEntries = buildPages();
writeSitemap(sitemapEntries);
writeRobots();
write404();
