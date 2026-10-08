PACOTE 5C — HERO ANCORADO À DIREITA, FUNDO DINÂMICO, CAIXA DE CONSOLES E LADRILHO "VER TODOS" (branch Teste-novo-layout)

COMO TRABALHAR

* Base: a branch com o Pacote 5B aplicado. Um commit por item ("pacote5c N: ..."), com print desktop 1440x770 antes/depois. Se o limite apertar, pare no FIM de um item, faça commit/push e liste o que falta.
* Todas as regras fixas dos Pacotes 5 e 5B continuam valendo.

1. HERO: JANELA DA ARTE ANCORADA À DIREITA Hoje a janela de var(--hero-art-w) está presa à ESQUERDA do hero: a arte começa na borda esquerda e termina em 70%, sobrando um bloco escuro liso na direita (Mario Kart World na Nintendo, Wolverine na PlayStation). Correto: a janela encosta na borda DIREITA do hero (right: 0; left: auto), ocupando 70% da largura e 100% da altura, com object-fit: cover. O var(--hero-fade) fica na ponta ESQUERDA da janela, fundindo com var(--hero-base), que é onde fica o texto (título, pílula, botão de preço). Nenhum pedaço de fundo liso pode aparecer à direita da arte. Vale para o hero da home e o da plataforma (componente compartilhado). Print: Mario Kart World (Nintendo), Wolverine (PlayStation) e um slide da home.
2. FUNDO DINÂMICO DA PÁGINA (arte desfocada atrás do vidro) Objetivo: hoje o fundo das páginas é uma cor sólida. Ele passa a ter a arte desfocada e ampliada atrás de tudo, no estilo do Apple Music no CarPlay, para os cartões de vidro (--glass-*) parecerem vidro de verdade. Fazer de forma definitiva, junto com o item 1, pensando em todas as páginas abaixo.

2.1 Estrutura (um componente único, PageBackdrop, montado uma vez atrás do conteúdo, position: fixed, inset: 0, z-index abaixo de tudo, pointer-events: none, aria-hidden):

* Camada 1, ÂNCORA: cor sólida que identifica a página e nunca muda enquanto se está nela (a mesma cor de fundo usada hoje): universo = paleta do universo; plataforma = paleta da plataforma; home = fundo greige do tema; página do jogo = paleta do universo do jogo (sem universo: a cor da plataforma principal dele).
* Camada 2, ARTE: a mesma imagem que o hero está mostrando (artwork válida; senão a capa), em versão MINÚSCULA (redimensionar para ~32px de largura num canvas ou usar a menor miniatura que a fonte oferecer) esticada para cobrir a tela (object-fit: cover), com filter: blur(40px) saturate(1.4) e transform: scale(1.2) para esconder as bordas do blur. Não aplicar blur pesado na imagem grande (custo de GPU). Sem requisição nova: reaproveitar o cache do hero.
* Camada 3, PELÍCULA (garante leitura): vinheta escura por cima da arte: linear-gradient de cima para baixo (topo mais escuro, onde ficam o cabeçalho e o hero) somado a um radial-gradient escurecendo as bordas, ambos na cor --hero-base da página. Títulos soltos sobre o fundo (ex.: "Jogos em destaque", "Encontre o próximo da coleção") precisam de contraste mínimo 4.5:1 com o texto branco no pior slide; se não atingir, escurecer a película, nunca adicionar sombra pesada no texto.

2.2 Intensidade por página:

* Home, plataforma e universo: arte com opacity .35 (ajustável por token --backdrop-art: .35). A cor âncora domina; a arte só dá o clima.
* Página do jogo (ofertas): arte FIXA do próprio jogo (sem rotação), com opacity .55 (--backdrop-art-game: .55), mais presente por ser a página dele.

2.3 Acompanhando o hero (home, plataforma e universo):

* Quando o slide do hero muda, a camada 2 troca para a arte do novo slide com crossfade LENTO de 1200ms (duas camadas de imagem alternando opacity; animar só opacity). A camada 1 (âncora) não muda.
* Interação manual com o hero (seta, indicador): o fundo acompanha o slide escolhido.
* prefers-reduced-motion: o fundo fica fixo na arte do PRIMEIRO slide e não acompanha a rotação. Aba oculta: não trocar.
* Trocar de página: crossfade de 400ms entre os fundos (âncora e arte), sem piscar em branco ou preto.

