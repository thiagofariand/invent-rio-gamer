PACOTE 7 — EXPANSÃO DO CATÁLOGO E UNIVERSOS AUTOMÁTICOS (depois do Pacote 6)

COMO TRABALHAR
- Base: a branch com o Pacote 6 aplicado. Um commit por item ("pacote7 N: ..."). Se o limite apertar, pare no FIM de um item, faça commit/push e liste o que falta.
- O sandbox não tem rede para a IGDB: a importação roda numa GitHub Action (workflow manual, workflow_dispatch) usando os segredos do repositório TWITCH_CLIENT_ID e TWITCH_CLIENT_SECRET (eu cadastro em Settings > Secrets and variables > Actions; são as mesmas chaves que o site já usa no Vercel). Escreva o script e o workflow, valide com dados simulados e diga isso no resumo.
- A Action NUNCA altera o catálogo direto na branch: ela gera os arquivos e abre um PR para eu revisar.
- Plataformas desta expansão: Switch, PS4, PS5, Xbox One, Xbox Series X|S e, como TESTE de retrô, Super Nintendo (SNES). Os demais consoles retrô ficam fora por enquanto (se o SNES funcionar bem, os próximos seguem o mesmo modelo).

1. SCRIPT DE IMPORTAÇÃO + MODO AMOSTRA
- scripts/importar-igdb.mjs + .github/workflows/importar-igdb.yml (entrada "modo": amostra | completo; entrada "corte": número).
- Filtro anti-shovelware: só jogos principais e remakes/remasters (excluir DLC, expansões, pacotes, bundles, episódios, temporadas, mods e atualizações) e com popularidade mínima na IGDB (total de avaliações e/ou seguidores/"quero jogar"; escolha os campos disponíveis e documente). Se a IGDB oferecer algum sinal confiável de lançamento físico, usar como critério alternativo de entrada (físico OU popular); se não houver sinal confiável, documentar e usar só popularidade.
- Respeitar o limite de requisições da IGDB (fila com espera; sem paralelismo agressivo).
- Modo amostra: NÃO gera catálogo. Gera docs/importacao-amostra.md com, por plataforma, quantos jogos entrariam com cortes diferentes (ex.: 5, 10, 20, 50 avaliações) e 30 exemplos sorteados perto de cada corte (nome, ano, avaliações), para eu escolher o corte vendo nomes reais.

1b. REGRAS DO SNES (retrô)
- Todo jogo de SNES é físico (cartucho): o filtro é só popularidade, com CORTE PRÓPRIO, separado do das plataformas atuais (o modo amostra mostra os cortes do SNES à parte).
- Região: entram jogos lançados na América do Norte, Europa ou Brasil. Exclusivos do Japão (Super Famicom) só entram acima de um corte mais alto (mostrar esse corte separado na amostra), porque colecionador brasileiro também compra cartucho japonês, mas a lista completa é enorme.
- O mesmo jogo em regiões diferentes é UM jogo no catálogo (capa padrão: a americana; sem ela, a europeia). A região vira atributo da OFERTA, não do jogo: campo regiao na oferta com "Americano", "Europeu", "Japonês" ou "Nacional (Playtronic)". Não criar versões ocultas por região.
- Jogos de SNES que já existem no catálogo (curados) mantêm tudo (mesma regra de mescla do item 2).
- Universos: franquias do SNES entram nas regras do item 3 (ex.: jogos de Donkey Kong Country vão para o universo Donkey Kong já existente).

2. IMPORTAÇÃO COMPLETA (só com o corte que eu escolher)
- Catálogo dividido por plataforma: src/data/jogos/{plataforma}.json, carregado sob demanda, mais um índice leve de busca (src/data/indice-busca.json: slug, nome, apelidos, plataformas, universo). Medir e informar o tamanho de cada arquivo.
- MESCLA, nunca sobrescrita: jogos que já existem mantêm tudo que foi curado (ofertas, bannerFocus, versões ocultas, pré-vendas, textos). Novos jogos entram sem ofertas (páginas noindex, regra do Pacote 6).
- Versões: aplicar a mesma varredura do Pacote 5E aos jogos novos e ACRESCENTAR os grupos candidatos a docs/versoes-candidatas.md (sem agrupar sozinho).
- Slugs únicos e estáveis; colisão de nomes resolvida com sufixo de ano.

3. UNIVERSOS AUTOMÁTICOS
- Fonte: franquia da IGDB (franchises; se o jogo não tiver franquia, usar collection). Uma franquia só vira universo com pelo menos 3 jogos no catálogo; abaixo disso, os jogos ficam avulsos (fora da contagem de universos).
- Universos que já existem (curados) não mudam; jogos novos de uma franquia já existente entram nela (mapear a franquia da IGDB para o slug existente; listar no resumo os mapeamentos feitos).
- Para cada universo novo, a Action calcula: jogo principal (o mais popular), cor da paleta (cor dominante da capa do jogo principal, ajustada para manter contraste 4.5:1 com texto branco), sigla (iniciais, até 3 letras, sem repetir sigla existente). Gravar em paleta-universos.json com "auto": true. Entrada com "auto": false (curada) nunca é alterada pelo script.
- Gerar docs/universos-novos.md: nome, slug, quantidade de jogos, jogo principal, cor (hex), sigla e os 5 jogos mais populares, para eu revisar e trocar o que quiser.
- A lista curada da barra lateral não muda; no diretório de universos, curados primeiro e depois os automáticos em ordem alfabética.

4. DOCUMENTAÇÃO
- CLAUDE.md: como rodar a Action (amostra e completo), filtro, corte escolhido, estrutura do catálogo dividido, regra dos universos automáticos e o campo "auto".

ENTREGAS
- No primeiro retorno: o script, o workflow e um exemplo de docs/importacao-amostra.md gerado com dados simulados (para eu ver o formato). Eu rodo a Action em modo amostra, escolho o corte e peço o modo completo.
- No resumo: quantos jogos de SNES entram em cada corte (ocidentais e exclusivos japoneses separados), campos da IGDB usados no filtro, se há sinal de lançamento físico e itens não feitos com o motivo.
