PACOTE 5D — CORREÇÕES (branch Teste-novo-layout)
COMO TRABALHAR

* Base: a branch com o Pacote 5C aplicado. Um commit por item ("pacote5d N: ..."), com print desktop 1440x770 antes/depois. Se o limite apertar, pare no FIM de um item, faça commit/push e liste o que falta.
* Todas as regras fixas dos Pacotes 5, 5B e 5C continuam valendo.

1. FUNDO DINÂMICO NÃO APARECE (todas as páginas) O item 2 do 5C (PageBackdrop: âncora + arte desfocada + película) não está visível: home, plataforma (Nintendo), universo (Zelda) e ofertas (Echoes of Wisdom, Mario Galaxy) continuam com fundo de cor sólida.

* Primeiro DIAGNOSTICAR e explicar no resumo: o PageBackdrop está montado? A camada de arte recebe imagem? Há alguma camada opaca POR CIMA dele (html, body, #app, contêiner da página, wrapper com a cor da paleta, pseudo-elemento ::before/::after)? Teste rápido: com a arte em opacity 1, ela aparece?
* Corrigir: a cor da paleta passa a existir SÓ na camada 1 (âncora) do PageBackdrop. Todo contêiner acima dele fica com background transparente (os cartões --glass-* continuam com o vidro deles).
* Conferir de novo os requisitos do 5C item 2: contraste 4.5:1 nos títulos soltos no pior slide, crossfade de 1200ms acompanhando o hero, reduced-motion fixo no primeiro slide, página do jogo com a arte fixa do jogo a .55.
* Prints: Nintendo (slide claro e slide escuro), Zelda, home, ofertas do Echoes of Wisdom e página do Mario Galaxy.

2. HERO DA PÁGINA DO JOGO SEM ARTE (ex.: Super Mario Galaxy + Super Mario Galaxy 2) O hero da página do jogo aparece como um retângulo escuro vazio. Ele deve usar a MESMA lógica de arte do hero compartilhado: artwork válida; senão a capa ampliada e desfocada; sem capa, o degradê da paleta. Nunca vazio. Se a página do jogo tiver um hero próprio, separado do componente da home/plataforma, fazer ela reaproveitar a mesma função de escolha de arte (não duplicar a lógica) e informar no resumo. Prints: Mario Galaxy (sem artwork), um jogo com artwork e um sem capa.
3. "VER TODOS OS UNIVERSOS" DUPLICADO NA PÁGINA DE PLATAFORMA Na página de plataforma, o rótulo "Universos {plataforma} →" e o ladrilho "Ver todos → N universos" levam ao mesmo lugar. Na plataforma, o rótulo vira só texto ("Universos {plataforma}", sem seta, sem link, sem cursor de link); o ladrilho é o único caminho. Quando a plataforma tiver 6 universos ou menos (sem ladrilho "Ver todos"), o rótulo volta a ser link com seta. Na home não muda nada (lá não existe o ladrilho; o rótulo continua link).
4. PÍLULA BRANCA VAZIA NA OFERTA REAL Na página de ofertas do Super Mario Galaxy + Super Mario Galaxy 2 (Novo · Switch, Shopee, Gamer Hut), aparece uma pílula branca vazia abaixo de "Shopee". Descobrir o que esse elemento deveria mostrar (selo EXEMPLO, logotipo do vendedor, outro selo) e explicar no resumo. Regra: elemento sem conteúdo não é renderizado. Oferta real não tem selo EXEMPLO; oferta de demonstração continua com ele. Conferir os dois casos lado a lado no print.

ENTREGAS

* Desktop 1440x770: os prints pedidos em cada item.
* No resumo: a causa do fundo sólido, se a página do jogo tinha hero próprio e o que era a pílula branca.