2.4 Vidro:

* Os cartões --glass-* continuam com o mesmo tom; se o backdrop-filter já existir neles, manter; se não, aplicar backdrop-filter: blur(20px) saturate(1.2) com o fundo semitransparente atual. Conferir que o texto dentro dos cartões mantém contraste 4.5:1 sobre o pior fundo.
* Sem backdrop-filter suportado: o fundo do cartão fica mais opaco (fallback via @supports).

2.5 Validar com prints em slides de arte CLARA (ex.: Mario, Pokémon) e ESCURA (ex.: Resident Evil), e informar no resumo o contraste medido nos títulos soltos e o custo (FPS na rotação do hero, sem queda perceptível).

3. CAIXA DE CONSOLES: "CABE OU SAI"

* A caixa tem altura FIXA igual à da linha de cards (do topo das capas até o fim do chip de preço) e nunca cresce além disso. Remover a exceção "cresce se precisar" do Pacote 5.
* Os chips seguem a ordem atual ("Todos" primeiro, depois do console mais novo ao mais antigo). Se não couberem no espaço da caixa (abaixo do cabeçalho com logo e contagem e do rótulo "Console"), remover primeiro os consoles com MENOS jogos, um por vez, mantendo a ordem dos que ficam, até caber. Empate: sai o mais antigo.
* Quando algum console sair, o último chip é "+N →" (N = consoles ocultos), com o mesmo estilo dos chips não selecionados, levando a #/busca?plat={slug}, onde todos os consoles continuam disponíveis no filtro.
* Se o console selecionado pela URL (?console=) estiver entre os ocultos, ele aparece selecionado mesmo assim, e sai outro com menos jogos no lugar dele.
* A PlayStation hoje cabe inteira: deve ficar exatamente como está. Informar no resumo, por plataforma, quais consoles ficaram ocultos.

4. LADRILHO "VER TODOS" SÓLIDO, COM LEQUE DE CAPAS O ladrilho "Ver todos →" está transparente, com borda tracejada, e parece um ladrilho que não carregou. Novo visual, mesma largura e altura dos outros ladrilhos:

* Fundo sólido: linear-gradient(145deg, cor da plataforma (paleta-plataformas.json), tom 45% mais escuro), mesma sombra dos outros ladrilhos, sem borda tracejada.
* No topo, no lugar da capa única, um LEQUE de 3 mini-capas (44x58px, radius 7px, mesma borda e sombra das capas dos ladrilhos) dos 3 universos seguintes da lista (7º, 8º e 9º na mesma ordem dos ladrilhos), saltando acima do ladrilho como as outras capas, giradas -12deg, -2deg e +8deg e levemente sobrepostas. Universo sem capa válida: pular para o próximo. Menos de 3 capas válidas: usar as que houver.
* Texto na base, com o mesmo espaçamento simétrico do 5B: "Ver todos →" 13px/500 e "{N} universos" 11px --text-2.
* Hover (só mouse): o leque abre levemente (as capas laterais giram 4deg a mais para fora e sobem 4px), 200ms com a mola. reduced-motion desliga.
* aria-label: "Ver todos os {N} universos {plataforma}".

5. CONFERIR A CONTAGEM DE UNIVERSOS "115 universos" (Nintendo) e "203 universos" (PlayStation) parecem altos demais. Verificar como o número é calculado: se jogos avulsos (sem franquia) estão contando cada um como universo, contar só universos de verdade (os que existem em paleta-universos.json / no diretório de universos, com pelo menos 1 jogo na plataforma). O número do ladrilho "Ver todos" tem que bater com a quantidade de ladrilhos que o diretório mostra em #/universos?plat={slug}. Informar no resumo como era e como ficou.

ENTREGAS

* Desktop 1440x770: fundo dinâmico na home, numa página de universo (Zelda: dois slides, um claro e um escuro, e o meio de um crossfade), numa página de plataforma e na página de ofertas de um jogo; Nintendo e PlayStation (topo inteiro: hero, ladrilhos, destaques e caixa), Nintendo com um console oculto selecionado pela URL, hover do ladrilho "Ver todos" e um slide da home.
* Mobile 393x852: uma página de plataforma.
* No resumo: contraste dos títulos soltos no pior slide, impacto de desempenho do fundo, consoles ocultos por plataforma, contagem de universos antes/depois e itens não feitos com o motivo.
