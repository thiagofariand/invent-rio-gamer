Inventário Gamer v0.96.2 — correção do protótipo Gemini

Principais correções:
- Todos os preços/ofertas demonstrativos estão explicitamente marcados como DEMO.
- Removida a ideia de "anúncio verificado" em dados mock.
- Página de produto agora monta Novo/Usado/Digital/Fan-made dinamicamente por item.
- Filtro por categoria usa o campo category, não busca textual no título.
- Filtros de condição e plataforma funcionam sobre o catálogo demonstrativo.
- openProduct() agora falha com segurança quando o ID não existe.
- Modal de ofertas lê as ofertas do item selecionado e desabilita o botão de saída enquanto forem mocks.
- Meu Inventário usa localStorage e contagens reais dos itens salvos neste navegador.
- Autocomplete continua 100% local e não dispara API por tecla.

Observação:
Esta versão ainda usa Tailwind via CDN porque é um protótipo estático. Para produção, migrar Tailwind para build ou substituir por CSS compilado.

Substituição:
Use index.html no lugar do index atual. O arquivo /inventario-icon.jpg continua sendo reutilizado do projeto existente.
