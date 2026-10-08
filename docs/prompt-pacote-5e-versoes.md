PACOTE 5E — LADRILHO "VER TODOS OS UNIVERSOS" E VERSÕES OCULTAS (branch Teste-novo-layout)
COMO TRABALHAR

* Base: a branch com o Pacote 5D aplicado. Um commit por item ("pacote5e N: ..."), com print desktop 1440x770 antes/depois. Se o limite apertar, pare no FIM de um item, faça commit/push e liste o que falta.
* Todas as regras fixas dos Pacotes 5 a 5D continuam valendo. Sem rede para a IGDB: trabalhar com os dados do catálogo e dizer isso no resumo.

1. PÁGINA DE PLATAFORMA: O RÓTULO VAI PARA O LADRILHO

* Quando existe o ladrilho "Ver todos" (mais de 6 universos): remover o rótulo "Universos {plataforma}" de cima da fileira. O ladrilho passa a dizer "Ver todos os universos →" (13px/500, quebrando em até 2 linhas como os nomes dos universos) e, embaixo, "{N} no total" (11px --text-2). aria-label: "Ver todos os {N} universos {plataforma}".
* Quando NÃO existe o ladrilho (6 universos ou menos): o rótulo volta como link "Universos {plataforma} →", como na home.
* Home: não muda.

2. LADRILHO SEM CAPA (conferência) No print de validação sem imagens, os ladrilhos sem capa mostram a sigla AO LADO do nome. Regra do Pacote 5: sem capa válida, a sigla (28px) fica CENTRALIZADA no lugar da capa, acima do nome, e o espaçamento simétrico do 5B continua valendo. Corrigir se estiver diferente.
3. VERSÕES OCULTAS (HD, 3D, Remaster, Deluxe etc.) Problema: versões do mesmo jogo aparecem como jogos separados e com a mesma capa (ex.: The Legend of Zelda: Majora's Mask e Majora's Mask 3D; Twilight Princess e Twilight Princess HD). Regra: no site existe UMA obra (nome sem o sufixo de versão). Cada plataforma da obra aponta para a sua VERSÃO OCULTA, com nome completo, ID da IGDB, capa, ano e ofertas próprios. Trocar a plataforma troca a capa, o ano e as ofertas.

3.1 Dados

* Criar src/data/versoes.json: obra (slug) -> lista de versões { plataformas[] , nome_completo, igdb_id, ano, tipo (original | hd | 3d | remaster | deluxe | definitive | edition | port) }. A capa de cada versão vem do igdb_id dela, nunca de busca pelo nome.
* Remake (jogo refeito do zero, ex.: The Legend of Zelda: Ocarina of Time de 2026) NÃO entra como versão: continua obra separada, com o campo remake_de apontando para a obra original (link "Remake de {obra}" na página do jogo).

3.2 Varredura (sem agrupar nada sozinho)

* Procurar no catálogo pares/grupos candidatos: mesmo nome-base depois de remover sufixos como HD, 3D, Remastered, Remaster, Deluxe, Definitive Edition, Complete Edition, Nintendo Switch 2 Edition, Director's Cut, Royal, Golden, e variações de pontuação ("-", ":", "(...)").
* Gerar docs/versoes-candidatas.md com uma tabela por grupo: nome de cada entrada, plataformas, ano, ID atual e a sugestão (versão da mesma obra | remake separado | não é a mesma obra). NÃO alterar o catálogo com base na varredura: eu reviso a tabela e devolvo confirmada. Nesta etapa, aplicar o agrupamento SÓ aos dois exemplos confirmados abaixo, para validar a interface:
   * Majora's Mask: Nintendo 64 (original, 2000) + 3DS (Majora's Mask 3D, 2015).
   * Twilight Princess: GameCube e Wii (original, 2006) + Wii U (Twilight Princess HD, 2016).

3.3 Interface

* Listas e cards: um card por obra; capa e ano da versão mais recente; "plataforma(s) · ano" lista todas as plataformas da obra; preço = menor por condição entre todas as versões, com a condição escrita.
* Página do jogo: o seletor de plataforma (o mesmo de hoje) troca capa, ano, ofertas e o ID usado pela IGDB. Página de plataforma/console filtrada: o card mostra a capa e o ano da versão daquele console.
* Mesma plataforma com duas versões (ex.: um jogo de Switch e a sua Nintendo Switch 2 Edition, ambos no Switch 2): exceção em que o chip mostra o sufixo ("Switch 2 Edition") para diferenciar.
* Busca: o nome_completo de cada versão vira apelido de busca. Pesquisar "Twilight Princess HD" leva à obra com Wii U já selecionado.
* Inventário: Tenho/Quero/Alerta continuam marcando a OBRA (como hoje); o contador "X de Y" conta obras. Não mudar a estrutura do inventário neste pacote.
* URLs antigas das versões que viraram obra única redirecionam para a obra com a plataforma selecionada (sem 404).

ENTREGAS

* Desktop 1440x770: página da Nintendo com o novo ladrilho; ladrilho sem capa; Majora's Mask e Twilight Princess (card na lista e página do jogo trocando de plataforma, mostrando a capa mudando); busca por "Twilight Princess HD".
* Arquivo docs/versoes-candidatas.md.
* No resumo: quantos grupos candidatos foram encontrados, contagem do catálogo antes/depois do agrupamento dos dois exemplos, e itens não feitos com o motivo.
