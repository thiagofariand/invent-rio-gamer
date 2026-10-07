PACOTE 5B — AJUSTES DA HOME E DA PÁGINA DE PLATAFORMA (branch Teste-novo-layout)

COMO TRABALHAR
- Base: a branch com o Pacote 5 aplicado. Um commit por item ("pacote5b N: ..."), com print desktop 1440x770 antes/depois. Se o limite apertar, pare no FIM de um item, faça commit/push e liste o que falta.
- Todas as regras fixas do Pacote 5 continuam valendo (preço com condição, selo EXEMPLO, regra de jogo não lançado, nada de link direto para loja, só animar transform/opacity/border-radius/background-color, reduced-motion).
- A referência visual da página de plataforma é a maquete azul aprovada: hero, ladrilhos sobrepostos, "Jogos em destaque" com cinco cards + uma capa espiando, caixa de consoles à direita alinhada ao topo das capas, cards compactos de Merch e Fan-made aparecendo na borda da primeira tela.
- Os itens 1 a 4 mexem em componentes compartilhados: corrigir uma vez e conferir na home E na página de plataforma.

1. HERO: A ARTE PREENCHE A JANELA
Hoje sobra um bloco escuro chapado no lado direito do hero (visto no Spider-Man 2 da home e no Zelda: Ocarina of Time da Nintendo). A imagem deve ocupar 100% da largura e 100% da altura da janela de var(--hero-art-w), com object-fit: cover, encostando na borda direita e nos cantos arredondados (overflow hidden no hero). O único degradê é o var(--hero-fade) na esquerda. Se a imagem disponível não cobrir a janela sem ficar pixelada (largura natural < 1280 ou proporção < 1.6), usar o fallback da capa desfocada já definido, nunca deixar fundo liso aparecendo. Print: os dois slides citados, com a borda direita preenchida.

2. HERO: TÍTULO E SOBRANCELHA (PÍLULAS)
- Título: nunca reticências no hero. 34px até 28 caracteres; 26px de 29 a 36; 22px acima de 36. No hero, exibir o título sem o complemento entre parênteses do final (ex.: "(2026)", "(Switch 2)"); o título completo continua na página do jogo e no aria-label.
- Pílulas: no máximo UMA pílula de estado, e coerente com o botão. Se o botão é "Pré-venda a partir de…", a pílula é "PRÉ-VENDA · dd/mm/aaaa"; "EM BREVE" só quando não há oferta de pré-venda. Nunca as duas juntas.
- Página de plataforma: remover a pílula "Só em console {console}" (fica só a pílula de estado, se houver). Na home, "Só em console" continua, junto com a pílula do tipo do slide (EM ALTA / UNIVERSO), no máximo duas pílulas no total.

3. LADRILHOS: CAPA SEM ENCOSTAR NO NOME
- Hoje a capa saltando invade o nome do universo. Novo valor: --tile-pop: 44px (capa 60x80 continua). Assim a base da capa fica 36px abaixo do topo do ladrilho.
- NOMES LONGOS QUEBRAM EM ATÉ DUAS LINHAS: o nome do universo (13px/500, line-height 16px) pode ocupar 1 ou 2 linhas, quebrando só entre palavras (sem hífen, text-wrap: balance). Mais de 2 linhas: corta a 2ª com reticências (nome completo no aria-label). Listar no resumo os nomes que quebraram e os que ainda ficaram com reticências.
- Altura dos ladrilhos: TODOS os ladrilhos têm a mesma altura (a fileira fica alinhada), calculada para caber o caso de 2 linhas. Novo valor: --tile-h: 112px, e --tile-overlap: 108px (o topo sobe 20px e a BASE da fileira continua no mesmo lugar sobre o hero).
- Espaçamento vertical SIMÉTRICO dentro do ladrilho (todos os ladrilhos, todas as páginas): o bloco de texto (nome + 2px + "N jogos" 11px) fica CENTRALIZADO verticalmente no espaço entre o ponto mais baixo da capa e a borda inferior do ladrilho. Assim o espaço acima do nome é sempre igual ao espaço abaixo de "N jogos": com nome de 2 linhas, 12px em cima e 12px embaixo (o mínimo); com nome de 1 linha, os dois espaços ficam maiores e iguais entre si. Nunca menos de 12px.
- ATENÇÃO: a capa está girada (-6deg), então a base dela é uma DIAGONAL e o canto mais baixo desce cerca de 3px abaixo da base sem rotação. Medir sempre a partir do PONTO MAIS BAIXO da capa já girada (getBoundingClientRect da capa, que inclui a rotação), nunca da caixa sem rotação. Se o caso de 2 linhas não couber com 12px + 12px, aumentar --tile-h e --tile-overlap na mesma medida, nunca reduzir os espaços. Informar no resumo os espaços reais (1 linha e 2 linhas). No ladrilho de Zelda (capa de Ocarina of Time) o nome hoje quase encosta na capa: conferir esse caso no print.
- Rótulo da fileira ("Universos populares →" / "Universos {plataforma} →"): a BASE do rótulo fica 12px acima do topo da capa mais alta da fileira (topo do ladrilho - 44px - 12px). Hoje ele está em cima das capas na home e na plataforma. Nenhuma capa pode tocar o rótulo nem o botão de preço do hero; se tocar, avisar no resumo com as medidas.

