PACOTE 6 — LANÇAMENTO TÉCNICO (branch claude/pacote5-final, PR #4)

COMO TRABALHAR
- Base: a branch do PR #4 com o teste de merch parte 2 aplicado. Um commit por item ("pacote6 N: ..."), com prints. Se o limite apertar, pare no FIM de um item, faça commit/push e liste o que falta.
- NÃO criar functions novas no Vercel (plano Hobby). Tudo que for gerado (páginas estáticas, sitemap) é feito no BUILD.
- Todas as regras fixas continuam valendo, com a mudança do item 2 (preço único).

1. HERO ADAPTATIVO COMPLETO
- Home: aplicar as camadas 1 (fundo desfocado) e 2 (arte nítida em proporção natural, borda dissolvendo no fundo) que faltaram; hoje só a película entrou.
- Universo: o hero da página de universo é outro componente (card grande + painel "Meu Inventário" ao lado). Manter esse layout, mas trocar o miolo da ARTE do card pelo mesmo componente de três camadas (extrair a parte da arte para um componente reaproveitável, sem duplicar lógica).
- Verificação de contraste no ambiente real: criar um modo de depuração ativado só por ?debug=contraste que mede, no navegador, o contraste do título e do botão do hero sobre a película (amostrando os pixels atrás do texto) e mostra o valor num canto da tela. Assim eu confiro no preview com imagens reais. Sem o parâmetro, nada aparece. Documentar no CLAUDE.md.

2. PREÇO ÚNICO (muda a regra fixa "cada condição com o seu a partir de")
- Nova regra: cards, hero, listas e página do jogo mostram UM preço, o menor entre todas as condições e formatos, com a condição escrita em texto pequeno ao lado: "a partir de R$ 194,90 · usado". Preço nunca aparece sem a condição.
- Página do jogo: o bloco "Comprar este jogo" com caixas por condição (Novo / Usado / Download) vira: preço principal (como acima) + botão "Comparar preços ({N} ofertas) →" que abre a página de comparativo. Seletor de plataforma continua no bloco.
- Página de comparativo: é o ÚNICO lugar com separação por Novo / Usado / Digital (filtros que já existem). Condição sem oferta não aparece (nada de "sem ofertas" / "consultar nas lojas").
- Merch: a página do item já é o comparativo; continua agrupando por condição.
- Atualizar a regra no CLAUDE.md.

3. EXEMPLO FORA DE PRODUÇÃO
- Ofertas de demonstração (selo EXEMPLO) continuam aparecendo no localhost e nos previews do Vercel, mas NÃO em produção (detectar pela variável de ambiente do Vercel VERCEL_ENV === "production", injetada no build).
- Jogo sem nenhuma oferta real em produção: no lugar do preço, "Sem ofertas ainda" + botão "Avisar quando tiver" (usa o estado Alerta do inventário que já existe).
- Listar no resumo quantos jogos ficam sem oferta real em produção.

4. ENDEREÇOS LIMPOS + SEO
- Rotas sem # (History API): /jogo/{slug}, /universo/{slug}, /plataforma/{slug}, /item/{id}, /busca, /universos, /merch etc. Endereços antigos com #/ são redirecionados no navegador para o novo formato (sem quebrar links já compartilhados).
- vercel.json: rewrites para a aplicação (sem function).
- Páginas estáticas geradas no build (script em scripts/, rodando no comando de build do Vercel): para cada jogo, universo, plataforma e item de merch, gerar um HTML com o mesmo app, mas com <title>, meta description, link canonical e Open Graph/Twitter (título, descrição, imagem = capa ou arte oficial) já escritos no HTML. Motivo: prévias de WhatsApp/Facebook não executam JavaScript.
- Página sem nenhuma oferta real: meta robots "noindex, follow" (o jogo existe para busca e inventário, mas fica fora do Google até ter a primeira oferta).
- sitemap.xml (só páginas indexáveis) e robots.txt gerados no build; página 404 própria.
- Domínio: usar uma variável SITE_URL para canonical, Open Graph e sitemap (hoje o endereço do Vercel; trocar pelo .com.br depois, sem mexer em código).
- Atualizar o CLAUDE.md (rotas, geração estática, noindex).

5. VERIFICAÇÃO FINAL
- Varredura de links internos quebrados e de links externos com parâmetros de rastreamento (utm, gclid, tag= de terceiros): listar e limpar.
- Lighthouse (desktop e mobile) nas páginas: home, plataforma, universo, jogo, comparativo, item de merch. Corrigir o que for erro de acessibilidade; informar notas de desempenho, acessibilidade, boas práticas e SEO.
- Console sem erros em todas as rotas. Conferir mobile 393x852 em todas.

ENTREGAS
- Prints desktop e mobile: home e universo com o hero novo; página do jogo com o preço único e o botão de comparar; comparativo; um jogo sem oferta em modo produção simulado.
- No resumo: notas do Lighthouse, jogos sem oferta real, rotas criadas, links limpos e itens não feitos com o motivo.
