INVENTÁRIO GAMER — v0.9

O que esta versão faz
- Mantém a home v0.8: Em destaque agora + 10 franquias Nintendo + 10 PlayStation + multiplataforma/retro.
- Resultados continuam no layout em lista.
- /api/offers agora consulta duas fontes físicas em paralelo:
  1) Mercado Livre (Brasil)
  2) eBay (importado)
- O modal também oferece busca externa em OLX e Enjoei, mas NÃO coleta preço dessas plataformas automaticamente.
- A área digital reúne Nintendo Store, PlayStation Store e Nuuvem. Enquanto não houver feed/API autorizado, o site abre as lojas oficiais sem inventar preços.

Arquivos para subir na raiz do GitHub
- index.html
- api.js
- vercel.json
- inventario-icon.jpg
- env.example (opcional, sem segredos)

Credenciais
Nunca coloque Client Secret ou Access Token no GitHub.
Use Vercel > Project Settings > Environment Variables.

EBAY_CLIENT_ID
EBAY_CLIENT_SECRET
EBAY_ENV=production
EBAY_MARKETPLACE_ID=EBAY_US
MELI_ACCESS_TOKEN

Estado das integrações (21/09/2026)
- eBay: Browse API oficial. Produção exige credenciais e elegibilidade/aprovação para Buy APIs.
- Mercado Livre: API oficial usa OAuth/access token; a documentação atual recomenda enviar access token nas chamadas.
- OLX: a API pública documentada é voltada à gestão/sincronização dos anúncios do próprio anunciante/integrador, não a uma busca pública geral do marketplace para games. Por isso v0.9 só abre a busca externa.
- Enjoei: não foi localizada documentação oficial pública de API de catálogo/busca para esse uso. v0.9 só abre a busca externa.
- Nuuvem: Store API oficial existe, mas está em beta para parceiros selecionados. Quando houver token, o melhor desenho é sincronizar o catálogo e preços para o banco do Inventário e pesquisar localmente.
- Nintendo Store / PlayStation Store: links oficiais entram agora; automatização de preços fica pendente de feed/API autorizado em vez de scraping frágil.

Próxima etapa recomendada
1. Criar/regularizar as contas developer de eBay e Mercado Livre.
2. Colocar as credenciais no Vercel.
3. Testar /api/offers?q=sonic+adventure+2+dreamcast+usado+original.
4. Implementar renovação segura do token do Mercado Livre e cache/banco para snapshots de preço.
5. Solicitar acesso de parceiro à API da Nuuvem.
