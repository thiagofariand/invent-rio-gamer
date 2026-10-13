PACOTE 6B — PASTA DE SAÍDA DO BUILD (branch claude/pacote5-final, PR #4)

PROBLEMA
O fix do deploy (outputDirectory: "." no vercel.json) faz o Vercel servir a RAIZ do repositório inteira como site estático. Com isso ficam publicamente acessíveis docs/ (prompts, decisões de produto, rascunho do texto legal, versoes-candidatas.md), CLAUDE.md, scripts/, package.json e qualquer outro arquivo da raiz. Isso não pode ir para produção.

1. BUILD EM PASTA SEPARADA
- scripts/build.js passa a gerar tudo numa pasta dist/ (apagada e recriada a cada build): copia SÓ o que o navegador precisa (index.html, assets, CSS/JS do app, src/data e demais arquivos que o front carrega, ícones, imagens em public/img) e escreve ali as páginas geradas (jogo/, universo/, plataforma/, item/, 404, sitemap.xml, robots.txt).
- Usar uma LISTA DO QUE ENTRA (allowlist), nunca "copiar tudo menos X". Documentar a lista no CLAUDE.md: arquivo novo que o front precise tem que ser acrescentado nela.
- vercel.json: outputDirectory: "dist". As functions em api/ continuam na raiz e devem seguir funcionando (conferir /api/trending no preview).
- dist/ e as páginas geradas ficam no .gitignore. Remover da raiz qualquer página gerada que tenha ficado de builds anteriores.

2. CONFERÊNCIA
- No preview novo, estes endereços têm que dar 404: /CLAUDE.md, /docs/prompt-pacote-6-lancamento.md, /docs/paginas-legais-rascunho.md, /scripts/build.js, /package.json, /vercel.json, /.github/workflows/ (se existir).
- E estes têm que funcionar: home, /jogo/{um slug}, /universo/{um slug}, /plataforma/nintendo, /item/lego-71438-super-mario-world-mario-yoshi, /sitemap.xml, /robots.txt, /api/trending, um endereço antigo com #/ redirecionando.
- Contagem: o build gerou 514 páginas de jogo e o contador do inventário mostra 515 jogos. Explicar a diferença (agrupamento de versões do 5E, jogo sem slug, outro motivo) e deixar os dois números coerentes.

ENTREGAS
- Resumo com o resultado de cada endereço da conferência (status HTTP), a allowlist final e a explicação da contagem.
