INVENTÁRIO GAMER — v0.95 (VALIDAÇÃO)

Objetivo desta versão
Testar o fluxo principal antes de construir banco, login ou automações grandes:
1) marcar Tenho / Quero;
2) abrir ofertas nacionais;
3) demonstrar interesse em alerta de preço.

O que mudou em relação à v0.9.3
- Removida a porcentagem geral de “franquia completa”.
- Os inventários mostram contagens simples: Tenho / Quero / Alertas.
- Removido “faltando” como obrigação de completude.
- Adicionado botão “Quero alerta”. Nesta versão ele salva apenas o interesse no navegador e informa claramente que ainda não envia notificações.
- Resultados e atalhos priorizam o mercado brasileiro: Mercado Livre, OLX e Enjoei.
- O endpoint automático da v0.95 consulta apenas Mercado Livre.
- eBay/importação e merch/fan-made ficam no roadmap, fora da validação da V1.
- “Em destaque agora” foi reduzido a itens com links oficiais verificados em 21/09/2026.
- Mantidas seis listas piloto para demonstração: Zelda, Call of Duty, GTA, God of War, Resident Evil e Sonic.

Importante
- Tenho/Quero e Alertas ficam apenas no localStorage do aparelho. Não há login nem envio de dados para servidor.
- O botão de alerta é um teste transparente de intenção: ele NÃO envia notificações ainda.
- As listas são exemplos; não afirmam que o usuário “completou” uma franquia.
- Preços não são inventados. Se a integração não retornar uma oferta válida, o site mostra os atalhos externos.

Arquivos
- index.html
- api.js
- vercel.json
- inventario-icon.jpg
- env.example
- inventories-seed-v095.json