4. CARROSSEL DE CARDS: CINCO + UMA ESPIANDO, META EM UMA LINHA
- Em 784px de coluna: 5 cards inteiros + parte da capa do 6º. Seta direita na lateral sobre o degradê; a seta esquerda só aparece depois que se avança.
- Linha "plataforma(s) · ano" em UMA linha com reticências (o texto completo no title). Hoje "PS5 · Xbox Series X|S · 2026" quebra em duas e empurra o preço para fora da tela.
- Altura do card fixa: capa + título (1 linha) + meta (1 linha) + chip. Informar no resumo a altura real.

5. LADRILHOS MAIS ESTREITOS E "VER TODOS OS UNIVERSOS" NA PONTA DA FILEIRA
- Hoje os ladrilhos esticam para ocupar a largura toda e ficam largos demais em relação à capa inclinada (sobra muito fundo colorido dos dois lados da capa). Novo token: --tile-w: 140px. Os ladrilhos têm largura FIXA var(--tile-w) e NÃO esticam (nada de flex: 1 / 1fr); a fileira é alinhada à esquerda, com gap 14px. Nome com padding lateral de 8px, quebrando em até 2 linhas como no item 3.
- Página de plataforma: remover a faixa de largura total "Ver todos os universos" que aparece abaixo dos ladrilhos. Com a largura fixa, cabem na MESMA fileira até 6 universos + o ladrilho "Ver todos →" no fim (7 x 140 + 6 x 14 = 1064px em 1100px). O ladrilho "Ver todos →" só aparece quando a plataforma tem mais de 6 universos; tem a mesma largura e altura dos outros, sem capa, fundo neutro --glass-2 com borda 1px --glass-border, "Ver todos →" 13px/500 e "{N} universos" 11px --text-2, centralizados, levando a #/universos?plat={slug}. (Isso substitui o item 3.2 do Pacote 5.)
- Home (coluna de 784px): 5 ladrilhos de 140px (756px), sem ladrilho "Ver todos" (o rótulo "Universos populares →" já cumpre esse papel).
- Diretório de universos: mesma largura fixa, grade com auto-fill de colunas de var(--tile-w) e gap 14px (quantos couberem por linha), mantendo o espaço de --tile-pop acima de cada fileira.
- Mobile: mantém os 120px por ladrilho na fileira com rolagem horizontal; o "Ver todos" da plataforma entra como último ladrilho da fileira.

6. PÁGINA DE PLATAFORMA: ENCAIXE DA PRIMEIRA TELA
Posições a partir do topo do conteúdo (mesmo esquema da home):
- hero 0-340 (ladrilhos sobrepostos, itens 1 a 3 e 5);
- título "Jogos em destaque" (32px/500) logo abaixo dos ladrilhos, com o botão em pílula "Ver todos ({N}) →" IMEDIATAMENTE à direita do título (não no canto da página);
- linha de cards (item 4) na coluna de 784px; caixa de consoles na coluna de 300px, começando no topo das CAPAS e terminando junto com o fim do chip de preço (mesma altura da linha; cresce só se os chips de console não couberem);
- cards compactos de Merch e Fan-made logo abaixo, com gap 14px.
Critério em 1440x770: o topo dos cards compactos fica visível na primeira tela (<= 750px de viewport), convidando a rolar. Se não couber, reduzir o hero DESTA página para 320px (e só ele) e informar no resumo. Informar as alturas reais de cada bloco.

7. HOME: BARRA DE ABAS E DOBRA
- A barra de abas (Em alta | Mais novos | Menor preço | Pré-venda) está mostrando uma barra de rolagem vertical à direita. Remover (overflow-y: hidden; a rolagem horizontal só no mobile, sem barra visível).
- Com o item 4 aplicado, conferir o critério do Pacote 5: tudo da coluna principal visível sem rolar em 1440x770 (chip de preço dos cards inteiro, último pixel <= 760px de viewport). Informar a altura real.

ENTREGAS
- Desktop 1440x770: home (topo, com slide Spider-Man 2 e slide de pré-venda), páginas da Nintendo, PlayStation e Xbox (sem console e com um console selecionado), ladrilhos com hover.
- Mobile 393x852: home e uma página de plataforma.
- No resumo: alturas reais dos blocos (home e plataforma), se o hero da plataforma precisou ir para 320px, e itens não feitos com o motivo.
