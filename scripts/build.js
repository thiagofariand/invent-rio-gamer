#!/usr/bin/env node
// pacote6 — script de build do Vercel (sem function nova, plano Hobby:
// tudo que é "gerado" roda aqui, no build, e vira arquivo estático).
//
// item 3: grava src/env-generated.js com a env REAL do Vercel
// (VERCEL_ENV, só existe no servidor de build — nunca chega no
// navegador sozinha) — window.__SITE_ENV__.isProduction é a única forma
// confiável do cliente saber se está em produção de verdade (nem
// localhost, nem preview). mockOn() (app-1-core.js) lê essa flag e
// desliga o modo demonstração (selo EXEMPLO) à força em produção,
// mesmo que o toggle manual (localStorage) diga outra coisa.
//
// item 4 (páginas estáticas por jogo/universo/plataforma/item de merch,
// sitemap.xml, robots.txt) entra neste mesmo script, mais adiante.
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const vercelEnv = process.env.VERCEL_ENV || 'development'; // 'production' | 'preview' | 'development'
const isProduction = vercelEnv === 'production';

function writeEnvFile() {
  const content = `// GERADO NO BUILD (scripts/build.js) — não editar à mão.
// VERCEL_ENV no momento do build: ${vercelEnv}
// Fallback neste arquivo (committado): development/isProduction:false,
// pra localhost e qualquer ambiente sem build (ex. este sandbox) sempre
// terem um valor seguro em vez de 404 no <script>.
window.__SITE_ENV__={isProduction:${isProduction}};
`;
  fs.writeFileSync(path.join(ROOT, 'src', 'env-generated.js'), content);
  console.log(`[build] src/env-generated.js gerado (VERCEL_ENV=${vercelEnv}, isProduction=${isProduction})`);
}

writeEnvFile();
