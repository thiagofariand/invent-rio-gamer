# Versões candidatas — varredura do catálogo (pacote5e, item 3.2)

> Gerada automaticamente (script de varredura, não salvo no repo — rodou sobre `catalog-data.js`
> procurando sufixos de versão: HD, 3D, Remastered, Remaster, Deluxe, Definitive/Complete/Ultimate/
> Enhanced/Anniversary Edition, Nintendo Switch 2 Edition, Director's Cut, Royal, Golden, GOTY, e
> variações de pontuação). **Não alterei o catálogo com base nisto** — só os dois exemplos já
> confirmados pelo dono (Majora's Mask, Twilight Princess) entraram em `src/data/versoes.json`,
> para validar a interface. O resto da tabela abaixo espera revisão.

**8 grupos candidatos encontrados.** Resumo por sugestão:

| Sugestão | Grupos |
|---|---|
| Versão da mesma obra (candidato real) | 1 |
| Remake separado (convenção já em uso — "(ano)" no título) | 4 |
| Não é a mesma obra (falso positivo da varredura) | 3 |

## 1. Marvel's Spider-Man — candidato real

| Entrada | Plataformas | Ano | Slug atual |
|---|---|---|---|
| Marvel's Spider-Man | PS4 | 2018 | `marvels-spider-man` |
| Marvel's Spider-Man Remastered | PS5 | 2020 | `marvels-spider-man-remastered` |

**Sugestão: versão da mesma obra.** Mesmo jogo, remasterizado pra PS5 (não é um remake do zero) —
exatamente o padrão do pacote (Majora's Mask/Twilight Princess). Hoje são 2 entradas separadas no
catálogo, cada uma virando um card diferente na busca/diretório. Juntar em `marvels-spider-man`
(obra) + 2 versões em `versoes.json` (original PS4/2018, remastered PS5/2020) — aguardando
confirmação do dono antes de aplicar.

## 2–5. Remakes já tratados pela convenção "(ano)" — não precisam de versoes.json

| Entrada | Plataformas | Ano | Slug atual |
|---|---|---|---|
| The Legend of Zelda: Ocarina of Time | Nintendo 64, 3DS | 1998 | `ocarina-of-time` |
| The Legend of Zelda: Ocarina of Time (2026) | Switch 2 | 2026 | `ocarina-of-time-remake` |

| Entrada | Plataformas | Ano | Slug atual |
|---|---|---|---|
| Resident Evil 4 | PS2, GameCube, Wii, PS4 | 2005 | `resident-evil-4` |
| Resident Evil 4 (2023) | PS4, PS5 | 2023 | `resident-evil-4-remake` |

| Entrada | Plataformas | Ano | Slug atual |
|---|---|---|---|
| Resident Evil 2 | PS1 | 1998 | `resident-evil-2` |
| Resident Evil 2 (2019) | PS4, PS5 | 2019 | `resident-evil-2-remake` |

| Entrada | Plataformas | Ano | Slug atual |
|---|---|---|---|
| Resident Evil 3 (2020) | PS4, PS5 | 2020 | `resident-evil-3-remake` |

**Sugestão: remake separado**, não versão. São jogos refeitos do zero, não um porte/remaster da
mesma build — exatamente o caso que a regra 3.1 do pacote pede pra NÃO entrar como versão
(`remake_de` apontando pra obra original). O catálogo já segue essa convenção pro nome ("(ano)" +
slug `-remake`); falta só o campo `remake_de` explícito ligando as duas entradas (não existe hoje —
fora do escopo deste pacote, é mudança de schema do catálogo principal, não de `versoes.json`).

## 6–8. Falsos positivos da varredura (não é a mesma obra)

| Entrada | Plataformas | Ano | Slug atual | Por quê não é versão |
|---|---|---|---|---|
| Mario Kart 8 Deluxe | Switch | 2017 | `mario-kart-8-deluxe` | Única entrada do grupo — "Mario Kart 8" sem Deluxe não existe no catálogo; "Deluxe" aqui é parte do nome oficial do único release, não um sufixo de versão sobre uma obra-base já catalogada. |
| Super Mario 3D World + Bowser's Fury | Switch | 2021 | `super-mario-3d-world-bowsers-fury` | A varredura confundiu o "3D" de "3D World" (parte do nome do jogo, não um sufixo de versão) com o sufixo de versão "3D" (tipo Majora's Mask 3D) e cortou errado, virando "Super Mario World + Bowser's Fury". Não existe essa obra separada no catálogo. |
| Super Mario 3D All-Stars | Switch | 2020 | `super-mario-3d-all-stars` | Mesmo problema: "3D" é parte do nome ("All-Stars" é uma coletânea com jogos 3D), não sufixo de versão. |

## Observações pra próxima varredura

- Os 3 falsos positivos acima mostram que o filtro de "3D" como sufixo de versão colide com
  títulos onde "3D" é parte do nome oficial do jogo (não só Mario: "Street Fighter 3D" seria outro
  caso hipotético). Uma varredura futura deveria exigir que o "3D" apareça **no fim** do título
  (como em "Majora's Mask 3D") e não em qualquer posição, pra não cortar nomes como "3D World"/"3D
  All-Stars" no meio.
- A varredura rodou só sobre `collections` (título + plataformas + ano, a fonte mais confiável pro
  ano). Não cruzei com `catalogo-atualizado.js` (backlog item 1, 559 títulos do GPT, ainda não
  triado) — pode ter mais candidatos lá; fica pro dia da triagem completa.
