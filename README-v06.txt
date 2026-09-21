Inventário Gamer v0.6

Arquivos para o repositório:
- index.html: interface v0.6
- api.js: endpoint /api/offers para ofertas reais do eBay
- vercel.json: rotas/build do Vercel
- .env.example: nomes das variáveis (NÃO coloque chaves reais no GitHub)

No Vercel, adicione EBAY_CLIENT_ID e EBAY_CLIENT_SECRET em Settings > Environment Variables.
Para dados reais, o eBay exige credenciais de produção e aprovação para Buy APIs.
Sem as chaves, a interface continua funcionando e não inventa preços: exibe links externos de busca.
